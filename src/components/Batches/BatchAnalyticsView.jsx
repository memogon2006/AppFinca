import React, { useState, useMemo, useEffect } from 'react';
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
  BarChart3,
  PackagePlus,
  MessageCircle,
  Dna,
  UserCheck,
  Target,
  FileSpreadsheet,
  CheckSquare,
  Square,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate,
  calculateWeightMetrics, 
  calculateFinancials 
} from '../../services/calculations';
import { exportBatchComparisonExcel, getAnimalGroupKey } from '../../services/batchExcelService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Criterios de Comparación Disponibles
const COMPARISON_CRITERIA = [
  { id: 'batch', label: 'Lote / Ingreso', icon: '🏷️', LucideIcon: Boxes, shortLabel: 'Lote' },
  { id: 'breed', label: 'Raza', icon: '🧬', LucideIcon: Dna, shortLabel: 'Raza' },
  { id: 'owner', label: 'Dueño / Marca', icon: '👤', LucideIcon: UserCheck, shortLabel: 'Dueño/Hierro' },
  { id: 'productionType', label: 'Tipo de Producción', icon: '🎯', LucideIcon: Target, shortLabel: 'Propósito' },
  { id: 'category', label: 'Categoría / Etapa', icon: '🐄', LucideIcon: Layers, shortLabel: 'Categoría' },
];

