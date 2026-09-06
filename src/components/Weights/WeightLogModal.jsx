import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { Scale, Flame } from 'lucide-react';
import { formatNumber, getDaysDifference, calculateWeightMetrics } from '../../services/calculations';

export function WeightLogModal({ isOpen, onClose, animal, weighings = [], onSaveWeight }) {
  if (!animal) return null;

  const animalWeighs = useMemo(() => {
    return (weighings || []).filter(w => String(w.cattleId) === String(animal.id));
  }, [weighings, animal]);

  const metrics = useMemo(() => {
    return calculateWeightMetrics(animal, animalWeighs);
  }, [animal, animalWeighs]);

  // Obtener la fecha más reciente registrada (fecha de ingreso o último pesaje)
  const existingDates = useMemo(() => {
    const dates = [animal.entryDate, ...animalWeighs.map(w => w.date)].filter(Boolean);
    return Array.from(new Set(dates)).sort();
  }, [animal, animalWeighs]);

  const lastRecordedDate = existingDates.length > 0 ? existingDates[existingDates.length - 1] : (animal.entryDate || '');
  const lastRecordedWeight = metrics.currentWeight || parseFloat(animal.entryWeight) || 0;

  const [weightData, setWeightData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    conditionScore: '3.5',
    notes: '',
  });

  useEffect(() => {
    setWeightData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      conditionScore: '3.5',
      notes: '',
    });
  }, [isOpen, animal]);

  const newWeightNum = parseFloat(weightData.weight) || 0;
  const gainSinceLast = newWeightNum > 0 ? (newWeightNum - lastRecordedWeight) : 0;
  const daysDiff = getDaysDifference(animal.entryDate, weightData.date);
  const entryWeightNum = parseFloat(animal.entryWeight) || lastRecordedWeight;
  const totalGainFromEntry = (entryWeightNum > 0 && newWeightNum > 0) ? (newWeightNum - entryWeightNum) : 0;
  const estimatedGdp = (daysDiff > 0 && totalGainFromEntry > 0) 
    ? totalGainFromEntry / daysDiff 
    : 0;

  const isMaleFatReady = animal.sex === 'Macho' && newWeightNum >= 480;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weightData.weight || Number(weightData.weight) <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0 kg');
      return;
    }

    if (lastRecordedDate && weightData.date < lastRecordedDate) {
      alert(`⚠️ La fecha del pesaje (${weightData.date}) no puede ser anterior a la fecha previa registrada (${lastRecordedDate}). Debe ser una fecha igual o posterior.`);
      return;
    }

    onSaveWeight({
      cattleId: animal.id,
      date: weightData.date,
      weight: parseFloat(weightData.weight),
      conditionScore: parseFloat(weightData.conditionScore),
      notes: weightData.notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nuevo Pesaje en Báscula: ${animal.tagNumber}`}
      subtitle={`${animal.name ? `Nombre: ${animal.name} • ` : ''}Hierro: ${animal.ironBrand || 'N/A'} • Sexo: ${animal.sex} • Último peso: ${lastRecordedWeight} kg${lastRecordedDate ? ` (${lastRecordedDate})` : ''}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Fecha del Pesaje <span className="text-rose-500">*</span>
            {lastRecordedDate && (
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                (Mínimo: {lastRecordedDate})
              </span>
            )}
          </label>
          <input
            type="date"
            min={lastRecordedDate || animal.entryDate || undefined}
            value={weightData.date}
            onChange={(e) => setWeightData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 min-h-[44px]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Peso Registrado en Báscula (kg) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              autoFocus
              placeholder="Ej. 485.5"
              value={weightData.weight}
              onChange={(e) => setWeightData(prev => ({ ...prev, weight: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-2xl focus:outline-none min-h-[48px] ${isMaleFatReady ? 'border-amber-400 text-amber-600 dark:text-amber-400 ring-2 ring-amber-400/20' : 'border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500'}`}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">kg</span>
          </div>
        </div>

        {/* ALERTA EN VIVO: Macho con peso >= 480 kg */}
        {isMaleFatReady && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-400 dark:border-emerald-500/50 flex items-start gap-3 animate-pulse">
            <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wide block">
                🎯 ¡Alerta de Ganado Listo para Venta! (≥ 480 kg)
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 font-bold">
                Este macho superó la meta de <strong>480 kg</strong> ({newWeightNum} kg). Se encuentra en peso óptimo de ceba y terminación para venta a frigorífico o subasta.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Condición Corporal (Escala 1 a 5)
          </label>
          <select
            value={weightData.conditionScore}
            onChange={(e) => setWeightData(prev => ({ ...prev, conditionScore: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
          >
            <option value="1.0">1.0 - Muy Flaco / Emaciado</option>
            <option value="2.0">2.0 - Flaco</option>
            <option value="3.0">3.0 - Regular / Normal</option>
            <option value="3.5">3.5 - Bueno / Óptimo</option>
            <option value="4.0">4.0 - Muy Bueno / Gordo</option>
            <option value="4.5">4.5 - Excelente / Ceba pesada</option>
            <option value="5.0">5.0 - Obeso / Sobreengrasado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observaciones del Pesaje
          </label>
          <input
            type="text"
            placeholder="Ej. Pesaje de control, excelente ganancia de lote"
            value={weightData.notes}
            onChange={(e) => setWeightData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
          />
        </div>

        {newWeightNum > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Ganancia vs. peso anterior:</span>
              <p className={`text-base font-bold ${gainSinceLast >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {gainSinceLast >= 0 ? `+${gainSinceLast.toFixed(1)}` : gainSinceLast.toFixed(1)} kg
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400">GDP Continuo desde entrada:</span>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(estimatedGdp, 3)} kg/día
              </p>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition min-h-[44px]"
          >
            <Scale className="w-4 h-4" />
            <span>Guardar Pesaje</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
