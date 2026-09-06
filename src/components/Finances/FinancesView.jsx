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
  PieChart
} from 'lucide-react';
import { formatCurrency, formatNumber, calculateFinancials, calculateWeightMetrics } from '../../services/calculations';
import { EXPENSE_CATEGORIES } from './ExpenseFormModal';

export function FinancesView({ 
  cattle = [], 
  weighings = [],
  expenses = [],
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

  // Filtrado de gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
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
  }, [expenses, expenseCategory, expenseStartDate, expenseEndDate, expenseSearch]);

  // Totales de gastos
  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const filteredExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpenses]);

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
      const cat = e.category || 'Otros';
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

  const profitByOwner = {};
  cattle.forEach(c => {
    const owner = c.owner || 'Hacienda Principal';
    if (!profitByOwner[owner]) {
      profitByOwner[owner] = {
        owner,
        brand: c.ironBrand || 'N/A',
        totalHeads: 0,
        soldHeads: 0,
        totalInvested: 0,
        totalSales: 0,
        netProfit: 0,
      };
    }
    const fin = calculateFinancials(c);
    profitByOwner[owner].totalHeads++;
    profitByOwner[owner].totalInvested += fin.totalInvested;
    if (c.status === 'Vendido') {
      profitByOwner[owner].soldHeads++;
      profitByOwner[owner].totalSales += parseFloat(c.exitPrice) || 0;
      profitByOwner[owner].netProfit += fin.netProfit;
    }
  });

  const handleRevert = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`↩️ ¿Deseas anular la venta y devolver al animal ${animal.tagNumber} como ACTIVO en la finca?`)) {
      if (onRevertSale) onRevertSale(animal.id);
    }
  };

  const handleDelete = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`🗑️ ¿Deseas eliminar permanentemente el registro de este animal vendido (${animal.tagNumber})?`)) {
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
  const hasActiveExpenseFilters = expenseSearch || expenseCategory || expenseStartDate || expenseEndDate;

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
            Monitoreo de ventas, utilidades en compañía y registro opcional de gastos de finca (sales, jornales, transporte).
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
              className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition border border-teal-300 dark:border-teal-700 cursor-pointer min-h-[42px]"
            >
              <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>🤝 Liquidar Compañía</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas: Ventas vs Gastos */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setFinancesTab('sales')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap min-h-[40px] ${
            financesTab === 'sales'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Ventas & Utilidades Ganado ({allSoldCattle.length})</span>
        </button>

        <button
          onClick={() => setFinancesTab('expenses')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap min-h-[40px] ${
            financesTab === 'expenses'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gastos Operativos de Finca (Opcional)</span>
          {expenses.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {expenses.length}
            </span>
          )}
        </button>
      </div>

      {/* VISTA 1: VENTAS & UTILIDADES DE GANADO */}
      {financesTab === 'sales' && (
        <div className="space-y-6">
          {/* Tarjetas de Resumen Financiero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">Utilidad Neta Realizada</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalRealizedProfit)}</p>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1 inline-block">
                ROI Promedio: {formatNumber(overallRealizedRoi, 1)}%
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-cyan-500/5 border border-blue-200 dark:border-blue-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-400">Ingresos Totales por Ventas</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalSalesRevenue)}</p>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1 inline-block">
                {filteredSoldCattle.length} animales liquidados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-pink-500/5 border border-purple-200 dark:border-purple-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-purple-800 dark:text-purple-400">Inversión en Ganado Activo</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalActiveInvestment)}</p>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1 inline-block">
                {activeCattle.length} cabezas en finca
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">Margen Comercial</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalSalesRevenue > 0 ? formatNumber((totalRealizedProfit / totalSalesRevenue) * 100, 1) : 0}%
              </p>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1 inline-block">
                Margen sobre ventas
              </span>
            </div>
          </div>

          {/* Liquidación por Dueño / Marca */}
          <div className="custom-card p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Resumen de Liquidación y Rentabilidad por Propietario / Marca</span>
            </h3>

            {Object.keys(profitByOwner).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(profitByOwner).map(ownerData => (
                  <div key={ownerData.owner} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{ownerData.owner}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Marca: <strong>{ownerData.brand}</strong></p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        {ownerData.soldHeads} / {ownerData.totalHeads} vendidos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400">Inversión Total:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(ownerData.totalInvested)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Ventas Cobradas:</span>
                        <p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(ownerData.totalSales)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Utilidad Neta:</span>
                      <span className={`text-base font-black ${ownerData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(ownerData.netProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">No hay propietarios registrados en el sistema.</p>
            )}
          </div>

          {/* Historial Detallado de Ventas Realizadas con Filtro por Fechas */}
          <div className="custom-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Historial de Ganado Vendido & Liquidaciones ({filteredSoldCattle.length})</span>
              </h3>

              {onOpenPartnershipModal && (
                <button
                  onClick={onOpenPartnershipModal}
                  className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> Nueva Liquidación en Compañía
                </button>
              )}
            </div>

            {/* BARRA DE BÚSQUEDA Y FILTROS POR FECHA DE VENTA */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Buscador */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por arete, comprador, fecha (YYYY-MM), dueño..."
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

                {/* Modalidad de Venta */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSaleTypeFilter('')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !saleTypeFilter ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSaleTypeFilter('Compania')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      saleTypeFilter === 'Compania' ? 'bg-teal-600 text-white' : 'text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950'
                    }`}
                  >
                    🤝 Compañía
                  </button>
                  <button
                    onClick={() => setSaleTypeFilter('Directa')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      saleTypeFilter === 'Directa' ? 'bg-blue-600 text-white' : 'text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950'
                    }`}
                  >
                    💰 Directa
                  </button>
                </div>
              </div>

              {/* Rango de Fechas de Venta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    📅 Fecha de Venta / Salida Desde:
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
                    📅 Fecha de Venta / Salida Hasta:
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

      {/* VISTA 2: GASTOS OPERATIVOS DE FINCA (100% OPCIONAL) */}
      {financesTab === 'expenses' && (
        <div className="space-y-6">
          
          {/* Tarjetas de Métricas de Gastos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-400">Total Gastos de Finca</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(totalExpensesAmount)}</p>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1 inline-block">
                {expenses.length} gastos registrados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">Costo Operativo / Kg Ganado</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalGainAllCattle > 0 ? formatCurrency(costPerKgProduced) : '$0'}
              </p>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1 inline-block">
                Sobre {formatNumber(totalGainAllCattle, 0)} kg ganados en finca
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-400">Total en Filtro Actual</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(filteredExpensesAmount)}</p>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1 inline-block">
                {filteredExpenses.length} registros filtrados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-pink-500/5 border border-purple-200 dark:border-purple-500/30 shadow-sm">
              <span className="text-xs font-semibold uppercase text-purple-800 dark:text-purple-400">Categorías Utilizadas</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {Object.keys(expensesByCategory).length}
              </p>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1 inline-block">
                Tipos de insumos / labores
              </span>
            </div>
          </div>

          {/* Desglose Rápido por Categorías */}
          {Object.keys(expensesByCategory).length > 0 && (
            <div className="custom-card p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Distribución de Costos por Categoría</span>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Registro de Gastos Operativos ({filteredExpenses.length})</span>
              </h3>

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
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Descripción / Concepto</th>
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
                          {exp.description || exp.concept || '-'}
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
                      <td colSpan={5} className="p-3.5 text-amber-900 dark:text-amber-200 font-black">
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
                  Este módulo es opcional. Puedes usarlo para llevar el control de compras de sal mineral, melaza, medicamentos, jornales o fletes cuando lo requieras.
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