export function BatchAnalyticsView({
  cattle = [],
  weighings = [],
  onSelectAnimal,
  onOpenBatchEntry,
  onOpenNewAnimal,
  onOpenExportImport,
  onOpenWhatsAppReport
}) {
  const { currentUser, isWorker } = useAuth();
  const { isDark } = useTheme();
  
  // Pestaña Activa: 'detail' (Detalle individual) | 'compare' (Comparador Multi-criterio)
  const [activeTab, setActiveTab] = useState('detail');
  
  // Criterio de Agrupación / Comparación Activo
  const [comparisonCriterion, setComparisonCriterion] = useState('batch'); // 'batch' | 'breed' | 'owner' | 'productionType' | 'category'
  
  // Grupo seleccionado para la vista de detalle ('all' o nombre del grupo)
  const [selectedGroupDetail, setSelectedGroupDetail] = useState('all');
  
  // Grupos seleccionados para el Comparador (Array de nombres para multi-selección)
  const [comparedGroups, setComparedGroups] = useState([]);
  
  // Estado para la métrica activa en las gráficas comparativas
  const [comparisonMetricMode, setComparisonMetricMode] = useState('gdp'); // 'gdp' | 'weights' | 'gain' | 'heads' | 'costKg'
  const [economicMetricMode, setEconomicMetricMode] = useState('costKg'); // 'costKg' | 'totalPurchase'

  // Filtros de búsqueda y estado
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Activo'); // 'Activo' (predeterminado) | 'all' | 'Vendido' | 'ready480'
  const [exportingExcel, setExportingExcel] = useState(false);

  // Información del criterio activo
  const activeCriterionInfo = useMemo(() => {
    return COMPARISON_CRITERIA.find(c => c.id === comparisonCriterion) || COMPARISON_CRITERIA[0];
  }, [comparisonCriterion]);

  // Obtener lista única de grupos para el criterio activo
  const allGroups = useMemo(() => {
    const set = new Set(cattle.map(c => getAnimalGroupKey(c, comparisonCriterion)).filter(Boolean));
    const list = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return list.length > 0 ? list : ['General'];
  }, [cattle, comparisonCriterion]);

  // Sincronizar grupos seleccionados para el comparador cuando cambia el criterio
  useEffect(() => {
    if (allGroups.length > 0) {
      setComparedGroups(prev => {
        const valid = prev.filter(g => allGroups.includes(g));
        if (valid.length > 0) return valid;
        return allGroups;
      });
    }
  }, [allGroups, comparisonCriterion]);

  // Manejador de exportación a Excel con el criterio activo
  const handleDownloadComparisonExcel = () => {
    try {
      setExportingExcel(true);
      exportBatchComparisonExcel(cattle, weighings, currentUser?.farmName || 'Mi Finca', comparisonCriterion);
    } catch (err) {
      alert('Error al exportar Excel de Comparativa: ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  // Cálculos consolidados por cada grupo del criterio activo
  const groupsStatistics = useMemo(() => {
    return allGroups.map(groupName => {
      const groupAnimals = cattle.filter(c => getAnimalGroupKey(c, comparisonCriterion) === groupName);
      const headCount = groupAnimals.length;
      const activeAnimals = groupAnimals.filter(c => c.status === 'Activo');
      const soldAnimals = groupAnimals.filter(c => c.status === 'Vendido');
      const deadAnimals = groupAnimals.filter(c => c.status === 'Muerto');

      // Fechas
      const dates = groupAnimals.map(c => c.entryDate).filter(Boolean).sort();
      const earliestDate = dates[0] || 'N/A';

      // Totales de Compra y Entrada
      let totalPurchaseCost = 0;
      let activePurchaseCost = 0;
      let soldPurchaseCost = 0;
      let totalAdditionalCosts = 0;
      let activeAdditionalCosts = 0;
      let totalEntryWeight = 0;
      let activeEntryWeight = 0;
      let soldEntryWeight = 0;
      let countWithEntryWeight = 0;
      let activeCountWithEntryWeight = 0;
      let soldCountWithEntryWeight = 0;
      let countWithEntryPrice = 0;
      let activeCountWithEntryPrice = 0;

      // Totales de Biomasa Actual y Ganancia
      let totalCurrentWeight = 0;
      let totalGainKg = 0;
      let gdpSum = 0;
      let gdpCount = 0;
      let totalDaysSum = 0;
      let activeDaysSum = 0;
      let soldDaysSum = 0;
      let readyToSellCount = 0;

      // Totales de Salida / Ventas
      let totalSalesRevenue = 0;
      let totalSoldWeight = 0;
      let totalProfitRealized = 0;

      groupAnimals.forEach(animal => {
        const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
        const wm = calculateWeightMetrics(animal, animalWeighs);
        const fin = calculateFinancials(animal);

        const entryPrice = parseFloat(animal.entryPrice) || 0;
        const addCost = parseFloat(animal.additionalCosts) || 0;
        const entryWeight = parseFloat(animal.entryWeight) || 0;
        const isActive = animal.status === 'Activo';
        const isSold = animal.status === 'Vendido';

        totalPurchaseCost += entryPrice;
        totalAdditionalCosts += addCost;
        if (entryPrice > 0) countWithEntryPrice++;

        if (entryWeight > 0) {
          totalEntryWeight += entryWeight;
          countWithEntryWeight++;
        }

        if (isActive) {
          activePurchaseCost += entryPrice;
          activeAdditionalCosts += addCost;
          if (entryPrice > 0) activeCountWithEntryPrice++;
          if (entryWeight > 0) {
            activeEntryWeight += entryWeight;
            activeCountWithEntryWeight++;
          }
          totalCurrentWeight += wm.currentWeight;
          if (wm.currentWeight >= 480) readyToSellCount++;
          activeDaysSum += wm.totalDays;
        }

        totalGainKg += wm.totalGain > 0 ? wm.totalGain : 0;
        if (wm.overallGdp > 0) {
          gdpSum += wm.overallGdp;
          gdpCount++;
        }
        totalDaysSum += wm.totalDays;

        if (isSold) {
          soldPurchaseCost += entryPrice;
          if (entryWeight > 0) {
            soldEntryWeight += entryWeight;
            soldCountWithEntryWeight++;
          }
          totalSalesRevenue += parseFloat(animal.exitPrice) || 0;
          totalSoldWeight += parseFloat(animal.exitWeight) || 0;
          totalProfitRealized += fin.netProfit;
          soldDaysSum += wm.totalDays;
        }
      });

      const totalInvestment = totalPurchaseCost + totalAdditionalCosts;
      const activeInvestment = activePurchaseCost + activeAdditionalCosts;
      const avgPricePerHead = headCount > 0 ? (totalPurchaseCost / headCount) : 0;
      const activeAvgPricePerHead = activeAnimals.length > 0 ? (activePurchaseCost / activeAnimals.length) : 0;
      const soldAvgPricePerHead = soldAnimals.length > 0 ? (soldPurchaseCost / soldAnimals.length) : 0;
      const avgEntryWeight = countWithEntryWeight > 0 ? (totalEntryWeight / countWithEntryWeight) : 0;
      const activeAvgEntryWeight = activeCountWithEntryWeight > 0 ? (activeEntryWeight / activeCountWithEntryWeight) : 0;
      const soldAvgEntryWeight = soldCountWithEntryWeight > 0 ? (soldEntryWeight / soldCountWithEntryWeight) : 0;
      const avgCurrentWeight = activeAnimals.length > 0 ? (totalCurrentWeight / activeAnimals.length) : 0;
      const avgGainKg = headCount > 0 ? (totalGainKg / headCount) : 0;
      const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
      
      const activeAvgDays = activeAnimals.length > 0 ? Math.round(activeDaysSum / activeAnimals.length) : 0;
      const soldAvgDays = soldAnimals.length > 0 ? Math.round(soldDaysSum / soldAnimals.length) : 0;
      const avgDays = activeAnimals.length > 0 ? activeAvgDays : (headCount > 0 ? Math.round(totalDaysSum / headCount) : 0);

      // Valor del Kilo de Compra ($/kg entrada)
      const costPerEntryKg = totalEntryWeight > 0 ? (totalPurchaseCost / totalEntryWeight) : 0;
      const activeCostPerEntryKg = activeEntryWeight > 0 ? (activePurchaseCost / activeEntryWeight) : costPerEntryKg;
      const soldCostPerEntryKg = soldEntryWeight > 0 ? (soldPurchaseCost / soldEntryWeight) : 0;
      
      // Valor del Kilo de Venta ($/kg salida)
      const avgSoldPricePerKg = totalSoldWeight > 0 ? (totalSalesRevenue / totalSoldWeight) : 0;
      const soldAvgExitWeight = soldAnimals.length > 0 ? (totalSoldWeight / soldAnimals.length) : 0;

      return {
        groupName,
        criterion: comparisonCriterion,
        headCount,
        activeCount: activeAnimals.length,
        soldCount: soldAnimals.length,
        deadCount: deadAnimals.length,
        earliestDate,
        totalPurchaseCost,
        activePurchaseCost,
        soldPurchaseCost,
        totalAdditionalCosts,
        activeAdditionalCosts,
        totalInvestment,
        activeInvestment,
        avgPricePerHead,
        activeAvgPricePerHead,
        soldAvgPricePerHead,
        totalEntryWeight,
        activeEntryWeight,
        soldEntryWeight,
        avgEntryWeight,
        activeAvgEntryWeight,
        soldAvgEntryWeight,
        totalCurrentWeight,
        avgCurrentWeight,
        totalGainKg,
        avgGainKg,
        avgGdp,
        avgDays,
        costPerEntryKg,
        activeCostPerEntryKg,
        soldCostPerEntryKg,
        readyToSellCount,
        totalSalesRevenue,
        totalSoldWeight,
        avgSoldPricePerKg,
        soldAvgExitWeight,
        totalProfitRealized,
        animals: groupAnimals
      };
    });
  }, [allGroups, cattle, weighings, comparisonCriterion]);

  // Grupo actualmente enfocado para métricas de detalle
  const currentGroupData = useMemo(() => {
    if (selectedGroupDetail === 'all') {
      const headCount = cattle.length;
      const activeAnimals = cattle.filter(c => c.status === 'Activo');
      const soldAnimals = cattle.filter(c => c.status === 'Vendido');
      const deadAnimals = cattle.filter(c => c.status === 'Muerto');

      let totalPurchaseCost = 0;
      let activePurchaseCost = 0;
      let soldPurchaseCost = 0;
      let totalAdditionalCosts = 0;
      let activeAdditionalCosts = 0;
      let totalEntryWeight = 0;
      let activeEntryWeight = 0;
      let soldEntryWeight = 0;
      let countWithEntryWeight = 0;
      let activeCountWithEntryWeight = 0;
      let soldCountWithEntryWeight = 0;
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
        const isActive = animal.status === 'Activo';
        const isSold = animal.status === 'Vendido';

        totalPurchaseCost += entryPrice;
        totalAdditionalCosts += addCost;

        if (entryWeight > 0) {
          totalEntryWeight += entryWeight;
          countWithEntryWeight++;
        }

        if (isActive) {
          activePurchaseCost += entryPrice;
          activeAdditionalCosts += addCost;
          if (entryWeight > 0) {
            activeEntryWeight += entryWeight;
            activeCountWithEntryWeight++;
          }
          totalCurrentWeight += wm.currentWeight;
          if (wm.currentWeight >= 480) readyToSellCount++;
        }

        totalGainKg += wm.totalGain > 0 ? wm.totalGain : 0;
        if (wm.overallGdp > 0) {
          gdpSum += wm.overallGdp;
          gdpCount++;
        }
        totalDaysSum += wm.totalDays;

        if (isSold) {
          soldPurchaseCost += entryPrice;
          if (entryWeight > 0) {
            soldEntryWeight += entryWeight;
            soldCountWithEntryWeight++;
          }
          totalSalesRevenue += parseFloat(animal.exitPrice) || 0;
          totalSoldWeight += parseFloat(animal.exitWeight) || 0;
          totalProfitRealized += fin.netProfit;
        }
      });

      const totalInvestment = totalPurchaseCost + totalAdditionalCosts;
      const activeInvestment = activePurchaseCost + activeAdditionalCosts;
      const avgPricePerHead = headCount > 0 ? (totalPurchaseCost / headCount) : 0;
      const activeAvgPricePerHead = activeAnimals.length > 0 ? (activePurchaseCost / activeAnimals.length) : 0;
      const soldAvgPricePerHead = soldAnimals.length > 0 ? (soldPurchaseCost / soldAnimals.length) : 0;
      const avgEntryWeight = countWithEntryWeight > 0 ? (totalEntryWeight / countWithEntryWeight) : 0;
      const activeAvgEntryWeight = activeCountWithEntryWeight > 0 ? (activeEntryWeight / activeCountWithEntryWeight) : 0;
      const soldAvgEntryWeight = soldCountWithEntryWeight > 0 ? (soldEntryWeight / soldCountWithEntryWeight) : 0;
      const avgCurrentWeight = activeAnimals.length > 0 ? (totalCurrentWeight / activeAnimals.length) : 0;
      const avgGainKg = headCount > 0 ? (totalGainKg / headCount) : 0;
      const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
      const avgDays = headCount > 0 ? Math.round(totalDaysSum / headCount) : 0;
      const costPerEntryKg = totalEntryWeight > 0 ? (totalPurchaseCost / totalEntryWeight) : 0;
      const activeCostPerEntryKg = activeEntryWeight > 0 ? (activePurchaseCost / activeEntryWeight) : costPerEntryKg;
      const soldCostPerEntryKg = soldEntryWeight > 0 ? (soldPurchaseCost / soldEntryWeight) : 0;
      const avgSoldPricePerKg = totalSoldWeight > 0 ? (totalSalesRevenue / totalSoldWeight) : 0;
      const soldAvgExitWeight = soldAnimals.length > 0 ? (totalSoldWeight / soldAnimals.length) : 0;

      return {
        groupName: `Todos los Registros (${activeCriterionInfo.label})`,
        headCount,
        activeCount: activeAnimals.length,
        soldCount: soldAnimals.length,
        deadCount: deadAnimals.length,
        earliestDate: 'Todas las fechas',
        totalPurchaseCost,
        activePurchaseCost,
        soldPurchaseCost,
        totalAdditionalCosts,
        activeAdditionalCosts,
        totalInvestment,
        activeInvestment,
        avgPricePerHead,
        activeAvgPricePerHead,
        soldAvgPricePerHead,
        totalEntryWeight,
        activeEntryWeight,
        soldEntryWeight,
        avgEntryWeight,
        activeAvgEntryWeight,
        soldAvgEntryWeight,
        totalCurrentWeight,
        avgCurrentWeight,
        totalGainKg,
        avgGainKg,
        avgGdp,
        avgDays,
        costPerEntryKg,
        activeCostPerEntryKg,
        soldCostPerEntryKg,
        readyToSellCount,
        totalSalesRevenue,
        totalSoldWeight,
        avgSoldPricePerKg,
        soldAvgExitWeight,
        totalProfitRealized,
        animals: cattle
      };
    }

    return groupsStatistics.find(g => g.groupName === selectedGroupDetail) || groupsStatistics[0] || null;
  }, [selectedGroupDetail, groupsStatistics, cattle, weighings, activeCriterionInfo]);

  // Lista de animales filtrados para la tabla detallada
  const filteredGroupAnimals = useMemo(() => {
    let list = selectedGroupDetail === 'all' 
      ? cattle 
      : cattle.filter(c => getAnimalGroupKey(c, comparisonCriterion) === selectedGroupDetail);

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
        const color = (c.color || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const prod = (c.productionType || '').toLowerCase();
        const batch = (c.entryBatch || c.paddock || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || brand.includes(q) || owner.includes(q) || breed.includes(q) || color.includes(q) || cat.includes(q) || prod.includes(q) || batch.includes(q);
      });
    }

    return list.sort((a, b) => {
      const statusOrder = { 'Activo': 1, 'Vendido': 2, 'Muerto': 3 };
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.tagNumber || '').localeCompare(b.tagNumber || '', undefined, { numeric: true });
    });
  }, [cattle, selectedGroupDetail, comparisonCriterion, statusFilter, searchQuery, weighings]);

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

    filteredGroupAnimals.forEach(c => {
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

    const count = filteredGroupAnimals.length;
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
  }, [filteredGroupAnimals, weighings]);

  // Datos filtrados para el Comparador Multi-criterio
  const selectedGroupsForComparison = useMemo(() => {
    if (comparedGroups.length === 0) return groupsStatistics;
    return groupsStatistics.filter(g => comparedGroups.includes(g.groupName));
  }, [comparedGroups, groupsStatistics]);

  // Datos estructurados para las Gráficas Comparativas Recharts
  const comparisonChartData = useMemo(() => {
    return selectedGroupsForComparison.map(group => ({
      name: group.groupName.length > 14 ? group.groupName.slice(0, 12) + '…' : group.groupName,
      fullName: group.groupName,
      gdp: Number(group.avgGdp.toFixed(3)),
      pesoEntrada: Number(group.avgEntryWeight.toFixed(1)),
      pesoActual: Number(group.avgCurrentWeight.toFixed(1)),
      gananciaKg: Number(group.avgGainKg.toFixed(1)),
      totalGanancia: Number(group.totalGainKg.toFixed(0)),
      costoKg: Math.round(group.costPerEntryKg),
      inversionTotal: Math.round(group.totalPurchaseCost),
      precioAnimal: Math.round(group.avgPricePerHead),
      activos: group.activeCount,
      vendidos: group.soldCount,
      totalCabezas: group.headCount,
      listos480: group.readyToSellCount,
      diasFinca: group.avgDays
    }));
  }, [selectedGroupsForComparison]);

  // Datos de distribución por rangos de peso para la vista de detalle
  const detailWeightDistributionData = useMemo(() => {
    const activeAnimals = filteredGroupAnimals.filter(c => c.status === 'Activo');
    let under300 = 0;
    let between300_380 = 0;
    let between380_480 = 0;
    let ready480Plus = 0;

    activeAnimals.forEach(c => {
      const animalWeighs = weighings.filter(w => String(w.cattleId) === String(c.id));
      const wm = calculateWeightMetrics(c, animalWeighs);
      if (wm.currentWeight >= 480) ready480Plus++;
      else if (wm.currentWeight >= 380) between380_480++;
      else if (wm.currentWeight >= 300) between300_380++;
      else under300++;
    });

    return [
      { range: '< 300 kg', label: 'Levante', count: under300, color: '#f59e0b' },
      { range: '300-380 kg', label: 'Desarrollo', count: between300_380, color: '#3b82f6' },
      { range: '380-480 kg', label: 'Finalización', count: between380_480, color: '#8b5cf6' },
      { range: '≥ 480 kg', label: 'Listos Venta', count: ready480Plus, color: '#10b981' }
    ];
  }, [filteredGroupAnimals, weighings]);

  // Ranking Top 5 mejores animales en ganancia del grupo
  const detailTopPerformers = useMemo(() => {
    return filteredGroupAnimals
      .filter(c => c.status === 'Activo')
      .map(c => {
        const animalWeighs = weighings.filter(w => String(w.cattleId) === String(c.id));
        const wm = calculateWeightMetrics(c, animalWeighs);
        return {
          id: c.id,
          tagNumber: c.tagNumber,
          name: c.name,
          gain: wm.totalGain,
          gdp: wm.overallGdp,
          weight: wm.currentWeight
        };
      })
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 5);
  }, [filteredGroupAnimals, weighings]);

  // Medallas de eficiencia en la comparativa
  const bestPurchaseGroup = useMemo(() => {
    const valid = groupsStatistics.filter(g => g.costPerEntryKg > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => cur.costPerEntryKg < best.costPerEntryKg ? cur : best, valid[0]);
  }, [groupsStatistics]);

  const bestGdpGroup = useMemo(() => {
    const valid = groupsStatistics.filter(g => g.avgGdp > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => cur.avgGdp > best.avgGdp ? cur : best, valid[0]);
  }, [groupsStatistics]);

  const bestGainGroup = useMemo(() => {
    const valid = groupsStatistics.filter(g => g.avgGainKg > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, cur) => cur.avgGainKg > best.avgGainKg ? cur : best, valid[0]);
  }, [groupsStatistics]);

  // Manejo de multi-selección de grupos a comparar
  const toggleGroupComparison = (groupName) => {
    setComparedGroups(prev => {
      if (prev.includes(groupName)) {
        if (prev.length === 1) return prev; // Mantener al menos 1 seleccionado
        return prev.filter(name => name !== groupName);
      } else {
        return [...prev, groupName];
      }
    });
  };

  const selectAllGroupsForComparison = () => {
    setComparedGroups(allGroups);
  };

  const selectSingleGroupForComparison = (groupName) => {
    setComparedGroups([groupName]);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Lotes, Ingresos & Comparaciones</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isWorker 
              ? 'Control zootécnico, gráficas visuales y comparativas avanzadas por Lote, Raza, Dueño/Marca, Tipo de Producción y Categoría/Etapa.'
              : 'Control integral de precios, gráficas de rendimiento, biomasa, análisis económico y comparativas por Lote, Raza, Dueño, Producción y Categoría.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {!isWorker && (
            <button
              onClick={handleDownloadComparisonExcel}
              disabled={exportingExcel}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm transition cursor-pointer min-h-[40px] whitespace-nowrap"
              title={`Descargar Comparativa por ${activeCriterionInfo.label} en Excel con Gráficas`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportingExcel ? 'Generando Excel...' : `📊 Comparativa Excel (${activeCriterionInfo.shortLabel})`}</span>
            </button>
          )}

          {onOpenExportImport && (
            <button
              onClick={onOpenExportImport}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 transition cursor-pointer min-h-[40px] whitespace-nowrap shadow-sm"
              title="Exportar Todo a Excel"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Exportar Todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas Principales: Vista Individual vs Comparador */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'detail'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">Detalle ({activeCriterionInfo.shortLabel})</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
            {allGroups.length} {allGroups.length === 1 ? 'grupo' : 'grupos'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'compare'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
          <span className="truncate">Comparador & Gráficas</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shrink-0">
            5 Criterios
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* BARRA SELECTORA DE CRITERIO DE COMPARACIÓN (DISPONIBLE EN AMBAS VISTAS)  */}
      {/* ========================================================================= */}
      <div className="custom-card p-3 sm:p-4 space-y-2.5 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Criterio de Agrupación & Comparación:</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Compara por Lote, Raza, Dueño/Marca, Tipo de Producción o Etapa
          </span>
        </div>

        {/* Botones de Selección de Criterio */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {COMPARISON_CRITERIA.map((crit) => {
            const isSelected = comparisonCriterion === crit.id;
            return (
              <button
                key={crit.id}
                type="button"
                onClick={() => {
                  setComparisonCriterion(crit.id);
                  setSelectedGroupDetail('all');
                }}
                className={`p-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-base">{crit.icon}</span>
                <span className="truncate">{crit.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DETALLE POR GRUPO INDIVIDUAL (KPIS, GRÁFICA & TABLA DETALLADA)   */}
      {/* ========================================================================= */}
      {activeTab === 'detail' && (
        <div className="space-y-6">
          
          {/* Barra Selectora de Grupos del Criterio Activo */}
          <div className="custom-card p-3 sm:p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Seleccionar {activeCriterionInfo.label}:</span>
              </span>
              <button
                onClick={() => setActiveTab('compare')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Comparar todos los grupos con gráficas</span>
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {/* Chip Consolidado */}
              <button
                onClick={() => setSelectedGroupDetail('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer border ${
                  selectedGroupDetail === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>📊 Todos ({cattle.filter(c => c.status === 'Activo').length} en finca)</span>
              </button>

              {/* Chips por cada grupo del criterio */}
              {groupsStatistics.map((group) => {
                const isSelected = selectedGroupDetail === group.groupName;
                return (
                  <button
                    key={group.groupName}
                    onClick={() => setSelectedGroupDetail(group.groupName)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <span>{activeCriterionInfo.icon} {group.groupName}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      {group.activeCount} en finca {group.soldCount > 0 ? `| ${group.soldCount} v.` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TARJETAS DE MÉTRICAS DEL GRUPO SELECCIONADO */}
          {currentGroupData && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
                    <span className="text-emerald-600 dark:text-emerald-400 shrink-0">{activeCriterionInfo.icon}</span>
                    <span className="truncate">{currentGroupData.groupName}</span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {statusFilter === 'Activo' 
                      ? 'Mostrando animales activos en finca (prioridad patrimonial)' 
                      : statusFilter === 'all' 
                      ? 'Consolidado histórico general (todos los animales registrados)' 
                      : 'Historial exclusivo de animales vendidos y liquidados'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Selector de Ámbito / Estado */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold overflow-x-auto no-scrollbar shadow-sm">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('Activo')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        statusFilter === 'Activo'
                          ? 'bg-emerald-600 text-white font-black shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusFilter === 'Activo' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                      <span>🟢 Activos ({currentGroupData.activeCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        statusFilter === 'all'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🌐 Histórico ({currentGroupData.headCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusFilter('Vendido')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        statusFilter === 'Vendido'
                          ? 'bg-amber-600 text-white font-black shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🏷️ Vendidos ({currentGroupData.soldCount})</span>
                    </button>
                  </div>

                  {/* Botón WhatsApp Reporte */}
                  {onOpenWhatsAppReport && (
                    <button
                      type="button"
                      onClick={onOpenWhatsAppReport}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
                      title="Generar y Enviar Reporte por WhatsApp con filtro por Dueño/Marca"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>📲 WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 TARJETAS DINÁMICAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Cabezas / Valor Compra */}
                {isWorker ? (
                  <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-slate-900/90 border border-amber-200/90 dark:border-amber-500/30 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400">
                        Total Bovinos ({activeCriterionInfo.shortLabel})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-sm">
                        🟢 {currentGroupData.activeCount} activos
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                      {currentGroupData.headCount} cabezas
                    </p>
                    <div className="text-xs text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-slate-800">
                      <span>{currentGroupData.activeCount} en finca • {currentGroupData.soldCount} salidos</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-slate-900/90 border border-amber-200/90 dark:border-amber-500/30 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400">
                        {statusFilter === 'Activo' 
                          ? 'Valor Compra en Finca (Activos)' 
                          : statusFilter === 'all' 
                          ? 'Valor Compra Histórico (Todos)' 
                          : 'Valor Compra Inicial (Vendidos)'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-sm">
                        {statusFilter === 'Activo' 
                          ? `🟢 ${currentGroupData.activeCount} activos` 
                          : statusFilter === 'all' 
                          ? `🌐 ${currentGroupData.headCount} cabezas` 
                          : `🏷️ ${currentGroupData.soldCount} vendidos`}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(
                        statusFilter === 'Activo' 
                          ? currentGroupData.activePurchaseCost 
                          : statusFilter === 'all' 
                          ? currentGroupData.totalPurchaseCost 
                          : currentGroupData.soldPurchaseCost
                      )}
                    </p>
                    <div className="text-xs text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-slate-800">
                      <span>
                        Promedio: {formatCurrency(
                          statusFilter === 'Activo' 
                            ? currentGroupData.activeAvgPricePerHead 
                            : statusFilter === 'all' 
                            ? currentGroupData.avgPricePerHead 
                            : currentGroupData.soldAvgPricePerHead
                        )} / animal
                      </span>
                      {statusFilter === 'Activo' && currentGroupData.soldCount > 0 && (
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          Histórico: {formatCurrency(currentGroupData.totalPurchaseCost)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Biomasa / Valor Kilo Compra */}
                {isWorker ? (
                  <div className="p-5 rounded-2xl bg-emerald-50/90 dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-500/30 shadow-sm space-y-1">
                    <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-400">
                      Biomasa Total del Grupo
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                      {formatNumber(statusFilter === 'Activo' ? currentGroupData.activeCurrentWeight : currentGroupData.totalCurrentWeight, 0)}
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400"> kg</span>
                    </p>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium pt-1 border-t border-emerald-200/60 dark:border-slate-800">
                      <span>Entrada: {formatNumber(statusFilter === 'Activo' ? currentGroupData.activeEntryWeight : currentGroupData.totalEntryWeight, 0)} kg totales</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-emerald-50/90 dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-500/30 shadow-sm space-y-1">
                    <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-400">
                      {statusFilter === 'Vendido' ? 'Total Ingresos por Venta' : 'Valor del Kilo Compra ($/kg)'}
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                      {statusFilter === 'Vendido' ? (
                        formatCurrency(currentGroupData.totalSalesRevenue)
                      ) : (
                        <>
                          {formatCurrency(statusFilter === 'Activo' ? currentGroupData.activeCostPerEntryKg : currentGroupData.costPerEntryKg)}
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400"> / kg</span>
                        </>
                      )}
                    </p>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium pt-1 border-t border-emerald-200/60 dark:border-slate-800">
                      {statusFilter === 'Vendido' ? (
                        <span>Promedio salida: {formatCurrency(currentGroupData.avgSoldPricePerKg)}/kg ({formatNumber(currentGroupData.totalSoldWeight, 0)} kg)</span>
                      ) : (
                        <span>Sobre {formatNumber(statusFilter === 'Activo' ? currentGroupData.activeEntryWeight : currentGroupData.totalEntryWeight, 0)} kg totales de entrada</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Kilos Promedio / Ganancia */}
                <div className="p-5 rounded-2xl bg-blue-50/90 dark:bg-slate-900/90 border border-blue-200/90 dark:border-blue-500/30 shadow-sm space-y-1">
                  <span className="text-xs font-bold uppercase text-blue-800 dark:text-blue-400">
                    {isWorker || statusFilter !== 'Vendido' ? 'Kilos Promedio por Animal' : 'Utilidad Neta Realizada'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {!isWorker && statusFilter === 'Vendido' ? (
                      <span className={currentGroupData.totalProfitRealized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                        {formatCurrency(currentGroupData.totalProfitRealized)}
                      </span>
                    ) : (
                      <>
                        {formatNumber(currentGroupData.avgCurrentWeight, 1)}
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400"> kg actual</span>
                      </>
                    )}
                  </p>
                  <div className="text-xs text-blue-900 dark:text-blue-300 font-extrabold flex items-center justify-between pt-1 border-t border-blue-200/60 dark:border-slate-800">
                    {!isWorker && statusFilter === 'Vendido' ? (
                      <span>Ganancia total acumulada</span>
                    ) : (
                      <>
                        <span>Entrada: {formatNumber(statusFilter === 'Activo' ? currentGroupData.activeAvgEntryWeight : currentGroupData.avgEntryWeight, 1)} kg</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">+{formatNumber(currentGroupData.avgGainKg, 1)} kg ganados</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Desempeño & GDP / Animales Vendidos */}
                <div className="p-5 rounded-2xl bg-purple-50/90 dark:bg-slate-900/90 border border-purple-200/90 dark:border-purple-500/30 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-purple-800 dark:text-purple-400">
                      {statusFilter === 'Vendido' ? 'Salida Promedio' : 'Desempeño & GDP'}
                    </span>
                    {statusFilter !== 'Vendido' && currentGroupData.readyToSellCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 shadow-sm">
                        🎯 {currentGroupData.readyToSellCount} listos
                      </span>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {statusFilter === 'Vendido' ? (
                      <>
                        {formatNumber(currentGroupData.soldAvgExitWeight, 1)}
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400"> kg / animal</span>
                      </>
                    ) : (
                      <>
                        {formatNumber(currentGroupData.avgGdp, 3)}
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400"> kg/día</span>
                      </>
                    )}
                  </p>
                  <div className="text-xs text-purple-900 dark:text-purple-300 font-medium flex items-center justify-between pt-1 border-t border-purple-200/60 dark:border-slate-800">
                    {statusFilter === 'Vendido' ? (
                      <span>Entrada prom: {formatNumber(currentGroupData.soldAvgEntryWeight, 1)} kg</span>
                    ) : (
                      <>
                        <span>{currentGroupData.avgDays} días en finca</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Total: +{formatNumber(currentGroupData.totalGainKg, 0)} kg carne</span>
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* GRÁFICAS EN VISTA DETALLE: DISTRIBUCIÓN POR RANGOS DE PESO & TOP ANIMALES */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Gráfica 1: Distribución por Rangos de Peso */}
            <div className="custom-card p-4 space-y-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Distribución por Rango de Peso
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {filteredGroupAnimals.filter(c => c.status === 'Activo').length} activos en hato
                </span>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailWeightDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="range" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                    <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} allowDecimals={false} unit=" cab" />
                    <Tooltip 
                      formatter={(value, name, item) => [
                        `${value} cabezas`, 
                        `${item.payload.label} (${((value / (filteredGroupAnimals.filter(c => c.status === 'Activo').length || 1)) * 100).toFixed(0)}%)`
                      ]}
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#e2e8f0', 
                        borderRadius: '0.75rem', 
                        color: isDark ? '#fff' : '#0f172a',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {detailWeightDistributionData.map((entry, index) => (
                        <Cell key={`cell-weight-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subpanel 2: Top Ganancia del Grupo */}
            <div className="custom-card p-4 space-y-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Top 5 Ganancia de Peso en {activeCriterionInfo.shortLabel}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Mejores Rendimientos
                </span>
              </div>

              {detailTopPerformers.length > 0 ? (
                <div className="space-y-2">
                  {detailTopPerformers.map((animal, idx) => (
                    <div 
                      key={animal.id}
                      onClick={() => onSelectAnimal && onSelectAnimal(cattle.find(c => c.id === animal.id))}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                          idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-black text-slate-900 dark:text-white">{animal.tagNumber}</span>
                          {animal.name && <span className="text-[11px] text-slate-500 ml-1">({animal.name})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400">+{formatNumber(animal.gain, 1)} kg</div>
                          <div className="text-[10px] text-slate-500">{formatNumber(animal.gdp, 3)} kg/d</div>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {formatNumber(animal.weight, 1)} kg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400 text-center">
                  No hay animales activos con pesajes para calcular el ranking.
                </div>
              )}
            </div>

          </div>

          {/* TABLA DETALLADA ANIMAL POR ANIMAL CON BORDES DEFINIDOS */}
          <div className="custom-card p-5 space-y-4">
            
            {/* Cabecera de la Tabla & Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Listado de Animales ({filteredGroupAnimals.length} registros)</span>
                </h3>
                {selectedGroupDetail !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {activeCriterionInfo.icon} {selectedGroupDetail}
                  </span>
                )}
              </div>

              {/* Filtro Rápido de Estado */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Todos ({currentGroupData?.headCount || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('Activo')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    statusFilter === 'Activo' 
                      ? 'bg-emerald-600 text-white shadow-sm font-black' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🟢 En Finca ({currentGroupData?.activeCount || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('Vendido')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    statusFilter === 'Vendido' 
                      ? 'bg-amber-600 text-white shadow-sm font-black' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🏷️ Vendidos ({currentGroupData?.soldCount || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('ready480')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    statusFilter === 'ready480' 
                      ? 'bg-purple-600 text-white shadow-sm font-black' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🎯 ≥480kg ({currentGroupData?.readyToSellCount || 0})
                </button>
              </div>
            </div>

            {/* Buscador dentro del grupo */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por arete, nombre, hierro, dueño, raza, lote o color..."
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

            {/* Tabla Detallada con Bordes Nítidos */}
            {filteredGroupAnimals.length > 0 ? (
              <div className="overflow-x-auto border-2 border-slate-900 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[900px]">
                  <thead className="bg-emerald-800 text-white uppercase text-[11px] font-black border-b-2 border-slate-900">
                    <tr>
                      <th className="p-3 border-r border-emerald-900">Arete / Chapa</th>
                      <th className="p-3 border-r border-emerald-900">Nombre / Hierro</th>
                      <th className="p-3 border-r border-emerald-900">Lote</th>
                      <th className="p-3 border-r border-emerald-900">Raza / Propósito</th>
                      <th className="p-3 border-r border-emerald-900">Estado</th>
                      <th className="p-3 border-r border-emerald-900 text-right">Kilos Entrada</th>
                      <th className="p-3 border-r border-emerald-900 text-right">Kilos Actuales</th>
                      <th className="p-3 border-r border-emerald-900 text-right">Ganancia (+kg)</th>
                      <th className="p-3 border-r border-emerald-900 text-right">GDP (kg/d)</th>
                      {isWorker ? (
                        <>
                          <th className="p-3 border-r border-emerald-900">Categoría</th>
                          <th className="p-3 border-r border-emerald-900">Sexo</th>
                          <th className="p-3 text-right">Color</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 border-r border-emerald-900 text-right">Precio Compra ($)</th>
                          <th className="p-3 border-r border-emerald-900 text-right">Valor Kilo ($/kg)</th>
                          <th className="p-3 border-r border-emerald-900 text-right">Inversión Total ($)</th>
                          <th className="p-3 text-right">Valor Estimado ($)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-700 font-medium">
                    {filteredGroupAnimals.map((animal, idx) => {
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
                            {animal.owner && animal.owner !== 'Propio' && <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Dueño: {animal.owner}</div>}
                          </td>

                          <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap font-bold text-slate-600 dark:text-slate-400">
                            {animal.entryBatch || animal.paddock || 'Ingreso #1'}
                          </td>

                          <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{animal.breed || 'Sin Raza'}</div>
                            <div className="text-[10px] text-slate-500">{animal.productionType || 'Sin Propósito'}</div>
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

                          {isWorker ? (
                            <>
                              <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                                {animal.category || '-'}
                              </td>
                              <td className="p-3 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                                {animal.sex || '-'}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                {animal.color || '-'}
                              </td>
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* PIE DE TABLA CON TOTALES Y PROMEDIOS EXACTOS */}
                  <tfoot className="bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-black border-t-2 border-slate-900 text-[11px]">
                    <tr>
                      <td colSpan={5} className="p-3 border-r border-slate-900">
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
                      {isWorker ? (
                        <td colSpan={3} className="p-3 text-right text-slate-700 dark:text-slate-300">
                          {tableSummary.count} animales registrados
                        </td>
                      ) : (
                        <>
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
                        </>
                      )}
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
      {/* VISTA 2: COMPARADOR MULTIDIMENSIONAL & GRÁFICAS COMPARATIVAS PRO          */}
      {/* ========================================================================= */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          
          {/* Panel de Selección Múltiple de Grupos */}
          <div className="custom-card p-4 space-y-3 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Comparador por {activeCriterionInfo.label} (Selecciona los grupos a contrastar)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isWorker 
                    ? `Selecciona 2 o más ${activeCriterionInfo.label.toLowerCase()}s para contrastar kilos, ganancia de carne, ritmo GDP y gráficas visuales.` 
                    : `Selecciona 2 o más ${activeCriterionInfo.label.toLowerCase()}s para contrastar compras, precios por kilo ($/kg), ganancia de carne, rendimiento GDP y gráficas comparativas.`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isWorker && (
                  <button
                    onClick={handleDownloadComparisonExcel}
                    disabled={exportingExcel}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title={`Descargar comparativa de ${activeCriterionInfo.label} en Excel con Gráficas`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{exportingExcel ? 'Descargando...' : '📊 Descargar Excel'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={selectAllGroupsForComparison}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black hover:bg-indigo-100 transition cursor-pointer"
                >
                  Seleccionar Todos ({allGroups.length})
                </button>
              </div>
            </div>

            {/* Chips de Selección Múltiple con Checkbox */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {groupsStatistics.map((group) => {
                const isChecked = comparedGroups.includes(group.groupName);
                return (
                  <button
                    key={group.groupName}
                    type="button"
                    onClick={() => toggleGroupComparison(group.groupName)}
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
                    <span>{activeCriterionInfo.icon} {group.groupName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isChecked ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {group.headCount} cab
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUADRO SINTÉTICO DE MEJORES RENDIMIENTOS (MEDALLERO DESTACADO) */}
          <div className={`grid grid-cols-1 ${!isWorker ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            {!isWorker && bestPurchaseGroup && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mejor Precio Kilo Compra</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {activeCriterionInfo.icon} {bestPurchaseGroup.groupName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(bestPurchaseGroup.costPerEntryKg)}/kg
                  </div>
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">
                    {formatCurrency(bestPurchaseGroup.avgPricePerHead)}/cab
                  </div>
                </div>
              </div>
            )}

            {bestGdpGroup && (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-purple-800 dark:text-purple-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mayor Rendimiento (GDP)</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {activeCriterionInfo.icon} {bestGdpGroup.groupName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-purple-700 dark:text-purple-300">
                    {formatNumber(bestGdpGroup.avgGdp, 3)} kg/d
                  </div>
                  <div className="text-[10px] text-purple-800 dark:text-purple-400 font-bold">
                    +{formatNumber(bestGdpGroup.avgGainKg, 1)} kg ganados
                  </div>
                </div>
              </div>
            )}

            {bestGainGroup && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-blue-800 dark:text-blue-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Más Carne Ganada / Cabeza</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {activeCriterionInfo.icon} {bestGainGroup.groupName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-blue-700 dark:text-blue-300">
                    +{formatNumber(bestGainGroup.avgGainKg, 1)} kg/cab
                  </div>
                  <div className="text-[10px] text-blue-800 dark:text-blue-400 font-bold">
                    Total: +{formatNumber(bestGainGroup.totalGainKg, 0)} kg
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN DE GRÁFICAS COMPARATIVAS MULTIDIMENSIONALES RECHARTS             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Gráfica 1: Comparativa Zootécnica de Rendimiento & Pesos */}
            <div className="custom-card p-4 space-y-3 border-2 border-slate-300 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Desempeño Zootécnico & Pesos
                  </h3>
                </div>

                {/* Selector de Métrica */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setComparisonMetricMode('gdp')}
                    className={`px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                      comparisonMetricMode === 'gdp'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    ⚡ GDP (kg/d)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMetricMode('weights')}
                    className={`px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                      comparisonMetricMode === 'weights'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    ⚖️ Entrada vs Actual
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMetricMode('gain')}
                    className={`px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                      comparisonMetricMode === 'gain'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    🥩 Ganancia (+kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMetricMode('heads')}
                    className={`px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                      comparisonMetricMode === 'heads'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    👥 Cabezas
                  </button>
                </div>
              </div>

              {/* Contenedor Gráfica Recharts */}
              <div className="h-64 sm:h-72 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  {comparisonMetricMode === 'weights' ? (
                    <BarChart data={comparisonChartData} margin={{ top: 15, right: 10, left: -15, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} interval={0} angle={-25} textAnchor="end" />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} unit=" kg" />
                      <Tooltip 
                        formatter={(value, name) => [`${value} kg`, name === 'pesoEntrada' ? 'Peso Entrada Prom' : 'Peso Actual Prom']}
                        labelFormatter={(label, item) => item && item[0] ? item[0].payload.fullName : label}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend verticalAlign="top" height={30} iconType="circle" />
                      <Bar dataKey="pesoEntrada" name="Peso Entrada (kg)" fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pesoActual" name="Peso Actual (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : comparisonMetricMode === 'heads' ? (
                    <BarChart data={comparisonChartData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} interval={0} angle={-25} textAnchor="end" />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} allowDecimals={false} unit=" cab" />
                      <Tooltip 
                        formatter={(value, name) => [`${value} cab`, name === 'activos' ? '🟢 En Finca (Activos)' : '🏷️ Vendidos']}
                        labelFormatter={(label, item) => item && item[0] ? item[0].payload.fullName : label}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend verticalAlign="top" height={30} iconType="circle" />
                      <Bar dataKey="activos" name="En Finca (Activos)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="vendidos" name="Vendidos" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={comparisonChartData} margin={{ top: 15, right: 10, left: -15, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} interval={0} angle={-25} textAnchor="end" />
                      <YAxis 
                        stroke={isDark ? '#94a3b8' : '#64748b'} 
                        fontSize={11} 
                        unit={comparisonMetricMode === 'gdp' ? ' kg/d' : ' kg'} 
                      />
                      <Tooltip 
                        formatter={(value, name, item) => [
                          comparisonMetricMode === 'gdp' 
                            ? `${value} kg/día (${item.payload.diasFinca} días en finca)` 
                            : `+${value} kg/cabeza (Total lote: +${item.payload.totalGanancia} kg)`,
                          comparisonMetricMode === 'gdp' ? '⚡ Ritmo GDP' : '🥩 Ganancia Promedio'
                        ]}
                        labelFormatter={(label, item) => item && item[0] ? item[0].payload.fullName : label}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Bar 
                        dataKey={comparisonMetricMode === 'gdp' ? 'gdp' : 'gananciaKg'} 
                        fill="#8b5cf6" 
                        radius={[6, 6, 0, 0]}
                      >
                        {comparisonChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-bar-${index}`} 
                            fill={
                              comparisonMetricMode === 'gdp'
                                ? (entry.gdp >= 0.75 ? '#10b981' : entry.gdp >= 0.5 ? '#06b6d4' : entry.gdp >= 0.35 ? '#8b5cf6' : '#f59e0b')
                                : '#3b82f6'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica 2: Comparativa Económica (Admin) / Animales Listos (Worker) */}
            {!isWorker ? (
              <div className="custom-card p-4 space-y-3 border-2 border-slate-300 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Comparativa Económica & Costo de Entrada
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setEconomicMetricMode('costKg')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        economicMetricMode === 'costKg'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      💲 Valor Kilo ($/kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEconomicMetricMode('totalPurchase')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        economicMetricMode === 'totalPurchase'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      💰 Inversión Total ($)
                    </button>
                  </div>
                </div>

                {/* Contenedor Gráfica Económica */}
                <div className="h-64 sm:h-72 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ top: 15, right: 10, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} interval={0} angle={-25} textAnchor="end" />
                      <YAxis 
                        stroke={isDark ? '#94a3b8' : '#64748b'} 
                        fontSize={11} 
                        tickFormatter={(val) => economicMetricMode === 'costKg' ? `$${val}` : `$${(val / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value, name, item) => [
                          economicMetricMode === 'costKg' 
                            ? `${formatCurrency(value)}/kg (${formatCurrency(item.payload.precioAnimal)}/animal)` 
                            : formatCurrency(value),
                          economicMetricMode === 'costKg' ? 'Valor Kilo Entrada' : 'Inversión Compra Total'
                        ]}
                        labelFormatter={(label, item) => item && item[0] ? item[0].payload.fullName : label}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Bar 
                        dataKey={economicMetricMode === 'costKg' ? 'costoKg' : 'inversionTotal'} 
                        fill={economicMetricMode === 'costKg' ? '#059669' : '#d97706'} 
                        radius={[6, 6, 0, 0]}
                      >
                        {comparisonChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-econ-${index}`} 
                            fill={economicMetricMode === 'costKg' ? '#10b981' : '#f59e0b'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="custom-card p-4 space-y-3 border-2 border-slate-300 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Bovinos Listos para Venta (≥480kg)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    Etapa de Finalización
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} interval={0} angle={-25} textAnchor="end" />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} allowDecimals={false} unit=" cab" />
                      <Tooltip 
                        formatter={(value, name, item) => [`${value} listos de ${item.payload.activos} en finca`, '🎯 Listos ≥480kg']}
                        labelFormatter={(label, item) => item && item[0] ? item[0].payload.fullName : label}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Bar dataKey="listos480" fill="#a855f7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>

          {/* TABLA COMPARATIVA SINTÉTICA (PRECIOS, RENDIMIENTOS, TIEMPO, VALOR DE COMPRA) */}
          <div className="custom-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {isWorker 
                    ? `Tabla Comparativa de Rendimiento & Tiempo por ${activeCriterionInfo.label}` 
                    : `Tabla Comparativa de Precios, Rendimiento & Tiempo por ${activeCriterionInfo.label}`}
                </span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {selectedGroupsForComparison.length} {selectedGroupsForComparison.length === 1 ? 'grupo' : 'grupos'} seleccionados
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-slate-900 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[900px]">
                <thead className="bg-slate-900 text-white uppercase text-[11px] font-black border-b-2 border-slate-900">
                  <tr>
                    <th className="p-3 border-r border-slate-800">{activeCriterionInfo.label}</th>
                    <th className="p-3 border-r border-slate-800 text-center">Cabezas</th>
                    {!isWorker && (
                      <>
                        <th className="p-3 border-r border-slate-800 text-right bg-amber-950/60 text-amber-200">Valor Compra Total ($)</th>
                        <th className="p-3 border-r border-slate-800 text-right bg-amber-950/60 text-amber-200">Precio / Animal</th>
                        <th className="p-3 border-r border-slate-800 text-right bg-emerald-950/60 text-emerald-200">Valor Kilo ($/kg)</th>
                      </>
                    )}
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
                  {selectedGroupsForComparison.map((group, idx) => (
                    <tr 
                      key={group.groupName}
                      className={`hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      {/* Nombre del Grupo */}
                      <td className="p-3 font-black text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-600 dark:text-indigo-400">{activeCriterionInfo.icon}</span>
                          <span>{group.groupName}</span>
                        </div>
                      </td>

                      {/* Cabezas */}
                      <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{group.activeCount} en finca</span>
                        {group.soldCount > 0 && <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">({group.soldCount} v.)</span>}
                      </td>

                      {!isWorker && (
                        <>
                          {/* Valor de Compra Total */}
                          <td className="p-3 text-right font-black text-amber-950 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {formatCurrency(group.totalPurchaseCost)}
                          </td>

                          {/* Precio Promedio por Animal */}
                          <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {formatCurrency(group.avgPricePerHead)}
                          </td>

                          {/* Valor del Kilo Entrada ($/kg) */}
                          <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                            {formatCurrency(group.costPerEntryKg)}/kg
                          </td>
                        </>
                      )}

                      {/* Kilos Entrada Promedio */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-semibold whitespace-nowrap">
                        {formatNumber(group.avgEntryWeight, 1)} kg
                      </td>

                      {/* Kilos Actual Promedio */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatNumber(group.avgCurrentWeight, 1)} kg
                      </td>

                      {/* Ganancia de Carne Promedio */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 whitespace-nowrap">
                        +{formatNumber(group.avgGainKg, 1)} kg/cab
                      </td>

                      {/* Rendimiento (GDP kg/día) */}
                      <td className="p-3 text-right border-r border-slate-300 dark:border-slate-700 font-black text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 whitespace-nowrap">
                        {formatNumber(group.avgGdp, 3)} kg/d
                      </td>

                      {/* Tiempo en Finca */}
                      <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{group.avgDays} días</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Desde {group.earliestDate === 'Todas las fechas' || group.earliestDate === 'N/A' ? group.earliestDate : formatDate(group.earliestDate)}</span>
                      </td>

                      {/* Listos ≥ 480 kg */}
                      <td className="p-3 text-center border-r border-slate-300 dark:border-slate-700 whitespace-nowrap">
                        {group.readyToSellCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300">
                            🎯 {group.readyToSellCount} listos
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-bold">0</span>
                        )}
                      </td>

                      {/* Acción Ver Detalle */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedGroupDetail(group.groupName);
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

          {/* TARJETAS RESUMEN CARA A CARA */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {selectedGroupsForComparison.map((group) => (
              <div 
                key={group.groupName}
                className="custom-card p-4 space-y-3 border-2 border-slate-300 dark:border-slate-700 shadow-sm"
              >
                {/* Header Compacto */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-base text-slate-900 dark:text-white">
                      <span>{activeCriterionInfo.icon}</span>
                      <span className="truncate">{group.groupName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      ⏱️ <span className="font-bold text-slate-700 dark:text-slate-300">{group.avgDays} días en finca</span> • Desde {group.earliestDate === 'Todas las fechas' || group.earliestDate === 'N/A' ? group.earliestDate : formatDate(group.earliestDate)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      {group.headCount} cabezas
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {group.activeCount} en finca {group.soldCount > 0 ? `• ${group.soldCount} v.` : ''}
                    </div>
                  </div>
                </div>

                {/* Bloque 1: Precios & Valor de Compra */}
                {!isWorker && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor de Compra & Precios:</span>
                      <span className="font-black text-xs text-amber-950 dark:text-amber-300">{formatCurrency(group.totalPurchaseCost)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Precio / Animal:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(group.avgPricePerHead)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Valor del Kilo:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(group.costPerEntryKg)}/kg</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bloque 2: Rendimientos & Peso */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> Rendimiento de Peso & GDP:</span>
                    <span className="font-black text-xs text-purple-700 dark:text-purple-400">{formatNumber(group.avgGdp, 3)} kg/día</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs pt-1 border-t border-blue-200/60 dark:border-blue-800/40 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Entrada Prom:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(group.avgEntryWeight, 1)} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Actual Prom:</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatNumber(group.avgCurrentWeight, 1)} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Ganancia:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">+{formatNumber(group.avgGainKg, 1)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Footer del Grupo con Acción Rápida */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                    {group.readyToSellCount > 0 ? (
                      <span className="text-purple-700 dark:text-purple-300 font-black">🎯 {group.readyToSellCount} listos (≥480kg)</span>
                    ) : (
                      <span>En etapa de levante / ceba</span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedGroupDetail(group.groupName);
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
