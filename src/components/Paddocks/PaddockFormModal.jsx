import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  PASTURE_TYPES, 
  WATER_SOURCES, 
  PADDOCK_STATUSES,
  getPastureDefaultAforo,
  calculatePaddockCapacity
} from '../../types/paddocks';
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
  Zap,
  Calculator,
  Scale,
  Sparkles,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { getLocalDateString, formatCurrency } from '../../services/calculations';

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
    lastRestStartDate: getLocalDateString(),
    entryDate: '',
    shadeQuality: 'Buena',
    fencingType: 'Eléctrica',
    cuttingWeightKg: '',
    usablePercentage: 70,
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  // Estados interactivos para cálculo de aforo y simulación de carga
  const [showAdvancedAforo, setShowAdvancedAforo] = useState(false);
  const [customAforoKg, setCustomAforoKg] = useState('');
  const [customUsablePct, setCustomUsablePct] = useState(70);
  const [simulatedAnimalCount, setSimulatedAnimalCount] = useState(25);
  const [simulatedAvgWeight, setSimulatedAvgWeight] = useState(380);
  const [circuitPaddocksCount, setCircuitPaddocksCount] = useState(3);
  const [showCircuitSchedule, setShowCircuitSchedule] = useState(false);

  // Obtener lotes activos existentes
  const activeBatches = useMemo(() => {
    return Array.from(new Set(
      cattle
        .filter(c => c.status === 'Activo' && (c.entryBatch || c.paddock))
        .map(c => c.entryBatch || c.paddock)
    )).filter(Boolean);
  }, [cattle]);

  // Peso promedio del hato
  const herdAvgWeight = useMemo(() => {
    const active = cattle.filter(c => c.status === 'Activo');
    if (active.length === 0) return 380;
    const total = active.reduce((sum, c) => sum + (parseFloat(c.currentWeight || c.entryWeight) || 380), 0);
    return Math.round(total / active.length);
  }, [cattle]);

  useEffect(() => {
    if (editingPaddock) {
      const isStandardPasture = PASTURE_TYPES.includes(editingPaddock.pastureType);
      const isStandardWater = WATER_SOURCES.includes(editingPaddock.waterSource);
      const pastureDefault = getPastureDefaultAforo(editingPaddock.pastureType);

      setFormData({
        name: editingPaddock.name || '',
        areaHa: editingPaddock.areaHa !== undefined ? editingPaddock.areaHa : '',
        pastureType: isStandardPasture ? editingPaddock.pastureType : 'Otro',
        customPasture: !isStandardPasture ? (editingPaddock.pastureType || '') : '',
        waterSource: isStandardWater ? editingPaddock.waterSource : 'Otro',
        customWater: !isStandardWater ? (editingPaddock.waterSource || '') : '',
        status: editingPaddock.status || 'descanso',
        currentBatchName: editingPaddock.currentBatchName || '',
        targetRestDays: editingPaddock.targetRestDays !== undefined ? editingPaddock.targetRestDays : pastureDefault.restDays || 30,
        targetGrazingDays: editingPaddock.targetGrazingDays !== undefined ? editingPaddock.targetGrazingDays : 3,
        lastRestStartDate: editingPaddock.lastRestStartDate || getLocalDateString(),
        entryDate: editingPaddock.entryDate || '',
        shadeQuality: editingPaddock.shadeQuality || 'Buena',
        fencingType: editingPaddock.fencingType || 'Eléctrica',
        cuttingWeightKg: editingPaddock.cuttingWeightKg || '',
        usablePercentage: editingPaddock.usablePercentage || 70,
        notes: editingPaddock.notes || '',
      });

      setCustomAforoKg(editingPaddock.cuttingWeightKg || '');
      setCustomUsablePct(editingPaddock.usablePercentage || 70);

      // Si tiene lote asignado, buscar cabezas y peso
      if (editingPaddock.currentBatchName) {
        const batchAnimals = cattle.filter(c => 
          (c.entryBatch === editingPaddock.currentBatchName || c.paddock === editingPaddock.name) && 
          c.status === 'Activo'
        );
        if (batchAnimals.length > 0) {
          setSimulatedAnimalCount(batchAnimals.length);
          const totalW = batchAnimals.reduce((acc, c) => acc + (parseFloat(c.currentWeight || c.entryWeight) || 380), 0);
          setSimulatedAvgWeight(Math.round(totalW / batchAnimals.length));
        }
      }
    } else {
      const defaultPasture = PASTURE_TYPES[0];
      const pastureDefault = getPastureDefaultAforo(defaultPasture);

      setFormData({
        name: '',
        areaHa: '',
        pastureType: defaultPasture,
        customPasture: '',
        waterSource: WATER_SOURCES[0],
        customWater: '',
        status: 'descanso',
        currentBatchName: '',
        targetRestDays: pastureDefault.restDays || 30,
        targetGrazingDays: 3,
        lastRestStartDate: getLocalDateString(),
        entryDate: '',
        shadeQuality: 'Buena',
        fencingType: 'Eléctrica',
        cuttingWeightKg: '',
        usablePercentage: 70,
        notes: '',
      });

      setCustomAforoKg('');
      setCustomUsablePct(70);
      setSimulatedAnimalCount(cattle.filter(c => c.status === 'Activo').length > 0 ? Math.min(30, cattle.filter(c => c.status === 'Activo').length) : 25);
      setSimulatedAvgWeight(herdAvgWeight);
    }
  }, [editingPaddock, isOpen, herdAvgWeight]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Si cambia a ocupado y no tiene fecha de entrada, asignar hoy
      if (field === 'status' && value === 'ocupado' && !next.entryDate) {
        next.entryDate = getLocalDateString();
      }
      // Si cambia a descanso y no tiene fecha de descanso, asignar hoy
      if (field === 'status' && value === 'descanso' && !next.lastRestStartDate) {
        next.lastRestStartDate = getLocalDateString();
      }
      // Si cambia el tipo de pasto y no tiene días de descanso personalizados, sugerir los de la especie
      if (field === 'pastureType' && value !== 'Otro') {
        const info = getPastureDefaultAforo(value);
        if (!editingPaddock || !editingPaddock.targetRestDays) {
          next.targetRestDays = info.restDays;
        }
      }
      return next;
    });
  };

  const handleBatchSelected = (batch) => {
    handleChange('currentBatchName', batch);
    if (batch) {
      const batchAnimals = cattle.filter(c => 
        (c.entryBatch === batch || c.paddock === batch || (editingPaddock && c.paddock === editingPaddock.name)) && 
        c.status === 'Activo'
      );
      if (batchAnimals.length > 0) {
        setSimulatedAnimalCount(batchAnimals.length);
        const totalW = batchAnimals.reduce((acc, c) => acc + (parseFloat(c.currentWeight || c.entryWeight) || 380), 0);
        setSimulatedAvgWeight(Math.round(totalW / batchAnimals.length));
      }
    }
  };

  // Cálculo Zootécnico Integral de Aforo y Capacidad en Tiempo Real
  const capacityResults = useMemo(() => {
    const area = parseFloat(formData.areaHa) || 0;
    const finalPastureType = formData.pastureType === 'Otro' ? formData.customPasture : formData.pastureType;
    const aforoKg = customAforoKg !== '' ? parseFloat(customAforoKg) : null;
    
    return calculatePaddockCapacity({
      areaHa: area,
      pastureType: finalPastureType,
      cuttingWeightKg: aforoKg,
      usablePercentage: customUsablePct,
      targetRestDays: formData.targetRestDays,
      targetGrazingDays: formData.targetGrazingDays,
      animalCount: simulatedAnimalCount,
      avgAnimalWeightKg: simulatedAvgWeight,
      consumptionRate: 10,
      entryDate: formData.entryDate || getLocalDateString(),
      availablePaddocksCount: circuitPaddocksCount,
    });
  }, [
    formData.areaHa, 
    formData.pastureType, 
    formData.customPasture, 
    customAforoKg, 
    customUsablePct, 
    formData.targetRestDays, 
    formData.targetGrazingDays, 
    simulatedAnimalCount, 
    simulatedAvgWeight, 
    formData.entryDate,
    circuitPaddocksCount
  ]);

  const defaultPastureAforo = useMemo(() => {
    return getPastureDefaultAforo(formData.pastureType);
  }, [formData.pastureType]);

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
      cuttingWeightKg: customAforoKg !== '' ? parseFloat(customAforoKg) : defaultPastureAforo.avgCuttingKg,
      usablePercentage: customUsablePct || 70,
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
      subtitle="Catálogo de potreros, pastos, aforo 1m² y rotación rotacional"
      maxWidth="max-w-3xl"
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
              min="0.01"
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

        {/* ========================================================================= */}
        {/* PANEL ZOOTÉCNICO: AFORO FORRAJERO, CAPACIDAD DE CARGA & ROTACIÓN EN VIVO */}
        {/* ========================================================================= */}
        {areaM2 > 0 && (
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-500/40 shadow-xl space-y-3.5 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>Aforo & Capacidad de Carga en Tiempo Real</span>
                  </h4>
                  <p className="text-[11px] text-emerald-300/90 font-medium">
                    Aforo base: <strong>{capacityResults.cuttingWeightKg} kg/m²</strong> • Forraje Neto: <strong>{capacityResults.usableForageKg.toLocaleString('es-CO')} kg</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedAforo(!showAdvancedAforo)}
                className="text-[11px] font-bold text-emerald-300 hover:text-white underline cursor-pointer self-start sm:self-auto"
              >
                {showAdvancedAforo ? 'Ocultar ajustes de aforo' : '⚙️ Ajustar kg/m² de aforo'}
              </button>
            </div>

            {/* Ajustes avanzados de aforo si se despliegan */}
            {showAdvancedAforo && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                    Aforo / Peso Cortado por M² (kg/m²):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    value={customAforoKg}
                    onChange={(e) => setCustomAforoKg(e.target.value)}
                    placeholder={`Por defecto: ${defaultPastureAforo.avgCuttingKg} kg`}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-emerald-500/40 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Promedio especie ({formData.pastureType}): {defaultPastureAforo.avgCuttingKg} kg/m²
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                    Forraje Aprovechable (%):
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="90"
                    value={customUsablePct}
                    onChange={(e) => setCustomUsablePct(Math.max(40, Math.min(95, parseInt(e.target.value) || 70)))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-emerald-500/40 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Piso/rechazo: {100 - customUsablePct}%
                  </span>
                </div>
              </div>
            )}

            {/* DOS PREGUNTAS CLAVE DEL GANADERO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* 1. ¿Cuántos animales podemos meter? */}
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-300 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>1. ¿Cuántos Animales Puedes Meter?</span>
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    Para pastorear <strong className="text-white">{formData.targetGrazingDays} días</strong> meta:
                  </p>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {capacityResults.maxAnimalsForTargetStay}
                    </span>
                    <span className="text-xs font-extrabold text-white">cabezas</span>
                    <span className="text-[11px] text-emerald-300/80 font-semibold">
                      (~{capacityResults.maxUGMForTargetStay} UGM)
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-white/10">
                  Consumo lote: {capacityResults.dailyPerAnimalKg} kg/día/animal ({simulatedAvgWeight} kg prom.).
                </p>
              </div>

              {/* 2. Días de ocupación si metemos N animales */}
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border-2 border-emerald-400/80 backdrop-blur-sm space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>2. Días de Ocupación con tu Lote</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-200 block">Animales en lote:</label>
                    <input
                      type="number"
                      min="1"
                      value={simulatedAnimalCount}
                      onChange={(e) => setSimulatedAnimalCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-400/60 text-white text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-200 block">Peso prom. (kg):</label>
                    <input
                      type="number"
                      min="50"
                      value={simulatedAvgWeight}
                      onChange={(e) => setSimulatedAvgWeight(Math.max(50, parseFloat(e.target.value) || 380))}
                      className="w-full px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-400/60 text-white text-xs font-black"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-400/30">
                  <span className="text-xs font-bold text-emerald-100">Ocupación ideal:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">{capacityResults.idealGrazingDays}</span>
                    <span className="text-xs font-extrabold text-emerald-200">días</span>
                  </div>
                </div>

                {/* Botón para sincronizar directamente los días calculados */}
                {capacityResults.idealGrazingDays > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('targetGrazingDays', Math.max(1, Math.round(capacityResults.idealGrazingDays)));
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>✓ Fijar {Math.max(1, Math.round(capacityResults.idealGrazingDays))} días como Meta de Pastoreo</span>
                  </button>
                )}
              </div>

            </div>

            {/* 3. SIMULADOR DEL CIRCUITO ROTACIONAL (CON N POTREROS) */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2.5 text-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-black text-white">
                    3. Simulación de tu Circuito Rotacional
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-emerald-200">
                    Tengo para rotar:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={circuitPaddocksCount}
                      onChange={(e) => setCircuitPaddocksCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-400/60 text-center font-black text-white text-xs focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-[11px] font-bold text-slate-300">potreros</span>
                  </div>
                </div>
              </div>

              {/* Métricas de la Rotación con N Potreros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Días / Potrero</span>
                  <span className="text-sm font-black text-white">{capacityResults.idealGrazingDays}d</span>
                </div>

                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Descanso Logrado</span>
                  <span className={`text-sm font-black ${
                    capacityResults.actualRestDaysAchieved >= formData.targetRestDays 
                      ? 'text-emerald-400' 
                      : capacityResults.actualRestDaysAchieved >= formData.targetRestDays * 0.75 
                        ? 'text-amber-400' 
                        : 'text-rose-400'
                  }`}>
                    {capacityResults.actualRestDaysAchieved}d
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    (meta: {formData.targetRestDays}d)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Vuelta Completa</span>
                  <span className="text-sm font-black text-teal-300">{capacityResults.cycleTotalDays}d</span>
                  <span className="text-[9px] text-slate-400 block">
                    ({circuitPaddocksCount} potreros)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Ideal Teórico</span>
                  <span className="text-sm font-black text-amber-300">
                    {capacityResults.paddocksNeededInCircuit} potreros
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    (para {formData.targetRestDays}d)
                  </span>
                </div>

              </div>

              {/* Mensaje de Diagnóstico del Circuito */}
              <div className={`p-2.5 rounded-lg border text-[11px] font-medium leading-relaxed ${
                capacityResults.circuitEvaluation.badgeVariant === 'emerald'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : capacityResults.circuitEvaluation.badgeVariant === 'amber'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}>
                <strong>{capacityResults.circuitEvaluation.label}:</strong> {capacityResults.circuitEvaluation.summary}
              </div>

              {/* Botón para ver Cronograma de Rotación */}
              {capacityResults.rotationSteps.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCircuitSchedule(!showCircuitSchedule)}
                    className="text-[10px] font-bold text-emerald-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showCircuitSchedule ? '▲ Ocultar cronograma de fechas' : `▼ Ver fechas de rotación para los ${circuitPaddocksCount} potreros`}</span>
                  </button>

                  {showCircuitSchedule && (
                    <div className="mt-2 p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1.5 animate-fadeIn">
                      <p className="text-[10px] font-bold text-slate-300 mb-1">
                        📅 Cronograma estimado del lote ({simulatedAnimalCount} animales):
                      </p>
                      <div className="space-y-1">
                        {capacityResults.rotationSteps.map((step) => (
                          <div key={step.paddockIndex} className="flex items-center justify-between text-[10px] py-0.5 border-b border-white/5 last:border-0">
                            <span className="font-bold text-emerald-300">{step.name}:</span>
                            <span className="text-slate-300">
                              Entrada: <strong>{step.entryDate}</strong> ➔ Salida: <strong>{step.exitDate}</strong> ({step.grazingDays}d)
                            </span>
                          </div>
                        ))}
                      </div>
                      {capacityResults.rotationSteps.length > 0 && (
                        <p className="text-[10px] text-emerald-400 font-bold pt-1 border-t border-white/10">
                          🔄 Reingreso a Potrero 1: {capacityResults.rotationSteps[capacityResults.rotationSteps.length - 1]?.exitDate} (con {capacityResults.actualRestDaysAchieved} días de descanso).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Consejo Zootécnico */}
            <div className="text-[11px] text-emerald-100/90 italic flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{capacityResults.evaluation.summary}</span>
            </div>

          </div>
        )}

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
                  onChange={(e) => handleBatchSelected(e.target.value)}
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
