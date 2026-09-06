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
  DownloadCloud, 
  Zap,
  Activity,
  Layers,
  Baby,
  Milk,
  ShieldCheck,
  FileSpreadsheet,
  BookOpen,
  HelpCircle,
  PieChart as PieIcon,
  BarChart3,
  PackagePlus
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { AlertsList } from './AlertsList';
import { VaccinationCalendar } from './VaccinationCalendar';
import { ProductionTypeChart } from './ProductionTypeChart';
import { WeightPerformanceChart } from './WeightPerformanceChart';
import { formatCurrency, formatNumber, calculateWeightMetrics, calculateFinancials } from '../../services/calculations';

export function DashboardView({ 
  cattle = [], 
  weighings = [], 
  onNavigate, 
  onSelectAnimal, 
  onOpenNewAnimal,
  onOpenBatchEntry,
  onOpenExportImport,
  onOpenGlossary
}) {
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

    const animalWeighings = weighings.filter(w => w.cattleId === animal.id || w.cattleId === String(animal.id));
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
    const animalWeighings = weighings.filter(w => w.cattleId === animal.id || w.cattleId === String(animal.id));
    const metrics = calculateWeightMetrics(animal, animalWeighings);
    if (metrics.overallGdp > 0) {
      totalGdpSum += metrics.overallGdp;
      gdpValidAnimals++;
    }
  });
  const avgGdp = gdpValidAnimals > 0 ? (totalGdpSum / gdpValidAnimals) : 0;

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
              Control de Inventario, Pesos & Rentabilidad
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Monitorea en tiempo real inventarios, ganancias de peso (GDP), estado de preñez, litros de leche y la rentabilidad neta de tus lotes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
            
            <button
              onClick={() => onNavigate('births')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
              title="Registrar y consultar partos e incorporar terneros al inventario"
            >
              <Baby className="w-4 h-4" />
              <span>Nacimientos</span>
            </button>
            <button
              onClick={() => onNavigate('quickWeigh')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition backdrop-blur-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Báscula Rápida</span>
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

      {/* CONSEJO DE SEGURIDAD & RESPALDO PERIÓDICO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-300/60 dark:border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex-shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>💡 Sugerencia de Seguridad: Ten tu copia de seguridad en archivo</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Descarga periódicamente tu copia de seguridad en archivo (.json / Excel). Si cambias de teléfono, computador o dispositivo, tendrás todo tu ganado, pesajes y ventas siempre protegidos y listos para restaurar al instante.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenExportImport}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm whitespace-nowrap self-end sm:self-auto cursor-pointer"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Exportar / Respaldo</span>
        </button>
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

        <KpiCard
          title="Inversión Activa"
          value={formatCurrency(totalInvestedActive)}
          subtitle={soldCattle.length > 0 ? `Utilidad Ventas: ${formatCurrency(totalRealizedProfit)}` : 'Ganado actualmente en finca'}
          icon={DollarSign}
          color="amber"
        />

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
          <p className="text-2xl font-black text-slate-900 dark:text-white">{pregnantCount}</p>
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
          <p className="text-2xl font-black text-slate-900 dark:text-white">{milkingCount}</p>
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
          <p className="text-2xl font-black text-slate-900 dark:text-white">{breedingOnlyCount}</p>
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
          <p className="text-2xl font-black text-slate-900 dark:text-white">{fatteningCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Bovinos en engorde</span>
        </div>

      </div>

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
            onSelectAnimal={onSelectAnimal}
          />
        </div>

        {/* Resumen Financiero Rápido */}
        <div className="lg:col-span-2 custom-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Resumen Financiero del Inventario en Finca</span>
            </h3>
            <button
              onClick={() => onNavigate('finances')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Detalle Financiero <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inversión Activa en Ganado</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalInvestedActive)}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Compra inicial + costos directos</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ventas Totales Realizadas</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(soldCattle.reduce((sum, c) => sum + (parseFloat(c.exitPrice) || 0), 0))}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{soldCattle.length} cabezas liquidadas</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Utilidad Neta Obtenida</p>
              <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalRealizedProfit)}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Ganancia libre de costos</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">¿Listo para registrar un pesaje o venta?</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Mantén los pesos actualizados para calcular las ganancias de peso diarias (GDP).</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {onOpenGlossary && (
                <button
                  onClick={onOpenGlossary}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  💡 Glosario
                </button>
              )}
              <button
                onClick={() => onNavigate('quickWeigh')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
              >
                Ir a Báscula
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MÓDULO SANITARIO: CALENDARIO DE CICLOS DE VACUNACIÓN EN COLOMBIA (ICA / FEDEGÁN) */}
      <VaccinationCalendar cattle={cattle} />

    </div>
  );
}
