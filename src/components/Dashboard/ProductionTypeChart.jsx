import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { calculateWeightMetrics } from '../../services/calculations';

export function ProductionTypeChart({ cattle = [], weighings = [] }) {
  const { isDark } = useTheme();
  const [chartMode, setChartMode] = useState('purpose'); // 'purpose' | 'weightRanges'

  const activeCattle = cattle.filter(c => c.status === 'Activo');

  // Modo A: Por Propósito Productivo
  const purposeCounts = activeCattle.reduce((acc, c) => {
    const type = c.productionType || 'Sin clasificar';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const purposeData = Object.keys(purposeCounts).map(key => ({
    name: key,
    value: purposeCounts[key],
  }));

  // Modo B: Por Rangos de Peso Comercial (Levante, Ceba, Listos para Venta)
  const weightRanges = {
    'Destete (< 250 kg)': 0,
    'Levante (250-350 kg)': 0,
    'Media Ceba (350-479 kg)': 0,
    'Listos para Venta (≥ 480 kg)': 0,
  };

  activeCattle.forEach(c => {
    const w = weighings.filter(item => String(item.cattleId) === String(c.id));
    const wm = calculateWeightMetrics(c, w);
    const weight = wm.currentWeight || parseFloat(c.entryWeight) || 0;

    if (weight >= 480) {
      weightRanges['Listos para Venta (≥ 480 kg)']++;
    } else if (weight >= 350) {
      weightRanges['Media Ceba (350-479 kg)']++;
    } else if (weight >= 250) {
      weightRanges['Levante (250-350 kg)']++;
    } else {
      weightRanges['Destete (< 250 kg)']++;
    }
  });

  const weightRangeData = Object.keys(weightRanges)
    .filter(k => weightRanges[k] > 0)
    .map(key => ({
      name: key,
      value: weightRanges[key],
    }));

  const data = chartMode === 'purpose' ? purposeData : (weightRangeData.length > 0 ? weightRangeData : purposeData);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  if (activeCattle.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
        <span>No hay animales activos registrados aún</span>
        <span className="text-[11px] text-slate-500 mt-1">Registra tu primer bovino para ver la distribución</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector de Modo */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {chartMode === 'purpose' ? 'Propósito Productivo' : 'Rangos de Peso / Ceba'}
        </span>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setChartMode('purpose')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${chartMode === 'purpose' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Propósito
          </button>
          <button
            type="button"
            onClick={() => setChartMode('weightRanges')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${chartMode === 'weightRanges' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Kilos Ceba
          </button>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} bovinos (${Math.round((value / activeCattle.length) * 100)}%)`, 'Cantidad']}
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#e2e8f0', 
                borderRadius: '0.75rem', 
                color: isDark ? '#fff' : '#0f172a',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
