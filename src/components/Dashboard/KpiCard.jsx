import React from 'react';

const colorThemes = {
  emerald: {
    card: 'bg-emerald-50/90 dark:bg-slate-900/90 border-emerald-200/90 dark:border-emerald-500/30 text-emerald-950 dark:text-slate-100',
    title: 'text-emerald-800/90 dark:text-emerald-400',
    iconBox: 'bg-white/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50',
    divider: 'border-emerald-200/80 dark:border-slate-800',
    subtext: 'text-slate-600 dark:text-slate-400',
  },
  blue: {
    card: 'bg-blue-50/90 dark:bg-slate-900/90 border-blue-200/90 dark:border-blue-500/30 text-blue-950 dark:text-slate-100',
    title: 'text-blue-800/90 dark:text-blue-400',
    iconBox: 'bg-white/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700/50',
    divider: 'border-blue-200/80 dark:border-slate-800',
    subtext: 'text-slate-600 dark:text-slate-400',
  },
  amber: {
    card: 'bg-amber-50/90 dark:bg-slate-900/90 border-amber-200/90 dark:border-amber-500/30 text-amber-950 dark:text-slate-100',
    title: 'text-amber-800/90 dark:text-amber-400',
    iconBox: 'bg-white/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/50',
    divider: 'border-amber-200/80 dark:border-slate-800',
    subtext: 'text-slate-600 dark:text-slate-400',
  },
  purple: {
    card: 'bg-purple-50/90 dark:bg-slate-900/90 border-purple-200/90 dark:border-purple-500/30 text-purple-950 dark:text-slate-100',
    title: 'text-purple-800/90 dark:text-purple-400',
    iconBox: 'bg-white/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700/50',
    divider: 'border-purple-200/80 dark:border-slate-800',
    subtext: 'text-slate-600 dark:text-slate-400',
  },
  rose: {
    card: 'bg-rose-50/90 dark:bg-slate-900/90 border-rose-200/90 dark:border-rose-500/30 text-rose-950 dark:text-slate-100',
    title: 'text-rose-800/90 dark:text-rose-400',
    iconBox: 'bg-white/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700/50',
    divider: 'border-rose-200/80 dark:border-slate-800',
    subtext: 'text-slate-600 dark:text-slate-400',
  },
};

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', badge }) {
  const theme = colorThemes[color] || colorThemes.emerald;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${theme.card} p-5 border shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-all hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${theme.title}`}>{title}</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums truncate">{value}</p>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl border shadow-sm shrink-0 ${theme.iconBox}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      {(subtitle || badge) && (
        <div className={`mt-3 pt-2.5 border-t ${theme.divider} flex items-center justify-between text-xs gap-2`}>
          <span className={`${theme.subtext} font-medium truncate`}>{subtitle}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-[10px] shrink-0 shadow-sm">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

