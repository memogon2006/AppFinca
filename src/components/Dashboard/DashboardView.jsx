import React, { useMemo } from 'react';
import { 
  Users, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  Zap,
  Activity,
  Layers,
  Baby,
  Milk,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  PieChart as PieIcon,
  BarChart3,
  PackagePlus,
  MessageCircle,
  FileText,
  Syringe,
  ClipboardCheck,
  Stethoscope,
  TrendingDown,
  Wallet,
  Handshake,
  Tag,
  Radio,
  Building2,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { AlertsList } from './AlertsList';
import { VaccinationCalendar } from './VaccinationCalendar';
import { FarmCalendarWidget } from '../Calendar/FarmCalendarWidget';
import { ChecklistAuditWidget } from './ChecklistAuditWidget';
import { RainfallWidget } from './RainfallWidget';
import { ProductionTypeChart } from './ProductionTypeChart';
import { WeightPerformanceChart } from './WeightPerformanceChart';
import { formatCurrency, formatNumber, calculateWeightMetrics, calculateFinancials, calculateSaleCashFlow, getSafeDateString, getLocalDateString, getDaysDifference, parseAuditTimestamp } from '../../services/calculations';
import { useFarmPrices, setFarmMeatPrice } from '../../services/farmPriceService';
import { 
  AUCTION_HOUSES, 
  getAuctionPricesData, 
  getDefaultAuctionId, 
  setDefaultAuctionId, 
  calculateHerdValuation, 
  generateAuctionWhatsAppReport 
} from '../../services/auctionPriceService';
import { useAuth } from '../../context/AuthContext';
import { useActiveModules, MODULE_KEYS } from '../../services/moduleService';

export function DashboardView({ 
  cattle = [], 
  weighings = [], 
  vaccinations = [],
  audits = [],
  calendarNotes = [],
  rainfall = [],
  farmExpenses = [],
  farmIncomes = [],
  milkRecords = [],
  milkDeliveries = [],
  milkSettlements = [],
  onNavigate, 
  onSelectAnimal, 
  onOpenNewAnimal,
  onOpenNewRain,
  onOpenBatchEntry,
  onOpenExportImport,
  onOpenWhatsAppReport,
  onOpenChecklist,
  onOpenGlossary,
  onOpenCalendar,
  onOpenVaccinationModal,
  onOpenCensusModal,
  onDeleteVaccination,
  onCompleteBooster,
  onOpenPartnershipModal,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenCalving,
  onOpenBranding,
  onOpenMarketModal
}) {
  const { isWorker, currentUser } = useAuth();
  const { isModuleActive } = useActiveModules();
  const { meatPricePerKg } = useFarmPrices(currentUser);
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  const soldCattle = cattle.filter(c => c.status === 'Vendido');

  // Crías con número temporal o pendientes de marcación y chapeteo oficial
  const pendingBrandingCattle = useMemo(() => {
    return activeCattle.filter(c => {
      const isTemp = c.isTemporaryTag === true || 
        (typeof c.tagNumber === 'string' && (
          c.tagNumber.toUpperCase().startsWith('TEMP') ||
          c.tagNumber.toUpperCase().startsWith('CRIA') ||
          c.tagNumber.toUpperCase().startsWith('T-') ||
          c.tagNumber.toUpperCase().startsWith('PROV')
        ));
      if (isTemp) return true;
      if (c.entryType === 'Nacimiento' && (!c.ironBrand || c.ironBrand.trim() === '' || c.ironBrand === 'Sin marca')) {
        const birth = c.birthDate || c.entryDate;
        if (birth) {
          const days = getDaysDifference(birth, new Date());
          return days >= 90;
        }
      }
      return false;
    });
  }, [activeCattle]);

  // Unificación de Ingresos: farmIncomes + liquidaciones de leche
  const effectiveIncomes = useMemo(() => {
    const list = [...(farmIncomes || [])];
    const existingSettlementIds = new Set();
    list.forEach(i => {
      if (i.settlementId) {
        existingSettlementIds.add(String(i.settlementId));
        existingSettlementIds.add(i.settlementId);
      }
      if (typeof i.id === 'string' && i.id.startsWith('inc_milk_')) {
        const raw = i.id.replace('inc_milk_', '');
        existingSettlementIds.add(raw);
        existingSettlementIds.add(String(raw));
      }
    });

    (milkSettlements || []).forEach(st => {
      if (st.registerIncome !== false && st.totalValue > 0 && !existingSettlementIds.has(st.id) && !existingSettlementIds.has(String(st.id))) {
        list.push({
          id: 'inc_milk_' + st.id,
          date: st.paymentDate || st.endDate || getSafeDateString(st.date, st.createdAt),
          amount: parseFloat(st.totalValue) || 0,
          category: 'leche',
          isMilkSettlement: true
        });
      }
    });

    return list;
  }, [farmIncomes, milkSettlements]);

  // Métricas de lechería en el día de hoy
  const todayStr = getLocalDateString(new Date());
  const todayMilkRecords = milkRecords.filter(m => m.date === todayStr);
  const todayMilkLiters = todayMilkRecords.reduce((sum, r) => sum + (parseFloat(r.totalLiters) || (parseFloat(r.amLiters) || 0) + (parseFloat(r.pmLiters) || 0)), 0);

  // Conteo de sexos
  const malesCount = activeCattle.filter(c => c.sex === 'Macho').length;
  const femalesCount = activeCattle.filter(c => c.sex === 'Hembra').length;

  // Hembras preñadas y en leche
  const pregnantCount = activeCattle.filter(c => c.sex === 'Hembra' && (c.femaleStatus === 'Gestación' || c.reproductiveStatus === 'Preñada')).length;
  const milkingCount = activeCattle.filter(c => c.sex === 'Hembra' && (c.femaleStatus === 'Producción de leche' || c.milkingStatus === 'En ordeño')).length;
  const breedingOnlyCount = activeCattle.filter(c => c.sex === 'Hembra' && c.isBreedingOnly).length;

  // Ceba
  const fatteningCount = activeCattle.filter(c => c.productionType === 'Ceba').length;

  // Cálculos financieros y de biomasa
  let totalInvestedActive = 0;
  let totalCurrentWeight = 0;

  activeCattle.forEach(animal => {
    const fin = calculateFinancials(animal, 0, meatPricePerKg);
    totalInvestedActive += fin.totalInvested;

    const animalWeighings = weighings.filter(w => String(w.cattleId) === String(animal.id));
    const metrics = calculateWeightMetrics(animal, animalWeighings);
    totalCurrentWeight += metrics.currentWeight;
  });

  let totalUserCashInflow = 0;
  let totalCapitalRecovered = 0;
  let totalRealizedProfit = 0;
  let totalGrossCattleSales = 0;

  soldCattle.forEach(animal => {
    const flow = calculateSaleCashFlow(animal, currentUser);
    totalRealizedProfit += flow.netProfit;
    totalUserCashInflow += flow.cashInflow;
    totalCapitalRecovered += flow.capitalReturn;
    totalGrossCattleSales += (parseFloat(animal.exitPrice) || 0);
  });

  // Cálculos Financieros Integrales de la Finca (Contabilidad + Ventas + Lechería)
  const totalFarmExpenses = farmExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalOtherIncomes = effectiveIncomes.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  // El ingreso por ganado a la caja es el flujo real que entra al bolsillo del usuario (descontando la parte del socio)
  const totalCattleSalesRevenue = totalUserCashInflow;
  const totalGrossIncome = totalCattleSalesRevenue + totalOtherIncomes;
  const realNetProfit = totalRealizedProfit + totalOtherIncomes - totalFarmExpenses;

  // Gastos e Ingresos del Mes Actual
  const currentMonthPrefix = getLocalDateString(new Date()).slice(0, 7);
  const currentMonthExpenses = farmExpenses
    .filter(e => getSafeDateString(e.date, e.createdAt).startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const currentMonthIncomes = effectiveIncomes
    .filter(i => getSafeDateString(i.date, i.createdAt).startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  
  let currentMonthCattleSalesGross = 0;
  let currentMonthUserCashInflow = 0;
  let currentMonthCapitalRecovered = 0;
  let currentMonthCattleProfit = 0;

  soldCattle
    .filter(c => (c.exitDate || c.updatedAt || '').startsWith(currentMonthPrefix))
    .forEach(c => {
      const flow = calculateSaleCashFlow(c, currentUser);
      currentMonthCattleSalesGross += (parseFloat(c.exitPrice) || 0);
      currentMonthUserCashInflow += flow.cashInflow;
      currentMonthCapitalRecovered += flow.capitalReturn;
      currentMonthCattleProfit += flow.netProfit;
    });

  const currentMonthNetProfit = currentMonthCattleProfit + currentMonthIncomes - currentMonthExpenses;
  const currentMonthGrossIncome = currentMonthUserCashInflow + currentMonthIncomes;

  // Cobertura de Gastos del Mes
  const expenseCoveragePct = currentMonthExpenses > 0 
    ? Math.round(((currentMonthCattleProfit + currentMonthIncomes) / currentMonthExpenses) * 100)
    : (currentMonthCattleProfit + currentMonthIncomes > 0 ? 100 : 0);

  // Kilos ganados y costo unitario
  let totalKilosGained = 0;
  activeCattle.forEach(animal => {
    const animalWeighings = weighings.filter(w => String(w.cattleId) === String(animal.id));
    const metrics = calculateWeightMetrics(animal, animalWeighings);
    if (metrics.weightGain > 0) totalKilosGained += metrics.weightGain;
  });
  const costPerKilo = totalKilosGained > 0 ? (totalFarmExpenses / totalKilosGained) : 0;
  const dailyCostPerHead = activeCattle.length > 0 && currentMonthExpenses > 0
    ? currentMonthExpenses / (activeCattle.length * 30)
    : (activeCattle.length > 0 && totalFarmExpenses > 0 ? totalFarmExpenses / (activeCattle.length * 30) : 0);

  // Ganancia diaria de peso (GDP) promedio del hato
  let totalGdpSum = 0;
  let gdpValidAnimals = 0;
  activeCattle.forEach(animal => {
    const animalWeighings = weighings.filter(w => String(w.cattleId) === String(animal.id));
    const metrics = calculateWeightMetrics(animal, animalWeighings);
    if (metrics.overallGdp > 0) {
      totalGdpSum += metrics.overallGdp;
      gdpValidAnimals++;
    }
  });
  const avgGdp = gdpValidAnimals > 0 ? (totalGdpSum / gdpValidAnimals) : 0;

  // Escuchar eventos de actualización de arqueos / checklist en tiempo real
  const [auditTick, setAuditTick] = React.useState(0);

  React.useEffect(() => {
    const handleAuditUpdate = () => {
      setAuditTick(t => t + 1);
    };
    window.addEventListener('ganado_audit_updated', handleAuditUpdate);
    window.addEventListener('storage', handleAuditUpdate);
    return () => {
      window.removeEventListener('ganado_audit_updated', handleAuditUpdate);
      window.removeEventListener('storage', handleAuditUpdate);
    };
  }, []);

  // Obtener el arqueo / checklist más reciente de forma 100% robusta
  const latestAudit = React.useMemo(() => {
    const allCandidates = [];

    // 1. Recoger todos los arqueos de Dexie (audits prop)
    if (Array.isArray(audits) && audits.length > 0) {
      allCandidates.push(...audits);
    }

    // 2. Recoger arqueos de localStorage (por si Dexie no los indexó o está en fallback offline)
    try {
      const activeRaw = localStorage.getItem('ganado_latest_audit_active');
      if (activeRaw) {
        try { allCandidates.push(JSON.parse(activeRaw)); } catch (e) {}
      }

      const keys = Object.keys(localStorage).filter(k => k.startsWith('ganado_latest_audit_'));
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) allCandidates.push(JSON.parse(raw));
        } catch (e) {}
      }
    } catch (e) {}

    // Filtrar elementos válidos con datos
    const valid = allCandidates.filter(a => a && (a.totalExpected > 0 || a.date || a.createdAt));
    if (valid.length === 0) return null;

    // Ordenar de más reciente a más antiguo por timestamp infalible y fallback a ID
    valid.sort((a, b) => {
      const tB = parseAuditTimestamp(b);
      const tA = parseAuditTimestamp(a);
      const diff = tB - tA;
      if (diff !== 0 && !isNaN(diff)) return diff;
      return (b.id || 0) - (a.id || 0);
    });

    return valid[0];
  }, [audits, auditTick]);

  // Monitoreo de Precios de Subastas Ganaderas y Valuación Comercial del Hato
  const [selectedAuctionId, setSelectedAuctionId] = React.useState(() => getDefaultAuctionId());
  const [adoptedPriceAlert, setAdoptedPriceAlert] = React.useState(null);

  // Escuchar actualizaciones de precios de subasta en tiempo real
  React.useEffect(() => {
    const handleAuctionPriceChange = () => {
      setAuditTick(t => t + 1);
    };
    window.addEventListener('auction_prices_updated', handleAuctionPriceChange);
    return () => window.removeEventListener('auction_prices_updated', handleAuctionPriceChange);
  }, []);

  const allAuctionsData = React.useMemo(() => getAuctionPricesData(), [auditTick]);
  const currentAuctionData = allAuctionsData[selectedAuctionId] || allAuctionsData.sugaberrio;

  const herdValuation = React.useMemo(() => {
    return calculateHerdValuation(activeCattle, weighings, selectedAuctionId);
  }, [activeCattle, weighings, selectedAuctionId, auditTick]);

  const handleAdoptPrice = (price, catName) => {
    setFarmMeatPrice(currentUser, price);
    setAdoptedPriceAlert(`✅ ¡Precio adoptado con éxito! Ahora tu finca calcula proyecciones e inventario a $${price.toLocaleString('es-CO')}/kg (${catName}).`);
    setTimeout(() => setAdoptedPriceAlert(null), 4500);
  };

  const handleShareAuctionWhatsApp = () => {
    const text = generateAuctionWhatsAppReport(selectedAuctionId, herdValuation, currentUser?.farmName || 'Mi Finca Ganadera');
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gestión de Finca Ganadera</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isWorker ? 'Control de Inventario, Pesos & Manejo de Campo' : 'Control de Inventario, Pesos & Rentabilidad'}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              {isWorker 
                ? 'Monitorea en tiempo real inventarios, ganancias de peso (GDP), estado de preñez, pesajes y tareas de campo.'
                : 'Monitorea en tiempo real inventarios, ganancias de peso (GDP), estado de preñez, litros de leche y la rentabilidad neta de tus lotes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenCensusModal && (
              <button
                onClick={onOpenCensusModal}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-400/30 transition backdrop-blur-sm cursor-pointer shadow-sm"
                title="Ver y exportar censo poblacional oficial ICA / FEDEGAN"
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>📄 Censo ICA / RUV</span>
              </button>
            )}

            {onOpenVaccinationModal && (
              <button
                onClick={onOpenVaccinationModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition cursor-pointer"
                title="Registrar vacunación o plan sanitario oficial"
              >
                <Syringe className="w-4 h-4 text-emerald-200" />
                <span>+ Registrar Vacunación</span>
              </button>
            )}

            {onOpenCalving && (
              <button
                onClick={() => onOpenCalving(null)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-pink-950/40 border border-pink-400/40 transition cursor-pointer active:scale-95"
                title="Registrar nuevo nacimiento / parto y programar destete automático"
              >
                <Baby className="w-4 h-4 text-pink-200" />
                <span>🍼 Registrar Parto</span>
              </button>
            )}

            {!isWorker && isModuleActive(MODULE_KEYS.PARTNERSHIPS) && onOpenPartnershipModal && (
              <button
                onClick={onOpenPartnershipModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 border border-amber-300 transition cursor-pointer active:scale-95"
                title="Liquidación de ganado por lote o individual (venta directa o en compañía con reparto de utilidades)"
              >
                <Handshake className="w-4 h-4 text-slate-950" />
                <span>🤝 Liquidación</span>
              </button>
            )}

            {!isWorker && onOpenAddIncome && (
              <button
                onClick={onOpenAddIncome}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-300 transition cursor-pointer active:scale-95"
                title="Registrar nuevo ingreso de la finca (leche, queso, arriendo, servicios, etc.)"
              >
                <TrendingUp className="w-4 h-4 text-slate-950" />
                <span>💵 Registro Ingreso</span>
              </button>
            )}

            {!isWorker && onOpenAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 border border-rose-300/40 transition cursor-pointer active:scale-95"
                title="Registrar gasto de la finca (nómina, concentrado, sal, sanidad, fletes, etc.)"
              >
                <TrendingDown className="w-4 h-4 text-white" />
                <span>💸 Registro Gasto</span>
              </button>
            )}

            {onOpenGlossary && (
              <button
                onClick={onOpenGlossary}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-400/30 transition backdrop-blur-sm cursor-pointer"
                title="Ver significado de GDP, ROI, Biomasa y Fórmulas"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>💡 Guía de Métricas</span>
              </button>
            )}

            {onOpenChecklist && (
              <button
                onClick={onOpenChecklist}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-950/40 border border-amber-300 transition cursor-pointer"
                title="Arqueo y Censo Físico de Campo (Checklist en Manga / Corral)"
              >
                <ClipboardCheck className="w-4 h-4 text-slate-950" />
                <span>📋 Arqueo / Checklist</span>
              </button>
            )}

            {onOpenMarketModal && (
              <button
                onClick={onOpenMarketModal}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-950/40 border border-amber-300 transition cursor-pointer active:scale-95"
                title="Ver precios de subastas ganaderas en Colombia y valuar hato comercial en vivo"
              >
                <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>📡 Subastas & Valuador</span>
              </button>
            )}

            {onOpenWhatsAppReport && (
              <button
                onClick={onOpenWhatsAppReport}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-emerald-400/40 transition backdrop-blur-sm cursor-pointer shadow-sm"
                title="Generar y Enviar Reporte por WhatsApp con filtro por Dueño/Marca"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>📲 Reporte WhatsApp</span>
              </button>
            )}
            
            {isModuleActive(MODULE_KEYS.REPRODUCTION) && (
              <button
                onClick={() => onNavigate('palpation')}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 border border-purple-400/40 transition cursor-pointer"
                title="Iniciar jornada de palpación y diagnóstico reproductivo de hembras en corral"
              >
                <Stethoscope className="w-4 h-4 text-purple-200" />
                <span>🩺 Palpación Rápida</span>
              </button>
            )}

            {isModuleActive(MODULE_KEYS.MILK) && (
              <button
                onClick={() => onNavigate('dairy')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-950/40 border border-blue-400/40 transition cursor-pointer"
                title="Abrir planilla de pesajes AM/PM, curvas DEL y entregas a tanque"
              >
                <Milk className="w-4 h-4 text-blue-200" />
                <span>🥛 Lechería & Ordeño</span>
              </button>
            )}

            {isModuleActive(MODULE_KEYS.WEIGHTS) && (
              <button
                onClick={() => onNavigate('quickWeigh')}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition backdrop-blur-sm cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>⚡ Báscula Rápida</span>
              </button>
            )}
            
            {isModuleActive(MODULE_KEYS.CEBA_BATCHES) && onOpenBatchEntry && (
              <button
                onClick={onOpenBatchEntry}
                className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
                title="Registrar un lote completo con cálculo por kilo o precio fijo"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Ingresar Lote</span>
              </button>
            )}
            <button
              onClick={onOpenNewAnimal}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Individual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta Destacada: Crías con Número Temporal / Pendientes de Marcación y Chapeteo Oficial */}
      {pendingBrandingCattle.length > 0 && (
        <div 
          onClick={() => onOpenBranding && onOpenBranding(pendingBrandingCattle[0])}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 border-2 border-amber-400 dark:border-amber-500/70 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/25 transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-tight">
                  {pendingBrandingCattle.length === 1 
                    ? `🏷️ Toca Marcar y Chapetear: Cría #${pendingBrandingCattle[0].tagNumber}`
                    : `🏷️ ${pendingBrandingCattle.length} Crías con Número Temporal por Marcar y Chapetear`}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                  Marcación Pendiente
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium truncate">
                {pendingBrandingCattle.length === 1
                  ? `Cría nacida en finca con número provisional. Haz tap aquí para asignarle su consecutivo oficial y hierro de fuego.`
                  : `Tienen número provisional. Haz tap para asignarle a #${pendingBrandingCattle[0].tagNumber} su consecutivo oficial y marca de la finca.`}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenBranding) onOpenBranding(pendingBrandingCattle[0]);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shrink-0 flex items-center justify-center gap-2 shadow-md shadow-amber-950/20 transition cursor-pointer self-end sm:self-auto min-h-[40px]"
          >
            <span>🏷️ Marcar Bovino</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPIs Clave Principales: 1. Cantidad -> 2. Rendimientos (Biomasa & GDP) -> 3. Valores (Inversión & Utilidad) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${!isWorker ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'} gap-3.5 sm:gap-4`}>
        
        {/* 1. Cantidad / Inventario Físico */}
        <KpiCard
          title="Total Bovinos Activos"
          value={activeCattle.length}
          subtitle={`${malesCount} machos • ${femalesCount} hembras`}
          icon={Users}
          color="emerald"
          onClick={() => onNavigate && onNavigate('cattle')}
          tooltip="Ver inventario de bovinos activos"
        />

        {/* 2. Rendimiento en Báscula: Biomasa */}
        <KpiCard
          title="Biomasa Total"
          value={`${formatNumber(totalCurrentWeight, 0)} kg`}
          subtitle={activeCattle.length > 0 ? `Prom: ${formatNumber(totalCurrentWeight / activeCattle.length, 1)} kg/cab` : 'Sin inventario'}
          icon={Scale}
          color="teal"
          onClick={() => onNavigate && onNavigate('weights')}
          tooltip="Ver pesajes e historial de báscula"
        />

        {/* 3. Rendimiento en Báscula: GDP */}
        <KpiCard
          title="GDP Promedio Hato"
          value={avgGdp > 0 ? `${formatNumber(avgGdp, 3)} kg/d` : '0 kg/d'}
          subtitle={gdpValidAnimals > 0 ? `${gdpValidAnimals} animales con pesaje continuo` : 'Registra pesajes continuos'}
          icon={TrendingUp}
          color="blue"
          onClick={() => onNavigate && onNavigate('weights')}
          tooltip="Ganancia Diaria de Peso promedio de animales con pesajes consecutivos"
        />

        {/* 4. Valores Económicos: Inversión en Ganado Activo */}
        {!isWorker && (
          <KpiCard
            title="Inversión Activa"
            value={formatCurrency(totalInvestedActive)}
            subtitle={activeCattle.length > 0 ? `Prom: ${formatCurrency(totalInvestedActive / activeCattle.length)}/cab` : 'Ganado activo en finca'}
            icon={DollarSign}
            color="amber"
            onClick={() => onNavigate && onNavigate('cattle')}
            tooltip={`Capital total invertido en los ${activeCattle.length} bovinos activos en finca (compra + costos directos)`}
          />
        )}

        {/* 5. Valores Económicos: Utilidad Neta Real (o Manejo de Ceba para Vaquero) */}
        {isWorker ? (
          <KpiCard
            title="Ganado en Ceba"
            value={`${fatteningCount} cabezas`}
            subtitle={`${milkingCount} en ordeño • ${pregnantCount} gestación`}
            icon={Layers}
            color="purple"
          />
        ) : (
          <KpiCard
            title="Utilidad Neta Real"
            value={formatCurrency(realNetProfit)}
            subtitle={totalGrossIncome > 0 || totalFarmExpenses > 0 ? `Ingresos: ${formatCurrency(totalGrossIncome)} • Gastos: ${formatCurrency(totalFarmExpenses)}` : (soldCattle.length > 0 ? `Utilidad Ventas: ${formatCurrency(totalRealizedProfit)}` : 'Balance libre de costos')}
            icon={realNetProfit >= 0 ? TrendingUp : TrendingDown}
            color={realNetProfit >= 0 ? 'emerald' : 'rose'}
            onClick={() => onNavigate && onNavigate('accounting')}
            tooltip="Utilidad neta real de la finca (Ventas de ganado + Leche + Otros ingresos - Gastos de operación)"
          />
        )}

      </div>

      {/* Sub-KPIs de Manejo y Producción según Módulos Activos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {isModuleActive(MODULE_KEYS.REPRODUCTION) && (
          <div 
            onClick={() => onNavigate('females')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-600/50 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Vacas en Gestación</span>
              <Baby className="w-4 h-4 group-hover:scale-110 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{pregnantCount}</p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Preñadas confirmadas</span>
          </div>
        )}

        {isModuleActive(MODULE_KEYS.DAIRY) && (
          <div 
            onClick={() => onNavigate('dairy')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600/50 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Lechería & Ordeño</span>
              <Milk className="w-4 h-4 group-hover:scale-110 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {todayMilkLiters > 0 ? `${formatNumber(todayMilkLiters, 1)} L` : milkingCount}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {todayMilkLiters > 0 ? `${todayMilkRecords.length} vacas hoy` : `${milkingCount} hembras en ordeño`}
            </span>
          </div>
        )}

        {isModuleActive(MODULE_KEYS.REPRODUCTION) && (
          <div 
            onClick={() => onNavigate('females')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Matrices de Cría</span>
              <Users className="w-4 h-4 group-hover:scale-110 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{breedingOnlyCount}</p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Vientres exclusivos cría</span>
          </div>
        )}

        {isModuleActive(MODULE_KEYS.CEBA_BATCHES) && (
          <div 
            onClick={() => onNavigate('cattle')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-600/50 transition cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Lote de Ceba</span>
              <Activity className="w-4 h-4 group-hover:scale-110 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{fatteningCount}</p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Bovinos en engorde</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN INDEPENDIENTE: RADAR DE SUBASTAS GANADERAS & VALUADOR EN VIVO   */}
      {/* ========================================================================= */}
      <div className="pt-4 sm:pt-6 pb-2 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <span>Mercado de Subastas Ganaderas en Vivo</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 uppercase tracking-wide">
                  Colombia
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Precios semanales por kilo en remates principales y avalúo comercial automático de tus bovinos
              </p>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            🟢 Remates Semanales
          </span>
        </div>

        {/* Tarjeta del Radar */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-4 sm:p-6 shadow-xl border border-emerald-500/30 relative overflow-hidden">
          {/* Glow de fondo */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Encabezado del Radar */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Plaza Activa de Referencia</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>📡 Radar de Precios & Valuador del Hato</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Precios oficiales de remates semanales en Colombia y avalúo en pie en tiempo real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Selector rápido de plaza de subasta */}
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-3 py-1.5 backdrop-blur-md">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <select
                  value={selectedAuctionId}
                  onChange={(e) => {
                    setSelectedAuctionId(e.target.value);
                    setDefaultAuctionId(e.target.value);
                  }}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  title="Selecciona la plaza de subasta de referencia"
                >
                  {Object.values(AUCTION_HOUSES).map((auc) => (
                    <option key={auc.id} value={auc.id} className="bg-slate-900 text-white">
                      {auc.logo} {auc.name}
                    </option>
                  ))}
                </select>
              </div>

              {onOpenMarketModal && (
                <button
                  type="button"
                  onClick={onOpenMarketModal}
                  className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-300 transition cursor-pointer active:scale-95 shrink-0"
                >
                  <Radio className="w-4 h-4" />
                  <span>Ver Comparativa</span>
                </button>
              )}
            </div>
          </div>

          {/* Notificación de adopción de precio */}
          {adoptedPriceAlert && (
            <div className="relative z-10 mt-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{adoptedPriceAlert}</span>
            </div>
          )}

          {/* Cuerpo del Radar: 2 Bloques (Precios por Categoría + Valuación Comercial del Hato) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mt-4 sm:mt-5">
            
            {/* Columna Izquierda (7 cols): Tarjetas de Categorías con Variación Semanal */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-bold">
                <span>{currentAuctionData.name} ({currentAuctionData.location?.split('(')[0]?.trim() || ''}) • {currentAuctionData.lastDate}</span>
                <span className="text-emerald-400 hidden sm:inline">▲ vs. semana previa</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(currentAuctionData.categories || {}).map(([catKey, cat]) => {
                  const isPositive = cat.diff > 0;
                  const isNegative = cat.diff < 0;
                  return (
                    <div 
                      key={catKey}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-slate-300 truncate" title={cat.name}>
                            {cat.emoji} {cat.shortName}
                          </span>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0 ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : isNegative
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                            : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {isPositive ? '▲' : isNegative ? '▼' : '='}
                            {isPositive ? `+${cat.diff}` : cat.diff}
                          </span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-white tracking-tight">
                          ${cat.currentPrice.toLocaleString('es-CO')}
                          <span className="text-[10px] font-normal text-slate-400 ml-1">/ kg</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate">
                          Prev: ${cat.previousPrice.toLocaleString('es-CO')}
                        </span>
                        {!isWorker && (
                          <button
                            type="button"
                            onClick={() => handleAdoptPrice(cat.currentPrice, cat.shortName)}
                            className="text-[10px] text-emerald-300 hover:text-emerald-200 font-black hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                            title={`Adoptar $${cat.currentPrice}/kg como precio de carne para la finca`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Adoptar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha (5 cols): Valuación Comercial del Hato en Pie */}
            <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-600/30 via-teal-700/20 to-slate-900 border-2 border-emerald-400/40 shadow-xl backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-black uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Valor Comercial del Hato</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-bold">
                    {herdValuation.animalCount} bovinos
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Valor estimado según los kg reales de tus bovinos y precios de {currentAuctionData.name}:
                </p>

                <div className="my-2 sm:my-3">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-200 tracking-tight">
                    ${herdValuation.totalValue.toLocaleString('es-CO')}
                    <span className="text-xs font-bold text-slate-300 ml-1.5">COP</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 font-bold">
                      ⚖️ {herdValuation.totalWeight.toLocaleString('es-CO')} kg en pie
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 font-bold border border-emerald-400/30">
                      📊 Prom: ${herdValuation.avgPricePerKg.toLocaleString('es-CO')} / kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de Valuación */}
              <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareAuctionWhatsApp}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-300/40 transition cursor-pointer active:scale-95"
                  title="Compartir reporte de precios y valuación de tu hato por WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Boletín WhatsApp</span>
                </button>

                {onOpenMarketModal && (
                  <button
                    type="button"
                    onClick={onOpenMarketModal}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition cursor-pointer"
                    title="Ver desglose por lotes, categorías y gráficos"
                  >
                    <span>Detalles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Widget de Calendario Ganadero & Fecha Actual en Tiempo Real */}
      <FarmCalendarWidget
        cattle={cattle}
        weighings={weighings}
        vaccinations={vaccinations}
        notes={calendarNotes}
        onOpenCalendar={onOpenCalendar}
      />

      {/* Grid de Herramientas de Campo: Arqueo / Checklist y Pluviómetro Digital */}
      <div className={`grid grid-cols-1 ${isModuleActive(MODULE_KEYS.RAINFALL) ? 'md:grid-cols-2' : ''} gap-4 sm:gap-6`}>
        <ChecklistAuditWidget
          latestAudit={latestAudit}
          audits={audits}
          cattle={cattle}
          onOpenChecklist={onOpenChecklist}
          onSelectAnimal={onSelectAnimal}
          onOpenNewAnimal={onOpenNewAnimal}
        />
        {isModuleActive(MODULE_KEYS.RAINFALL) && (
          <RainfallWidget
            rainfall={rainfall}
            onOpenNewRain={onOpenNewRain}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* SECCIÓN DE GRÁFICAS DEL TABLERO: RENDIMIENTO DE PESO Y ESTRUCTURA DEL HATO */}
      <div className={`grid grid-cols-1 ${isModuleActive(MODULE_KEYS.WEIGHTS) ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        
        {/* Gráfica 1: Rendimiento de Peso & Aumento */}
        {isModuleActive(MODULE_KEYS.WEIGHTS) && (
          <div className="custom-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Rendimiento de Ganancia de Peso & GDP</span>
              </h3>
              <button
                onClick={() => onNavigate('weights')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Báscula <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <WeightPerformanceChart cattle={activeCattle} weighings={weighings} />
          </div>
        )}

        {/* Gráfica 2: Distribución por Propósito & Rangos de Peso Comercial */}
        <div className="custom-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Estructura del Hato & Rangos de Peso</span>
            </h3>
            <button
              onClick={() => onNavigate('cattle')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Inventario <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ProductionTypeChart cattle={activeCattle} weighings={weighings} />
        </div>

      </div>

      {/* Grid de Alertas Zootécnicas & Resumen Financiero Integral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alertas del Hato (Partos, Gordos listos para venta, etc.) */}
        <div className="lg:col-span-1">
          <AlertsList
            cattle={activeCattle}
            weighings={weighings}
            vaccinations={vaccinations}
            onSelectAnimal={onSelectAnimal}
            onOpenCalving={onOpenCalving}
            onOpenBranding={onOpenBranding}
          />
        </div>

        {/* Resumen Financiero Integral & Contabilidad de Finca */}
        {!isWorker ? (
          <div className="lg:col-span-2 custom-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>Balance Financiero & Contabilidad Ganadera</span>
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Ingresos, gastos de finca, costos unitarios y utilidad líquida real
                  </p>
                </div>
              </div>

              {/* Semáforo de Salud Financiera */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                  realNetProfit > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : realNetProfit === 0
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    realNetProfit > 0 ? 'bg-emerald-500 animate-pulse' : realNetProfit === 0 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                  }`} />
                  <span>
                    {realNetProfit > 0 ? '🟢 Superávit Real' : realNetProfit === 0 ? '🟡 En Equilibrio' : '🔴 Déficit Operativo'}
                  </span>
                </span>

                <button
                  onClick={() => onNavigate('accounting')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                  title="Abrir módulo completo de contabilidad"
                >
                  <span>Módulo Contable</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Métricas Clave de Contabilidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Ingresos Totales */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos Totales (Histórico)</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(totalGrossIncome)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  📅 Mes actual: {formatCurrency(currentMonthGrossIncome)} • Ganado a Caja: {formatCurrency(totalCattleSalesRevenue)}
                </p>
              </div>

              {/* 2. Gastos Totales de Finca */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Gastos Finca (Histórico)</span>
                  <TrendingDown className="w-4 h-4" />
                </div>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(totalFarmExpenses)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  📅 Mes actual: {formatCurrency(currentMonthExpenses)}
                </p>
              </div>

              {/* 3. Utilidad Neta Real */}
              <div className={`p-3.5 rounded-2xl border ${
                realNetProfit >= 0
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
              }`}>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Utilidad Neta Real (Histórica)</span>
                  <DollarSign className={`w-4 h-4 ${realNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                </div>
                <p className={`text-lg font-black tabular-nums ${
                  realNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {formatCurrency(realNetProfit)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  📅 Mes actual: {formatCurrency(currentMonthNetProfit)}
                </p>
              </div>

              {/* 4. Costo por Animal / Día */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Costo Mantenimiento</span>
                  <Scale className="w-4 h-4" />
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(dailyCostPerHead)}
                  <span className="text-[11px] font-normal text-slate-400 ml-1">/animal/día</span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {costPerKilo > 0 ? `Costo carne: ${formatCurrency(costPerKilo)}/kg` : 'Inversión en hato activo'}
                </p>
              </div>
            </div>

            {/* Barra de Cobertura y Acciones Rápidas */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cobertura de Gastos del Mes: <span className="font-black text-emerald-600 dark:text-emerald-400">{expenseCoveragePct}%</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {expenseCoveragePct >= 100 ? '✅ Gastos cubiertos con utilidades' : '⚠️ Pendiente de cubrir con ventas'}
                  </span>
                </div>
                <div className="w-full sm:w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      expenseCoveragePct >= 100 ? 'bg-emerald-500' : expenseCoveragePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, expenseCoveragePct))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                {onOpenAddExpense && (
                  <button
                    onClick={onOpenAddExpense}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>+ Gasto</span>
                  </button>
                )}
                {onOpenAddIncome && (
                  <button
                    onClick={onOpenAddIncome}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+ Ingreso</span>
                  </button>
                )}
                {onOpenPartnershipModal && (
                  <button
                    onClick={onOpenPartnershipModal}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>🤝 Liquidación</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 custom-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Resumen Operativo de Campo</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ganado Activo en Pastoreo</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCattle.length} animales</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bovinos Pesados Recientemente</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{gdpValidAnimals} animales</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MÓDULO SANITARIO: CALENDARIO DE CICLOS DE VACUNACIÓN EN COLOMBIA (ICA / FEDEGÁN) */}
      <VaccinationCalendar 
        cattle={cattle} 
        vaccinations={vaccinations}
        onOpenVaccinationModal={onOpenVaccinationModal}
        onOpenCensusModal={onOpenCensusModal}
        onDeleteVaccination={onDeleteVaccination}
        onCompleteBooster={onCompleteBooster}
      />

    </div>
  );
}
