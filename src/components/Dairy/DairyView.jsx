import React, { useState } from 'react';
import { 
  Milk, 
  Sparkles, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  FileSpreadsheet, 
  Share2, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  DollarSign, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Clock, 
  Baby, 
  Award,
  Zap,
  Store,
  Receipt,
  FileText,
  Save,
  Check
} from 'lucide-react';
import { QuickMilkingModal } from './QuickMilkingModal';
import { TankDeliveryModal } from './TankDeliveryModal';
import { DailyMilkLogModal } from './DailyMilkLogModal';
import { MilkSettlementModal } from './MilkSettlementModal';
import { MilkSettlementReceiptModal } from './MilkSettlementReceiptModal';
import { DairyLactationChart } from './DairyLactationChart';
import { exportDairyReportToExcel } from '../../services/dairyExcelService';
import { 
  calculateHerdMilkMetrics, 
  calculateDaysInMilk, 
  calculateLactationCurve, 
  getMilkPeriodRange,
  calculatePeriodMilkSummary,
  formatNumber, 
  formatCurrency, 
  formatDate,
  getLocalDateString,
  parseDateOnly
} from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

export function DairyView({
  cattle = [],
  milkRecords = [],
  milkDeliveries = [],
  dailyMilkLogs = [],
  milkSettlements = [],
  onSaveMilkRecord,
  onSaveBatchMilkRecords,
  onDeleteMilkRecord,
  onSaveMilkDelivery,
  onDeleteMilkDelivery,
  onSaveDailyMilkLog,
  onDeleteDailyMilkLog,
  onSaveMilkSettlement,
  onDeleteMilkSettlement,
  onSelectAnimal,
  onOpenNewAnimal,
  farmName = 'Mi Finca Ganadera',
  currentUser = null
}) {
  // Pestaña activa principal
  const [activeTab, setActiveTab] = useState('periods'); // 'periods', 'settlements', 'sheet', 'curves', 'tank', 'secado'
  
  // Períodos de lechería: dinámico según el día actual (1-15: 1ª Quincena, 16+: 2ª Quincena)
  const [periodType, setPeriodType] = useState(() => {
    return new Date().getDate() <= 15 ? 'first_fortnight' : 'second_fortnight';
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()); // 0-11
  const [customStart, setCustomStart] = useState(() => getLocalDateString());
  const [customEnd, setCustomEnd] = useState(() => getLocalDateString());

  // Registrador Rápido de Día Integrado (con auto-carga según fecha)
  const [quickDate, setQuickDate] = useState(() => getLocalDateString());
  const [quickAm, setQuickAm] = useState('');
  const [quickPm, setQuickPm] = useState('');
  const [quickTotal, setQuickTotal] = useState('');
  const [quickCows, setQuickCows] = useState('');

  // Planilla individual
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');

  // Modales
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [editingDailyLog, setEditingDailyLog] = useState(null);

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [viewingSettlementReceipt, setViewingSettlementReceipt] = useState(null);

  const [isQuickMilkingOpen, setIsQuickMilkingOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [selectedCowForCurve, setSelectedCowForCurve] = useState(null);

  // Hembras adultas o en ordeño
  const females = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  const batches = Array.from(new Set(females.map(c => c.entryBatch || c.paddock || 'Sin Lote'))).filter(Boolean);

  // Métricas del hato
  const metrics = calculateHerdMilkMetrics(cattle, milkRecords, milkDeliveries, selectedDate);

  // Rango de fechas del período actual
  const periodRange = periodType === 'custom' 
    ? {
        periodType: 'custom',
        label: `Rango Personalizado (${formatDate(customStart)} al ${formatDate(customEnd)})`,
        shortLabel: 'Personalizado',
        startDate: customStart,
        endDate: customEnd,
      }
    : getMilkPeriodRange(periodType, selectedYear, selectedMonth);

  // Precio de venta por litro personalizado por finca (con persistencia en localStorage)
  const [milkPricePerLiter, setMilkPricePerLiter] = useState(() => {
    try {
      const saved = localStorage.getItem(`finca_milk_price_${farmName.replace(/\s+/g, '_').toLowerCase()}`) 
        || localStorage.getItem('finca_milk_price_per_liter');
      return saved !== null && saved !== '' ? Number(saved) : 2100;
    } catch (e) {
      return 2100;
    }
  });

  const handleMilkPriceChange = (val) => {
    const num = val === '' ? '' : Number(val);
    setMilkPricePerLiter(num);
    if (num !== '' && !isNaN(num)) {
      try {
        localStorage.setItem(`finca_milk_price_${farmName.replace(/\s+/g, '_').toLowerCase()}`, String(num));
        localStorage.setItem('finca_milk_price_per_liter', String(num));
      } catch (e) {}
    }
  };

  // Resumen del período calculado con el precio de leche ingresado
  const periodSummary = calculatePeriodMilkSummary(
    dailyMilkLogs,
    milkRecords,
    periodRange.startDate,
    periodRange.endDate,
    typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100
  );

  // Sincronizar auto-carga del Registrador Rápido de Día
  const syncQuickDayForm = (targetDate) => {
    setQuickDate(targetDate);
    const existing = dailyMilkLogs.find(l => l.date === targetDate);
    if (existing) {
      setQuickAm(existing.amLiters ? String(existing.amLiters) : '');
      setQuickPm(existing.pmLiters ? String(existing.pmLiters) : '');
      setQuickTotal(existing.totalLiters ? String(existing.totalLiters) : '');
      setQuickCows(existing.cowsMilked ? String(existing.cowsMilked) : '');
    } else {
      setQuickAm('');
      setQuickPm('');
      setQuickTotal('');
      setQuickCows(metrics.milkingCowsCount > 0 ? String(metrics.milkingCowsCount) : '');
    }
  };

  // Abrir modal de producción diaria para una fecha específica
  const handleOpenDayLog = (targetDate, existingLog = null) => {
    syncQuickDayForm(targetDate);
    const existing = existingLog || dailyMilkLogs.find(l => l.date === targetDate);
    const logData = existing ? { ...existing } : {
      date: targetDate,
      cowsMilked: metrics.milkingCowsCount > 0 ? metrics.milkingCowsCount : '',
      pricePerLiter: typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100
    };
    setEditingDailyLog(logData);
    setIsDailyLogModalOpen(true);
  };

  // Guardar desde el Registrador Rápido Integrado
  const handleQuickDaySave = (e) => {
    e.preventDefault();
    const am = parseFloat(quickAm) || 0;
    const pm = parseFloat(quickPm) || 0;
    let tot = parseFloat(quickTotal) || 0;
    if (tot === 0 && (am > 0 || pm > 0)) {
      tot = am + pm;
    }

    if (tot <= 0) {
      alert('Por favor ingresa los litros de la mañana (AM), tarde (PM) o el total del día.');
      return;
    }

    const cows = parseInt(quickCows, 10) || 0;
    const existing = dailyMilkLogs.find(l => l.date === quickDate);

    const record = {
      ...(existing || {}),
      date: quickDate,
      amLiters: am,
      pmLiters: pm,
      totalLiters: tot,
      cowsMilked: cows,
      salesLiters: existing?.salesLiters !== undefined ? existing.salesLiters : tot,
      calvesLiters: existing?.calvesLiters || 0,
      farmLiters: existing?.farmLiters || 0,
      rejectedLiters: existing?.rejectedLiters || 0,
      pricePerLiter: existing?.pricePerLiter || (typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100),
      notes: existing?.notes || '',
    };

    onSaveDailyMilkLog(record);
  };

  // Generación de lista completa de días en el rango del período seleccionado
  const generatePeriodDaysList = () => {
    const days = [];
    if (!periodRange.startDate || !periodRange.endDate) return days;

    const start = parseDateOnly(periodRange.startDate);
    const end = parseDateOnly(periodRange.endDate);
    if (!start || !end) return days;

    const logsMap = new Map(dailyMilkLogs.map(l => [l.date, l]));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = getLocalDateString(d);
      const log = logsMap.get(dateStr);
      
      const indRecords = milkRecords.filter(r => r.date === dateStr);
      let indAm = 0, indPm = 0, indTot = 0;
      indRecords.forEach(r => {
        const am = parseFloat(r.amLiters) || 0;
        const pm = parseFloat(r.pmLiters) || 0;
        indAm += am;
        indPm += pm;
        indTot += (parseFloat(r.totalLiters) || (am + pm));
      });

      days.push({
        date: dateStr,
        dayOfWeek: d.toLocaleDateString('es-CO', { weekday: 'short' }),
        dayNumber: d.getDate(),
        log: log || null,
        hasLog: !!log,
        amLiters: log ? log.amLiters : indAm,
        pmLiters: log ? log.pmLiters : indPm,
        totalLiters: log ? log.totalLiters : indTot,
        cowsMilked: log ? log.cowsMilked : indRecords.length,
        salesLiters: log ? (log.salesLiters !== undefined ? log.salesLiters : log.totalLiters) : indTot,
        calvesLiters: log ? log.calvesLiters : 0,
        farmLiters: log ? log.farmLiters : 0,
        rejectedLiters: log ? log.rejectedLiters : 0,
        isSettled: log ? log.isSettled : false,
      });
    }

    return days;
  };

  const periodDays = generatePeriodDaysList();

  // Filtrado de vacas para la planilla individual
  const dateRecords = milkRecords.filter(r => r.date === selectedDate);
  const dateRecordMap = new Map(dateRecords.map(r => [String(r.cattleId), r]));

  const filteredFemales = females.filter(cow => {
    const matchesSearch = 
      (cow.tagNumber && cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cow.name && cow.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBatch = selectedBatchFilter === 'all' || (cow.entryBatch || cow.paddock || 'Sin Lote') === selectedBatchFilter;
    return matchesSearch && matchesBatch;
  });

  const handleExportExcel = () => {
    exportDairyReportToExcel({
      cattle,
      milkRecords,
      milkDeliveries,
      dailyMilkLogs,
      milkSettlements,
      periodSummary,
      periodRange,
      farmName,
      selectedDate
    });
    triggerFeedback('single');
  };

  const handleSharePeriodWhatsApp = () => {
    const lines = [
      `🥛 *REPORTE DE CONTROL LECHERO*`,
      `🏡 *Finca:* ${farmName}`,
      `📅 *Período:* ${periodRange.label}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🥛 *Producción Total:* ${formatNumber(periodSummary.totalLiters, 1)} Litros`,
      `🌅 *Mañana (AM):* ${formatNumber(periodSummary.totalAmLiters, 1)} L | 🌇 *Tarde (PM):* ${formatNumber(periodSummary.totalPmLiters, 1)} L`,
      `📊 *Promedio Diario:* ${formatNumber(periodSummary.avgDailyLiters, 1)} L/día (${periodSummary.daysLogged} días)`,
      `🐄 *Promedio Vacas:* ${formatNumber(periodSummary.avgCowsMilked, 1)} vacas (${formatNumber(periodSummary.avgLitersPerCow, 1)} L/vaca)`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🧊 *A Venta:* ${formatNumber(periodSummary.totalSalesLiters, 1)} L | 💰 *Valor Est:* ${formatCurrency(periodSummary.estimatedRevenue)}`,
      `🍼 *Terneros:* ${formatNumber(periodSummary.totalCalvesLiters, 1)} L | 🧀 *Queso/Finca:* ${formatNumber(periodSummary.totalFarmLiters, 1)} L`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_Generado por GanadoPro App_ 📱`,
    ];

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    triggerFeedback('single');
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const quickLogExists = dailyMilkLogs.some(l => l.date === quickDate);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Cabecera Principal con los 3 Botones de Acción Arriba */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Milk className="w-6 h-6" />
            </span>
            <span>Módulo de Lechería & Control de Ordeño</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Registro diario simple, control quincenal/mensual, liquidaciones y tanque frío.
          </p>
        </div>

        {/* Barra Superior con los Botones de Acción */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Botón 1: + Producción Diaria General */}
          <button
            onClick={() => {
              setEditingDailyLog(null);
              setIsDailyLogModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer min-h-[44px]"
            title="Registrar litros generales del día"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Producción Diaria</span>
          </button>

          {/* Botón 2: Planilla Individual por Vaca */}
          <button
            onClick={() => setIsQuickMilkingOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 transition cursor-pointer min-h-[44px]"
            title="Planilla de pesaje individual vaca por vaca"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Vaca a Vaca</span>
          </button>

          {/* Excel & WhatsApp */}
          <button
            onClick={handleExportExcel}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Descargar Libro Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={handleSharePeriodWhatsApp}
            className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
            title="Compartir por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Tarjetas Resumen Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Litros del Período */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-emerald-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
              Litros Período
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs">🥛</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatNumber(periodSummary.totalLiters, 1)}
            </span>
            <span className="text-xs font-black text-slate-400">L</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Prom: <strong className="text-emerald-300">{periodSummary.avgDailyLiters} L/d</strong></span>
            <span>Días: <strong className="text-white">{periodSummary.daysLogged}</strong></span>
          </div>
        </div>

        {/* KPI 2: Valor Estimado */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-amber-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
              Venta Estimada
            </span>
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-xs">💰</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono truncate">
              {formatCurrency(periodSummary.estimatedRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>A Venta: <strong className="text-amber-300">{formatNumber(periodSummary.totalSalesLiters, 1)} L</strong></span>
            <span className="text-[10px] text-slate-400 font-mono">
              @ <strong className="text-amber-300">${(typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100).toLocaleString('es-CO')}</strong>/L
            </span>
          </div>
        </div>

        {/* KPI 3: Promedio Vacas */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-purple-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-400 uppercase tracking-wider">
              Vacas & Promedio
            </span>
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 text-xs">🐄</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatNumber(periodSummary.avgLitersPerCow, 1)}
            </span>
            <span className="text-xs font-black text-slate-400">L / vaca</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Ordeñadas: <strong className="text-purple-300">{formatNumber(periodSummary.avgCowsMilked, 0)} vacas</strong></span>
          </div>
        </div>

        {/* KPI 4: Liquidaciones */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-cyan-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
              Liquidado
            </span>
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs">📦</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatNumber(periodSummary.settledLiters, 1)} L
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Pendientes: <strong className="text-amber-400">{formatNumber(periodSummary.unsettledLiters, 1)} L</strong></span>
          </div>
        </div>

      </div>

      {/* 3. Pestañas de Navegación del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('periods')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'periods'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📅 1. Control Diario & Quincenas</span>
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'settlements'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>💰 2. Liquidaciones & Ventas ({milkSettlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sheet')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'sheet'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🐄 3. Pesaje por Vaca (Individual)</span>
        </button>

        <button
          onClick={() => setActiveTab('tank')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'tank'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🧊 4. Tanque Frío ({milkDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('curves')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'curves'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📈 5. Curvas & Ranking</span>
        </button>

        <button
          onClick={() => setActiveTab('secado')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'secado'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🔔 6. Secado ({metrics.dryOffAlerts.length})</span>
        </button>
      </div>

      {/* ==================== PESTAÑA 1: CONTROL DIARIO & QUINCENAS ==================== */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          
          {/* PANEL DESTACADO: REGISTRO RÁPIDO DEL DÍA CON AUTO-CARGA */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-3xl border-2 border-emerald-500/40 shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/30">
                  <Milk className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">
                    Registrar Ordeño por Día (Carga Automática)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Selecciona el día para ver o guardar los litros producidos al instante.
                  </p>
                </div>
              </div>

              {/* Selector de Fecha Rápido */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-2xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => syncQuickDayForm(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    syncQuickDayForm(getLocalDateString(yesterday));
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Ayer
                </button>
                <button
                  type="button"
                  onClick={() => syncQuickDayForm(getLocalDateString(new Date()))}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 font-bold text-xs transition cursor-pointer"
                >
                  Hoy
                </button>
              </div>
            </div>

            {/* Formulario Rápido de 3 Cajas Grandes */}
            <form onSubmit={handleQuickDaySave} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
              
              {/* AM */}
              <div className="space-y-1">
                <label className="text-xs font-black text-amber-400 flex items-center gap-1">
                  <span>🌅 Mañana (AM)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0.0"
                    value={quickAm}
                    onChange={(e) => {
                      setQuickAm(e.target.value);
                      const am = parseFloat(e.target.value) || 0;
                      const pm = parseFloat(quickPm) || 0;
                      const tot = am + pm;
                      setQuickTotal(tot > 0 ? String(Number(tot.toFixed(1))) : '');
                    }}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-black text-lg focus:border-amber-400 outline-none pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                </div>
              </div>

              {/* PM */}
              <div className="space-y-1">
                <label className="text-xs font-black text-blue-400 flex items-center gap-1">
                  <span>🌇 Tarde (PM)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0.0"
                    value={quickPm}
                    onChange={(e) => {
                      setQuickPm(e.target.value);
                      const am = parseFloat(quickAm) || 0;
                      const pm = parseFloat(e.target.value) || 0;
                      const tot = am + pm;
                      setQuickTotal(tot > 0 ? String(Number(tot.toFixed(1))) : '');
                    }}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-black text-lg focus:border-blue-400 outline-none pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                </div>
              </div>

              {/* Total Día */}
              <div className="space-y-1">
                <label className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <span>🥛 Total Día</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0.0"
                    value={quickTotal}
                    onChange={(e) => setQuickTotal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-emerald-500 text-emerald-400 font-black text-xl outline-none pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400">L</span>
                </div>
              </div>

              {/* Vacas */}
              <div className="space-y-1">
                <label className="text-xs font-black text-purple-400 flex items-center gap-1">
                  <span>🐄 Vacas Ordeñadas</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="18"
                    value={quickCows}
                    onChange={(e) => setQuickCows(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold text-base outline-none pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">cab</span>
                </div>
              </div>

              {/* Botón Guardar Día (Gran botón visible de alto impacto) */}
              <div className="col-span-2 sm:col-span-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{quickLogExists ? 'Actualizar Día' : 'Guardar Día'}</span>
                </button>
              </div>

            </form>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                {quickLogExists ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Día {formatDate(quickDate)} ya registrado ({quickTotal} L)
                  </span>
                ) : (
                  <span>⚪ Sin registrar para el día {formatDate(quickDate)}</span>
                )}
              </span>

              <button
                type="button"
                onClick={() => {
                  setEditingDailyLog({ date: quickDate });
                  setIsDailyLogModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>+ Más detalles (Terneros, Queso, Descarte)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SELECTOR DE PERÍODOS (QUINCENAL / MENSUAL) */}
          <div className="bg-slate-900/60 dark:bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Selector Mes y Año */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
                  >
                    {monthNames.map((name, idx) => (
                      <option key={idx} value={idx} className="bg-slate-900 text-white">
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="bg-transparent text-xs text-emerald-400 font-bold outline-none cursor-pointer ml-1"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botones de Quincena / Mes */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPeriodType('first_fortnight')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      periodType === 'first_fortnight'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1ª Quincena (1-15)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodType('second_fortnight')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      periodType === 'second_fortnight'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2ª Quincena (16-fin)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodType('full_month')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      periodType === 'full_month'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mes Completo
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodType('current_week')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      periodType === 'current_week'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Esta Semana
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodType('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      periodType === 'custom'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Espacio para Introducir el Precio de Venta por Litro ($/L) */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-amber-500/50 shadow-inner" title="Precio por litro al que vendes la leche en tu finca (COP/L)">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Precio Leche:</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-black text-amber-400">$</span>
                  <input
                    type="number"
                    value={milkPricePerLiter}
                    onChange={(e) => handleMilkPriceChange(e.target.value)}
                    className="w-16 sm:w-20 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-2 py-1 text-right text-xs font-mono font-black text-white outline-none transition"
                    placeholder="2100"
                    step="50"
                    min="0"
                  />
                  <span className="text-[11px] font-black text-slate-400">/L</span>
                </div>
              </div>

              {/* Botón Liquidar Período */}
              <button
                onClick={() => {
                  setEditingSettlement(null);
                  setIsSettlementModalOpen(true);
                }}
                className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Liquidar Este Período</span>
              </button>
            </div>

            {periodType === 'custom' && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800 text-xs">
                <span className="font-bold text-slate-400">Desde:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-bold"
                />
                <span className="font-bold text-slate-400">Hasta:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-bold"
                />
              </div>
            )}
          </div>

          {/* TABLA DE DÍAS DEL PERÍODO (CON BOTONES DE REGISTRAR DE ALTA VISIBILIDAD) */}
          <div className="bg-slate-900/60 dark:bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                📋 Tabla Día a Día: {periodRange.label}
              </span>
              <span className="text-xs text-slate-400">
                {periodDays.length} días en el período
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                    <th className="p-3.5 pl-5">Fecha / Día</th>
                    <th className="p-3.5 text-right text-amber-400">AM (L)</th>
                    <th className="p-3.5 text-right text-blue-400">PM (L)</th>
                    <th className="p-3.5 text-right text-emerald-400 font-bold">Total (L)</th>
                    <th className="p-3.5 text-center">Vacas</th>
                    <th className="p-3.5 text-right text-cyan-300 font-bold">Venta (L)</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right pr-5">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {periodDays.map((day) => {
                    const isToday = day.date === getLocalDateString(new Date());
                    const isSelectedInQuick = day.date === quickDate;

                    return (
                      <tr 
                        key={day.date} 
                        className={`hover:bg-slate-800/40 transition ${
                          isSelectedInQuick ? 'bg-emerald-500/10' : (isToday ? 'bg-emerald-500/5' : '')
                        }`}
                      >
                        {/* Fecha y Día */}
                        <td className="p-3.5 pl-5 font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              day.hasLog 
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {day.dayNumber}
                            </span>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{formatDate(day.date)}</span>
                                {isToday && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-[9px] font-black text-slate-950 uppercase">
                                    HOY
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 capitalize">{day.dayOfWeek}</span>
                            </div>
                          </div>
                        </td>

                        {/* AM */}
                        <td className="p-3.5 text-right font-mono font-bold text-amber-300 text-sm">
                          {day.amLiters > 0 ? day.amLiters.toFixed(1) : '-'}
                        </td>

                        {/* PM */}
                        <td className="p-3.5 text-right font-mono font-bold text-blue-300 text-sm">
                          {day.pmLiters > 0 ? day.pmLiters.toFixed(1) : '-'}
                        </td>

                        {/* Total */}
                        <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-base">
                          {day.totalLiters > 0 ? `${day.totalLiters.toFixed(1)} L` : '-'}
                        </td>

                        {/* Vacas */}
                        <td className="p-3.5 text-center font-mono text-slate-300">
                          {day.cowsMilked > 0 ? `${day.cowsMilked}` : '-'}
                        </td>

                        {/* Venta */}
                        <td className="p-3.5 text-right font-mono font-black text-cyan-300 text-sm">
                          {day.salesLiters > 0 ? `${day.salesLiters.toFixed(1)} L` : '-'}
                        </td>

                        {/* Estado */}
                        <td className="p-3.5 text-center">
                          {day.totalLiters > 0 ? (
                            day.isSettled ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                🟢 Liquidado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                🟡 Pendiente
                              </span>
                            )
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">Sin registro</span>
                          )}
                        </td>

                        {/* Botón de Registrar / Editar (Gran visibilidad y contraste) */}
                        <td className="p-3.5 text-right pr-5">
                          {day.hasLog ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenDayLog(day.date, day.log)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white font-bold text-xs border border-emerald-500/30 transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                                title="Editar producción del día"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Deseas eliminar la producción del ${formatDate(day.date)}?`)) {
                                    onDeleteDailyMilkLog(day.log.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer active:scale-95"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            /* Botón Registrar ALTAMENTE VISIBLE con fondo verde esmeralda sólido */
                            <button
                              type="button"
                              onClick={() => handleOpenDayLog(day.date, null)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ Registrar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Fila de Totales */}
                <tfoot>
                  <tr className="bg-slate-950 font-black text-white border-t-2 border-slate-800 text-xs">
                    <td className="p-4 pl-5">
                      <span className="text-emerald-400 font-mono uppercase">TOTAL PERÍODO</span>
                    </td>
                    <td className="p-4 text-right font-mono text-amber-300">
                      {formatNumber(periodSummary.totalAmLiters, 1)} L
                    </td>
                    <td className="p-4 text-right font-mono text-blue-300">
                      {formatNumber(periodSummary.totalPmLiters, 1)} L
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400 text-base">
                      {formatNumber(periodSummary.totalLiters, 1)} L
                    </td>
                    <td className="p-4 text-center font-mono text-slate-300">
                      {formatNumber(periodSummary.avgCowsMilked, 0)} prom.
                    </td>
                    <td className="p-4 text-right font-mono text-cyan-300 text-base">
                      {formatNumber(periodSummary.totalSalesLiters, 1)} L
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-400 text-[11px] font-mono">
                        {periodSummary.settledLiters > 0 ? `${formatNumber(periodSummary.settledLiters, 0)}L Liq.` : '-'}
                      </span>
                    </td>
                    <td className="p-4 pr-5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== PESTAÑA 2: LIQUIDACIONES & VENTAS ==================== */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Historial de Liquidaciones & Cierres de Venta de Leche</span>
            </h3>

            <button
              onClick={() => {
                setEditingSettlement(null);
                setIsSettlementModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nueva Liquidación</span>
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                    <th className="p-3.5 pl-5">Período Liquidado</th>
                    <th className="p-3.5">Comprador / Acopio</th>
                    <th className="p-3.5 text-right text-blue-300">Litros (L)</th>
                    <th className="p-3.5 text-right text-slate-300">Precio/L</th>
                    <th className="p-3.5 text-right text-emerald-400 font-bold">Total Liquidado</th>
                    <th className="p-3.5 text-center">Estado de Pago</th>
                    <th className="p-3.5 text-center">Fecha Pago</th>
                    <th className="p-3.5 text-right pr-5">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {milkSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No hay liquidaciones registradas aún. Pulsa <strong>"+ Liquidar Leche"</strong> arriba para generar la primera.
                      </td>
                    </tr>
                  ) : (
                    milkSettlements.map(st => (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 pl-5 font-mono">
                          <div className="font-bold text-white">
                            {formatDate(st.startDate)} - {formatDate(st.endDate)}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">
                            {st.periodType || 'Quincenal'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">
                          {st.buyer || 'Planta / Acopio'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-blue-300 text-sm">
                          {formatNumber(st.totalLiters, 1)} L
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-300">
                          {formatCurrency(st.pricePerLiter)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-base">
                          {formatCurrency(st.totalValue)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            st.paymentStatus === 'Pagada'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {st.paymentStatus || 'Pagada'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-slate-400 font-mono">
                          {formatDate(st.paymentDate) || '-'}
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setViewingSettlementReceipt(st);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                              title="Ver Volante / Recibo"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Recibo</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingSettlement(st);
                                setIsSettlementModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm('¿Deseas eliminar esta liquidación?')) {
                                  onDeleteMilkSettlement(st.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== PESTAÑA 3: PLANILLA INDIVIDUAL ==================== */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          
          <div className="bg-slate-900/60 dark:bg-slate-900/90 p-4 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold outline-none"
                >
                  <option value="all">Todos los Lotes ({females.length})</option>
                  {batches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsQuickMilkingOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Planilla Rápida</span>
              </button>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar chapa o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 dark:bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                    <th className="p-3.5 pl-5">Chapa</th>
                    <th className="p-3.5">Nombre / Raza</th>
                    <th className="p-3.5">Lote / Potrero</th>
                    <th className="p-3.5 text-center">DEL</th>
                    <th className="p-3.5 text-right text-amber-400">AM (L)</th>
                    <th className="p-3.5 text-right text-blue-400">PM (L)</th>
                    <th className="p-3.5 text-right text-emerald-400 font-bold">Total (L)</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right pr-5">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredFemales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No se encontraron vacas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredFemales.map(cow => {
                      const record = dateRecordMap.get(String(cow.id));
                      const am = record ? (parseFloat(record.amLiters) || 0) : (parseFloat(cow.dailyMilkLiters) * 0.6 || 0);
                      const pm = record ? (parseFloat(record.pmLiters) || 0) : (parseFloat(cow.dailyMilkLiters) * 0.4 || 0);
                      const total = record ? (parseFloat(record.totalLiters) || (am + pm)) : (parseFloat(cow.dailyMilkLiters) || 0);
                      const del = calculateDaysInMilk(cow, milkRecords);

                      return (
                        <tr key={cow.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 pl-5 font-mono font-black text-white text-sm">
                            <button
                              type="button"
                              onClick={() => onSelectAnimal && onSelectAnimal(cow)}
                              className="hover:text-emerald-400 transition cursor-pointer text-left"
                            >
                              #{cow.tagNumber || 'S/N'}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-200">{cow.name || '-'}</div>
                            <div className="text-[11px] text-slate-400">{cow.breed || 'Cruze Lechero'}</div>
                          </td>
                          <td className="p-3.5 text-slate-300 font-medium">
                            {cow.entryBatch || cow.paddock || '-'}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 font-mono text-slate-300 text-[11px]">
                              {del > 0 ? `${del}d` : '-'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-amber-300 text-sm">
                            {am > 0 ? am.toFixed(1) : '-'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-blue-300 text-sm">
                            {pm > 0 ? pm.toFixed(1) : '-'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-base">
                            {total > 0 ? `${total.toFixed(1)} L` : '-'}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              total > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {cow.milkingStatus || (total > 0 ? 'Ordeñada' : 'Seca')}
                            </span>
                          </td>
                          <td className="p-3.5 text-right pr-5">
                            <button
                              onClick={() => {
                                setSelectedCowForCurve(cow);
                                setActiveTab('curves');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 text-xs font-bold transition cursor-pointer"
                              title="Ver curva de lactancia"
                            >
                              Curva 📈
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== PESTAÑA 4: TANQUE FRÍO & DESPACHOS ==================== */}
      {activeTab === 'tank' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span>Historial de Despachos & Entregas a Tanque Frío</span>
            </h3>

            <button
              onClick={() => {
                setEditingDelivery(null);
                setIsTankModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nuevo Despacho</span>
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                    <th className="p-3.5 pl-5">Fecha</th>
                    <th className="p-3.5">Comprador / Acopio</th>
                    <th className="p-3.5 text-right text-cyan-300">Litros (L)</th>
                    <th className="p-3.5 text-right text-slate-300">Precio/L</th>
                    <th className="p-3.5 text-right text-emerald-400 font-bold">Total Liquidado</th>
                    <th className="p-3.5 text-center">Destino</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right pr-5">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {milkDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No hay registros de despachos a tanque registrados aún. Pulsa <strong>"+ Nuevo Despacho"</strong> arriba para agregar el primero.
                      </td>
                    </tr>
                  ) : (
                    milkDeliveries.map(deliv => (
                      <tr key={deliv.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 pl-5 font-mono font-bold text-white">
                          {formatDate(deliv.date)}
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">
                          {deliv.buyer || 'Acopio Lechero'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-cyan-300 text-sm">
                          {parseFloat(deliv.totalLiters || 0).toFixed(1)} L
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-300">
                          ${parseFloat(deliv.pricePerLiter || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                          {formatCurrency(deliv.totalValue || (deliv.totalLiters * deliv.pricePerLiter))}
                        </td>
                        <td className="p-3.5 text-center text-slate-400">
                          {deliv.milkDestination || deliv.destination || 'Planta'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            deliv.paymentStatus === 'Pagado'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {deliv.paymentStatus || 'Pagado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <button
                            onClick={() => {
                              if (window.confirm('¿Deseas eliminar este registro de despacho?')) {
                                onDeleteMilkDelivery(deliv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            title="Eliminar despacho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== PESTAÑA 5: CURVAS & RANKING ==================== */}
      {activeTab === 'curves' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Vaca Seleccionada:</span>
              <select
                value={selectedCowForCurve?.id || (females[0]?.id || '')}
                onChange={(e) => {
                  const match = females.find(c => String(c.id) === String(e.target.value));
                  if (match) setSelectedCowForCurve(match);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-emerald-500"
              >
                {females.map(c => (
                  <option key={c.id} value={c.id}>
                    #{c.tagNumber || 'S/N'} {c.name ? `• ${c.name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedCowForCurve && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">DEL: <strong className="text-white">{calculateDaysInMilk(selectedCowForCurve, milkRecords)} días</strong></span>
                <span className="text-slate-400">Pico: <strong className="text-emerald-400">{calculateLactationCurve(selectedCowForCurve, milkRecords).peakLiters} L</strong></span>
                <span className="text-slate-400">Proy. 305d: <strong className="text-cyan-400">{calculateLactationCurve(selectedCowForCurve, milkRecords).projected305} L</strong></span>
              </div>
            )}
          </div>

          {selectedCowForCurve && (
            <DairyLactationChart
              dataPoints={calculateLactationCurve(selectedCowForCurve, milkRecords).dataPoints}
              cowName={selectedCowForCurve.name}
              tagNumber={selectedCowForCurve.tagNumber}
            />
          )}

          <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Top 10 Vacas Más Productoras del Hato</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {females
                .map(cow => {
                  const curve = calculateLactationCurve(cow, milkRecords);
                  return {
                    cow,
                    avg: curve.avgDaily || parseFloat(cow.dailyMilkLiters) || 0,
                    peak: curve.peakLiters,
                    proj: curve.projected305,
                  };
                })
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 10)
                .map((item, idx) => (
                  <div
                    key={item.cow.id}
                    onClick={() => {
                      setSelectedCowForCurve(item.cow);
                      window.scrollTo({ top: 100, behavior: 'smooth' });
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' :
                        idx === 1 ? 'bg-slate-300 text-slate-950' :
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <span className="font-mono font-black text-white text-sm">
                          #{item.cow.tagNumber || 'S/N'}
                        </span>
                        <span className="text-xs text-slate-400 block truncate max-w-[140px]">
                          {item.cow.name || item.cow.breed || 'Cruze Lechero'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-emerald-400 font-mono block">
                        {item.avg.toFixed(1)} L/d
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Pico: {item.peak}L • 305d: {item.proj}L
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PESTAÑA 6: SECADO ==================== */}
      {activeTab === 'secado' && (
        <div className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-500/40 p-4 sm:p-5 rounded-3xl space-y-2">
            <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Semáforo de Secado Preparto (Descanso de Ubre a 60 Días del Parto)</span>
            </h3>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              El periodo seco garantiza que la ubre regenere tejido alveolar, evita mastitis en el posparto y asegura excelente producción de calostro para la cría. Toda vaca preñada con más de 220 días de gestación debe ser secada inmediatamente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {metrics.dryOffAlerts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2 bg-slate-900/60 rounded-3xl border border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">¡No hay vacas pendientes de secado en este momento!</p>
                <p className="text-xs text-slate-500">Todas las hembras gestantes están en periodos seguros de lactancia.</p>
              </div>
            ) : (
              metrics.dryOffAlerts.map(alert => (
                <div
                  key={alert.cow.id}
                  className={`p-4 rounded-3xl border space-y-3 transition ${
                    alert.isOverdue 
                      ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/40' 
                      : 'bg-amber-950/30 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-lg text-white">
                        #{alert.cow.tagNumber || 'S/N'}
                      </span>
                      <span className="text-xs text-slate-300 block">
                        {alert.cow.name || alert.cow.breed || 'Vaca Lechera'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                      alert.isOverdue 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-amber-400 text-slate-950 font-black'
                    }`}>
                      {alert.isOverdue ? '⚠️ SECAR HOY' : `${alert.daysLeft} DÍAS RESTANTES`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-2.5 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gestación:</span>
                      <strong className="text-white font-mono">{alert.pregnancyDays} días</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Parto Previsto:</span>
                      <strong className="text-emerald-400 font-mono">
                        {formatDate(alert.cow.expectedCalvingDate) || `En ${283 - alert.pregnancyDays}d`}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectAnimal && onSelectAnimal(alert.cow)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Abrir Ficha Bovina</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ==================== MODALES ==================== */}
      <DailyMilkLogModal
        isOpen={isDailyLogModalOpen}
        onClose={() => {
          setIsDailyLogModalOpen(false);
          setEditingDailyLog(null);
        }}
        onSave={onSaveDailyMilkLog}
        onDelete={onDeleteDailyMilkLog}
        initialData={editingDailyLog}
        dailyMilkLogs={dailyMilkLogs}
        activeMilkingCowsCount={metrics.milkingCowsCount}
        defaultPricePerLiter={typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100}
      />

      <MilkSettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => {
          setIsSettlementModalOpen(false);
          setEditingSettlement(null);
        }}
        onSave={onSaveMilkSettlement}
        onDelete={onDeleteMilkSettlement}
        initialData={editingSettlement}
        dailyMilkLogs={dailyMilkLogs}
        milkRecords={milkRecords}
        currentPeriodRange={periodRange}
        defaultPricePerLiter={typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100}
        farmName={farmName}
      />

      <MilkSettlementReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setViewingSettlementReceipt(null);
        }}
        settlement={viewingSettlementReceipt}
        farmName={farmName}
      />

      <QuickMilkingModal
        isOpen={isQuickMilkingOpen}
        onClose={() => setIsQuickMilkingOpen(false)}
        cattle={cattle}
        milkRecords={milkRecords}
        onSaveBatch={onSaveBatchMilkRecords}
        defaultDate={selectedDate}
      />

      <TankDeliveryModal
        isOpen={isTankModalOpen}
        onClose={() => setIsTankModalOpen(false)}
        onSaveDelivery={onSaveMilkDelivery}
        editingDelivery={editingDelivery}
        suggestedLiters={metrics.todayTotalLiters}
        defaultPricePerLiter={typeof milkPricePerLiter === 'number' ? milkPricePerLiter : 2100}
        defaultDate={selectedDate}
      />

    </div>
  );
}
