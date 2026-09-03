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
      subtitle={`Ficha Técnica • Hierro: ${animal.ironBrand || 'N/A'} • ${batchName} • Dueño: ${animal.owner || 'N/A'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 sm:space-y-6">
        
        {/* Banner de Animal Fallecido si status === 'Muerto' */}
        {animal.status === 'Muerto' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-start gap-2.5">
              <Skull className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-rose-700 dark:text-rose-300">
                  Animal Dado de Baja por Muerte
                </p>
                <p className="text-xs mt-0.5">
                  <strong>Fecha:</strong> {animal.deathDate || 'No registrada'} • <strong>Causa:</strong> {animal.deathReason || 'No especificada'}
                </p>
                {animal.deathNotes && (
                  <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300 italic">
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
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition whitespace-nowrap self-end sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar a Activo</span>
              </button>
            )}
          </div>
        )}

        {/* Encabezado y Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={animal.status} />
            <ProductionTypeBadge type={animal.productionType} />
            <Badge variant="default">{animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</Badge>
            {animal.sex === 'Hembra' && (
              <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
            )}
            <Badge variant="default">{animal.breed}</Badge>
            <Badge variant="default">{animal.category}</Badge>
            {animal.sex === 'Hembra' && animal.isBreedingOnly && <Badge variant="purple">⭐ Solo de Cría</Badge>}
            
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 text-xs">
              <Tag className="w-3.5 h-3.5" /> {batchName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {animal.status === 'Activo' && (
              <>
                <button
                  onClick={() => onOpenAddWeight(animal)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm min-h-[36px] cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>+ Pesaje</span>
                </button>

                <button
                  onClick={() => onOpenSell(animal)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm min-h-[36px] cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Vender</span>
                </button>

                <button
                  onClick={() => onOpenDeath(animal)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/60 dark:hover:bg-rose-600 transition text-xs font-semibold flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/60 min-h-[36px] cursor-pointer"
                  title="Dar de baja por muerte"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Muerto</span>
                </button>
              </>
            )}

            <button
              onClick={() => onOpenEdit(animal)}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition min-h-[36px] cursor-pointer"
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
              className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Eliminar animal permanentemente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumen de Métricas Clave (5 Bloques) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Compra / Inicial</span>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {animal.entryWeight && parseFloat(animal.entryWeight) > 0 ? `${animal.entryWeight} kg` : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-bold block truncate">
              {animal.entryPrice && parseFloat(animal.entryPrice) > 0 ? formatCurrency(animal.entryPrice) : '$0'}
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Días en Finca</span>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{weightMetrics.totalDays} días</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">Ingreso: {animal.entryDate}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Peso Actual</span>
            <p className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {weightMetrics.hasWeight ? `${weightMetrics.currentWeight} kg` : (animal.sex === 'Hembra' ? 'Vientre' : 'Sin pesaje')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block truncate">
              {weightMetrics.hasEntryWeight ? `+${weightMetrics.totalGain} kg ganados` : (animal.sex === 'Hembra' ? `Estado: ${femaleStatus}` : 'Sin peso inicial')}
            </span>
            {weightMetrics.lastWeighDate && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                <span>Fecha: {weightMetrics.lastWeighDate}</span>
              </span>
            )}
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {weightMetrics.hasEntryWeight ? 'GDP Continuo' : 'Producción'}
            </span>
            <p className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {weightMetrics.hasEntryWeight ? (
                <>{formatNumber(weightMetrics.overallGdp, 3)} <span className="text-xs">kg/d</span></>
              ) : animal.sex === 'Hembra' && parseFloat(animal.dailyMilkLiters) > 0 ? (
                <>{animal.dailyMilkLiters} <span className="text-xs">L/d</span></>
              ) : (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Cría / Reproducción</span>
              )}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
              {weightMetrics.hasEntryWeight ? 'Desde la entrada' : (animal.sex === 'Hembra' ? 'Matriz productiva' : 'Sin pesajes')}
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {financials.isSold ? 'Utilidad Real' : animal.status === 'Muerto' ? 'Pérdida Inversión' : 'Utilidad Proy.'}
            </span>
            <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${financials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
              ROI: {financials.roi}%
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] cursor-pointer ${
              activeTab === 'weights'
                ? 'bg-emerald-600 text-white shadow'
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
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] cursor-pointer ${
                activeTab === 'repro'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Baby className="w-4 h-4" />
              <span>Reproducción, Cría & Lechería</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas y Costos</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] cursor-pointer ${
              activeTab === 'general'
                ? 'bg-slate-700 text-white shadow'
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
          <div className="space-y-4">
            {uniqueChartData.length > 0 ? (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>Curva Continua de Ganancia de Peso</span>
                  <button
                    onClick={() => onOpenAddWeight(animal)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Pesaje
                  </button>
                </h4>

                <div className="h-48 sm:h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uniqueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                      <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit="kg" />
                      <Tooltip
                        formatter={(val) => [`${val} kg`, 'Peso en Báscula']}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '0.75rem', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <Scale className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {animal.sex === 'Hembra' ? 'Hembra de Vientre / Lechería registrada sin peso inicial' : 'Sin pesajes registrados'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Puedes registrar pesajes periódicos de control con el botón superior "+ Pesaje".
                </p>
              </div>
            )}

            {/* TABLA CONTINUA DE PESAJES DESDE LA ENTRADA */}
            {weightMetrics.continuousLogs.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Historial Continuo: Desde Pesaje 1 hasta Pesaje Actual
                </h5>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[10px]">
                      <tr>
                        <th className="p-2.5 sm:p-3">Pesaje</th>
                        <th className="p-2.5 sm:p-3">Fecha</th>
                        <th className="p-2.5 sm:p-3">Días Totales Desde Entrada</th>
                        <th className="p-2.5 sm:p-3">Peso en Báscula</th>
                        <th className="p-2.5 sm:p-3">Aumento Total Continuo</th>
                        <th className="p-2.5 sm:p-3">GDP Continuo (kg/d)</th>
                        <th className="p-2.5 sm:p-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {weightMetrics.continuousLogs.map((log) => (
                        <tr key={log.id} className={log.index === 1 ? 'bg-slate-50/60 dark:bg-slate-900/40 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition'}>
                          <td className="p-2.5 sm:p-3 font-bold text-slate-900 dark:text-white">{log.name}</td>
                          <td className="p-2.5 sm:p-3 font-medium">{log.date}</td>
                          <td className="p-2.5 sm:p-3 font-extrabold text-blue-600 dark:text-blue-400">{log.daysFromEntry} días</td>
                          <td className="p-2.5 sm:p-3 font-bold text-slate-900 dark:text-white">{log.weight} kg</td>
                          <td className="p-2.5 sm:p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            {log.index === 1 ? '0.0 kg (Inicial)' : `+${log.totalGain} kg`}
                          </td>
                          <td className="p-2.5 sm:p-3 font-extrabold text-purple-600 dark:text-purple-400">
                            {log.index === 1 ? '-' : `${formatNumber(log.gdp, 3)} kg/d`}
                          </td>
                          <td className="p-2.5 sm:p-3 text-slate-500 dark:text-slate-400 italic">{log.notes || '-'}</td>
                        </tr>
                      ))}
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
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase">Estado Productivo Actual:</span>
                <p className="text-lg font-extrabold text-purple-950 dark:text-purple-100 mt-0.5">
                  {femaleStatus}
                </p>
              </div>
              <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Cuadrante 1: Control de Gestación / Partos */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <Baby className="w-4 h-4" />
                  <span>Control Reproductivo & Gestación</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Condición:</span>
                    <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
                  </div>
                  
                  {repro.isPregnant ? (
                    <>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="text-slate-500 dark:text-slate-400">Fecha Servicio:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{animal.serviceDate || 'Sin registrar'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="text-slate-500 dark:text-slate-400">Días Gestación:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">{repro.daysPregnant} días</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Parto Estimado (+283d):</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{repro.expectedCalvingDate}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 text-xs font-medium">
                        {repro.statusLabel}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs">
                      {femaleStatus === 'Levante de cría' ? 'Hembra amamantando ternero al pie.' : 'Hembra vacía / abierta lista para monta o inseminación.'}
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">¿Solo de Cría?:</span>
                    <span className={`font-bold ${animal.isBreedingOnly ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {animal.isBreedingOnly ? 'Sí (Vientre Reemplazo)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuadrante 2: Métricas Lecheras y Ciclo Productivo */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Milk className="w-4 h-4" />
                  <span>Producción de Leche & Ciclo Productivo</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Estado de Ordeño:</span>
                    <MilkingBadge status={animal.milkingStatus} liters={animal.dailyMilkLiters} />
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Litros por Día:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      {milkMetrics.dailyLiters > 0 ? `${milkMetrics.dailyLiters} L / día` : '0 L (Seca)'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Litros Totales por Ciclo:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {milkMetrics.cycleTotalLiters > 0 ? `${formatNumber(milkMetrics.cycleTotalLiters, 0)} L / ciclo` : 'No registrado'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Promedio Litros / Ciclo:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {milkMetrics.cycleAvgDaily > 0 ? `${milkMetrics.cycleAvgDaily} L / día` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Días Lactancia Estándar:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{milkMetrics.cycleDays} días</span>
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
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Costo de Entrada / Compra</span>
                <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(financials.entryPrice)}</p>
                {financials.pricePerKgEntry > 0 && (
                  <span className="text-[11px] text-slate-400">{formatCurrency(financials.pricePerKgEntry)} / kg inicial</span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Gastos Directos Acumulados</span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(financials.expenses)}</p>
                <span className="text-[11px] text-slate-400">Fletes, vacunas, manejo</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Inversión Total Acumulada</span>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(financials.totalInvested)}</p>
                <span className="text-[11px] text-slate-400">Costo base + Insumos</span>
              </div>
            </div>

            {/* Liquidación de venta si ya está vendido */}
            {financials.isSold && (
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                (animal.exitType === 'En Compañía' || animal.partnershipDetails)
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Detalle de Liquidación de Venta
                  </h5>
                  {(animal.exitType === 'En Compañía' || animal.partnershipDetails) ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-200/80 dark:bg-teal-900 text-teal-900 dark:text-teal-200 font-extrabold text-[11px] border border-teal-400 dark:border-teal-600 flex items-center gap-1">
                      <Users className="w-3 h-3 text-teal-700 dark:text-teal-300" /> 🤝 En Compañía (50/50)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-bold text-[11px] border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400" /> 💰 Venta Directa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Precio Total Venta:</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{formatCurrency(financials.exitPrice)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Peso Salida:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{animal.exitWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Precio / kg Vendido:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(financials.pricePerKgSold)} / kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Comprador / Fecha:</span>
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
                    <div className="mt-3 pt-2.5 border-t border-teal-200/80 dark:border-teal-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Devolución Costo Compra (Dueño):</span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(part.entryPrice)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">🏢 Ganancia Parte Finca (50%):</span>
                        <p className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(part.farmShare)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">👤 Pago Total al Dueño del Animal (Capital + 50%):</span>
                        <p className="font-black text-teal-700 dark:text-teal-300 mt-0.5">{formatCurrency(part.partnerTotalReturn)}</p>
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 block mb-0.5">Ingreso # (Lote)</span>
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{batchName}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Hierro de Origen</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{animal.ironBrand || 'Sin marca'}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Propietario / Dueño</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{animal.owner}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Fecha de Ingreso</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{animal.entryDate}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tipo de Entrada</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{animal.entryType || 'Compra'}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Peso Inicial / Compra</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {animal.entryWeight && parseFloat(animal.entryWeight) > 0 ? `${animal.entryWeight} kg` : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso inicial')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Precio Inicial / Compra</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {animal.entryPrice && parseFloat(animal.entryPrice) > 0 ? formatCurrency(animal.entryPrice) : '$0'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Color / Señas</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{animal.color || 'No especificadas'}</p>
              </div>
            </div>

            {animal.notes && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1 font-semibold">Notas y Observaciones:</span>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 italic">
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
