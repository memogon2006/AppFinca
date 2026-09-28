import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  Baby, 
  Sparkles, 
  Calendar, 
  Scale, 
  HeartHandshake, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Milk, 
  ChevronRight, 
  Dna, 
  Layers, 
  ShieldCheck, 
  Info,
  Clock,
  Activity,
  Plus
} from 'lucide-react';
import { getLocalDateString, formatDate, calculateReproduction, BOVINE_GESTATION_DAYS } from '../../services/calculations';
import { analyzeFarmConsecutives, evaluateCandidateConsecutive } from '../../services/consecutiveService';
import { getDynamicFarmColors, COMMON_BREEDS } from '../../types/cattle';
import { useAuth } from '../../context/AuthContext';

export function CalvingRecordModal({
  isOpen,
  onClose,
  onSave,
  mother = null,
  cattleList = [],
  paddocks = [],
  zIndex = 'z-[70]'
}) {
  const { currentUser } = useAuth();
  
  // Lista de hembras activas de la finca para seleccionar si no se pasa madre preseleccionada
  const activeFemales = useMemo(() => {
    return cattleList.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  }, [cattleList]);

  // Toros / machos reproductores activos en la finca
  const activeBulls = useMemo(() => {
    return cattleList.filter(c => c.sex === 'Macho' && c.status === 'Activo');
  }, [cattleList]);

  // Estadísticas de consecutivos en la finca
  const farmConsecutiveStats = useMemo(() => {
    return analyzeFarmConsecutives(cattleList);
  }, [cattleList]);

  // Colores frecuentes
  const farmColors = useMemo(() => {
    return getDynamicFarmColors(cattleList);
  }, [cattleList]);

  // Estado de selección de la madre
  const [selectedMotherId, setSelectedMotherId] = useState(mother?.id || '');

  // Objeto completo de la vaca seleccionada
  const selectedMother = useMemo(() => {
    if (mother && String(mother.id) === String(selectedMotherId)) return mother;
    return activeFemales.find(f => String(f.id) === String(selectedMotherId)) || mother || null;
  }, [selectedMotherId, activeFemales, mother]);

  // Sincronizar madre al abrir modal o cambiar prop
  useEffect(() => {
    if (isOpen) {
      if (mother?.id) {
        setSelectedMotherId(mother.id);
      } else if (activeFemales.length > 0 && !selectedMotherId) {
        // Preseleccionar primera gestante si existe
        const firstPregnant = activeFemales.find(f => f.reproductiveStatus === 'Preñada' || f.femaleStatus?.includes('Gestación'));
        setSelectedMotherId(firstPregnant ? firstPregnant.id : activeFemales[0].id);
      }
    }
  }, [isOpen, mother, activeFemales]);

  // Datos del Parto
  const [calvingDate, setCalvingDate] = useState(getLocalDateString());
  const [calvingType, setCalvingType] = useState('Normal'); // 'Normal', 'Asistido', 'Cesarea', 'Gemelar'
  const [calvingEase, setCalvingEase] = useState('Fácil / Sin ayuda');
  
  // Estado Post-Parto de la Madre
  const [motherPostStatus, setMotherPostStatus] = useState('Levante de cría'); // 'Levante de cría', 'Producción de leche', 'Doble Propósito'
  const [selectedPaddock, setSelectedPaddock] = useState('');

  // Programación de Destete Automático
  const [scheduleWeaning, setScheduleWeaning] = useState(true);
  const [weaningMonths, setWeaningMonths] = useState(7); // 6, 7, 8, or 'custom'
  const [customWeaningDate, setCustomWeaningDate] = useState('');

  // Datos de Cría 1
  const [calf1, setCalf1] = useState({
    tagNumber: '',
    name: '',
    sex: 'Macho',
    birthWeight: '35',
    color: '',
    breed: '',
    vigor: 'Vigoroso',
    navelTreated: true,
    colostrumConsumed: true,
  });

  // Datos de Cría 2 (Parto Gemelar)
  const [calf2, setCalf2] = useState({
    tagNumber: '',
    name: '',
    sex: 'Hembra',
    birthWeight: '32',
    color: '',
    breed: '',
    vigor: 'Vigoroso',
    navelTreated: true,
    colostrumConsumed: true,
  });

  // Padre / Reproductor
  const [fatherType, setFatherType] = useState('Monta Natural'); // 'Monta Natural', 'Inseminación / IATF', 'Desconocido'
  const [selectedBullId, setSelectedBullId] = useState('');
  const [fatherCustomTag, setFatherCustomTag] = useState('');

  // Notas clínicas
  const [notes, setNotes] = useState('');

  // Sugerir consecutivos iniciales al abrir
  useEffect(() => {
    if (isOpen) {
      setCalvingDate(getLocalDateString());
      const nextSug = farmConsecutiveStats?.nextSuggestedConsecutive || 1;
      
      setCalf1(prev => ({
        ...prev,
        tagNumber: prev.tagNumber || String(nextSug),
        color: prev.color || selectedMother?.color || farmColors[0] || 'Blanco',
        breed: prev.breed || selectedMother?.breed || 'Brahman Blanco',
      }));

      setCalf2(prev => ({
        ...prev,
        tagNumber: prev.tagNumber || String(nextSug + 1),
        color: prev.color || selectedMother?.color || farmColors[0] || 'Blanco',
        breed: prev.breed || selectedMother?.breed || 'Brahman Blanco',
      }));

      if (selectedMother) {
        setSelectedPaddock(selectedMother.paddock || '');
        if (selectedMother.milkingStatus === 'En ordeño' || selectedMother.productionType === 'Lechería') {
          setMotherPostStatus('Doble Propósito');
        } else {
          setMotherPostStatus('Levante de cría');
        }
        if (selectedMother.fatherTag || selectedMother.sireTag) {
          setFatherCustomTag(selectedMother.fatherTag || selectedMother.sireTag || '');
        }
      }
    }
  }, [isOpen, selectedMother, farmConsecutiveStats, farmColors]);

  // Actualizar potrero y color cuando cambia la madre seleccionada
  const handleMotherChange = (newMotherId) => {
    setSelectedMotherId(newMotherId);
    const m = activeFemales.find(f => String(f.id) === String(newMotherId));
    if (m) {
      setSelectedPaddock(m.paddock || '');
      setCalf1(prev => ({
        ...prev,
        color: m.color || prev.color,
        breed: m.breed || prev.breed,
      }));
      setCalf2(prev => ({
        ...prev,
        color: m.color || prev.color,
        breed: m.breed || prev.breed,
      }));
      if (m.milkingStatus === 'En ordeño' || m.productionType === 'Lechería') {
        setMotherPostStatus('Doble Propósito');
      } else {
        setMotherPostStatus('Levante de cría');
      }
    }
  };

  // Cálculo de la fecha estimada de destete
  const calculatedWeaningDate = useMemo(() => {
    if (!calvingDate) return '';
    if (weaningMonths === 'custom' && customWeaningDate) {
      return customWeaningDate;
    }
    const daysToAdd = typeof weaningMonths === 'number' ? Math.round(weaningMonths * 30.4375) : 210;
    try {
      const parts = calvingDate.split('-');
      if (parts.length !== 3) return '';
      const cDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      cDate.setDate(cDate.getDate() + daysToAdd);
      
      const y = cDate.getFullYear();
      const m = String(cDate.getMonth() + 1).padStart(2, '0');
      const d = String(cDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  }, [calvingDate, weaningMonths, customWeaningDate]);

  // Evaluación de consecutivo en tiempo real para Cría 1
  const calf1ConsecutiveEval = useMemo(() => {
    return evaluateCandidateConsecutive(calf1.tagNumber, farmConsecutiveStats);
  }, [calf1.tagNumber, farmConsecutiveStats]);

  // Evaluación de consecutivo en tiempo real para Cría 2
  const calf2ConsecutiveEval = useMemo(() => {
    if (calvingType !== 'Gemelar') return null;
    return evaluateCandidateConsecutive(calf2.tagNumber, farmConsecutiveStats);
  }, [calf2.tagNumber, farmConsecutiveStats, calvingType]);

  // Validaciones
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!selectedMotherId) errs.mother = 'Debes seleccionar la vaca madre.';
    if (!calvingDate) errs.calvingDate = 'Ingresa la fecha del parto.';
    if (!calf1.tagNumber?.trim()) errs.calf1Tag = 'Ingresa la chapa/número de la cría.';
    if (!calf1.birthWeight || parseFloat(calf1.birthWeight) <= 0) errs.calf1Weight = 'Ingresa un peso al nacer válido.';

    if (calvingType === 'Gemelar') {
      if (!calf2.tagNumber?.trim()) errs.calf2Tag = 'Ingresa la chapa de la segunda cría.';
      if (!calf2.birthWeight || parseFloat(calf2.birthWeight) <= 0) errs.calf2Weight = 'Ingresa el peso de la segunda cría.';
      if (calf1.tagNumber.trim() && calf2.tagNumber.trim() && calf1.tagNumber.trim().toLowerCase() === calf2.tagNumber.trim().toLowerCase()) {
        errs.calf2Tag = 'Las dos crías no pueden tener la misma chapa.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Determinar datos del padre
    let finalFatherTag = '';
    let finalFatherId = '';
    if (fatherType === 'Monta Natural') {
      if (selectedBullId) {
        const bull = activeBulls.find(b => String(b.id) === String(selectedBullId));
        if (bull) {
          finalFatherTag = bull.tagNumber;
          finalFatherId = String(bull.id);
        }
      } else if (fatherCustomTag) {
        finalFatherTag = fatherCustomTag.trim();
      }
    } else if (fatherType === 'Inseminación / IATF') {
      finalFatherTag = fatherCustomTag.trim() || 'Pajilla IATF';
    }

    const payload = {
      mother: selectedMother,
      calvingDate,
      calvingType,
      calvingEase,
      motherPostStatus,
      selectedPaddock: selectedPaddock || selectedMother?.paddock || '',
      scheduleWeaning,
      weaningDate: calculatedWeaningDate,
      weaningMonths: typeof weaningMonths === 'number' ? weaningMonths : null,
      fatherType,
      fatherTag: finalFatherTag,
      fatherId: finalFatherId,
      notes: notes.trim(),
      calves: [
        {
          tagNumber: calf1.tagNumber.trim(),
          name: calf1.name.trim(),
          sex: calf1.sex,
          category: calf1.sex === 'Hembra' ? 'Ternera' : 'Ternero',
          birthWeight: parseFloat(calf1.birthWeight) || 35,
          color: calf1.color.trim() || selectedMother?.color || 'Sin color',
          breed: calf1.breed.trim() || selectedMother?.breed || 'Brahman Blanco',
          vigor: calf1.vigor,
          navelTreated: calf1.navelTreated,
          colostrumConsumed: calf1.colostrumConsumed,
        },
        ...(calvingType === 'Gemelar' ? [{
          tagNumber: calf2.tagNumber.trim(),
          name: calf2.name.trim(),
          sex: calf2.sex,
          category: calf2.sex === 'Hembra' ? 'Ternera' : 'Ternero',
          birthWeight: parseFloat(calf2.birthWeight) || 32,
          color: calf2.color.trim() || selectedMother?.color || 'Sin color',
          breed: calf2.breed.trim() || selectedMother?.breed || 'Brahman Blanco',
          vigor: calf2.vigor,
          navelTreated: calf2.navelTreated,
          colostrumConsumed: calf2.colostrumConsumed,
        }] : [])
      ]
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🍼 Registro de Parto & Destete Automático"
      maxWidth="max-w-4xl"
      zIndex={zIndex}
    >
      <div className="space-y-6 pb-2">
        
        {/* ========================================================================= */}
        {/* 1. FICHA RESUMEN DE LA MADRE                                             */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200 dark:border-purple-800/60 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Vaca Madre (Vientre)</span>
                  {selectedMother?.reproductiveStatus === 'Preñada' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                      🤰 Gestante
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona la hembra que dio a luz para vincular automáticamente su genealogía y lactancia.
                </p>
              </div>
            </div>

            {/* Selector de Madre */}
            <div className="min-w-[220px]">
              <select
                value={selectedMotherId}
                onChange={(e) => handleMotherChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 min-h-[40px] cursor-pointer"
              >
                <option value="">-- Seleccionar Hembra --</option>
                {activeFemales.map(f => (
                  <option key={f.id} value={f.id}>
                    Chapa #{f.tagNumber} {f.name ? `(${f.name})` : ''} • {f.category} {f.reproductiveStatus === 'Preñada' ? '🤰' : ''}
                  </option>
                ))}
              </select>
              {errors.mother && <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.mother}</p>}
            </div>
          </div>

          {/* Tarjeta de Detalles de la Madre */}
          {selectedMother && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-200 dark:border-purple-800/40 text-xs">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/40">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Chapa & Nombre</span>
                <span className="font-extrabold text-slate-900 dark:text-white">#{selectedMother.tagNumber} {selectedMother.name ? `(${selectedMother.name})` : ''}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/40">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Raza & Pelaje</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMother.breed || 'Cebú'} • {selectedMother.color || 'Sin color'}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/40">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Potrero / Lote</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMother.paddock || 'Sin potrero'} • {selectedMother.entryBatch || 'Lote #1'}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/40">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Dueño / Hierro</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMother.owner || 'Hacienda'} {selectedMother.ironBrand ? `(${selectedMother.ironBrand})` : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. DATOS DEL PARTO                                                       */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Datos del Nacimiento & Calificación del Parto</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Fecha del Parto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Nacimiento / Parto *
              </label>
              <input
                type="date"
                value={calvingDate}
                onChange={(e) => setCalvingDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
              {errors.calvingDate && <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.calvingDate}</p>}
            </div>

            {/* Tipo de Parto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Parto
              </label>
              <select
                value={calvingType}
                onChange={(e) => setCalvingType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 min-h-[42px] cursor-pointer"
              >
                <option value="Normal">🟢 Normal (Eutócico - Sin complicaciones)</option>
                <option value="Asistido">🟡 Asistido (Tracción manual leve)</option>
                <option value="Cesarea">🔴 Distócico Grave / Cesárea</option>
                <option value="Gemelar">✨ Gemelar / Mellizos (2 Crías)</option>
              </select>
            </div>

            {/* Facilidad de Parto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condición del Parto
              </label>
              <select
                value={calvingEase}
                onChange={(e) => setCalvingEase(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 min-h-[42px] cursor-pointer"
              >
                <option value="Fácil / Sin ayuda">Fácil / Sin ayuda (Excelente vigor)</option>
                <option value="Asistencia ligera">Asistencia ligera en manga</option>
                <option value="Distócico moderado">Distócico moderado</option>
                <option value="Intervención veterinaria">Intervención veterinaria quirúrgica</option>
              </select>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DATOS DE LA CRÍA 1 (Y CRÍA 2 SI ES GEMELAR)                           */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          
          {/* CRÍA 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border-2 border-emerald-500/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Baby className="w-4 h-4 text-emerald-600" />
                <span>{calvingType === 'Gemelar' ? 'Cría 1 (Mellizo A)' : 'Identificación & Ficha de la Nueva Cría'}</span>
              </h4>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                {calf1.sex === 'Hembra' ? 'Ternera 🐄' : 'Ternero 🐂'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              
              {/* Chapa / Arete */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Chapa / Arete *</span>
                  {farmConsecutiveStats?.nextSuggestedConsecutive && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                      Sug: #{farmConsecutiveStats.nextSuggestedConsecutive}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={calf1.tagNumber}
                  onChange={(e) => setCalf1({ ...calf1, tagNumber: e.target.value })}
                  placeholder="Ej: 105 o 105-1"
                  className={`w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border text-slate-900 dark:text-white text-xs font-extrabold focus:ring-2 focus:ring-emerald-500 min-h-[42px] ${
                    errors.calf1Tag ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errors.calf1Tag && <p className="text-rose-500 text-[10px] font-bold mt-1">{errors.calf1Tag}</p>}
                
                {/* Advertencia de Consecutivo */}
                {calf1ConsecutiveEval && !calf1ConsecutiveEval.isValid && (
                  <p className="text-amber-600 dark:text-amber-400 text-[10px] font-bold mt-1">
                    {calf1ConsecutiveEval.warningType === 'JUMP_AHEAD' ? '⚠️ Salto en consecutivo' : 'ℹ️ Número ya usado o anterior'}
                  </p>
                )}
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sexo de la Cría *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCalf1({ ...calf1, sex: 'Macho' })}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1 ${
                      calf1.sex === 'Macho'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>Macho 🐂</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalf1({ ...calf1, sex: 'Hembra' })}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1 ${
                      calf1.sex === 'Hembra'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>Hembra 🐄</span>
                  </button>
                </div>
              </div>

              {/* Peso al Nacer (kg) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Peso al Nacer (kg) *</span>
                  {parseFloat(calf1.birthWeight) > 0 && (
                    <span className={`text-[10px] font-black ${
                      parseFloat(calf1.birthWeight) < 25 ? 'text-amber-600' : parseFloat(calf1.birthWeight) <= 42 ? 'text-emerald-600' : 'text-purple-600'
                    }`}>
                      {parseFloat(calf1.birthWeight) < 25 ? 'Liviano' : parseFloat(calf1.birthWeight) <= 42 ? 'Óptimo' : 'Pesado'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="15"
                    max="65"
                    value={calf1.birthWeight}
                    onChange={(e) => setCalf1({ ...calf1, birthWeight: e.target.value })}
                    placeholder="35"
                    className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-extrabold focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kg</span>
                </div>
                {errors.calf1Weight && <p className="text-rose-500 text-[10px] font-bold mt-1">{errors.calf1Weight}</p>}
              </div>

              {/* Color / Pelaje */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Color / Pelaje
                </label>
                <input
                  type="text"
                  list="calf1-colors"
                  value={calf1.color}
                  onChange={(e) => setCalf1({ ...calf1, color: e.target.value })}
                  placeholder="Ej: Hosco, Blanco"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                />
                <datalist id="calf1-colors">
                  {farmColors.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

            </div>

            {/* Fila 2: Nombre opcional, Raza, Cuidados Neonatales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nombre / Apodo (Opcional)
                </label>
                <input
                  type="text"
                  value={calf1.name}
                  onChange={(e) => setCalf1({ ...calf1, name: e.target.value })}
                  placeholder="Ej: Pintón, Mona, Lucero"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Raza Estimada
                </label>
                <input
                  type="text"
                  list="calf1-breeds"
                  value={calf1.breed}
                  onChange={(e) => setCalf1({ ...calf1, breed: e.target.value })}
                  placeholder="Ej: Brahman x Gyr"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
                <datalist id="calf1-breeds">
                  {COMMON_BREEDS.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>

              {/* Cuidados Neonatales Rápidos */}
              <div className="flex items-center gap-3 self-end py-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calf1.navelTreated}
                    onChange={(e) => setCalf1({ ...calf1, navelTreated: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Ombligo Curado</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calf1.colostrumConsumed}
                    onChange={(e) => setCalf1({ ...calf1, colostrumConsumed: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Mamó Calostro</span>
                </label>
              </div>
            </div>
          </div>

          {/* CRÍA 2 (SOLO SI ES PARTO GEMELAR) */}
          {calvingType === 'Gemelar' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border-2 border-purple-500/40 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-600" />
                  <span>Cría 2 (Mellizo B - Parto Gemelar)</span>
                </h4>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 border border-purple-400">
                  {calf2.sex === 'Hembra' ? 'Ternera 🐄' : 'Ternero 🐂'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chapa / Arete *
                  </label>
                  <input
                    type="text"
                    value={calf2.tagNumber}
                    onChange={(e) => setCalf2({ ...calf2, tagNumber: e.target.value })}
                    placeholder="Ej: 106"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-extrabold focus:ring-2 focus:ring-purple-500 min-h-[42px]"
                  />
                  {errors.calf2Tag && <p className="text-rose-500 text-[10px] font-bold mt-1">{errors.calf2Tag}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sexo *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCalf2({ ...calf2, sex: 'Macho' })}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer min-h-[42px] flex items-center justify-center ${
                        calf2.sex === 'Macho' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300'
                      }`}
                    >
                      Macho 🐂
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalf2({ ...calf2, sex: 'Hembra' })}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer min-h-[42px] flex items-center justify-center ${
                        calf2.sex === 'Hembra' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300'
                      }`}
                    >
                      Hembra 🐄
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso al Nacer (kg) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="15"
                      max="65"
                      value={calf2.birthWeight}
                      onChange={(e) => setCalf2({ ...calf2, birthWeight: e.target.value })}
                      placeholder="32"
                      className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 text-slate-900 dark:text-white text-xs font-extrabold focus:ring-2 focus:ring-purple-500 min-h-[42px]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kg</span>
                  </div>
                  {errors.calf2Weight && <p className="text-rose-500 text-[10px] font-bold mt-1">{errors.calf2Weight}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Color / Pelaje
                  </label>
                  <input
                    type="text"
                    list="calf2-colors"
                    value={calf2.color}
                    onChange={(e) => setCalf2({ ...calf2, color: e.target.value })}
                    placeholder="Ej: Colorado"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 text-slate-900 dark:text-white text-xs font-bold min-h-[42px]"
                  />
                  <datalist id="calf2-colors">
                    {farmColors.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* 4. PADRE / REPRODUCTOR & POTRERO DE DESTINO                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Dna className="w-4 h-4 text-purple-600" />
            <span>Genealogía Paterna & Ubicación</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Tipo de Servicio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Reproducción
              </label>
              <select
                value={fatherType}
                onChange={(e) => setFatherType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 min-h-[42px] cursor-pointer"
              >
                <option value="Monta Natural">🐂 Monta Natural (Toro de Finca)</option>
                <option value="Inseminación / IATF">🧬 Inseminación / IATF (Pajilla)</option>
                <option value="Desconocido">❓ Desconocido / No registrado</option>
              </select>
            </div>

            {/* Selección de Toro o Nombre de Pajilla */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {fatherType === 'Inseminación / IATF' ? 'Código de Pajilla / Toro IATF' : 'Toro Padre (Reproductor)'}
              </label>
              {fatherType === 'Monta Natural' && activeBulls.length > 0 ? (
                <select
                  value={selectedBullId}
                  onChange={(e) => {
                    setSelectedBullId(e.target.value);
                    const b = activeBulls.find(bull => String(bull.id) === String(e.target.value));
                    if (b) setFatherCustomTag(b.tagNumber);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 min-h-[42px] cursor-pointer"
                >
                  <option value="">-- Seleccionar Toro Activo --</option>
                  {activeBulls.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.tagNumber} {b.name ? `(${b.name})` : ''} • {b.breed || 'Toro'}
                    </option>
                  ))}
                  <option value="other">Otro toro / No listado...</option>
                </select>
              ) : null}

              {(fatherType === 'Inseminación / IATF' || fatherType === 'Desconocido' || (fatherType === 'Monta Natural' && (activeBulls.length === 0 || selectedBullId === 'other'))) && (
                <input
                  type="text"
                  value={fatherCustomTag}
                  onChange={(e) => setFatherCustomTag(e.target.value)}
                  placeholder={fatherType === 'Inseminación / IATF' ? 'Ej: Pajilla Gyr 504' : 'Chapa o nombre del toro'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 min-h-[42px]"
                />
              )}
            </div>

            {/* Potrero de Destino */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Potrero de Destino (Madre + Cría)
              </label>
              <input
                type="text"
                list="calving-paddocks"
                value={selectedPaddock}
                onChange={(e) => setSelectedPaddock(e.target.value)}
                placeholder="Ej: Potrero 1 - Maternidad"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 min-h-[42px]"
              />
              <datalist id="calving-paddocks">
                {paddocks.map(p => <option key={p.id || p.name} value={p.name} />)}
              </datalist>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. ESTADO POST-PARTO DE LA MADRE & PROGRAMACIÓN DE DESTETE                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Destino Productivo de la Madre */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Estado Post-Parto de la Madre</span>
            </h4>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Define el ciclo productivo al que pasará la vaca tras el parto:
            </p>

            <div className="space-y-2">
              {[
                { id: 'Levante de cría', title: '👶 Levante de Cría', desc: 'Amamantando al pie (Cría pura o carne)' },
                { id: 'Producción de leche', title: '🥛 Producción de Leche', desc: 'Entra a ordeño activo en Lechería' },
                { id: 'Doble Propósito', title: '🥛+👶 Doble Propósito', desc: 'Ordeño diario con ternero de apoyo' }
              ].map(opt => (
                <label
                  key={opt.id}
                  onClick={() => setMotherPostStatus(opt.id)}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    motherPostStatus === opt.id
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="motherPostStatus"
                    checked={motherPostStatus === opt.id}
                    onChange={() => setMotherPostStatus(opt.id)}
                    className="mt-0.5 text-amber-600"
                  />
                  <div>
                    <span className="text-xs font-black block">{opt.title}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Programación Automática de Destete */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200 dark:border-blue-800/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Programación de Destete Automático</span>
              </h4>
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleWeaning}
                  onChange={(e) => setScheduleWeaning(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Activo</span>
              </label>
            </div>

            {scheduleWeaning ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  El sistema agendará automáticamente la alerta en el Calendario de la Finca:
                </p>

                {/* Botones de Selección Rápida de Meses */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { m: 6, label: '6 Meses', days: '180 días' },
                    { m: 7, label: '7 Meses ⭐', days: '210d (ICA)' },
                    { m: 8, label: '8 Meses', days: '240 días' },
                  ].map(item => (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => setWeaningMonths(item.m)}
                      className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                        weaningMonths === item.m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md font-black'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold'
                      }`}
                    >
                      <span className="text-xs block">{item.label}</span>
                      <span className="text-[10px] opacity-80">{item.days}</span>
                    </button>
                  ))}
                </div>

                {/* Tarjeta de Fecha de Destete Calculada */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Fecha Programada de Destete:</span>
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                      {calculatedWeaningDate ? formatDate(calculatedWeaningDate) : '-'}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-800 dark:text-blue-300 font-semibold">
                    ✓ Se creará una tarea en el Calendario y una alarma en el Tablero Principal al cumplirse el período.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500">
                Destete automático desactivado para este nacimiento.
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 6. OBSERVACIONES / NOTAS ADICIONALES                                     */}
        {/* ========================================================================= */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Observaciones & Notas Clínicas (Opcional)
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles del parto, salud de la madre, expulsión de placenta, tratamientos iniciales..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* ========================================================================= */}
        {/* BOTONES DE ACCIÓN                                                        */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer min-h-[44px]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer min-h-[44px]"
          >
            <Baby className="w-4 h-4" />
            <span>Guardar Parto & Crear Cría(s) 🚀</span>
          </button>
        </div>

      </div>
    </Modal>
  );
}
