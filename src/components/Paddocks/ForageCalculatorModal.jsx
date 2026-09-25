import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { calculateForageCapacity } from '../../types/paddocks';
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
  Info
} from 'lucide-react';

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
  const [cuttingWeightKg, setCuttingWeightKg] = useState(1.8);
  const [usablePercentage, setUsablePercentage] = useState(70);
  const [animalCount, setAnimalCount] = useState(25);
  const [avgAnimalWeightKg, setAvgAnimalWeightKg] = useState(380);
  const [consumptionRate, setConsumptionRate] = useState(10);
  const [showExplanation, setShowExplanation] = useState(false);

  // Sincronizar cuando cambia selectedPaddock
  useEffect(() => {
    if (selectedPaddock) {
      setPaddockId(selectedPaddock.id);
      setAreaHa(selectedPaddock.areaHa || 1);
    }
  }, [selectedPaddock]);

  // Manejar cambio de selector de potrero
  const handlePaddockSelect = (id) => {
    setPaddockId(id);
    if (id === 'custom') return;
    const found = paddocks.find(p => String(p.id) === String(id));
    if (found) {
      setAreaHa(found.areaHa || 1);
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

  const results = calculateForageCapacity({
    areaHa,
    cuttingWeightKg,
    usablePercentage,
    animalCount,
    avgAnimalWeightKg,
    consumptionRate,
  });

  const areaM2 = (parseFloat(areaHa) || 0) * 10000;
  // Unidades Gran Ganado (UGM = 450 kg)
  const totalLiveWeightKg = (parseInt(animalCount) || 0) * (parseFloat(avgAnimalWeightKg) || 0);
  const totalUGM = Math.round((totalLiveWeightKg / 450) * 10) / 10;
  const ugmPerHa = areaHa > 0 ? Math.round((totalUGM / areaHa) * 10) / 10 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calculadora de Aforo 1m² & Capacidad de Pastoreo"
      subtitle="Zootecnia y pastoreo rotacional de precisión"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        
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
                Pesa el pasto cortado a la altura de consumo dentro de un marco de 1m² para predecir con exactitud científica cuántos días de comida tiene tu lote.
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

        {/* Guía desplegable de cómo hacer el aforo */}
        {showExplanation && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 animate-fadeIn">
            <h5 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🌾</span> Pasos para un aforo representativo en potrero:
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <li>Lanza un marco de tubo PVC o madera de <strong>1m × 1m (1 m²)</strong> en 3 a 5 puntos del potrero (zonas altas, medias y bajas).</li>
              <li>Corta el pasto dentro del marco simulando el pastoreo del animal (dejando el remanente adecuado de 10-15 cm).</li>
              <li>Pesa el forraje cortado en una balanza o báscula de mano y saca el promedio en <strong>kg/m²</strong> (usualmente 1.2 a 2.5 kg/m²).</li>
              <li>Ingresa ese promedio en la casilla inferior para obtener los días de pastoreo exactos.</li>
            </ol>
          </div>
        )}

        {/* Formulario de Parámetros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Lado 1: Potrero y Pasto */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Datos del Potrero & Pastura
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
                  (Rango común: 1.0 - 3.0 kg)
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

            {/* % Aprovechable */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Forraje Aprovechable (%):
                </label>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {usablePercentage}% (Piso y pisoteo: {100 - usablePercentage}%)
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={usablePercentage}
                onChange={(e) => setUsablePercentage(e.target.value)}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

          </div>

          {/* Lado 2: Carga y Consumo de los Animales */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Lote & Consumo Diario
              </span>
            </div>

            {/* Cantidad de Cabezas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Número de Cabezas en el Lote:
              </label>
              <input
                type="number"
                min="1"
                value={animalCount}
                onChange={(e) => setAnimalCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Ej. 30"
              />
            </div>

            {/* Peso Promedio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso Promedio por Animal (kg):
              </label>
              <input
                type="number"
                min="50"
                step="5"
                value={avgAnimalWeightKg}
                onChange={(e) => setAvgAnimalWeightKg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Ej. 380"
              />
            </div>

            {/* Tasa de Consumo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tasa de Consumo Diario (% Peso Vivo):
                </label>
                <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                  {consumptionRate}% ({results.dailyPerAnimalKg} kg verde/animal/día)
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="15"
                step="0.5"
                value={consumptionRate}
                onChange={(e) => setConsumptionRate(e.target.value)}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>8% (Cría/Mantenimiento)</span>
                <span>10% (Ceba estándar)</span>
                <span>12-14% (Lechería)</span>
              </div>
            </div>

            {/* Indicador de UGM */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Carga Instantánea:</span>
              <span className="font-black text-slate-900 dark:text-white">
                {totalUGM} UGM • <strong className="text-emerald-600 dark:text-emerald-400">{ugmPerHa} UGM/ha</strong>
              </span>
            </div>

          </div>

        </div>

        {/* TARJETAS DE RESULTADOS */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white shadow-xl space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Resultado del Aforo & Capacidad
            </span>
            <span className="text-[11px] font-bold text-emerald-200/80">
              Forraje Verde Neto: {results.usableForageKg.toLocaleString('es-CO')} kg
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-[11px] text-emerald-200 block font-medium">Forraje Total Potrero</span>
              <p className="text-base sm:text-lg font-black text-white mt-0.5">
                {results.totalForageKg.toLocaleString('es-CO')} <span className="text-xs font-normal">kg</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-[11px] text-emerald-200 block font-medium">Forraje Aprovechable</span>
              <p className="text-base sm:text-lg font-black text-emerald-300 mt-0.5">
                {results.usableForageKg.toLocaleString('es-CO')} <span className="text-xs font-normal">kg</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-[11px] text-emerald-200 block font-medium">Consumo Lote / Día</span>
              <p className="text-base sm:text-lg font-black text-white mt-0.5">
                {results.dailyTotalBatchKg.toLocaleString('es-CO')} <span className="text-xs font-normal">kg/día</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/25 border-2 border-emerald-400 backdrop-blur-sm">
              <span className="text-[11px] text-emerald-100 block font-black uppercase tracking-wide">Días de Pastoreo</span>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {results.grazingDays} <span className="text-xs font-bold text-emerald-200">{results.grazingDays === 1 ? 'día' : 'días'}</span>
              </p>
            </div>

          </div>

          {/* Recomendación Zootécnica de Manejo */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs">
            {results.grazingDays > 5 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-100">
                  <strong>Recomendación:</strong> {results.grazingDays} días es un periodo de ocupación algo prolongado para un solo potrero. Se aconseja colocar una cerca eléctrica divisoria para evitar sobrepastoreo y permitir que el pasto rebrote sin ser recomido.
                </p>
              </>
            ) : results.grazingDays < 1 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-rose-100">
                  <strong>Recomendación:</strong> La carga es demasiado alta para el forraje disponible (menos de 1 día). Considera reducir el lote o suplementar con silo/sal proteica.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-emerald-100">
                  <strong>Pastoreo Óptimo:</strong> {results.grazingDays} días permite una ocupación rotacional ideal de alta eficiencia. Permite que el lote coma el forraje tierno y rote antes de que los rebrotes inicien (día 4-5).
                </p>
              </>
            )}
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
                onApplyGrazingDays(paddockId, Math.max(1, Math.round(results.grazingDays)));
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar {Math.max(1, Math.round(results.grazingDays))} Días Meta a este Potrero</span>
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
}
