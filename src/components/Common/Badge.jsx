import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  const variantClasses = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
    green: 'bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300 border-green-300 dark:border-green-500/30',
    blue: 'bg-blue-50 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
    amber: 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
    red: 'bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
    purple: 'bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30',
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  switch (status) {
    case 'Activo':
      return <Badge variant="emerald">● En Finca</Badge>;
    case 'Vendido':
      return <Badge variant="blue">✓ Vendido</Badge>;
    case 'Muerto':
      return <Badge variant="red">✝ Muerte</Badge>;
    case 'Trasladado':
      return <Badge variant="purple">↗ Trasladado</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function ReproductiveBadge({ status, isPregnant, daysUntilCalving }) {
  if (status === 'Preñada' || isPregnant) {
    const isClose = daysUntilCalving !== null && daysUntilCalving <= 20;
    return (
      <Badge variant={isClose ? 'amber' : 'emerald'} className="animate-pulse">
        🤰 Preñada {daysUntilCalving !== null ? `(Faltan ~${daysUntilCalving}d)` : ''}
      </Badge>
    );
  }
  if (status === 'En Servicio') {
    return <Badge variant="amber">⏳ En Servicio</Badge>;
  }
  if (status === 'Vacía') {
    return <Badge variant="gray">⭕ Vacía</Badge>;
  }
  return <Badge variant="default">No aplica</Badge>;
}

export function MilkingBadge({ status, liters }) {
  if (status === 'En ordeño') {
    return (
      <Badge variant="cyan">
        🥛 En Leche {liters ? `(${liters} L/d)` : ''}
      </Badge>
    );
  }
  if (status === 'Seca') {
    return <Badge variant="amber">🍂 Seca</Badge>;
  }
  return null;
}

export function ProductionTypeBadge({ type }) {
  switch (type) {
    case 'Ceba':
      return <Badge variant="emerald">🥩 Ceba / Engorde</Badge>;
    case 'Lechería':
      return <Badge variant="blue">🥛 Lechería</Badge>;
    case 'Cría':
      return <Badge variant="purple">👶 Cría / Vientre</Badge>;
    case 'Doble Propósito':
      return <Badge variant="amber">⚖️ Doble Propósito</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
}
