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
  Stethoscope
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
  onOpenPartnershipModal
}) {
  const { currentUser, isWorker } = useAuth();
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
      
      {/* Arva Vivid Lime Marquee Strip (#e8fe85) */}
      <div className="w-full bg-[#e8fe85] text-[#07503f] font-bold text-xs py-2 px-4 rounded-full border border-[#c3cda7] overflow-hidden flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="px-2 py-0.5 rounded-full bg-[#07503f] text-white font-extrabold text-[10px] uppercase">
            ARVA PASTORAL
          </span>
          <span className="font-semibold text-xs text-[#07503f]">
            🌿 Monitoreo de Ganancia Diaria de Peso (GDP) • Control Reproductivo & Sanitario • Gestión de Lotes y Pastoreo
          </span>
        </div>
        <span className="hidden md:inline-block font-serif arva-serif text-[#07503f] text-xs italic font-bold">
          {currentUser?.farmName || 'Finca Ganadera'}
        </span>
      </div>

      {/* Banner de Bienvenida - Arva Forest Ink (#07503f) */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#07503f] text-white p-6 sm:p-8 border border-[#0d4f40] shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#e8fe85] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gestión de Finca Ganadera</span>
            </div>
            <h1 className="arva-serif font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-normal leading-tight">
              Control de Inventario, Pesos & Rentabilidad
            </h1>
            <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
              Monitorea en tiempo real inventarios, ganancias de peso (GDP), estado de preñez, litros de leche y la rentabilidad neta de tus lotes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenCensusModal && (
              <button
                onClick={onOpenCensusModal}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition cursor-pointer shadow-xs"
                title="Ver y exportar censo poblacional oficial ICA / FEDEGAN"
              >
                <FileText className="w-4 h-4 text-[#e8fe85]" />
                <span>📄 Censo ICA</span>
              </button>
            )}

            {onOpenVaccinationModal && (
              <button
                onClick={onOpenVaccinationModal}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/30 transition cursor-pointer"
                title="Registrar vacunación o plan sanitario oficial"
              >
                <Syringe className="w-4 h-4 text-[#e8fe85]" />
                <span>+ Vacunación</span>
              </button>
            )}

            {!isWorker && onOpenPartnershipModal && (
              <button
                onClick={onOpenPartnershipModal}
                className="px-4 py-2 rounded-full bg-[#fceace] hover:bg-[#fff0db] text-[#07503f] font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-[#ecd09f] transition cursor-pointer active:scale-95 shadow-xs"
                title="Venta o liquidación de ganado: por lote completo o animal individual (venta directa o en compañía)"
              >
                <DollarSign className="w-4 h-4 text-[#07503f]" />
                <span>💰 Liquidar Lote</span>
              </button>
            )}

            {onOpenGlossary && (
              <button
                onClick={onOpenGlossary}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition cursor-pointer"
                title="Ver significado de GDP, ROI, Biomasa y Fórmulas"
              >
                <BookOpen className="w-4 h-4 text-[#e8fe85]" />
                <span>💡 Guía</span>
              </button>
            )}

            {onOpenChecklist && (
              <button
                onClick={onOpenChecklist}
                className="px-4 py-2 rounded-full bg-[#e8fe85] hover:bg-[#f1ff9e] text-[#07503f] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Arqueo y Censo Físico de Campo (Checklist en Manga / Corral)"
              >
                <ClipboardCheck className="w-4 h-4 text-[#07503f]" />
                <span>📋 Arqueo</span>
              </button>
            )}

            {onOpenWhatsAppReport && (
              <button
                onClick={onOpenWhatsAppReport}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-white/20 transition cursor-pointer shadow-xs"
                title="Generar y Enviar Reporte por WhatsApp con filtro por Dueño/Marca"
              >
                <MessageCircle className="w-4 h-4 text-[#e8fe85]" />
                <span>WhatsApp</span>
              </button>
            )}
            
            <button
              onClick={() => onNavigate('palpation')}
              className="px-4 py-2 rounded-full bg-[#b2cee7] hover:bg-[#c2d9ee] text-[#07503f] font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
              title="Iniciar jornada de palpación y diagnóstico reproductivo de hembras en corral"
            >
              <Stethoscope className="w-4 h-4 text-[#07503f]" />
              <span>🩺 Palpación</span>
            </button>

            <button
              onClick={() => onNavigate('quickWeigh')}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#e8fe85]" />
              <span>⚡ Báscula</span>
            </button>
            {onOpenBatchEntry && (
              <button
                onClick={onOpenBatchEntry}
                className="px-4 py-2 rounded-full bg-[#e6ecd5] hover:bg-[#f0f5e1] text-[#07503f] font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border border-[#c3cda7]"
                title="Registrar un lote completo con cálculo por kilo o precio fijo"
              >
                <PackagePlus className="w-4 h-4 text-[#07503f]" />
                <span>Ingresar Lote</span>
              </button>
            )}
            <button
              onClick={onOpenNewAnimal}
              className="px-4 py-2 rounded-full bg-[#e8fe85] hover:bg-[#f1ff9e] text-[#07503f] font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-sm"
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
            title="Inversión Activa"
            value={formatCurrency(totalInvestedActive)}
            subtitle={soldCattle.length > 0 ? `Utilidad Ventas: ${formatCurrency(totalRealizedProfit)}` : 'Ganado actualmente en finca'}
            icon={DollarSign}
            color="amber"
          />
        )}

      </div>

      {/* Sub-KPIs de Manejo y Producción - Arva Quilted Pastel Surfaces */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div 
          onClick={() => onNavigate('females')}
          className="p-4 rounded-[20px] bg-[#fceace] dark:bg-[#2a221b] border border-[#ecd09f] dark:border-[#4a3a2b] hover:border-[#07503f] transition-all duration-200 cursor-pointer group shadow-xs hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-[#8c5208] dark:text-[#fceace] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gestación</span>
            <div className="w-7 h-7 rounded-full bg-white/70 dark:bg-black/20 flex items-center justify-center">
              <Baby className="w-4 h-4 group-hover:scale-110 transition text-[#8c5208] dark:text-[#fceace]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#07503f] dark:text-white tabular-nums">{pregnantCount}</p>
          <span className="text-[11px] text-[#6d6d6d] dark:text-slate-400 font-medium">Preñadas confirmadas</span>
        </div>

        <div 
          onClick={() => onNavigate('females')}
          className="p-4 rounded-[20px] bg-[#b2cee7] dark:bg-[#152535] border border-[#9abddc] dark:border-[#233d54] hover:border-[#07503f] transition-all duration-200 cursor-pointer group shadow-xs hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-[#1c4b72] dark:text-[#b2cee7] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">En Ordeño</span>
            <div className="w-7 h-7 rounded-full bg-white/70 dark:bg-black/20 flex items-center justify-center">
              <Milk className="w-4 h-4 group-hover:scale-110 transition text-[#1c4b72] dark:text-[#b2cee7]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#07503f] dark:text-white tabular-nums">{milkingCount}</p>
          <span className="text-[11px] text-[#6d6d6d] dark:text-slate-400 font-medium">Hembras en producción</span>
        </div>

        <div 
          onClick={() => onNavigate('females')}
          className="p-4 rounded-[20px] bg-[#e6ecd5] dark:bg-[#1a2b1e] border border-[#c3cda7] dark:border-[#2d4a34] hover:border-[#07503f] transition-all duration-200 cursor-pointer group shadow-xs hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-[#07503f] dark:text-[#e8fe85] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Matrices Cría</span>
            <div className="w-7 h-7 rounded-full bg-white/70 dark:bg-black/20 flex items-center justify-center">
              <Users className="w-4 h-4 group-hover:scale-110 transition text-[#07503f] dark:text-[#e8fe85]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#07503f] dark:text-white tabular-nums">{breedingOnlyCount}</p>
          <span className="text-[11px] text-[#6d6d6d] dark:text-slate-400 font-medium">Vientres de cría</span>
        </div>

        <div 
          onClick={() => onNavigate('cattle')}
          className="p-4 rounded-[20px] bg-[#ffffff] dark:bg-[#1b221f] border border-[#c3cda7] dark:border-[#2d3a33] hover:border-[#07503f] transition-all duration-200 cursor-pointer group shadow-xs hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-[#07503f] dark:text-[#e8fe85] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lote Ceba</span>
            <div className="w-7 h-7 rounded-full bg-[#f1efdf] dark:bg-black/20 flex items-center justify-center">
              <Activity className="w-4 h-4 group-hover:scale-110 transition text-[#07503f] dark:text-[#e8fe85]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#07503f] dark:text-white tabular-nums">{fatteningCount}</p>
          <span className="text-[11px] text-[#6d6d6d] dark:text-slate-400 font-medium">Bovinos en engorde</span>
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

      {/* Grid de Alertas Zootécnicas & Resumen Financiero */}
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

        {/* Resumen Financiero Rápido */}
        <div className="lg:col-span-2 custom-card p-5 sm:p-6 space-y-4 rounded-[20px] border border-[#c3cda7] dark:border-[#2d3a33] bg-white dark:bg-[#07251d]">
          <div className="flex items-center justify-between border-b border-[#e6ecd5] dark:border-[#133d30] pb-3">
            <h3 className="arva-serif font-serif font-bold text-[#07503f] dark:text-white text-base sm:text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#07503f] dark:text-[#e8fe85]" />
              <span>Resumen Financiero del Inventario en Finca</span>
            </h3>
            <button
              onClick={() => onNavigate('finances')}
              className="text-xs text-[#07503f] dark:text-[#e8fe85] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Detalle Financiero <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-[16px] bg-[#e6ecd5]/50 dark:bg-black/20 border border-[#c3cda7]/60">
              <p className="text-xs text-[#6d6d6d] dark:text-slate-400 font-bold uppercase tracking-wider">Inversión Activa</p>
              <p className="text-lg sm:text-xl font-black text-[#07503f] dark:text-white mt-1 tabular-nums">{formatCurrency(totalInvestedActive)}</p>
              <p className="text-[11px] text-[#6d6d6d] dark:text-slate-400 mt-0.5 font-medium">Compra inicial + costos</p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#b2cee7]/40 dark:bg-black/20 border border-[#9abddc]/60">
              <p className="text-xs text-[#1c4b72] dark:text-[#b2cee7] font-bold uppercase tracking-wider">Ventas Totales</p>
              <p className="text-lg sm:text-xl font-black text-[#1c4b72] dark:text-white mt-1 tabular-nums">
                {formatCurrency(soldCattle.reduce((sum, c) => sum + (parseFloat(c.exitPrice) || 0), 0))}
              </p>
              <p className="text-[11px] text-[#6d6d6d] dark:text-slate-400 mt-0.5 font-medium">{soldCattle.length} cabezas liquidadas</p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#fceace]/60 dark:bg-black/20 border border-[#ecd09f]/80">
              <p className="text-xs text-[#8c5208] dark:text-[#fceace] font-bold uppercase tracking-wider">Utilidad Neta</p>
              <p className="text-lg sm:text-xl font-black text-[#8c5208] dark:text-[#e8fe85] mt-1 tabular-nums">{formatCurrency(totalRealizedProfit)}</p>
              <p className="text-[11px] text-[#6d6d6d] dark:text-slate-400 mt-0.5 font-medium">Ganancia libre de costos</p>
            </div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[#e6ecd5] dark:bg-[#0b382c] border border-[#c3cda7] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#07503f] text-[#e8fe85] flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#07503f] dark:text-white">¿Listo para registrar un pesaje o venta?</p>
                <p className="text-[11px] text-[#6d6d6d] dark:text-slate-300">Mantén los pesos actualizados para calcular las ganancias de peso diarias (GDP).</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {onOpenPartnershipModal && (
                <button
                  onClick={onOpenPartnershipModal}
                  className="px-4 py-1.5 rounded-full bg-[#fceace] hover:bg-[#fff0db] text-[#07503f] font-bold text-xs border border-[#ecd09f] transition cursor-pointer"
                  title="Liquidar o vender ganado"
                >
                  💰 Liquidar
                </button>
              )}
              {onOpenGlossary && (
                <button
                  onClick={onOpenGlossary}
                  className="px-4 py-1.5 rounded-full bg-white dark:bg-[#07251d] text-[#07503f] dark:text-slate-200 hover:bg-[#f1efdf] border border-[#c3cda7] font-semibold text-xs transition cursor-pointer"
                >
                  💡 Glosario
                </button>
              )}
              <button
                onClick={() => onNavigate('quickWeigh')}
                className="px-4 py-1.5 rounded-full bg-[#07503f] hover:bg-[#0b6852] text-white font-bold text-xs transition cursor-pointer"
              >
                Ir a Báscula
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MÓDULO SANITARIO: CALENDARIO DE CICLOS DE VACUNACIÓN EN COLOMBIA (ICA / FEDEGÁN) */}
      <VaccinationCalendar 
        cattle={cattle} 
        vaccinations={vaccinations}
        onOpenVaccinationModal={onOpenVaccinationModal}
        onOpenCensusModal={onOpenCensusModal}
        onDeleteVaccination={onDeleteVaccination}
      />

    </div>
  );
}
