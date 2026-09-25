import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { PASTURE_TYPES, WATER_SOURCES, PADDOCK_STATUSES } from '../../types/paddocks';
import { 
  Leaf, 
  MapPin, 
  Droplets, 
  Clock, 
  Sun, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  Boxes,
  Zap
} from 'lucide-react';

export function PaddockFormModal({
  isOpen,
  onClose,
  editingPaddock = null,
  onSavePaddock,
  cattle = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    areaHa: '',
    pastureType: PASTURE_TYPES[0],
    customPasture: '',
    waterSource: WATER_SOURCES[0],
    customWater: '',
    status: 'descanso',
    currentBatchName: '',
    targetRestDays: 30,
    targetGrazingDays: 3,
    lastRestStartDate: new Date().toISOString().split('T')[0],
    entryDate: '',
    shadeQuality: 'Buena',
    fencingType: 'Eléctrica',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  // Obtener lotes activos existentes
  const activeBatches = Array.from(new Set(
    cattle
      .filter(c => c.status === 'Activo' && (c.entryBatch || c.paddock))
      .map(c => c.entryBatch || c.paddock)
  )).filter(Boolean);

  useEffect(() => {
    if (editingPaddock) {
      const isStandardPasture = PASTURE_TYPES.includes(editingPaddock.pastureType);
      const isStandardWater = WATER_SOURCES.includes(editingPaddock.waterSource);

      setFormData({
        name: editingPaddock.name || '',
        areaHa: editingPaddock.areaHa !== undefined ? editingPaddock.areaHa : '',
        pastureType: isStandardPasture ? editingPaddock.pastureType : 'Otro',
        customPasture: !isStandardPasture ? (editingPaddock.pastureType || '') : '',
        waterSource: isStandardWater ? editingPaddock.waterSource : 'Otro',
        customWater: !isStandardWater ? (editingPaddock.waterSource || '') : '',
        status: editingPaddock.status || 'descanso',
        currentBatchName: editingPaddock.currentBatchName || '',
        targetRestDays: editingPaddock.targetRestDays !== undefined ? editingPaddock.targetRestDays : 30,
        targetGrazingDays: editingPaddock.targetGrazingDays !== undefined ? editingPaddock.targetGrazingDays : 3,
        lastRestStartDate: editingPaddock.lastRestStartDate || new Date().toISOString().split('T')[0],
        entryDate: editingPaddock.entryDate || '',
        shadeQuality: editingPaddock.shadeQuality || 'Buena',
        fencingType: editingPaddock.fencingType || 'Eléctrica',
        notes: editingPaddock.notes || '',
      });
    } else {
      setFormData({
        name: '',
        areaHa: '',
        pastureType: PASTURE_TYPES[0],
        customPasture: '',
        waterSource: WATER_SOURCES[0],
        customWater: '',
        status: 'descanso',
        currentBatchName: '',
        targetRestDays: 30,
        targetGrazingDays: 3,
        lastRestStartDate: new Date().toISOString().split('T')[0],
        entryDate: '',
        shadeQuality: 'Buena',
        fencingType: 'Eléctrica',
        notes: '',
      });
    }
  }, [editingPaddock, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Si cambia a ocupado y no tiene fecha de entrada, asignar hoy
      if (field === 'status' && value === 'ocupado' && !next.entryDate) {
        next.entryDate = new Date().toISOString().split('T')[0];
      }
      // Si cambia a descanso y no tiene fecha de descanso, asignar hoy
      if (field === 'status' && value === 'descanso' && !next.lastRestStartDate) {
        next.lastRestStartDate = new Date().toISOString().split('T')[0];
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre o número para el potrero.');
      return;
    }

    const finalPastureType = formData.pastureType === 'Otro' ? formData.customPasture.trim() : formData.pastureType;
    const finalWaterSource = formData.waterSource === 'Otro' ? formData.customWater.trim() : formData.waterSource;

    const payload = {
      ...(editingPaddock ? { id: editingPaddock.id } : {}),
      name: formData.name.trim(),
      areaHa: parseFloat(formData.areaHa) || 0,
      pastureType: finalPastureType || 'Sin especificar',
      waterSource: finalWaterSource || 'Sin especificar',
      status: formData.status,
      currentBatchName: formData.status === 'ocupado' ? formData.currentBatchName.trim() : '',
      targetRestDays: parseInt(formData.targetRestDays) || 30,
      targetGrazingDays: parseInt(formData.targetGrazingDays) || 3,
      lastRestStartDate: formData.status === 'descanso' ? formData.lastRestStartDate : (editingPaddock?.lastRestStartDate || ''),
      entryDate: formData.status === 'ocupado' ? formData.entryDate : '',
      shadeQuality: formData.shadeQuality,
      fencingType: formData.fencingType,
      notes: formData.notes.trim(),
    };

    try {
      setLoading(true);
      await onSavePaddock(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el potrero: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  const areaM2 = (parseFloat(formData.areaHa) || 0) * 10000;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPaddock ? `Editar Potrero: ${editingPaddock.name}` : 'Registrar Nuevo Potrero'}
      subtitle="Catálogo de potreros, pastos, fuentes de agua y descansos"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-200">
        
        {/* Identificación y Área */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre o Número del Potrero: *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej. Potrero 1 - La Represa"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Área (Hectáreas): *
              </label>
              {areaM2 > 0 && (
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  {areaM2.toLocaleString('es-CO')} m²
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.areaHa}
              onChange={(e) => handleChange('areaHa', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej. 2.5"
            />
          </div>

        </div>

        {/* Tipo de Pasto y Fuente de Agua */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tipo de Pasto / Forraje:</span>
            </label>
            <select
              value={formData.pastureType}
              onChange={(e) => handleChange('pastureType', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {PASTURE_TYPES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="Otro">Otro (Escribir personalizado)...</option>
            </select>
            {formData.pastureType === 'Otro' && (
              <input
                type="text"
                required
                value={formData.customPasture}
                onChange={(e) => handleChange('customPasture', e.target.value)}
                placeholder="Nombre de la pastura..."
                className="w-full mt-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Fuente de Agua / Bebedero:</span>
            </label>
            <select
              value={formData.waterSource}
              onChange={(e) => handleChange('waterSource', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {WATER_SOURCES.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
              <option value="Otro">Otro (Escribir personalizado)...</option>
            </select>
            {formData.waterSource === 'Otro' && (
              <input
                type="text"
                required
                value={formData.customWater}
                onChange={(e) => handleChange('customWater', e.target.value)}
                placeholder="Fuente de agua..."
                className="w-full mt-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            )}
          </div>

        </div>

        {/* Estado y Lote Activo */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estado Actual del Potrero:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PADDOCK_STATUSES.map(s => {
                  const isSelected = formData.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleChange('status', s.value)}
                      className={`p-2 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? s.value === 'descanso'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : s.value === 'ocupado'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                              : 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{s.value === 'descanso' ? '🟢 Descanso' : s.value === 'ocupado' ? '🔴 Ocupado' : '🟡 Mantenim.'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lote actual si está ocupado */}
            {formData.status === 'ocupado' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lote / Grupo que lo Pastorea:
                </label>
                <input
                  type="text"
                  value={formData.currentBatchName}
                  onChange={(e) => handleChange('currentBatchName', e.target.value)}
                  list="modal-batches-list"
                  placeholder="Ej. Lote Machos Ceba"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
                <datalist id="modal-batches-list">
                  {activeBatches.map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            ) : formData.status === 'descanso' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Inicio del Descanso:
                </label>
                <input
                  type="date"
                  value={formData.lastRestStartDate}
                  onChange={(e) => handleChange('lastRestStartDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de Mantenimiento:
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Ej. Guadaña, siembra, control de maleza..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

        </div>

        {/* Metas de Rotación: Días de Descanso y Días de Ocupación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Días Meta de Descanso (Reposo):</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="120"
                value={formData.targetRestDays}
                onChange={(e) => handleChange('targetRestDays', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 absolute right-3 top-2 font-bold">días</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Tiempo para rebrote y recuperación óptima (común: 28-35 días).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Días Meta de Pastoreo (Ocupación):</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="30"
                value={formData.targetGrazingDays}
                onChange={(e) => handleChange('targetGrazingDays', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 absolute right-3 top-2 font-bold">días</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Periodo máximo recomendado para evitar sobrepastoreo (1-4 días).
            </p>
          </div>

        </div>

        {/* Infraestructura: Sombra y Cerca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Sombra y Árboles:</span>
            </label>
            <select
              value={formData.shadeQuality}
              onChange={(e) => handleChange('shadeQuality', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="Excelente">Excelente (Bosquete / Silvopastoril denso)</option>
              <option value="Buena">Buena (Árboles dispersos con sombra fresca)</option>
              <option value="Regular">Regular (Pocos árboles en linderos)</option>
              <option value="Sin Sombra">Sin Sombra (Cielo abierto total)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tipo de Cerca:</span>
            </label>
            <select
              value={formData.fencingType}
              onChange={(e) => handleChange('fencingType', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="Eléctrica">Cerca Eléctrica (1 ó 2 hilos)</option>
              <option value="Púa Tradicional">Alambre de Púa Tradicional</option>
              <option value="Malla / Mixta">Malla Ganadera / Mixta</option>
              <option value="Cerca Viva">Cerca Viva (Matarratón / Limoncillo)</option>
            </select>
          </div>

        </div>

        {/* Notas Generales */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Notas u Observaciones:
          </label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="Topografía ondulada, bebedero con flotador nuevo, fertilizado con urea en mayo..."
          />
        </div>

        {/* Footer Actions */}
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
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Guardando...' : editingPaddock ? 'Guardar Cambios' : 'Registrar Potrero'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
