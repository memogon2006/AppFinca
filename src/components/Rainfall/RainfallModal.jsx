import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  X, 
  Calendar, 
  Droplets, 
  Sparkles, 
  FileText, 
  Plus, 
  Save, 
  Zap,
  AlertCircle
} from 'lucide-react';
import { getLocalDateString } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

const RAIN_INTENSITIES = [
  { id: 'Llovizna', label: 'Llovizna', icon: '🌦️', desc: '< 5 mm (Ligera)' },
  { id: 'Normal', label: 'Normal', icon: '🌧️', desc: '5 - 20 mm (Moderada)' },
  { id: 'Fuerte', label: 'Fuerte', icon: '⛈️', desc: '20 - 50 mm (Aguacero)' },
  { id: 'Torrencial', label: 'Torrencial', icon: '🌩️', desc: '> 50 mm (Temporal)' },
  { id: 'Granizada', label: 'Granizada', icon: '🧊', desc: 'Con granizo' },
];

export function RainfallModal({
  isOpen,
  onClose,
  onSave,
  editingRecord = null,
  showToast
}) {
  const [date, setDate] = useState(getLocalDateString());
  const [amountMm, setAmountMm] = useState('');
  const [intensity, setIntensity] = useState('Normal');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      setDate(editingRecord.date || getLocalDateString());
      setAmountMm(editingRecord.amountMm !== undefined ? String(editingRecord.amountMm) : '');
      setIntensity(editingRecord.intensity || 'Normal');
      setNotes(editingRecord.notes || '');
    } else {
      setDate(getLocalDateString());
      setAmountMm('');
      setIntensity('Normal');
      setNotes('');
    }
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  const handleQuickAdd = (increment) => {
    const current = parseFloat(amountMm) || 0;
    const nextVal = Math.max(0, current + increment);
    setAmountMm(String(Math.round(nextVal * 10) / 10));

    // Auto-sugerir intensidad según milímetros
    if (nextVal < 5) setIntensity('Llovizna');
    else if (nextVal <= 20) setIntensity('Normal');
    else if (nextVal <= 50) setIntensity('Fuerte');
    else setIntensity('Torrencial');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedMm = parseFloat(amountMm);

    if (isNaN(parsedMm) || parsedMm < 0) {
      if (showToast) showToast('Ingresa un valor válido de milímetros (mm)', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...(editingRecord || {}),
        date: date || getLocalDateString(),
        amountMm: parsedMm,
        intensity: intensity || 'Normal',
        notes: (notes || '').trim(),
      };

      await onSave(payload);
      triggerFeedback('success');
      if (showToast) {
        showToast(
          editingRecord 
            ? 'Registro de lluvia actualizado' 
            : `💧 ¡Guardado! ${parsedMm} mm registrados exitosamente`, 
          'success'
        );
      }
      onClose();
    } catch (err) {
      console.error('Error guardando lluvia:', err);
      if (showToast) showToast('Error al guardar registro: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight leading-tight">
                {editingRecord ? 'Editar Lectura Pluviométrica' : 'Registrar Lluvia en la Finca'}
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Milímetros caídos en las últimas 24 horas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              Fecha de la lectura:
            </label>
            <input
              type="date"
              value={date}
              max={getLocalDateString()}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          {/* Campo Milímetros (mm) */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50">
            <label className="block text-xs font-black text-sky-950 dark:text-sky-200 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Precipitación en Milímetros (mm):
              </span>
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                1 mm = 1 litro/m²
              </span>
            </label>

            <div className="relative mt-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={amountMm}
                onChange={(e) => {
                  setAmountMm(e.target.value);
                  const val = parseFloat(e.target.value) || 0;
                  if (val < 5) setIntensity('Llovizna');
                  else if (val <= 20) setIntensity('Normal');
                  else if (val <= 50) setIntensity('Fuerte');
                  else setIntensity('Torrencial');
                }}
                placeholder="0.0"
                required
                autoFocus
                className="w-full pl-4 pr-14 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-sky-400 dark:border-sky-600 text-slate-950 dark:text-white text-2xl font-black text-center focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                mm
              </span>
            </div>

            {/* Botones de incremento rápido */}
            <div className="grid grid-cols-4 gap-1.5 mt-2.5">
              {[5, 10, 20, 50].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickAdd(inc)}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-black transition cursor-pointer shadow-xs active:scale-95"
                >
                  +{inc} mm
                </button>
              ))}
            </div>
          </div>

          {/* Tipo / Intensidad de Lluvia */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Tipo de lluvia observada:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RAIN_INTENSITIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIntensity(item.id)}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    intensity === item.id
                      ? 'bg-sky-500 text-white border-sky-600 shadow-md font-black'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 font-semibold'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs leading-tight truncate">{item.label}</div>
                    <div className={`text-[9px] truncate ${intensity === item.id ? 'text-sky-100' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notas / Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observaciones del clima en la finca (Opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej. Creció la cañada, mojó bien el potrero bajo, fuerte viento..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/30 transition cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : editingRecord ? 'Actualizar' : 'Guardar Lectura'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
