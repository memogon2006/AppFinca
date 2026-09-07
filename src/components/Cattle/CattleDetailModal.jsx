import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Badge, StatusBadge, FemaleStatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate,
  calculateWeightMetrics, 
  calculateFinancials, 
  calculateReproduction,
  calculateMilkMetrics 
} from '../../services/calculations';
import { 
  Scale, 
  DollarSign, 
  Calendar, 
  Tag, 
  PlusCircle, 
  TrendingUp, 
  Info, 
  Baby, 
  Milk, 
  HeartHandshake, 
  AlertCircle,
  Clock,
  Trash2,
  Edit3,
  RotateCcw,
  Skull,
  Target,
  Flame,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function CattleDetailModal({ 
  isOpen, 
  onClose, 
  animal, 
  weighings = [], 
  onOpenAddWeight, 
  onOpenSell,
  onOpenEdit,
  onOpenDeath,
  onRevertDeath,
  onDelete,
  onDeleteWeight,
  isDark = false 
}) {
  if (!animal) return null;

  const [activeTab, setActiveTab] = useState('weights'); // 'weights' | 'repro' | 'financials' | 'general'

  const animalWeighings = weighings.filter(w => w.cattleId === animal.id);
  const weightMetrics = calculateWeightMetrics(animal, animalWeighings);
  const financials = calculateFinancials(animal);
  const repro = calculateReproduction(animal);
  const milkMetrics = calculateMilkMetrics(animal);
  const batchName = animal.entryBatch || animal.paddock || 'Ingreso #1';

  const femaleStatus = animal.femaleStatus || (
    animal.reproductiveStatus === 'Preñada' ? 'Gestación' : animal.milkingStatus === 'En ordeño' ? 'Producción de leche' : 'Vacía'
  );

  const weightChartData = [];
  if (animal.entryWeight && parseFloat(animal.entryWeight) > 0) {
    weightChartData.push({ date: formatDate(animal.entryDate), rawDate: animal.entryDate, weight: parseFloat(animal.entryWeight), label: 'Entrada' });
  }
  weightMetrics.sortedWeights.forEach(w => {
    weightChartData.push({
      date: formatDate(w.date),
      rawDate: w.date,
      weight: parseFloat(w.weight),
      label: w.notes || 'Báscula'
    });
  });

  if (animal.status === 'Vendido' && animal.exitWeight && parseFloat(animal.exitWeight) > 0) {
    weightChartData.push({
      date: formatDate(animal.exitDate),
      rawDate: animal.exitDate,
      weight: parseFloat(animal.exitWeight),
      label: 'Venta'
    });
  }

  const uniqueChartData = weightChartData.filter((v, i, a) => a.findIndex(t => t.date === v.date) === i);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${animal.tagNumber} ${animal.name ? `• ${animal.name}` : ''}`}
      subtitle={`Ficha Técnica • Hierro: ${animal.ironBrand || 'N/A'} • ${batchName} • Dueño: ${animal.owner || 'N/A'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 sm:space-y-6">
        
        {/* Banner de Animal Fallecido si status === 'Muerto' */}
        {animal.status === 'Muerto' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 font-bold">
            <div className="flex items-start gap-2.5">
              <Skull className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm text-rose-700 dark:text-rose-300">
                  Animal Dado de Baja por Muerte
                </p>
                <p className="text-xs mt-0.5 font-bold text-rose-900 dark:text-rose-200">
                  <strong>Fecha:</strong> {animal.deathDate ? formatDate(animal.deathDate) : 'No registrada'} • <strong>Causa:</strong> {animal.deathReason || 'No especificada'}
                </p>
                {animal.deathNotes && (
                  <p className="text-xs mt-1 text-slate-700 dark:text-slate-200 italic font-bold">
                    "{animal.deathNotes}"
                  </p>
                )}
              </div>
            </div>

            {onRevertDeath && (
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas restaurar este animal a estado Activo?')) {
                    onRevertDeath(animal.id);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition whitespace-nowrap self-end sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar a Activo</span>
              </button>
            )}
          </div>
        )}

        {/* Encabezado y Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 font-bold">
            <StatusBadge status={animal.status} />
            <ProductionTypeBadge type={animal.productionType} />
            <Badge variant="default" className="font-bold">{animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</Badge>
            {animal.sex === 'Hembra' && (
              <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
            )}
            <Badge variant="default" className="font-bold">{animal.breed}</Badge>
            <Badge variant="default" className="font-bold">{animal.category}</Badge>
            {animal.sex === 'Hembra' && animal.isBreedingOnly && <Badge variant="purple" className="font-bold">⭐ Solo de Cría</Badge>}
            
            <span className="inline-flex items-center gap-1 font-black text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-400 dark:border-emerald-500/50 text-xs shadow-sm">
              <Tag className="w-3.5 h-3.5" /> {batchName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {animal.status === 'Activo' && (
              <>
                <button
                  onClick={() => onOpenAddWeight(animal)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm min-h-[36px] cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>+ Pesaje</span>
                </button>

                <button
                  onClick={() => onOpenSell(animal)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm min-h-[36px] cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Vender</span>
                </button>

                <button
                  onClick={() => onOpenDeath(animal)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/60 dark:hover:bg-rose-600 transition text-xs font-black flex items-center gap-1.5 border border-rose-300 dark:border-rose-900 min-h-[36px] cursor-pointer"
                  title="Dar de baja por muerte"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Muerto</span>
                </button>
              </>
            )}

            <button
              onClick={() => onOpenEdit(animal)}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-black text-xs flex items-center gap-1.5 transition min-h-[36px] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar permanentemente al animal ${animal.tagNumber}?`)) {
                  onDelete(animal.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer font-bold"
              title="Eliminar animal permanentemente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumen de Métricas Clave (5 Bloques) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Compra / Inicial</span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {animal.entryWeight && parseFloat(animal.entryWeight) > 0 ? `${animal.entryWeight} kg` : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-200 font-extrabold block truncate">
              {animal.entryPrice && parseFloat(animal.entryPrice) > 0 ? formatCurrency(animal.entryPrice) : '$0'}
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Días en Finca</span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">{weightMetrics.totalDays} días</p>
            <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-bold">Ingreso: {formatDate(animal.entryDate)}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Peso Actual</span>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {weightMetrics.hasWeight ? `${weightMetrics.currentWeight} kg` : (animal.sex === 'Hembra' ? 'Vientre' : 'Sin pesaje')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-black block truncate">
              {weightMetrics.hasEntryWeight ? `+${weightMetrics.totalGain} kg ganados` : (animal.sex === 'Hembra' ? `Estado: ${femaleStatus}` : 'Sin peso inicial')}
            </span>
            {weightMetrics.lastWeighDate && (
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold flex items-center gap-0.5 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Fecha: {formatDate(weightMetrics.lastWeighDate)}</span>
              </span>
            )}
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {weightMetrics.hasEntryWeight ? 'GDP Continuo' : 'Producción'}
            </span>
            <p className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 mt-0.5">
              {weightMetrics.hasEntryWeight ? (
                <>{formatNumber(weightMetrics.overallGdp, 3)} <span className="text-xs font-bold">kg/d</span></>
              ) : animal.sex === 'Hembra' && parseFloat(animal.dailyMilkLiters) > 0 ? (
                <>{animal.dailyMilkLiters} <span className="text-xs font-bold">L/d</span></>
              ) : (
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Cría / Reproducción</span>
              )}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-bold">
              {weightMetrics.hasEntryWeight ? (weightMetrics.daysToLastWeigh > 0 ? `En ${weightMetrics.daysToLastWeigh} días desde entrada` : 'Desde la entrada') : (animal.sex === 'Hembra' ? 'Matriz productiva' : 'Sin pesajes')}
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {financials.isSold ? 'Utilidad Real' : animal.status === 'Muerto' ? 'Pérdida Inversión' : 'Utilidad Proy.'}
            </span>
            <p className={`text-base sm:text-lg font-black mt-0.5 ${financials.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
            <div className="flex items-center justify-between mt-1 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-extrabold">
              <span>ROI: {financials.roi}%</span>
              {financials.pricePerKgUsed > 0 && (
                <span className="font-black text-blue-700 dark:text-blue-300">
                  {formatCurrency(financials.pricePerKgUsed)}/kg {financials.isSold ? '(Venta)' : '(Base)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 font-bold">
          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[38px] cursor-pointer ${
              activeTab === 'weights'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Pesajes Continuos ({uniqueChartData.length})</span>
          </button>

          {/* PESTAÑA EXCLUSIVA PARA HEMBRAS */}
          {animal.sex === 'Hembra' && (
            <button
              onClick={() => setActiveTab('repro')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[38px] cursor-pointer ${
                activeTab === 'repro'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-800 dark:text-purple-300 hover:text-purple-950 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Baby className="w-4 h-4" />
              <span>Reproducción, Cría & Lechería</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[38px] cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas y Costos</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[38px] cursor-pointer ${
              activeTab === 'general'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Ficha General</span>
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}

        {/* 1. Control de Pesos Continuos */}
        {activeTab === 'weights' && (
          <div className="space-y-4">
            {uniqueChartData.length > 0 ? (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3 flex items-center justify-between">
                  <span>Curva Continua de Ganancia de Peso</span>
                  <button
                    onClick={() => onOpenAddWeight(animal)}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-black cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Pesaje
                  </button>
                </h4>

                <div className="h-48 sm:h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uniqueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="date" stroke={isDark ? '#cbd5e1' : '#475569'} fontSize={11} fontWeight={700} tickLine={false} />
                      <YAxis stroke={isDark ? '#cbd5e1' : '#475569'} fontSize={11} fontWeight={700} tickLine={false} unit="kg" />
                      <Tooltip
                        formatter={(val) => [`${val} kg`, 'Peso en Báscula']}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#475569' : '#cbd5e1', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          fontWeight: 'bold',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#059669"
                        strokeWidth={3.5}
                        dot={{ r: 4.5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <Scale className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {animal.sex === 'Hembra' ? 'Hembra de Vientre / Lechería registrada sin peso inicial' : 'Sin pesajes registrados'}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                  Puedes registrar pesajes periódicos de control con el botón superior "+ Pesaje".
                </p>
              </div>
            )}

            {/* PROYECCIÓN DE CEBA & PESO META (> 480 KG) */}
            {weightMetrics.hasWeight && weightMetrics.cebaProjection && (
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
                weightMetrics.cebaProjection.isReady 
                  ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-emerald-400 dark:border-emerald-500/50' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Target className={`w-5 h-5 ${weightMetrics.cebaProjection.isReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                        <span>Proyección a Peso Meta ({weightMetrics.cebaProjection.targetWeight} kg)</span>
                        {weightMetrics.cebaProjection.isReady && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-sm animate-pulse">
                            ¡LISTO PARA VENTA!
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  {/* Semáforo de Desempeño */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Rendimiento:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${weightMetrics.performance.colorBg} ${weightMetrics.performance.colorText} flex items-center gap-1 shadow-sm`}>
                      <span>{weightMetrics.performance.icon}</span>
                      <span>{weightMetrics.performance.label}</span>
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso hacia los 480 kg */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                    <span>Peso Actual: {weightMetrics.currentWeight} kg</span>
                    <span>Meta: {weightMetrics.cebaProjection.targetWeight} kg ({weightMetrics.cebaProjection.progressPercentage}%)</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        weightMetrics.cebaProjection.isReady 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : weightMetrics.cebaProjection.progressPercentage >= 85 
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, weightMetrics.cebaProjection.progressPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Tarjetas de Proyección Detallada */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold pt-1">
                  {weightMetrics.cebaProjection.isReady ? (
                    <>
                      <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700">
                        <span className="text-[10px] uppercase text-emerald-800 dark:text-emerald-300 block font-black">Estado del Animal</span>
                        <p className="font-black text-emerald-950 dark:text-emerald-100 text-sm mt-0.5">
                          🎯 Listo para Sacrificio / Venta
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700">
                        <span className="text-[10px] uppercase text-emerald-800 dark:text-emerald-300 block font-black">Excedente sobre Meta</span>
                        <p className="font-black text-emerald-950 dark:text-emerald-100 text-sm mt-0.5">
                          +{weightMetrics.cebaProjection.surplusKg} kg sobre 480 kg
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase text-emerald-800 dark:text-emerald-300 block font-black">Acción Inmediata</span>
                          <p className="font-black text-emerald-950 dark:text-emerald-100 text-xs mt-0.5">Programar Venta</p>
                        </div>
                        {animal.status === 'Activo' && onOpenSell && (
                          <button
                            onClick={() => onOpenSell(animal)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition cursor-pointer"
                          >
                            Vender Ahora
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] uppercase text-slate-600 dark:text-slate-400 block font-black">Kilos Restantes</span>
                        <p className="font-black text-slate-950 dark:text-white text-base mt-0.5">
                          {weightMetrics.cebaProjection.remainingKg} kg
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] uppercase text-slate-600 dark:text-slate-400 block font-black">Días Proyectados</span>
                        <p className="font-black text-blue-700 dark:text-blue-400 text-base mt-0.5">
                          {weightMetrics.cebaProjection.daysToTarget !== null ? `~${weightMetrics.cebaProjection.daysToTarget} días` : 'No calculable'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] uppercase text-slate-600 dark:text-slate-400 block font-black">Fecha Estimada Salida</span>
                        <p className="font-black text-purple-700 dark:text-purple-400 text-base mt-0.5">
                          {weightMetrics.cebaProjection.estimatedDate ? formatDate(weightMetrics.cebaProjection.estimatedDate) : 'Pendiente de pesaje'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TABLA CONTINUA DE PESAJES DESDE LA ENTRADA */}
            {weightMetrics.continuousLogs.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Historial Continuo: Desde Pesaje 1 hasta Pesaje Actual
                </h5>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 font-bold">
                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[10px]">
                      <tr>
                        <th className="p-2.5 sm:p-3 font-black">Pesaje</th>
                        <th className="p-2.5 sm:p-3 font-black">Fecha</th>
                        <th className="p-2.5 sm:p-3 font-black">Días Totales Desde Entrada</th>
                        <th className="p-2.5 sm:p-3 font-black">Peso en Báscula</th>
                        <th className="p-2.5 sm:p-3 font-black">Aumento Total Continuo</th>
                        <th className="p-2.5 sm:p-3 font-black">GDP Continuo (kg/d)</th>
                        <th className="p-2.5 sm:p-3 font-black">Notas</th>
                        <th className="p-2.5 sm:p-3 text-right font-black">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {weightMetrics.continuousLogs.map((log) => {
                        const canDelete = log.id !== 'entry' && log.id !== 'exit' && onDeleteWeight;
                        return (
                          <tr key={log.id || `${log.date}_${log.weight}`} className={log.index === 1 ? 'bg-slate-50 dark:bg-slate-900/60 font-black' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition'}>
                            <td className="p-2.5 sm:p-3 font-black text-slate-950 dark:text-white">{log.name}</td>
                            <td className="p-2.5 sm:p-3 font-black text-slate-900 dark:text-slate-100">{formatDate(log.date)}</td>
                            <td className="p-2.5 sm:p-3 font-black text-blue-700 dark:text-blue-300">{log.daysFromEntry} días</td>
                            <td className="p-2.5 sm:p-3 font-black text-slate-950 dark:text-white">{log.weight} kg</td>
                            <td className="p-2.5 sm:p-3 font-black text-emerald-700 dark:text-emerald-400">
                              {log.index === 1 ? '0.0 kg (Inicial)' : `+${log.totalGain} kg`}
                            </td>
                            <td className="p-2.5 sm:p-3 font-black text-purple-700 dark:text-purple-300">
                              {log.index === 1 ? '-' : `${formatNumber(log.gdp, 3)} kg/d`}
                            </td>
                            <td className="p-2.5 sm:p-3 text-slate-700 dark:text-slate-300 font-bold italic">{log.notes || '-'}</td>
                            <td className="p-2.5 sm:p-3 text-right whitespace-nowrap">
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`¿Deseas eliminar este registro de pesaje (${log.weight} kg del ${formatDate(log.date)}) del bovino ${animal.tagNumber}?`)) {
                                      onDeleteWeight(log.weighingId || log.id, animal.id, log.date, log.weight);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600/80 transition cursor-pointer"
                                  title="Eliminar este pesaje"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : log.id === 'entry' ? (
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Inicial</span>
                              ) : (
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Salida</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Reproducción, Cría & Lechería */}
        {activeTab === 'repro' && animal.sex === 'Hembra' && (
          <div className="space-y-4">
            
            {/* Estado General de la Hembra */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/40 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide">Estado Productivo Actual:</span>
                <p className="text-lg font-black text-purple-950 dark:text-purple-100 mt-0.5">
                  {femaleStatus}
                </p>
              </div>
              <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Cuadrante 1: Control de Gestación / Partos */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-600" />
                  <span>Control Reproductivo & Gestación</span>
                </h4>

                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Condición:</span>
                    <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
                  </div>
                  
                  {repro.isPregnant ? (
                    <>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">Fecha Servicio:</span>
                        <span className="font-black text-slate-950 dark:text-white">{animal.serviceDate ? formatDate(animal.serviceDate) : 'Sin registrar'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">Días Gestación:</span>
                        <span className="font-black text-purple-700 dark:text-purple-300">{repro.daysPregnant} días</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-slate-800 dark:text-slate-200 font-black">Parto Estimado (+283d):</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{repro.expectedCalvingDate ? formatDate(repro.expectedCalvingDate) : '-'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-950 dark:text-purple-100 text-xs font-black">
                        {repro.statusLabel}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {femaleStatus === 'Ceba / Levante / Engorde' || femaleStatus === 'Ceba' || femaleStatus === 'Engorde'
                        ? '🥩 Hembra destinada a ceba, levante y engorde comercial para carne y ganancia de peso.'
                        : femaleStatus === 'Levante de cría'
                        ? '👶 Hembra amamantando ternero al pie.'
                        : '⭕ Hembra vacía / abierta lista para monta o inseminación.'}
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">¿Solo de Cría?:</span>
                    <span className={`font-black ${animal.isBreedingOnly ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {animal.isBreedingOnly ? 'Sí (Vientre Reemplazo)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuadrante 2: Métricas Lecheras y Ciclo Productivo */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Milk className="w-4 h-4 text-blue-600" />
                  <span>Producción de Leche & Ciclo Productivo</span>
                </h4>

                <div className="space-y-2.5 text-xs font-bold">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Estado de Ordeño:</span>
                    <MilkingBadge status={animal.milkingStatus} liters={animal.dailyMilkLiters} />
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Litros por Día:</span>
                    <span className="font-black text-blue-700 dark:text-blue-400 text-sm">
                      {milkMetrics.dailyLiters > 0 ? `${milkMetrics.dailyLiters} L / día` : '0 L (Seca)'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Litros Totales por Ciclo:</span>
                    <span className="font-black text-slate-950 dark:text-white">
                      {milkMetrics.cycleTotalLiters > 0 ? `${formatNumber(milkMetrics.cycleTotalLiters, 0)} L / ciclo` : 'No registrado'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Promedio Litros / Ciclo:</span>
                    <span className="font-black text-blue-700 dark:text-blue-400">
                      {milkMetrics.cycleAvgDaily > 0 ? `${milkMetrics.cycleAvgDaily} L / día` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Días Lactancia Estándar:</span>
                    <span className="font-black text-slate-850 dark:text-slate-200">{milkMetrics.cycleDays} días</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. Finanzas & Costos */}
        {activeTab === 'financials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 shadow-sm">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">Costo de Entrada / Compra</span>
                <p className="text-xl font-black text-slate-950 dark:text-white">{formatCurrency(financials.entryPrice)}</p>
                {financials.pricePerKgEntry > 0 && (
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{formatCurrency(financials.pricePerKgEntry)} / kg inicial</span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 shadow-sm">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">Gastos Directos Acumulados</span>
                <p className="text-xl font-black text-amber-700 dark:text-amber-400">{formatCurrency(financials.expenses)}</p>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Fletes, vacunas, manejo</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 shadow-sm">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">Inversión Total Acumulada</span>
                <p className="text-xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(financials.totalInvested)}</p>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Costo base + Insumos</span>
              </div>
            </div>

            {/* Liquidación de venta si ya está vendido */}
            {financials.isSold && (
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 shadow-sm ${
                (animal.exitType === 'En Compañía' || animal.partnershipDetails)
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40'
              }`}>
                <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
                  <h5 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Detalle de Liquidación de Venta
                  </h5>
                  {(animal.exitType === 'En Compañía' || animal.partnershipDetails) ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-200 dark:bg-teal-900 text-teal-950 dark:text-teal-100 font-black text-[11px] border border-teal-400 dark:border-teal-600 flex items-center gap-1">
                      <Users className="w-3 h-3 text-teal-800 dark:text-teal-200" /> 🤝 En Compañía (50/50)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-950 dark:text-blue-100 font-black text-[11px] border border-blue-400 dark:border-blue-700 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-blue-700 dark:text-blue-300" /> 💰 Venta Directa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 font-black">Precio Total Venta:</span>
                    <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm">{formatCurrency(financials.exitPrice)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 font-black">Peso Salida:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">{animal.exitWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 font-black">Precio / kg Vendido:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(financials.pricePerKgSold)} / kg</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 font-black">Comprador / Fecha:</span>
                    <p className="font-black text-slate-900 dark:text-slate-100 truncate">{animal.saleBuyer || animal.buyer || 'N/A'} • {animal.exitDate ? formatDate(animal.exitDate) : ''}</p>
                  </div>
                </div>

                {/* Si fue en compañía, desglose 50/50 */}
                {(animal.exitType === 'En Compañía' || animal.partnershipDetails) && (() => {
                  const part = animal.partnershipDetails || {
                    entryPrice: parseFloat(animal.entryPrice) || 0,
                    exitPrice: parseFloat(animal.exitPrice) || 0,
                    profit: Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)),
                    farmShare: Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)) * 0.5,
                    partnerTotalReturn: (parseFloat(animal.entryPrice) || 0) + (Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)) * 0.5),
                  };
                  return (
                    <div className="mt-3 pt-2.5 border-t border-teal-200 dark:border-teal-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">Devolución Costo Compra (Dueño):</span>
                        <p className="font-black text-slate-950 dark:text-white mt-0.5">{formatCurrency(part.entryPrice)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">🏢 Ganancia Parte Finca (50%):</span>
                        <p className="font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{formatCurrency(part.farmShare)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">👤 Pago Total al Dueño del Animal (Capital + 50%):</span>
                        <p className="font-black text-teal-800 dark:text-teal-300 mt-0.5">{formatCurrency(part.partnerTotalReturn)}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 4. Ficha General */}
        {activeTab === 'general' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 text-xs font-bold shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Ingreso # (Lote)</span>
                <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm">{batchName}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Hierro de Origen</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">{animal.ironBrand || 'Sin marca'}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Propietario / Dueño</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">{animal.owner}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Fecha de Ingreso</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">{formatDate(animal.entryDate)}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Tipo de Entrada</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">{animal.entryType || 'Compra'}</p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Peso Inicial / Compra</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">
                  {animal.entryWeight && parseFloat(animal.entryWeight) > 0 ? `${animal.entryWeight} kg` : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso inicial')}
                </p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Precio Inicial / Compra</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">
                  {animal.entryPrice && parseFloat(animal.entryPrice) > 0 ? formatCurrency(animal.entryPrice) : '$0'}
                </p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-300 block mb-1 font-black">Color / Señas</span>
                <p className="font-black text-slate-950 dark:text-white text-sm">{animal.color || 'No especificadas'}</p>
              </div>
            </div>

            {animal.notes && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 block mb-1 font-black">Notas y Observaciones:</span>
                <p className="text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold italic">
                  "{animal.notes}"
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}
