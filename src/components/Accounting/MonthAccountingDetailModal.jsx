import React, { useState, useMemo } from 'react';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  MessageCircle, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Filter, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Milk, 
  Tag, 
  Scale, 
  Layers, 
  CheckCircle2, 
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { formatCurrency, formatNumber, formatDate, calculateFinancials } from '../../services/calculations';
import { EXPENSE_CATEGORIES } from './ExpenseModal';
import { INCOME_CATEGORIES } from './IncomeModal';

const CATEGORY_COLORS = {
  nomina: '#3b82f6',       // Blue
  alimentacion: '#10b981', // Emerald
  sanidad: '#ec4899',      // Pink
  servicios: '#f59e0b',    // Amber
  mantenimiento: '#8b5cf6',// Purple
  arriendos: '#06b6d4',    // Cyan
  transporte: '#f97316',   // Orange
  maquinaria: '#64748b',   // Slate
  otros: '#94a3b8',        // Gray
};

export function MonthAccountingDetailModal({
  isOpen,
  onClose,
  monthData, // { monthPrefix: '2026-07', fullLabel: 'Julio 2026', monthName: 'Julio', year: '2026', ... }
  farmExpenses = [],
  farmIncomes = [],
  cattle = [],
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onOpenAddIncome,
  onOpenEditIncome,
  onDeleteIncome,
  onSelectAnimal,
  zIndex = 'z-[60]'
}) {
  if (!isOpen || !monthData) return null;

  const monthPrefix = monthData.monthPrefix || '';
  const monthTitle = monthData.fullLabel || monthData.monthName || 'Detalle del Mes';

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'expenses' | 'cattle_sales' | 'incomes'
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCatFilter, setExpenseCatFilter] = useState('all');
  const [incomeSearch, setIncomeSearch] = useState('');
  const [cattleSearch, setCattleSearch] = useState('');

  // 1. Gastos del mes
  const monthExpenses = useMemo(() => {
    return farmExpenses.filter(e => (e.date || '').startsWith(monthPrefix));
  }, [farmExpenses, monthPrefix]);

  const totalMonthExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [monthExpenses]);

  // 2. Ventas de ganado del mes
  const monthSoldCattle = useMemo(() => {
    return cattle.filter(c => c.status === 'Vendido' && (c.exitDate || '').startsWith(monthPrefix));
  }, [cattle, monthPrefix]);

  const totalMonthCattleRevenue = useMemo(() => {
    return monthSoldCattle.reduce((sum, c) => sum + (parseFloat(c.exitPrice) || 0), 0);
  }, [monthSoldCattle]);

  const totalMonthCattleCost = useMemo(() => {
    return monthSoldCattle.reduce((sum, c) => {
      const fin = calculateFinancials(c);
      return sum + fin.totalInvested;
    }, 0);
  }, [monthSoldCattle]);

  const totalMonthCattleProfit = useMemo(() => {
    return monthSoldCattle.reduce((sum, c) => {
      const fin = calculateFinancials(c);
      return sum + fin.netProfit;
    }, 0);
  }, [monthSoldCattle]);

  // 3. Otros ingresos del mes
  const monthIncomes = useMemo(() => {
    return farmIncomes.filter(inc => (inc.date || '').startsWith(monthPrefix));
  }, [farmIncomes, monthPrefix]);

  const totalMonthOtherIncomes = useMemo(() => {
    return monthIncomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
  }, [monthIncomes]);

  // 4. Totales Consolidados del Mes
  const totalMonthRevenue = totalMonthCattleRevenue + totalMonthOtherIncomes;
  const totalMonthOperatingProfit = totalMonthCattleProfit + totalMonthOtherIncomes;
  const netMonthProfit = totalMonthOperatingProfit - totalMonthExpenses;
  const netProfitMargin = totalMonthRevenue > 0 ? (netMonthProfit / totalMonthRevenue) * 100 : 0;

  // 5. Desglose de Gastos por Categoría
  const expensesByCategory = useMemo(() => {
    const totals = {};
    monthExpenses.forEach(e => {
      const cat = e.category || 'otros';
      totals[cat] = (totals[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    return Object.entries(totals)
      .map(([catId, amount]) => {
        const catInfo = EXPENSE_CATEGORIES.find(c => c.id === catId);
        return {
          id: catId,
          name: catInfo ? catInfo.label : 'Otros',
          icon: catInfo ? catInfo.icon : '📦',
          value: amount,
          percentage: totalMonthExpenses > 0 ? (amount / totalMonthExpenses) * 100 : 0,
          color: CATEGORY_COLORS[catId] || '#94a3b8'
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses, totalMonthExpenses]);

  // 6. Listas Filtradas para las Tablas
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter(e => {
      if (expenseCatFilter !== 'all' && e.category !== expenseCatFilter) return false;
      if (expenseSearch) {
        const q = expenseSearch.toLowerCase();
        const concept = (e.concept || '').toLowerCase();
        const notes = (e.notes || '').toLowerCase();
        const pay = (e.paymentMethod || '').toLowerCase();
        if (!concept.includes(q) && !notes.includes(q) && !pay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [monthExpenses, expenseCatFilter, expenseSearch]);

  const filteredSoldCattle = useMemo(() => {
    return monthSoldCattle.filter(c => {
      if (cattleSearch) {
        const q = cattleSearch.toLowerCase();
        const tag = (c.tagNumber || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const buyer = (c.saleBuyer || c.buyer || '').toLowerCase();
        const breed = (c.breed || '').toLowerCase();
        const owner = (c.owner || '').toLowerCase();
        if (!tag.includes(q) && !name.includes(q) && !buyer.includes(q) && !breed.includes(q) && !owner.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.exitDate || '').localeCompare(a.exitDate || ''));
  }, [monthSoldCattle, cattleSearch]);

  const filteredIncomes = useMemo(() => {
    return monthIncomes.filter(inc => {
      if (incomeSearch) {
        const q = incomeSearch.toLowerCase();
        const concept = (inc.concept || '').toLowerCase();
        const notes = (inc.notes || '').toLowerCase();
        if (!concept.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [monthIncomes, incomeSearch]);

  // 7. Exportación a Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen del Mes
    const summaryData = [
      [`INFORME FINANCIERO MENSUAL - ${monthTitle.toUpperCase()}`],
      [`Fecha de Generación: ${formatDate(new Date())}`],
      [],
      ['INDICADOR / RUBRO', 'VALOR'],
      ['Ventas de Ganado (Ingreso Bruto)', totalMonthCattleRevenue],
      ['Costo Histórico de Ganado Vendido', totalMonthCattleCost],
      ['Ganancia Neta en Venta de Ganado', totalMonthCattleProfit],
      ['Otros Ingresos (Leche, Servicios, etc.)', totalMonthOtherIncomes],
      ['INGRESOS TOTALES OPERATIVOS', totalMonthRevenue],
      ['GASTOS TOTALES DE FINCA', totalMonthExpenses],
      ['UTILIDAD NETA FINAL DEL MES', netMonthProfit],
      ['Margen de Rentabilidad (%)', `${formatNumber(netProfitMargin, 1)}%`],
      [],
      ['DESGLOSE DE GASTOS POR RUBRO'],
      ['Categoría', 'Gasto ($)', '% del Total']
    ];

    expensesByCategory.forEach(cat => {
      summaryData.push([cat.name, cat.value, `${formatNumber(cat.percentage, 1)}%`]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Mes');

    // Hoja 2: Gastos Detallados
    const expensesRows = [
      [`GASTOS DETALLADOS - ${monthTitle.toUpperCase()}`],
      [],
      ['Fecha', 'Categoría', 'Tipo', 'Concepto', 'Medio de Pago', 'Monto ($ COP)', 'Notas / Observaciones']
    ];

    monthExpenses.forEach(e => {
      const catInfo = EXPENSE_CATEGORIES.find(c => c.id === e.category);
      expensesRows.push([
        formatDate(e.date),
        catInfo ? catInfo.label : (e.category || 'Otros'),
        e.type || 'Variable',
        e.concept || '',
        e.paymentMethod || 'Efectivo',
        parseFloat(e.amount) || 0,
        e.notes || ''
      ]);
    });

    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesRows);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Gastos');

    // Hoja 3: Ganado Vendido
    if (monthSoldCattle.length > 0) {
      const cattleRows = [
        [`GANADO VENDIDO EN ${monthTitle.toUpperCase()}`],
        [],
        ['Chapa/Arete', 'Nombre', 'Comprador', 'Fecha Venta', 'Peso Salida (kg)', 'Precio Venta ($)', 'Costo/Compra ($)', 'Utilidad Neta ($)', 'ROI (%)']
      ];

      monthSoldCattle.forEach(c => {
        const fin = calculateFinancials(c);
        cattleRows.push([
          c.tagNumber || 'S/N',
          c.name || '-',
          c.saleBuyer || c.buyer || 'No registrado',
          formatDate(c.exitDate),
          parseFloat(c.exitWeight) || 0,
          parseFloat(c.exitPrice) || 0,
          fin.totalInvested,
          fin.netProfit,
          `${fin.roi}%`
        ]);
      });

      const wsCattle = XLSX.utils.aoa_to_sheet(cattleRows);
      XLSX.utils.book_append_sheet(wb, wsCattle, 'Ganado Vendido');
    }

    // Hoja 4: Otros Ingresos
    if (monthIncomes.length > 0) {
      const incomeRows = [
        [`OTROS INGRESOS EN ${monthTitle.toUpperCase()}`],
        [],
        ['Fecha', 'Categoría', 'Concepto', 'Medio de Cobro', 'Monto ($ COP)', 'Notas']
      ];

      monthIncomes.forEach(inc => {
        const catInfo = INCOME_CATEGORIES.find(c => c.id === inc.category);
        incomeRows.push([
          formatDate(inc.date),
          catInfo ? catInfo.label : (inc.category || 'Otros'),
          inc.concept || '',
          inc.paymentMethod || 'Transferencia',
          parseFloat(inc.amount) || 0,
          inc.notes || ''
        ]);
      });

      const wsIncomes = XLSX.utils.aoa_to_sheet(incomeRows);
      XLSX.utils.book_append_sheet(wb, wsIncomes, 'Otros Ingresos');
    }

    const safeTitle = monthTitle.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Balance_Financiero_${safeTitle}.xlsx`);
  };

  // 8. Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    let text = `📊 *INFORME FINANCIERO MENSUAL: ${monthTitle.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `💰 *INGRESOS OPERATIVOS:*\n`;
    text += `• Ganado Vendido: ${formatCurrency(totalMonthCattleRevenue)} (${monthSoldCattle.length} cabezas)\n`;
    if (totalMonthOtherIncomes > 0) {
      text += `• Otros Ingresos (Leche/Servicios): ${formatCurrency(totalMonthOtherIncomes)}\n`;
    }
    text += `*Total Ingresos:* ${formatCurrency(totalMonthRevenue)}\n\n`;

    text += `💸 *GASTOS DE FINCA:*\n`;
    text += `*Total Gastos:* ${formatCurrency(totalMonthExpenses)} (${monthExpenses.length} registros)\n`;
    if (expensesByCategory.length > 0) {
      expensesByCategory.slice(0, 4).forEach(cat => {
        text += `  - ${cat.icon} ${cat.name}: ${formatCurrency(cat.value)}\n`;
      });
    }
    text += `\n`;

    text += `📈 *RESULTADO & UTILIDAD NETA:*\n`;
    text += `• Utilidad Neta: ${formatCurrency(netMonthProfit)}\n`;
    text += `• Margen de Rentabilidad: ${formatNumber(netProfitMargin, 1)}%\n\n`;

    text += `_Generado desde Software Ganadero_ 🐮🌱`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn`}>
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* ========================================================================= */}
        {/* HEADER DEL MODAL                                                          */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                  Balance Detallado de {monthTitle}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  netMonthProfit >= 0 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {netMonthProfit >= 0 ? `+${formatCurrency(netMonthProfit)} de Utilidad` : `${formatCurrency(netMonthProfit)} (Déficit)`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Desglose completo de gastos operativos, ventas de ganado y otros ingresos en este mes.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Descargar reporte en Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TARJETAS KPI RESUMIDAS DEL MES                                            */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          
          {/* Card 1: Ingresos Totales */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Ingresos del Mes
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-md font-bold">
                {monthSoldCattle.length + monthIncomes.length} ops
              </span>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalMonthRevenue)}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Ganado: {formatCurrency(totalMonthCattleRevenue)}
            </p>
          </div>

          {/* Card 2: Gastos Totales */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-bold">
              <span className="flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                Gastos del Mes
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded-md font-bold">
                {monthExpenses.length} reg
              </span>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalMonthExpenses)}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
              {expensesByCategory.length} categorías activas
            </p>
          </div>

          {/* Card 3: Utilidad Neta */}
          <div className={`p-3.5 rounded-2xl border ${
            netMonthProfit >= 0
              ? 'bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400'
              : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Utilidad Neta
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/60 dark:bg-black/40">
                {formatNumber(netProfitMargin, 1)}% margen
              </span>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(netMonthProfit)}
            </p>
            <p className="text-[11px] mt-0.5 opacity-90">
              Ganancia ganadera neta
            </p>
          </div>

          {/* Card 4: Resumen Comercial */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-bold">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Venta de Ganado
              </span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                {monthSoldCattle.length} cabezas
              </span>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalMonthCattleProfit)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Utilidad neta de ventas
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* NAVEGACIÓN POR PESTAÑAS DENTRO DEL MES                                    */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 sm:px-4 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Resumen & Gráficas</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 sm:px-4 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>💸 Gastos ({monthExpenses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cattle_sales')}
              className={`px-3 sm:px-4 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'cattle_sales'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🐄 Ganado Vendido ({monthSoldCattle.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('incomes')}
              className={`px-3 sm:px-4 py-2 text-xs font-extrabold rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'incomes'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🥛 Otros Ingresos ({monthIncomes.length})</span>
            </button>

          </div>

          {/* Botones rápidos de agregar en este mes */}
          <div className="flex items-center gap-1 pb-1">
            {onOpenAddExpense && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddExpense();
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Gasto</span>
              </button>
            )}
            {onOpenAddIncome && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddIncome();
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Ingreso</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTENIDO DE LA PESTAÑA SELECCIONADA                                      */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 1: RESUMEN & GRÁFICAS DEL MES                                         */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Desglose de Gastos por Categoría */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <PieChartIcon className="w-4 h-4 text-rose-500" />
                      Gastos por Categoría ({formatCurrency(totalMonthExpenses)})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {monthExpenses.length} registros
                    </span>
                  </div>

                  {expensesByCategory.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {expensesByCategory.map(cat => (
                        <div key={cat.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{cat.icon}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white truncate block">{cat.name}</span>
                              <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-900 dark:text-white block">{formatCurrency(cat.value)}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{formatNumber(cat.percentage, 1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No se registraron gastos en este mes.</p>
                  )}
                </div>

                {/* Desglose de Ingresos del Mes */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Fuentes de Ingreso ({formatCurrency(totalMonthRevenue)})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {monthSoldCattle.length + monthIncomes.length} fuentes
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Fila 1: Venta de Ganado */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🐄</span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Ventas de Ganado</div>
                          <div className="text-[10px] text-slate-400">{monthSoldCattle.length} animales comercializados</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalMonthCattleRevenue)}</div>
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Utilidad: +{formatCurrency(totalMonthCattleProfit)}</div>
                      </div>
                    </div>

                    {/* Fila 2: Otros Ingresos */}
                    {monthIncomes.length > 0 && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥛</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">Lechería & Otros Rubros</div>
                            <div className="text-[10px] text-slate-400">{monthIncomes.length} registros ingresados</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-teal-600 dark:text-teal-400">+{formatCurrency(totalMonthOtherIncomes)}</div>
                          <div className="text-[10px] text-slate-400">Ingreso operativo</div>
                        </div>
                      </div>
                    )}

                    {/* Fila 3: Balance Final */}
                    <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 flex items-center justify-between text-xs mt-2">
                      <div>
                        <span className="font-extrabold text-indigo-900 dark:text-indigo-200">Balance Contable Mensual</span>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Ingresos Operativos - Gastos</p>
                      </div>
                      <div className="text-right font-black text-base text-indigo-900 dark:text-indigo-200">
                        {formatCurrency(netMonthProfit)}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Botones de acción rápida para profundizar en las tablas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition text-left flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-rose-600 transition">Ver los {monthExpenses.length} Gastos</div>
                    <div className="text-[11px] text-slate-400">{formatCurrency(totalMonthExpenses)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={() => setActiveTab('cattle_sales')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition text-left flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Ver {monthSoldCattle.length} Ventas de Ganado</div>
                    <div className="text-[11px] text-slate-400">{formatCurrency(totalMonthCattleRevenue)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={() => setActiveTab('incomes')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition text-left flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-teal-600 transition">Ver {monthIncomes.length} Otros Ingresos</div>
                    <div className="text-[11px] text-slate-400">{formatCurrency(totalMonthOtherIncomes)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition" />
                </button>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 2: TABLA DETALLADA DE GASTOS DEL MES                                  */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'expenses' && (
            <div className="space-y-3">
              
              {/* Filtros de la tabla de gastos */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Buscar por concepto, medio de pago o nota..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <select
                  value={expenseCatFilter}
                  onChange={(e) => setExpenseCatFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Todas las categorías ({monthExpenses.length})</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Concepto / Detalle</th>
                      <th className="p-3">Pago</th>
                      <th className="p-3 text-right">Monto ($ COP)</th>
                      {(onOpenEditExpense || onDeleteExpense) && (
                        <th className="p-3 text-center">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map(exp => {
                        const catObj = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                        return (
                          <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                              {formatDate(exp.date)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                <span>{catObj ? catObj.icon : '📦'}</span>
                                <span>{catObj ? catObj.label : (exp.category || 'Otros')}</span>
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                exp.type === 'Fijo' 
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                  : exp.type === 'Inversión'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              }`}>
                                {exp.type || 'Variable'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">{exp.concept}</div>
                              {exp.notes && (
                                <div className="text-[10px] text-slate-400 truncate max-w-xs">{exp.notes}</div>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-500 text-[11px]">
                              {exp.paymentMethod || 'Efectivo'}
                            </td>
                            <td className="p-3 whitespace-nowrap text-right font-black text-rose-600 dark:text-rose-400">
                              - {formatCurrency(exp.amount)}
                            </td>
                            {(onOpenEditExpense || onDeleteExpense) && (
                              <td className="p-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {onOpenEditExpense && (
                                    <button
                                      onClick={() => {
                                        onClose();
                                        onOpenEditExpense(exp);
                                      }}
                                      title="Editar Gasto"
                                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {onDeleteExpense && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`¿Deseas eliminar el gasto "${exp.concept}" (${formatCurrency(exp.amount)})?`)) {
                                          onDeleteExpense(exp.id);
                                        }
                                      }}
                                      title="Eliminar Gasto"
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                          {expenseSearch || expenseCatFilter !== 'all' 
                            ? 'No se encontraron gastos que coincidan con la búsqueda.' 
                            : 'No hay gastos registrados en este mes.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white">
                      <tr>
                        <td colSpan={5} className="p-3 text-right text-xs uppercase">Total Gastos Mostrados:</td>
                        <td className="p-3 text-right text-rose-600 dark:text-rose-400 text-sm">
                          - {formatCurrency(filteredExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0))}
                        </td>
                        {(onOpenEditExpense || onDeleteExpense) && <td></td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 3: TABLA DE GANADO VENDIDO EN EL MES                                 */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'cattle_sales' && (
            <div className="space-y-3">
              
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={cattleSearch}
                    onChange={(e) => setCattleSearch(e.target.value)}
                    placeholder="Buscar por arete, comprador, raza o propietario..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Chapa / Arete</th>
                      <th className="p-3">Fecha Venta</th>
                      <th className="p-3">Comprador</th>
                      <th className="p-3 text-right">Peso Salida</th>
                      <th className="p-3 text-right">Precio Venta ($)</th>
                      <th className="p-3 text-right">Costo Total ($)</th>
                      <th className="p-3 text-right">Utilidad Neta ($)</th>
                      <th className="p-3 text-center">ROI (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSoldCattle.length > 0 ? (
                      filteredSoldCattle.map(animal => {
                        const fin = calculateFinancials(animal);
                        return (
                          <tr 
                            key={animal.id}
                            onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                          >
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                {animal.tagNumber}
                              </div>
                              {animal.name && <div className="text-[10px] text-slate-400">{animal.name}</div>}
                            </td>
                            <td className="p-3 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                              {formatDate(animal.exitDate)}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {animal.saleBuyer || animal.buyer || 'No registrado'}
                            </td>
                            <td className="p-3 whitespace-nowrap text-right font-semibold text-slate-800 dark:text-slate-200">
                              {animal.exitWeight ? `${animal.exitWeight} kg` : '-'}
                            </td>
                            <td className="p-3 whitespace-nowrap text-right font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(animal.exitPrice)}
                            </td>
                            <td className="p-3 whitespace-nowrap text-right text-slate-500 dark:text-slate-400">
                              {formatCurrency(fin.totalInvested)}
                            </td>
                            <td className={`p-3 whitespace-nowrap text-right font-black ${
                              fin.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {formatCurrency(fin.netProfit)}
                            </td>
                            <td className="p-3 whitespace-nowrap text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                fin.roi >= 0 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                              }`}>
                                {fin.roi}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          {cattleSearch ? 'No se encontraron animales vendidos que coincidan con la búsqueda.' : 'No se registraron ventas de ganado en este mes.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredSoldCattle.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white">
                      <tr>
                        <td colSpan={4} className="p-3 text-right text-xs uppercase">Totales del Mes:</td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(filteredSoldCattle.reduce((s, a) => s + (parseFloat(a.exitPrice) || 0), 0))}
                        </td>
                        <td className="p-3 text-right text-slate-600 dark:text-slate-300 text-xs">
                          {formatCurrency(filteredSoldCattle.reduce((s, a) => s + calculateFinancials(a).totalInvested, 0))}
                        </td>
                        <td className="p-3 text-right text-indigo-600 dark:text-indigo-400 text-sm">
                          {formatCurrency(filteredSoldCattle.reduce((s, a) => s + calculateFinancials(a).netProfit, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TAB 4: TABLA DE OTROS INGRESOS DEL MES                                    */}
          {/* ------------------------------------------------------------------------- */}
          {activeTab === 'incomes' && (
            <div className="space-y-3">
              
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={incomeSearch}
                    onChange={(e) => setIncomeSearch(e.target.value)}
                    placeholder="Buscar por concepto o notas..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Concepto / Detalle</th>
                      <th className="p-3">Cobro</th>
                      <th className="p-3 text-right">Monto ($ COP)</th>
                      {(onOpenEditIncome || onDeleteIncome) && (
                        <th className="p-3 text-center">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredIncomes.length > 0 ? (
                      filteredIncomes.map(inc => {
                        const catObj = INCOME_CATEGORIES.find(c => c.id === inc.category);
                        return (
                          <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                              {formatDate(inc.date)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                <span>{catObj ? catObj.icon : '💰'}</span>
                                <span>{catObj ? catObj.label : (inc.category || 'Otros')}</span>
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">{inc.concept}</div>
                              {inc.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{inc.notes}</div>}
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-500 text-[11px]">
                              {inc.paymentMethod || 'Transferencia'}
                            </td>
                            <td className="p-3 whitespace-nowrap text-right font-black text-teal-600 dark:text-teal-400">
                              + {formatCurrency(inc.amount)}
                            </td>
                            {(onOpenEditIncome || onDeleteIncome) && (
                              <td className="p-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {onOpenEditIncome && (
                                    <button
                                      onClick={() => {
                                        onClose();
                                        onOpenEditIncome(inc);
                                      }}
                                      title="Editar Ingreso"
                                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {onDeleteIncome && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`¿Deseas eliminar el ingreso "${inc.concept}" (${formatCurrency(inc.amount)})?`)) {
                                          onDeleteIncome(inc.id);
                                        }
                                      }}
                                      title="Eliminar Ingreso"
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                          {incomeSearch ? 'No se encontraron ingresos que coincidan con la búsqueda.' : 'No hay otros ingresos registrados en este mes.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredIncomes.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white">
                      <tr>
                        <td colSpan={4} className="p-3 text-right text-xs uppercase">Total Ingresos Adicionales:</td>
                        <td className="p-3 text-right text-teal-600 dark:text-teal-400 text-sm">
                          + {formatCurrency(filteredIncomes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0))}
                        </td>
                        {(onOpenEditIncome || onDeleteIncome) && <td></td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* FOOTER DEL MODAL                                                          */}
        {/* ========================================================================= */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Los datos de ventas y gastos se consolidan en tiempo real para este mes.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
