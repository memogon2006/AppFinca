import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  Tag, 
  Flame, 
  CheckCircle2, 
  Baby, 
  Calendar, 
  Scale, 
  Dna, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Clock, 
  ArrowRight,
  MapPin,
  Layers,
  Hash,
  ListFilter,
  ChevronDown,
  Search,
  Check,
  X
} from 'lucide-react';
import { getLocalDateString, formatDate, getDaysDifference } from '../../services/calculations';
import { 
  analyzeFarmConsecutives, 
  evaluateCandidateConsecutive,
  extractConsecutiveNumber,
  formatConsecutiveRanges 
} from '../../services/consecutiveService';
import { findDuplicateCattle } from '../../services/duplicateDetectionService';
import { useAuth } from '../../context/AuthContext';

export function BrandingRecordModal({
  isOpen,
  onClose,
  onSave,
  animal = null,
  cattleList = [],
  paddocks = [],
  zIndex = 'z-[75]'
}) {
  const { currentUser } = useAuth();

  // Estadísticas de consecutivos en la finca
  const farmConsecutiveStats = useMemo(() => {
    return analyzeFarmConsecutives(cattleList);
  }, [cattleList]);

  // Estados del formulario
  const [newTagNumber, setNewTagNumber] = useState('');
  const [ironBrand, setIronBrand] = useState('');
  const [brandingDate, setBrandingDate] = useState(getLocalDateString());
  const [weighingWeight, setWeighingWeight] = useState('');
  const [earTattoo, setEarTattoo] = useState('');
  const [tattooEarLocation, setTattooEarLocation] = useState('OD');
  const [category, setCategory] = useState('');
  const [paddock, setPaddock] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFreeNumbers, setShowFreeNumbers] = useState(false);
  const [freeNumberSearch, setFreeNumberSearch] = useState('');

  // Filtrado dinámico de números libres según búsqueda
  const displayedFreeNumbers = useMemo(() => {
    const list = farmConsecutiveStats?.missingConsecutives || [];
    if (!freeNumberSearch.trim()) return list;
    const query = freeNumberSearch.trim().toLowerCase().replace('#', '');
    return list.filter(num => String(num).includes(query));
  }, [farmConsecutiveStats?.missingConsecutives, freeNumberSearch]);

  // Asigna un número consecutivo (libre o sugerido) al input respetando cualquier sufijo existente
  const applyConsecutiveNumber = (num) => {
    if (!num && num !== 0) return;
    setNewTagNumber(prev => {
      const str = String(prev || '');
      if (str.includes('-')) {
        const parts = str.split('-');
        return `${num}-${parts.slice(1).join('-')}`;
      }
      if (str.includes('/')) {
        const parts = str.split('/');
        return `${num}/${parts.slice(1).join('/')}`;
      }
      return String(num);
    });
    setErrors(prev => ({ ...prev, newTagNumber: null }));
  };

  // Inicializar campos cuando se abre el modal con el animal
  useEffect(() => {
    if (isOpen && animal) {
      const nextSug = farmConsecutiveStats?.nextSuggestedConsecutive;
      setNewTagNumber(nextSug ? String(nextSug) : '');
      setIronBrand(animal.ironBrand || currentUser?.farmIronBrand || '');
      setBrandingDate(getLocalDateString());
      setWeighingWeight(animal.currentWeight ? String(animal.currentWeight) : '');
      setEarTattoo(animal.earTattoo || '');
      setTattooEarLocation(animal.tattooEarLocation || 'OD');
      setPaddock(animal.paddock || '');
      setNotes('');
      setErrors({});
      setShowFreeNumbers(false);
      setFreeNumberSearch('');

      // Sugerir categoría según edad y sexo
      const birthDateStr = animal.birthDate || animal.entryDate;
      const ageDays = birthDateStr ? getDaysDifference(birthDateStr, new Date()) : 0;
      const ageMonths = Math.floor(ageDays / 30.4);

      if (ageMonths >= 7) {
        setCategory(animal.sex === 'Hembra' ? 'Levante Hembra' : 'Levante Macho');
      } else {
        setCategory(animal.category || (animal.sex === 'Hembra' ? 'Ternera' : 'Ternero'));
      }
    }
  }, [isOpen, animal, farmConsecutiveStats, currentUser]);

  // Evaluación del nuevo consecutivo en tiempo real
  const candidateConsecutiveEval = useMemo(() => {
    if (!newTagNumber.trim()) return null;
    return evaluateCandidateConsecutive(newTagNumber.trim(), farmConsecutiveStats);
  }, [newTagNumber, farmConsecutiveStats]);

  // Detección de duplicados activos en tiempo real
  const duplicateMatch = useMemo(() => {
    if (!newTagNumber.trim() || !animal) return null;
    const matches = findDuplicateCattle(
      {
        tagNumber: newTagNumber.trim(),
        ironBrand: ironBrand.trim(),
        owner: animal.owner,
        id: animal.id
      },
      cattleList.filter(c => c.status === 'Activo' && String(c.id) !== String(animal.id)),
      animal.id
    );
    return matches.length > 0 ? matches[0] : null;
  }, [newTagNumber, ironBrand, animal, cattleList]);

  // Cálculo de edad de la cría
  const ageDisplay = useMemo(() => {
    if (!animal) return '';
    const birthDateStr = animal.birthDate || animal.entryDate;
    if (!birthDateStr) return 'Edad desconocida';
    const ageDays = getDaysDifference(birthDateStr, new Date());
    const ageMonths = Math.floor(ageDays / 30.4);
    const remDays = ageDays % 30;
    if (ageMonths === 0) return `${ageDays} días de vida`;
    return `${ageMonths} ${ageMonths === 1 ? 'mes' : 'meses'}${remDays > 0 ? ` y ${remDays} días` : ''}`;
  }, [animal]);

  if (!isOpen || !animal) return null;

  const validate = () => {
    const errs = {};
    if (!newTagNumber.trim()) {
      errs.newTagNumber = 'Ingresa el nuevo consecutivo / chapa oficial de la finca.';
    } else if (newTagNumber.trim().toLowerCase() === animal.tagNumber?.trim().toLowerCase()) {
      errs.newTagNumber = 'El nuevo número debe ser la chapa definitiva (diferente a la temporal).';
    }
    if (!brandingDate) {
      errs.brandingDate = 'Ingresa la fecha de marcación / chapeteo.';
    }
    if (weighingWeight && (isNaN(parseFloat(weighingWeight)) || parseFloat(weighingWeight) <= 0)) {
      errs.weighingWeight = 'Ingresa un peso válido o déjalo vacío.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        animal,
        newTagNumber: newTagNumber.trim(),
        ironBrand: ironBrand.trim(),
        brandingDate,
        weighingWeight: weighingWeight ? parseFloat(weighingWeight) : null,
        earTattoo: earTattoo.trim(),
        tattooEarLocation: earTattoo.trim() ? tattooEarLocation : '',
        category: category || animal.category,
        paddock: paddock || animal.paddock,
        notes: notes.trim()
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      alert('Error al oficializar bovino: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏷️ Marcación & Chapeteo Oficial de la Finca"
      maxWidth="max-w-3xl"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-2">
        
        {/* ========================================================================= */}
        {/* 1. TARJETA INFORMATIVA DEL ANIMAL (DATOS DE NACIMIENTO & GENEALOGÍA)      */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shrink-0">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Cría #{animal.tagNumber}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                    N° Temporal / Prerregistro
                  </span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                  {animal.name ? `Nombre: "${animal.name}" • ` : ''}{animal.sex} • {animal.breed || 'Cebú'} • {ageDisplay}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Nacimiento</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {formatDate(animal.birthDate || animal.entryDate)}
              </span>
            </div>
          </div>

          {/* Grilla Genealógica y Biométrica */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200 dark:border-amber-800/60 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Vaca Madre</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {animal.motherTag ? `#${animal.motherTag}` : 'No registrada'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Toro Padre / IATF</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {animal.fatherTag ? `#${animal.fatherTag}` : (animal.fatherType || 'No registrado')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Peso Nacimiento</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {animal.entryWeight ? `${animal.entryWeight} kg` : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Tatuaje Oreja</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {animal.earTattoo ? `${animal.earTattoo} (${animal.tattooEarLocation || 'OD'})` : 'Sin tatuaje'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FORMULARIO DE ASIGNACIÓN: CONSECUTIVO OFICIAL, HIERRO Y PESO           */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Identificación Oficial Definitiva</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Paso definitivo a manga</span>
          </div>

          {/* Panel de Control de Consecutivo y Números Libres */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Control de Numeración y Consecutivo</span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Secuencia histórica de chapeteo en la finca
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {farmConsecutiveStats.missingConsecutives.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFreeNumbers(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                      showFreeNumbers
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{showFreeNumbers ? 'Ocultar libres' : `Ver libres (${farmConsecutiveStats.missingConsecutives.length})`}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFreeNumbers ? 'rotate-180' : ''}`} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => applyConsecutiveNumber(farmConsecutiveStats.nextSuggestedConsecutive)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Usar sugerido (#{farmConsecutiveStats.nextSuggestedConsecutive})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center mb-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase block">Último Registrado:</span>
                <strong className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {farmConsecutiveStats.maxConsecutive > 0 ? `#${farmConsecutiveStats.maxConsecutive}` : 'Ninguno'}
                </strong>
              </div>

              {/* Tarjeta Siguiente Sugerido con Desplegable de Números Libres */}
              <div 
                onClick={() => {
                  if (farmConsecutiveStats.missingConsecutives.length > 0) {
                    setShowFreeNumbers(prev => !prev);
                  }
                }}
                className={`p-2.5 rounded-xl border-2 shadow-xs transition ${
                  farmConsecutiveStats.missingConsecutives.length > 0
                    ? 'bg-emerald-500/20 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-500/80 cursor-pointer hover:bg-emerald-500/30'
                    : 'bg-emerald-500/20 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-500/80'
                }`}
                title={farmConsecutiveStats.missingConsecutives.length > 0 ? "Haz clic para ver o desplegar los números libres no usados en la finca" : ""}
              >
                <span className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-black uppercase block">Siguiente Sugerido:</span>
                <strong className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                  #{farmConsecutiveStats.nextSuggestedConsecutive}
                </strong>
                {farmConsecutiveStats.missingConsecutives.length > 0 ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-500/40 shadow-2xs">
                    <span>{farmConsecutiveStats.missingConsecutives.length} libres antes</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFreeNumbers ? 'rotate-180' : ''}`} />
                  </span>
                ) : (
                  <span className="mt-1 inline-block text-[10px] text-emerald-700/80 dark:text-emerald-300/70 font-semibold">
                    Secuencia continua
                  </span>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-center shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase block">Total Histórico:</span>
                <strong className="text-base sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
                  {farmConsecutiveStats.distinctConsecutivesCount}
                </strong>
              </div>
            </div>

            {/* Banner Desplegable de Números Libres / No Usados */}
            {showFreeNumbers && (
              <div className="mt-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-emerald-500/60 shadow-lg text-slate-800 dark:text-slate-100 animate-fadeIn">
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                      <Hash className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider block">
                        Números Libres / No Usados en Finca
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {farmConsecutiveStats.missingConsecutives.length === 1
                          ? 'Hay 1 número intermedio libre antes del último registrado'
                          : `Hay ${farmConsecutiveStats.missingConsecutives.length} números intermedios libres (entre el #1 y el #${farmConsecutiveStats.maxConsecutive})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {farmConsecutiveStats.missingConsecutives.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyConsecutiveNumber(farmConsecutiveStats.missingConsecutives[0])}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Asignar el menor número libre disponible para llenar huecos en orden"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Usar el menor (#{farmConsecutiveStats.missingConsecutives[0]})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFreeNumbers(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      title="Cerrar panel de números libres"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rangos resumidos si hay varios */}
                {farmConsecutiveStats.missingConsecutives.length > 3 && (
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Rangos libres: </span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {farmConsecutiveStats.missingRanges || formatConsecutiveRanges(farmConsecutiveStats.missingConsecutives)}
                    </span>
                  </div>
                )}

                {/* Buscador de número libre específico si hay más de 12 */}
                {farmConsecutiveStats.missingConsecutives.length > 12 && (
                  <div className="mt-2.5 relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={freeNumberSearch}
                      onChange={(e) => setFreeNumberSearch(e.target.value)}
                      placeholder="Buscar número libre específico (ej. 15)..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    {freeNumberSearch && (
                      <button
                        type="button"
                        onClick={() => setFreeNumberSearch('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                {/* Grilla interactiva de botones de números libres */}
                <div className="mt-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {displayedFreeNumbers.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                      {displayedFreeNumbers.map(num => {
                        const isCurrentlySelected = extractConsecutiveNumber(newTagNumber) === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => applyConsecutiveNumber(num)}
                            className={`py-1.5 px-2 rounded-lg font-black text-xs text-center transition cursor-pointer border flex items-center justify-center gap-1 shadow-xs ${
                              isCurrentlySelected
                                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/40 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300'
                            }`}
                            title={`Haz clic para asignar el número #${num} a este bovino`}
                          >
                            <span>#{num}</span>
                            {isCurrentlySelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                      No se encontró el número libre "{freeNumberSearch}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* NUEVO CONSECUTIVO / CHAPA DEFINITIVA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Nueva Chapa / Consecutivo Oficial *</span>
                <div className="flex items-center gap-2">
                  {farmConsecutiveStats?.missingConsecutives?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowFreeNumbers(prev => !prev)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{farmConsecutiveStats.missingConsecutives.length} libres</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFreeNumbers ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {farmConsecutiveStats?.nextSuggestedConsecutive && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Sugerido: #{farmConsecutiveStats.nextSuggestedConsecutive}
                    </span>
                  )}
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newTagNumber}
                  onChange={(e) => setNewTagNumber(e.target.value)}
                  placeholder={`Ej: ${farmConsecutiveStats?.nextSuggestedConsecutive || '150'}`}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-emerald-500 min-h-[44px] ${
                    errors.newTagNumber ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  autoFocus
                />
                <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.newTagNumber && (
                <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.newTagNumber}</p>
              )}
              {candidateConsecutiveEval && candidateConsecutiveEval.status === 'free_number_fill' && (
                <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Asignando número libre disponible (#{candidateConsecutiveEval.enteredConsecutive})</span>
                </p>
              )}
              {candidateConsecutiveEval && !candidateConsecutiveEval.isValid && !errors.newTagNumber && (
                <p className="text-amber-600 dark:text-amber-400 text-[11px] font-bold mt-1">
                  {candidateConsecutiveEval.warningType === 'JUMP_AHEAD'
                    ? `⚠️ Salto en consecutivo (el último fue #${candidateConsecutiveEval.maxConsecutive})`
                    : 'ℹ️ Número anterior o ya utilizado'}
                </p>
              )}
              {duplicateMatch && (
                <p className="text-rose-600 dark:text-rose-400 text-[11px] font-bold mt-1">
                  ⚠️ Ya existe un animal activo con chapa #{newTagNumber.trim()} ({duplicateMatch.animal.category || 'Bovino'}).
                </p>
              )}
            </div>

            {/* MARCA DE HIERRO / HIERRO DE LA FINCA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Marca de Fuego / Hierro de la Finca</span>
                <span className="text-[10px] text-slate-400 font-normal">Marca oficial</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ironBrand}
                  onChange={(e) => setIronBrand(e.target.value)}
                  placeholder="Ej: HT, Hacienda Santa Teresa, Cruz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
                <Flame className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* FECHA DE MARCACIÓN / CHAPETEO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Marcación / Chapeteo *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={brandingDate}
                  onChange={(e) => setBrandingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.brandingDate && (
                <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.brandingDate}</p>
              )}
            </div>

            {/* PESAJE EN MANGA DURANTE MARCACIÓN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Peso en Manga (kg)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Opcional</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={weighingWeight}
                  onChange={(e) => setWeighingWeight(e.target.value)}
                  placeholder={animal.currentWeight ? `Último: ${animal.currentWeight} kg` : 'Ej: 145'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
                <Scale className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.weighingWeight && (
                <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.weighingWeight}</p>
              )}
            </div>

          </div>

          {/* TATUAJE EN OREJA (GANADO PURO) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Tatuaje en Oreja (Control Ganado Puro & Asociación)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={earTattoo}
                  onChange={(e) => setEarTattoo(e.target.value)}
                  placeholder="Número grabado con pinza (ej: 142 o sigla)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                />
              </div>
              <div>
                <select
                  value={tattooEarLocation}
                  onChange={(e) => setTattooEarLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 min-h-[42px] cursor-pointer"
                >
                  <option value="OD">Oreja Derecha (OD)</option>
                  <option value="OI">Oreja Izquierda (OI)</option>
                  <option value="Ambas">Ambas Orejas</option>
                </select>
              </div>
            </div>
          </div>

          {/* CATEGORÍA ACTUALIZADA & POTRERO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoría del Bovino
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 min-h-[44px] cursor-pointer"
              >
                {animal.sex === 'Hembra' ? (
                  <>
                    <option value="Ternera">Ternera (Al pie de la madre)</option>
                    <option value="Levante Hembra">Levante Hembra (Destetada)</option>
                    <option value="Novilla">Novilla</option>
                    <option value="Vaca">Vaca</option>
                  </>
                ) : (
                  <>
                    <option value="Ternero">Ternero (Al pie de la madre)</option>
                    <option value="Levante Macho">Levante Macho (Destetado)</option>
                    <option value="Novillo">Novillo</option>
                    <option value="Toro">Toro</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Potrero / Lote Actual
              </label>
              <input
                type="text"
                value={paddock}
                onChange={(e) => setPaddock(e.target.value)}
                placeholder="Ej: Potrero #3, Lote Levante"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones de la Marcación
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles de la marcación en manga, cicatrización, estado del animal..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. BOTONES DE ACCIÓN                                                     */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer min-h-[44px]"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition cursor-pointer min-h-[44px] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Guardando...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>🏷️ Guardar y Oficializar Chapa Definitiva</span>
              </>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
}
