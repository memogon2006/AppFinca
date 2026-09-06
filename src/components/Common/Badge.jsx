import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
    lg: 'text-sm px-3 py-1.5 font-black',
  };

  const variantClasses = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700',
    emerald: 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-500/40',
    green: 'bg-green-100/80 dark:bg-green-500/20 text-green-900 dark:text-green-200 border-green-400 dark:border-green-500/40',
    blue: 'bg-blue-100/80 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 border-blue-400 dark:border-blue-500/40',
    amber: 'bg-amber-100/80 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-500/40',
    red: 'bg-rose-100/80 dark:bg-rose-500/20 text-rose-950 dark:text-rose-200 border-rose-400 dark:border-rose-500/40',
    purple: 'bg-purple-100/80 dark:bg-purple-500/20 text-purple-950 dark:text-purple-200 border-purple-400 dark:border-purple-500/40',
    cyan: 'bg-cyan-100/80 dark:bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 border-cyan-400 dark:border-cyan-500/40',
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
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
      return <Badge variant="red">💀 Muerte</Badge>;
    case 'Trasladado':
      return <Badge variant="purple">↗ Trasladado</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function FemaleStatusBadge({ status, liters, cycleAvg }) {
  switch (status) {
    case 'Producción de leche':
      return (
        <Badge variant="blue">
          🥛 En Leche {liters ? `(${liters} L/d)` : ''}
        </Badge>
      );
    case 'Levante de cría':
      return <Badge variant="purple">👶 Levante de Cría</Badge>;
    case 'Gestación':
    case 'Preñada':
      return <Badge variant="emerald">🤰 Gestación (Preñada)</Badge>;
    case 'Vacía':
      return <Badge variant="gray">⭕ Vacía / Abierta</Badge>;
    default:
      return <Badge variant="default">{status || 'Hembra'}</Badge>;
  }
}

export function ReproductiveBadge({ status, isPregnant, daysUntilCalving }) {
  if (status === 'Preñada' || status === 'Gestación' || isPregnant) {
    const isClose = daysUntilCalving !== null && daysUntilCalving <= 20;
    return (
      <Badge variant={isClose ? 'amber' : 'emerald'} className="animate-pulse">
        🤰 Gestación {daysUntilCalving !== null ? `(Faltan ~${daysUntilCalving}d)` : ''}
      </Badge>
    );
  }
  if (status === 'Levante de cría') {
    return <Badge variant="purple">👶 Levante de Cría</Badge>;
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
  if (status === 'En ordeño' || status === 'Producción de leche') {
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
