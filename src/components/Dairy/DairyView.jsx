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
  Flame, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Clock, 
  Baby, 
  Award,
  Zap,
  Tag
} from 'lucide-react';
import { QuickMilkingModal } from './QuickMilkingModal';
import { TankDeliveryModal } from './TankDeliveryModal';
import { DairyLactationChart } from './DairyLactationChart';
import { exportDairyReportToExcel } from '../../services/dairyExcelService';
import { 
  calculateHerdMilkMetrics, 
  calculateDaysInMilk, 
  calculateLactationCurve, 
  formatNumber, 
  formatCurrency, 
  formatDate 
} from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

export function DairyView({
  cattle = [],
  milkRecords = [],
  milkDeliveries = [],
  onSaveMilkRecord,
  onSaveBatchMilkRecords,
  onDeleteMilkRecord,
  onSaveMilkDelivery,
  onDeleteMilkDelivery,
  onSelectAnimal,
  onOpenNewAnimal,
  farmName = 'Mi Finca Ganadera',
  currentUser = null
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet', 'curves', 'tank', 'lots'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  
  // Modales
  const [isQuickMilkingOpen, setIsQuickMilkingOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [selectedCowForCurve, setSelectedCowForCurve] = useState(null);

  // Hembras adultas o en ordeño
  const females = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  const batches = Array.from(new Set(females.map(c => c.entryBatch || c.paddock || 'Sin Lote'))).filter(Boolean);

  // Métricas del hato para la fecha seleccionada
  const metrics = calculateHerdMilkMetrics(cattle, milkRecords, milkDeliveries, selectedDate);

  // Registros de la fecha seleccionada
  const dateRecords = milkRecords.filter(r => r.date === selectedDate);
  const dateRecordMap = new Map(dateRecords.map(r => [String(r.cattleId), r]));

  // Filtrado de vacas para la planilla
  const filteredFemales = females.filter(cow => {
    const matchesSearch = 
      (cow.tagNumber && cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cow.name && cow.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBatch = selectedBatchFilter === 'all' || (cow.entryBatch || cow.paddock || 'Sin Lote') === selectedBatchFilter;
    return matchesSearch && matchesBatch;
  });

  // Exportar a Excel
  const handleExportExcel = () => {
    exportDairyReportToExcel({
      cattle,
      milkRecords,
      milkDeliveries,
      farmName,
      selectedDate
    });
    triggerFeedback('single');
  };

  // Enviar Reporte por WhatsApp
  const handleShareWhatsApp = () => {
    const lines = [
      `🥛 *REPORTE DE CONTROL LECHERO*`,
      `🏡 *Finca:* ${farmName}`,
      `📅 *Fecha:* ${formatDate(selectedDate)}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🥛 *Producción Total Hoy:* ${metrics.todayTotalLiters} Litros`,
      `🌅 *Ordeño Mañana (AM):* ${metrics.todayAmLiters} L`,
      `🌇 *Ordeño Tarde (PM):* ${metrics.todayPmLiters} L`,
      `🐄 *Vacas en Ordeño:* ${metrics.milkingCowsCount} / ${metrics.totalFemalesCount} (${metrics.milkingPercentage}%)`,
      `📊 *Promedio por Vaca:* ${metrics.avgPerMilkingCow} L/vaca/día`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🧊 *Entregas Tanque (Mes):* ${metrics.monthDeliveredLiters} L`,
      `💰 *Facturación Estimada:* ${formatCurrency(metrics.monthTotalRevenue)}`,
    ];

    if (metrics.dryOffAlerts.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`⚠️ *ALERTA DE SECADO PREPARTO (${metrics.dryOffAlerts.length}):*`);
      metrics.dryOffAlerts.slice(0, 5).forEach(a => {
        lines.push(`• #${a.cow.tagNumber}: ${a.pregnancyDays}d preñez (${a.isOverdue ? 'SECAR HOY' : `${a.daysLeft}d restantes`})`);
      });
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Generado por GanadoPro App_ 📱`);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    triggerFeedback('single');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Cabecera Principal & Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Milk className="w-6 h-6" />
            </span>
            <span>Módulo de Lechería & Control Lechero</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control de ordeños AM/PM, curvas de lactancia (DEL), semáforo de secado preparto y tanque frío.
          </p>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsQuickMilkingOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Zap className="w-4 h-4" />
            <span>Planilla Rápida</span>
          </button>

          <button
            onClick={() => {
              setEditingDelivery(null);
              setIsTankModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Truck className="w-4 h-4" />
            <span>+ Despacho Tanque</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Exportar a Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
            title="Compartir por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Tarjetas KPI Superiores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Producción Hoy */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-emerald-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
              Producción Hoy
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs">🥛</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {metrics.todayTotalLiters}
            </span>
            <span className="text-xs font-black text-slate-400">LITROS</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>🌅 AM: <strong className="text-amber-300">{metrics.todayAmLiters}L</strong></span>
            <span>🌇 PM: <strong className="text-blue-300">{metrics.todayPmLiters}L</strong></span>
          </div>
        </div>

        {/* KPI 2: Hato en Ordeño */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-purple-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-400 uppercase tracking-wider">
              Vacas en Ordeño
            </span>
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 text-xs">🐄</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {metrics.milkingCowsCount}
            </span>
            <span className="text-xs font-black text-slate-400">de {metrics.totalFemalesCount} hembras</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>En Ordeño: <strong className="text-purple-300">{metrics.milkingPercentage}%</strong></span>
            <span>Secas: <strong className="text-slate-300">{metrics.dryCowsCount}</strong></span>
          </div>
        </div>

        {/* KPI 3: Promedio por Vaca */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-amber-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
              Promedio Diario
            </span>
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-xs">📊</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {metrics.avgPerMilkingCow}
            </span>
            <span className="text-xs font-black text-slate-400">L / vaca / día</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Prom. Hato Total: <strong className="text-amber-300">{metrics.avgPerTotalCow} L</strong></span>
          </div>
        </div>

        {/* KPI 4: Tanque & Facturación Mes */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 p-4 rounded-3xl border border-cyan-500/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
              Facturación Mes
            </span>
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs">💰</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono truncate">
              {formatCurrency(metrics.monthTotalRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Tanque: <strong className="text-cyan-300">{metrics.monthDeliveredLiters} L</strong></span>
            <span>Prom/L: <strong className="text-emerald-300">${metrics.avgPricePerLiter}</strong></span>
          </div>
        </div>

      </div>

      {/* 3. Pestañas de Navegación del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'sheet'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📋 Planilla Diaria de Ordeño</span>
        </button>

        <button
          onClick={() => setActiveTab('curves')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'curves'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📈 Curvas de Lactancia, DEL & Ranking</span>
        </button>

        <button
          onClick={() => setActiveTab('tank')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'tank'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🧊 Tanque Frío & Despachos ({milkDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('secado')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'secado'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🔔 Semáforo de Secado ({metrics.dryOffAlerts.length})</span>
        </button>
      </div>

      {/* 4. Contenido según la pestaña activa */}

      {/* PESTAÑA 1: PLANILLA DIARIA DE ORDEÑO */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros */}
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

            <div className="relative w-full sm:w-64">
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

          {/* Tabla de Ordeño */}
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

      {/* PESTAÑA 2: CURVAS DE LACTANCIA & RANKING */}
      {activeTab === 'curves' && (
        <div className="space-y-6">
          
          {/* Selector de Vaca para Curva */}
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

          {/* Componente Gráfico de Curva de Lactancia */}
          {selectedCowForCurve && (
            <DairyLactationChart
              dataPoints={calculateLactationCurve(selectedCowForCurve, milkRecords).dataPoints}
              cowName={selectedCowForCurve.name}
              tagNumber={selectedCowForCurve.tagNumber}
            />
          )}

          {/* Ranking Top 10 Vacas Más Productoras */}
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

      {/* PESTAÑA 3: TANQUE FRÍO & DESPACHOS */}
      {activeTab === 'tank' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span>Historial de Despachos & Entregas a Tanque</span>
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
                        No hay registros de despachos a tanque registrados aún. Pulsa <strong>"+ Despacho Tanque"</strong> para agregar el primero.
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

      {/* PESTAÑA 4: SEMÁFORO DE SECADO PREPARTO */}
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

      {/* Modales */}
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
        defaultDate={selectedDate}
      />

    </div>
  );
}
