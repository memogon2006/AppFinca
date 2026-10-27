import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  ArrowRightLeft, 
  Calendar, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Hash, 
  Plus, 
  X, 
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users
} from 'lucide-react';
import { formatDate, getLocalDateString } from '../../services/calculations';

export function RotateBatchModal({
  isOpen,
  onClose,
  paddocks = [],
  cattle = [],
  initialFromPaddockId = null,
  onConfirmRotation
}) {
  // Modo de selección de animales: 'by_tags' (Por número de animal/arete) o 'by_quantity' (Por cantidad de animales)
  const [mode, setMode] = useState('by_tags');
  const [fromPaddockId, setFromPaddockId] = useState(initialFromPaddockId || '');
  const [toPaddockId, setToPaddockId] = useState('');
  const [batchName, setBatchName] = useState(''); // Opcional
  const [directAnimalCount, setDirectAnimalCount] = useState(''); // Obligatorio en modo cantidad
  const [selectedAnimals, setSelectedAnimals] = useState([]); // Array de objetos animal en modo aretes
  
  // Controles de búsqueda y agregado de aretes
  const [tagSearch, setTagSearch] = useState('');
  const [pasteTagsInput, setPasteTagsInput] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [showBrowseList, setShowBrowseList] = useState(false);

  const [rotationDate, setRotationDate] = useState(getLocalDateString());
  const [updateCattleLocation, setUpdateCattleLocation] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Bovinos activos en la finca
  const activeCattle = useMemo(() => {
    return cattle.filter(c => c.status === 'Activo');
  }, [cattle]);

  // Lista de nombres de lotes existentes para autocompletado opcional
  const existingBatches = useMemo(() => {
    return Array.from(new Set(
      activeCattle.map(c => c.entryBatch || c.paddock).filter(Boolean)
    ));
  }, [activeCattle]);

  const originPaddock = useMemo(() => {
    return paddocks.find(p => String(p.id) === String(fromPaddockId));
  }, [paddocks, fromPaddockId]);

  const destPaddock = useMemo(() => {
    return paddocks.find(p => String(p.id) === String(toPaddockId));
  }, [paddocks, toPaddockId]);

  // Animales activos que están actualmente en el potrero origen
  const originPaddockAnimals = useMemo(() => {
    if (!originPaddock) return [];
    return activeCattle.filter(c => 
      c.paddock === originPaddock.name || 
      (originPaddock.currentBatchName && c.entryBatch === originPaddock.currentBatchName)
    );
  }, [originPaddock, activeCattle]);

  // Inicializar potrero origen si viene por prop
  useEffect(() => {
    if (initialFromPaddockId) {
      handleFromPaddockChange(String(initialFromPaddockId));
    }
  }, [initialFromPaddockId]);

  // Al cambiar el potrero origen, precargar sus animales y cantidad
  const handleFromPaddockChange = (id) => {
    setFromPaddockId(id);
    if (!id || id === 'none') {
      return;
    }
    const origin = paddocks.find(p => String(p.id) === String(id));
    if (!origin) return;

    if (origin.currentBatchName) {
      setBatchName(origin.currentBatchName);
    }

    const matched = activeCattle.filter(c => 
      c.paddock === origin.name || 
      (origin.currentBatchName && c.entryBatch === origin.currentBatchName)
    );

    if (matched.length > 0) {
      setSelectedAnimals(matched);
      setDirectAnimalCount(matched.length);
    } else if (origin.currentAnimalCount > 0) {
      setDirectAnimalCount(origin.currentAnimalCount);
    }
  };

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

  // Agregar animal individual a la lista de seleccionados
  const handleAddAnimal = (animal) => {
    if (!animal) return;
    if (selectedAnimals.some(a => String(a.id) === String(animal.id))) return;
    setSelectedAnimals(prev => [...prev, animal]);
    setTagSearch('');
  };

  // Quitar animal de la lista de seleccionados
  const handleRemoveAnimal = (animalId) => {
    setSelectedAnimals(prev => prev.filter(a => String(a.id) !== String(animalId)));
  };

  // Cargar animales del potrero origen con 1 clic
  const handleLoadOriginAnimals = () => {
    if (originPaddockAnimals.length > 0) {
      setSelectedAnimals(originPaddockAnimals);
      setDirectAnimalCount(originPaddockAnimals.length);
    }
  };

  // Agregar múltiples aretes pegados o escritos separados por coma o espacio
  const handleAddPastedTags = () => {
    if (!pasteTagsInput.trim()) return;
    const rawTags = pasteTagsInput
      .split(/[\s,;\n]+/)
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);

    const newToAdd = [];
    rawTags.forEach(tagStr => {
      // Buscar en activeCattle por número de arete
      const found = activeCattle.find(c => 
        String(c.tagNumber).trim().toUpperCase() === tagStr
      );
      if (found) {
        if (!selectedAnimals.some(a => String(a.id) === String(found.id)) && 
            !newToAdd.some(a => String(a.id) === String(found.id))) {
          newToAdd.push(found);
        }
      } else {
        // Si el arete no está registrado en la base de datos, creamos una referencia ligera
        const placeholderId = `custom-tag-${tagStr}-${Date.now()}`;
        if (!selectedAnimals.some(a => String(a.tagNumber).toUpperCase() === tagStr) &&
            !newToAdd.some(a => String(a.tagNumber).toUpperCase() === tagStr)) {
          newToAdd.push({
            id: placeholderId,
            tagNumber: tagStr,
            category: 'Ganado sin ficha',
            currentWeight: 380,
            isCustomTag: true
          });
        }
      }
    });

    if (newToAdd.length > 0) {
      setSelectedAnimals(prev => [...prev, ...newToAdd]);
    }
    setPasteTagsInput('');
    setShowPasteBox(false);
  };

  // Sugerencias de búsqueda de aretes
  const searchSuggestions = useMemo(() => {
    if (!tagSearch.trim()) return [];
    const q = tagSearch.trim().toLowerCase();
    return activeCattle
      .filter(c => {
        const notSelected = !selectedAnimals.some(a => String(a.id) === String(c.id));
        const matchTag = String(c.tagNumber || '').toLowerCase().includes(q);
        const matchCategory = String(c.category || '').toLowerCase().includes(q);
        return notSelected && (matchTag || matchCategory);
      })
      .slice(0, 8);
  }, [tagSearch, activeCattle, selectedAnimals]);

  // Conteo efectivo de animales
  const effectiveAnimalCount = mode === 'by_tags' 
    ? selectedAnimals.length 
    : (parseInt(directAnimalCount, 10) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toPaddockId || toPaddockId === 'none') {
      alert('Por favor selecciona el potrero destino para rotar los animales.');
      return;
    }
    if (fromPaddockId && fromPaddockId === toPaddockId) {
      alert('El potrero origen y el potrero destino no pueden ser el mismo.');
      return;
    }
    if (effectiveAnimalCount <= 0) {
      alert('Es obligatorio indicar cuántos animales rotan. Puedes seleccionar los números de animal o ingresar la cantidad total.');
      return;
    }

    try {
      setLoading(true);
      const selectedAnimalIds = selectedAnimals
        .filter(a => !a.isCustomTag)
        .map(a => a.id);
      
      const selectedTagNumbers = mode === 'by_tags'
        ? selectedAnimals.map(a => a.tagNumber)
        : [];

      await onConfirmRotation({
        fromPaddockId: fromPaddockId || 'none',
        toPaddockId,
        batchName: batchName.trim(), // Opcional
        animalCount: effectiveAnimalCount, // Obligatorio
        selectedAnimalIds,
        selectedTagNumbers,
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
      subtitle="Organiza los animales por número de arete o cantidad directa para rotar en los potreros"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-200">
        
        {/* Banner Ilustrativo */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Pase de Animales entre Potreros
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                El lote o nombre es <strong>opcional</strong>. Es <strong>obligatorio indicar cuántos animales</strong> rotan (sea por número de arete o por cantidad).
              </p>
            </div>
          </div>
        </div>

        {/* 1. SELECTOR DEL MÉTODO: POR NÚMERO DE ANIMAL O POR CANTIDAD */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>¿Cómo deseas organizar los animales a rotar? *</span>
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Obligatorio
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('by_tags')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                mode === 'by_tags'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Hash className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-xs font-black leading-tight">Por Números de Animal</p>
                <p className={`text-[10px] ${mode === 'by_tags' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Seleccionar o digitar aretes
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('by_quantity')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                mode === 'by_quantity'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-xs font-black leading-tight">Por Cantidad de Animales</p>
                <p className={`text-[10px] ${mode === 'by_quantity' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Número total de cabezas
                </p>
              </div>
            </button>
          </div>

          {/* CONTENIDO MODO A: POR NÚMEROS DE ARETE */}
          {mode === 'by_tags' && (
            <div className="space-y-2.5 pt-1">
              
              {/* Barra de Búsqueda Rápida de Arete */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchSuggestions.length > 0) {
                          handleAddAnimal(searchSuggestions[0]);
                        } else if (tagSearch.trim()) {
                          // Agregar como tag ad-hoc
                          const tagStr = tagSearch.trim().toUpperCase();
                          const found = activeCattle.find(c => String(c.tagNumber).toUpperCase() === tagStr);
                          if (found) handleAddAnimal(found);
                          else {
                            handleAddAnimal({
                              id: `custom-${tagStr}-${Date.now()}`,
                              tagNumber: tagStr,
                              category: 'Ganado',
                              currentWeight: 380,
                              isCustomTag: true
                            });
                          }
                          setTagSearch('');
                        }
                      }
                    }}
                    placeholder="Escribe el arete (ej: 104) y pulsa Enter o seleccionar..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white pl-8 focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  
                  {/* Desplegable de sugerencias de aretes */}
                  {searchSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800">
                      {searchSuggestions.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleAddAnimal(c)}
                          className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                        >
                          <span className="font-black text-slate-900 dark:text-white">
                            🏷️ {c.tagNumber} {c.name ? `(${c.name})` : ''}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {c.category || 'Bovino'} • {c.currentWeight || c.entryWeight || 380} kg
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón Pegar Varios Aretes */}
                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Pegar varios números de arete separados por comas o espacios"
                >
                  <Plus className="w-3 h-3" />
                  <span>Pegar Lista</span>
                </button>
              </div>

              {/* Caja para pegar varios aretes */}
              {showPasteBox && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Escribe o pega los aretes separados por comas o espacios (ej: 101, 102, 105, 120):
                  </label>
                  <textarea
                    rows={2}
                    value={pasteTagsInput}
                    onChange={(e) => setPasteTagsInput(e.target.value)}
                    placeholder="101, 102, 105, 120, 204..."
                    className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteBox(false)}
                      className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPastedTags}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Agregar Aretes
                    </button>
                  </div>
                </div>
              )}

              {/* Botón rápido para cargar animales del potrero origen si hay */}
              {originPaddockAnimals.length > 0 && selectedAnimals.length === 0 && (
                <button
                  type="button"
                  onClick={handleLoadOriginAnimals}
                  className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cargar los {originPaddockAnimals.length} animales del potrero origen ({originPaddock?.name})</span>
                </button>
              )}

              {/* Lista de chips con los aretes seleccionados */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Animales seleccionados:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                      {selectedAnimals.length}
                    </strong>
                  </span>
                  {selectedAnimals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAnimals([])}
                      className="text-[10px] text-rose-500 hover:text-rose-600 underline font-bold cursor-pointer"
                    >
                      Quitar todos
                    </button>
                  )}
                </div>

                {selectedAnimals.length > 0 ? (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                    {selectedAnimals.map(a => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-black shadow-xs"
                      >
                        <span>🏷️ {a.tagNumber}</span>
                        {a.category && a.category !== 'Ganado' && (
                          <span className="text-[9px] font-normal text-emerald-600 dark:text-emerald-300">
                            ({a.category})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAnimal(a.id)}
                          className="hover:text-rose-600 cursor-pointer ml-0.5 p-0.5"
                          title="Eliminar animal"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                    ⚠️ No has seleccionado ningún arete. Escribe el número del animal arriba o cambia a "Por Cantidad de Animales".
                  </p>
                )}
              </div>

            </div>
          )}

          {/* CONTENIDO MODO B: POR CANTIDAD DIRECTA */}
          {mode === 'by_quantity' && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cantidad de Animales / Cabezas a Rotar: *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required={mode === 'by_quantity'}
                  value={directAnimalCount}
                  onChange={(e) => setDirectAnimalCount(e.target.value)}
                  placeholder="Ej. 25 cabezas"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">
                  cabezas
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ingresa directamente el número total de animales que ingresan al potrero sin necesidad de buscar arete por arete.
              </p>
            </div>
          )}

        </div>

        {/* 2. NOMBRE DEL LOTE / GRUPO (100% OPCIONAL) */}
        <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Nombre del Lote o Grupo (Opcional):
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              Opcional
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              list="batches-list"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 pl-8"
              placeholder="Ej. Lote Ceba 2026 / Novillos Represa (o dejar vacío)"
            />
            <Boxes className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            <datalist id="batches-list">
              {existingBatches.map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <p className="text-[10px] text-slate-400">
            Si no colocas un nombre, se registrará simplemente como{' '}
            <strong className="text-slate-600 dark:text-slate-300">
              "{effectiveAnimalCount > 0 ? effectiveAnimalCount : 'X'} animales en pastoreo"
            </strong>.
          </p>
        </div>

        {/* 3. POTRERO ORIGEN Y DESTINO EN 2 COLUMNAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Potrero Origen */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>1. Potrero Origen (Sale)</span>
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
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-0.5">
                <p><strong>Área:</strong> {originPaddock.areaHa} ha ({originPaddock.pastureType || 'Pasto'})</p>
                {originPaddock.entryDate && (
                  <p className="text-rose-600 dark:text-rose-400 font-bold">
                    Pastoreado: {getGrazingDays(originPaddock)} días (Meta: {originPaddock.targetGrazingDays || 3}d)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Potrero Destino */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>2. Potrero Destino (Entra) *</span>
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
              <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 pt-0.5">
                <p><strong>Pasto:</strong> {destPaddock.pastureType || 'Sin especificar'}</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Descanso:</span>
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

        {/* 4. FECHA Y ACTUALIZACIÓN DE UBICACIÓN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
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
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
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
                Actualizar la ubicación en la ficha individual de los animales al nuevo potrero.
              </span>
            </label>
          </div>
        </div>

        {/* 5. NOTAS U OBSERVACIONES */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Notas de la Rotación (Opcional):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="Ej. Entrada con pasto a 45cm, animales en buen estado..."
          />
        </div>

        {/* RESUMEN ANTES DE CONFIRMAR */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              Total a rotar:{' '}
              <strong className="text-slate-900 dark:text-white text-sm">
                {effectiveAnimalCount} {effectiveAnimalCount === 1 ? 'animal' : 'animales'}
              </strong>
              {batchName.trim() && (
                <span className="text-slate-500"> (Lote: {batchName.trim()})</span>
              )}
            </span>
          </div>
          {effectiveAnimalCount <= 0 && (
            <span className="text-[11px] font-bold text-rose-600">
              * Ingresa cantidad o aretes
            </span>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
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
            disabled={loading || effectiveAnimalCount <= 0 || !toPaddockId}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-lg ${
              effectiveAnimalCount > 0 && toPaddockId && !loading
                ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-emerald-700/20'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              {loading 
                ? 'Rotando...' 
                : `Confirmar y Rotar ${effectiveAnimalCount > 0 ? `${effectiveAnimalCount} Animales` : ''}`}
            </span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
