import React from 'react';

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', badge }) {
  const colorMap = {
    emerald: 'bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    blue: 'bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-cyan-500/5 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    amber: 'bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-500/5 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    purple: 'bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-pink-500/5 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
    rose: 'bg-rose-50 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-red-500/5 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${colorMap[color] || colorMap.emerald} p-5 border shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-all hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/50 shadow-sm dark:shadow-inner">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/40 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">{subtitle}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-[10px]">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
