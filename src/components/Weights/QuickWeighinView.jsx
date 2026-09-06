import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Scale, Zap, CheckCircle2, Search, Tag, Flame, Check, ArrowRight, AlertCircle, Calendar, Trash2, Sparkles } from 'lucide-react';
import { calculateWeightMetrics } from '../../services/calculations';

const DRAFT_WEIGHTS_KEY = 'bovina_quick_weights_draft';

export function QuickWeighinView({ 
  cattle = [], 
  weighings = [], 
  onSaveBatchWeighings, 
  onSaveBatch,
  onSelectAnimal,
  onNavigate 
}) {
  const saveBatchFn = onSaveBatchWeighings || onSaveBatch;
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  const dateInputRef = useRef(null);
  
  // La fecha SIEMPRE inicia vacía por solicitud explícita del usuario
  const [weighDate, setWeighDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  
  // Cargar borrador persistente de pesos para que nunca se borren
  const [weightsMap, setWeightsMap] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_WEIGHTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Mapa persistente de animales registrados exitosamente en esta sesión
  const [savedSuccessMap, setSavedSuccessMap] = useState({});
  const [saving, setSaving] = useState(false);

  // Sincronizar automáticamente los pesos en localStorage en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_WEIGHTS_KEY, JSON.stringify(weightsMap));
    } catch (e) {
      console.warn('Error guardando borrador de pesajes:', e);
    }
  }, [weightsMap]);

  // Lista única de Ingreso #
  const entryBatches = useMemo(() => {
    const set = new Set(activeCattle.map(c => c.entryBatch || c.paddock).filter(Boolean));
    return Array.from(set);
  }, [activeCattle]);

  const filteredActive = activeCattle.filter(c => {
    if (selectedBatch && (c.entryBatch || c.paddock) !== selectedBatch) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const batch = (c.entryBatch || c.paddock || '').toLowerCase();
      const tag = (c.tagNumber || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const brand = (c.ironBrand || '').toLowerCase();
      return tag.includes(q) || name.includes(q) || brand.includes(q) || batch.includes(q);
    }
    return true;
  });

  const handleWeightChange = (animalId, weightVal) => {
    setWeightsMap(prev => {
      const updated = { ...prev };
      if (weightVal === '' || weightVal === undefined) {
        delete updated[animalId];
      } else {
        updated[animalId] = weightVal;
      }
      return updated;
    });
  };

  const handleSaveSingle = async (animal) => {
    if (!weighDate || weighDate.trim() === '') {
      alert('⚠️ Se tiene que añadir fecha para continuar. Los pesos ingresados se mantendrán intactos.');
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
      return;
    }

    if (animal.entryDate && weighDate < animal.entryDate) {
      alert(`⚠️ La fecha del pesaje (${weighDate}) no puede ser anterior a la fecha de ingreso del animal ${animal.tagNumber} (${animal.entryDate}). Debe ser una fecha igual o posterior.`);
      return;
    }

    const wVal = parseFloat(weightsMap[animal.id]);
    if (!wVal || wVal <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0 kg');
      return;
    }

    if (!saveBatchFn) {
      alert('Error: Función de guardado no disponible');
      return;
    }

    try {
      setSaving(true);
      await saveBatchFn([{
        cattleId: animal.id,
        date: weighDate,
        weight: wVal,
        conditionScore: 3.5,
        notes: 'Pesaje rápido de báscula'
      }]);

      // Marcar en VERDE permanente en esta sesión y limpiar el input de borrador
      setSavedSuccessMap(prev => ({ ...prev, [animal.id]: wVal }));
      setWeightsMap(prev => {
        const next = { ...prev };
        delete next[animal.id];
        return next;
      });
    } catch (e) {
      alert('Error guardando pesaje: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllFilled = async () => {
    if (!weighDate || weighDate.trim() === '') {
      alert('⚠️ Se tiene que añadir fecha para continuar. Todos los pesos ingresados se mantendrán guardados.');
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
      return;
    }

    const invalidDates = Object.keys(weightsMap).filter(cattleId => {
      const wVal = parseFloat(weightsMap[cattleId]);
      if (!wVal || wVal <= 0) return false;
      const a = activeCattle.find(c => String(c.id) === String(cattleId));
      return a && a.entryDate && weighDate < a.entryDate;
    });

    if (invalidDates.length > 0) {
      const sample = activeCattle.find(c => String(c.id) === String(invalidDates[0]));
      alert(`⚠️ La fecha de pesaje (${weighDate}) no puede ser anterior a la fecha de ingreso del animal ${sample?.tagNumber || ''} (${sample?.entryDate || ''}). Por favor selecciona una fecha igual o posterior.`);
      return;
    }

    const batch = [];
    const savedIds = {};

    Object.keys(weightsMap).forEach(cattleId => {
      const wVal = parseFloat(weightsMap[cattleId]);
      if (wVal && wVal > 0) {
        batch.push({
          cattleId,
          date: weighDate,
          weight: wVal,
          conditionScore: 3.5,
          notes: 'Pesaje masivo de báscula'
        });
        savedIds[cattleId] = wVal;
      }
    });

    if (batch.length === 0) {
      alert('No has ingresado ningún peso nuevo todavía.');
      return;
    }

    if (!saveBatchFn) {
      alert('Error: Función de guardado no disponible');
      return;
    }

    try {
      setSaving(true);
      await saveBatchFn(batch);
      
      // Marcar en VERDE todos los registrados
      setSavedSuccessMap(prev => ({ ...prev, ...savedIds }));
      
      // Limpiar solo los que fueron guardados del borrador
      setWeightsMap(prev => {
        const next = { ...prev };
        Object.keys(savedIds).forEach(id => {
          delete next[id];
        });
        return next;
      });
    } catch (e) {
      alert('Error guardando pesajes: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('¿Deseas borrar todos los pesos que has escrito temporalmente en pantalla?')) {
      setWeightsMap({});
      try {
        localStorage.removeItem(DRAFT_WEIGHTS_KEY);
      } catch {}
    }
  };

  const filledCount = Object.values(weightsMap).filter(v => parseFloat(v) > 0).length;
  const savedCount = Object.keys(savedSuccessMap).length;
  const isDateMissing = !weighDate || weighDate.trim() === '';
  const isReadyToSaveAll = filledCount > 0 && !isDateMissing;

  return (
    <div className="space-y-5 sm:space-y-6">
      
      {/* Banner Báscula Rápida con Feedback de Color Dinámico */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 animate-bounce" />
            Modo Báscula / Chute en Tiempo Real
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            Pesaje Rápido por Lote
            {savedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">
                ✅ {savedCount} Registrados en Verde
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Digita los pesos del lote (amarillo). Selecciona la <strong>Fecha del Pesaje</strong> y al registrar cambiará a <strong>Verde</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-[11px] font-black text-amber-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Fecha del Pesaje * (Seleccionar)</span>
            </label>
            <input
              ref={dateInputRef}
              type="date"
              value={weighDate}
              onChange={(e) => setWeighDate(e.target.value)}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-extrabold border backdrop-blur-sm min-h-[42px] focus:outline-none transition ${
                isDateMissing 
                  ? 'bg-rose-500/30 border-rose-400 text-white ring-2 ring-rose-400 animate-pulse' 
                  : 'bg-emerald-500/30 text-white border-emerald-300 ring-2 ring-emerald-400/40'
              }`}
              required
            />
            {isDateMissing && (
              <span className="text-[10px] text-rose-300 font-bold block mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Se tiene que añadir fecha para continuar
              </span>
            )}
          </div>
          
          {/* BOTÓN GUARDAR TODO */}
          <button
            onClick={handleSaveAllFilled}
            disabled={saving}
            className={`self-end px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 min-h-[42px] cursor-pointer ${
              isReadyToSaveAll
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-xl shadow-emerald-500/40 ring-4 ring-emerald-300/40 scale-105 animate-pulse'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/30'
            }`}
            title={
              isReadyToSaveAll 
                ? '¡Listo! Guardar todos los pesajes' 
                : isDateMissing 
                  ? 'Se tiene que añadir fecha para continuar' 
                  : 'Ingresa pesos en los animales abajo'
            }
          >
            {isReadyToSaveAll ? <Sparkles className="w-4 h-4 text-slate-950 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Guardar Todo {filledCount > 0 ? `(${filledCount})` : ''}</span>
          </button>

          {filledCount > 0 && (
            <button
              onClick={handleClearDraft}
              className="self-end p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-rose-200 border border-white/20 text-xs transition cursor-pointer"
              title="Borrar borrador escrito en pantalla"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeCattle.length === 0 ? (
        <div className="custom-card p-8 sm:p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
          No hay bovinos activos para pesar. Registra animales en el inventario primero.
        </div>
      ) : (
        <>
          {/* Buscador, Filtro por Ingreso # y Contador de Memoria */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por arete, nombre, hierro o Ingreso #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 shadow-sm min-h-[44px]"
              />
            </div>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none min-h-[44px]"
            >
              <option value="">🏷️ Todos los Ingresos #</option>
              {entryBatches.map(b => (
                <option key={b} value={b}>Ingreso: {b}</option>
              ))}
            </select>

            {filledCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-black whitespace-nowrap shadow-sm">
                ✍️ {filledCount} pesos en amarillo (por registrar)
              </div>
            )}

            {savedCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-black whitespace-nowrap shadow-sm">
                ✅ {savedCount} registrados en verde
              </div>
            )}
          </div>

          {/* Grid de pesaje rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredActive.map(animal => {
              const animalWeighs = weighings.filter(w => w.cattleId === String(animal.id) || w.cattleId === animal.id);
              const wm = calculateWeightMetrics(animal, animalWeighs);
              const currentWeightInput = weightsMap[animal.id] || '';
              const newWeightNum = parseFloat(currentWeightInput) || 0;
              const hasTypedWeight = newWeightNum > 0;
              const gain = newWeightNum > 0 ? (newWeightNum - wm.currentWeight) : 0;
              const batch = animal.entryBatch || animal.paddock || 'Ingreso #1';
              
              // Verificar si fue registrado en esta sesión o si ya tiene pesaje en la fecha seleccionada
              const wasSavedInSession = savedSuccessMap[animal.id];
              const registeredWeight = wasSavedInSession || (weighDate && animalWeighs.find(w => w.date === weighDate)?.weight);
              const isRegistered = Boolean(registeredWeight);
              const isFatReady = animal.sex === 'Macho' && (newWeightNum >= 475 || wm.currentWeight >= 475);

              return (
                <div 
                  key={animal.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                    isRegistered
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 shadow-lg ring-2 ring-emerald-400/50' 
                      : hasTypedWeight
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/40'
                        : isFatReady
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Encabezado del animal */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {animal.tagNumber}
                        </span>
                        {animal.name && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            ({animal.name})
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                          {batch}
                        </span>
                        {isRegistered && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black animate-fade-in">
                            ✓ REGISTRADO
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Hierro: <strong className="text-slate-700 dark:text-slate-300">{animal.ironBrand || 'N/A'}</strong> • {animal.sex}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        {isRegistered ? 'Peso Registrado' : 'Peso Anterior'}
                      </span>
                      <span className={`text-xs font-black ${isRegistered ? 'text-emerald-600 dark:text-emerald-400 text-sm' : 'text-slate-700 dark:text-slate-300'}`}>
                        {isRegistered ? `${registeredWeight} kg` : `${wm.currentWeight} kg`}
                      </span>
                    </div>
                  </div>

                  {/* Input de Pesaje y Botón de Acción OK */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.5"
                          placeholder={isRegistered ? `Registrado: ${registeredWeight} kg` : "Nuevo peso (kg)"}
                          value={currentWeightInput}
                          onChange={(e) => handleWeightChange(animal.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveSingle(animal);
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-sm font-extrabold border bg-slate-50 dark:bg-slate-950/80 focus:outline-none transition-all ${
                            isRegistered
                              ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/30'
                              : hasTypedWeight 
                                ? 'border-amber-400 ring-2 ring-amber-400/40 text-amber-900 dark:text-amber-200 font-black' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          kg
                        </span>
                      </div>

                      {/* BOTÓN OK: AMARILLO SI ESTÁ PENDIENTE / VERDE SI SE REGISTRÓ */}
                      <button
                        onClick={() => handleSaveSingle(animal)}
                        disabled={saving || (!hasTypedWeight && !isRegistered)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                          isRegistered && !hasTypedWeight
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                            : !hasTypedWeight
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700/60 dark:text-amber-400/50 border border-amber-200 dark:border-amber-800/60 cursor-not-allowed opacity-60'
                              : isDateMissing
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md shadow-amber-400/40 scale-105 animate-bounce'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/30 scale-105'
                        }`}
                        title={
                          isRegistered && !hasTypedWeight
                            ? 'Pesaje ya registrado en verde'
                            : !hasTypedWeight
                              ? 'Digita un peso para activar'
                              : isDateMissing
                                ? 'Se tiene que añadir fecha para continuar'
                                : 'Guardar pesaje de este animal'
                        }
                      >
                        <Check className="w-4 h-4" />
                        <span>{isRegistered && !hasTypedWeight ? 'Listo' : 'OK'}</span>
                      </button>
                    </div>

                    {/* Indicador de Ganancia de Peso en Vivo */}
                    <div className="flex items-center justify-between text-[11px] min-h-[16px]">
                      {newWeightNum > 0 ? (
                        <div className={`font-bold flex items-center gap-1 ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          <span>Diferencia: {gain >= 0 ? `+${gain.toFixed(1)} kg` : `${gain.toFixed(1)} kg`}</span>
                        </div>
                      ) : isRegistered ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ¡Registrado en verde: {registeredWeight} kg!
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          GDP Histórico: {wm.averageDailyGain ? `${wm.averageDailyGain} kg/d` : '-'}
                        </span>
                      )}

                      {isFatReady && (
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5 text-[10px]">
                          <Flame className="w-3 h-3" /> Gordo
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
