import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Badge, StatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { 
  formatCurrency, 
  formatNumber, 
  calculateWeightMetrics, 
  calculateFinancials, 
  calculateReproduction
} from '../../services/calculations';
import { 
  Scale, 
  DollarSign, 
  HeartHandshake, 
  Edit3, 
  PlusCircle, 
  Trash2, 
  Info,
  Tag
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function CattleDetailModal({ 
  isOpen, 
  onClose, 
  animal, 
  weighings = [], 
  onOpenEdit, 
  onOpenSell, 
  onOpenAddWeight,
  onDelete 
}) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('weights');

  if (!animal) return null;

  const animalWeighings = weighings.filter(w => w.cattleId === animal.id);
  const weightMetrics = calculateWeightMetrics(animal, animalWeighings);
  const financials = calculateFinancials(animal);
  const repro = calculateReproduction(animal);
  const batchName = animal.entryBatch || animal.paddock || 'Ingreso #1';

  const weightChartData = [
    { date: animal.entryDate, weight: parseFloat(animal.entryWeight), label: 'Entrada' },
    ...weightMetrics.sortedWeights.map(w => ({
      date: w.date,
      weight: parseFloat(w.weight),
      label: w.notes || 'Báscula'
    }))
  ];

  if (animal.status === 'Vendido' && animal.exitWeight) {
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
      subtitle={`Ficha Técnica Completa • Hierro: ${animal.ironBrand || 'N/A'} • ${batchName} • Dueño: ${animal.owner || 'N/A'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 sm:space-y-6">
        
        {/* Encabezado con Datos Clave y Acciones */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <StatusBadge status={animal.status} />
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {batchName}
            </span>
            <ProductionTypeBadge type={animal.productionType} />
            <Badge variant="default">{animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</Badge>
            <Badge variant="default">{animal.breed}</Badge>
            <Badge variant="default">{animal.category}</Badge>
            {animal.isBreedingOnly && <Badge variant="purple">⭐ Solo de Cría</Badge>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenAddWeight(animal)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition min-h-[36px]"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Pesar</span>
            </button>

            {animal.status === 'Activo' && (
              <button
                onClick={() => onOpenSell(animal)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition min-h-[36px]"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Vender</span>
              </button>
            )}

            <button
              onClick={() => onOpenEdit(animal)}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition min-h-[36px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar el registro del animal ${animal.tagNumber}?`)) {
                  onDelete(animal.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Eliminar animal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumen de Métricas Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Peso Actual</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{weightMetrics.currentWeight} kg</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">Inicial: {animal.entryWeight} kg</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Ganancia Total</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">+{weightMetrics.totalGain} kg</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">En {weightMetrics.totalDays} días</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">GDP (kg/día)</span>
            <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{formatNumber(weightMetrics.overallGdp, 3)}</p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">Reciente: {formatNumber(weightMetrics.recentGdp, 3)}</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {financials.isSold ? 'Utilidad Real' : 'Utilidad Proy.'}
            </span>
            <p className={`text-lg sm:text-xl font-bold mt-0.5 ${financials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">ROI: {financials.roi}%</span>
          </div>
        </div>

        {/* Pestañas de Navegación del Detalle */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] ${
              activeTab === 'weights'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Curva de Pesos ({uniqueChartData.length})</span>
          </button>

          {animal.sex === 'Hembra' && (
            <button
              onClick={() => setActiveTab('repro')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] ${
                activeTab === 'repro'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Reproducción & Leche</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] ${
              activeTab === 'finances'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas & Costos</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] ${
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

        {/* 1. Control de Pesos */}
        {activeTab === 'weights' && (
          <div className="space-y-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                <span>Evolución de Peso en Finca</span>
                <button
                  onClick={() => onOpenAddWeight(animal)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Agregar Pesaje
                </button>
              </h4>

              <div className="h-52 sm:h-56 w-full">
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

            {/* Tabla de historial de pesajes */}
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 sm:p-3">Fecha</th>
                    <th className="p-2.5 sm:p-3">Peso (kg)</th>
                    <th className="p-2.5 sm:p-3">Ganancia</th>
                    <th className="p-2.5 sm:p-3">Condición</th>
                    <th className="p-2.5 sm:p-3">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  <tr className="bg-slate-50 dark:bg-slate-900/40 font-medium">
                    <td className="p-2.5 sm:p-3">{animal.entryDate}</td>
                    <td className="p-2.5 sm:p-3 font-bold text-slate-900 dark:text-white">{animal.entryWeight} kg</td>
                    <td className="p-2.5 sm:p-3 text-slate-400">- (Ingreso)</td>
                    <td className="p-2.5 sm:p-3">3.0</td>
                    <td className="p-2.5 sm:p-3 text-slate-500 dark:text-slate-400">Pesaje inicial de ingreso</td>
                  </tr>
                  {weightMetrics.sortedWeights.map((w, idx) => {
                    const prevWeight = idx === 0 ? parseFloat(animal.entryWeight) : parseFloat(weightMetrics.sortedWeights[idx - 1].weight);
                    const gain = parseFloat(w.weight) - prevWeight;
                    return (
                      <tr key={w.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="p-2.5 sm:p-3">{w.date}</td>
                        <td className="p-2.5 sm:p-3 text-emerald-600 dark:text-emerald-400 font-bold">{w.weight} kg</td>
                        <td className="p-2.5 sm:p-3">
                          <span className={gain >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400'}>
                            {gain >= 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)} kg
                          </span>
                        </td>
                        <td className="p-2.5 sm:p-3">{w.conditionScore || 'N/A'}</td>
                        <td className="p-2.5 sm:p-3 text-slate-500 dark:text-slate-400">{w.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Reproducción & Leche */}
        {activeTab === 'repro' && animal.sex === 'Hembra' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4" />
                  <span>Estado Reproductivo</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-purple-200 dark:border-purple-500/20 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Condición:</span>
                    <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
                  </div>
                  {animal.reproductiveStatus === 'Preñada' && (
                    <>
                      <div className="flex justify-between border-b border-purple-200 dark:border-purple-500/20 pb-2">
                        <span className="text-slate-500 dark:text-slate-400">Fecha Servicio:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{animal.serviceDate || 'Sin registrar'}</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-200 dark:border-purple-500/20 pb-2">
                        <span className="text-slate-500 dark:text-slate-400">Días Gestación:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">{repro.daysPregnant} días</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-purple-200 dark:border-purple-500/20">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Parto Estimado:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{repro.expectedCalvingDate}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 text-xs">
                        {repro.statusLabel}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <MilkingBadge status={animal.milkingStatus} />
                  <span>Control de Lechería & Destino</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-blue-200 dark:border-blue-500/20 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Estado Ordeño:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{animal.milkingStatus || 'No aplica'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-200 dark:border-blue-500/20 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Producción Diaria:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{animal.dailyMilkLiters || 0} Litros / Día</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-200 dark:border-blue-500/20 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">¿Solo de Cría?:</span>
                    <span className={`font-bold ${animal.isBreedingOnly ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {animal.isBreedingOnly ? 'Sí (Vientre Reemplazo)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Finanzas & Costos */}
        {activeTab === 'finances' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Costo Entrada / Compra</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(animal.entryPrice)}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {formatCurrency(financials.pricePerKgEntry)} / kg inicial
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Gastos Directos</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(financials.expenses)}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Sanidad, sales, fletes</span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Inversión Total</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(financials.totalInvested)}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Costo acumulado</span>
              </div>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border ${financials.isSold ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/40' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'} space-y-3`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{financials.isSold ? 'Liquidación Definitiva de Venta' : 'Estimación de Utilidad Proyectada'}</span>
                </h4>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  ROI: {financials.roi}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">{financials.isSold ? 'Valor Venta:' : 'Valor Estimado:'}</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {financials.isSold ? formatCurrency(animal.exitPrice) : formatCurrency((animal.currentWeight || animal.entryWeight) * 8500)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Utilidad Neta:</span>
                  <p className={`text-base font-extrabold mt-0.5 ${financials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(financials.netProfit)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Precio/kg en Pie:</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {financials.isSold ? formatCurrency(financials.pricePerKgSold) : '$ 8,500'} / kg
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Comprador / Destino:</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {animal.buyer || 'En finca'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Ficha General */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">Identificación y Origen</h5>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Ingreso #:</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{batchName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Dueño:</span><span className="text-slate-900 dark:text-white font-semibold">{animal.owner}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Hierro:</span><span className="text-slate-900 dark:text-white font-semibold">{animal.ironBrand || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Pelaje / Color:</span><span className="text-slate-900 dark:text-white font-semibold">{animal.color || 'No especificado'}</span></div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">Trazabilidad de Ingreso</h5>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Fecha Ingreso:</span><span className="text-slate-900 dark:text-white font-semibold">{animal.entryDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Tipo de Ingreso:</span><span className="text-slate-900 dark:text-white font-semibold">{animal.entryType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Días en Finca:</span><span className="text-slate-900 dark:text-white font-semibold">{weightMetrics.totalDays} días</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Observaciones:</span><span className="text-slate-600 dark:text-slate-300 italic">{animal.notes || 'Ninguna'}</span></div>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
