import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  SEX_OPTIONS, 
  PRODUCTION_TYPES, 
  CATEGORIES, 
  FEMALE_STATUSES,
  ENTRY_TYPES, 
  COMMON_BREEDS,
  getDynamicFarmColors 
} from '../../types/cattle';
import { BOVINE_GESTATION_DAYS } from '../../services/calculations';
import { Save, Milk, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Hash, Sparkles, Check, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findDuplicateCattle, saveTraceabilityLog } from '../../services/duplicateDetectionService';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { 
  analyzeFarmConsecutives, 
  evaluateCandidateConsecutive, 
  saveConsecutiveTraceabilityLog 
} from '../../services/consecutiveService';
import { ConsecutiveWarningModal } from './ConsecutiveWarningModal';

export function CattleFormModal({ isOpen, onClose, onSave, animal = null, zIndex = 'z-[60]', cattleList = [] }) {
  const { currentUser } = useAuth();
  const isEditing = Boolean(animal && animal.id);

  const [detectedDuplicates, setDetectedDuplicates] = useState([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [highlightDuplicates, setHighlightDuplicates] = useState(false);

  // Estado para Control de Numeración Consecutiva
  const [isConsecutiveModalOpen, setIsConsecutiveModalOpen] = useState(false);
  const [consecutiveWarningData, setConsecutiveWarningData] = useState(null);
  const [consecutiveConfirmed, setConsecutiveConfirmed] = useState(false);

  // Estadísticas de consecutivos en la finca seleccionada
  const farmConsecutiveStats = useMemo(() => {
    return analyzeFarmConsecutives(cattleList);
  }, [cattleList]);

  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    ironBrand: '',
    owner: 'Hacienda Principal',
    sex: 'Macho',
    breed: '',
    category: 'Novillo',
    productionType: 'Ceba',
    status: 'Activo',
    color: '',
    entryBatch: 'Ingreso #1',
    entryDate: new Date().toISOString().split('T')[0],
    entryType: 'Compra',
    entryWeight: '',
    entryPrice: '',
    additionalCosts: 0,
    currentWeight: '',
    notes: '',
    // Campos Exclusivos de Hembras
    femaleStatus: 'Vacía',
    reproductiveStatus: 'Vacía',
    serviceDate: '',
    expectedCalvingDate: '',
    milkingStatus: 'No aplica',
    dailyMilkLiters: '',
    lactationCycleDays: 305,
    lactationCycleTotalLiters: '',
    lactationCycleAvgLiters: '',
    isBreedingOnly: false,
  });

  const [showAdvancedMilk, setShowAdvancedMilk] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (animal) {
      const isFemale = animal.sex === 'Hembra';
      const initialFemaleStatus = isFemale ? (
        animal.femaleStatus || (
          animal.reproductiveStatus === 'Preñada' || animal.reproductiveStatus === 'Gestación'
            ? 'Gestación'
            : animal.milkingStatus === 'En ordeño'
              ? 'Producción de leche'
              : animal.isBreedingOnly
                ? 'Levante de cría'
                : 'Vacía'
        )
      ) : 'No aplica';

      setFormData({
        ...animal,
        entryBatch: animal.entryBatch || animal.paddock || 'Ingreso #1',
        breed: animal.breed || '',
        entryWeight: animal.entryWeight !== undefined && animal.entryWeight !== null ? animal.entryWeight : '',
        entryPrice: animal.entryPrice !== undefined && animal.entryPrice !== null ? animal.entryPrice : '',
        additionalCosts: animal.additionalCosts || 0,
        currentWeight: animal.currentWeight || animal.entryWeight || '',
        femaleStatus: isFemale ? initialFemaleStatus : 'No aplica',
        reproductiveStatus: isFemale ? (animal.reproductiveStatus || (initialFemaleStatus === 'Gestación' ? 'Preñada' : 'Vacía')) : 'No aplica',
        milkingStatus: isFemale ? (animal.milkingStatus || (initialFemaleStatus === 'Producción de leche' ? 'En ordeño' : 'Seca')) : 'No aplica',
        dailyMilkLiters: isFemale ? (animal.dailyMilkLiters || '') : '',
        lactationCycleDays: isFemale ? (animal.lactationCycleDays || 305) : 305,
        lactationCycleTotalLiters: isFemale ? (animal.lactationCycleTotalLiters || '') : '',
        lactationCycleAvgLiters: isFemale ? (animal.lactationCycleAvgLiters || '') : '',
        serviceDate: isFemale ? (animal.serviceDate || '') : '',
        expectedCalvingDate: isFemale ? (animal.expectedCalvingDate || '') : '',
        isBreedingOnly: isFemale ? Boolean(animal.isBreedingOnly) : false,
      });

      if (isFemale && (animal.lactationCycleTotalLiters || animal.lactationCycleAvgLiters || (animal.dailyMilkLiters && animal.dailyMilkLiters > 0))) {
        setShowAdvancedMilk(true);
      }
    } else {
      setFormData({
        tagNumber: '',
        name: '',
        ironBrand: '',
        owner: 'Hacienda Principal',
        sex: 'Macho',
        breed: '',
        category: 'Novillo',
        productionType: 'Ceba',
        status: 'Activo',
        color: '',
        entryBatch: 'Ingreso #1',
        entryDate: new Date().toISOString().split('T')[0],
        entryType: 'Compra',
        entryWeight: '',
        entryPrice: '',
        additionalCosts: 0,
        currentWeight: '',
        notes: '',
        femaleStatus: 'No aplica',
        reproductiveStatus: 'No aplica',
        serviceDate: '',
        expectedCalvingDate: '',
        milkingStatus: 'No aplica',
        dailyMilkLiters: '',
        lactationCycleDays: 305,
        lactationCycleTotalLiters: '',
        lactationCycleAvgLiters: '',
        isBreedingOnly: false,
      });
      setShowAdvancedMilk(false);
    }
    setErrors({});
    setHighlightDuplicates(false);
    setConsecutiveConfirmed(false);
  }, [animal, isOpen]);

  // Evaluación en tiempo real del consecutivo
  const consecutiveEvaluation = useMemo(() => {
    return evaluateCandidateConsecutive(formData.tagNumber, farmConsecutiveStats);
  }, [formData.tagNumber, farmConsecutiveStats]);

  // Lista dinámica de colores (historial registrado en finca + base estándar)
  const availableColors = useMemo(() => {
    return getDynamicFarmColors(cattleList, formData.color);
  }, [cattleList, formData.color]);

  // Validación en tiempo real con Debounce para detectar identificaciones duplicadas
  useEffect(() => {
    if (!isOpen || !formData.tagNumber || !formData.tagNumber.trim()) {
      setDetectedDuplicates([]);
      return;
    }

    const timer = setTimeout(() => {
      const matches = findDuplicateCattle(
        {
          tagNumber: formData.tagNumber,
          ironBrand: formData.ironBrand,
          owner: formData.owner,
          id: animal?.id,
        },
        cattleList,
        animal?.id
      );
      setDetectedDuplicates(matches);
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.tagNumber, formData.ironBrand, formData.owner, cattleList, animal?.id, isOpen]);

  const handleServiceDateChange = (date) => {
    let expected = '';
    if (date) {
      const d = new Date(date);
      d.setDate(d.getDate() + BOVINE_GESTATION_DAYS);
      expected = d.toISOString().split('T')[0];
    }
    setFormData(prev => ({
      ...prev,
      serviceDate: date,
      expectedCalvingDate: expected,
    }));
  };

  // Cálculo automático del promedio y total de litros por ciclo para hembras
  const handleDailyMilkChange = (val) => {
    const daily = parseFloat(val) || 0;
    const days = parseInt(formData.lactationCycleDays) || 305;
    const autoTotal = daily > 0 ? (daily * days).toFixed(0) : '';
    const autoAvg = daily > 0 ? daily.toFixed(1) : '';

    setFormData(prev => ({
      ...prev,
      dailyMilkLiters: val,
      lactationCycleTotalLiters: prev.lactationCycleTotalLiters || autoTotal,
      lactationCycleAvgLiters: prev.lactationCycleAvgLiters || autoAvg,
    }));
  };

  const handleTotalCycleChange = (val) => {
    const total = parseFloat(val) || 0;
    const days = parseInt(formData.lactationCycleDays) || 305;
    const avg = days > 0 && total > 0 ? (total / days).toFixed(1) : '';

    setFormData(prev => ({
      ...prev,
      lactationCycleTotalLiters: val,
      lactationCycleAvgLiters: avg,
    }));
  };

  const handleFemaleStatusChange = (status) => {
    let repro = 'Vacía';
    let milk = 'No aplica';
    let breedingOnly = formData.isBreedingOnly;
    let prodType = formData.productionType;

    if (status === 'Gestación') {
      repro = 'Preñada';
      milk = formData.milkingStatus === 'En ordeño' ? 'En ordeño' : 'Seca';
      if (prodType === 'Ceba') prodType = 'Cría';
    } else if (status === 'Producción de leche') {
      repro = 'Vacía';
      milk = 'En ordeño';
      prodType = 'Lechería';
      setShowAdvancedMilk(true);
    } else if (status === 'Levante de cría') {
      repro = 'Vacía';
      milk = 'No aplica';
      breedingOnly = true;
      if (prodType === 'Ceba') prodType = 'Cría';
    } else if (status === 'Ceba / Levante / Engorde') {
      repro = 'No aplica';
      milk = 'No aplica';
      breedingOnly = false;
      prodType = 'Ceba';
      setShowAdvancedMilk(false);
    } else if (status === 'Vacía') {
      repro = 'Vacía';
      milk = 'Seca';
    }

    setFormData(prev => ({
      ...prev,
      femaleStatus: status,
      reproductiveStatus: repro,
      milkingStatus: milk,
      isBreedingOnly: breedingOnly,
      productionType: prodType,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'sex') {
      if (value === 'Macho') {
        setFormData(prev => ({
          ...prev,
          sex: 'Macho',
          category: 'Novillo',
          productionType: prev.productionType === 'Lechería' ? 'Ceba' : prev.productionType,
          femaleStatus: 'No aplica',
          reproductiveStatus: 'No aplica',
          serviceDate: '',
          expectedCalvingDate: '',
          milkingStatus: 'No aplica',
          dailyMilkLiters: '',
          lactationCycleTotalLiters: '',
          lactationCycleAvgLiters: '',
          isBreedingOnly: false,
        }));
        setShowAdvancedMilk(false);
      } else {
        setFormData(prev => ({
          ...prev,
          sex: 'Hembra',
          category: 'Vaca',
          productionType: prev.productionType === 'Ceba' ? 'Cría' : prev.productionType,
          femaleStatus: 'Vacía',
          reproductiveStatus: 'Vacía',
          milkingStatus: 'Seca',
          dailyMilkLiters: '',
          lactationCycleDays: 305,
          lactationCycleTotalLiters: '',
          lactationCycleAvgLiters: '',
          isBreedingOnly: false,
        }));
      }
      return;
    }

    if (errors[name]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Regla de Negocio: El peso inicial es obligatorio si es Macho o si es Hembra destinada a Levante y Ceba/Engorde.
  // Si la hembra se usa para Vientre, Cría, Lechería o Vaca de Producción, el peso inicial NO es obligatorio.
  const isFemale = formData.sex === 'Hembra';
  const isFatteningFemale = isFemale && formData.productionType === 'Ceba';
  const isWeightRequired = formData.sex === 'Macho' || isFatteningFemale;

  const executeSave = (dataToSave) => {
    const parsedEntryWeight = dataToSave.entryWeight && parseFloat(dataToSave.entryWeight) > 0 ? parseFloat(dataToSave.entryWeight) : null;
    const parsedCurrentWeight = dataToSave.currentWeight && parseFloat(dataToSave.currentWeight) > 0 ? parseFloat(dataToSave.currentWeight) : parsedEntryWeight;

    onSave({
      ...dataToSave,
      entryBatch: dataToSave.entryBatch || 'Ingreso #1',
      paddock: dataToSave.entryBatch || 'Ingreso #1',
      entryWeight: parsedEntryWeight,
      currentWeight: parsedCurrentWeight,
      entryPrice: parseFloat(dataToSave.entryPrice || 0),
      additionalCosts: parseFloat(dataToSave.additionalCosts || 0),
      // Campos de hembra: se guardan sólo si es hembra, si es macho se limpian por completo
      femaleStatus: isFemale ? (dataToSave.femaleStatus || 'Vacía') : 'No aplica',
      reproductiveStatus: isFemale ? (dataToSave.reproductiveStatus || 'Vacía') : 'No aplica',
      milkingStatus: isFemale ? (dataToSave.milkingStatus || 'No aplica') : 'No aplica',
      dailyMilkLiters: isFemale ? parseFloat(dataToSave.dailyMilkLiters || 0) : 0,
      lactationCycleDays: isFemale ? parseInt(dataToSave.lactationCycleDays || 305) : 0,
      lactationCycleTotalLiters: isFemale ? parseFloat(dataToSave.lactationCycleTotalLiters || 0) : 0,
      lactationCycleAvgLiters: isFemale ? parseFloat(dataToSave.lactationCycleAvgLiters || 0) : 0,
      serviceDate: isFemale ? (dataToSave.serviceDate || '') : '',
      expectedCalvingDate: isFemale ? (dataToSave.expectedCalvingDate || '') : '',
      isBreedingOnly: isFemale ? Boolean(dataToSave.isBreedingOnly) : false,
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.tagNumber.trim()) {
      newErrors.tagNumber = 'El número de arete o chapa es obligatorio';
    }

    if (!formData.color || !formData.color.trim()) {
      newErrors.color = 'El color de pelaje o señas particulares es obligatorio.';
    }

    if (isWeightRequired) {
      if (formData.entryWeight === '' || formData.entryWeight === null || Number(formData.entryWeight) <= 0) {
        newErrors.entryWeight = 'El peso inicial es obligatorio para animales destinados a ceba / engorde.';
      }
    } else {
      if (formData.entryWeight !== '' && Number(formData.entryWeight) < 0) {
        newErrors.entryWeight = 'El peso no puede ser negativo.';
      }
    }

    if (formData.entryPrice === '' || Number(formData.entryPrice) < 0) {
      newErrors.entryPrice = 'El valor o costo de entrada no puede ser negativo.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 1. VALIDACIÓN DE CONSECUTIVO PRINCIPAL (Si no ha sido confirmada)
    if (!consecutiveConfirmed && !consecutiveEvaluation.isValid && consecutiveEvaluation.isNumeric) {
      setConsecutiveWarningData({
        enteredTag: formData.tagNumber,
        enteredConsecutive: consecutiveEvaluation.enteredConsecutive,
        lastConsecutive: farmConsecutiveStats.maxConsecutive,
        expectedConsecutive: farmConsecutiveStats.nextSuggestedConsecutive,
        warningType: consecutiveEvaluation.warningType,
        warningTitle: consecutiveEvaluation.title,
        warningMessage: consecutiveEvaluation.message,
        jump: consecutiveEvaluation.details?.jump || 0,
        matchingAnimals: consecutiveEvaluation.details?.matchingAnimals || [],
      });
      setIsConsecutiveModalOpen(true);
      return;
    }

    // 2. VALIDACIÓN OBLIGATORIA FINAL DE DUPLICADOS EN ACTIVO
    const finalDuplicates = findDuplicateCattle(
      {
        tagNumber: formData.tagNumber,
        ironBrand: formData.ironBrand,
        owner: formData.owner,
        id: animal?.id,
      },
      cattleList,
      animal?.id
    );

    if (finalDuplicates.length > 0) {
      setDetectedDuplicates(finalDuplicates);
      setIsDuplicateModalOpen(true);
      setHighlightDuplicates(true);
      return;
    }

    executeSave(formData);
  };

  const handleConfirmContinueConsecutive = () => {
    // Registrar auditoría en el sistema de trazabilidad de consecutivos
    saveConsecutiveTraceabilityLog({
      userId: currentUser?.id,
      farmName: currentUser?.farmName,
      tagNumberEntered: formData.tagNumber,
      consecutiveExtracted: consecutiveEvaluation.enteredConsecutive,
      lastConsecutive: farmConsecutiveStats.maxConsecutive,
      expectedConsecutive: farmConsecutiveStats.nextSuggestedConsecutive,
      warningType: consecutiveEvaluation.warningType,
      warningTitle: consecutiveEvaluation.title,
      warningMessage: consecutiveEvaluation.message,
      actionTaken: 'Continuó pese a advertencia',
      notes: isEditing ? 'Modificación confirmada por el usuario pese a advertencia de numeración' : 'Registro de nuevo animal confirmado por el usuario pese a advertencia de numeración',
    });

    setIsConsecutiveModalOpen(false);
    setConsecutiveConfirmed(true);

    // Proceder inmediatamente a validación de duplicados
    const finalDuplicates = findDuplicateCattle(
      {
        tagNumber: formData.tagNumber,
        ironBrand: formData.ironBrand,
        owner: formData.owner,
        id: animal?.id,
      },
      cattleList,
      animal?.id
    );

    if (finalDuplicates.length > 0) {
      setDetectedDuplicates(finalDuplicates);
      setIsDuplicateModalOpen(true);
      setHighlightDuplicates(true);
      return;
    }

    executeSave(formData);
  };

  const handleConfirmContinueDuplicate = () => {
    // Registrar decisión en el sistema de trazabilidad
    saveTraceabilityLog({
      userId: currentUser?.id,
      farmName: currentUser?.farmName,
      tagNumberEntered: formData.tagNumber,
      ironBrand: formData.ironBrand,
      owner: formData.owner,
      matchingAnimals: detectedDuplicates.map(d => d.animal),
      priority: detectedDuplicates[0]?.priority || 'MEDIA',
      reasons: detectedDuplicates.map(d => d.matchType),
      notes: isEditing ? 'Modificación confirmada por el usuario pese a alerta de duplicado' : 'Registro de nuevo animal confirmado por el usuario pese a alerta de duplicado',
    });

    setIsDuplicateModalOpen(false);
    executeSave(formData);
  };

  const availableCategories = CATEGORIES.filter(c => c.sex === 'Ambos' || c.sex === formData.sex);

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Bovino ${formData.tagNumber}` : 'Registrar Nuevo Bovino en Finca'}
      subtitle="Ingresa la identificación, Ingreso #, procedencia, peso y costos"
      maxWidth="max-w-3xl"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        
        {/* SECCIÓN 1: Identificación y Origen */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            1. Identificación y Propiedad
          </h4>

          {/* Panel de Control de Numeración Consecutiva de la Finca */}
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/15 via-slate-900/10 to-slate-900/15 dark:from-emerald-950/40 dark:via-slate-900/50 dark:to-slate-900/50 border-2 border-emerald-500/40 dark:border-emerald-500/50 text-xs shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <Hash className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-black uppercase tracking-wider text-xs sm:text-sm text-slate-900 dark:text-white block">
                    Control de Numeración de Finca
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Calculado automáticamente sobre todo el historial
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = farmConsecutiveStats.nextSuggestedConsecutive;
                    setFormData(prev => ({
                      ...prev,
                      tagNumber: prev.tagNumber.includes('-') 
                        ? `${nextNum}-${prev.tagNumber.split('-')[1]}` 
                        : prev.tagNumber.includes('/') 
                          ? `${nextNum}/${prev.tagNumber.split('/')[1]}` 
                          : String(nextNum)
                    }));
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Usar sugerido (#{farmConsecutiveStats.nextSuggestedConsecutive})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center mb-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase block">Último Registrado:</span>
                <strong className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {farmConsecutiveStats.maxConsecutive > 0 ? `#${farmConsecutiveStats.maxConsecutive}` : 'Ninguno'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 dark:bg-emerald-950/80 border-2 border-emerald-500 dark:border-emerald-500/80 shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-black uppercase block">Siguiente Sugerido:</span>
                <strong className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                  #{farmConsecutiveStats.nextSuggestedConsecutive}
                </strong>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-center shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase block">Total Histórico:</span>
                <strong className="text-base sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
                  {farmConsecutiveStats.distinctConsecutivesCount}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              ℹ️ La numeración se calcula usando únicamente el número <strong>antes de <code>-</code> o <code>/</code></strong> (ej. <strong>25-6 → 25</strong>). Los números posteriores no modifican el consecutivo principal.
            </p>
          </div>

          {/* Banner de Advertencia de Duplicado Detectado en Vivo */}
          {detectedDuplicates.length > 0 && (
            <div className="mb-4 p-3.5 rounded-xl border border-amber-300 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs shadow-sm animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide text-[11px]">
                      ⚠️ Posible Identificación Duplicada Detectada ({detectedDuplicates[0]?.priority === 'ALTA' ? 'Prioridad ALTA' : 'Prioridad MEDIA'})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDuplicateModalOpen(true)}
                      className="text-xs font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"
                    >
                      Ver detalle de coincidencia ({detectedDuplicates.length}) →
                    </button>
                  </div>
                  <p className="text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    Ya existe {detectedDuplicates.length === 1 ? 'un animal activo' : `${detectedDuplicates.length} animales activos`} con la identificación <strong className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">{detectedDuplicates[0]?.animal?.tagNumber}</strong>
                    {detectedDuplicates[0]?.matchType === 'tag_brand_and_owner' && ' y la misma marca y propietario.'}
                    {detectedDuplicates[0]?.matchType === 'tag_and_brand' && ' y la misma marca de hierro.'}
                    {detectedDuplicates[0]?.matchType === 'tag_and_owner' && ' y el mismo propietario.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                N° Arete / Chapa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="tagNumber"
                value={formData.tagNumber}
                onChange={handleChange}
                placeholder="Ej. 25-6, 25/5, 452"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  detectedDuplicates.length > 0 
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20' 
                    : errors.tagNumber 
                      ? 'border-rose-500 ring-2 ring-rose-500/20' 
                      : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
              />
              
              {/* Badge de estado del consecutivo en tiempo real */}
              {formData.tagNumber.trim() && consecutiveEvaluation.isNumeric && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] animate-fadeIn">
                  {consecutiveEvaluation.status === 'exact_match' || consecutiveEvaluation.status === 'first_animal' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-600/50">
                      <Check className="w-3 h-3" />
                      <span>✓ Consecutivo correcto (#{consecutiveEvaluation.enteredConsecutive})</span>
                    </span>
                  ) : consecutiveEvaluation.status === 'jump_ahead' ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-600/50">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>⚠️ Salto (+{consecutiveEvaluation.details?.jump}): Ingresando #{consecutiveEvaluation.enteredConsecutive} (Esperado #{farmConsecutiveStats.nextSuggestedConsecutive})</span>
                    </span>
                  ) : consecutiveEvaluation.status === 'lower_or_reused' ? (
                    <span className="inline-flex items-center gap-1 text-blue-800 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-600/50">
                      <Info className="w-3 h-3 text-blue-600" />
                      <span>ℹ️ Consecutivo #{consecutiveEvaluation.enteredConsecutive} (menor/histórico)</span>
                    </span>
                  ) : null}
                </div>
              )}

              {errors.tagNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.tagNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre / Alias (Opcional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. La Mora, El Sultán"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sexo <span className="text-rose-500">*</span>
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              >
                {SEX_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca de Hierro
              </label>
              <input
                type="text"
                name="ironBrand"
                value={formData.ironBrand}
                onChange={handleChange}
                placeholder="Ej. EP-01, RG-★"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  detectedDuplicates.some(d => d.matchType === 'tag_and_brand' || d.matchType === 'tag_brand_and_owner')
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Propietario / Dueño
              </label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                placeholder="Ej. Hacienda Principal, Ganado en Compañía"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  detectedDuplicates.some(d => d.matchType === 'tag_and_owner' || d.matchType === 'tag_brand_and_owner')
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Raza, Categoría, Ingreso # y Propósito */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            2. Características Zootécnicas & Ingreso #
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* INGRESO # */}
            <div>
              <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                Ingreso # (Lote / Consecutivo) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="entryBatch"
                value={formData.entryBatch}
                onChange={handleChange}
                placeholder="Ej. Ingreso #1, Ingreso #2, Lote A"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-400 dark:border-emerald-600/60 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Raza / Cruce
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                list="breeds-list"
                placeholder="Seleccionar o escribir raza"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
              <datalist id="breeds-list">
                {COMMON_BREEDS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría / Etapa ({formData.sex === 'Hembra' ? 'Hembras' : 'Machos'})
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              >
                {availableCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Producción <span className="text-rose-500">*</span>
              </label>
              <select
                name="productionType"
                value={formData.productionType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              >
                {PRODUCTION_TYPES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Color de Pelaje / Señas Particulares <span className="text-rose-500 font-bold">*</span>
                </label>
                {errors.color && (
                  <span className="text-[11px] text-rose-500 font-bold">
                    ⚠️ Obligatorio
                  </span>
                )}
              </div>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                list="cattle-form-colors-list"
                placeholder="Ej. Blanco, Castaño, Hosco, Negro, Sardo"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  errors.color ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
                required
              />
              {errors.color && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.color}</p>}
              
              {/* Sugerencias Rápidas de Color Dinámicas (Historial de finca + nuevos + comunes) */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Colores registrados y frecuentes:
                  </span>
                  <span className="text-[9px] text-slate-400">Toca para seleccionar</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  {availableColors.map((c) => {
                    const isSelected = formData.color?.trim().toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, color: c }));
                          if (errors.color) {
                            setErrors(prev => {
                              const n = { ...prev };
                              delete n.color;
                              return n;
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datalist para autocompletar en el input */}
              <datalist id="cattle-form-colors-list">
                {availableColors.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* SECCIÓN CONDICIONAL: ÚNICAMENTE PARA HEMBRAS */}
        {formData.sex === 'Hembra' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-2">
                <span>🐄 Estado Productivo de la Hembra (Solo Hembras)</span>
              </h4>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Ceba, Lechería o Cría</span>
            </div>

            {/* Selector Principal de Estado de Hembra */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {FEMALE_STATUSES.map((item) => {
                const isSelected = formData.femaleStatus === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => handleFemaleStatusChange(item.value)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition min-h-[60px] cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/50'
                        : 'bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-500/30 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <span className="text-xs font-extrabold leading-snug">{item.label}</span>
                    <span className={`text-[10px] font-bold mt-1.5 ${isSelected ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.short || (item.value === 'Producción de leche' ? 'Ordeño' : item.value === 'Levante de cría' ? 'Con ternero' : item.value === 'Gestación' ? 'Preñez' : item.value === 'Ceba / Levante / Engorde' ? 'Ceba / Engorde' : 'Abierta')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Si es Ceba / Levante / Engorde: Explicación de ceba */}
            {formData.femaleStatus === 'Ceba / Levante / Engorde' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <span className="text-base shrink-0">🥩</span>
                <div>
                  <span className="font-extrabold block">Espacio de Ceba, Levante o Engorde de Hembras</span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    Animal clasificado para ganancia de peso (GDP), engorde de novilla o vaca de ceba comercial para venta por kilo.
                  </span>
                </div>
              </div>
            )}

            {/* Si está en Gestación (Preñada): Fecha de servicio y parto */}
            {formData.femaleStatus === 'Gestación' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/30">
                <div>
                  <label className="block text-xs font-semibold text-purple-950 dark:text-purple-200 mb-1">
                    Fecha de Servicio / Inseminación
                  </label>
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={(e) => handleServiceDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-950 dark:text-purple-200 mb-1">
                    Fecha Estimada Parto (+283d)
                  </label>
                  <input
                    type="date"
                    name="expectedCalvingDate"
                    value={formData.expectedCalvingDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN OPCIONAL / AVANZADA DE LECHERÍA Y CICLO PRODUCTIVO (SOLO HEMBRAS) */}
            <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 overflow-hidden bg-white/70 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setShowAdvancedMilk(!showAdvancedMilk)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Milk className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Control Lechero: Producción Diaria y Litros por Ciclo Productivo (Opcional)</span>
                </span>
                {showAdvancedMilk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedMilk && (
                <div className="p-3.5 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t border-purple-100 dark:border-purple-500/20">
                  
                  {/* Litros por día */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Producción de Leche por Día (Litros / Día)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="dailyMilkLiters"
                      value={formData.dailyMilkLiters}
                      onChange={(e) => handleDailyMilkChange(e.target.value)}
                      placeholder="Ej. 14.5"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                    <span className="text-[10px] text-slate-400">Litros diarios actuales</span>
                  </div>

                  {/* Litros totales por ciclo */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Litros por Ciclo Productivo (Lactancia)
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="lactationCycleTotalLiters"
                      value={formData.lactationCycleTotalLiters}
                      onChange={(e) => handleTotalCycleChange(e.target.value)}
                      placeholder="Ej. 4500"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                    <span className="text-[10px] text-slate-400">Total litros del ciclo</span>
                  </div>

                  {/* Promedio litros por ciclo */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Promedio Litros / Ciclo Productivo
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="lactationCycleAvgLiters"
                      value={formData.lactationCycleAvgLiters}
                      onChange={handleChange}
                      placeholder="Ej. 14.8"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-extrabold focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                    <span className="text-[10px] text-slate-400">Litros promedio/día en ciclo</span>
                  </div>

                </div>
              )}
            </div>

            {/* Checkbox Solo Cría (Solo Hembras) */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-100/60 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/20">
              <input
                type="checkbox"
                id="isBreedingOnly"
                name="isBreedingOnly"
                checked={formData.isBreedingOnly}
                onChange={handleChange}
                className="w-5 h-5 rounded border-purple-400 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="isBreedingOnly" className="text-xs sm:text-sm text-purple-950 dark:text-purple-100 font-medium cursor-pointer select-none">
                <span className="font-bold">¿Es hembra destinada solamente a cría / vientre reproductor?</span>
                <span className="block text-xs text-purple-800 dark:text-purple-300">
                  Marca esta casilla si el animal está reservado exclusivamente para multiplicación y terneros.
                </span>
              </label>
            </div>

          </div>
        )}

        {/* SECCIÓN 3: Ingreso y Costos */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            3. Datos de Ingreso, Pesaje Inicial y Costos
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Ingreso <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Entrada
              </label>
              <select
                name="entryType"
                value={formData.entryType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              >
                {ENTRY_TYPES.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            {/* Peso Inicial: Obligatorio para machos y ceba de hembras, OPCIONAL para vientres/cría/lechería */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Inicial (kg) {isWeightRequired ? (
                  <span className="text-rose-500">*</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Opcional en Cría/Lechería)</span>
                )}
              </label>
              <input
                type="number"
                step="0.5"
                name="entryWeight"
                value={formData.entryWeight}
                onChange={handleChange}
                placeholder={isWeightRequired ? "Ej. 280 (Obligatorio)" : "Ej. 420 (Opcional)"}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px] ${
                  errors.entryWeight ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.entryWeight && <p className="text-[11px] text-rose-500 mt-1">{errors.entryWeight}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Inicial / Compra ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                placeholder="Ej. 2500000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
              {errors.entryPrice && <p className="text-[11px] text-rose-500 mt-1">{errors.entryPrice}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Costos Directos Acumulados ($) (Fletes, vacunas, etc.)
              </label>
              <input
                type="number"
                name="additionalCosts"
                value={formData.additionalCosts}
                onChange={handleChange}
                placeholder="Ej. 120000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notas y Observaciones
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Sanidad, temperamento, procedencia..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition min-h-[44px] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Guardar Cambios' : 'Registrar Bovino'}</span>
          </button>
        </div>

      </form>
    </Modal>

    {/* Modal de Advertencia de Consecutivo */}
    <ConsecutiveWarningModal
      isOpen={isConsecutiveModalOpen}
      onClose={() => setIsConsecutiveModalOpen(false)}
      onConfirmContinue={handleConfirmContinueConsecutive}
      warningData={consecutiveWarningData}
      zIndex="z-[75]"
    />

    {/* Modal de Advertencia de Identificación Duplicada */}
    <DuplicateWarningModal
      isOpen={isDuplicateModalOpen}
      onClose={() => setIsDuplicateModalOpen(false)}
      onConfirmContinue={handleConfirmContinueDuplicate}
      duplicates={detectedDuplicates}
      candidateData={formData}
      zIndex="z-[70]"
    />
    </>
  );
}
