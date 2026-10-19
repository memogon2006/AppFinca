import React from 'react';

/**
 * BovineEarTag: Representación visual realista y zootécnica del arete o chapeta ganadera oficial.
 * 
 * @param {string} tagNumber - Número de chapeta / arete
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} isTemporary - Si es arete provisional / cría
 * @param {boolean} isBornInFarm - Si nació en la finca
 * @param {boolean} isCompany - Si es en compañía
 * @param {string} status - 'Activo' | 'Vendido' | 'Muerto'
 * @param {string} customColor - Color forzado opcional
 */
export function BovineEarTag({
  tagNumber = '---',
  size = 'md',
  isTemporary = false,
  isBornInFarm = false,
  isCompany = false,
  status = 'Activo',
  customColor = null,
  farmName = null
}) {
  // Determinar paleta según estado
  let theme = {
    bg: 'bg-amber-400 dark:bg-amber-400',
    border: 'border-amber-500 dark:border-amber-500',
    text: 'text-slate-950',
    pin: 'bg-amber-600/50 border-amber-700/60',
    shadow: 'shadow-amber-500/20',
  };

  if (status === 'Muerto') {
    theme = {
      bg: 'bg-slate-200 dark:bg-slate-800',
      border: 'border-slate-300 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      pin: 'bg-slate-400/40 border-slate-500/50',
      shadow: 'shadow-slate-500/10',
    };
  } else if (status === 'Vendido') {
    theme = {
      bg: 'bg-amber-100 dark:bg-amber-950/70',
      border: 'border-amber-300 dark:border-amber-700',
      text: 'text-amber-900 dark:text-amber-200',
      pin: 'bg-amber-400/40 border-amber-600/50',
      shadow: 'shadow-amber-500/15',
    };
  } else if (isTemporary) {
    theme = {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-2 border-dashed border-amber-400 dark:border-amber-600',
      text: 'text-amber-900 dark:text-amber-200',
      pin: 'bg-amber-400/30 border-amber-500/40',
      shadow: 'shadow-amber-500/10',
    };
  } else if (isBornInFarm) {
    theme = {
      bg: 'bg-emerald-400 dark:bg-emerald-500',
      border: 'border-emerald-500 dark:border-emerald-600',
      text: 'text-slate-950 font-black',
      pin: 'bg-emerald-700/50 border-emerald-800/60',
      shadow: 'shadow-emerald-500/25',
    };
  }

  // Dimensiones según tamaño
  const sizes = {
    sm: {
      container: 'px-2 py-1 min-w-[54px] rounded-lg border',
      pin: 'w-1.5 h-1.5 mb-0.5',
      text: 'text-xs font-black tracking-tight',
      sub: 'text-[8px]',
    },
    md: {
      container: 'px-2.5 py-1.5 min-w-[70px] rounded-xl border',
      pin: 'w-2 h-2 mb-0.5',
      text: 'text-sm sm:text-base font-black tracking-tight',
      sub: 'text-[9px]',
    },
    lg: {
      container: 'px-4 py-2.5 min-w-[100px] rounded-2xl border-2',
      pin: 'w-2.5 h-2.5 mb-1',
      text: 'text-xl sm:text-2xl font-black tracking-tight',
      sub: 'text-[10px]',
    },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div 
      className={`inline-flex flex-col items-center justify-center shrink-0 select-none shadow-sm ${s.container} ${theme.bg} ${theme.border} ${theme.shadow} transition-transform group-hover:scale-105`}
      title={`Arete Oficial ${tagNumber} • ${isBornInFarm ? 'Nacido en Finca (Verde)' : 'Comprado (Amarillo)'}`}
    >
      {/* Botón / Orificio de sujeción superior */}
      <div className={`rounded-full border shadow-inner ${s.pin} ${theme.pin}`} />

      {/* Número Troquelado del Bovino */}
      <span className={`font-mono leading-none ${s.text} ${theme.text}`}>
        {tagNumber}
      </span>

      {/* Pequeña indicación contextual */}
      {isTemporary && (
        <span className={`mt-0.5 font-bold uppercase tracking-wider text-[8px] opacity-80 ${theme.text}`}>
          TEMP
        </span>
      )}
    </div>
  );
}
