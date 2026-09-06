import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  DollarSign, 
  Scale, 
  TrendingUp, 
  Calendar, 
  Search, 
  X, 
  Filter, 
  PlusCircle, 
  DownloadCloud, 
  CheckCircle2, 
  Tag, 
  ArrowUpRight,
  Eye,
  Award,
  ChevronRight,
  Boxes
} from 'lucide-react';
import { 
  formatCurrency, 
  formatNumber, 
  calculateWeightMetrics, 
  calculateFinancials 
} from '../../services/calculations';

export function BatchAnalyticsView({
  cattle = [],
  weighings = [],
  onSelectAnimal,
  onOpenBatchEntry,
  onOpenNewAnimal,
  onOpenExportImport
}) {
  const [selectedBatch, setSelectedBatch] = useState('all'); // 'all' o nombre del lote
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Activo' | 'Vendido' | 'ready480'

  // Obtener lista única de lotes
  const allBatches = useMemo(() => {
    const set = new Set(cattle.map(c => c.entryBatch || c.paddock || 'Ingreso #1').filter(Boolean));
    return Array.from(set).sort();
  }, [cattle]);

  // Cálculos consolidados por cada lote individual
  const batchesStatistics = useMemo(() => {
    return allBatches.map(batchName => {
      const batchAnimals = cattle.filter(c => (c.entryBatch || c.paddock || 'Ingreso #1') === batchName);
      const headCount = batchAnimals.length;
      const activeAnimals = batchAnimals.filter(c => c.status === 'Activo');
      const soldAnimals = batchAnimals.filter(c => c.status === 'Vendido');
      const deadAnimals = batchAnimals.filter(c => c.status === 'Muerto');

      // Fechas
      const dates = batchAnimals.map(c => c.entryDate).filter(Boolean).sort();
      const earliestDate = dates[0] || 'N/A';

      // Totales de Compra y Entrada
      let totalPurchaseCost = 0;
      let totalAdditionalCosts = 0;
      let totalEntryWeight = 0;
      let countWithEntryWeight = 0;
      let countWithEntryPrice = 0;

      // Totales de Biomasa Actual y Ganancia
      let totalCurrentWeight = 0;
      let totalGainKg = 0;
      let gdpSum = 0;
      let gdpCount = 0;
      let totalDaysSum = 0;
      let readyToSellCount = 0;

      // Totales de Salida / Ventas
      let totalSalesRevenue = 0;
      let totalSoldWeight = 0;
      let totalProfitRealized = 0;

      batchAnimals.forEach(animal => {
        const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
        const wm = calculateWeightMetrics(animal, animalWeighs);
        const fin = calculateFinancials(animal);

        const entryPrice = parseFloat(animal.entryPrice) || 0;
        const addCost = parseFloat(animal.additionalCosts) || 0;
        const entryWeight = parseFloat(animal.entryWeight) || 0;

        totalPurchaseCost += entryPrice;
        totalAdditionalCosts += addCost;
        if (entryPrice > 0) countWithEntryPrice++;

        if (entryWeight > 0) {
          totalEntryWeight += entryWeight;
          countWithEntryWeight++;
        }

        if (animal.status === 'Activo') {
          totalCurrentWeight += wm.currentWeight;
          if (wm.currentWeight >= 480) readyToSellCount++;
        }

        totalGainKg += wm.totalGain > 0 ? wm.totalGain : 0;
        if (wm.overallGdp > 0) {
          gdpSum += wm.overallGdp;
          gdpCount++;
        }
        totalDaysSum += wm.totalDays;

        if (animal.status === 'Vendido') {
          totalSalesRevenue += parseFloat(animal.exitPrice) || 0;
          totalSoldWeight += parseFloat(animal.exitWeight) || 0;
          totalProfitRealized += fin.netProfit;
        }
      });

      const totalInvestment = totalPurchaseCost + totalAdditionalCosts;
      const avgPricePerHead = headCount > 0 ? (totalPurchaseCost / headCount) : 0;
      const avgEntryWeight = countWithEntryWeight > 0 ? (totalEntryWeight / countWithEntryWeight) : 0;
      const avgCurrentWeight = activeAnimals.length > 0 ? (totalCurrentWeight / activeAnimals.length) : 0;
      const avgGainKg = headCount > 0 ? (totalGainKg / headCount) : 0;
      const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
      const avgDays = headCount > 0 ? Math.round(totalDaysSum / headCount) : 0;

      // Valor del Kilo de Compra ($/kg entrada)
      const costPerEntryKg = totalEntryWeight > 0 ? (totalPurchaseCost / totalEntryWeight) : 0;
      
      // Valor del Kilo de Venta ($/kg salida)
      const avgSoldPricePerKg = totalSoldWeight > 0 ? (totalSalesRevenue / totalSoldWeight) : 0;

      return {
        batchName,
        headCount,
        activeCount: activeAnimals.length,
        soldCount: soldAnimals.length,
        deadCount: deadAnimals.length,
        earliestDate,
        totalPurchaseCost,
        totalAdditionalCosts,
        totalInvestment,
        avgPricePerHead,
        totalEntryWeight,
        avgEntryWeight,
        totalCurrentWeight,
        avgCurrentWeight,
        totalGainKg,
        avgGainKg,
        avgGdp,
        avgDays,
        costPerEntryKg,
        readyToSellCount,
        totalSalesRevenue,
        totalSoldWeight,
        avgSoldPricePerKg,
        totalProfitRealized,
        animals: batchAnimals
      };
    });
  }, [allBatches, cattle, weighings]);

  // Lote actualmente enfocado para métricas
  const currentBatchData = useMemo(() => {
    if (selectedBatch === 'all') {
      // Consolidado de todos los lotes
      const headCount = cattle.length;
      const activeAnimals = cattle.filter(c => c.status === 'Activo');
      const soldAnimals = cattle.filter(c => c.status === 'Vendido');
      const deadAnimals = cattle.filter(c => c.status === 'Muerto');

      let totalPurchaseCost = 0;
      let totalAdditionalCosts = 0;
      let totalEntryWeight = 0;
      let countWithEntryWeight = 0;
      let totalCurrentWeight = 0;
      let totalGainKg = 0;
      let gdpSum = 0;
      let gdpCount = 0;
      let totalDaysSum = 0;
      let readyToSellCount = 0;
      let totalSalesRevenue = 0;
      let totalSoldWeight = 0;
      let totalProfitRealized = 0;

      cattle.forEach(animal => {
        const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
        const wm = calculateWeightMetrics(animal, animalWeighs);
        const fin = calculateFinancials(animal);

        const entryPrice = parseFloat(animal.entryPrice) || 0;
        const addCost = parseFloat(animal.additionalCosts) || 0;
        const entryWeight = parseFloat(animal.entryWeight) || 0;

        totalPurchaseCost += entryPrice;
        totalAdditionalCosts += addCost;

        if (entryWeight > 0) {
          totalEntryWeight += entryWeight;
          countWithEntryWeight++;
        }

        if (animal.status === 'Activo') {
          totalCurrentWeight += wm.currentWeight;
          if (wm.currentWeight >= 480) readyToSellCount++;
        }

        totalGainKg += wm.totalGain > 0 ? wm.totalGain : 0;
        if (wm.overallGdp > 0) {
          gdpSum += wm.overallGdp;
          gdpCount++;
        }
        totalDaysSum += wm.totalDays;

        if (animal.status === 'Vendido') {
          totalSalesRevenue += parseFloat(animal.exitPrice) || 0;
          totalSoldWeight += parseFloat(animal.exitWeight) || 0;
          totalProfitRealized += fin.netProfit;
        }
      });

      const totalInvestment = totalPurchaseCost + totalAdditionalCosts;
      const avgPricePerHead = headCount > 0 ? (totalPurchaseCost / headCount) : 0;
      const avgEntryWeight = countWithEntryWeight > 0 ? (totalEntryWeight / countWithEntryWeight) : 0;
      const avgCurrentWeight = activeAnimals.length > 0 ? (totalCurrentWeight / activeAnimals.length) : 0;
      const avgGainKg = headCount > 0 ? (totalGainKg / headCount) : 0;
      const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
      const avgDays = headCount > 0 ? Math.round(totalDaysSum / headCount) : 0;
      const costPerEntryKg = totalEntryWeight > 0 ? (totalPurchaseCost / totalEntryWeight) : 0;
      const avgSoldPricePerKg = totalSoldWeight > 0 ? (totalSalesRevenue / totalSoldWeight) : 0;

      return {
        batchName: 'Todos los Lotes (Consolidado General)',
        headCount,
        activeCount: activeAnimals.length,
        soldCount: soldAnimals.length,
        deadCount: deadAnimals.length,
        earliestDate: 'Todas las fechas',
        totalPurchaseCost,
        totalAdditionalCosts,
        totalInvestment,
        avgPricePerHead,
        totalEntryWeight,
        avgEntryWeight,
        totalCurrentWeight,
        avgCurrentWeight,
        totalGainKg,
        avgGainKg,
        avgGdp,
        avgDays,
        costPerEntryKg,
        readyToSellCount,
        totalSalesRevenue,
        totalSoldWeight,
        avgSoldPricePerKg,
        totalProfitRealized,
        animals: cattle
      };
    }

    return batchesStatistics.find(b => b.batchName === selectedBatch) || batchesStatistics[0] || null;
  }, [selectedBatch, batchesStatistics, cattle, weighings]);

  // Lista de animales filtrados para la tabla detallada
  const filteredBatchAnimals = useMemo(() => {
    let list = selectedBatch === 'all' 
      ? cattle 
      : cattle.filter(c => (c.entryBatch || c.paddock || 'Ingreso #1') === selectedBatch);

    // Filtro por Estado
    if (statusFilter === 'Activo') {
      list = list.filter(c => c.status === 'Activo');
    } else if (statusFilter === 'Vendido') {
      list = list.filter(c => c.status === 'Vendido');
    } else if (statusFilter === 'ready480') {
      list = list.filter(c => {
        const animalWeighs = weighings.filter(w => String(w.cattleId) === String(c.id));
        const wm = calculateWeightMetrics(c, animalWeighs);
        return c.status === 'Activo' && wm.currentWeight >= 480;
      });
    }

    // Filtro por Búsqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const tag = (c.tagNumber || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const brand = (c.ironBrand || '').toLowerCase();
        const owner = (c.owner || '').toLowerCase();
        const breed = (c.breed || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || brand.includes(q) || owner.includes(q) || breed.includes(q);
      });
    }

    // Ordenar: Primero Activos (en finca), luego Vendidos, luego Arete
    return list.sort((a, b) => {
      const statusOrder = { 'Activo': 1, 'Vendido': 2, 'Muerto': 3 };
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.tagNumber || '').localeCompare(b.tagNumber || '', undefined, { numeric: true });
    });
  }, [cattle, selectedBatch, statusFilter, searchQuery, weighings]);

  // Totales dinámicos de la tabla filtrada
  const tableSummary = useMemo(() => {
    let totEntryWeight = 0;
    let totCurrentWeight = 0;
    let totGain = 0;
    let totPurchase = 0;
    let totInvestment = 0;
    let totEstimated = 0;
    let gdpSum = 0;
    let gdpCount = 0;

    filteredBatchAnimals.forEach(c => {
      const animalWeighs = weighings.filter(w => String(w.cattleId) === String(c.id));
      const wm = calculateWeightMetrics(c, animalWeighs);
      const fin = calculateFinancials(c);

      const eWeight = parseFloat(c.entryWeight) || 0;
      const ePrice = parseFloat(c.entryPrice) || 0;

      totEntryWeight += eWeight;
      totCurrentWeight += wm.currentWeight;
      totGain += wm.totalGain > 0 ? wm.totalGain : 0;
      totPurchase += ePrice;
      totInvestment += fin.totalInvested;
      totEstimated += fin.isSold ? (parseFloat(c.exitPrice) || 0) : (fin.totalInvested + fin.netProfit);

      if (wm.overallGdp > 0) {
        gdpSum += wm.overallGdp;
        gdpCount++;
      }
    });

    const count = filteredBatchAnimals.length;
    const avgEWeight = count > 0 ? (totEntryWeight / count) : 0;
    const avgCWeight = count > 0 ? (totCurrentWeight / count) : 0;
    const avgGain = count > 0 ? (totGain / count) : 0;
    const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
    const avgPurchase = count > 0 ? (totPurchase / count) : 0;
    const costPerKg = totEntryWeight > 0 ? (totPurchase / totEntryWeight) : 0;

    return {
      count,
      totEntryWeight,
      avgEWeight,
      totCurrentWeight,
      avgCWeight,
      totGain,
      avgGain,
      avgGdp,
      totPurchase,
      avgPurchase,
      costPerKg,
      totInvestment,
      totEstimated
    };
  }, [filteredBatchAnimals, weighings]);

  return (
    <div className="space-y-6">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Análisis por Lote & Ingreso</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control de precios de compra, valor por kilo, kilos de entrada, ganancia y promedios por lote de ganado.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {onOpenBatchEntry && (
            <button
              onClick={onOpenBatchEntry}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer min-h-[42px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nuevo Ingreso por Lote</span>
            </button>
          )}

          {onOpenExportImport && (
            <button
              onClick={onOpenExportImport}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition cursor-pointer min-h-[42px]"
              title="Exportar Lotes a Excel"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra Selectora de Lotes (Pestañas / Chips Deslizables) */}
      <div className="custom-card p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seleccionar Lote / Ingreso a Analizar:</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {allBatches.length} {allBatches.length === 1 ? 'lote registrado' : 'lotes registrados'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Chip Consolidado */}
          <button
            onClick={() => setSelectedBatch('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer border ${
              selectedBatch === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📊 Todos los Lotes ({cattle.length} cab)</span>
          </button>

          {/* Chips por cada lote */}
          {batchesStatistics.map((batch) => {
            const isSelected = selectedBatch === batch.batchName;
            return (
              <button
                key={batch.batchName}
                onClick={() => setSelectedBatch(batch.batchName)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                <span>🏷️ {batch.batchName}</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {batch.activeCount} en finca {batch.soldCount > 0 ? `| ${batch.soldCount} v.` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS DEL LOTE SELECCIONADO */}
      {currentBatchData && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">🏷️</span>
              <span>{currentBatchData.batchName}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                🟢 {currentBatchData.activeCount} en finca
              </span>
              {currentBatchData.soldCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  🏷️ {currentBatchData.soldCount} vendidas
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Compra Total del Lote & Precio por Animal */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">
                Compra Total del Lote
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(currentBatchData.totalPurchaseCost)}
              </p>
              <div className="text-xs text-amber-900 dark:text-amber-300 font-extrabold flex items-center gap-1 pt-1 border-t border-amber-200/60 dark:border-amber-700/40">
                <span>Promedio:</span>
                <span>{formatCurrency(currentBatchData.avgPricePerHead)} / animal</span>
              </div>
            </div>

            {/* 2. Valor del Kilo de Compra ($/kg entrada) */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">
                Valor del Kilo Compra ($/kg)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(currentBatchData.costPerEntryKg)}
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300"> / kg</span>
              </p>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium pt-1 border-t border-emerald-200/60 dark:border-emerald-700/40">
                <span>Sobre {formatNumber(currentBatchData.totalEntryWeight, 0)} kg totales de entrada</span>
              </div>
            </div>

            {/* 3. Kilos Promedio por Animal (Entrada vs Actual) */}
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/30 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-400">
                Kilos Promedio por Animal
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatNumber(currentBatchData.avgCurrentWeight, 1)}
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300"> kg actual</span>
              </p>
              <div className="text-xs text-blue-900 dark:text-blue-300 font-extrabold flex items-center justify-between pt-1 border-t border-blue-200/60 dark:border-blue-700/40">
                <span>Entrada: {formatNumber(currentBatchData.avgEntryWeight, 1)} kg</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">+{formatNumber(currentBatchData.avgGainKg, 1)} kg ganados</span>
              </div>
            </div>

            {/* 4. Ganancia de Peso & GDP Promedio */}
            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-pink-500/5 border border-purple-200 dark:border-purple-500/30 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-purple-800 dark:text-purple-400">
                  Desempeño & GDP Lote
                </span>
                {currentBatchData.readyToSellCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                    🎯 {currentBatchData.readyToSellCount} listos
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatNumber(currentBatchData.avgGdp, 3)}
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300"> kg/día</span>
              </p>
              <div className="text-xs text-purple-900 dark:text-purple-300 font-medium flex items-center justify-between pt-1 border-t border-purple-200/60 dark:border-purple-700/40">
                <span>{currentBatchData.avgDays} días en finca</span>
                <span className="font-extrabold">Total: +{formatNumber(currentBatchData.totalGainKg, 0)} kg carne</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TABLA COMPARATIVA RESUMEN ENTRE TODOS LOS LOTES */}
      {selectedBatch === 'all' && batchesStatistics.length > 1 && (
        <div className="custom-card p-5 space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Comparativa General entre Lotes / Ingresos</span>
          </h3>

          <div className="overflow-x-auto border-2 border-slate-900 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[750px]">
              <thead className="bg-emerald-800 text-white uppercase text-[11px] font-black border-b-2 border-slate-900">
                <tr>
                  <th className="p-3 border-r border-emerald-900">Lote / Ingreso #</th>
                  <th className="p-3 border-r border-emerald-900 text-center">Cabezas</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Compra Total ($)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Precio / Animal</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Valor Kilo ($/kg)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Peso Entrada Prom</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Peso Actual Prom</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Ganancia (+kg)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">GDP (kg/día)</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                {batchesStatistics.map((b, idx) => (
                  <tr 
                    key={b.batchName}
                    onClick={() => setSelectedBatch(b.batchName)}
                    className={`hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    <td className="p-3 font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                      🏷️ {b.batchName}
                    </td>
                    <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{b.activeCount} activos</span>
                      {b.soldCount > 0 && <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">({b.soldCount} vendidos)</span>}
                    </td>
                    <td className="p-3 text-right font-black border-r border-slate-300 dark:border-slate-700">
                      {formatCurrency(b.totalPurchaseCost)}
                    </td>
                    <td className="p-3 text-right font-bold border-r border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {formatCurrency(b.avgPricePerHead)}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                      {formatCurrency(b.costPerEntryKg)}/kg
                    </td>
                    <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-semibold">
                      {formatNumber(b.avgEntryWeight, 1)} kg
                    </td>
                    <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                      {formatNumber(b.avgCurrentWeight, 1)} kg
                    </td>
                    <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-emerald-600 dark:text-emerald-400">
                      +{formatNumber(b.avgGainKg, 1)} kg
                    </td>
                    <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-bold">
                      {formatNumber(b.avgGdp, 3)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatch(b.batchName);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                      >
                        Ver Detalle →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLA DETALLADA ANIMAL POR ANIMAL CON BORDES DEFINIDOS */}
      <div className="custom-card p-5 space-y-4">
        
        {/* Cabecera de la Tabla & Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Listado de Animales ({filteredBatchAnimals.length} registros)</span>
            </h3>
            {selectedBatch !== 'all' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Lote: {selectedBatch}
              </span>
            )}
          </div>

          {/* Filtro Rápido de Estado */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({currentBatchData?.headCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('Activo')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'Activo' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🟢 En Finca ({currentBatchData?.activeCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('Vendido')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'Vendido' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🏷️ Vendidos ({currentBatchData?.soldCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('ready480')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'ready480' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🎯 ≥480kg ({currentBatchData?.readyToSellCount || 0})
            </button>
          </div>
        </div>

        {/* Buscador dentro del lote */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en este lote por arete, nombre, hierro, raza o dueño..."
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabla Detallada con Bordes Negros Nítidos */}
        {filteredBatchAnimals.length > 0 ? (
          <div className="overflow-x-auto border-2 border-slate-900 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[900px]">
              <thead className="bg-emerald-800 text-white uppercase text-[11px] font-black border-b-2 border-slate-900">
                <tr>
                  <th className="p-3 border-r border-emerald-900">Arete / Chapa</th>
                  <th className="p-3 border-r border-emerald-900">Nombre / Hierro</th>
                  <th className="p-3 border-r border-emerald-900">Lote</th>
                  <th className="p-3 border-r border-emerald-900">Estado</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Kilos Entrada</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Kilos Actuales</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Ganancia (+kg)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">GDP (kg/d)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Precio Compra ($)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Valor Kilo ($/kg)</th>
                  <th className="p-3 border-r border-emerald-900 text-right">Inversión Total ($)</th>
                  <th className="p-3 text-right">Valor Estimado ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-700 font-medium">
                {filteredBatchAnimals.map((animal, idx) => {
                  const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
                  const wm = calculateWeightMetrics(animal, animalWeighs);
                  const fin = calculateFinancials(animal);

                  const entryWeight = parseFloat(animal.entryWeight) || 0;
                  const entryPrice = parseFloat(animal.entryPrice) || 0;
                  const costPerKg = entryWeight > 0 ? (entryPrice / entryWeight) : 0;
                  const isSold = animal.status === 'Vendido';
                  const isDead = animal.status === 'Muerto';

                  // Fila diferenciada para animales vendidos o muertos
                  const rowBg = isSold 
                    ? 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200' 
                    : isDead
                    ? 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200'
                    : idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/60';

                  return (
                    <tr 
                      key={animal.id}
                      onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                      className={`${rowBg} hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition`}
                    >
                      {/* Arete */}
                      <td className="p-3 font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">{animal.tagNumber}</span>
                      </td>

                      {/* Nombre / Hierro */}
                      <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <div className="font-bold">{animal.name || '-'}</div>
                        {animal.ironBrand && <div className="text-[10px] text-slate-500 dark:text-slate-400">Hierro: {animal.ironBrand}</div>}
                      </td>

                      {/* Lote */}
                      <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap font-bold text-slate-600 dark:text-slate-400">
                        {animal.entryBatch || animal.paddock || 'Ingreso #1'}
                      </td>

                      {/* Estado */}
                      <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {isSold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border border-amber-300">
                            🏷️ Vendido
                          </span>
                        ) : isDead ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 border border-rose-300">
                            💀 Baja
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            🟢 En Finca
                          </span>
                        )}
                      </td>

                      {/* Kilos Entrada */}
                      <td className="p-3 text-right font-bold border-r border-slate-300 dark:border-slate-700">
                        {entryWeight > 0 ? `${formatNumber(entryWeight, 1)} kg` : '-'}
                      </td>

                      {/* Kilos Actuales */}
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                        {formatNumber(wm.currentWeight, 1)} kg
                      </td>

                      {/* Ganancia Kilos */}
                      <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                        +{formatNumber(wm.totalGain, 1)} kg
                      </td>

                      {/* GDP */}
                      <td className="p-3 text-right font-bold border-r border-slate-300 dark:border-slate-700">
                        {formatNumber(wm.overallGdp, 3)}
                      </td>

                      {/* Precio Compra Animal */}
                      <td className="p-3 text-right font-black border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {formatCurrency(entryPrice)}
                      </td>

                      {/* Valor Kilo Compra ($/kg) */}
                      <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {costPerKg > 0 ? `${formatCurrency(costPerKg)}/kg` : '-'}
                      </td>

                      {/* Inversión Total */}
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {formatCurrency(fin.totalInvested)}
                      </td>

                      {/* Valor Estimado / Venta */}
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {isSold ? formatCurrency(animal.exitPrice) : formatCurrency(fin.totalInvested + fin.netProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* PIE DE TABLA CON TOTALES Y PROMEDIOS EXACTOS */}
              <tfoot className="bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-black border-t-2 border-slate-900 text-[11px]">
                <tr>
                  <td colSpan={4} className="p-3 border-r border-slate-900">
                    📊 TOTALES / PROMEDIOS ({tableSummary.count} cabezas filtradas)
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 whitespace-nowrap">
                    <div>{formatNumber(tableSummary.totEntryWeight, 1)} kg</div>
                    <div className="text-[10px] font-normal text-slate-700 dark:text-slate-300">Prom: {formatNumber(tableSummary.avgEWeight, 1)} kg</div>
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 whitespace-nowrap">
                    <div>{formatNumber(tableSummary.totCurrentWeight, 1)} kg</div>
                    <div className="text-[10px] font-normal text-slate-700 dark:text-slate-300">Prom: {formatNumber(tableSummary.avgCWeight, 1)} kg</div>
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                    <div>+{formatNumber(tableSummary.totGain, 1)} kg</div>
                    <div className="text-[10px] font-normal">Prom: +{formatNumber(tableSummary.avgGain, 1)} kg</div>
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 whitespace-nowrap">
                    {formatNumber(tableSummary.avgGdp, 3)}
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 whitespace-nowrap">
                    <div>{formatCurrency(tableSummary.totPurchase)}</div>
                    <div className="text-[10px] font-normal text-slate-700 dark:text-slate-300">Prom: {formatCurrency(tableSummary.avgPurchase)}</div>
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 text-emerald-900 dark:text-emerald-300 whitespace-nowrap">
                    {formatCurrency(tableSummary.costPerKg)}/kg
                  </td>
                  <td className="p-3 text-right border-r border-slate-900 whitespace-nowrap">
                    {formatCurrency(tableSummary.totInvestment)}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {formatCurrency(tableSummary.totEstimated)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <p className="text-sm font-bold">No se encontraron animales con los filtros seleccionados.</p>
          </div>
        )}

      </div>

    </div>
  );
}
