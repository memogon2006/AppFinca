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
  Boxes,
  ArrowRightLeft,
  Flame,
  Zap,
  Check,
  BarChart3
} from 'lucide-react';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate,
  calculateWeightMetrics, 
  calculateFinancials 
} from '../../services/calculations';
import { exportBatchComparisonExcel } from '../../services/batchExcelService';
import { useAuth } from '../../context/AuthContext';
import { FileSpreadsheet } from 'lucide-react';

export function BatchAnalyticsView({
  cattle = [],
  weighings = [],
  onSelectAnimal,
  onOpenBatchEntry,
  onOpenNewAnimal,
  onOpenExportImport
}) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('detail'); // 'detail' | 'compare'
  const [selectedBatch, setSelectedBatch] = useState('all'); // 'all' o nombre del lote
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Activo'); // 'Activo' (predeterminado) | 'all' | 'Vendido' | 'ready480'
  const [exportingExcel, setExportingExcel] = useState(false);

  // Estados para el Comparador de Lotes
  const [comparedBatches, setComparedBatches] = useState([]); // Array con los nombres de lotes seleccionados

  const handleDownloadComparisonExcel = () => {
    try {
      setExportingExcel(true);
      exportBatchComparisonExcel(cattle, weighings, currentUser?.farmName || 'Mi Finca');
    } catch (err) {
      alert('Error al exportar Excel de Comparativa: ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

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

  // Inicializar lotes a comparar si está vacío
  useMemo(() => {
    if (comparedBatches.length === 0 && allBatches.length > 0) {
      setComparedBatches(allBatches.slice(0, 3));
    }
  }, [allBatches, comparedBatches.length]);

  // Lote actualmente enfocado para métricas de detalle
  const currentBatchData = useMemo(() => {
    if (selectedBatch === 'all') {
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

  // Datos filtrados para el Comparador de Lotes
  const selectedBatchesForComparison = useMemo(() => {
    if (comparedBatches.length === 0) return batchesStatistics;
    return batchesStatistics.filter(b => comparedBatches.includes(b.batchName));
  }, [comparedBatches, batchesStatistics]);

  // Medallas de eficiencia en la comparativa
  const bestPurchaseBatch = useMemo(() => {
    const valid = batchesStatistics.filter(b => b.costPerEntryKg > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => cur.costPerEntryKg < best.costPerEntryKg ? cur : best, valid[0]);
  }, [batchesStatistics]);

  const bestGdpBatch = useMemo(() => {
    const valid = batchesStatistics.filter(b => b.avgGdp > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => cur.avgGdp > best.avgGdp ? cur : best, valid[0]);
  }, [batchesStatistics]);

  const bestGainBatch = useMemo(() => {
    const valid = batchesStatistics.filter(b => b.avgGainKg > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => cur.avgGainKg > best.avgGainKg ? cur : best, valid[0]);
  }, [batchesStatistics]);

  const toggleBatchComparison = (batchName) => {
    setComparedBatches(prev => {
      if (prev.includes(batchName)) {
        if (prev.length === 1) return prev; // Mantener al menos 1
        return prev.filter(name => name !== batchName);
      } else {
        return [...prev, batchName];
      }
    });
  };

  const selectAllForComparison = () => {
    setComparedBatches(allBatches);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Análisis & Comparador por Lote / Ingreso</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control de valor compra total de los animales, precio por animal, valor del kilo ($/kg), kilos promedio y comparativa cara a cara entre lotes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={handleDownloadComparisonExcel}
            disabled={exportingExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 shadow-sm transition cursor-pointer min-h-[42px]"
            title="Descargar Comparativa de Lotes con Gráfica en Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{exportingExcel ? 'Generando Excel...' : '📊 Comparativa Excel (Gráfica)'}</span>
          </button>

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
              title="Exportar Todos los Lotes a Excel"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exportar Todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas: Vista Individual vs Comparador */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'detail'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Detalle & Tabla por Lote</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {allBatches.length} {allBatches.length === 1 ? 'lote' : 'lotes'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'compare'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>⚖️ Comparar Lotes Cara a Cara</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            Comparador Pro
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DETALLE POR LOTE / INGRESO INDIVIDUAL (KPIs & TABLA DETALLADA) */}
      {/* ========================================================================= */}
      {activeTab === 'detail' && (
        <div className="space-y-6">
          
          {/* Barra Selectora de Lotes (Chips Deslizables) */}
          <div className="custom-card p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Seleccionar Lote / Ingreso a Analizar:</span>
              </span>
              <button
                onClick={() => setActiveTab('compare')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Comparar con otros lotes</span>
                <ArrowRightLeft className="w-3 h-3" />
              </button>
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
                
                {/* 1. Valor Compra Total de los Animales & Precio por Animal */}
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm space-y-1">
                  <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">
                    Valor Compra Total de los Animales
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
                          <td className="p-3 font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            <span className="text-emerald-700 dark:text-emerald-400 font-black">{animal.tagNumber}</span>
                          </td>

                          <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            <div className="font-bold">{animal.name || '-'}</div>
                            {animal.ironBrand && <div className="text-[10px] text-slate-500 dark:text-slate-400">Hierro: {animal.ironBrand}</div>}
                          </td>

                          <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap font-bold text-slate-600 dark:text-slate-400">
                            {animal.entryBatch || animal.paddock || 'Ingreso #1'}
                          </td>

                          <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {isSold ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                                🏷️ Vendido
                              </span>
                            ) : isDead ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300">
                                💀 Baja
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                🟢 En Finca
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right font-bold border-r border-slate-300 dark:border-slate-700">
                            {entryWeight > 0 ? `${formatNumber(entryWeight, 1)} kg` : '-'}
                          </td>

                          <td className="p-3 text-right font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                            {formatNumber(wm.currentWeight, 1)} kg
                          </td>

                          <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                            +{formatNumber(wm.totalGain, 1)} kg
                          </td>

                          <td className="p-3 text-right font-bold border-r border-slate-300 dark:border-slate-700">
                            {formatNumber(wm.overallGdp, 3)}
                          </td>

                          <td className="p-3 text-right font-black border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {formatCurrency(entryPrice)}
                          </td>

                          <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {costPerKg > 0 ? `${formatCurrency(costPerKg)}/kg` : '-'}
                          </td>

                          <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {formatCurrency(fin.totalInvested)}
                          </td>

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
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: COMPARADOR EJECUTIVO ENTRE LOTES / INGRESOS (CORTO & CONCISO)   */}
      {/* ========================================================================= */}
      {activeTab === 'compare' && (
        <div className="space-y-5">
          
          {/* Selector Rápido de Lotes a Comparar */}
          <div className="custom-card p-4 space-y-3 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Comparador Rápido de Precios, Rendimiento & Tiempo</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona los lotes a contrastar cara a cara en inversión de compra, ganancia de peso y días en predio.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadComparisonExcel}
                  disabled={exportingExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Descargar este análisis y gráficas en Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{exportingExcel ? 'Descargando...' : '📊 Descargar Excel con Gráficas'}</span>
                </button>

                <button
                  onClick={selectAllForComparison}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black hover:bg-indigo-100 transition cursor-pointer"
                >
                  Seleccionar Todos ({allBatches.length})
                </button>
              </div>
            </div>

            {/* Chips de Selección Rápida */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              {batchesStatistics.map((b) => {
                const isChecked = comparedBatches.length === 0 || comparedBatches.includes(b.batchName);
                return (
                  <button
                    key={b.batchName}
                    type="button"
                    onClick={() => toggleBatchComparison(b.batchName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 border cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                      isChecked ? 'bg-white text-indigo-600 border-white' : 'border-slate-400 bg-transparent'
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>🏷️ {b.batchName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isChecked ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {b.headCount} cab
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUADRO SINTÉTICO DE MEJORES RENDIMIENTOS (MINI DESTACADOS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bestPurchaseBatch && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mejor Precio Kilo Compra</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    🏷️ {bestPurchaseBatch.batchName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(bestPurchaseBatch.costPerEntryKg)}/kg
                  </div>
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">
                    {formatCurrency(bestPurchaseBatch.avgPricePerHead)}/cab
                  </div>
                </div>
              </div>
            )}

            {bestGdpBatch && (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-purple-800 dark:text-purple-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mayor Rendimiento (GDP)</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    🏷️ {bestGdpBatch.batchName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-purple-700 dark:text-purple-300">
                    {formatNumber(bestGdpBatch.avgGdp, 3)} kg/d
                  </div>
                  <div className="text-[10px] text-purple-800 dark:text-purple-400 font-bold">
                    +{formatNumber(bestGdpBatch.avgGainKg, 1)} kg ganados
                  </div>
                </div>
              </div>
            )}

            {bestGainBatch && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-blue-800 dark:text-blue-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Más Carne Ganada / Cabeza</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    🏷️ {bestGainBatch.batchName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-blue-700 dark:text-blue-300">
                    +{formatNumber(bestGainBatch.avgGainKg, 1)} kg/cab
                  </div>
                  <div className="text-[10px] text-blue-800 dark:text-blue-400 font-bold">
                    Total: +{formatNumber(bestGainBatch.totalGainKg, 0)} kg
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TABLA COMPARATIVA SINTÉTICA (PRECIOS, RENDIMIENTOS, TIEMPO, VALOR DE COMPRA) */}
          <div className="custom-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Tabla Comparativa de Precios, Rendimiento & Tiempo</span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {selectedBatchesForComparison.length} {selectedBatchesForComparison.length === 1 ? 'lote' : 'lotes'}
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-slate-900 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[900px]">
                <thead className="bg-slate-900 text-white uppercase text-[11px] font-black border-b-2 border-slate-900">
                  <tr>
                    <th className="p-3 border-r border-slate-800">Lote / Ingreso</th>
                    <th className="p-3 border-r border-slate-800 text-center">Cabezas</th>
                    <th className="p-3 border-r border-slate-800 text-right bg-amber-950/60 text-amber-200">Valor Compra Total ($)</th>
                    <th className="p-3 border-r border-slate-800 text-right bg-amber-950/60 text-amber-200">Precio / Animal</th>
                    <th className="p-3 border-r border-slate-800 text-right bg-emerald-950/60 text-emerald-200">Valor Kilo ($/kg)</th>
                    <th className="p-3 border-r border-slate-800 text-right">Kilos Entrada</th>
                    <th className="p-3 border-r border-slate-800 text-right font-black">Kilos Actual</th>
                    <th className="p-3 border-r border-slate-800 text-right bg-blue-950/60 text-blue-200">Ganancia (+kg)</th>
                    <th className="p-3 border-r border-slate-800 text-right bg-purple-950/60 text-purple-200">Rendimiento (GDP)</th>
                    <th className="p-3 border-r border-slate-800 text-center">Tiempo en Finca</th>
                    <th className="p-3 border-r border-slate-800 text-center">Listos ≥480kg</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700 font-medium">
                  {selectedBatchesForComparison.map((b, idx) => (
                    <tr 
                      key={b.batchName}
                      className={`hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      {/* Lote */}
                      <td className="p-3 font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-600 dark:text-indigo-400">🏷️</span>
                          <span>{b.batchName}</span>
                        </div>
                      </td>

                      {/* Cabezas */}
                      <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{b.activeCount} en finca</span>
                        {b.soldCount > 0 && <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">({b.soldCount} v.)</span>}
                      </td>

                      {/* Valor de Compra Total */}
                      <td className="p-3 text-right font-black text-amber-950 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {formatCurrency(b.totalPurchaseCost)}
                      </td>

                      {/* Precio Promedio por Animal */}
                      <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {formatCurrency(b.avgPricePerHead)}
                      </td>

                      {/* Valor del Kilo Entrada ($/kg) */}
                      <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {formatCurrency(b.costPerEntryKg)}/kg
                      </td>

                      {/* Kilos Entrada Promedio */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap">
                        {formatNumber(b.avgEntryWeight, 1)} kg
                      </td>

                      {/* Kilos Actual Promedio */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatNumber(b.avgCurrentWeight, 1)} kg
                      </td>

                      {/* Ganancia de Carne Promedio */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 whitespace-nowrap">
                        +{formatNumber(b.avgGainKg, 1)} kg/cab
                      </td>

                      {/* Rendimiento (GDP kg/día) */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 whitespace-nowrap">
                        {formatNumber(b.avgGdp, 3)} kg/d
                      </td>

                      {/* Tiempo en Finca */}
                      <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{b.avgDays} días</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Desde {b.earliestDate === 'Todas las fechas' || b.earliestDate === 'N/A' ? b.earliestDate : formatDate(b.earliestDate)}</span>
                      </td>

                      {/* Listos ≥ 480 kg */}
                      <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {b.readyToSellCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300">
                            🎯 {b.readyToSellCount} listos
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-bold">0</span>
                        )}
                      </td>

                      {/* Acción Ver Detalle */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedBatch(b.batchName);
                            setActiveTab('detail');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition cursor-pointer shadow-sm"
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

          {/* TARJETAS RESUMEN CARA A CARA (DISEÑO COMPACTO Y CONCISO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {selectedBatchesForComparison.map((b) => (
              <div 
                key={b.batchName}
                className="custom-card p-4 space-y-3 border-2 border-slate-300 dark:border-slate-700 shadow-sm"
              >
                {/* Header Compacto */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-base text-slate-900 dark:text-white">
                      <span>🏷️</span>
                      <span>{b.batchName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      ⏱️ <span className="font-bold text-slate-700 dark:text-slate-300">{b.avgDays} días en finca</span> • Desde {b.earliestDate === 'Todas las fechas' || b.earliestDate === 'N/A' ? b.earliestDate : formatDate(b.earliestDate)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      {b.headCount} cabezas
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {b.activeCount} en finca {b.soldCount > 0 ? `• ${b.soldCount} v.` : ''}
                    </div>
                  </div>
                </div>

                {/* Bloque 1: Precios & Valor de Compra */}
                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor de Compra & Precios:</span>
                    <span className="font-black text-xs text-amber-950 dark:text-amber-300">{formatCurrency(b.totalPurchaseCost)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Precio / Animal:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(b.avgPricePerHead)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Valor del Kilo:</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(b.costPerEntryKg)}/kg</span>
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Rendimientos & Peso */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> Rendimiento de Peso & GDP:</span>
                    <span className="font-black text-xs text-purple-700 dark:text-purple-400">{formatNumber(b.avgGdp, 3)} kg/día</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs pt-1 border-t border-blue-200/60 dark:border-blue-800/40 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Entrada Prom:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(b.avgEntryWeight, 1)} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Actual Prom:</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatNumber(b.avgCurrentWeight, 1)} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Ganancia:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">+{formatNumber(b.avgGainKg, 1)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Footer del Lote con Acción Rápida */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                    {b.readyToSellCount > 0 ? (
                      <span className="text-purple-700 dark:text-purple-300 font-black">🎯 {b.readyToSellCount} listos (≥480kg)</span>
                    ) : (
                      <span>En etapa de ceba</span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBatch(b.batchName);
                      setActiveTab('detail');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Ver Animales</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
