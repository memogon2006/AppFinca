import React from 'react';
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
  Handshake
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { AlertsList } from './AlertsList';
import { VaccinationCalendar } from './VaccinationCalendar';
import { FarmCalendarWidget } from '../Calendar/FarmCalendarWidget';
import { ChecklistAuditWidget } from './ChecklistAuditWidget';
import { ProductionTypeChart } from './ProductionTypeChart';
import { WeightPerformanceChart } from './WeightPerformanceChart';
import { formatCurrency, formatNumber, calculateWeightMetrics, calculateFinancials } from '../../services/calculations';
import { useAuth } from '../../context/AuthContext';

export function DashboardView({ 
  cattle = [], 
  weighings = [], 
  vaccinations = [],
  audits = [],
  calendarNotes = [],
  farmExpenses = [],
  farmIncomes = [],
  onNavigate, 
  onSelectAnimal, 
  onOpenNewAnimal,
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
  onOpenAddIncome
}) {
  const { isWorker } = useAuth();
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  const soldCattle = cattle.filter(c => c.status === 'Vendido');

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
  let totalRealizedProfit = 0;

  activeCattle.forEach(animal => {
    const fin = calculateFinancials(animal);
    totalInvestedActive += fin.totalInvested;

    const animalWeighings = weighings.filter(w => String(w.cattleId) === String(animal.id));
    const metrics = calculateWeightMetrics(animal, animalWeighings);
    totalCurrentWeight += metrics.currentWeight;
  });

  soldCattle.forEach(animal => {
    const fin = calculateFinancials(animal);
    totalRealizedProfit += fin.netProfit;
  });

  // Cálculos Financieros Integrales de la Finca (Contabilidad + Ventas)
  const totalFarmExpenses = farmExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalOtherIncomes = farmIncomes.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const totalCattleSalesRevenue = soldCattle.reduce((sum, c) => sum + (parseFloat(c.exitPrice) || 0), 0);
  const totalGrossIncome = totalCattleSalesRevenue + totalOtherIncomes;
  const realNetProfit = totalRealizedProfit + totalOtherIncomes - totalFarmExpenses;

  // Gastos e Ingresos del Mes Actual
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = farmExpenses
    .filter(e => (e.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const currentMonthIncomes = farmIncomes
    .filter(i => (i.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const currentMonthCattleProfit = soldCattle
    .filter(c => (c.exitDate || c.updatedAt || '').startsWith(currentMonthPrefix))
    .reduce((sum, c) => sum + calculateFinancials(c).netProfit, 0);
  const currentMonthNetProfit = currentMonthCattleProfit + currentMonthIncomes - currentMonthExpenses;

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

  // Obtener el arqueo / checklist más reciente
  const latestAudit = React.useMemo(() => {
    if (audits && audits.length > 0) {
      const sorted = [...audits].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      return sorted[0];
    }
    // Fallback de localStorage
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('ganado_latest_audit_'));
      if (keys.length > 0) {
        const raw = localStorage.getItem(keys[0]);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  }, [audits]);

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

            {!isWorker && onOpenPartnershipModal && (
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
            
            <button
              onClick={() => onNavigate('palpation')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 border border-purple-400/40 transition cursor-pointer"
              title="Iniciar jornada de palpación y diagnóstico reproductivo de hembras en corral"
            >
              <Stethoscope className="w-4 h-4 text-purple-200" />
              <span>🩺 Palpación Rápida</span>
            </button>

            <button
              onClick={() => onNavigate('quickWeigh')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition backdrop-blur-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Báscula Rápida</span>
            </button>
            {onOpenBatchEntry && (
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

      {/* 4 KPIs Clave Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <KpiCard
          title="Total Bovinos Activos"
          value={activeCattle.length}
          subtitle={`${malesCount} machos • ${femalesCount} hembras`}
          icon={Users}
          color="emerald"
        />

        <KpiCard
          title="Biomasa Total"
          value={`${formatNumber(totalCurrentWeight, 0)} kg`}
          subtitle={activeCattle.length > 0 ? `Prom: ${formatNumber(totalCurrentWeight / activeCattle.length, 1)} kg/cab` : 'Sin inventario'}
          icon={Scale}
          color="emerald"
        />

        <KpiCard
          title="GDP Promedio Hato"
          value={avgGdp > 0 ? `${formatNumber(avgGdp, 3)} kg/d` : '0 kg/d'}
          subtitle={gdpValidAnimals > 0 ? `${gdpValidAnimals} animales con pesaje continuo` : 'Registra pesajes continuos'}
          icon={TrendingUp}
          color="blue"
        />

        {isWorker ? (
          <KpiCard
            title="Ganado en Ceba"
            value={`${fatteningCount} cabezas`}
            subtitle={`${milkingCount} en ordeño • ${pregnantCount} gestación`}
            icon={Layers}
            color="teal"
          />
        ) : (
          <KpiCard
            title="Utilidad Neta Real"
            value={formatCurrency(realNetProfit)}
            subtitle={totalGrossIncome > 0 || totalFarmExpenses > 0 ? `Ingresos: ${formatCurrency(totalGrossIncome)} • Gastos: ${formatCurrency(totalFarmExpenses)}` : (soldCattle.length > 0 ? `Utilidad Ventas: ${formatCurrency(totalRealizedProfit)}` : 'Balance libre de costos')}
            icon={realNetProfit >= 0 ? TrendingUp : TrendingDown}
            color={realNetProfit >= 0 ? 'emerald' : 'rose'}
          />
        )}

      </div>

      {/* Sub-KPIs de Manejo y Producción */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
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

        <div 
          onClick={() => onNavigate('females')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600/50 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">En Ordeño / Leche</span>
            <Milk className="w-4 h-4 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{milkingCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Hembras en producción</span>
        </div>

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

      </div>

      {/* Widget de Calendario Ganadero & Fecha Actual en Tiempo Real */}
      <FarmCalendarWidget
        cattle={cattle}
        weighings={weighings}
        vaccinations={vaccinations}
        notes={calendarNotes}
        onOpenCalendar={onOpenCalendar}
      />

      {/* Widget de Último Arqueo & Checklist de Inventario Físico */}
      <ChecklistAuditWidget
        latestAudit={latestAudit}
        cattle={cattle}
        onOpenChecklist={onOpenChecklist}
        onSelectAnimal={onSelectAnimal}
        onOpenNewAnimal={onOpenNewAnimal}
      />

      {/* SECCIÓN DE GRÁFICAS DEL TABLERO: RENDIMIENTO DE PESO Y ESTRUCTURA DEL HATO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica 1: Rendimiento de Peso & Aumento */}
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
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos Totales</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(totalGrossIncome)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  Ventas: {formatCurrency(totalCattleSalesRevenue)} • Otros: {formatCurrency(totalOtherIncomes)}
                </p>
              </div>

              {/* 2. Gastos Totales de Finca */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Gastos de Finca</span>
                  <TrendingDown className="w-4 h-4" />
                </div>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(totalFarmExpenses)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  Mes actual: {formatCurrency(currentMonthExpenses)}
                </p>
              </div>

              {/* 3. Utilidad Neta Real */}
              <div className={`p-3.5 rounded-2xl border ${
                realNetProfit >= 0
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
              }`}>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Utilidad Neta Real</span>
                  <DollarSign className={`w-4 h-4 ${realNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                </div>
                <p className={`text-lg font-black tabular-nums ${
                  realNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {formatCurrency(realNetProfit)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Mes: {formatCurrency(currentMonthNetProfit)}
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
