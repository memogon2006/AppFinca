import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  ArrowRightLeft, 
  Calendar, 
  Boxes, 
  Leaf, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../../services/calculations';

export function RotateBatchModal({
  isOpen,
  onClose,
  paddocks = [],
  cattle = [],
  initialFromPaddockId = null,
  onConfirmRotation
}) {
  const [fromPaddockId, setFromPaddockId] = useState(initialFromPaddockId || '');
  const [toPaddockId, setToPaddockId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [rotationDate, setRotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [updateCattleLocation, setUpdateCattleLocation] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtener lista de lotes únicos existentes
  const existingBatches = Array.from(new Set(
    cattle
      .filter(c => c.status === 'Activo' && (c.entryBatch || c.paddock))
      .map(c => c.entryBatch || c.paddock)
  )).filter(Boolean);

  // Sincronizar potrero origen inicial
  useEffect(() => {
    if (initialFromPaddockId) {
      setFromPaddockId(String(initialFromPaddockId));
      const originP = paddocks.find(p => String(p.id) === String(initialFromPaddockId));
      if (originP && originP.currentBatchName) {
        setBatchName(originP.currentBatchName);
      }
    }
  }, [initialFromPaddockId, paddocks]);

  // Al cambiar el potrero origen, auto-completar el lote si ya lo tiene asignado
  const handleFromPaddockChange = (id) => {
    setFromPaddockId(id);
    if (id && id !== 'none') {
      const p = paddocks.find(item => String(item.id) === String(id));
      if (p && p.currentBatchName) {
        setBatchName(p.currentBatchName);
      }
    }
  };

  const originPaddock = paddocks.find(p => String(p.id) === String(fromPaddockId));
  const destPaddock = paddocks.find(p => String(p.id) === String(toPaddockId));

  // Calcular días de descanso del potrero destino
  const getRestDays = (paddock) => {
    if (!paddock || !paddock.lastRestStartDate) return 0;
    const diff = Math.floor((new Date(rotationDate) - new Date(paddock.lastRestStartDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Calcular días de pastoreo del potrero origen
  const getGrazingDays = (paddock) => {
    if (!paddock || !paddock.entryDate) return 0;
    const diff = Math.floor((new Date(rotationDate) - new Date(paddock.entryDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Cantidad de animales afectados
  const matchingAnimalsCount = cattle.filter(c => 
    c.status === 'Activo' && 
    (c.entryBatch === batchName || (originPaddock && c.paddock === originPaddock.name))
  ).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toPaddockId || toPaddockId === 'none') {
      alert('Por favor selecciona el potrero destino para rotar el lote.');
      return;
    }
    if (fromPaddockId && fromPaddockId === toPaddockId) {
      alert('El potrero origen y el potrero destino no pueden ser el mismo.');
      return;
    }

    try {
      setLoading(true);
      await onConfirmRotation({
        fromPaddockId: fromPaddockId || 'none',
        toPaddockId,
        batchName: batchName || originPaddock?.currentBatchName || 'Lote Activo',
        date: rotationDate,
        updateCattleLocation,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error ejecutando la rotación: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rotación de Potrero & Pastoreo"
      subtitle="Mueve tu lote de ganado y actualiza descansos en 1 clic"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-200">
        
        {/* Banner Ilustrativo */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Pase Rotacional de Lote
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                El potrero origen pasará automáticamente a <strong>En Descanso</strong> y el potrero destino a <strong>Ocupado</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Lote / Ganado */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Nombre del Lote / Grupo a Rotar: *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              list="batches-list"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 pl-9"
              placeholder="Ej. Lote Ceba 2026 / Novillos Represa"
            />
            <Boxes className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <datalist id="batches-list">
              {existingBatches.map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          {matchingAnimalsCount > 0 && (
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Se detectaron <strong>{matchingAnimalsCount} bovinos activos</strong> asociados a este lote.
            </p>
          )}
        </div>

        {/* Origen y Destino en 2 Columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Potrero Origen */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                1. Potrero Origen (Sale)
              </span>
              <span className="text-[10px] font-bold text-slate-400">Pasa a Descanso</span>
            </div>

            <select
              value={fromPaddockId}
              onChange={(e) => handleFromPaddockChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="">-- Ninguno / Ingreso Externo --</option>
              {paddocks.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'ocupado' ? '🔴 (Ocupado)' : p.status === 'descanso' ? '🟢 (Descanso)' : '🟡 (Mantenimiento)'}
                </option>
              ))}
            </select>

            {originPaddock && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                <p><strong>Área:</strong> {originPaddock.areaHa} ha ({originPaddock.pastureType || 'Pasto'})</p>
                {originPaddock.entryDate && (
                  <p className="text-rose-600 dark:text-rose-400 font-bold">
                    Pastoreado: {getGrazingDays(originPaddock)} días (Meta: {originPaddock.targetGrazingDays || 3} días)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Potrero Destino */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                2. Potrero Destino (Entra) *
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Pasa a Ocupado</span>
            </div>

            <select
              required
              value={toPaddockId}
              onChange={(e) => setToPaddockId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Seleccionar Potrero Destino --</option>
              {paddocks.map(p => {
                const restDays = getRestDays(p);
                const isReady = restDays >= (p.targetRestDays || 30);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} • {p.areaHa} ha {isReady ? `✅ (Descansó ${restDays}d / Listo)` : `⏳ (${restDays}d descanso)`}
                  </option>
                );
              })}
            </select>

            {destPaddock && (
              <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 pt-1">
                <p><strong>Pasto:</strong> {destPaddock.pastureType || 'Sin especificar'} • <strong>Agua:</strong> {destPaddock.waterSource || 'N/A'}</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Descanso acumulado:</span>
                  <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                    getRestDays(destPaddock) >= (destPaddock.targetRestDays || 30)
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {getRestDays(destPaddock)} días / Meta: {destPaddock.targetRestDays || 30}d
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Fecha y Ajuste de Ubicación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fecha de Rotación:
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={rotationDate}
                onChange={(e) => setRotationDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 pl-8"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="pt-2 sm:pt-4">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateCattleLocation}
                onChange={(e) => setUpdateCattleLocation(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                Actualizar automáticamente el potrero/lote de los {matchingAnimalsCount > 0 ? matchingAnimalsCount : 'todos los'} animales al nuevo potrero.
              </span>
            </label>
          </div>

        </div>

        {/* Notas u Observaciones */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Notas de la Rotación (Opcional):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="Ej. Entrada con pasto a 45cm, sal mineralizada cargada en canoa..."
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{loading ? 'Rotando...' : 'Confirmar y Rotar Lote'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
