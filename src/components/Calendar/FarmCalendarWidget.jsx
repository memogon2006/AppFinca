import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  CalendarDays, 
  Scale, 
  Layers, 
  DollarSign, 
  Baby, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Syringe
} from 'lucide-react';
import { formatDate, BOVINE_GESTATION_DAYS } from '../../services/calculations';
import { SANITARY_CYCLES_INFO } from './FarmCalendarModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function FarmCalendarWidget({
  cattle = [],
  weighings = [],
  vaccinations = [],
  onOpenCalendar
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  // Farm notes from localStorage
  const [notes] = useState(() => {
    try {
      const saved = localStorage.getItem('ganado_farm_calendar_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate events for today and this month
  const eventsByDate = useMemo(() => {
    const map = {};

    const addEvent = (dateStr, event) => {
      if (!dateStr) return;
      let cleanDate = dateStr;
      if (dateStr.includes('T')) cleanDate = dateStr.split('T')[0];
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
        const [d, m, y] = cleanDate.split('/');
        cleanDate = `${y}-${m}-${d}`;
      }
      if (!map[cleanDate]) map[cleanDate] = [];
      map[cleanDate].push(event);
    };

    // Weighings
    weighings.forEach(w => {
      if (w.date) {
        const animal = cattle.find(c => String(c.id) === String(w.cattleId));
        addEvent(w.date, {
          type: 'weighing',
          title: `Pesaje: ${animal?.tagNumber || 'Bovino'} (${w.weight} kg)`,
          dotColor: 'bg-emerald-500'
        });
      }
    });

    // Entries & Sales & Calvings
    cattle.forEach(c => {
      if (c.entryDate) {
        addEvent(c.entryDate, {
          type: 'entry',
          title: `Ingreso: ${c.tagNumber}`,
          dotColor: 'bg-blue-500'
        });
      }
      if (c.exitDate && c.status === 'Vendido') {
        addEvent(c.exitDate, {
          type: 'sale',
          title: `Venta: ${c.tagNumber}`,
          dotColor: 'bg-amber-500'
        });
      }
      if (c.sex === 'Hembra' && (c.femaleStatus === 'Gestación' || c.reproductiveStatus === 'Preñada') && c.serviceDate) {
        try {
          const sDate = new Date(c.serviceDate);
          if (!isNaN(sDate.getTime())) {
            const expCalv = new Date(sDate.getTime() + BOVINE_GESTATION_DAYS * 86400000);
            const calvStr = expCalv.toISOString().split('T')[0];
            addEvent(calvStr, {
              type: 'calving',
              title: `Parto: ${c.tagNumber}`,
              dotColor: 'bg-purple-500'
            });
          }
        } catch (e) {}
      }
    });

    // Vaccinations
    vaccinations.forEach(v => {
      if (v.date) {
        addEvent(v.date, {
          type: 'vaccination',
          title: `Vacuna: ${v.vaccineType}`,
          dotColor: 'bg-rose-500'
        });
      }
    });

    // Notes
    notes.forEach(n => {
      if (n.date) {
        addEvent(n.date, {
          type: 'note',
          title: n.title,
          dotColor: 'bg-teal-500'
        });
      }
    });

    return map;
  }, [cattle, weighings, vaccinations, notes]);

  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth();

  // Mini calendar days for current month
  const miniCalendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      days.push({
        dayNumber: pDay,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEvents: (eventsByDate[dateStr] || []).length > 0
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        hasEvents: (eventsByDate[dateStr] || []).length > 0
      });
    }

    // Fill to multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dayNumber: n,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEvents: (eventsByDate[dateStr] || []).length > 0
      });
    }

    return days;
  }, [viewYear, viewMonth, todayStr, eventsByDate]);

  const todayEvents = eventsByDate[todayStr] || [];

  const todayFormatted = now.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const activeCycle = useMemo(() => {
    const cycle = SANITARY_CYCLES_INFO.find(c => c.months.includes(viewMonth));
    if (!cycle) return null;

    let recorded = null;
    if (cycle.type === 'official') {
      recorded = vaccinations.find(v => 
        (v.vaccineCodes?.includes('aftosa') || v.vaccineCode === 'aftosa' || (v.vaccineType && v.vaccineType.toLowerCase().includes('aftosa'))) &&
        (new Date(v.date).getFullYear() === viewYear || (viewMonth <= 1 && new Date(v.date).getFullYear() === viewYear - 1))
      );
    } else {
      recorded = vaccinations.find(v => 
        (v.vaccineCodes?.includes('carbon') || v.vaccineCodes?.includes('vitaminas') || v.vaccineCodes?.includes('desparasitante') ||
         v.vaccineCode === 'carbon' || (v.vaccineType && (v.vaccineType.toLowerCase().includes('carbón') || v.vaccineType.toLowerCase().includes('vitamina') || v.vaccineType.toLowerCase().includes('desparasitante')))) &&
        new Date(v.date).getFullYear() === viewYear
      );
    }

    return {
      ...cycle,
      isRecorded: !!recorded,
      recordedData: recorded
    };
  }, [viewMonth, viewYear, vaccinations]);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 overflow-hidden relative group">
      
      {/* Background Subtle Pattern */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        
        {/* Left: Live Date & Clock */}
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-600/20 flex flex-col items-center justify-center min-w-[62px]">
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
              {now.toLocaleDateString('es-CO', { month: 'short' })}
            </span>
            <span className="text-2xl font-black leading-tight">
              {now.getDate()}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                Fecha Actual en Vivo
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                ● Hoy
              </span>
            </div>
            
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize mt-0.5">
              {todayFormatted}
            </h3>
            
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {timeFormatted}
              </span>
              <span>•</span>
              <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Button */}
        <button
          onClick={onOpenCalendar}
          className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer group-hover:scale-[1.02]"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Abrir Calendario & Agenda Completa</span>
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>

      </div>

      {/* Banner de Ciclo Sanitario Activo si corresponde al mes actual */}
      {activeCycle && (
        <div 
          onClick={onOpenCalendar}
          className={`mt-4 p-3 rounded-2xl border ${activeCycle.borderClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer hover:opacity-95 transition shadow-sm`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-lg mt-0.5 sm:mt-0">{activeCycle.pillIcon}</span>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${activeCycle.badgeClass}`}>
                  {activeCycle.badge}
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {activeCycle.name}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                💉 {activeCycle.focus}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
            {activeCycle.isRecorded ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Vacunado {activeCycle.recordedData?.ruvNumber ? `(RUV: ${activeCycle.recordedData.ruvNumber})` : ''}</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-sm">
                <Syringe className="w-3.5 h-3.5" />
                <span>⏳ Ciclo en curso</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Grid: Mini Calendar Preview & Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">
        
        {/* Mini Calendar Preview (md:col-span-7) */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
            <span className="text-slate-900 dark:text-slate-200 font-extrabold">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
              Semana #{Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500">
            {DAY_NAMES.map((d, i) => (
              <div key={i} className="py-0.5">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {miniCalendarDays.slice(0, 35).map((d, idx) => (
              <div
                key={idx}
                onClick={onOpenCalendar}
                className={`h-7 rounded-xl flex flex-col items-center justify-center text-[11px] font-bold cursor-pointer transition relative ${
                  d.isToday
                    ? 'bg-teal-600 text-white font-black shadow-sm ring-2 ring-teal-400/40'
                    : d.isCurrentMonth
                      ? 'bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                      : 'text-slate-300 dark:text-slate-700'
                }`}
              >
                <span>{d.dayNumber}</span>
                {d.hasEvents && (
                  <span className={`w-1 h-1 rounded-full absolute bottom-1 ${d.isToday ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Info Box: Actividades del Día (md:col-span-5) */}
        <div className="md:col-span-5 flex flex-col justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
              Actividades de Hoy ({todayEvents.length})
            </span>

            {todayEvents.length === 0 ? (
              <div className="py-3 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sin tareas pendientes para hoy
                </p>
                <p className="text-[11px] text-slate-400">
                  Haz clic en el calendario para programar pesajes o recordatorios.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                {todayEvents.slice(0, 3).map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className={`w-2 h-2 rounded-full ${ev.dotColor || 'bg-teal-500'} shrink-0`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{ev.title}</span>
                  </div>
                ))}
                {todayEvents.length > 3 && (
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold text-center">
                    +{todayEvents.length - 3} actividades más hoy
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onOpenCalendar}
            className="w-full mt-2 py-1.5 text-center text-xs text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 font-extrabold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 rounded-xl transition cursor-pointer"
          >
            Ver Agenda Completa →
          </button>
        </div>

      </div>

    </div>
  );
}
