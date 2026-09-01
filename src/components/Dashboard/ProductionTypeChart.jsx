import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function ProductionTypeChart({ cattle = [] }) {
  const { isDark } = useTheme();
  const activeCattle = cattle.filter(c => c.status === 'Activo');

  const counts = activeCattle.reduce((acc, c) => {
    const type = c.productionType || 'Sin clasificar';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(counts).map(key => ({
    name: key,
    value: counts[key],
  }));

  const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#64748b'];

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
        <span>No hay animales activos registrados aún</span>
        <span className="text-[11px] text-slate-500 mt-1">Registra tu primer bovino para ver la distribución</span>
      </div>
    );
  }

  return (
    <div className="h-64 sm:h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} bovinos`, 'Cantidad']}
            contentStyle={{ 
              backgroundColor: isDark ? '#0f172a' : '#ffffff', 
              borderColor: isDark ? '#334155' : '#e2e8f0', 
              borderRadius: '0.75rem', 
              color: isDark ? '#fff' : '#0f172a',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
