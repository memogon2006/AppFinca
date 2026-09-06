import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Undo2, 
  Trash2, 
  Eye, 
  Users, 
  PlusCircle, 
  Search, 
  Calendar, 
  X, 
  Filter,
  Receipt,
  Tag,
  Store,
  Layers,
  Edit2,
  PieChart,
  Repeat,
  CalendarRange,
  ChevronRight,
  Clock
} from 'lucide-react';
import { formatCurrency, formatNumber, calculateFinancials, calculateWeightMetrics } from '../../services/calculations';
import { EXPENSE_CATEGORIES } from './ExpenseFormModal';

export const formatMonthLabel = (monthKey) => {
  if (!monthKey || monthKey === 'Sin Fecha') return 'Sin Fecha';
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const date = new Date(year, month, 1);
  const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
};

export function FinancesView({ 
  cattle = [], 
  weighings = [],
  expenses = [],
  batches = [],
  onSelectAnimal, 
  onRevertSale, 
  onDeleteAnimal, 
  onOpenPartnershipModal,
  onOpenNewExpense,
  onOpenEditExpense,
  onDeleteExpense
}) {
  const [financesTab, setFinancesTab] = useState('sales'); // 'sales' | 'expenses'

  // Estados de filtro para Ventas
  const [searchQuery, setSearchQuery] = useState('');
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');

  // Estados de filtro para Gastos
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseStartDate, setExpenseStartDate] = useState('');
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [filterOnlyRecurring, setFilterOnlyRecurring] = useState(false);
  const [isMonthlyPanelExpanded, setIsMonthlyPanelExpanded] = useState(true);

  const allSoldCattle = useMemo(() => cattle.filter(c => c.status === 'Vendido'), [cattle]);
  const activeCattle = useMemo(() => cattle.filter(c => c.status === 'Activo'), [cattle]);

  // Filtrado de ventas
  const filteredSoldCattle = useMemo(() => {
    return allSoldCattle.filter(animal => {
      // Filtro de modalidad
      if (saleTypeFilter) {
        const isComp = animal.exitType === 'En Compañía' || !!animal.partnershipDetails;
        if (saleTypeFilter === 'Compania' && !isComp) return false;
        if (saleTypeFilter === 'Directa' && isComp) return false;
      }

      // Filtro por Fecha de Venta
      if (saleStartDate && (animal.exitDate || '') < saleStartDate) return false;
      if (saleEndDate && (animal.exitDate || '') > saleEndDate) return false;

      // Filtro de búsqueda general
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const tag = (animal.tagNumber || '').toLowerCase();
        const name = (animal.name || '').toLowerCase();
        const buyer = (animal.saleBuyer || animal.buyer || '').toLowerCase();
        const brand = (animal.ironBrand || '').toLowerCase();
        const date = (animal.exitDate || '').toLowerCase();
        const owner = (animal.owner || '').toLowerCase();
        if (
          !tag.includes(q) &&
          !name.includes(q) &&
          !buyer.includes(q) &&
          !brand.includes(q) &&
          !date.includes(q) &&
          !owner.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allSoldCattle, saleTypeFilter, saleStartDate, saleEndDate, searchQuery]);

  // Filtrado de gastos con soporte de Mes y Recurrentes
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filterOnlyRecurring && !exp.isRecurring) return false;
      if (selectedMonthFilter && !(exp.date || '').startsWith(selectedMonthFilter)) return false;
      if (expenseCategory && exp.category !== expenseCategory) return false;
      if (expenseStartDate && (exp.date || '') < expenseStartDate) return false;
      if (expenseEndDate && (exp.date || '') > expenseEndDate) return false;

      if (expenseSearch) {
        const q = expenseSearch.toLowerCase();
        const desc = (exp.description || exp.concept || '').toLowerCase();
        const supplier = (exp.supplier || '').toLowerCase();
        const batch = (exp.batch || '').toLowerCase();
        const cat = (exp.category || '').toLowerCase();
        if (!desc.includes(q) && !supplier.includes(q) && !batch.includes(q) && !cat.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [expenses, filterOnlyRecurring, selectedMonthFilter, expenseCategory, expenseStartDate, expenseEndDate, expenseSearch]);

  // Totales de gastos
  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const filteredExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Agrupación y Análisis Mes a Mes
  const expensesByMonth = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const monthKey = (e.date || '').slice(0, 7) || 'Sin Fecha';
      if (!map[monthKey]) {
        map[monthKey] = {
          monthKey,
          label: formatMonthLabel(monthKey),
          total: 0,
          count: 0,
          recurringCount: 0,
          categories: {},
          expenses: []
        };
      }
      const amount = parseFloat(e.amount) || 0;
      map[monthKey].total += amount;
      map[monthKey].count += 1;
      if (e.isRecurring) map[monthKey].recurringCount += 1;
      map[monthKey].expenses.push(e);

      const cat = e.category || 'Otros Gastos de Finca';
      map[monthKey].categories[cat] = (map[monthKey].categories[cat] || 0) + amount;
    });

    const list = Object.values(map).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    
    // Identificar categoría dominante por mes
    list.forEach(m => {
      let topCat = '';
      let topVal = 0;
      Object.entries(m.categories).forEach(([c, val]) => {
        if (val > topVal) {
          topVal = val;
          topCat = c;
        }
      });
      m.topCategory = topCat;
      m.topCategoryAmount = topVal;
    });

    return list;
  }, [expenses]);

  const maxMonthlyExpense = useMemo(() => {
    return Math.max(...expensesByMonth.map(m => m.total), 1);
  }, [expensesByMonth]);

  const availableMonths = useMemo(() => {
    return expensesByMonth.filter(m => m.monthKey !== 'Sin Fecha').map(m => m.monthKey);
  }, [expensesByMonth]);

  // Mes actual (YYYY-MM)
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthData = expensesByMonth.find(m => m.monthKey === currentMonthKey);
  const currentMonthTotal = currentMonthData ? currentMonthData.total : 0;

  // Promedio mensual de gastos
  const monthsCount = expensesByMonth.filter(m => m.monthKey !== 'Sin Fecha').length;
  const averageMonthlyExpense = monthsCount > 0 ? (totalExpensesAmount / monthsCount) : totalExpensesAmount;

  // Compromiso mensual de gastos fijos recurrentes
  const recurringTemplates = useMemo(() => {
    return expenses.filter(e => e.isRecurring && !e.isRecurringInstance);
  }, [expenses]);

  const totalMonthlyRecurringCommitment = useMemo(() => {
    return recurringTemplates.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [recurringTemplates]);

  // Total de kilos ganados en finca
  const totalGainAllCattle = useMemo(() => {
    return cattle.reduce((sum, animal) => {
      const aWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
      const wm = calculateWeightMetrics(animal, aWeighs);
      return sum + (wm.totalGain > 0 ? wm.totalGain : 0);
    }, 0);
  }, [cattle, weighings]);

  // Costo operativo por kilo ganado
  const costPerKgProduced = totalGainAllCattle > 0 ? (totalExpensesAmount / totalGainAllCattle) : 0;

  // Desglose por categoría
  const expensesByCategory = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const cat = e.category || 'Otros Gastos de Finca';
      map[cat] = (map[cat] || 0) + (parseFloat(e.amount) || 0);
    });
    return map;
  }, [expenses]);

  // Cálculos globales sobre las ventas filtradas
  let totalSalesRevenue = 0;
  let totalCostSold = 0;
  let totalRealizedProfit = 0;

  filteredSoldCattle.forEach(c => {
    const fin = calculateFinancials(c);
    totalSalesRevenue += parseFloat(c.exitPrice) || 0;
    totalCostSold += fin.totalInvested;
    totalRealizedProfit += fin.netProfit;
  });

  const overallRealizedRoi = totalCostSold > 0 ? (totalRealizedProfit / totalCostSold) * 100 : 0;

  const totalActiveInvestment = activeCattle.reduce((sum, c) => {
    const fin = calculateFinancials(c);
    return sum + fin.totalInvested;
  }, 0);

  const handleRevert = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`¿Está seguro de anular la venta del animal ${animal.tagNumber}? Volverá a estar activo en el inventario.`)) {
      if (onRevertSale) onRevertSale(animal.id);
    }
  };

  const handleDelete = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`¿Está seguro de ELIMINAR permanentemente el registro del animal ${animal.tagNumber}?`)) {
      if (onDeleteAnimal) onDeleteAnimal(animal.id);
    }
  };

  const handleDeleteExpensePrompt = (exp, e) => {
    e.stopPropagation();
    if (window.confirm(`🗑️ ¿Deseas eliminar el registro de gasto: "${exp.description || exp.concept}" por ${formatCurrency(exp.amount)}?`)) {
      if (onDeleteExpense) onDeleteExpense(exp.id);
    }
  };

  const hasActiveFilters = searchQuery || saleStartDate || saleEndDate || saleTypeFilter;
  const hasActiveExpenseFilters = expenseSearch || expenseCategory || expenseStartDate || expenseEndDate || selectedMonthFilter || filterOnlyRecurring;

  const clearFilters = () => {
    setSearchQuery('');
    setSaleStartDate('');
    setSaleEndDate('');
    setSaleTypeFilter('');
  };

  const clearExpenseFilters = () => {
    setExpenseSearch('');
    setExpenseCategory('');
    setExpenseStartDate('');
    setExpenseEndDate('');
    setSelectedMonthFilter('');
    setFilterOnlyRecurring(false);
  };

  const getCategoryBadgeClass = (category) => {
    if (category.includes('Sal')) return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    if (category.includes('Medicamento') || category.includes('Vacuna')) return 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    if (category.includes('Jornal') || category.includes('Personal')) return 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    if (category.includes('Flete') || category.includes('Transporte')) return 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    if (category.includes('Mantenimiento') || category.includes('Pasto')) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
  };

  return (
    <div className="space-y-6">
      
      {/* Header con Pestañas y Botones de Acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Finanzas & Control de Costos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo de ventas de ganado y control opcional de gastos mensuales y recurrentes de finca.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {onOpenNewExpense && (
            <button
              onClick={onOpenNewExpense}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer min-h-[42px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Registrar Gasto</span>
            </button>
          )}

          {onOpenPartnershipModal && (
            <button
              onClick={onOpenPartnershipModal}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow transition cursor-pointer min-h-[42px]"
            >
              <Users className="w-4 h-4" />
              <span>🤝 Liquidar Compañía</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas Finanzas */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
        <button
          onClick={() => setFinancesTab('sales')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            financesTab === 'sales'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Ventas & Utilidades Ganado</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {allSoldCattle.length}
          </span>
        </button>

        <button
          onClick={() => setFinancesTab('expenses')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            financesTab === 'expenses'
              ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gastos de Finca (Mensual & Fijos)</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            {expenses.length}
          </span>
        </button>
      </div>

      {/* VISTA 1: VENTAS & UTILIDADES DE GANADO */}
      {financesTab === 'sales' && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas de Ventas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">Ventas Totales</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalSalesRevenue)}</p>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1 inline-block">
                {filteredSoldCattle.length} animales vendidos
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-400">Utilidad Neta Realizada</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalRealizedProfit)}</p>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1 inline-block">
                Ganancia neta de las ventas
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-gradient-to-br dark:from-teal-500/20 dark:to-emerald-500/5 border border-teal-200 dark:border-teal-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-teal-800 dark:text-teal-400">Rentabilidad Global (ROI)</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{overallRealizedRoi.toFixed(1)}%</p>
              <span className="text-xs text-teal-700 dark:text-teal-300 font-medium mt-1 inline-block">
                Sobre inversión de ${formatNumber(totalCostSold, 0)}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">Capital en Ganado Activo</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalActiveInvestment)}</p>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1 inline-block">
                {activeCattle.length} animales en finca
              </span>
            </div>
          </div>

          {/* Tabla de Ventas y Filtros */}
          <div className="custom-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Historial de Ganado Liquidado ({filteredSoldCattle.length})</span>
              </h3>
            </div>

            {/* Filtros de Ventas */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por arete, nombre, comprador, hierro..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-full md:w-auto">
                  <select
                    value={saleTypeFilter}
                    onChange={(e) => setSaleTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Todas las Modalidades</option>
                    <option value="Directa">Venta Directa</option>
                    <option value="Compania">En Compañía</option>
                  </select>
                </div>
              </div>

              {/* Rango de Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    📅 Desde:
                  </label>
                  <input
                    type="date"
                    value={saleStartDate}
                    onChange={(e) => setSaleStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    📅 Hasta:
                  </label>
                  <input
                    type="date"
                    value={saleEndDate}
                    onChange={(e) => setSaleEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {hasActiveFilters && (
                  <div>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            </div>

            {filteredSoldCattle.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Arete</th>
                      <th className="p-3">Tipo Venta</th>
                      <th className="p-3">Fecha Venta</th>
                      <th className="p-3">Peso Salida</th>
                      <th className="p-3">Costo Total</th>
                      <th className="p-3">Valor Venta</th>
                      <th className="p-3">Utilidad Neta</th>
                      <th className="p-3">Rentabilidad (ROI)</th>
                      <th className="p-3">Comprador</th>
                      <th className="p-3 text-right">Opciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredSoldCattle.map(animal => {
                      const fin = calculateFinancials(animal);
                      const isPart = animal.exitType === 'En Compañía' || animal.partnershipDetails;

                      return (
                        <tr
                          key={animal.id}
                          onClick={() => onSelectAnimal(animal)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{animal.tagNumber}</span>
                            {animal.name && <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">({animal.name})</span>}
                          </td>
                          <td className="p-3">
                            {isPart ? (
                              <span className="inline-flex items-center gap-1 font-black text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-400 dark:border-teal-700 text-[10px]">
                                <Users className="w-2.5 h-2.5 text-teal-600" /> 🤝 En Compañía
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700 text-[10px]">
                                💰 Directa
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {animal.exitDate || '-'}
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {animal.exitWeight ? `${animal.exitWeight} kg` : '-'}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {formatCurrency(fin.totalInvested)}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {formatCurrency(animal.exitPrice)}
                          </td>
                          <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            {isPart && animal.partnershipDetails ? (
                              <div>
                                <span>Finca: {formatCurrency(animal.partnershipDetails.farmShare)}</span>
                                <div className="text-[10px] text-teal-700 dark:text-teal-300 font-bold">
                                  Dueño: {formatCurrency(animal.partnershipDetails.partnerTotalReturn)}
                                </div>
                              </div>
                            ) : (
                              formatCurrency(fin.netProfit)
                            )}
                          </td>
                          <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                            {fin.roi}%
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {animal.saleBuyer || animal.buyer || 'No registrado'}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleRevert(animal, e)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                                title="Anular venta y devolver a finca"
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(animal, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                {hasActiveFilters ? 'No se encontraron ventas que coincidan con los filtros de fecha o búsqueda.' : 'No se han registrado ventas aún.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: GASTOS OPERATIVOS DE FINCA (MENSUAL & RECURRENTES) */}
      {financesTab === 'expenses' && (
        <div className="space-y-6">
          
          {/* Tarjetas de Métricas de Gastos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Gastos */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">Total Gastos Acumulados</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalExpensesAmount)}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <Receipt className="w-3.5 h-3.5" />
                <span>{expenses.length} registros en total</span>
              </div>
            </div>

            {/* Promedio Mensual */}
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-400">Promedio Mensual</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(averageMonthlyExpense)}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-700 dark:text-blue-300 font-medium">
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Calculado sobre {monthsCount || 1} {monthsCount === 1 ? 'mes' : 'meses'}</span>
              </div>
            </div>

            {/* Gastos Recurrentes / Fijos */}
            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-purple-500/5 border border-indigo-200 dark:border-indigo-500/30 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-indigo-800 dark:text-indigo-400">Gastos Fijos Mensuales</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-200/80 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200">
                  {recurringTemplates.length} activos
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalMonthlyRecurringCommitment)}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mes</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                <Repeat className="w-3.5 h-3.5" />
                <span>Compromiso recurrente auto-generado</span>
              </div>
            </div>

            {/* Costo Operativo / Kg Ganado */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">Costo Operativo / Kg Ganado</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalGainAllCattle > 0 ? formatCurrency(costPerKgProduced) : '$0'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                <span>Sobre {formatNumber(totalGainAllCattle, 0)} kg carne producidos</span>
              </div>
            </div>

          </div>

          {/* PANEL DE CONTROL DE GASTOS MES A MES */}
          {expensesByMonth.length > 0 && (
            <div className="custom-card p-5 space-y-4 border-2 border-indigo-100 dark:border-indigo-950/60 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>📅 Historial & Comparativa de Gastos Mes a Mes</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conoce exactamente cuánto se gasta en cada mes y filtra con un solo clic.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMonthFilter('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      !selectedMonthFilter 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Ver Todos los Meses
                  </button>
                </div>
              </div>

              {/* Lista Desglosada Mes a Mes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {expensesByMonth.map((month) => {
                  const isSelected = selectedMonthFilter === month.monthKey;
                  const percentOfMax = maxMonthlyExpense > 0 ? (month.total / maxMonthlyExpense) * 100 : 0;
                  const isCurrent = month.monthKey === currentMonthKey;

                  return (
                    <div
                      key={month.monthKey}
                      onClick={() => setSelectedMonthFilter(prev => prev === month.monthKey ? '' : month.monthKey)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-3 relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      {/* Cabecera del Mes */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
                            {month.label}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Mes Actual
                            </span>
                          )}
                        </div>

                        {month.recurringCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded-full" title="Gastos recurrentes en este mes">
                            <Repeat className="w-2.5 h-2.5" /> {month.recurringCount} fijos
                          </span>
                        )}
                      </div>

                      {/* Monto del Mes */}
                      <div>
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {formatCurrency(month.total)}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{month.count} comprobantes</span>
                          {month.topCategory && (
                            <span className="truncate max-w-[150px] font-semibold text-slate-700 dark:text-slate-300">
                              Mayor: {month.topCategory.split('/')[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra de Progreso Comparativa */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCurrent ? 'bg-emerald-500' : isSelected ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${Math.max(percentOfMax, 4)}%` }}
                          />
                        </div>
                      </div>

                      {/* Indicador de Acción */}
                      <div className="flex items-center justify-between pt-1 text-[11px] font-bold">
                        <span className={isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}>
                          {isSelected ? '✓ Filtrando este mes' : 'Haz clic para filtrar'}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 transition ${isSelected ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desglose por Categorías */}
          {Object.keys(expensesByCategory).length > 0 && (
            <div className="custom-card p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Distribución Total de Costos por Categoría</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(expensesByCategory).map(([cat, val]) => (
                  <div 
                    key={cat}
                    onClick={() => setExpenseCategory(prev => prev === cat ? '' : cat)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      expenseCategory === cat 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      expenseCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    }`}>
                      {formatCurrency(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla y Filtros de Gastos */}
          <div className="custom-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Listado de Gastos ({filteredExpenses.length})</span>
                </h3>
                {selectedMonthFilter && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    Mes: {formatMonthLabel(selectedMonthFilter)}
                  </span>
                )}
                {filterOnlyRecurring && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    🔄 Solo Recurrentes
                  </span>
                )}
              </div>

              {onOpenNewExpense && (
                <button
                  onClick={onOpenNewExpense}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Nuevo Gasto</span>
                </button>
              )}
            </div>

            {/* Filtros de Gastos */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Buscador */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Buscar por concepto, insumo, proveedor, lote..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  {expenseSearch && (
                    <button
                      onClick={() => setExpenseSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Selector de Mes */}
                <div className="w-full md:w-auto">
                  <select
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">📅 Todos los Meses</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m}>📅 {formatMonthLabel(m)}</option>
                    ))}
                  </select>
                </div>

                {/* Selector de Categoría */}
                <div className="w-full md:w-auto">
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Todas las Categorías</option>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Rápido Recurrentes */}
                <button
                  type="button"
                  onClick={() => setFilterOnlyRecurring(prev => !prev)}
                  className={`w-full md:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    filterOnlyRecurring
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Solo Recurrentes</span>
                </button>
              </div>

              {/* Rango de Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    📅 Desde:
                  </label>
                  <input
                    type="date"
                    value={expenseStartDate}
                    onChange={(e) => setExpenseStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    📅 Hasta:
                  </label>
                  <input
                    type="date"
                    value={expenseEndDate}
                    onChange={(e) => setExpenseEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {hasActiveExpenseFilters && (
                  <div>
                    <button
                      onClick={clearExpenseFilters}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de Gastos */}
            {filteredExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[750px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Descripción / Concepto</th>
                      <th className="p-3.5">Tipo</th>
                      <th className="p-3.5">Lote / Destino</th>
                      <th className="p-3.5">Proveedor</th>
                      <th className="p-3.5 text-right">Monto ($ COP)</th>
                      <th className="p-3.5 text-right">Opciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {exp.date || '-'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getCategoryBadgeClass(exp.category || '')}`}>
                            <Tag className="w-2.5 h-2.5" /> {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          <div>
                            <span>{exp.description || exp.concept || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {exp.isRecurring ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                              <Repeat className="w-2.5 h-2.5" /> Recurrente (Día {exp.recurringDay || '1'})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              Ocasional
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {exp.batch || 'Toda la Finca'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {exp.supplier || '-'}
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap text-sm">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {onOpenEditExpense && (
                              <button
                                onClick={() => onOpenEditExpense(exp)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                                title="Editar gasto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteExpensePrompt(exp, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-50/80 dark:bg-amber-950/60 text-slate-800 dark:text-slate-200 font-extrabold border-t-2 border-amber-500">
                    <tr>
                      <td colSpan={6} className="p-3.5 text-amber-900 dark:text-amber-200 font-black">
                        📊 TOTAL GASTOS FILTRADOS ({filteredExpenses.length} registros)
                      </td>
                      <td className="p-3.5 text-right text-base font-black text-amber-900 dark:text-amber-200 whitespace-nowrap">
                        {formatCurrency(filteredExpensesAmount)}
                      </td>
                      <td className="p-3.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {hasActiveExpenseFilters ? 'No se encontraron gastos con los filtros seleccionados' : 'Aún no has registrado gastos operativos'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Este módulo te permite llevar el control de compras de sal mineral, melaza, medicamentos, jornales o fletes, conociendo tus gastos mes a mes y configurando gastos recurrentes automáticos.
                </p>
                {onOpenNewExpense && (
                  <button
                    onClick={onOpenNewExpense}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow transition cursor-pointer"
                  >
                    + Registrar Primer Gasto
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
