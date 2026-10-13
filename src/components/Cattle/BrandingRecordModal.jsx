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
  Layers
} from 'lucide-react';
import { getLocalDateString, formatDate, getDaysDifference } from '../../services/calculations';
import { analyzeFarmConsecutives, evaluateCandidateConsecutive } from '../../services/consecutiveService';
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* NUEVO CONSECUTIVO / CHAPA DEFINITIVA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Nueva Chapa / Consecutivo Oficial *</span>
                {farmConsecutiveStats?.nextSuggestedConsecutive && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Sugerido: #{farmConsecutiveStats.nextSuggestedConsecutive}
                  </span>
                )}
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
