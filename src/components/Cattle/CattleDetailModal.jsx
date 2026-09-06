import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Badge, StatusBadge, FemaleStatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { 
  formatCurrency, 
  formatNumber, 
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
  Skull
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
    weightChartData.push({ date: animal.entryDate, weight: parseFloat(animal.entryWeight), label: 'Entrada' });
  }
  weightMetrics.sortedWeights.forEach(w => {
    weightChartData.push({
      date: w.date,
      weight: parseFloat(w.weight),
      label: w.notes || 'Báscula'
    });
  });

  if (animal.status === 'Vendido' && animal.exitWeight && parseFloat(animal.exitWeight) > 0) {
    weightChartData.push({
      date: animal.exitDate,
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
      subtitle={`Ficha Técnica Completa • Hierro: ${animal.ironBrand || 'N/A'} • ${batchName} • Propietario: ${animal.owner || 'N/A'}`}
      maxWidth="max-w-7xl 2xl:max-w-[1600px] w-full"
    >
      <div className="space-y-6 sm:space-y-8">
        
        {/* Banner de Animal Fallecido si status === 'Muerto' */}
        {animal.status === 'Muerto' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-rose-900 dark:text-rose-200 shadow-sm">
            <div className="flex items-start gap-3">
              <Skull className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-base text-rose-700 dark:text-rose-300">
                  Animal Dado de Baja por Muerte
                </p>
                <p className="text-xs sm:text-sm mt-0.5 text-rose-800 dark:text-rose-300">
                  <strong>Fecha:</strong> {animal.deathDate || 'No registrada'} • <strong>Causa:</strong> {animal.deathReason || 'No especificada'}
                </p>
                {animal.deathNotes && (
                  <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 italic">
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
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition whitespace-nowrap self-end sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar a Activo</span>
              </button>
            )}
          </div>
        )}

        {/* Encabezado y Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={animal.status} />
            <ProductionTypeBadge type={animal.productionType} />
            <Badge variant="default">{animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</Badge>
            {animal.sex === 'Hembra' && (
              <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
            )}
            <Badge variant="default">{animal.breed}</Badge>
            <Badge variant="default">{animal.category}</Badge>
            {animal.sex === 'Hembra' && animal.isBreedingOnly && <Badge variant="purple">⭐ Solo de Cría</Badge>}
            
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/30 text-xs sm:text-sm shadow-sm">
              <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {batchName}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {animal.status === 'Activo' && (
              <>
                <button
                  onClick={() => onOpenAddWeight(animal)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md min-h-[42px] cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>+ Registrar Pesaje</span>
                </button>

                <button
                  onClick={() => onOpenSell(animal)}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md min-h-[42px] cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Vender</span>
                </button>

                <button
                  onClick={() => onOpenDeath(animal)}
                  className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/60 dark:hover:bg-rose-600 transition text-xs sm:text-sm font-bold flex items-center gap-2 border border-rose-200 dark:border-rose-900/60 min-h-[42px] cursor-pointer"
                  title="Dar de baja por muerte"
                >
                  <Skull className="w-4 h-4" />
                  <span>Muerto</span>
                </button>
              </>
            )}

            <button
              onClick={() => onOpenEdit(animal)}
              className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition min-h-[42px] cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar permanentemente al animal ${animal.tagNumber}?`)) {
                  onDelete(animal.id);
                  onClose();
                }
              }}
              className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer shadow-sm"
              title="Eliminar animal permanentemente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumen de Métricas Clave (5 Bloques Amplios y Claros) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Compra / Inicial</span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {animal.entryWeight && parseFloat(animal.entryWeight) > 0 ? `${animal.entryWeight} kg` : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso')}
            </p>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold block truncate mt-1">
              {animal.entryPrice && parseFloat(animal.entryPrice) > 0 ? formatCurrency(animal.entryPrice) : '$0'}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Días en Finca</span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">{weightMetrics.totalDays} días</p>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Ingreso: {animal.entryDate}</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Peso Actual</span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {weightMetrics.hasWeight ? `${weightMetrics.currentWeight} kg` : (animal.sex === 'Hembra' ? 'Vientre' : 'Sin pesaje')}
            </p>
            <div className="mt-1 space-y-0.5">
              <span className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-bold block truncate">
                {weightMetrics.hasEntryWeight ? `+${weightMetrics.totalGain} kg ganados` : (animal.sex === 'Hembra' ? `Estado: ${femaleStatus}` : 'Sin peso inicial')}
              </span>
              {weightMetrics.lastWeighDate && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Pesaje: {weightMetrics.lastWeighDate}</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
              {weightMetrics.hasEntryWeight ? 'GDP Continuo' : 'Producción'}
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {weightMetrics.hasEntryWeight ? (
                <>{formatNumber(weightMetrics.overallGdp, 3)} <span className="text-xs sm:text-sm font-semibold">kg/d</span></>
              ) : animal.sex === 'Hembra' && parseFloat(animal.dailyMilkLiters) > 0 ? (
                <>{animal.dailyMilkLiters} <span className="text-xs sm:text-sm font-semibold">L/d</span></>
              ) : (
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Cría / Reproducción</span>
              )}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {weightMetrics.hasEntryWeight ? (weightMetrics.daysToLastWeigh > 0 ? `En ${weightMetrics.daysToLastWeigh} días desde entrada` : 'Desde la entrada') : (animal.sex === 'Hembra' ? 'Matriz productiva' : 'Sin pesajes')}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {financials.isSold ? 'Utilidad Real' : animal.status === 'Muerto' ? 'Pérdida Inversión' : 'Utilidad Proy.'}
            </span>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-black mt-1 ${financials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>ROI: <strong>{financials.roi}%</strong></span>
              {financials.pricePerKgUsed > 0 && (
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(financials.pricePerKgUsed)}/kg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación Amplias */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[44px] cursor-pointer ${
              activeTab === 'weights'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Pesajes Continuos ({uniqueChartData.length})</span>
          </button>

          {/* PESTAÑA EXCLUSIVA PARA HEMBRAS */}
          {animal.sex === 'Hembra' && (
            <button
              onClick={() => setActiveTab('repro')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[44px] cursor-pointer ${
                activeTab === 'repro'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Baby className="w-4 h-4" />
              <span>Reproducción, Cría & Lechería</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[44px] cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas y Costos</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition min-h-[44px] cursor-pointer ${
              activeTab === 'general'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Ficha General</span>
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}

        {/* 1. Control de Pesos Continuos */}
        {activeTab === 'weights' && (
          <div className="space-y-6">
            {uniqueChartData.length > 0 ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Curva Continua de Ganancia de Peso</span>
                  </h4>
                  <button
                    onClick={() => onOpenAddWeight(animal)}
                    className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Agregar Pesaje
                  </button>
                </div>

                <div className="h-64 sm:h-80 lg:h-96 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uniqueChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.7} />
                      <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} unit="kg" domain={['dataMin - 15', 'dataMax + 15']} />
                      <Tooltip
                        formatter={(val) => [`${val} kg`, 'Peso en Báscula']}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '1rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#10b981"
                        strokeWidth={3.5}
                        dot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2.5 }}
                        activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-2.5">
                <Scale className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {animal.sex === 'Hembra' ? 'Hembra de Vientre / Lechería registrada sin peso inicial' : 'Sin pesajes registrados'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Puedes registrar pesajes periódicos de control con el botón superior "+ Registrar Pesaje".
                </p>
              </div>
            )}

            {/* TABLA CONTINUA DE PESAJES DESDE LA ENTRADA */}
            {weightMetrics.continuousLogs.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Historial Continuo: Desde Pesaje 1 hasta Pesaje Actual
                </h5>

                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs">
                        <tr>
                          <th className="p-3.5 sm:p-4">Pesaje</th>
                          <th className="p-3.5 sm:p-4">Fecha</th>
                          <th className="p-3.5 sm:p-4">Días Totales Desde Entrada</th>
                          <th className="p-3.5 sm:p-4">Peso en Báscula</th>
                          <th className="p-3.5 sm:p-4">Aumento Total Continuo</th>
                          <th className="p-3.5 sm:p-4">GDP Continuo (kg/d)</th>
                          <th className="p-3.5 sm:p-4">Notas</th>
                          <th className="p-3.5 sm:p-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                        {weightMetrics.continuousLogs.map((log) => {
                          const canDelete = log.id !== 'entry' && log.id !== 'exit' && onDeleteWeight;
                          return (
                            <tr key={log.id || `${log.date}_${log.weight}`} className={log.index === 1 ? 'bg-slate-50/60 dark:bg-slate-900/40 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition'}>
                              <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">{log.name}</td>
                              <td className="p-3.5 sm:p-4 font-medium">{log.date}</td>
                              <td className="p-3.5 sm:p-4 font-extrabold text-blue-600 dark:text-blue-400">{log.daysFromEntry} días</td>
                              <td className="p-3.5 sm:p-4 font-black text-slate-900 dark:text-white text-sm sm:text-base">{log.weight} kg</td>
                              <td className="p-3.5 sm:p-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                                {log.index === 1 ? '0.0 kg (Inicial)' : `+${log.totalGain} kg`}
                              </td>
                              <td className="p-3.5 sm:p-4 font-extrabold text-purple-600 dark:text-purple-400">
                                {log.index === 1 ? '-' : `${formatNumber(log.gdp, 3)} kg/d`}
                              </td>
                              <td className="p-3.5 sm:p-4 text-slate-500 dark:text-slate-400 italic">{log.notes || '-'}</td>
                              <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`¿Deseas eliminar este registro de pesaje (${log.weight} kg del ${log.date}) del bovino ${animal.tagNumber}?`)) {
                                        onDeleteWeight(log.weighingId || log.id, animal.id, log.date, log.weight);
                                      }
                                    }}
                                    className="p-2 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600/80 transition cursor-pointer shadow-sm"
                                    title="Eliminar este pesaje"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : log.id === 'entry' ? (
                                  <span className="text-xs text-slate-400 font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Inicial</span>
                                ) : (
                                  <span className="text-xs text-slate-400 font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Salida</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Reproducción, Cría & Lechería */}
        {activeTab === 'repro' && animal.sex === 'Hembra' && (
          <div className="space-y-6">
            
            {/* Estado General de la Hembra */}
            <div className="p-5 sm:p-6 rounded-3xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs sm:text-sm font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Estado Productivo Actual:</span>
                <p className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100 mt-1">
                  {femaleStatus}
                </p>
              </div>
              <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Cuadrante 1: Control de Gestación / Partos */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <Baby className="w-5 h-5" />
                  <span>Control Reproductivo & Gestación</span>
                </h4>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-500 dark:text-slate-400">Condición:</span>
                    <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
                  </div>
                  
                  {repro.isPregnant ? (
                    <>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                        <span className="text-slate-500 dark:text-slate-400">Fecha de Servicio:</span>
                        <span className="font-black text-slate-900 dark:text-white">{animal.serviceDate || 'Sin registrar'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                        <span className="text-slate-500 dark:text-slate-400">Días de Gestación:</span>
                        <span className="font-black text-purple-700 dark:text-purple-300">{repro.daysPregnant} días</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">Parto Estimado (+283d):</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{repro.expectedCalvingDate}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 text-xs sm:text-sm font-semibold">
                        {repro.statusLabel}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                      {femaleStatus === 'Levante de cría' ? 'Hembra amamantando ternero al pie.' : 'Hembra vacía / abierta lista para monta o inseminación.'}
                    </div>
                  )}

                  <div className="flex justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">¿Solo de Cría?:</span>
                    <span className={`font-black ${animal.isBreedingOnly ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {animal.isBreedingOnly ? 'Sí (Vientre Reemplazo)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuadrante 2: Métricas Lecheras y Ciclo Productivo */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Milk className="w-5 h-5" />
                  <span>Producción de Leche & Ciclo Productivo</span>
                </h4>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-500 dark:text-slate-400">Estado de Ordeño:</span>
                    <MilkingBadge status={animal.milkingStatus} liters={animal.dailyMilkLiters} />
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-500 dark:text-slate-400">Litros por Día:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-base sm:text-lg">
                      {milkMetrics.dailyLiters > 0 ? `${milkMetrics.dailyLiters} L / día` : '0 L (Seca)'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-500 dark:text-slate-400">Litros Totales por Ciclo:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {milkMetrics.cycleTotalLiters > 0 ? `${formatNumber(milkMetrics.cycleTotalLiters, 0)} L / ciclo` : 'No registrado'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-500 dark:text-slate-400">Promedio Litros / Ciclo:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {milkMetrics.cycleAvgDaily > 0 ? `${milkMetrics.cycleAvgDaily} L / día` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Días Lactancia Estándar:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{milkMetrics.cycleDays} días</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. Finanzas & Costos */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-sm">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Costo de Entrada / Compra</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(financials.entryPrice)}</p>
                {financials.pricePerKgEntry > 0 && (
                  <span className="text-xs text-slate-400 font-semibold">{formatCurrency(financials.pricePerKgEntry)} / kg inicial</span>
                )}
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-sm">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gastos Directos Acumulados</span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(financials.expenses)}</p>
                <span className="text-xs text-slate-400 font-semibold">Fletes, vacunas, manejo</span>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-sm">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Inversión Total Acumulada</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(financials.totalInvested)}</p>
                <span className="text-xs text-slate-400 font-semibold">Costo base + Insumos</span>
              </div>
            </div>

            {/* Liquidación de venta si ya está vendido */}
            {financials.isSold && (
              <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 shadow-sm ${
                (animal.exitType === 'En Compañía' || animal.partnershipDetails)
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-3">
                  <h5 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Detalle de Liquidación de Venta
                  </h5>
                  {(animal.exitType === 'En Compañía' || animal.partnershipDetails) ? (
                    <span className="px-3 py-1 rounded-full bg-teal-200/80 dark:bg-teal-900 text-teal-900 dark:text-teal-200 font-extrabold text-xs border border-teal-400 dark:border-teal-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300" /> 🤝 En Compañía (50/50)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-extrabold text-xs border border-blue-300 dark:border-blue-700 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> 💰 Venta Directa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Precio Total Venta:</span>
                    <p className="font-black text-emerald-700 dark:text-emerald-300 text-base sm:text-lg">{formatCurrency(financials.exitPrice)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Peso Salida:</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 text-base sm:text-lg">{animal.exitWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Precio / kg Vendido:</span>
                    <p className="font-black text-slate-800 dark:text-slate-200 text-base sm:text-lg">{formatCurrency(financials.pricePerKgSold)} / kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Comprador / Fecha:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{animal.saleBuyer || animal.buyer || 'N/A'} • {animal.exitDate || ''}</p>
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
                    <div className="mt-4 pt-3.5 border-t border-teal-200/80 dark:border-teal-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Devolución Costo Compra (Dueño):</span>
                        <p className="font-black text-slate-900 dark:text-white mt-1 text-base sm:text-lg">{formatCurrency(part.entryPrice)}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">🏢 Ganancia Parte Finca (50%):</span>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 mt-1 text-base sm:text-lg">{formatCurrency(part.farmShare)}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">👤 Pago Total al Dueño del Animal (Capital + 50%):</span>
                        <p className="font-black text-teal-700 dark:text-teal-300 mt-1 text-base sm:text-lg">{formatCurrency(part.partnerTotalReturn)}</p>
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
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-6 text-xs sm:text-sm shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Ingreso # (Lote)</span>
                <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">{batchName}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Hierro de Origen</span>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">{animal.ironBrand || 'Sin marca'}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Propietario / Dueño</span>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">{animal.owner}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Fecha de Ingreso</span>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">{animal.entryDate}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Tipo de Entrada</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{animal.entryType || 'Compra'}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Peso Inicial / Compra</span>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  {animal.entryWeight && parseFloat(animal.entryWeight) > 0 ? `${animal.entryWeight} kg` : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso inicial')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Precio Inicial / Compra</span>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  {animal.entryPrice && parseFloat(animal.entryPrice) > 0 ? formatCurrency(animal.entryPrice) : '$0'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Color / Señas</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{animal.color || 'No especificadas'}</p>
              </div>
            </div>

            {animal.notes && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1.5 font-bold">Notas y Observaciones:</span>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 italic">
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
