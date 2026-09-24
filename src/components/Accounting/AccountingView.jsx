import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  DownloadCloud, 
  MessageCircle, 
  Filter, 
  Calendar, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertTriangle, 
  Scale, 
  Milk, 
  Users, 
  PieChart as PieChartIcon, 
  BarChart3, 
  FileSpreadsheet, 
  HelpCircle,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { formatCurrency, formatNumber, formatDate, calculateFinancials } from '../../services/calculations';
import { useAuth } from '../../context/AuthContext';
import { EXPENSE_CATEGORIES } from './ExpenseModal';
import { INCOME_CATEGORIES } from './IncomeModal';
import { MonthAccountingDetailModal } from './MonthAccountingDetailModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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

export function AccountingView({ 
  cattle = [], 
  weighings = [], 
  farmExpenses = [], 
  farmIncomes = [], 
  onOpenAddExpense, 
  onOpenEditExpense, 
  onDeleteExpense, 
  onOpenAddIncome, 
  onOpenEditIncome, 
  onDeleteIncome,
  onSelectAnimal
}) {
  const { currentUser, isWorker } = useAuth();
  
  // Estados de navegación interna
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'expenses' | 'incomes' | 'unit_costs'
  const [selectedMonthForDetail, setSelectedMonthForDetail] = useState(null);
  
  // Filtros de fecha
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  const [timeFilter, setTimeFilter] = useState('current_month'); // 'current_month' | 'last_3_months' | 'current_year' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Filtros de tablas
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState('all');

  if (isWorker) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="text-4xl">🔒</div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">Módulo Financiero Restringido</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Los reportes de costos, nómina, balance y rentabilidad están reservados exclusivamente para el administrador.
        </p>
      </div>
    );
  }

  // Rango de fechas según el filtro seleccionado
  const dateRange = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (timeFilter === 'current_month') {
      const start = new Date(y, m, 1).toISOString().slice(0, 10);
      const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      return { start, end, label: `${MONTH_NAMES[m]} ${y}` };
    }
    if (timeFilter === 'last_3_months') {
      const start = new Date(y, m - 2, 1).toISOString().slice(0, 10);
      const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      return { start, end, label: 'Últimos 3 Meses' };
    }
    if (timeFilter === 'current_year') {
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      return { start, end, label: `Año ${y}` };
    }
    if (timeFilter === 'custom') {
      return { 
        start: customStartDate || '1970-01-01', 
        end: customEndDate || '2099-12-31', 
        label: `${customStartDate || 'Inicio'} a ${customEndDate || 'Hoy'}` 
      };
    }
    return { start: '1970-01-01', end: '2099-12-31', label: 'Todo el Historial' };
  }, [timeFilter, customStartDate, customEndDate]);

  // 1. Filtrar Gastos de la Finca en el período
  const periodExpenses = useMemo(() => {
    return farmExpenses.filter(exp => {
      const d = exp.date || exp.createdAt?.slice(0, 10) || '';
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [farmExpenses, dateRange]);

  // 2. Filtrar Ingresos Adicionales en el período
  const periodIncomes = useMemo(() => {
    return farmIncomes.filter(inc => {
      const d = inc.date || inc.createdAt?.slice(0, 10) || '';
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [farmIncomes, dateRange]);

  // 3. Filtrar Ventas de Ganado en el período
  const periodSoldCattle = useMemo(() => {
    return cattle.filter(c => {
      if (c.status !== 'Vendido') return false;
      const d = c.exitDate || '';
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [cattle, dateRange]);

  // ==========================================
  // CÁLCULOS FINANCIEROS CLAVE
  // ==========================================
  
  // Total de gastos
  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [periodExpenses]);

  // Gastos Fijos vs Variables vs Inversiones
  const fixedExpenses = useMemo(() => {
    return periodExpenses
      .filter(e => e.type === 'Fijo')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [periodExpenses]);

  const variableExpenses = useMemo(() => {
    return periodExpenses
      .filter(e => e.type === 'Variable')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [periodExpenses]);

  const investmentExpenses = useMemo(() => {
    return periodExpenses
      .filter(e => e.type === 'Inversión')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [periodExpenses]);

  // Ventas de Ganado: Total Bruto, Capital Recuperado y Utilidad Limpia
  const cattleSalesMetrics = useMemo(() => {
    let grossRevenue = 0;
    let purchaseCapitalRecovered = 0;
    let grossProfit = 0;
    let kilosSold = 0;

    periodSoldCattle.forEach(c => {
      const exitPrice = parseFloat(c.exitPrice) || 0;
      const purchasePrice = parseFloat(c.entryPrice || c.purchasePrice) || 0;
      const exitWeight = parseFloat(c.exitWeight) || 0;
      
      grossRevenue += exitPrice;
      purchaseCapitalRecovered += purchasePrice;
      grossProfit += (exitPrice - purchasePrice);
      kilosSold += exitWeight;
    });

    return {
      grossRevenue,
      purchaseCapitalRecovered,
      grossProfit,
      kilosSold,
      count: periodSoldCattle.length
    };
  }, [periodSoldCattle]);

  // Otros ingresos (Leche, arriendos, abonos, etc.)
  const additionalIncomesTotal = useMemo(() => {
    return periodIncomes.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  }, [periodIncomes]);

  // Ingresos Totales de la Finca (Brutos)
  const totalGrossIncome = cattleSalesMetrics.grossRevenue + additionalIncomesTotal;

  // Utilidad Neta Real Ganadera = (Utilidad Bruta de Ganado + Otros Ingresos) - Gastos Operativos de Finca
  const realNetProfit = (cattleSalesMetrics.grossProfit + additionalIncomesTotal) - totalExpenses;

  // Porcentaje de Cobertura de Gastos con las Utilidades del Ganado & Leche
  const totalOperationalProfitGenerated = cattleSalesMetrics.grossProfit + additionalIncomesTotal;
  const expenseCoveragePercent = totalExpenses > 0 
    ? Math.round((totalOperationalProfitGenerated / totalExpenses) * 100) 
    : (totalOperationalProfitGenerated > 0 ? 100 : 0);

  // Semáforo Financiero
  const financialStatus = useMemo(() => {
    if (totalExpenses === 0 && totalOperationalProfitGenerated === 0) {
      return { status: 'neutral', label: 'Sin Movimientos', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300' };
    }
    if (realNetProfit > 0) {
      return { status: 'positive', label: '🟢 Superávit (Positivo)', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800' };
    }
    if (realNetProfit === 0 || Math.abs(realNetProfit) < 1000) {
      return { status: 'breakeven', label: '🟡 Punto de Equilibrio', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800' };
    }
    return { status: 'negative', label: '🔴 Déficit (Gastos superan ganancias)', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-300 dark:border-rose-800' };
  }, [realNetProfit, totalExpenses, totalOperationalProfitGenerated]);

  // ==========================================
  // COSTOS UNITARIOS ZOOTÉCNICOS ($/kg, $/litro, $/animal/día)
  // ==========================================
  
  // Kilos de carne ganados en el período por pesajes
  const totalKilosGainedInPeriod = useMemo(() => {
    // Estimación con base en la ganancia de peso del hato o kilos vendidos
    const activeCattleCount = cattle.filter(c => c.status === 'Activo').length;
    // Si tenemos pesajes calculamos ganancia, o fallback a GDP promedio * cabezas * días
    let totalGain = 0;
    cattle.forEach(c => {
      const initialW = parseFloat(c.initialWeight) || 0;
      const currentW = parseFloat(c.weight) || parseFloat(c.exitWeight) || initialW;
      if (currentW > initialW) {
        totalGain += (currentW - initialW);
      }
    });
    return totalGain > 0 ? totalGain : (cattleSalesMetrics.kilosSold || 1);
  }, [cattle, cattleSalesMetrics]);

  // Costo por Kilo de Carne Producido ($ / kg)
  const costPerKgProduced = useMemo(() => {
    if (totalKilosGainedInPeriod <= 0 || totalExpenses <= 0) return 0;
    return totalExpenses / totalKilosGainedInPeriod;
  }, [totalExpenses, totalKilosGainedInPeriod]);

  // Costo Diario por Cabeza ($ / animal / día)
  const costPerAnimalDay = useMemo(() => {
    const activeCount = cattle.filter(c => c.status === 'Activo').length;
    if (activeCount === 0 || totalExpenses === 0) return 0;
    const daysInPeriod = 30; // Promedio mensual
    return totalExpenses / (activeCount * daysInPeriod);
  }, [cattle, totalExpenses]);

  // Costo por Litro de Leche Producido ($ / litro)
  const costPerMilkLiter = useMemo(() => {
    const milkExpenses = periodExpenses
      .filter(e => e.category === 'alimentacion' || e.category === 'nomina' || e.concept?.toLowerCase().includes('leche'))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // Total litros registrados en ingresos o aproximados
    let totalLiters = 0;
    periodIncomes.filter(i => i.category === 'leche').forEach(i => {
      // Estimar litros si el precio por litro ronda $1.800-$2.200 o extraer de texto
      totalLiters += (parseFloat(i.amount) || 0) / 2000;
    });

    if (totalLiters <= 0 || milkExpenses <= 0) return 0;
    return milkExpenses / totalLiters;
  }, [periodExpenses, periodIncomes]);

  // ==========================================
  // DATOS PARA GRÁFICOS (RECHARTS)
  // ==========================================
  
  // 1. Gráfico de Torta: Gastos por Categoría
  const categoryPieData = useMemo(() => {
    const totals = {};
    EXPENSE_CATEGORIES.forEach(cat => { totals[cat.id] = 0; });

    periodExpenses.forEach(exp => {
      const cat = exp.category || 'otros';
      totals[cat] = (totals[cat] || 0) + (parseFloat(exp.amount) || 0);
    });

    return Object.entries(totals)
      .map(([catId, amount]) => {
        const catInfo = EXPENSE_CATEGORIES.find(c => c.id === catId);
        return {
          id: catId,
          name: catInfo ? catInfo.label : 'Otros',
          icon: catInfo ? catInfo.icon : '📦',
          value: amount,
          color: CATEGORY_COLORS[catId] || '#94a3b8'
        };
      })
      .filter(item => item.value > 0);
  }, [periodExpenses]);

  // 2. Gráfico Mensual Comparativo (Últimos 6 meses)
  const monthlyComparisonData = useMemo(() => {
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mNum = (d.getMonth() + 1).toString().padStart(2, '0');
      const yNum = d.getFullYear().toString();
      const monthPrefix = `${yNum}-${mNum}`;
      const monthLabel = MONTH_NAMES[d.getMonth()].slice(0, 3);

      // Gastos del mes
      const monthExp = farmExpenses
        .filter(e => (e.date || '').startsWith(monthPrefix))
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      // Utilidad de ventas de ganado del mes
      const monthCattleProfit = cattle
        .filter(c => c.status === 'Vendido' && (c.exitDate || '').startsWith(monthPrefix))
        .reduce((sum, c) => {
          const exitPrice = parseFloat(c.exitPrice) || 0;
          const purchasePrice = parseFloat(c.purchasePrice) || 0;
          return sum + (exitPrice - purchasePrice);
        }, 0);

      // Otros ingresos del mes
      const monthOtherInc = farmIncomes
        .filter(inc => (inc.date || '').startsWith(monthPrefix))
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

      const monthIncome = monthCattleProfit + monthOtherInc;
      const monthNet = monthIncome - monthExp;

      data.push({
        month: monthLabel,
        fullLabel: `${MONTH_NAMES[d.getMonth()]} ${yNum}`,
        monthPrefix,
        year: yNum,
        monthName: MONTH_NAMES[d.getMonth()],
        monthIndex: d.getMonth(),
        Ingresos: monthIncome,
        Gastos: monthExp,
        UtilidadNeta: monthNet
      });
    }

    return data;
  }, [farmExpenses, farmIncomes, cattle]);

  // ==========================================
  // FILTRADO DE TABLAS
  // ==========================================
  
  const filteredExpensesList = useMemo(() => {
    return periodExpenses.filter(exp => {
      if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
      if (expenseTypeFilter !== 'all' && exp.type !== expenseTypeFilter) return false;
      if (expenseSearch) {
        const q = expenseSearch.toLowerCase();
        const concept = (exp.concept || '').toLowerCase();
        const notes = (exp.notes || '').toLowerCase();
        const pay = (exp.paymentMethod || '').toLowerCase();
        if (!concept.includes(q) && !notes.includes(q) && !pay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [periodExpenses, expenseCategoryFilter, expenseTypeFilter, expenseSearch]);

  const filteredIncomesList = useMemo(() => {
    return periodIncomes.filter(inc => {
      if (incomeCategoryFilter !== 'all' && inc.category !== incomeCategoryFilter) return false;
      if (incomeSearch) {
        const q = incomeSearch.toLowerCase();
        const concept = (inc.concept || '').toLowerCase();
        const notes = (inc.notes || '').toLowerCase();
        if (!concept.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [periodIncomes, incomeCategoryFilter, incomeSearch]);

  // ==========================================
  // EXPORTACIÓN A EXCEL CONTABLE PROFESIONAL
  // ==========================================
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Hoja de Resumen
    const summaryData = [
      ['INFORME FINANCIERO Y CONTABILIDAD GANADERA'],
      ['Finca:', currentUser?.farmName || 'GANADERIA LA G'],
      ['Período:', dateRange.label],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
      [],
      ['CONCEPTO FINANCIERO', 'MONTO ($ COP)'],
      ['Ingresos por Venta de Ganado (Total Bruto)', cattleSalesMetrics.grossRevenue],
      ['(-) Capital de Compra de Animales Recuperado', cattleSalesMetrics.purchaseCapitalRecovered],
      ['(=) Utilidad Bruta por Venta de Ganado', cattleSalesMetrics.grossProfit],
      ['(+) Otros Ingresos (Leche, Arriendos, Abonos)', additionalIncomesTotal],
      ['(=) TOTAL INGRESOS OPERATIVOS DISPONIBLES', totalOperationalProfitGenerated],
      [],
      ['GASTOS OPERATIVOS DE LA FINCA', 'MONTO ($ COP)'],
      ['Gastos Fijos (Nómina, Servicios, Arriendos)', fixedExpenses],
      ['Gastos Variables (Sal, Concentrado, Sanidad)', variableExpenses],
      ['Inversiones & Mejoras', investmentExpenses],
      ['(=) TOTAL GASTOS DE LA FINCA', totalExpenses],
      [],
      ['RESULTADO FINAL GANADERO', 'MONTO ($ COP)'],
      ['UTILIDAD NETA REAL DE LA FINCA', realNetProfit],
      ['Cobertura de Gastos con Ventas', `${expenseCoveragePercent}%`],
      ['Costo por Kilo de Carne Producido', `${formatCurrency(costPerKgProduced)} / kg`],
      ['Costo Diario de Mantenimiento por Cabeza', `${formatCurrency(costPerAnimalDay)} / día`]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Financiero');

    // 2. Hoja de Gastos Detallados
    const expensesRows = [
      ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Método Pago', 'Recurrente', 'Monto ($ COP)', 'Notas']
    ];
    periodExpenses.forEach(e => {
      const catObj = EXPENSE_CATEGORIES.find(c => c.id === e.category);
      expensesRows.push([
        e.date || '',
        e.type || 'Variable',
        catObj ? catObj.label : (e.category || 'Otros'),
        e.concept || '',
        e.paymentMethod || 'Efectivo',
        e.isRecurring ? 'Sí (Mensual)' : 'No',
        parseFloat(e.amount) || 0,
        e.notes || ''
      ]);
    });
    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesRows);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Libro de Gastos');

    // 3. Hoja de Ingresos
    const incomesRows = [
      ['Fecha', 'Categoría', 'Concepto', 'Método Cobro', 'Monto ($ COP)', 'Notas']
    ];
    periodIncomes.forEach(i => {
      const catObj = INCOME_CATEGORIES.find(c => c.id === i.category);
      incomesRows.push([
        i.date || '',
        catObj ? catObj.label : (i.category || 'Otros'),
        i.concept || '',
        i.paymentMethod || 'Transferencia',
        parseFloat(i.amount) || 0,
        i.notes || ''
      ]);
    });
    const wsIncomes = XLSX.utils.aoa_to_sheet(incomesRows);
    XLSX.utils.book_append_sheet(wb, wsIncomes, 'Libro de Ingresos');

    // Descargar archivo
    const cleanFarm = (currentUser?.farmName || 'Finca').toLowerCase().replace(/[^a-z0-9]/g, '_');
    XLSX.writeFile(wb, `contabilidad_${cleanFarm}_${dateRange.start}_${dateRange.end}.xlsx`);
  };

  // ==========================================
  // REPORTE FINANCIERO POR WHATSAPP
  // ==========================================
  const handleShareWhatsApp = () => {
    const text = `📊 *BALANCE FINANCIERO GANADERO* 🐂\n` +
      `🏡 *Finca:* ${currentUser?.farmName || 'GANADERIA LA G'}\n` +
      `📅 *Período:* ${dateRange.label}\n` +
      `--------------------------------\n` +
      `📥 *Ingresos Operativos:* ${formatCurrency(totalOperationalProfitGenerated)}\n` +
      `• Ganancia limpia por Ganado: ${formatCurrency(cattleSalesMetrics.grossProfit)} (${cattleSalesMetrics.count} animales)\n` +
      `• Leche & Otros Ingresos: ${formatCurrency(additionalIncomesTotal)}\n\n` +
      `📤 *Gastos de la Finca:* ${formatCurrency(totalExpenses)}\n` +
      `• Fijos (Nómina/Luz/Arriendos): ${formatCurrency(fixedExpenses)}\n` +
      `• Variables (Sal/Sanidad/Insumos): ${formatCurrency(variableExpenses)}\n` +
      `--------------------------------\n` +
      `💰 *UTILIDAD NETA REAL:* ${formatCurrency(realNetProfit)}\n` +
      `🎯 *Estado:* ${financialStatus.label}\n` +
      `📈 *Cobertura de Gastos:* ${expenseCoveragePercent}%\n` +
      `⚖️ *Costo por Kg producido:* ${formatCurrency(costPerKgProduced)}/kg\n` +
      `--------------------------------\n` +
      `_Generado por Software Ganadero_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-20 animate-fade-in">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA & CONTROLES DE FILTRO TEMPORAL                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Contabilidad & Finanzas Ganaderas
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                  En Vivo
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control de costos fijos, insumos, utilidades netas y costo por kilo producido
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Directas & Filtros de Tiempo */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Selector de Período */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setTimeFilter('current_month')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'current_month' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Mes Actual
            </button>
            <button
              onClick={() => setTimeFilter('last_3_months')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'last_3_months' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3 Meses
            </button>
            <button
              onClick={() => setTimeFilter('current_year')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'current_year' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Año {currentYear}
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeFilter === 'all' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Botones de Acción */}
          <button
            onClick={onOpenAddExpense}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Registrar Gasto</span>
          </button>

          <button
            onClick={onOpenAddIncome}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Ingreso Extra</span>
          </button>

          {/* WhatsApp y Excel */}
          <button
            onClick={handleShareWhatsApp}
            title="Enviar Balance por WhatsApp"
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-pointer transition"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            title="Descargar Excel Contable"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
          >
            <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE INDICADORES PRINCIPALES (KPIS)                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Ingresos Totales */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Ingresos Disponibles
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalOperationalProfitGenerated)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Ganancia Ventas: <strong className="text-emerald-600">{formatCurrency(cattleSalesMetrics.grossProfit)}</strong></span>
            <span>Otros: <strong>{formatCurrency(additionalIncomesTotal)}</strong></span>
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            Bruto Total: {formatCurrency(totalGrossIncome)} (incluye capital recuperado)
          </div>
        </div>

        {/* Card 2: Gastos Totales de Finca */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Gastos Totales de Finca
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Fijos: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(fixedExpenses)}</strong></span>
            <span>Variables: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(variableExpenses)}</strong></span>
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            {periodExpenses.length} egresos registrados en {dateRange.label}
          </div>
        </div>

        {/* Card 3: Utilidad Neta Real Ganadera */}
        <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden ${
          realNetProfit >= 0 
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-800' 
            : 'bg-gradient-to-br from-rose-500/10 to-amber-500/5 dark:from-rose-950/40 dark:to-amber-950/20 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Utilidad Neta Real
            </span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${financialStatus.bg} ${financialStatus.color} ${financialStatus.border}`}>
              {realNetProfit >= 0 ? 'Ganancia Limpia' : 'Déficit'}
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black mt-2 ${realNetProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(realNetProfit)}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
            Ganancia real tras pagar capital de compra y todos los gastos de finca
          </div>
        </div>

        {/* Card 4: Cobertura de Gastos del Mes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Cobertura de Costos
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {expenseCoveragePercent}%
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {expenseCoveragePercent >= 100 ? 'Cubierto 100%' : 'En progreso'}
            </span>
          </div>
          {/* Barra de Progreso */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                expenseCoveragePercent >= 100 
                  ? 'bg-emerald-500' 
                  : expenseCoveragePercent >= 70 
                    ? 'bg-indigo-500' 
                    : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(expenseCoveragePercent, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            {expenseCoveragePercent >= 100 
              ? `🟢 Las ventas cubrieron los gastos y dejaron ${formatCurrency(realNetProfit)} libres.` 
              : `🟡 Faltan ${formatCurrency(Math.max(0, totalExpenses - totalOperationalProfitGenerated))} para cubrir costos.`}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. COSTOS UNITARIOS ZOOTÉCNICOS ($/KG, $/ANIMAL/DÍA, $/LITRO)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Costo por Kg de Carne Producido */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Costo Producir 1 Kg Carne
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {costPerKgProduced > 0 ? `${formatCurrency(costPerKgProduced)} / kg` : 'Sin datos de peso'}
            </div>
            <div className="text-[9px] text-slate-400">Total gastos ÷ Kilos ganados en hato</div>
          </div>
        </div>

        {/* Costo de Sostenimiento Diario por Cabeza */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Sostenimiento Diario / Cabeza
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {costPerAnimalDay > 0 ? `${formatCurrency(costPerAnimalDay)} / animal / día` : 'Sin datos de hato'}
            </div>
            <div className="text-[9px] text-slate-400">Costo de alimentar 1 animal 1 día</div>
          </div>
        </div>

        {/* Costo por Litro de Leche */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Milk className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Costo Producir 1 Litro Leche
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {costPerMilkLiter > 0 ? `${formatCurrency(costPerMilkLiter)} / litro` : 'No aplica / Sin ordeño'}
            </div>
            <div className="text-[9px] text-slate-400">Gastos de lechería ÷ Litros producidos</div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. SECCIÓN DE GRÁFICOS (RECHARTS)                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gráfico 1: Comparativa Mensual Ingresos vs Gastos vs Utilidad Neta (2 columnas) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Historial Mensual: Ingresos vs Gastos vs Utilidad Neta
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Evolución de la rentabilidad ganadera mes a mes (Últimos 6 meses)
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50 self-start sm:self-auto">
                👆 Clic en cualquier barra o mes para ver desglose
              </span>
            </div>

            <div className="h-60 sm:h-64 w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={monthlyComparisonData} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(state) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      setSelectedMonthForDetail(state.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, cursor: 'pointer' }}
                    onClick={(e) => {
                      if (e && e.value) {
                        const found = monthlyComparisonData.find(m => m.month === e.value);
                        if (found) setSelectedMonthForDetail(found);
                      }
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar 
                    dataKey="Ingresos" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    cursor="pointer"
                    onClick={(data) => data && setSelectedMonthForDetail(data)}
                  />
                  <Bar 
                    dataKey="Gastos" 
                    fill="#f43f5e" 
                    radius={[4, 4, 0, 0]} 
                    cursor="pointer"
                    onClick={(data) => data && setSelectedMonthForDetail(data)}
                  />
                  <Bar 
                    dataKey="UtilidadNeta" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                    cursor="pointer"
                    onClick={(data) => data && setSelectedMonthForDetail(data)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Botones directos de meses para máxima facilidad de acceso en móviles y pantallas táctiles */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ver mes detallado:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {monthlyComparisonData.map(m => (
                <button
                  key={m.monthPrefix}
                  onClick={() => setSelectedMonthForDetail(m)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer shadow-xs"
                  title={`Ver gastos, ingresos y ventas de ${m.fullLabel}`}
                >
                  {m.month}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico 2: Desglose de Gastos por Rubro (PieChart) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-rose-500" />
              Distribución de Gastos por Rubro
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ¿En qué se está invirtiendo el dinero en {dateRange.label}?
            </p>
          </div>

          {categoryPieData.length > 0 ? (
            <>
              <div className="h-44 sm:h-48 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [formatCurrency(val), 'Gasto']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lista de Categorías */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {categoryPieData.map(item => {
                  const pct = totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-bold">{item.icon} {item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-black">
                        <span className="text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No hay gastos registrados en este período.
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. SUB-PESTAÑAS DE TABLAS DETALLADAS (LIBRO DE GASTOS / INGRESOS)         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Cabecera de Pestañas */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 pt-3 flex items-center justify-between flex-wrap gap-2 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 px-3 text-xs font-black border-b-2 transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              📄 Estado de Resultados
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>📤 Libro de Gastos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                {periodExpenses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('incomes')}
              className={`pb-3 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'incomes'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>📥 Libro de Ingresos & Ventas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                {periodSoldCattle.length + periodIncomes.length}
              </span>
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: ESTADO DE RESULTADOS & DIAGNÓSTICO */}
        {activeTab === 'summary' && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Diagnóstico Ejecutivo */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${financialStatus.bg} ${financialStatus.border}`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
                  {realNetProfit >= 0 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Diagnóstico Financiero: {financialStatus.label}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {realNetProfit >= 0 ? (
                      <>
                        En <strong>{dateRange.label}</strong>, tu ganadería generó <strong>{formatCurrency(totalOperationalProfitGenerated)}</strong> de utilidad operativa, cubriendo el <strong>{expenseCoveragePercent}%</strong> de los costos de la finca ({formatCurrency(totalExpenses)}) y dejando una <strong>ganancia líquida libre de {formatCurrency(realNetProfit)}</strong>.
                      </>
                    ) : (
                      <>
                        En <strong>{dateRange.label}</strong>, los gastos operativos de la finca (<strong>{formatCurrency(totalExpenses)}</strong>) superaron las ganancias generadas (<strong>{formatCurrency(totalOperationalProfitGenerated)}</strong>), resultando en un déficit temporal de <strong>{formatCurrency(Math.abs(realNetProfit))}</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla Estructurada de Pérdidas y Ganancias */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Estado de Resultados Ganadero (P&L) • {dateRange.label}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                
                {/* 1. Ingresos Brutos */}
                <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between font-black text-emerald-900 dark:text-emerald-300">
                  <span>1. TOTAL INGRESOS BRUTOS DE LA FINCA</span>
                  <span>{formatCurrency(totalGrossIncome)}</span>
                </div>
                <div className="p-3 pl-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>• Ventas de Ganado ({cattleSalesMetrics.count} animales liquidados)</span>
                  <span>{formatCurrency(cattleSalesMetrics.grossRevenue)}</span>
                </div>
                <div className="p-3 pl-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>• Otros Ingresos (Leche, Arriendos, Abonos)</span>
                  <span>{formatCurrency(additionalIncomesTotal)}</span>
                </div>

                {/* 2. Capital Recuperado */}
                <div className="p-3 pl-6 flex items-center justify-between text-slate-500 italic">
                  <span>(-) Capital Inicial de Compra de Ganado Recuperado</span>
                  <span>- {formatCurrency(cattleSalesMetrics.purchaseCapitalRecovered)}</span>
                </div>

                {/* 3. Utilidad Operativa Disponible */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>(=) GANANCIA BRUTA GENERADA POR PRODUCCIÓN</span>
                  <span className="text-emerald-600 font-black">{formatCurrency(totalOperationalProfitGenerated)}</span>
                </div>

                {/* 4. Gastos de la Finca */}
                <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between font-black text-rose-900 dark:text-rose-300">
                  <span>2. TOTAL GASTOS OPERATIVOS DE LA FINCA</span>
                  <span>- {formatCurrency(totalExpenses)}</span>
                </div>
                <div className="p-3 pl-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>• Gastos Fijos (Nómina, Mano de Obra, Servicios, Arriendos)</span>
                  <span>- {formatCurrency(fixedExpenses)}</span>
                </div>
                <div className="p-3 pl-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>• Gastos Variables (Sal Mineralizada, Nutrición, Sanidad, Fletes)</span>
                  <span>- {formatCurrency(variableExpenses)}</span>
                </div>
                {investmentExpenses > 0 && (
                  <div className="p-3 pl-6 flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>• Inversiones en Maquinaria & Equipos</span>
                    <span>- {formatCurrency(investmentExpenses)}</span>
                  </div>
                )}

                {/* 5. Utilidad Neta Final */}
                <div className={`p-4 flex items-center justify-between font-black text-sm ${
                  realNetProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                }`}>
                  <span>(=) UTILIDAD NETA REAL DE LA GANADERÍA</span>
                  <span className="text-base">{formatCurrency(realNetProfit)}</span>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* PESTAÑA 2: LIBRO DE GASTOS */}
        {activeTab === 'expenses' && (
          <div className="p-4 space-y-4">
            
            {/* Barra de Filtros de Gastos */}
            <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en concepto, notas o pago..."
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={expenseCategoryFilter}
                  onChange={e => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">Todas las Categorías</option>
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>

                <select
                  value={expenseTypeFilter}
                  onChange={e => setExpenseTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">Todos los Tipos</option>
                  <option value="Fijo">Fijo</option>
                  <option value="Variable">Variable</option>
                  <option value="Inversión">Inversión</option>
                </select>
              </div>
            </div>

            {/* Tabla de Gastos */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Concepto / Detalle</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Pago</th>
                    <th className="p-3 text-right">Monto ($ COP)</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpensesList.length > 0 ? (
                    filteredExpensesList.map(exp => {
                      const catObj = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                            {formatDate(exp.date)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <span>{catObj ? catObj.icon : '📦'}</span>
                              <span>{catObj ? catObj.label : (exp.category || 'Otros')}</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{exp.concept}</div>
                            {exp.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{exp.notes}</div>}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              exp.type === 'Fijo' 
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {exp.isRecurring && <Repeat className="w-2.5 h-2.5 text-indigo-500" />}
                              <span>{exp.type || 'Variable'}</span>
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-500 text-[11px]">
                            {exp.paymentMethod || 'Efectivo'}
                          </td>
                          <td className="p-3 whitespace-nowrap text-right font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onOpenEditExpense(exp)}
                                title="Editar Gasto"
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No se encontraron gastos en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* PESTAÑA 3: LIBRO DE INGRESOS & VENTAS */}
        {activeTab === 'incomes' && (
          <div className="p-4 space-y-4">
            
            {/* Resumen de Fuentes de Ingreso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-900 dark:text-emerald-300">Ventas de Ganado Liquidadas</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {cattleSalesMetrics.count} animales • Bruto: {formatCurrency(cattleSalesMetrics.grossRevenue)}
                  </div>
                </div>
                <div className="text-right font-black text-emerald-800 dark:text-emerald-200 text-sm">
                  + {formatCurrency(cattleSalesMetrics.grossProfit)}
                  <div className="text-[9px] font-normal text-emerald-600">Ganancia Limpia</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-teal-900 dark:text-teal-300">Otros Ingresos Registrados</div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400">
                    {periodIncomes.length} registros (Leche, arriendos, abonos)
                  </div>
                </div>
                <div className="text-right font-black text-teal-800 dark:text-teal-200 text-sm">
                  + {formatCurrency(additionalIncomesTotal)}
                </div>
              </div>
            </div>

            {/* Tabla de Ingresos Adicionales */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Concepto / Detalle</th>
                    <th className="p-3">Cobro</th>
                    <th className="p-3 text-right">Monto ($ COP)</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredIncomesList.length > 0 ? (
                    filteredIncomesList.map(inc => {
                      const catObj = INCOME_CATEGORIES.find(c => c.id === inc.category);
                      return (
                        <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                            {formatDate(inc.date)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                          <td className="p-3 whitespace-nowrap text-right font-black text-emerald-600 dark:text-emerald-400">
                            + {formatCurrency(inc.amount)}
                          </td>
                          <td className="p-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onOpenEditIncome(inc)}
                                title="Editar Ingreso"
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        No hay ingresos adicionales registrados en este período. (Las ventas de ganado se sincronizan automáticamente).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* Modal de Detalle Contable & Financiero Mensual */}
      <MonthAccountingDetailModal
        isOpen={!!selectedMonthForDetail}
        onClose={() => setSelectedMonthForDetail(null)}
        monthData={selectedMonthForDetail}
        farmExpenses={farmExpenses}
        farmIncomes={farmIncomes}
        cattle={cattle}
        onOpenAddExpense={onOpenAddExpense}
        onOpenEditExpense={onOpenEditExpense}
        onDeleteExpense={onDeleteExpense}
        onOpenAddIncome={onOpenAddIncome}
        onOpenEditIncome={onOpenEditIncome}
        onDeleteIncome={onDeleteIncome}
        onSelectAnimal={onSelectAnimal}
      />

    </div>
  );
}
