import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  SEX_OPTIONS, 
  PRODUCTION_TYPES, 
  CATEGORIES, 
  FEMALE_STATUSES,
  ENTRY_TYPES, 
  COMMON_BREEDS,
  getDynamicFarmColors,
  getDynamicFarmIronBrands
} from '../../types/cattle';
import { BOVINE_GESTATION_DAYS, formatDate } from '../../services/calculations';
import { Save, Milk, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Hash, Sparkles, Check, Info, Heart, Dna, Tag, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findDuplicateCattle, saveTraceabilityLog } from '../../services/duplicateDetectionService';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { 
  analyzeFarmConsecutives, 
  evaluateCandidateConsecutive, 
  saveConsecutiveTraceabilityLog 
} from '../../services/consecutiveService';
import { ConsecutiveWarningModal } from './ConsecutiveWarningModal';
import { saveDraft, loadDraft, clearDraft } from '../../services/draftService';

export function CattleFormModal({ isOpen, onClose, onSave, animal = null, zIndex = 'z-[60]', cattleList = [] }) {
  const { currentUser, isWorker } = useAuth();
  const isEditing = Boolean(animal && animal.id);

  const [detectedDuplicates, setDetectedDuplicates] = useState([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [highlightDuplicates, setHighlightDuplicates] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const isDraftInitializedRef = React.useRef(false);

  // Estado para Control de Numeración Consecutiva
  const [isConsecutiveModalOpen, setIsConsecutiveModalOpen] = useState(false);
  const [consecutiveWarningData, setConsecutiveWarningData] = useState(null);
  const [consecutiveConfirmed, setConsecutiveConfirmed] = useState(false);

  // Estado local para input de días de preñez (diagnóstico de palpación/ecografía)
  const [gestationDaysInput, setGestationDaysInput] = useState('');

  // Estadísticas de consecutivos en la finca seleccionada
  const farmConsecutiveStats = useMemo(() => {
    return analyzeFarmConsecutives(cattleList);
  }, [cattleList]);

  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    ironBrand: '',
    owner: 'Hacienda Principal',
    sex: '',
    breed: '',
    category: '',
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
    // Trazabilidad de Nacimientos & Genealogía
    motherId: '',
    motherTag: '',
    fatherType: 'toro', // 'toro' | 'pajilla' | 'desconocido'
    fatherId: '',
    fatherTag: '',
    birthWeight: '',
    // Campos Exclusivos de Hembras
    femaleStatuses: ['Vacía'],
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
  const [motherMode, setMotherMode] = useState('hato'); // 'hato' | 'libre'
  const [enableGenealogy, setEnableGenealogy] = useState(false);
  const [errors, setErrors] = useState({});

  // Lista de posibles vacas madres del hato
  const availableMothers = useMemo(() => {
    return cattleList.filter(c => c.sex === 'Hembra' && (!animal || c.id !== animal.id));
  }, [cattleList, animal]);

  // Lista de posibles toros reproductores del hato
  const availableBulls = useMemo(() => {
    return cattleList.filter(c => c.sex === 'Macho' && (!animal || c.id !== animal.id));
  }, [cattleList, animal]);

  useEffect(() => {
    if (animal) {
      const isFemale = animal.sex === 'Hembra';
      
      let initialFemaleStatuses = [];
      if (isFemale) {
        if (Array.isArray(animal.femaleStatuses) && animal.femaleStatuses.length > 0) {
          initialFemaleStatuses = [...animal.femaleStatuses];
        } else if (typeof animal.femaleStatus === 'string' && animal.femaleStatus.includes(',')) {
          initialFemaleStatuses = animal.femaleStatus.split(',').map(s => s.trim()).filter(Boolean);
        } else if (animal.femaleStatus && animal.femaleStatus !== 'No aplica') {
          initialFemaleStatuses = [animal.femaleStatus];
        } else {
          if (animal.reproductiveStatus === 'Preñada' || animal.reproductiveStatus === 'Gestación') {
            initialFemaleStatuses.push('Gestación');
          }
          if (animal.milkingStatus === 'En ordeño' || (parseFloat(animal.dailyMilkLiters) > 0)) {
            initialFemaleStatuses.push('Producción de leche');
          }
          if (animal.isBreedingOnly) {
            initialFemaleStatuses.push('Levante de cría');
          }
          if (animal.productionType === 'Ceba' && initialFemaleStatuses.length === 0) {
            initialFemaleStatuses.push('Ceba / Levante / Engorde');
          }
          if (initialFemaleStatuses.length === 0) {
            initialFemaleStatuses = ['Vacía'];
          }
        }
      }
      const initialFemaleStatus = initialFemaleStatuses.join(', ') || 'Vacía';

      let initialPregDays = '';
      if (isFemale && (animal.pregnancyDays || animal.serviceDate || animal.expectedCalvingDate)) {
        if (animal.pregnancyDays) {
          initialPregDays = String(animal.pregnancyDays);
        } else if (animal.serviceDate) {
          const sDate = new Date(animal.serviceDate);
          if (!isNaN(sDate.getTime())) {
            const diffDays = Math.floor((new Date() - sDate) / 86400000);
            if (diffDays >= 0 && diffDays <= 300) initialPregDays = String(diffDays);
          }
        } else if (animal.expectedCalvingDate) {
          const expDate = new Date(animal.expectedCalvingDate);
          if (!isNaN(expDate.getTime())) {
            const remDays = Math.ceil((expDate - new Date()) / 86400000);
            const calcDays = BOVINE_GESTATION_DAYS - remDays;
            if (calcDays >= 0 && calcDays <= 300) initialPregDays = String(calcDays);
          }
        }
      }
      setGestationDaysInput(initialPregDays);

      setFormData({
        ...animal,
        entryBatch: animal.entryBatch || animal.paddock || 'Ingreso #1',
        breed: animal.breed || '',
        entryType: animal.entryType || (animal.origin === 'Nacido en finca' ? 'Nacimiento' : 'Compra'),
        motherId: animal.motherId || '',
        motherTag: animal.motherTag || '',
        fatherType: animal.fatherType || 'toro',
        fatherId: animal.fatherId || '',
        fatherTag: animal.fatherTag || '',
        birthWeight: animal.birthWeight || '',
        entryWeight: animal.entryWeight !== undefined && animal.entryWeight !== null ? animal.entryWeight : '',
        entryPrice: animal.entryPrice !== undefined && animal.entryPrice !== null ? animal.entryPrice : '',
        additionalCosts: animal.additionalCosts || 0,
        currentWeight: animal.currentWeight || animal.entryWeight || '',
        femaleStatuses: isFemale ? initialFemaleStatuses : [],
        femaleStatus: isFemale ? initialFemaleStatus : 'No aplica',
        reproductiveStatus: isFemale ? (initialFemaleStatuses.includes('Gestación') ? 'Preñada' : 'Vacía') : 'No aplica',
        milkingStatus: isFemale ? (initialFemaleStatuses.includes('Producción de leche') ? 'En ordeño' : 'Seca') : 'No aplica',
        dailyMilkLiters: isFemale ? (animal.dailyMilkLiters || '') : '',
        lactationCycleDays: isFemale ? (animal.lactationCycleDays || 305) : 305,
        lactationCycleTotalLiters: isFemale ? (animal.lactationCycleTotalLiters || '') : '',
        lactationCycleAvgLiters: isFemale ? (animal.lactationCycleAvgLiters || '') : '',
        serviceDate: isFemale ? (animal.serviceDate || '') : '',
        expectedCalvingDate: isFemale ? (animal.expectedCalvingDate || '') : '',
        pregnancyDays: isFemale ? (animal.pregnancyDays || (initialPregDays ? parseInt(initialPregDays) : 0)) : 0,
        isBreedingOnly: isFemale ? Boolean(initialFemaleStatuses.includes('Levante de cría') || animal.isBreedingOnly) : false,
      });

      if (isFemale && (initialFemaleStatuses.includes('Producción de leche') || animal.lactationCycleTotalLiters || animal.lactationCycleAvgLiters || (animal.dailyMilkLiters && animal.dailyMilkLiters > 0))) {
        setShowAdvancedMilk(true);
      }
      setMotherMode(animal.motherId ? 'hato' : (animal.motherTag ? 'libre' : (availableMothers.length > 0 ? 'hato' : 'libre')));
      if (animal.motherTag || animal.motherId || animal.fatherTag || animal.fatherId) {
        setEnableGenealogy(true);
      } else {
        setEnableGenealogy(false);
      }
    } else {
      setGestationDaysInput('');
      setMotherMode(availableMothers.length > 0 ? 'hato' : 'libre');
      setEnableGenealogy(false);
      setFormData({
        tagNumber: '',
        name: '',
        ironBrand: '',
        owner: 'Hacienda Principal',
        sex: '',
        breed: '',
        category: '',
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
        motherId: '',
        motherTag: '',
        fatherType: 'toro',
        fatherId: '',
        fatherTag: '',
        birthWeight: '',
        femaleStatuses: [],
        femaleStatus: 'No aplica',
        reproductiveStatus: 'No aplica',
        serviceDate: '',
        expectedCalvingDate: '',
        pregnancyDays: 0,
        milkingStatus: 'No aplica',
        dailyMilkLiters: '',
        lactationCycleDays: 305,
        lactationCycleTotalLiters: '',
        lactationCycleAvgLiters: '',
        isBreedingOnly: false,
      });
      setShowAdvancedMilk(false);

      // Cargar borrador para nuevo animal si existe
      const draft = loadDraft('cattle_form');
      if (draft) {
        setFormData(draft);
        if (draft.pregnancyDays) setGestationDaysInput(String(draft.pregnancyDays));
        const hasData = draft.tagNumber || draft.name || draft.entryWeight || draft.color || draft.notes || draft.entryPrice;
        if (hasData) {
          setIsDraftRestored(true);
        }
      }
    }
    setErrors({});
    setHighlightDuplicates(false);
    setConsecutiveConfirmed(false);
    setTimeout(() => {
      isDraftInitializedRef.current = true;
    }, 100);
  }, [animal, isOpen]);

  // Auto-guardar borrador continuamente en segundo plano (solo cuando es registro de animal nuevo)
  useEffect(() => {
    if (!isOpen || isEditing || !isDraftInitializedRef.current) return;

    const hasData = formData.tagNumber || formData.name || formData.entryWeight || formData.color || formData.notes || formData.entryPrice || formData.ironBrand;

    if (hasData) {
      saveDraft('cattle_form', formData);
    }
  }, [isOpen, isEditing, formData]);

  // Descartar borrador y reiniciar formulario
  const handleDiscardDraft = () => {
    clearDraft('cattle_form');
    setIsDraftRestored(false);
    setGestationDaysInput('');
    setFormData({
      tagNumber: '',
      name: '',
      ironBrand: '',
      owner: 'Hacienda Principal',
      sex: '',
      breed: '',
      category: '',
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
      motherId: '',
      motherTag: '',
      fatherType: 'toro',
      fatherId: '',
      fatherTag: '',
      birthWeight: '',
      femaleStatuses: [],
      femaleStatus: 'No aplica',
      reproductiveStatus: 'No aplica',
      serviceDate: '',
      expectedCalvingDate: '',
      pregnancyDays: 0,
      milkingStatus: 'No aplica',
      dailyMilkLiters: '',
      lactationCycleDays: 305,
      lactationCycleTotalLiters: '',
      lactationCycleAvgLiters: '',
      isBreedingOnly: false,
    });
    setShowAdvancedMilk(false);
    setErrors({});
  };

  // Evaluación en tiempo real del consecutivo
  const consecutiveEvaluation = useMemo(() => {
    return evaluateCandidateConsecutive(formData.tagNumber, farmConsecutiveStats);
  }, [formData.tagNumber, farmConsecutiveStats]);

  // Lista dinámica de colores (historial registrado en finca + base estándar)
  const availableColors = useMemo(() => {
    return getDynamicFarmColors(cattleList, formData.color);
  }, [cattleList, formData.color]);

  // Lista dinámica de hierros/marcas registrados en finca
  const availableIronBrands = useMemo(() => {
    return getDynamicFarmIronBrands(cattleList, formData.ironBrand);
  }, [cattleList, formData.ironBrand]);

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

  // Sincronización bidireccional de Días de Preñez, Fecha de Servicio y Fecha Estimada de Parto
  const handleGestationDaysChange = (daysVal) => {
    setGestationDaysInput(daysVal);
    if (daysVal === '' || daysVal === null) {
      return;
    }
    const days = parseInt(daysVal);
    if (!isNaN(days) && days >= 0) {
      const now = new Date();
      const sDate = new Date(now.getTime() - days * 86400000);
      const expDate = new Date(sDate.getTime() + BOVINE_GESTATION_DAYS * 86400000);
      
      setFormData(prev => ({
        ...prev,
        pregnancyDays: days,
        serviceDate: sDate.toISOString().split('T')[0],
        expectedCalvingDate: expDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleServiceDateChange = (date) => {
    if (date) {
      const sDate = new Date(date);
      if (!isNaN(sDate.getTime())) {
        const expDate = new Date(sDate.getTime() + BOVINE_GESTATION_DAYS * 86400000);
        const diffDays = Math.max(0, Math.floor((new Date() - sDate) / 86400000));
        setGestationDaysInput(diffDays <= 300 ? String(diffDays) : '');
        setFormData(prev => ({
          ...prev,
          serviceDate: date,
          pregnancyDays: diffDays,
          expectedCalvingDate: expDate.toISOString().split('T')[0]
        }));
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      serviceDate: date,
      expectedCalvingDate: ''
    }));
  };

  const handleExpectedCalvingDateChange = (date) => {
    if (date) {
      const expDate = new Date(date);
      if (!isNaN(expDate.getTime())) {
        const sDate = new Date(expDate.getTime() - BOVINE_GESTATION_DAYS * 86400000);
        const remDays = Math.ceil((expDate - new Date()) / 86400000);
        const calcDays = Math.max(0, BOVINE_GESTATION_DAYS - remDays);
        setGestationDaysInput(calcDays >= 0 && calcDays <= 300 ? String(calcDays) : '');
        setFormData(prev => ({
          ...prev,
          expectedCalvingDate: date,
          serviceDate: sDate.toISOString().split('T')[0],
          pregnancyDays: calcDays
        }));
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      expectedCalvingDate: date
    }));
  };

  // Cálculo en vivo de métricas y alertas de gestación
  const gestationStats = useMemo(() => {
    const isGestating = (Array.isArray(formData.femaleStatuses) && formData.femaleStatuses.includes('Gestación')) ||
      (typeof formData.femaleStatus === 'string' && formData.femaleStatus.includes('Gestación'));
    
    if (!isGestating) return null;

    let daysPregnant = parseInt(gestationDaysInput);
    if (isNaN(daysPregnant) || daysPregnant < 0) {
      if (formData.serviceDate) {
        const sDate = new Date(formData.serviceDate);
        if (!isNaN(sDate.getTime())) {
          daysPregnant = Math.max(0, Math.floor((new Date() - sDate) / 86400000));
        }
      } else if (formData.expectedCalvingDate) {
        const expDate = new Date(formData.expectedCalvingDate);
        if (!isNaN(expDate.getTime())) {
          const remDays = Math.ceil((expDate - new Date()) / 86400000);
          daysPregnant = Math.max(0, BOVINE_GESTATION_DAYS - remDays);
        }
      }
    }

    if (isNaN(daysPregnant)) daysPregnant = 0;
    const daysRemaining = Math.max(0, BOVINE_GESTATION_DAYS - daysPregnant);
    const monthsApprox = (daysPregnant / 30.4).toFixed(1);
    const progressPercent = Math.min(100, Math.max(0, Math.round((daysPregnant / BOVINE_GESTATION_DAYS) * 100)));

    let alertBadge = null;
    if (daysPregnant > 0 || formData.expectedCalvingDate || formData.serviceDate) {
      if (daysRemaining <= 10) {
        alertBadge = {
          level: 'critical',
          title: `🚨 Alerta Máxima: Parto Inminente (en ~${daysRemaining} días)`,
          description: 'Trasladar a potrero de paritorio o maternidad y mantener supervisión constante.',
          classes: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/70 text-rose-900 dark:text-rose-100',
          badgeClass: 'bg-rose-500 text-white'
        };
      } else if (daysRemaining <= 30) {
        alertBadge = {
          level: 'warning',
          title: `⚠️ Alerta Próximo Parto: Faltan ~${daysRemaining} días (1 mes o menos)`,
          description: 'Adecuar suplementación pre-parto, revisar estado de la ubre y preparar lote de maternidad.',
          classes: 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/70 text-amber-900 dark:text-amber-100',
          badgeClass: 'bg-amber-500 text-white'
        };
      } else if (daysRemaining <= 60) {
        alertBadge = {
          level: 'info',
          title: `ℹ️ Gestación Avanzada: Faltan ~${daysRemaining} días (~2 meses)`,
          description: 'Período óptimo para secado si estaba en ordeño e iniciar nutrición de transición.',
          classes: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700/70 text-indigo-900 dark:text-indigo-100',
          badgeClass: 'bg-indigo-500 text-white'
        };
      } else {
        alertBadge = {
          level: 'normal',
          title: `🍼 Gestación en Progreso: ${daysPregnant} días cumplidos (~${monthsApprox} meses)`,
          description: `Faltan aprox. ${daysRemaining} días para la fecha estimada de parto.`,
          classes: 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700/70 text-purple-900 dark:text-purple-100',
          badgeClass: 'bg-purple-600 text-white'
        };
      }
    }

    return {
      daysPregnant,
      daysRemaining,
      monthsApprox,
      progressPercent,
      alertBadge
    };
  }, [formData.femaleStatuses, formData.femaleStatus, formData.serviceDate, formData.expectedCalvingDate, gestationDaysInput]);

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

  // Selección múltiple interactiva del estado productivo de la hembra
  const toggleFemaleStatus = (statusValue) => {
    setFormData(prev => {
      let currentStatuses = Array.isArray(prev.femaleStatuses) && prev.femaleStatuses.length > 0
        ? [...prev.femaleStatuses]
        : (prev.femaleStatus && prev.femaleStatus !== 'No aplica' ? [prev.femaleStatus] : ['Vacía']);

      const isAlreadySelected = currentStatuses.includes(statusValue);
      let newStatuses = [];

      if (isAlreadySelected) {
        newStatuses = currentStatuses.filter(s => s !== statusValue);
        if (newStatuses.length === 0) {
          newStatuses = ['Vacía'];
        }
      } else {
        if (statusValue === 'Gestación') {
          newStatuses = [...currentStatuses.filter(s => s !== 'Vacía'), 'Gestación'];
        } else if (statusValue === 'Vacía') {
          newStatuses = [...currentStatuses.filter(s => s !== 'Gestación'), 'Vacía'];
        } else {
          const filtered = currentStatuses.filter(s => s !== 'Vacía');
          newStatuses = [...filtered, statusValue];
        }
      }

      const isPregnant = newStatuses.includes('Gestación');
      const isMilking = newStatuses.includes('Producción de leche');
      const isNursing = newStatuses.includes('Levante de cría');
      const isFattening = newStatuses.includes('Ceba / Levante / Engorde');

      let repro = isPregnant ? 'Preñada' : 'Vacía';
      let milk = isMilking ? 'En ordeño' : 'Seca';
      let breedingOnly = isNursing;
      let prodType = prev.productionType;

      if (isMilking && !isFattening) {
        prodType = (isPregnant || isNursing) ? 'Doble Propósito' : 'Lechería';
      } else if (isFattening && !isMilking) {
        prodType = 'Ceba';
      } else if (isPregnant || isNursing) {
        if (prodType === 'Ceba') prodType = 'Cría';
      }

      if (isMilking) {
        setShowAdvancedMilk(true);
      }

      return {
        ...prev,
        femaleStatuses: newStatuses,
        femaleStatus: newStatuses.join(', '),
        reproductiveStatus: repro,
        milkingStatus: milk,
        isBreedingOnly: breedingOnly,
        productionType: prodType,
      };
    });
  };

  const handleFemaleStatusChange = (status) => {
    toggleFemaleStatus(status);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'sex') {
      if (value === 'Macho') {
        setFormData(prev => ({
          ...prev,
          sex: 'Macho',
          category: prev.category === 'Vaca' || prev.category === 'Novilla' ? 'Novillo' : (prev.category || 'Novillo'),
          productionType: prev.productionType === 'Lechería' || prev.productionType === 'Cría' ? 'Ceba' : prev.productionType,
          femaleStatuses: [],
          femaleStatus: 'No aplica',
          reproductiveStatus: 'No aplica',
          serviceDate: '',
          expectedCalvingDate: '',
          pregnancyDays: 0,
          milkingStatus: 'No aplica',
          dailyMilkLiters: '',
          lactationCycleTotalLiters: '',
          lactationCycleAvgLiters: '',
          isBreedingOnly: false,
        }));
        setShowAdvancedMilk(false);
      } else if (value === 'Hembra') {
        setFormData(prev => ({
          ...prev,
          sex: 'Hembra',
          category: prev.category === 'Novillo' || prev.category === 'Toro' || prev.category === 'Torete' || prev.category === 'Buey' ? 'Vaca' : (prev.category || 'Vaca'),
          productionType: prev.productionType === 'Ceba' ? 'Cría' : prev.productionType,
          femaleStatuses: prev.femaleStatuses?.length ? prev.femaleStatuses : ['Vacía'],
          femaleStatus: prev.femaleStatus && prev.femaleStatus !== 'No aplica' ? prev.femaleStatus : 'Vacía',
          reproductiveStatus: prev.reproductiveStatus && prev.reproductiveStatus !== 'No aplica' ? prev.reproductiveStatus : 'Vacía',
          milkingStatus: prev.milkingStatus && prev.milkingStatus !== 'No aplica' ? prev.milkingStatus : 'Seca',
          dailyMilkLiters: prev.dailyMilkLiters || '',
          lactationCycleDays: 305,
          lactationCycleTotalLiters: prev.lactationCycleTotalLiters || '',
          lactationCycleAvgLiters: prev.lactationCycleAvgLiters || '',
          isBreedingOnly: false,
        }));
      } else {
        // En blanco '' (deseleccionado)
        setFormData(prev => ({
          ...prev,
          sex: '',
          femaleStatuses: [],
          femaleStatus: 'No aplica',
          reproductiveStatus: 'No aplica',
          milkingStatus: 'No aplica',
          dailyMilkLiters: '',
          lactationCycleTotalLiters: '',
          lactationCycleAvgLiters: '',
          isBreedingOnly: false,
        }));
        setShowAdvancedMilk(false);
      }

      if (errors.sex) {
        setErrors(prev => {
          const n = { ...prev };
          delete n.sex;
          return n;
        });
      }
      return;
    }

    if (name === 'productionType') {
      const isFemaleProd = value === 'Lechería' || value === 'Cría';
      setFormData(prev => {
        if (isFemaleProd) {
          // Predeterminar automáticamente en Hembra
          const isCurrentlyFemale = prev.sex === 'Hembra';
          const defaultStatuses = value === 'Lechería' ? ['Producción de leche'] : ['Vacía'];
          const newFemaleStatuses = isCurrentlyFemale && prev.femaleStatuses?.length ? prev.femaleStatuses : defaultStatuses;
          
          if (value === 'Lechería') {
            setShowAdvancedMilk(true);
          }

          return {
            ...prev,
            productionType: value,
            sex: 'Hembra',
            category: prev.category === 'Novillo' || prev.category === 'Toro' || prev.category === 'Torete' || prev.category === 'Buey' || !prev.category 
              ? (value === 'Lechería' ? 'Vaca' : 'Vaca') 
              : prev.category,
            femaleStatuses: newFemaleStatuses,
            femaleStatus: newFemaleStatuses.join(', ') || 'Vacía',
            reproductiveStatus: isCurrentlyFemale ? prev.reproductiveStatus : 'Vacía',
            milkingStatus: value === 'Lechería' ? 'En ordeño' : (isCurrentlyFemale ? prev.milkingStatus : 'Seca'),
          };
        } else {
          // Si cambia a Ceba o Doble Propósito: se preserva el sexo si ya estaba elegido, o se mantiene en blanco
          return {
            ...prev,
            productionType: value,
          };
        }
      });

      if (isFemaleProd && errors.sex) {
        setErrors(prev => {
          const n = { ...prev };
          delete n.sex;
          return n;
        });
      }
      if (errors.productionType) {
        setErrors(prev => {
          const n = { ...prev };
          delete n.productionType;
          return n;
        });
      }
      return;
    }

    if (name === 'category') {
      const femaleCats = ['Vaca', 'Novilla'];
      const maleCats = ['Novillo', 'Toro', 'Torete', 'Buey'];

      setFormData(prev => {
        let updatedSex = prev.sex;
        let updatedProd = prev.productionType;
        let femaleStatuses = prev.femaleStatuses;
        let femaleStatus = prev.femaleStatus;
        let reproductiveStatus = prev.reproductiveStatus;
        let milkingStatus = prev.milkingStatus;

        if (femaleCats.includes(value)) {
          updatedSex = 'Hembra';
          if (!prev.sex || prev.sex === 'Macho') {
            updatedProd = prev.productionType === 'Ceba' ? 'Cría' : prev.productionType;
            femaleStatuses = ['Vacía'];
            femaleStatus = 'Vacía';
            reproductiveStatus = 'Vacía';
            milkingStatus = 'Seca';
          }
        } else if (maleCats.includes(value)) {
          updatedSex = 'Macho';
          updatedProd = prev.productionType === 'Lechería' || prev.productionType === 'Cría' ? 'Ceba' : prev.productionType;
          femaleStatuses = [];
          femaleStatus = 'No aplica';
          reproductiveStatus = 'No aplica';
          milkingStatus = 'No aplica';
          setShowAdvancedMilk(false);
        }

        return {
          ...prev,
          category: value,
          sex: updatedSex,
          productionType: updatedProd,
          femaleStatuses,
          femaleStatus,
          reproductiveStatus,
          milkingStatus,
        };
      });

      if ((femaleCats.includes(value) || maleCats.includes(value)) && errors.sex) {
        setErrors(prev => {
          const n = { ...prev };
          delete n.sex;
          return n;
        });
      }
      if (errors.category) {
        setErrors(prev => {
          const n = { ...prev };
          delete n.category;
          return n;
        });
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
  // Si la hembra se usa para Vientre, Cría, Lechería o Vaca de Producción, o si el ganado es en Compañía, el peso inicial NO es obligatorio.
  const isFemale = formData.sex === 'Hembra';
  const isFatteningFemale = isFemale && (formData.productionType === 'Ceba' || formData.femaleStatuses?.includes('Ceba / Levante / Engorde') || formData.femaleStatus?.includes('Ceba'));
  const isWeightRequired = formData.entryType !== 'Compañía' && (formData.sex === 'Macho' || isFatteningFemale);

  // Regla de Negocio: Ingreso # (Lote / Consecutivo)
  // Obligatorio únicamente para animales comprados destinados a Ceba / Engorde o en Compañía.
  // NO es obligatorio para animales nacidos en la finca, ni para animales de cría, vientre, lechería o doble propósito.
  const isBornInFarm = formData.entryType === 'Nacimiento' || formData.origin === 'Nacido en finca';
  const isCompany = formData.entryType === 'Compañía' || (formData.owner && formData.owner.toLowerCase().includes('compañía'));
  const isFattening = formData.productionType === 'Ceba' || formData.femaleStatuses?.includes('Ceba / Levante / Engorde') || formData.femaleStatus?.includes('Ceba');
  const isEntryBatchRequired = !isBornInFarm && (isFattening || isCompany);

  const executeSave = (dataToSave) => {
    const parsedEntryWeight = dataToSave.entryWeight && parseFloat(dataToSave.entryWeight) > 0 ? parseFloat(dataToSave.entryWeight) : null;
    const parsedCurrentWeight = dataToSave.currentWeight && parseFloat(dataToSave.currentWeight) > 0 ? parseFloat(dataToSave.currentWeight) : parsedEntryWeight;
    const isBorn = dataToSave.entryType === 'Nacimiento';
    const batchValue = dataToSave.entryBatch?.trim() || '';

    const savedStatuses = isFemale ? (dataToSave.femaleStatuses?.length ? dataToSave.femaleStatuses : [dataToSave.femaleStatus || 'Vacía']) : [];
    const isSavedPregnant = savedStatuses.includes('Gestación');
    const isSavedMilking = savedStatuses.includes('Producción de leche');
    const isSavedNursing = savedStatuses.includes('Levante de cría');

    onSave({
      ...dataToSave,
      entryBatch: batchValue,
      paddock: batchValue,
      entryType: dataToSave.entryType || 'Compra',
      origin: isBorn ? 'Nacido en finca' : (dataToSave.origin || 'Comprado / Externo'),
      motherId: dataToSave.motherId || '',
      motherTag: dataToSave.motherTag || '',
      fatherType: dataToSave.fatherType || 'toro',
      fatherId: dataToSave.fatherId || '',
      fatherTag: dataToSave.fatherTag || '',
      birthWeight: isBorn && parsedEntryWeight ? parsedEntryWeight : (dataToSave.birthWeight || null),
      entryWeight: parsedEntryWeight,
      currentWeight: parsedCurrentWeight,
      entryPrice: isBorn && (!dataToSave.entryPrice || parseFloat(dataToSave.entryPrice) <= 0) ? 0 : parseFloat(dataToSave.entryPrice || 0),
      additionalCosts: parseFloat(dataToSave.additionalCosts || 0),
      // Campos de hembra: se guardan sólo si es hembra, si es macho se limpian por completo
      femaleStatuses: savedStatuses,
      femaleStatus: isFemale ? savedStatuses.join(', ') : 'No aplica',
      reproductiveStatus: isFemale ? (isSavedPregnant ? 'Preñada' : 'Vacía') : 'No aplica',
      milkingStatus: isFemale ? (isSavedMilking ? 'En ordeño' : 'Seca') : 'No aplica',
      dailyMilkLiters: isFemale && isSavedMilking ? parseFloat(dataToSave.dailyMilkLiters || 0) : parseFloat(dataToSave.dailyMilkLiters || 0),
      lactationCycleDays: isFemale ? parseInt(dataToSave.lactationCycleDays || 305) : 0,
      lactationCycleTotalLiters: isFemale ? parseFloat(dataToSave.lactationCycleTotalLiters || 0) : 0,
      lactationCycleAvgLiters: isFemale ? parseFloat(dataToSave.lactationCycleAvgLiters || 0) : 0,
      serviceDate: isFemale && isSavedPregnant ? (dataToSave.serviceDate || '') : '',
      expectedCalvingDate: isFemale && isSavedPregnant ? (dataToSave.expectedCalvingDate || '') : '',
      pregnancyDays: isFemale && isSavedPregnant ? (parseInt(gestationDaysInput) || parseInt(dataToSave.pregnancyDays) || 0) : 0,
      isBreedingOnly: isFemale ? Boolean(isSavedNursing || dataToSave.isBreedingOnly) : false,
    });
    if (!isEditing) {
      clearDraft('cattle_form');
      setIsDraftRestored(false);
    }
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.tagNumber.trim()) {
      newErrors.tagNumber = 'El número de arete o chapa es obligatorio';
    }

    if (!formData.sex || !formData.sex.trim()) {
      newErrors.sex = 'El sexo del animal es obligatorio. Selecciona Macho o Hembra.';
    }

    if (!formData.color || !formData.color.trim()) {
      newErrors.color = 'El color de pelaje o señas particulares es obligatorio.';
    }

    if (isEntryBatchRequired && (!formData.entryBatch || !formData.entryBatch.trim())) {
      newErrors.entryBatch = 'El Ingreso # (Lote) es obligatorio para ganado de ceba / engorde o en compañía.';
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

    if (!isWorker) {
      if (formData.entryType === 'Compañía') {
        if (formData.entryPrice === '' || formData.entryPrice === null || Number(formData.entryPrice) <= 0) {
          newErrors.entryPrice = 'El valor inicial o inversión es obligatorio para ganado en compañía.';
        }
      } else {
        if (formData.entryPrice !== '' && Number(formData.entryPrice) < 0) {
          newErrors.entryPrice = 'El valor o costo de entrada no puede ser negativo.';
        }
      }
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

  const availableCategories = CATEGORIES.filter(c => c.sex === 'Ambos' || (!formData.sex || c.sex === formData.sex));

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
        
        {/* BANNER DE BORRADOR RESTAURADO */}
        {isDraftRestored && !isEditing && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 animate-fade-in gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs">
                <p className="font-bold">✨ Borrador recuperado automáticamente</p>
                <p className="text-[11px] opacity-80">Se preservaron los datos del bovino que estabas digitando.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-rose-500/20 text-amber-900 dark:text-amber-100 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-xs shrink-0 transition cursor-pointer border border-amber-500/30 hover:border-rose-500/30 active:scale-95"
            >
              🗑️ Descartar borrador y reiniciar
            </button>
          </div>
        )}

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sexo <span className="text-rose-500 font-bold">*</span>
                </label>
                {errors.sex && (
                  <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                    ⚠️ Obligatorio
                  </span>
                )}
              </div>
              <select
                name="sex"
                value={formData.sex || ''}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  errors.sex 
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20' 
                    : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
              >
                <option value="">-- Seleccionar Sexo * --</option>
                {SEX_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {errors.sex && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.sex}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Marca de Hierro
                </label>
                {availableIronBrands.length > 0 && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> Finca
                  </span>
                )}
              </div>
              <input
                type="text"
                name="ironBrand"
                value={formData.ironBrand}
                onChange={handleChange}
                list="cattle-form-brands-list"
                placeholder="Ej. EP-01, RG-★"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  detectedDuplicates.some(d => d.matchType === 'tag_and_brand' || d.matchType === 'tag_brand_and_owner')
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
              />

              {/* Chips de Marcas/Hierros registrados en la finca */}
              {availableIronBrands.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {availableIronBrands.map((b) => {
                    const isSelected = formData.ironBrand?.trim().toLowerCase() === b.toLowerCase();
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ironBrand: b }))}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                        }`}
                      >
                        🏷️ {b}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Datalist para autocompletar en el input */}
              <datalist id="cattle-form-brands-list">
                {availableIronBrands.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Ingreso # (Lote / Consecutivo) {isEntryBatchRequired ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>}
                </label>
                {!isEntryBatchRequired && (
                  <span className="text-[10px] text-slate-400 font-medium">Opcional</span>
                )}
              </div>
              <input
                type="text"
                name="entryBatch"
                value={formData.entryBatch}
                onChange={handleChange}
                placeholder={isBornInFarm ? "Ej. Nacimientos 2026, Lote A (Opcional)" : isEntryBatchRequired ? "Ej. Ingreso #1, Ingreso #2, Lote A" : "Ej. Lote Cría, Vientres (Opcional)"}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                  errors.entryBatch 
                    ? 'border-rose-500 ring-2 ring-rose-500/20' 
                    : isEntryBatchRequired 
                      ? 'border-emerald-400 dark:border-emerald-600/60' 
                      : 'border-slate-300 dark:border-slate-700'
                } text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px]`}
              />
              {errors.entryBatch && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.entryBatch}</p>}
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
                Categoría / Etapa {formData.sex ? `(${formData.sex === 'Hembra' ? 'Hembras' : 'Machos'})` : ''}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              >
                {!formData.category && <option value="">-- Seleccionar Categoría --</option>}
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
        {formData.sex === 'Hembra' && (() => {
          const activeStatuses = Array.isArray(formData.femaleStatuses) && formData.femaleStatuses.length > 0
            ? formData.femaleStatuses
            : (formData.femaleStatus && formData.femaleStatus !== 'No aplica' 
                ? (formData.femaleStatus.includes(',') ? formData.femaleStatus.split(',').map(s => s.trim()) : [formData.femaleStatus])
                : ['Vacía']);

          const isGestating = activeStatuses.includes('Gestación') || formData.femaleStatus?.includes('Gestación');
          const isMilking = activeStatuses.includes('Producción de leche') || formData.femaleStatus?.includes('Producción de leche');
          const isNursing = activeStatuses.includes('Levante de cría') || formData.femaleStatus?.includes('Levante de cría');
          const isFattening = activeStatuses.includes('Ceba / Levante / Engorde') || formData.femaleStatus?.includes('Ceba');
          const isEmpty = activeStatuses.includes('Vacía') && !isGestating;

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <span>🐄 Estado Productivo de la Hembra (Selección Múltiple)</span>
                  </h4>
                  <p className="text-[11px] text-purple-800 dark:text-purple-300">
                    💡 Puedes seleccionar <strong>más de 1 estado a la vez</strong> (ej. <em>En Ordeño</em> + <em>Preñada</em>). Los módulos de datos correspondientes se abrirán abajo para ser completados.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    {activeStatuses.length} {activeStatuses.length === 1 ? 'estado seleccionado' : 'estados seleccionados'}
                  </span>
                </div>
              </div>

              {/* Selector Principal Múltiple de Estado de Hembra */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {FEMALE_STATUSES.map((item) => {
                  const isSelected = activeStatuses.includes(item.value);
                  
                  let activeTheme = 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/50';
                  if (item.value === 'Producción de leche') {
                    activeTheme = 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/50';
                  } else if (item.value === 'Gestación') {
                    activeTheme = 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/50';
                  } else if (item.value === 'Levante de cría') {
                    activeTheme = 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/50';
                  } else if (item.value === 'Ceba / Levante / Engorde') {
                    activeTheme = 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/50';
                  } else if (item.value === 'Vacía') {
                    activeTheme = 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-400/50';
                  }

                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => toggleFemaleStatus(item.value)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition min-h-[72px] cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? activeTheme
                          : 'bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-500/30 text-slate-800 dark:text-slate-200 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <span className="text-xs font-black leading-tight">{item.label}</span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black shrink-0 transition ${
                          isSelected ? 'bg-white text-slate-900 shadow-sm' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                        }`}>
                          ✓
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/20 dark:border-slate-700/50">
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.short || item.value}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-white/25 px-1 py-0.2 rounded">
                            Activo
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* MÓDULO 1: CONTROL DE GESTACIÓN (Preñada) */}
              {isGestating && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-500/50 shadow-sm space-y-4 animate-in fade-in duration-200">
                  
                  {/* Encabezado del Módulo de Gestación */}
                  <div className="flex items-start justify-between gap-2 border-b border-emerald-100 dark:border-emerald-800/40 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-xl shrink-0">
                        🤰
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-wider flex items-center gap-2">
                          Control Reproductivo & Diagnóstico de Gestación
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                            283 Días Gestación
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Ingresa los <strong>días aproximados de preñez</strong> (palpación/ecografía) o la <strong>fecha de monta</strong> para calcular el parto y alertas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Campos Principales de Entrada y Fechas Sincronizadas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    
                    {/* 1. Días de Preñez Aproximados */}
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200">
                          ⏱️ Días de Preñez Aprox.
                        </label>
                        {gestationStats?.monthsApprox > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200">
                            ~{gestationStats.monthsApprox} meses
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="300"
                          value={gestationDaysInput}
                          onChange={(e) => handleGestationDaysChange(e.target.value)}
                          placeholder="Ej. 90 (palpación)"
                          className="w-full px-3 py-2 text-sm font-extrabold rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-600/60 text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-bold pointer-events-none">
                          días
                        </span>
                      </div>

                      {/* Botones de Selección Rápida por Meses */}
                      <div className="mt-2.5">
                        <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                          Acceso rápido por meses de palpación:
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { m: '1m', d: 30 },
                            { m: '2m', d: 60 },
                            { m: '3m', d: 90 },
                            { m: '4m', d: 120 },
                            { m: '5m', d: 150 },
                            { m: '6m', d: 180 },
                            { m: '7m', d: 210 },
                            { m: '8m', d: 240 },
                          ].map(preset => {
                            const isActive = parseInt(gestationDaysInput) === preset.d;
                            return (
                              <button
                                type="button"
                                key={preset.d}
                                onClick={() => handleGestationDaysChange(String(preset.d))}
                                className={`px-1.5 py-1 text-[10px] font-extrabold rounded-md transition cursor-pointer border text-center ${
                                  isActive
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                }`}
                              >
                                {preset.m} ({preset.d}d)
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 2. Fecha de Servicio / Monta / Inseminación */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          📅 Fecha Servicio / Monta
                        </label>
                        <input
                          type="date"
                          name="serviceDate"
                          value={formData.serviceDate}
                          onChange={(e) => handleServiceDateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                        Sincronizada automáticamente (Hoy - días de preñez). Puedes ajustarla manualmente.
                      </p>
                    </div>

                    {/* 3. Fecha Estimada de Parto (+283d) */}
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border-2 border-emerald-300 dark:border-emerald-600/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-black text-emerald-950 dark:text-emerald-200">
                            🍼 Fecha Estimada de Parto
                          </label>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                            +283 días
                          </span>
                        </div>
                        <input
                          type="date"
                          name="expectedCalvingDate"
                          value={formData.expectedCalvingDate}
                          onChange={(e) => handleExpectedCalvingDateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-black rounded-lg bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 mt-2">
                        {formData.expectedCalvingDate ? `Parto proyectado: ${formatDate(formData.expectedCalvingDate)}` : 'Calculada automáticamente al ingresar días o servicio.'}
                      </p>
                    </div>

                  </div>

                  {/* Resumen en Vivo del Estado y Alertas Reproductivas */}
                  {gestationStats && (gestationStats.daysPregnant > 0 || formData.expectedCalvingDate) && (
                    <div className={`p-3.5 rounded-xl border ${gestationStats.alertBadge?.classes || 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900'}`}>
                      
                      {/* Barra de Progreso de Gestación */}
                      <div className="mb-2.5">
                        <div className="flex items-center justify-between text-[11px] font-extrabold mb-1">
                          <span>Progreso de Gestación ({gestationStats.daysPregnant} de {BOVINE_GESTATION_DAYS} días)</span>
                          <span>{gestationStats.progressPercent}% cumplido</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              gestationStats.daysRemaining <= 10 
                                ? 'bg-rose-500' 
                                : gestationStats.daysRemaining <= 30 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, gestationStats.progressPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Alerta Reproductiva */}
                      {gestationStats.alertBadge && (
                        <div className="flex items-start gap-2.5 pt-1">
                          <div className="text-base shrink-0">
                            {gestationStats.alertBadge.level === 'critical' ? '🚨' : gestationStats.alertBadge.level === 'warning' ? '⚠️' : '🍼'}
                          </div>
                          <div>
                            <span className="font-black text-xs block">
                              {gestationStats.alertBadge.title}
                            </span>
                            <p className="text-[11px] font-medium opacity-90 mt-0.5">
                              {gestationStats.alertBadge.description}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-700/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-emerald-900/80 dark:text-emerald-200/80">
                        <span>📆 Se sincroniza con el Calendario de la Finca</span>
                        <span>🔔 Genera notificación automática en el Tablero de Alertas</span>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* MÓDULO 2: CONTROL LECHERO (Producción de leche en ordeño) */}
              {isMilking && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-500/50 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2 border-b border-blue-100 dark:border-blue-800/40 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl shrink-0">
                        🥛
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-blue-950 dark:text-blue-100 uppercase tracking-wider flex items-center gap-2">
                          Control Lechero: Registro de Producción Láctea
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                            Ordeño Activo
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Registra la producción diaria y litros acumulados por ciclo para seguimiento productivo y curvas de lactancia.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Litros por día */}
                    <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800/50">
                      <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 mb-1">
                        🥛 Litros por Día (Producción Diaria)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          name="dailyMilkLiters"
                          value={formData.dailyMilkLiters}
                          onChange={(e) => handleDailyMilkChange(e.target.value)}
                          placeholder="Ej. 14.5"
                          className="w-full px-3 py-2 text-sm font-extrabold rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600/60 text-blue-950 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-blue-500 font-bold pointer-events-none">
                          L/día
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium block mt-1.5">
                        Medición diaria de ordeño
                      </span>
                    </div>

                    {/* Litros totales por ciclo */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        🍼 Litros por Ciclo (Lactancia)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          name="lactationCycleTotalLiters"
                          value={formData.lactationCycleTotalLiters}
                          onChange={(e) => handleTotalCycleChange(e.target.value)}
                          placeholder="Ej. 4500"
                          className="w-full px-3 py-2 text-sm font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                          Litros
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1.5">
                        Total proyectado en ~305 días
                      </span>
                    </div>

                    {/* Promedio diario por ciclo */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        📊 Promedio Diario / Ciclo
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          name="lactationCycleAvgLiters"
                          value={formData.lactationCycleAvgLiters}
                          onChange={handleChange}
                          placeholder="Ej. 14.8"
                          className="w-full px-3 py-2 text-sm font-extrabold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-blue-500 font-bold pointer-events-none">
                          L/d prom.
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1.5">
                        Promedio diario durante la lactancia
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MÓDULO 3: LEVANTE DE CRÍA (Amamantando / Cría al pie) */}
              {isNursing && (
                <div className="p-3.5 rounded-xl bg-purple-100/60 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700/60 flex items-start gap-3 text-xs text-purple-950 dark:text-purple-200">
                  <span className="text-xl shrink-0">👶</span>
                  <div className="space-y-1">
                    <span className="font-black block text-sm">Hembra con Cría al Pie (Lactante / Levante)</span>
                    <span className="text-[11px] text-purple-900 dark:text-purple-300 block">
                      Vaca amamantando ternero al pie en finca. Si la vaca además se encuentra preñada o en ordeño comercial, sus datos reproductivos y lecheros se mantendrán sincronizados.
                    </span>
                  </div>
                </div>
              )}

              {/* MÓDULO 4: CEBA, LEVANTE O ENGORDE (Hembra de carne) */}
              {isFattening && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <span className="text-xl shrink-0">🥩</span>
                  <div>
                    <span className="font-black block text-sm">Hembra Destinada a Ceba / Levante / Engorde</span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 block">
                      Animal clasificado para ganancia de peso (GDP), novilla de levante o vaca de descarte/engorde para venta por kilo.
                    </span>
                  </div>
                </div>
              )}

              {/* MÓDULO 5: VACÍA / ABIERTA */}
              {isEmpty && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-800 dark:text-slate-200">
                  <span className="text-xl shrink-0">⭕</span>
                  <div>
                    <span className="font-black block text-sm">Hembra Vacía / Abierta</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
                      Vaca seca o abierta, disponible para próximo servicio reproductivo (monta natural o inseminación artificial).
                    </span>
                  </div>
                </div>
              )}

              {/* Acordeón Opcional si NO está marcado ordeño activo */}
              {!isMilking && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 overflow-hidden bg-white/70 dark:bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedMilk(!showAdvancedMilk)}
                    className="w-full p-3 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Milk className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Control Lechero Opcional (Registrar historial de producción en vaca seca o gestante)</span>
                    </span>
                    {showAdvancedMilk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvancedMilk && (
                    <div className="p-3.5 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t border-purple-100 dark:border-purple-500/20">
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
                      </div>
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
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Promedio Litros / Ciclo
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
                      </div>
                    </div>
                  )}
                </div>
              )}

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
          );
        })()}

        {/* SECCIÓN 3: Ingreso, Origen & Genealogía (Nacimientos / Compra) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              3. Datos de Ingreso, Origen & Genealogía
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Trazabilidad de Nacimientos</span>
          </div>

          {/* Selector de Procedencia / Origen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 'Compra', label: '🛒 Compra Comercial', desc: 'Ingreso externo / Subasta' },
              { value: 'Nacimiento', label: '🌱 Cría Nacida en Finca', desc: 'Parto / Nacimiento en predio' },
              { value: 'Compañía', label: '🤝 En Compañía', desc: 'Inversión compartida / Medianería' },
              { value: 'Traslado', label: '🔄 Traslado Interno', desc: 'Cambio entre predios' },
            ].map(item => {
              const isSelected = formData.entryType === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      entryType: item.value,
                      category: item.value === 'Nacimiento' && prev.category === 'Novillo' ? 'Ternero' : prev.category,
                      entryPrice: item.value === 'Nacimiento' && (!prev.entryPrice || prev.entryPrice === '0') ? '0' : prev.entryPrice,
                      entryBatch: item.value === 'Nacimiento' && prev.entryBatch === 'Ingreso #1' ? '' : prev.entryBatch
                    }));
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer min-h-[58px] ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-xs font-black leading-snug">{item.label}</span>
                  <span className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SWITCH / TOGGLE: ACTIVAR DATOS DE GENEALOGÍA */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition ${
                enableGenealogy ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                🧬
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  ¿Registrar datos de Genealogía (Padre y Madre)?
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {enableGenealogy ? 'Opción activada. Ingresa madre y padre abajo.' : 'Predeterminado apagado. Actívalo si deseas registrar ancestros.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !enableGenealogy;
                setEnableGenealogy(next);
                if (!next) {
                  setFormData(prev => ({
                    ...prev,
                    motherId: '',
                    motherTag: '',
                    fatherId: '',
                    fatherTag: '',
                    fatherType: 'toro',
                  }));
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enableGenealogy ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  enableGenealogy ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* BLOQUE CONDICIONAL / EXPANDIBLE: GENEALOGÍA & PADRES */}
          {enableGenealogy && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/40 space-y-3.5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                    Genealogía: Registro de Vaca Madre y Padre / Reproductor
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                  Genealogía Activa
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* 1. SELECCIÓN FLEXIBLE DE LA MADRE */}
                <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🐄 Vaca Madre</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {motherMode === 'hato' ? 'Animal en Hato' : 'Nombre Libre (Sin Ficha)'}
                    </span>
                  </div>

                  {/* Selector de Modo de Madre: Hato vs Libre */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setMotherMode('hato')}
                      className={`flex-1 py-1 px-2 rounded-md text-[11px] font-extrabold transition cursor-pointer ${
                        motherMode === 'hato'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🐄 Del Hato ({availableMothers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMotherMode('libre');
                        setFormData(prev => ({ ...prev, motherId: '' }));
                      }}
                      className={`flex-1 py-1 px-2 rounded-md text-[11px] font-extrabold transition cursor-pointer ${
                        motherMode === 'libre'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ✏️ Nombre / Arete Libre
                    </button>
                  </div>

                  {motherMode === 'hato' ? (
                    <div className="space-y-1">
                      {availableMothers.length > 0 ? (
                        <select
                          value={formData.motherId || ''}
                          onChange={(e) => {
                            const mId = e.target.value;
                            const found = availableMothers.find(m => String(m.id) === String(mId));
                            setFormData(prev => ({
                              ...prev,
                              motherId: mId,
                              motherTag: found ? found.tagNumber : '',
                              owner: found?.owner ? found.owner : prev.owner,
                              ironBrand: found?.ironBrand ? found.ironBrand : prev.ironBrand,
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-600/70 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-emerald-500 min-h-[40px]"
                        >
                          <option value="">-- Seleccionar Vaca Madre del Hato --</option>
                          {availableMothers.map(m => (
                            <option key={m.id} value={m.id}>
                              🐄 #{m.tagNumber} {m.name ? `• ${m.name}` : ''} {m.breed ? `(${m.breed})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                          No hay vacas activas en la finca. Usa la opción "Nombre / Arete Libre".
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        name="motherTag"
                        value={formData.motherTag || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, motherTag: e.target.value, motherId: '' }))}
                        placeholder="Ej. La Mora #105, Vaca Comprada en Subasta"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:border-emerald-500 min-h-[40px]"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        ℹ️ Se guardará el nombre de la madre para la genealogía de esta cría sin crear un animal nuevo.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. SELECCIÓN FLEXIBLE DEL PADRE / REPRODUCTOR */}
                <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-900 dark:text-white">
                      <span>🐂 Padre / Reproductor</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {formData.fatherType === 'toro' ? 'Toro del Hato' : formData.fatherType === 'libre' ? 'Toro Externo / Libre' : formData.fatherType === 'pajilla' ? 'Pajilla / I.A.' : 'No Registrado'}
                    </span>
                  </div>

                  {/* Selector de Modo de Padre: Toro de Finca | Nombre Libre | Pajilla | Desconocido */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fatherType: 'toro' }))}
                      className={`py-1 px-1 rounded font-extrabold transition cursor-pointer text-center truncate ${
                        (formData.fatherType || 'toro') === 'toro'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🐂 Hato
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fatherType: 'libre', fatherId: '' }))}
                      className={`py-1 px-1 rounded font-extrabold transition cursor-pointer text-center truncate ${
                        formData.fatherType === 'libre'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ✏️ Libre
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fatherType: 'pajilla', fatherId: '' }))}
                      className={`py-1 px-1 rounded font-extrabold transition cursor-pointer text-center truncate ${
                        formData.fatherType === 'pajilla'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🧪 Pajilla
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fatherType: 'desconocido', fatherTag: '', fatherId: '' }))}
                      className={`py-1 px-1 rounded font-extrabold transition cursor-pointer text-center truncate ${
                        formData.fatherType === 'desconocido'
                          ? 'bg-slate-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ❓ No reg.
                    </button>
                  </div>

                  {formData.fatherType === 'toro' && (
                    <div className="space-y-1">
                      {availableBulls.length > 0 ? (
                        <select
                          value={formData.fatherId || ''}
                          onChange={(e) => {
                            const bId = e.target.value;
                            const found = availableBulls.find(b => String(b.id) === String(bId));
                            setFormData(prev => ({
                              ...prev,
                              fatherId: bId,
                              fatherTag: found ? found.tagNumber : ''
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-emerald-500 min-h-[40px]"
                        >
                          <option value="">-- Seleccionar Toro del Hato --</option>
                          {availableBulls.map(b => (
                            <option key={b.id} value={b.id}>
                              🐂 #{b.tagNumber} {b.name ? `• ${b.name}` : ''} {b.breed ? `(${b.breed})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                          No hay toros activos en el inventario. Usa la opción "Libre".
                        </p>
                      )}
                    </div>
                  )}

                  {formData.fatherType === 'libre' && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        name="fatherTag"
                        value={formData.fatherTag || ''}
                        onChange={handleChange}
                        placeholder="Ej. Toro Barcino #12, Toro del Vecino..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 min-h-[40px]"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        ℹ️ Nombre del toro sin crear animal en el inventario.
                      </p>
                    </div>
                  )}

                  {formData.fatherType === 'pajilla' && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        name="fatherTag"
                        value={formData.fatherTag || ''}
                        onChange={handleChange}
                        placeholder="Ej. Pajilla Gyr 302, Brahman Rojo 550/2..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-600 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 min-h-[40px]"
                      />
                      <p className="text-[10px] text-purple-700 dark:text-purple-300">
                        🧪 Código del semen / Toro donante I.A.
                      </p>
                    </div>
                  )}

                  {formData.fatherType === 'desconocido' && (
                    <p className="text-[11px] text-slate-500 italic py-2">
                      Padre sin identificar para este animal.
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {formData.entryType === 'Nacimiento' ? 'Fecha de Nacimiento' : 'Fecha de Ingreso'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
            </div>

            {/* Peso Inicial / Nacimiento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {formData.entryType === 'Nacimiento' ? 'Peso al Nacer (kg)' : 'Peso Inicial (kg)'} {isWeightRequired ? (
                  <span className="text-rose-500 font-bold">*</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">
                    {formData.entryType === 'Compañía' ? '(Opcional en Compañía)' : '(Opcional en Cría)'}
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.5"
                name="entryWeight"
                value={formData.entryWeight}
                onChange={handleChange}
                placeholder={
                  formData.entryType === 'Nacimiento' 
                    ? "Ej. 32 (Al nacer)" 
                    : formData.entryType === 'Compañía'
                      ? "Ej. 280 (Opcional en Compañía)"
                      : isWeightRequired 
                        ? "Ej. 280 (Obligatorio)" 
                        : "Ej. 420 (Opcional)"
                }
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px] ${
                  errors.entryWeight ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.entryWeight && <p className="text-[11px] text-rose-500 mt-1">{errors.entryWeight}</p>}
            </div>

            {!isWorker && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {formData.entryType === 'Nacimiento' 
                      ? 'Costo de Nacimiento ($)' 
                      : formData.entryType === 'Compañía' 
                        ? 'Valor Inicial / Inversión ($)' 
                        : 'Valor Inicial / Compra ($)'} {formData.entryType === 'Compañía' ? (
                      <span className="text-rose-500 font-bold">*</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">(Recomendable)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="entryPrice"
                    value={formData.entryPrice}
                    onChange={handleChange}
                    placeholder={
                      formData.entryType === 'Nacimiento' 
                        ? "Ej. 0 (Opcional)" 
                        : formData.entryType === 'Compañía' 
                          ? "Ej. 2500000 (Obligatorio)" 
                          : "Ej. 2500000 (Recomendable)"
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px] ${
                      errors.entryPrice ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {errors.entryPrice && <p className="text-[11px] text-rose-500 mt-1">{errors.entryPrice}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Costos Directos / Insumos ($)
                  </label>
                  <input
                    type="number"
                    name="additionalCosts"
                    value={formData.additionalCosts}
                    onChange={handleChange}
                    placeholder="Pajilla, vacunas, fletes..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                  />
                </div>
              </>
            )}

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
