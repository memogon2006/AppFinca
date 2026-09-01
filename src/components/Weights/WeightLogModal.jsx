import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Scale } from 'lucide-react';
import { formatNumber, getDaysDifference } from '../../services/calculations';

export function WeightLogModal({ isOpen, onClose, animal, onSaveWeight }) {
  if (!animal) return null;

  const currentWeightNum = parseFloat(animal.currentWeight || animal.entryWeight || 0);

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
  const gainSinceLast = newWeightNum > 0 ? (newWeightNum - currentWeightNum) : 0;
  const daysDiff = getDaysDifference(animal.entryDate, weightData.date);
  const estimatedGdp = (daysDiff > 0 && newWeightNum > 0) 
    ? (newWeightNum - parseFloat(animal.entryWeight)) / daysDiff 
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weightData.weight || Number(weightData.weight) <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0 kg');
      return;
    }

    onSaveWeight(animal.id, {
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
      subtitle={`${animal.name ? `Nombre: ${animal.name} • ` : ''}Hierro: ${animal.ironBrand || 'N/A'} • Peso previo: ${currentWeightNum} kg`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Fecha del Pesaje <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={weightData.date}
            onChange={(e) => setWeightData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
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
              placeholder="Ej. 420.5"
              value={weightData.weight}
              onChange={(e) => setWeightData(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-extrabold text-xl focus:outline-none focus:border-emerald-500"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">kg</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Condición Corporal (Escala 1 a 5)
          </label>
          <select
            value={weightData.conditionScore}
            onChange={(e) => setWeightData(prev => ({ ...prev, conditionScore: e.target.value }))}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
            placeholder="Ej. Ingreso #1, pesaje de control, buena ganancia"
            value={weightData.notes}
            onChange={(e) => setWeightData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {newWeightNum > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Ganancia frente al peso previo:</span>
              <p className={`text-base font-bold ${gainSinceLast >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {gainSinceLast >= 0 ? `+${gainSinceLast.toFixed(1)}` : gainSinceLast.toFixed(1)} kg
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400">GDP acumulado estimado:</span>
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
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
          >
            <Scale className="w-4 h-4" />
            <span>Guardar Pesaje</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
