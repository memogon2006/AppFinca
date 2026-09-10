import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Scale, 
  Layers, 
  DollarSign, 
  Baby, 
  Syringe, 
  Tag, 
  Bell, 
  Sparkles,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { formatDate, formatNumber, formatCurrency, BOVINE_GESTATION_DAYS } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const NOTE_CATEGORIES = [
  { id: 'general', label: 'General', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'vacunacion', label: 'Vacunación / Salud', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  { id: 'potrero', label: 'Potreros & Pastos', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'báscula', label: 'Pesaje / Báscula', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'insumos', label: 'Insumos / Sal / Alimento', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'reproduccion', label: 'Reproducción / Partos', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
];

export function FarmCalendarModal({
  isOpen,
  onClose,
  cattle = [],
  weighings = [],
  vaccinations = [],
  onOpenVaccinationModal,
  zIndex = 'z-[60]'
}) {
  if (!isOpen) return null;

  // Fecha actual en tiempo real
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mes y año seleccionados para visualización
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0 a 11

  // Día seleccionado en el calendario (string YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // Notas / Recordatorios de la finca (persistencia en localStorage)
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('ganado_farm_calendar_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveNotes = (updated) => {
    setNotes(updated);
    try {
      localStorage.setItem('ganado_farm_calendar_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error guardando notas:', e);
    }
  };

  // Formulario para nueva nota
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('general');
  const [showAddNote, setShowAddNote] = useState(false);

  // Navegar meses
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    setViewYear(curYear);
    setViewMonth(curMonth);
    setSelectedDateStr(todayStr);
  };

  // Mapear eventos ganaderos automáticos del sistema por fecha (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {};

    const addEvent = (dateStr, event) => {
      if (!dateStr) return;
      // Normalizar formato a YYYY-MM-DD
      let cleanDate = dateStr;
      if (dateStr.includes('T')) cleanDate = dateStr.split('T')[0];
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
        const [d, m, y] = cleanDate.split('/');
        cleanDate = `${y}-${m}-${d}`;
      }
      if (!map[cleanDate]) map[cleanDate] = [];
      map[cleanDate].push(event);
    };

    // 1. Pesajes
    weighings.forEach(w => {
      if (w.date) {
        const animal = cattle.find(c => String(c.id) === String(w.cattleId));
        addEvent(w.date, {
          type: 'weighing',
          title: `Pesaje: ${animal?.tagNumber || 'Bovino'} (${w.weight} kg)`,
          subtitle: animal?.name ? `Nombre: ${animal.name}` : `Hierro: ${animal?.ironBrand || 'N/A'}`,
          icon: Scale,
          color: 'text-emerald-600 dark:text-emerald-400',
          dotColor: 'bg-emerald-500'
        });
      }
    });

    // 2. Ingresos de ganado
    cattle.forEach(c => {
      if (c.entryDate) {
        addEvent(c.entryDate, {
          type: 'entry',
          title: `Ingreso: ${c.tagNumber} (${c.category || 'Bovino'})`,
          subtitle: `Lote: ${c.entryBatch || c.paddock || 'Ingreso'} • Peso: ${c.entryWeight || 0} kg`,
          icon: Layers,
          color: 'text-blue-600 dark:text-blue-400',
          dotColor: 'bg-blue-500'
        });
      }

      // 3. Ventas / Salidas
      if (c.exitDate && c.status === 'Vendido') {
        addEvent(c.exitDate, {
          type: 'sale',
          title: `Venta: ${c.tagNumber} (${c.exitWeight || 0} kg)`,
          subtitle: `Comprador: ${c.saleBuyer || 'Vendido'} • ${formatCurrency(c.exitPrice || 0)}`,
          icon: DollarSign,
          color: 'text-amber-600 dark:text-amber-400',
          dotColor: 'bg-amber-500'
        });
      }

      // 4. Partos estimados en hembras preñadas
      if (c.sex === 'Hembra' && (c.femaleStatus === 'Gestación' || c.reproductiveStatus === 'Preñada') && c.serviceDate) {
        try {
          const sDate = new Date(c.serviceDate);
          if (!isNaN(sDate.getTime())) {
            const expCalv = new Date(sDate.getTime() + BOVINE_GESTATION_DAYS * 86400000);
            const calvStr = expCalv.toISOString().split('T')[0];
            addEvent(calvStr, {
              type: 'calving',
              title: `Parto Estimado: Vaca ${c.tagNumber}`,
              subtitle: `Servicio: ${formatDate(c.serviceDate)} (${c.breedingMethod || 'Monta'})`,
              icon: Baby,
              color: 'text-purple-600 dark:text-purple-400',
              dotColor: 'bg-purple-500'
            });
          }
        } catch (e) {}
      }
    });

    // 5. Vacunaciones y Plan Sanitario Registrados
    vaccinations.forEach(v => {
      if (v.date) {
        addEvent(v.date, {
          type: 'vaccination',
          id: v.id,
          title: `Vacunación: ${v.vaccineType}`,
          subtitle: `${v.targetLabel || 'Hato'} • ${v.animalCount || 'X'} cab. ${v.ruvNumber ? `(RUV: ${v.ruvNumber})` : ''}`,
          icon: Syringe,
          color: 'text-rose-600 dark:text-rose-400',
          dotColor: 'bg-rose-500',
          category: 'vacunacion'
        });
      }
    });

    // 6. Notas manuales del usuario
    notes.forEach(n => {
      if (n.date) {
        addEvent(n.date, {
          type: 'note',
          id: n.id,
          title: n.title,
          category: n.category,
          completed: n.completed,
          icon: CalendarIcon,
          color: 'text-teal-600 dark:text-teal-400',
          dotColor: 'bg-teal-500'
        });
      }
    });

    return map;
  }, [cattle, weighings, vaccinations, notes]);

  // Generar cuadrícula del mes
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // En JavaScript 0 = Domingo, convertimos a 0 = Lunes (ISO)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Días del mes anterior para rellenar
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
        events: eventsByDate[dateStr] || []
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: eventsByDate[dateStr] || []
      });
    }

    // Días del mes siguiente para completar cuadrícula de 35 o 42 celdas
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
        events: eventsByDate[dateStr] || []
      });
    }

    return days;
  }, [viewYear, viewMonth, todayStr, eventsByDate]);

  // Eventos del día seleccionado
  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDateStr] || [];
  }, [eventsByDate, selectedDateStr]);

  // Formato bonito de la fecha seleccionada
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // Formato de la fecha de hoy
  const todayFormattedFull = useMemo(() => {
    return now.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [now]);

  const timeFormatted = useMemo(() => {
    return now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, [now]);

  // Agregar nueva nota
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const newNote = {
      id: Date.now(),
      date: selectedDateStr,
      title: newNoteTitle.trim(),
      category: newNoteCategory,
      completed: false,
      createdAt: new Date().toISOString()
    };

    saveNotes([...notes, newNote]);
    setNewNoteTitle('');
    setShowAddNote(false);
    triggerFeedback('success');
  };

  // Alternar estado de completado de una nota
  const handleToggleNoteComplete = (noteId) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, completed: !n.completed } : n);
    saveNotes(updated);
    triggerFeedback('click');
  };

  // Eliminar una nota
  const handleDeleteNote = (noteId) => {
    if (window.confirm('¿Deseas eliminar este recordatorio?')) {
      const updated = notes.filter(n => n.id !== noteId);
      saveNotes(updated);
      triggerFeedback('danger');
    }
  };

  return (
    <div className={`modal-backdrop-root fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto`}>
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Cabecera del Calendario */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Calendario Ganadero & Agenda de Finca
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 border border-emerald-400 shadow-sm">
                  ⚡ En Tiempo Real
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5 capitalize">
                <span>📅 {todayFormattedFull}</span>
                <span>•</span>
                <span className="font-mono text-teal-300 font-bold">{timeFormatted}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de Fecha Actual & Controles de Navegación de Mes */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          
          {/* Tarjeta de Fecha de Hoy */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center min-w-[56px] shadow-md shadow-emerald-700/20">
              <span className="text-[10px] uppercase font-black tracking-wider leading-none">
                {now.toLocaleDateString('es-CO', { month: 'short' })}
              </span>
              <span className="text-xl font-black leading-tight">
                {now.getDate()}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Fecha Actual del Sistema:
              </span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white capitalize">
                {todayFormattedFull}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {timeFormatted}
                </span>
                <span>•</span>
                <span>Semana #{Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}</span>
              </div>
            </div>
          </div>

          {/* Navegación de Meses */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition cursor-pointer shadow-sm"
              title="Volver a la fecha de hoy"
            >
              Ir a Hoy
            </button>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 font-black text-xs sm:text-sm text-slate-900 dark:text-white min-w-[140px] text-center">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Cuerpo Principal del Calendario (Grid Dividido: Calendario + Agenda del Día) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA 1 (lg:col-span-7): Cuadrícula del Calendario Mensual */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Cabecera de Días de la Semana */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Días del Mes */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day, idx) => {
                const isSelected = day.dateStr === selectedDateStr;
                const hasEvents = day.events.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDateStr(day.dateStr);
                      triggerFeedback('click');
                    }}
                    className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-500 shadow-md scale-[1.02] z-10'
                        : day.isToday
                          ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm'
                          : day.isCurrentMonth
                            ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/70 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40 opacity-40 hover:opacity-80'
                    }`}
                  >
                    {/* Número de Día y Badge de Hoy */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                        day.isToday 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : isSelected 
                            ? 'text-emerald-700 dark:text-emerald-300 font-extrabold' 
                            : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {day.dayNumber}
                      </span>

                      {day.isToday && (
                        <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-400 text-slate-950">
                          HOY
                        </span>
                      )}
                    </div>

                    {/* Indicadores de Eventos del Día */}
                    {hasEvents && (
                      <div className="w-full mt-1 flex flex-wrap gap-1 items-center">
                        {day.events.slice(0, 3).map((ev, evIdx) => (
                          <span 
                            key={evIdx}
                            className={`w-2 h-2 rounded-full ${ev.dotColor || 'bg-emerald-500'} shadow-sm`}
                            title={ev.title}
                          />
                        ))}
                        {day.events.length > 3 && (
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">
                            +{day.events.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda de Colores de Eventos */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pesajes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Ventas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Partos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Notas / Tareas
              </span>
            </div>

          </div>

          {/* COLUMNA 2 (lg:col-span-5): Detalle del Día Seleccionado & Agenda de Tareas */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              {/* Tarjeta de Día Seleccionado */}
              <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                    Agenda del Día Seleccionado:
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white capitalize">
                    {formattedSelectedDate}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenVaccinationModal && (
                    <button
                      onClick={() => onOpenVaccinationModal()}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                      title="Registrar vacunación"
                    >
                      <Syringe className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">+ Vacuna</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAddNote(!showAddNote)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddNote ? 'Cancelar' : 'Añadir Nota'}</span>
                  </button>
                </div>
              </div>

              {/* Formulario para Agregar Nota/Recordatorio */}
              {showAddNote && (
                <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-teal-400 shadow-md space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-teal-600" />
                      <span>Nuevo Recordatorio / Tarea para este día</span>
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Ej. Vacunación lote ceba, compra de sal mineral, purga..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    autoFocus
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      {NOTE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={!newNoteTitle.trim()}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Guardar Nota
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Eventos y Notas del Día */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {selectedDayEvents.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                    <CalendarDays className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      No hay eventos ni tareas registradas para esta fecha.
                    </p>
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                    >
                      + Añadir recordatorio o tarea
                    </button>
                  </div>
                ) : (
                  selectedDayEvents.map((ev, evIndex) => {
                    const Icon = ev.icon || CalendarIcon;
                    const isNote = ev.type === 'note';

                    return (
                      <div
                        key={evIndex}
                        className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                          isNote && ev.completed
                            ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {isNote ? (
                            <button
                              onClick={() => handleToggleNoteComplete(ev.id)}
                              className="mt-0.5 text-teal-600 hover:scale-110 transition cursor-pointer"
                              title={ev.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                            >
                              {ev.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          ) : (
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 shrink-0">
                              <Icon className={`w-4 h-4 ${ev.color}`} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className={`text-xs font-bold text-slate-900 dark:text-white truncate ${isNote && ev.completed ? 'line-through' : ''}`}>
                              {ev.title}
                            </h5>
                            {ev.subtitle && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {ev.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {isNote && (
                          <button
                            onClick={() => handleDeleteNote(ev.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                            title="Eliminar recordatorio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Resumen Rápido del Mes */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <span className="text-slate-500 font-bold">Actividades en {MONTH_NAMES[viewMonth]}:</span>
              <strong className="text-slate-900 dark:text-white font-extrabold">
                {Object.keys(eventsByDate).filter(d => d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)).reduce((acc, d) => acc + (eventsByDate[d]?.length || 0), 0)} eventos registrados
              </strong>
            </div>

          </div>

        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Los eventos y fechas se sincronizan automáticamente con el inventario de la finca.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
