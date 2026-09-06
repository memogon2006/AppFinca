import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { calculateWeightMetrics, formatNumber } from '../../services/calculations';

export function WeightPerformanceChart({ cattle = [], weighings = [] }) {
  const { isDark } = useTheme();
  const [metricMode, setMetricMode] = useState('gain'); // 'gain' | 'current'

  const activeCattle = cattle.filter(c => c.status === 'Activo');
  
  const performanceData = activeCattle.map(animal => {
    const animalWeighs = weighings.filter(w => w.cattleId === animal.id);
    const wm = calculateWeightMetrics(animal, animalWeighs);
    return {
      name: animal.tagNumber,
      fullName: `${animal.tagNumber} ${animal.name ? `(${animal.name})` : ''}`,
      ganancia: wm.totalGain,
      actual: wm.currentWeight,
      inicial: wm.entryWeight,
      gdp: wm.overallGdp,
      days: wm.totalDays,
    };
  }).sort((a, b) => (metricMode === 'gain' ? b.ganancia - a.ganancia : b.actual - a.actual)).slice(0, 7);

  if (performanceData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
        <span>No hay datos de pesaje suficientes aún</span>
        <span className="text-[11px] text-slate-500 mt-1">Conforme registres pesajes en la báscula se generará la gráfica</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector de Métrica */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {metricMode === 'gain' ? 'Top Ganancia de Peso (+kg)' : 'Bovinos con Mayor Peso Actual (kg)'}
        </span>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMetricMode('gain')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${metricMode === 'gain' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Aumento (+kg)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('current')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${metricMode === 'current' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Peso Actual
          </button>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
            <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit="kg" />
            <Tooltip 
              formatter={(value, name, item) => [
                `${value} kg`, 
                metricMode === 'gain' 
                  ? `Ganancia (${item.payload.days} días • GDP: ${formatNumber(item.payload.gdp, 3)} kg/d)` 
                  : `Peso Actual ${item.payload.actual >= 480 ? '🎯 (Listo ≥ 480 kg)' : `(Faltan ${(480 - item.payload.actual).toFixed(1)} kg)`}`
              ]}
              labelFormatter={(label, item) => item && item[0] ? item[0].payload.fullName : label}
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#e2e8f0', 
                borderRadius: '0.75rem', 
                color: isDark ? '#fff' : '#0f172a',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey={metricMode === 'gain' ? 'ganancia' : 'actual'} 
              fill="#10b981" 
              radius={[6, 6, 0, 0]}
            >
              {performanceData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    metricMode === 'gain'
                      ? (entry.gdp >= 0.75 ? '#10b981' : entry.gdp >= 0.37 ? '#0284c7' : '#f59e0b')
                      : (entry.actual >= 480 ? '#10b981' : index === 0 ? '#3b82f6' : '#60a5fa')
                  } 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
