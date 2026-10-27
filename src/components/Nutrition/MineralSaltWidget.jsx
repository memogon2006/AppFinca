import React, { useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Boxes, 
  DollarSign, 
  Trash2, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../services/calculations';

export function MineralSaltWidget({
  mineralSaltLogs = [],
  paddocks = [],
  onOpenNewSalt,
  onDeleteSaltLog
}) {
  // Estadísticas globales de sal mineral
  const stats = useMemo(() => {
    if (!mineralSaltLogs || mineralSaltLogs.length === 0) {
      return {
        totalLogs: 0,
        avgGramsPerDay: 0,
        totalKgMonth: 0,
        totalCostMonth: 0,
        optimalCount: 0,
        alertCount: 0
      };
    }

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthLogs = mineralSaltLogs.filter(l => l.date && l.date.startsWith(currentMonthPrefix));

    const totalKgMonth = thisMonthLogs.reduce((acc, l) => acc + (parseFloat(l.totalKg) || 0), 0);
    const totalCostMonth = thisMonthLogs.reduce((acc, l) => acc + (parseFloat(l.totalCost) || 0), 0);

    const gramsSum = mineralSaltLogs.reduce((acc, l) => acc + (parseFloat(l.dailyGramsPerHead) || 0), 0);
    const avgGrams = Math.round(gramsSum / mineralSaltLogs.length);

    let optimalCount = 0;
    let alertCount = 0;

    mineralSaltLogs.forEach(l => {
      if (l.status === 'optimo') optimalCount++;
      else alertCount++;
    });

    return {
      totalLogs: mineralSaltLogs.length,
      avgGramsPerDay: avgGrams,
      totalKgMonth: Math.round(totalKgMonth),
      totalCostMonth: Math.round(totalCostMonth),
      optimalCount,
      alertCount
    };
  }, [mineralSaltLogs]);

  const recentLogs = useMemo(() => {
    return [...mineralSaltLogs]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 4);
  }, [mineralSaltLogs]);

  return (
    <div className="custom-card p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800">
      
      {/* 1. CABECERA DEL WIDGET */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Sal Mineralizada & Suplementación
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Nutrición
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Control de consumo en g/cabeza/día, prevención de deficiencias y desperdicio
            </p>
          </div>
        </div>

        {/* Botón Servir Sal */}
        {onOpenNewSalt && (
          <button
            type="button"
            onClick={onOpenNewSalt}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Servir Sal</span>
          </button>
        )}
      </div>

      {/* 2. CINTA DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        {/* Promedio General */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Consumo Promedio
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.avgGramsPerDay > 0 ? stats.avgGramsPerDay : '--'}
            </span>
            <span className="text-xs font-bold text-slate-500">g/cab/día</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
            Meta: 60 - 100 g/día
          </span>
        </div>

        {/* Sal Servida este Mes */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Suministro Mes
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.totalKgMonth}
            </span>
            <span className="text-xs font-bold text-slate-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            {formatCurrency(stats.totalCostMonth)} invertidos
          </span>
        </div>

        {/* Saleros Óptimos */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Consumo Óptimo
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {stats.optimalCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">lotes</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
            Rumen equilibrado
          </span>
        </div>

        {/* Saleros en Alerta */}
        <div className={`p-3 rounded-2xl border ${
          stats.alertCount > 0 
            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider block">
            Desviaciones
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-black ${stats.alertCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {stats.alertCount}
            </span>
            <span className="text-xs font-bold">saleros</span>
          </div>
          <span className="text-[10px] font-medium block mt-0.5 truncate">
            {stats.alertCount > 0 ? '⚠️ Revisar salero / agua' : 'Sin alertas'}
          </span>
        </div>

      </div>

      {/* 3. LISTADO DE ÚLTIMOS SUMINISTROS */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
          Últimos Suministros por Potrero
        </span>

        {recentLogs.length === 0 ? (
          <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            Aún no has registrado entregas de sal mineralizada. Haz clic en <strong>+ Servir Sal</strong> para evaluar el consumo de tus animales.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentLogs.map(log => {
              const isOptimal = log.status === 'optimo';
              const isLow = log.status === 'subconsumo';

              return (
                <div 
                  key={log.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{log.paddockName || 'Potrero'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">• Lote: {log.batchName || 'General'}</span>
                      </h5>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {log.saltBrand || 'Sal Mineral'} ({log.bagsCount} bultos = {log.totalKg} kg)
                      </span>
                    </div>

                    {/* Badge de Consumo */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                      isOptimal 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                        : isLow 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}>
                      {log.dailyGramsPerHead} g/cab/día
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(log.date)} ({log.durationDays} días duración)</span>
                    </span>

                    {onDeleteSaltLog && (
                      <button
                        type="button"
                        onClick={() => onDeleteSaltLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                        title="Eliminar este registro de sal"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
