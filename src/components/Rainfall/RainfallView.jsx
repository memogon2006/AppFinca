import React, { useState, useMemo } from 'react';
import { 
  CloudRain, 
  PlusCircle, 
  Calendar, 
  Droplets, 
  TrendingUp, 
  TrendingDown, 
  Sun, 
  Download, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  FileSpreadsheet, 
  ArrowLeft,
  Info,
  Zap,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import * as XLSX from 'xlsx-js-style';
import { formatDate, getLocalDateString } from '../../services/calculations';
import { useTheme } from '../../context/ThemeContext';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function RainfallView({
  rainfall = [],
  onOpenNewRain,
  onEditRain,
  onDeleteRain,
  onNavigate,
  showToast,
  currentUser
}) {
  const { isDark } = useTheme();
  const currentYearNum = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth(); // 0-11
  
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [tableMonthFilter, setTableMonthFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'calendar' | 'history'

  // Años disponibles según los registros
  const availableYears = useMemo(() => {
    const years = new Set([currentYearNum]);
    rainfall.forEach(r => {
      if (r.date) {
        const y = parseInt(r.date.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [rainfall, currentYearNum]);

  // Registros del año seleccionado
  const yearRecords = useMemo(() => {
    return rainfall.filter(r => {
      if (!r.date) return false;
      const y = parseInt(r.date.split('-')[0], 10);
      return y === selectedYear;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [rainfall, selectedYear]);

  // Métricas Principales (KPIs)
  const metrics = useMemo(() => {
    // 1. Acumulado Anual
    const totalYearMm = yearRecords.reduce((acc, r) => acc + (parseFloat(r.amountMm) || 0), 0);
    const rainyDaysYear = yearRecords.filter(r => (parseFloat(r.amountMm) || 0) > 0).length;

    // 2. Mes Actual / Seleccionado
    const targetMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const monthRecords = yearRecords.filter(r => r.date && r.date.startsWith(targetMonthPrefix));
    const totalMonthMm = monthRecords.reduce((acc, r) => acc + (parseFloat(r.amountMm) || 0), 0);
    const rainyDaysMonth = monthRecords.filter(r => (parseFloat(r.amountMm) || 0) > 0).length;

    // 3. Mes Anterior para comparativa
    const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const prevMonthPrefix = `${prevMonthYear}-${String(prevMonthIdx + 1).padStart(2, '0')}`;
    const prevMonthRecords = rainfall.filter(r => r.date && r.date.startsWith(prevMonthPrefix));
    const prevMonthTotalMm = prevMonthRecords.reduce((acc, r) => acc + (parseFloat(r.amountMm) || 0), 0);

    // 4. Días Sin Lluvia (Racha Seca desde el último registro de lluvia)
    let daysWithoutRain = 0;
    const allSortedRain = [...rainfall]
      .filter(r => (parseFloat(r.amountMm) || 0) > 0 && r.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allSortedRain.length > 0) {
      const lastRainDate = new Date(allSortedRain[0].date);
      const today = new Date(getLocalDateString());
      const diffMs = today.getTime() - lastRainDate.getTime();
      daysWithoutRain = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      daysWithoutRain = -1; // Sin registros
    }

    // 5. Día Récord de Precipitación
    let maxRainRecord = null;
    yearRecords.forEach(r => {
      const mm = parseFloat(r.amountMm) || 0;
      if (!maxRainRecord || mm > maxRainRecord.amountMm) {
        maxRainRecord = { ...r, amountMm: mm };
      }
    });

    return {
      totalYearMm: Math.round(totalYearMm * 10) / 10,
      rainyDaysYear,
      totalMonthMm: Math.round(totalMonthMm * 10) / 10,
      rainyDaysMonth,
      prevMonthTotalMm: Math.round(prevMonthTotalMm * 10) / 10,
      daysWithoutRain,
      maxRainRecord,
      lastRainDate: allSortedRain.length > 0 ? allSortedRain[0].date : null
    };
  }, [yearRecords, selectedYear, selectedMonth, rainfall]);

  // Datos para la Gráfica de Barras Mensual (Recharts)
  const chartData = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => {
      const monthPrefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const recs = yearRecords.filter(r => r.date && r.date.startsWith(monthPrefix));
      const mm = recs.reduce((acc, r) => acc + (parseFloat(r.amountMm) || 0), 0);
      const days = recs.filter(r => (parseFloat(r.amountMm) || 0) > 0).length;
      return {
        month: MONTH_SHORT[idx],
        fullName: name,
        mm: Math.round(mm * 10) / 10,
        days,
        isCurrent: selectedYear === currentYearNum && idx === currentMonthNum
      };
    });
  }, [yearRecords, selectedYear, currentYearNum, currentMonthNum]);

  // Generador de Días para el Calendario Mensual
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0=Dom, 1=Lun
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    // Ajustar para que Lunes sea día 0
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    // Espacios vacíos previos
    for (let i = 0; i < startOffset; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecs = yearRecords.filter(r => r.date === dateStr);
      const totalMm = dayRecs.reduce((acc, r) => acc + (parseFloat(r.amountMm) || 0), 0);
      days.push({
        day,
        date: dateStr,
        totalMm: Math.round(totalMm * 10) / 10,
        records: dayRecs,
        isToday: dateStr === getLocalDateString(),
        key: dateStr
      });
    }

    return days;
  }, [selectedYear, selectedMonth, yearRecords]);

  // Registros filtrados para la tabla histórica
  const filteredTableRecords = useMemo(() => {
    return yearRecords.filter(r => {
      if (tableMonthFilter === 'ALL') return true;
      const mIdx = parseInt(r.date.split('-')[1], 10) - 1;
      return mIdx === parseInt(tableMonthFilter, 10);
    });
  }, [yearRecords, tableMonthFilter]);

  // Exportar histórico a Excel
  const handleExportExcel = () => {
    if (yearRecords.length === 0) {
      if (showToast) showToast('No hay registros de lluvia para exportar en este año', 'error');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen Mensual
      const summaryRows = [
        ['REPORTE PLUVIOMÉTRICO ANUAL', currentUser?.farmName || 'FINCA GANADERA'],
        ['AÑO', selectedYear],
        ['TOTAL ANUAL (mm)', metrics.totalYearMm],
        ['DÍAS CON LLUVIA', metrics.rainyDaysYear],
        [],
        ['MES', 'PRECIPITACIÓN (mm)', 'DÍAS CON LLUVIA', '% DEL TOTAL ANUAL']
      ];

      chartData.forEach(m => {
        const pct = metrics.totalYearMm > 0 ? ((m.mm / metrics.totalYearMm) * 100).toFixed(1) + '%' : '0%';
        summaryRows.push([m.fullName, m.mm, m.days, pct]);
      });

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Mensual');

      // Hoja 2: Detalle Diario
      const detailRows = [
        ['FECHA', 'PRECIPITACIÓN (mm)', 'TIPO / INTENSIDAD', 'OBSERVACIONES']
      ];

      [...yearRecords].reverse().forEach(r => {
        detailRows.push([
          r.date,
          r.amountMm,
          r.intensity || 'Normal',
          r.notes || ''
        ]);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Lecturas Diarias');

      const safeFarm = (currentUser?.farmName || 'Finca').replace(/[^a-zA-Z0-9_-]/g, '_');
      XLSX.writeFile(wb, `Pluviometro_${safeFarm}_${selectedYear}.xlsx`);

      if (showToast) showToast(`Archivo Excel descargado exitosamente (${selectedYear})`, 'success');
    } catch (err) {
      console.error('Error exportando lluvias:', err);
      if (showToast) showToast('Error al exportar a Excel', 'error');
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. CABECERA PRINCIPAL */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-blue-950 to-indigo-950 text-white border-2 border-sky-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition cursor-pointer border border-white/20 shrink-0"
              title="Volver al Tablero Principal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-sky-400 text-slate-950 shadow-md">
                  <Droplets className="w-3.5 h-3.5 text-sky-950" />
                  PLUVIÓMETRO DIGITAL
                </span>
                <span className="text-xs text-sky-200 font-bold hidden sm:inline">
                  Clima & Balance Hídrico
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight">
                Control de Precipitaciones & Lluvias
              </h1>
              <p className="text-xs sm:text-sm text-sky-100/90 mt-0.5">
                Seguimiento milimétrico de aguas caídas, recarga de pasturas y alertas preventivas de sequía.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {/* Selector de Año */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 focus:outline-none cursor-pointer backdrop-blur-sm"
            >
              {availableYears.map(y => (
                <option key={y} value={y} className="text-slate-900 font-bold bg-white">
                  Año {y}
                </option>
              ))}
            </select>

            {/* Botón Exportar */}
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 border border-white/20 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Descargar libro de lluvias en Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Botón Principal: + Registrar Lluvia */}
            <button
              onClick={onOpenNewRain}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-sky-950/40 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Registrar Lluvia</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS GLOBALES (KPIS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Acumulado del Mes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {metrics.totalMonthMm}
              </h3>
              <span className="text-xs font-bold text-slate-400">mm</span>
            </div>
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
              {metrics.rainyDaysMonth} {metrics.rainyDaysMonth === 1 ? 'día con lluvia' : 'días con lluvia'}
            </span>
          </div>
        </div>

        {/* Acumulado Total Anual */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CloudRain className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Acumulado {selectedYear}
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {metrics.totalYearMm}
              </h3>
              <span className="text-xs font-bold text-slate-400">mm</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {metrics.rainyDaysYear} días de precipitación
            </span>
          </div>
        </div>

        {/* Días Sin Lluvia (Racha Seca) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            metrics.daysWithoutRain >= 15 
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          }`}>
            {metrics.daysWithoutRain >= 15 ? <Sun className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Racha Seca Actual
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {metrics.daysWithoutRain < 0 ? '0' : metrics.daysWithoutRain}
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {metrics.daysWithoutRain === 1 ? 'día' : 'días'}
              </span>
            </div>
            <span className={`text-[11px] font-semibold ${
              metrics.daysWithoutRain >= 15 
                ? 'text-amber-600 dark:text-amber-400 font-bold' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {metrics.daysWithoutRain === 0 
                ? '¡Llovió hoy!' 
                : metrics.daysWithoutRain < 0 
                ? 'Sin registros' 
                : `Última: ${formatDate(metrics.lastRainDate)}`}
            </span>
          </div>
        </div>

        {/* Mayor Lluvia del Año (Récord) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pico Máximo en 24h
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {metrics.maxRainRecord ? metrics.maxRainRecord.amountMm : 0}
              </h3>
              <span className="text-xs font-bold text-slate-400">mm</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate block">
              {metrics.maxRainRecord ? formatDate(metrics.maxRainRecord.date) : 'Sin registros'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. SEMÁFORO DE HUMEDAD & ALERTA DE SEQUÍA */}
      {metrics.daysWithoutRain >= 15 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/40 text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 text-xs">
            <h4 className="font-black text-sm text-amber-900 dark:text-amber-100">
              Alerta de Sequía Prolongada ({metrics.daysWithoutRain} días continuos sin lluvia)
            </h4>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              El suelo está perdiendo humedad rápidamente. Recomendación técnica: monitorear la altura del pasto en los potreros, evitar el sobrepastoreo a ras y preparar suplementación estratégica (ensilaje, heno o sal proteica) si el ganado muestra baja de condición corporal.
            </p>
          </div>
        </div>
      )}

      {/* 4. TABS DE NAVEGACIÓN: TABLERO / CALENDARIO / HISTORIAL */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-md">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Curva Anual</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendario</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Historial ({yearRecords.length})</span>
        </button>
      </div>

      {/* 5. VISTA A: CURVA ANUAL (RECHARTS) */}
      {activeTab === 'dashboard' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Distribución Mensual de Precipitaciones ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Milímetros totales registrados por mes en el pluviómetro
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-sky-500 inline-block"></span>
              <span>Lluvia del mes (mm)</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="month" 
                  stroke={isDark ? '#94a3b8' : '#64748b'} 
                  fontSize={11} 
                  fontWeight="bold"
                />
                <YAxis 
                  stroke={isDark ? '#94a3b8' : '#64748b'} 
                  fontSize={11} 
                  fontWeight="bold"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs space-y-1">
                          <p className="font-black text-sky-400 text-sm">{data.fullName} {selectedYear}</p>
                          <p className="font-bold">💧 Precipitación: <span className="text-white font-black">{data.mm} mm</span></p>
                          <p className="text-slate-300">📅 Días con lluvia: {data.days} días</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mm" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.mm > 0 ? (entry.isCurrent ? '#0284c7' : '#38bdf8') : (isDark ? '#1e293b' : '#cbd5e1')} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6. VISTA B: CALENDARIO PLUVIOMÉTRICO MENSUAL */}
      {activeTab === 'calendar' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          {/* Navegador de Mes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-black text-slate-900 dark:text-white min-w-[140px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h3>
              <button
                onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/40">
              💧 Total del mes: {metrics.totalMonthMm} mm
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 pb-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((d) => {
              if (d.empty) {
                return (
                  <div key={d.key} className="h-16 sm:h-20 rounded-xl bg-slate-50/40 dark:bg-slate-850/20 border border-transparent"></div>
                );
              }

              const hasRain = d.totalMm > 0;
              return (
                <div
                  key={d.key}
                  onClick={() => {
                    if (d.records && d.records.length > 0) {
                      onEditRain(d.records[0]);
                    }
                  }}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition flex flex-col justify-between ${
                    hasRain
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700/80 shadow-xs cursor-pointer hover:scale-[1.02]'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400'
                  } ${d.isToday ? 'ring-2 ring-sky-500 dark:ring-sky-400' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${hasRain ? 'text-sky-950 dark:text-sky-200 font-black' : 'text-slate-500 dark:text-slate-400'}`}>
                      {d.day}
                    </span>
                    {d.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    )}
                  </div>

                  {hasRain ? (
                    <div className="bg-sky-500 text-white rounded-lg py-0.5 px-1 text-center font-black text-[10px] sm:text-xs shadow-xs truncate">
                      💧 {d.totalMm} mm
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 text-center select-none">
                      -
                    </span>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 7. VISTA C: TABLA HISTÓRICA DE REGISTROS */}
      {activeTab === 'history' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Historial de Lecturas Pluviométricas ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredTableRecords.length} lecturas registradas
              </p>
            </div>

            {/* Filtro por Mes */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Mes:
              </span>
              <select
                value={tableMonthFilter}
                onChange={(e) => setTableMonthFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <option value="ALL">Todo el Año</option>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={String(idx)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredTableRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CloudRain className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <span>No hay registros de lluvia para el filtro seleccionado.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Precipitación</th>
                    <th className="py-2.5 px-3">Intensidad</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTableRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300/40">
                          💧 {record.amountMm} mm
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                        {record.intensity || 'Normal'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditRain(record)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            title="Editar lectura"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar la lectura de ${record.amountMm} mm del ${formatDate(record.date)}?`)) {
                                onDeleteRain(record.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 transition cursor-pointer"
                            title="Eliminar lectura"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
