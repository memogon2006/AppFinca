import React from 'react';

const colorThemes = {
  emerald: {
    card: 'bg-[#e6ecd5] dark:bg-[#072d24] border-[#c3cda7] dark:border-[#0f4d3e] text-[#212529] dark:text-[#f1efdf]',
    title: 'text-[#07503f] dark:text-[#e8fe85]',
    iconBox: 'bg-[#ffffff] dark:bg-[#041d17] text-[#07503f] dark:text-[#e8fe85] border-[#c3cda7] dark:border-[#0f4d3e]',
    divider: 'border-[#c3cda7]/70 dark:border-[#0f4d3e]',
    subtext: 'text-[#353535] dark:text-[#c3cda7]',
  },
  blue: {
    card: 'bg-[#b2cee7] dark:bg-[#08283a] border-[#8cb6dc] dark:border-[#104b6d] text-[#212529] dark:text-[#f1efdf]',
    title: 'text-[#0e3b5e] dark:text-[#b2cee7]',
    iconBox: 'bg-[#ffffff] dark:bg-[#041d17] text-[#0e3b5e] dark:text-[#b2cee7] border-[#8cb6dc] dark:border-[#104b6d]',
    divider: 'border-[#8cb6dc]/70 dark:border-[#104b6d]',
    subtext: 'text-[#353535] dark:text-[#b2cee7]/80',
  },
  amber: {
    card: 'bg-[#fceace] dark:bg-[#342410] border-[#ecd09f] dark:border-[#5a3e1a] text-[#212529] dark:text-[#f1efdf]',
    title: 'text-[#784606] dark:text-[#fceace]',
    iconBox: 'bg-[#ffffff] dark:bg-[#041d17] text-[#784606] dark:text-[#fceace] border-[#ecd09f] dark:border-[#5a3e1a]',
    divider: 'border-[#ecd09f]/70 dark:border-[#5a3e1a]',
    subtext: 'text-[#353535] dark:text-[#fceace]/80',
  },
  purple: {
    card: 'bg-[#efefef] dark:bg-[#1a231f] border-[#d8d8d8] dark:border-[#2d3a33] text-[#212529] dark:text-[#f1efdf]',
    title: 'text-[#07503f] dark:text-[#e8fe85]',
    iconBox: 'bg-[#ffffff] dark:bg-[#041d17] text-[#07503f] dark:text-[#e8fe85] border-[#d8d8d8] dark:border-[#2d3a33]',
    divider: 'border-[#d8d8d8]/70 dark:border-[#2d3a33]',
    subtext: 'text-[#6d6d6d] dark:text-[#a0b0a6]',
  },
  rose: {
    card: 'bg-[#fceace] dark:bg-[#361e1b] border-[#eec5bd] dark:border-[#5f2b23] text-[#212529] dark:text-[#f1efdf]',
    title: 'text-[#752a1b] dark:text-[#f9b8ad]',
    iconBox: 'bg-[#ffffff] dark:bg-[#041d17] text-[#752a1b] dark:text-[#f9b8ad] border-[#eec5bd] dark:border-[#5f2b23]',
    divider: 'border-[#eec5bd]/70 dark:border-[#5f2b23]',
    subtext: 'text-[#353535] dark:text-[#f9b8ad]/80',
  },
};

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', badge }) {
  const theme = colorThemes[color] || colorThemes.emerald;

  return (
    <div className={`relative overflow-hidden rounded-[20px] ${theme.card} p-5 border shadow-none transition-all hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${theme.title}`}>{title}</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums truncate">{value}</p>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-full border shrink-0 ${theme.iconBox}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      {(subtitle || badge) && (
        <div className={`mt-3 pt-2.5 border-t ${theme.divider} flex items-center justify-between text-xs gap-2`}>
          <span className={`${theme.subtext} font-medium truncate`}>{subtitle}</span>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffffff] dark:bg-[#041d17] border border-[#c3cda7] dark:border-[#0f4d3e] font-bold text-[#07503f] dark:text-[#e8fe85] text-[10px] shrink-0">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
