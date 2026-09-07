import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Skull, AlertTriangle, Calendar, FileText, CheckCircle2 } from 'lucide-react';

const COMMON_DEATH_REASONS = [
  'Enfermedad general / Infección',
  'Timpanismo / Meteorismo',
  'Picadura de serpiente / ponzoña',
  'Complicación de parto (Distocia)',
  'Accidente / Trauma / Fractura',
  'Intoxicación por planta o agua',
  'Paro cardíaco / Muerte súbita',
  'Desnutrición / Debilidad severa',
  'Causa desconocida',
  'Otra causa específica',
];

export function DeathModal({ isOpen, onClose, animal, onConfirmDeath, zIndex = 'z-[60]' }) {
  const [formData, setFormData] = useState({
    deathDate: new Date().toISOString().split('T')[0],
    deathReason: 'Enfermedad general / Infección',
    deathNotes: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (animal) {
      setFormData({
        deathDate: animal.deathDate || new Date().toISOString().split('T')[0],
        deathReason: animal.deathReason || 'Enfermedad general / Infección',
        deathNotes: animal.deathNotes || '',
      });
    }
  }, [animal, isOpen]);

  if (!animal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deathDate) {
      alert('Por favor selecciona la fecha de muerte del bovino.');
      return;
    }

    try {
      setLoading(true);
      await onConfirmDeath(animal.id, {
        status: 'Muerto',
        deathDate: formData.deathDate,
        deathReason: formData.deathReason,
        deathNotes: formData.deathNotes,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al registrar la muerte del bovino: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`💀 Registrar Muerte de Bovino • Arete: ${animal.tagNumber}`}
      subtitle={`Descarga del inventario activo por fallecimiento • ${animal.name || 'Sin nombre'}`}
      maxWidth="max-w-md"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Alerta de confirmación */}
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-rose-700 dark:text-rose-300">
              ¿Confirmar baja por muerte de este animal?
            </p>
            <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
              El bovino <strong>{animal.tagNumber}</strong> se dará de baja y ya no contará en la cantidad de cabezas activas en finca. Su historial quedará guardado para estadísticas de mortalidad.
            </p>
          </div>
        </div>

        {/* Fecha de Muerte */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Fecha de Muerte <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={formData.deathDate}
              onChange={(e) => setFormData(prev => ({ ...prev, deathDate: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500 min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Causa de Muerte */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Causa o Motivo de Fallecimiento <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.deathReason}
            onChange={(e) => setFormData(prev => ({ ...prev, deathReason: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500 min-h-[44px]"
            required
          >
            {COMMON_DEATH_REASONS.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        {/* Observaciones / Notas */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Observaciones Adicionales / Diagnóstico
          </label>
          <div className="relative">
            <textarea
              rows={2}
              placeholder="Ej. Se encontró en potrero bajo, se aplicó suero antiofídico sin éxito..."
              value={formData.deathNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, deathNotes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition min-h-[42px] cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition min-h-[42px] cursor-pointer"
          >
            <Skull className="w-4 h-4" />
            <span>{loading ? 'Procesando...' : 'Confirmar Baja por Muerte'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
