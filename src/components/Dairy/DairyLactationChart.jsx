import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export function DairyLactationChart({ dataPoints = [], cowName = '', tagNumber = '' }) {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center p-4">
        <span className="text-3xl mb-2">🥛</span>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Sin pesajes suficientes para generar la curva
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Registra al menos dos pesajes de leche (AM/PM) para visualizar la trayectoria y el pico de lactancia de la vaca.
        </p>
      </div>
    );
  }

  // Preparar datos ordenados cronológicamente
  const formattedData = dataPoints.map(dp => ({
    name: dp.date || dp.rawDate,
    am: dp.am || 0,
    pm: dp.pm || 0,
    total: dp.total || (dp.am + dp.pm),
    del: dp.del || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-emerald-500/40 p-3 rounded-2xl shadow-xl backdrop-blur-md text-white text-xs space-y-1.5 min-w-[170px]">
          <div className="font-bold text-emerald-400 border-b border-white/10 pb-1 flex justify-between items-center">
            <span>{label}</span>
            {data.del > 0 && <span className="text-[10px] text-slate-400">DEL: {data.del} d</span>}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">🌅 Ordeño AM:</span>
            <span className="font-extrabold text-amber-300">{data.am} L</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">🌇 Ordeño PM:</span>
            <span className="font-extrabold text-blue-300">{data.pm} L</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/10 font-black text-emerald-300 text-sm">
            <span>🥛 Total Día:</span>
            <span>{data.total} L</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-900/60 dark:bg-slate-950/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
            <span>📈 Curva de Producción Lechera</span>
            {tagNumber && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                #{tagNumber} {cowName ? `• ${cowName}` : ''}
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-400">
            Evolución de litros por pesaje y persistencia en lactancia
          </p>
        </div>
      </div>

      <div className="h-60 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="totalMilkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" L" />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => {
                if (value === 'total') return '🥛 Litros Totales';
                if (value === 'am') return '🌅 Ordeño Mañana (AM)';
                if (value === 'pm') return '🌇 Ordeño Tarde (PM)';
                return value;
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#totalMilkGradient)"
            />
            <Line
              type="monotone"
              dataKey="am"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="pm"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 3, fill: '#38bdf8' }}
              strokeDasharray="4 4"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
