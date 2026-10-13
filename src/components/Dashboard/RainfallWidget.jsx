import React, { useMemo } from 'react';
import { CloudRain, Droplets, PlusCircle, ArrowRight, Sun, AlertTriangle, Sparkles } from 'lucide-react';
import { getLocalDateString, formatDate } from '../../services/calculations';

export function RainfallWidget({
  rainfall = [],
  onOpenNewRain,
  onNavigate
}) {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const currentMonthPrefix = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;

  const { monthMm, daysWithoutRain, lastRainDate } = useMemo(() => {
    // Milímetros de este mes
    const monthRecs = rainfall.filter(r => r.date && r.date.startsWith(currentMonthPrefix));
    const totalMonth = monthRecs.reduce((acc, r) => acc + (parseFloat(r.amountMm) || 0), 0);

    // Días sin lluvia
    const allSorted = [...rainfall]
      .filter(r => (parseFloat(r.amountMm) || 0) > 0 && r.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let diffDays = -1;
    let lastDate = null;
    if (allSorted.length > 0) {
      lastDate = allSorted[0].date;
      const today = new Date(getLocalDateString());
      const last = new Date(lastDate);
      diffDays = Math.max(0, Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      monthMm: Math.round(totalMonth * 10) / 10,
      daysWithoutRain: diffDays,
      lastRainDate: lastDate
    };
  }, [rainfall, currentMonthPrefix]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-sky-900/90 via-blue-900/80 to-slate-900 text-white border border-sky-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/10 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        {/* Cabecera del Widget */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-400/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/25 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-sky-200">
                Pluviómetro & Clima
              </h4>
              <p className="text-[11px] text-sky-100 font-medium">
                {monthNames[currentMonthIdx]} {currentYear}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewRain}
            className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-sm"
            title="Registrar lluvia de hoy"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Lluvia</span>
          </button>
        </div>

        {/* Métricas Principales */}
        <div className="py-3 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Acumulado del Mes
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {monthMm}
              </span>
              <span className="text-xs font-bold text-sky-300">mm</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Racha Seca
            </span>
            <div className="mt-0.5">
              {daysWithoutRain === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="w-3 h-3" /> ¡Llovió hoy!
                </span>
              ) : daysWithoutRain >= 15 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <AlertTriangle className="w-3 h-3" /> {daysWithoutRain} días sin lluvia
                </span>
              ) : daysWithoutRain > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  <Droplets className="w-3 h-3" /> {daysWithoutRain} {daysWithoutRain === 1 ? 'día' : 'días'} sin lluvia
                </span>
              ) : (
                <span className="text-xs text-sky-300">Sin registros</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pie con botón de navegación */}
      <div className="pt-2 border-t border-sky-400/20 flex items-center justify-between text-xs">
        <span className="text-[11px] text-sky-200 truncate">
          {lastRainDate ? `Última lluvia: ${formatDate(lastRainDate)}` : 'Registra la precipitación diaria'}
        </span>
        <button
          onClick={() => onNavigate('rainfall')}
          className="text-sky-300 hover:text-white font-bold flex items-center gap-1 text-[11px] transition cursor-pointer shrink-0 ml-2"
        >
          <span>Ver Pluviómetro</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
