import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Boxes, 
  Scale, 
  DollarSign, 
  Calendar, 
  Clock, 
  Layers, 
  Info,
  X
} from 'lucide-react';
import { 
  SALT_TYPES, 
  POPULAR_SALT_BRANDS, 
  calculateSaltConsumption, 
  calculateSaltEconomics 
} from '../../services/saltNutritionService';
import { getLocalDateString, formatCurrency } from '../../services/calculations';

export function MineralSaltModal({
  isOpen,
  onClose,
  paddocks = [],
  cattle = [],
  editingLog = null,
  onSaveLog
}) {
  const today = getLocalDateString();

  const [date, setDate] = useState(today);
  const [paddockId, setPaddockId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [animalCount, setAnimalCount] = useState(25);
  const [saltType, setSaltType] = useState('mineralizada');
  const [saltBrand, setSaltBrand] = useState('Somex 8% Fósforo Ceba');
  const [bagsCount, setBagsCount] = useState(2);
  const [bagWeightKg, setBagWeightKg] = useState(40);
  const [durationDays, setDurationDays] = useState(7);
  const [costPerBag, setCostPerBag] = useState(85000);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Inicializar o sincronizar con potrero seleccionado
  useEffect(() => {
    if (editingLog) {
      setDate(editingLog.date || today);
      setPaddockId(String(editingLog.paddockId || ''));
      setBatchName(editingLog.batchName || '');
      setAnimalCount(editingLog.animalCount || 25);
      setSaltType(editingLog.saltType || 'mineralizada');
      setSaltBrand(editingLog.saltBrand || 'Somex 8% Fósforo Ceba');
      setBagsCount(editingLog.bagsCount || 2);
      setBagWeightKg(editingLog.bagWeightKg || 40);
      setDurationDays(editingLog.durationDays || 7);
      setCostPerBag(editingLog.costPerBag || 85000);
      setNotes(editingLog.notes || '');
    } else if (paddocks.length > 0 && !paddockId) {
      // Tomar el primer potrero ocupado o primero disponible
      const firstOcc = paddocks.find(p => p.status === 'ocupado' || p.currentBatchName) || paddocks[0];
      if (firstOcc) {
        handleSelectPaddock(firstOcc.id);
      }
    }
  }, [editingLog, isOpen]);

  // Al seleccionar un potrero, auto-completar el lote y el conteo de animales
  const handleSelectPaddock = (selectedId) => {
    setPaddockId(String(selectedId));
    const pad = paddocks.find(p => String(p.id) === String(selectedId));
    if (pad) {
      const bName = pad.currentBatchName || '';
      setBatchName(bName);

      // Contar animales activos en este potrero o lote
      const activeInPad = cattle.filter(c => 
        c.status === 'Activo' && (
          (c.paddockId && String(c.paddockId) === String(pad.id)) ||
          (c.paddock && pad.name && c.paddock.trim().toLowerCase() === pad.name.trim().toLowerCase()) ||
          (bName && c.entryBatch && bName.trim().toLowerCase() === c.entryBatch.trim().toLowerCase())
        )
      );

      setAnimalCount(activeInPad.length > 0 ? activeInPad.length : 25);
    }
  };

  // Ajustar peso por bulto según el tipo de sal
  const handleSelectSaltType = (typeId) => {
    setSaltType(typeId);
    const cfg = SALT_TYPES.find(t => t.id === typeId);
    if (cfg) {
      setBagWeightKg(cfg.defaultBagKg);
    }
  };

  // Cálculos dinámicos
  const totalKg = Number((bagsCount * bagWeightKg).toFixed(1));
  const consumption = useMemo(() => {
    return calculateSaltConsumption({
      totalKg,
      animalCount,
      durationDays,
      saltType
    });
  }, [totalKg, animalCount, durationDays, saltType]);

  const economics = useMemo(() => {
    return calculateSaltEconomics({
      costPerBag,
      bagWeightKg,
      dailyGramsPerHead: consumption.dailyGramsPerHead
    });
  }, [costPerBag, bagWeightKg, consumption.dailyGramsPerHead]);

  const totalCost = bagsCount * costPerBag;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paddockId) return;

    setLoading(true);
    try {
      const pad = paddocks.find(p => String(p.id) === String(paddockId));
      const payload = {
        id: editingLog?.id || 'salt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        date,
        paddockId: pad?.id || paddockId,
        paddockName: pad?.name || 'Potrero General',
        batchName: batchName || pad?.currentBatchName || 'Lote General',
        animalCount: parseInt(animalCount, 10) || 1,
        saltType,
        saltBrand,
        bagsCount: parseFloat(bagsCount) || 1,
        bagWeightKg: parseFloat(bagWeightKg) || 40,
        totalKg,
        costPerBag: parseFloat(costPerBag) || 0,
        totalCost,
        durationDays: parseInt(durationDays, 10) || 1,
        dailyGramsPerHead: consumption.dailyGramsPerHead,
        status: consumption.status,
        notes,
        createdAt: editingLog?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (onSaveLog) {
        await onSaveLog(payload);
      }
      onClose();
    } catch (err) {
      console.warn('Error guardando suministro de sal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingLog ? '✏️ Editar Suministro de Sal Mineral' : '🧂 Registro de Sal Mineralizada & Suplementos'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 1. SELECCIÓN DE POTRERO, LOTE Y FECHA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fecha de Suministro
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Potrero (Ubicación)
            </label>
            <select
              value={paddockId}
              onChange={(e) => handleSelectPaddock(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            >
              <option value="">-- Seleccionar potrero --</option>
              {paddocks.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.areaHa || 1} Ha) {p.currentBatchName ? `• Lote: ${p.currentBatchName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lote de Ganado
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="ej: Novillos Ceba, Vacas..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            />
          </div>

        </div>

        {/* 2. TIPO DE SAL Y MARCA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Suplementación
            </label>
            <select
              value={saltType}
              onChange={(e) => handleSelectSaltType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            >
              {SALT_TYPES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label} (Meta: {t.defaultMin}-{t.defaultMax} g/día)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Marca o Fórmula Comercial
            </label>
            <input
              type="text"
              list="salt-brands-list"
              value={saltBrand}
              onChange={(e) => setSaltBrand(e.target.value)}
              placeholder="ej: Somex 8%, Colanta, etc."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            />
            <datalist id="salt-brands-list">
              {POPULAR_SALT_BRANDS.map((b, i) => (
                <option key={i} value={b} />
              ))}
            </datalist>
          </div>

        </div>

        {/* 3. CANTIDADES, ANIMALES Y DURACIÓN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Bultos Servidos
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={bagsCount}
              onChange={(e) => setBagsCount(parseFloat(e.target.value) || 1)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Kg por Bulto
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={bagWeightKg}
              onChange={(e) => setBagWeightKg(parseFloat(e.target.value) || 40)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Cabezas en Potrero
            </label>
            <input
              type="number"
              min="1"
              value={animalCount}
              onChange={(e) => setAnimalCount(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Días de Duración
            </label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white"
            />
          </div>

        </div>

        {/* 4. RESULTADO ZOOTÉCNICO Y SEMÁFORO EN VIVO */}
        <div className={`p-4 rounded-2xl border transition-all ${
          consumption.status === 'optimo'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : consumption.status === 'subconsumo'
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            : consumption.status === 'elevado'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span>Consumo Zootécnico Estimado</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${consumption.badgeClass}`}>
              {consumption.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold opacity-75 block">Consumo Diario</span>
              <span className="text-2xl font-black">{consumption.dailyGramsPerHead}</span>
              <span className="text-xs font-bold ml-1">g / cabeza / día</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold opacity-75 block">Total Servido</span>
              <span className="text-2xl font-black">{totalKg}</span>
              <span className="text-xs font-bold ml-1">kg ({bagsCount} bultos)</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold opacity-75 block">Costo / Animal / Mes</span>
              <span className="text-xl font-black">{formatCurrency(economics.costPerHeadPerMonth)}</span>
              <span className="text-[10px] block opacity-75">~{formatCurrency(economics.costPerHeadPerDay)}/día</span>
            </div>
          </div>

          <p className="text-xs font-medium leading-relaxed mt-1">
            💡 {consumption.advice}
          </p>
        </div>

        {/* 5. COSTO Y OBSERVACIONES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Precio de Compra por Bulto ($ COP)
            </label>
            <input
              type="number"
              step="1000"
              value={costPerBag}
              onChange={(e) => setCostPerBag(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Inversión total: <strong>{formatCurrency(totalCost)}</strong> ({formatCurrency(economics.costPerKg)}/kg)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones del Saladero (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej: Salero techado, sal seca, agua cerca..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* ACCIONES DEL FORMULARIO */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Guardando...' : editingLog ? 'Actualizar Registro' : 'Guardar Suministro de Sal'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
