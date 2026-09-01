import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function WeightPerformanceChart({ cattle = [], weighings = [] }) {
  const { isDark } = useTheme();
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  
  const performanceData = activeCattle.map(animal => {
    const entryWeight = parseFloat(animal.entryWeight) || 0;
    const currentWeight = parseFloat(animal.currentWeight || entryWeight);
    const gain = Math.max(0, currentWeight - entryWeight);
    return {
      name: `${animal.tagNumber} ${animal.name ? `(${animal.name})` : ''}`,
      ganancia: Math.round(gain),
      actual: Math.round(currentWeight),
      inicial: Math.round(entryWeight),
    };
  }).sort((a, b) => b.ganancia - a.ganancia).slice(0, 6);

  if (performanceData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
        <span>No hay datos de pesaje suficientes aún</span>
        <span className="text-[11px] text-slate-500 mt-1">Conforme registres pesajes en la báscula se generará la gráfica</span>
      </div>
    );
  }

  return (
    <div className="h-64 sm:h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
          <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
          <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit="kg" />
          <Tooltip 
            formatter={(value, name) => [
              `${value} kg`, 
              name === 'ganancia' ? 'Ganancia Acumulada' : name === 'actual' ? 'Peso Actual' : 'Peso Inicial'
            ]}
            contentStyle={{ 
              backgroundColor: isDark ? '#0f172a' : '#ffffff', 
              borderColor: isDark ? '#334155' : '#e2e8f0', 
              borderRadius: '0.75rem', 
              color: isDark ? '#fff' : '#0f172a',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="ganancia" fill="#10b981" radius={[6, 6, 0, 0]}>
            {performanceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
