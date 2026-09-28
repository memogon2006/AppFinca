import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  calculatePaddockCapacity, 
  getPastureDefaultAforo,
  PASTURE_TYPES
} from '../../types/paddocks';
import { 
  Calculator, 
  Scale, 
  Leaf, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  Info,
  Boxes,
  Calendar,
  Zap
} from 'lucide-react';
import { getLocalDateString } from '../../services/calculations';

export function ForageCalculatorModal({
  isOpen,
  onClose,
  paddocks = [],
  selectedPaddock = null,
  cattle = [],
  onApplyGrazingDays = null
}) {
  const [paddockId, setPaddockId] = useState(selectedPaddock?.id || 'custom');
  const [areaHa, setAreaHa] = useState(selectedPaddock?.areaHa || 1);
  const [pastureType, setPastureType] = useState(selectedPaddock?.pastureType || PASTURE_TYPES[0]);
  const [cuttingWeightKg, setCuttingWeightKg] = useState(1.8);
  const [usablePercentage, setUsablePercentage] = useState(70);
  const [targetRestDays, setTargetRestDays] = useState(30);
  const [targetGrazingDays, setTargetGrazingDays] = useState(3);
  const [animalCount, setAnimalCount] = useState(25);
  const [avgAnimalWeightKg, setAvgAnimalWeightKg] = useState(380);
  const [consumptionRate, setConsumptionRate] = useState(10);
  const [entryDate, setEntryDate] = useState(getLocalDateString());
  const [showExplanation, setShowExplanation] = useState(false);

  // Sincronizar cuando cambia selectedPaddock
  useEffect(() => {
    if (selectedPaddock) {
      setPaddockId(selectedPaddock.id);
      setAreaHa(selectedPaddock.areaHa || 1);
      if (selectedPaddock.pastureType) {
        setPastureType(selectedPaddock.pastureType);
        const pDef = getPastureDefaultAforo(selectedPaddock.pastureType);
        setCuttingWeightKg(selectedPaddock.cuttingWeightKg || pDef.avgCuttingKg || 1.8);
      }
      if (selectedPaddock.targetRestDays) {
        setTargetRestDays(selectedPaddock.targetRestDays);
      }
      if (selectedPaddock.targetGrazingDays) {
        setTargetGrazingDays(selectedPaddock.targetGrazingDays);
      }
      if (selectedPaddock.entryDate) {
        setEntryDate(selectedPaddock.entryDate);
      }
    }
  }, [selectedPaddock]);

  // Manejar cambio de selector de potrero
  const handlePaddockSelect = (id) => {
    setPaddockId(id);
    if (id === 'custom') return;
    const found = paddocks.find(p => String(p.id) === String(id));
    if (found) {
      setAreaHa(found.areaHa || 1);
      if (found.pastureType) {
        setPastureType(found.pastureType);
        const pDef = getPastureDefaultAforo(found.pastureType);
        setCuttingWeightKg(found.cuttingWeightKg || pDef.avgCuttingKg || 1.8);
      }
      if (found.targetRestDays) {
        setTargetRestDays(found.targetRestDays);
      }
      if (found.targetGrazingDays) {
        setTargetGrazingDays(found.targetGrazingDays);
      }
      // Si el potrero tiene lote asignado, autocompletar cabezas y peso si hay ganado
      if (found.currentBatchName) {
        const batchAnimals = cattle.filter(c => 
          (c.entryBatch === found.currentBatchName || c.paddock === found.name) && 
          c.status === 'Activo'
        );
        if (batchAnimals.length > 0) {
          setAnimalCount(batchAnimals.length);
          const totalWeight = batchAnimals.reduce((acc, c) => acc + (parseFloat(c.currentWeight || c.entryWeight) || 350), 0);
          setAvgAnimalWeightKg(Math.round(totalWeight / batchAnimals.length));
        }
      }
    }
  };

  const results = useMemo(() => {
    return calculatePaddockCapacity({
      areaHa,
      pastureType,
      cuttingWeightKg,
      usablePercentage,
      targetRestDays,
      targetGrazingDays,
      animalCount,
      avgAnimalWeightKg,
      consumptionRate,
      entryDate,
    });
  }, [
    areaHa,
    pastureType,
    cuttingWeightKg,
    usablePercentage,
    targetRestDays,
    targetGrazingDays,
    animalCount,
    avgAnimalWeightKg,
    consumptionRate,
    entryDate
  ]);

  const areaM2 = (parseFloat(areaHa) || 0) * 10000;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calculadora de Aforo 1m² & Capacidad de Pastoreo"
      subtitle="Zootecnia y pastoreo rotacional de precisión"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        
        {/* Banner explicativo rápido */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                Aforo en Marco Cuadrado (1 metro × 1 metro)
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                Calcula cuántos animales puedes meter y los días de pastoreo exactos antes de que comience el rebrote.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showExplanation ? 'Ocultar guía' : '¿Cómo se afora?'}</span>
          </button>
        </div>

        {/* Guía desplegable */}
        {showExplanation && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 animate-fadeIn">
            <h5 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🌾</span> Pasos para un aforo representativo en potrero:
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <li>Lanza un marco de tubo PVC o madera de <strong>1m × 1m (1 m²)</strong> en 3 a 5 puntos del potrero (zonas representativas).</li>
              <li>Corta el pasto dentro del marco simulando el pastoreo del animal (dejando el remanente adecuado de 10-15 cm).</li>
              <li>Pesa el forraje cortado en una balanza o báscula de mano y saca el promedio en <strong>kg/m²</strong> (usualmente 1.2 a 2.5 kg/m²).</li>
              <li>Ingresa ese promedio en la casilla inferior para obtener los días de pastoreo exactos.</li>
            </ol>
          </div>
        )}

        {/* Formulario de Parámetros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Lado 1: Potrero y Pasto */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Potrero & Aforo de Pastura
              </span>
            </div>

            {/* Selector de Potrero existente */}
            {paddocks.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cargar desde Potrero Registrado:
                </label>
                <select
                  value={paddockId}
                  onChange={(e) => handlePaddockSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="custom">-- Medida Manual / Personalizada --</option>
                  {paddocks.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.areaHa} ha • {p.pastureType || 'Pasto'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Área en Hectáreas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Área del Potrero (Hectáreas):
                </label>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  {areaM2.toLocaleString('es-CO')} m²
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={areaHa}
                onChange={(e) => setAreaHa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. 1.5"
              />
            </div>

            {/* Peso Cortado en 1m2 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Peso Cortado por M² (kg/m²):
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  (Común: 1.2 - 2.8 kg)
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={cuttingWeightKg}
                onChange={(e) => setCuttingWeightKg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. 1.8"
              />
            </div>

            {/* % Aprovechable y Días de Descanso Deseados */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Aprovechable (%):
                </label>
                <input
                  type="number"
                  min="40"
                  max="95"
                  value={usablePercentage}
                  onChange={(e) => setUsablePercentage(Math.max(40, Math.min(95, parseInt(e.target.value) || 70)))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descanso Deseado:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={targetRestDays}
                    onChange={(e) => setTargetRestDays(Math.max(5, parseInt(e.target.value) || 30))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2.5 top-2 font-bold">días</span>
                </div>
              </div>
            </div>

          </div>

          {/* Lado 2: Carga y Consumo de los Animales */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Lote, Pesos & Días Meta
              </span>
            </div>

            {/* Cantidad de Cabezas y Peso Promedio */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cabezas en el Lote:
                </label>
                <input
                  type="number"
                  min="1"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej. 30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Peso Promedio (kg):
                </label>
                <input
                  type="number"
                  min="50"
                  step="5"
                  value={avgAnimalWeightKg}
                  onChange={(e) => setAvgAnimalWeightKg(Math.max(50, parseFloat(e.target.value) || 380))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej. 380"
                />
              </div>
            </div>

            {/* Días Meta de Pastoreo deseados */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ocupación Meta Deseada:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={targetGrazingDays}
                    onChange={(e) => setTargetGrazingDays(Math.max(1, parseInt(e.target.value) || 3))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-3 top-2 font-bold">días</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Entrada:
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Indicador de UGM y Carga */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Carga Instantánea:</span>
              <span className="font-black text-slate-900 dark:text-white">
                {results.totalUGM} UGM • <strong className="text-emerald-600 dark:text-emerald-400">{results.ugmPerHa} UGM/ha</strong>
              </span>
            </div>

          </div>

        </div>

        {/* ===================================================================== */}
        {/* TARJETAS DE RESULTADOS ZOOTÉCNICOS COMPLETOS */}
        {/* ===================================================================== */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Diagnóstico Zootécnico del Potrero
            </span>
            <span className="text-[11px] font-bold text-emerald-200">
              Forraje Neto Disponible: <strong>{results.usableForageKg.toLocaleString('es-CO')} kg</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            
            {/* 1. Capacidad Máxima */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-emerald-300 uppercase font-black tracking-wide">
                1. ¿Cuántos Animales Caben?
              </span>
              <div className="my-1">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {results.maxAnimalsForTargetStay} <span className="text-xs font-bold text-emerald-300">cabezas</span>
                </p>
                <p className="text-[10px] text-emerald-200 font-semibold">
                  (~{results.maxUGMForTargetStay} UGM)
                </p>
              </div>
              <span className="text-[10px] text-slate-300">
                Para pastorear <strong>{targetGrazingDays} días meta</strong>
              </span>
            </div>

            {/* 2. Días de Ocupación Reales */}
            <div className="p-3.5 rounded-xl bg-emerald-500/25 border-2 border-emerald-400 backdrop-blur-sm flex flex-col justify-between">
              <span className="text-[10px] text-emerald-100 uppercase font-black tracking-wide">
                2. Días de Ocupación Lote ({animalCount} cab.)
              </span>
              <div className="my-1">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {results.idealGrazingDays} <span className="text-xs font-bold text-emerald-200">{results.idealGrazingDays === 1 ? 'día' : 'días'}</span>
                </p>
                {results.suggestedExitDate && (
                  <p className="text-[10px] text-emerald-200 font-bold">
                    Rotar el: {results.suggestedExitDate}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-emerald-100">
                Consumo lote: {results.dailyTotalBatchKg.toLocaleString('es-CO')} kg/día
              </span>
            </div>

            {/* 3. Circuito Rotacional Requerido */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-teal-300 uppercase font-black tracking-wide">
                3. Circuito para Descanso ({targetRestDays}d)
              </span>
              <div className="my-1">
                <p className="text-2xl sm:text-3xl font-black text-teal-300">
                  {results.paddocksNeededInCircuit} <span className="text-xs font-bold text-white">potreros</span>
                </p>
                <p className="text-[10px] text-slate-300">
                  (Fórmula: TD/TO + 1)
                </p>
              </div>
              <span className="text-[10px] text-slate-300">
                Rotación continua sin degradación
              </span>
            </div>

          </div>

          {/* Recomendación Zootécnica */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-emerald-100">
              <strong>Manejo Recomendado:</strong> {results.evaluation.summary}
            </p>
          </div>

        </div>

        {/* Botones del Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar Calculadora
          </button>

          {onApplyGrazingDays && paddockId !== 'custom' && (
            <button
              type="button"
              onClick={() => {
                onApplyGrazingDays(paddockId, Math.max(1, Math.round(results.idealGrazingDays)));
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Fijar {Math.max(1, Math.round(results.idealGrazingDays))} Días Meta de Pastoreo al Potrero</span>
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
}
