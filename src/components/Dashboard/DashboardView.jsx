import React from 'react';
import { 
  Layers, 
  Scale, 
  HeartHandshake, 
  DollarSign, 
  TrendingUp, 
  Milk, 
  Beef, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { ProductionTypeChart } from './ProductionTypeChart';
import { WeightPerformanceChart } from './WeightPerformanceChart';
import { AlertsList } from './AlertsList';
import { formatCurrency, formatNumber, calculateWeightMetrics, calculateFinancials } from '../../services/calculations';

export function DashboardView({ 
  cattle = [], 
  weighings = [], 
  onNavigate, 
  onSelectAnimal, 
  onOpenNewAnimal 
}) {
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  const soldCattle = cattle.filter(c => c.status === 'Vendido');

  // Conteo de sexos
  const malesCount = activeCattle.filter(c => c.sex === 'Macho').length;
  const femalesCount = activeCattle.filter(c => c.sex === 'Hembra').length;

  // Hembras preñadas y en leche
  const pregnantCount = activeCattle.filter(c => c.sex === 'Hembra' && c.reproductiveStatus === 'Preñada').length;
  const milkingCount = activeCattle.filter(c => c.sex === 'Hembra' && c.milkingStatus === 'En ordeño').length;
  const breedingOnlyCount = activeCattle.filter(c => c.sex === 'Hembra' && c.isBreedingOnly).length;

  // Ceba
  const fatteningCount = activeCattle.filter(c => c.productionType === 'Ceba').length;

  // Producción total de leche diaria
  const totalDailyMilk = activeCattle.reduce((sum, c) => sum + (parseFloat(c.dailyMilkLiters) || 0), 0);

  // Valor invertido en inventario activo
  const totalInvestedActive = activeCattle.reduce((sum, c) => {
    return sum + (parseFloat(c.entryPrice) || 0) + (parseFloat(c.additionalCosts) || 0);
  }, 0);

  // Utilidad realizada de animales vendidos
  const totalRealizedProfit = soldCattle.reduce((sum, c) => {
    const fin = calculateFinancials(c);
    return sum + fin.netProfit;
  }, 0);

  // Ganancia diaria de peso (GDP) promedio del hato
  let totalGdpSum = 0;
  let gdpValidAnimals = 0;
  activeCattle.forEach(animal => {
    const animalWeighings = weighings.filter(w => w.cattleId === animal.id);
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
            <button
              onClick={() => onNavigate('quickWeigh')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition backdrop-blur-sm"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Báscula Rápida</span>
            </button>
            <button
              onClick={onOpenNewAnimal}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Bovino</span>
            </button>
          </div>
        </div>
      </div>

      {/* Si el inventario está en ceros, mostrar invitación de inicio */}
      {cattle.length === 0 && (
        <div className="custom-card p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-4 border-dashed border-2 border-emerald-500/40">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tu inventario está en ceros</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              ¡Excelente! Todo está listo para que ingreses los primeros animales reales de tu finca con sus números de arete, marca de hierro, peso inicial y costo.
            </p>
          </div>
          <button
            onClick={onOpenNewAnimal}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition transform active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Registrar Primer Bovino</span>
          </button>
        </div>
      )}

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          title="Total Bovinos Activos"
          value={`${activeCattle.length} Cabezas`}
          subtitle={`${malesCount} Machos  •  ${femalesCount} Hembras`}
          icon={Layers}
          color="emerald"
          badge={`${fatteningCount} en Ceba`}
        />

        <KpiCard
          title="Ganancia Diaria (GDP)"
          value={`${formatNumber(avgGdp, 3)} kg/d`}
          subtitle="Promedio general del hato"
          icon={Scale}
          color="blue"
          badge={avgGdp > 0 ? (avgGdp >= 0.6 ? 'Buen Rendimiento' : 'Regular') : 'Sin datos'}
        />

        <KpiCard
          title="Reproducción & Leche"
          value={`${pregnantCount} Preñadas`}
          subtitle={`${milkingCount} en Ordeño (${formatNumber(totalDailyMilk, 1)} L/día)`}
          icon={HeartHandshake}
          color="purple"
          badge={`${breedingOnlyCount} Vientres Cría`}
        />

        <KpiCard
          title="Utilidades Realizadas"
          value={formatCurrency(totalRealizedProfit)}
          subtitle={`${soldCattle.length} animales vendidos`}
          icon={DollarSign}
          color="amber"
          badge="Ganancia Neta"
        />
      </div>

      {/* Sección Gráfica y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfica Rendimiento de Pesos */}
        <div className="custom-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Top Ganancia de Peso Acumulada (kg)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Animales con mayor aumento de peso registrado</p>
            </div>
            <button
              onClick={() => onNavigate('weights')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <WeightPerformanceChart cattle={activeCattle} weighings={weighings} />
        </div>

        {/* Alertas Rápidas y Eventos */}
        <div className="custom-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>Alertas & Tareas del Hato</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              Prioritarias
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AlertsList cattle={cattle} onSelectAnimal={onSelectAnimal} />
          </div>
        </div>

      </div>

      {/* Distribución Productiva y Resumen Financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Distribución Productiva */}
        <div className="custom-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Beef className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>Orientación Productiva</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Distribución según propósito (Ceba, Leche, Cría)</p>
          <ProductionTypeChart cattle={activeCattle} />
        </div>

        {/* Resumen de Inversión y Valor del Hato */}
        <div className="custom-card p-5 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Resumen Financiero del Inventario en Finca</span>
            </h3>
            <button
              onClick={() => onNavigate('finances')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
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

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">¿Listo para registrar un pesaje o venta?</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Mantén los pesos actualizados para calcular las ganancias de peso diarias.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('quickWeigh')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
            >
              Ir a Báscula
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
