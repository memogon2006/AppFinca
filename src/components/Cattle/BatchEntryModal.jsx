import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  SEX_OPTIONS, 
  PRODUCTION_TYPES, 
  CATEGORIES, 
  COMMON_BREEDS,
  getDynamicFarmColors,
  getDynamicFarmIronBrands
} from '../../types/cattle';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { 
  PackagePlus, 
  Plus, 
  Trash2, 
  Scale, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  Layers,
  Wand2,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Info,
  Truck,
  Receipt,
  Baby,
  Dna,
  Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findDuplicateCattle, saveTraceabilityLog } from '../../services/duplicateDetectionService';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { analyzeFarmConsecutives, extractConsecutiveNumber } from '../../services/consecutiveService';
import { saveDraft, loadDraft, clearDraft } from '../../services/draftService';

export function BatchEntryModal({ isOpen, onClose, onSaveBatch, zIndex = 'z-[60]', cattleList = [] }) {
  const { currentUser, isWorker } = useAuth();
  const [batchDuplicates, setBatchDuplicates] = useState([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Estadísticas de consecutivos en la finca
  const farmConsecutiveStats = useMemo(() => {
    return analyzeFarmConsecutives(cattleList);
  }, [cattleList]);

  // Lista de posibles vacas madres del hato
  const availableMothers = useMemo(() => {
    return cattleList.filter(c => c.sex === 'Hembra');
  }, [cattleList]);

  // Lista de posibles toros reproductores del hato
  const availableBulls = useMemo(() => {
    return cattleList.filter(c => c.sex === 'Macho');
  }, [cattleList]);

  // Configuración general del lote
  const [batchInfo, setBatchInfo] = useState({
    entryType: 'Compra', // 'Compra' | 'Nacimiento' | 'Compañía' | 'Traslado'
    entryBatch: 'Ingreso #1',
    entryDate: new Date().toISOString().split('T')[0],
    owner: 'Hacienda Principal',
    ironBrand: '',
    sex: '',
    productionType: 'Ceba',
    category: '',
    breed: '',
    notes: '',
    fatherType: 'toro', // 'toro' | 'pajilla' | 'desconocido'
    fatherId: '',
    fatherTag: '',
  });

  // Modalidad de costo: 'pricePerKg' (kilos * $/kg) | 'fixedPrice' (por cabeza) | 'zeroCost' ($0 por nacimiento)
  const [costMode, setCostMode] = useState('pricePerKg');
  const [fixedPricePerHead, setFixedPricePerHead] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');

  // Gastos Adicionales Globales del Lote (Flete, Comisión, Vacunación, Báscula, etc.)
  const [batchExpenses, setBatchExpenses] = useState('');
  const [expensesConcept, setExpensesConcept] = useState('');

  // Filas de animales del lote
  const [rows, setRows] = useState([
    { id: '1', tagNumber: '', sex: 'Macho', color: '', entryWeight: '', motherTag: '', motherId: '' },
    { id: '2', tagNumber: '', sex: 'Macho', color: '', entryWeight: '', motherTag: '', motherId: '' },
    { id: '3', tagNumber: '', sex: 'Macho', color: '', entryWeight: '', motherTag: '', motherId: '' },
  ]);

  // Generador de serie rápida de aretes
  const [seriesConfig, setSeriesConfig] = useState({
    prefix: '',
    startNumber: 1,
    suffix: '',
    separator: '-',
    count: 5,
    defaultSex: 'Macho',
    defaultColor: 'Castaño',
    defaultIronBrand: '',
    defaultWeight: '',
  });
  const [showSeriesGenerator, setShowSeriesGenerator] = useState(false);
  const [enableBatchGenealogy, setEnableBatchGenealogy] = useState(false);

  // Sincronizar automáticamente el número inicial con el consecutivo sugerido de la finca
  useEffect(() => {
    if (farmConsecutiveStats?.nextSuggestedConsecutive) {
      setSeriesConfig(prev => ({
        ...prev,
        startNumber: farmConsecutiveStats.nextSuggestedConsecutive
      }));
    }
  }, [farmConsecutiveStats?.nextSuggestedConsecutive, isOpen]);

  const [errors, setErrors] = useState(null);
  const isDraftInitializedRef = React.useRef(false);

  // 1. Cargar borrador guardado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const draft = loadDraft('batch_entry');
      if (draft) {
        if (draft.batchInfo) setBatchInfo(draft.batchInfo);
        if (draft.costMode) setCostMode(draft.costMode);
        if (draft.fixedPricePerHead !== undefined) setFixedPricePerHead(draft.fixedPricePerHead);
        if (draft.pricePerKg !== undefined) setPricePerKg(draft.pricePerKg);
        if (draft.batchExpenses !== undefined) setBatchExpenses(draft.batchExpenses);
        if (draft.expensesConcept !== undefined) setExpensesConcept(draft.expensesConcept);
        if (Array.isArray(draft.rows) && draft.rows.length > 0) setRows(draft.rows);
        if (draft.seriesConfig) setSeriesConfig(draft.seriesConfig);

        const hasSubstantialData = (Array.isArray(draft.rows) && draft.rows.some(r => r.tagNumber || r.entryWeight || r.color)) ||
          draft.batchExpenses || draft.pricePerKg || draft.fixedPricePerHead;

        if (hasSubstantialData) {
          setIsDraftRestored(true);
        }
      }
      setTimeout(() => {
        isDraftInitializedRef.current = true;
      }, 100);
    } else {
      isDraftInitializedRef.current = false;
    }
  }, [isOpen]);

  // 2. Guardar borrador automáticamente en segundo plano cuando hay cambios
  useEffect(() => {
    if (!isOpen || !isDraftInitializedRef.current) return;

    const hasData = rows.some(r => r.tagNumber || r.entryWeight || r.color) ||
      batchExpenses || pricePerKg || fixedPricePerHead || batchInfo.ironBrand || batchInfo.notes;

    if (hasData) {
      saveDraft('batch_entry', {
        batchInfo,
        costMode,
        fixedPricePerHead,
        pricePerKg,
        batchExpenses,
        expensesConcept,
        rows,
        seriesConfig
      });
    }
  }, [isOpen, batchInfo, costMode, fixedPricePerHead, pricePerKg, batchExpenses, expensesConcept, rows, seriesConfig]);

  // Descartar borrador y reiniciar formulario a valores limpios
  const handleDiscardDraft = () => {
    clearDraft('batch_entry');
    setIsDraftRestored(false);
    setBatchInfo({
      entryType: 'Compra',
      entryBatch: 'Ingreso #1',
      entryDate: new Date().toISOString().split('T')[0],
      owner: 'Hacienda Principal',
      ironBrand: '',
      sex: '',
      productionType: 'Ceba',
      category: '',
      breed: '',
      notes: '',
      fatherType: 'toro',
      fatherId: '',
      fatherTag: '',
    });
    setCostMode('pricePerKg');
    setFixedPricePerHead('');
    setPricePerKg('');
    setBatchExpenses('');
    setExpensesConcept('');
    setRows([
      { id: '1', tagNumber: '', sex: '', color: '', entryWeight: '', motherTag: '', motherId: '' },
      { id: '2', tagNumber: '', sex: '', color: '', entryWeight: '', motherTag: '', motherId: '' },
      { id: '3', tagNumber: '', sex: '', color: '', entryWeight: '', motherTag: '', motherId: '' },
    ]);
    setErrors(null);
  };

  // Lista dinámica de colores (historial registrado en finca + base estándar)
  const availableColors = useMemo(() => {
    return getDynamicFarmColors(cattleList, seriesConfig.defaultColor);
  }, [cattleList, seriesConfig.defaultColor]);

  // Lista dinámica de marcas/hierros registrados en la finca
  const availableIronBrands = useMemo(() => {
    return getDynamicFarmIronBrands(cattleList, batchInfo.ironBrand);
  }, [cattleList, batchInfo.ironBrand]);

  // Agregar fila individual
  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      { 
        id: String(Date.now() + Math.random()), 
        tagNumber: '', 
        sex: batchInfo.sex === 'Hembra' ? 'Hembra' : (batchInfo.sex === 'Macho' ? 'Macho' : ''), 
        color: '', 
        entryWeight: '', 
        motherTag: '', 
        motherId: '' 
      }
    ]);
  };

  // Eliminar fila
  const handleRemoveRow = (rowId) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Modificar campo de una fila
  const handleRowChange = (rowId, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        if (field === 'motherTag') {
          const match = availableMothers.find(m => m.tagNumber.toLowerCase() === value.trim().toLowerCase());
          return { ...r, motherTag: value, motherId: match ? match.id : '' };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
    setErrors(null);
  };

  // Generar serie rápida de animales
  const handleGenerateSeries = () => {
    const count = parseInt(seriesConfig.count) || 5;
    const start = parseInt(seriesConfig.startNumber) || 1;
    const prefix = seriesConfig.prefix.trim();
    const suffix = seriesConfig.suffix.trim();
    const sep = seriesConfig.separator || '-';
    const color = seriesConfig.defaultColor.trim();
    const weight = seriesConfig.defaultWeight ? String(seriesConfig.defaultWeight) : '';
    const rowSex = seriesConfig.defaultSex || (batchInfo.sex === 'Hembra' ? 'Hembra' : 'Macho');

    const brand = seriesConfig.defaultIronBrand !== undefined ? seriesConfig.defaultIronBrand.trim() : (batchInfo.ironBrand?.trim() || '');

    const newRows = [];
    for (let i = 0; i < count; i++) {
      const num = start + i;
      let tag = String(num);
      if (prefix) tag = `${prefix}-${tag}`;
      if (suffix) {
        const cleanSuffix = suffix.replace(/^[-\/–—\\_]/, '');
        const chosenSep = suffix.startsWith('/') ? '/' : sep;
        tag = `${tag}${chosenSep}${cleanSuffix}`;
      }
      newRows.push({
        id: String(Date.now() + i),
        tagNumber: tag,
        sex: rowSex,
        ironBrand: brand,
        color: color || '',
        entryWeight: weight,
        motherTag: '',
        motherId: '',
      });
    }

    setRows(newRows);
    setShowSeriesGenerator(false);
  };

  // Cálculo individual para cada fila
  const calculateRowCost = (rowWeight) => {
    if (costMode === 'zeroCost') {
      return 0;
    }
    const weightNum = parseFloat(rowWeight) || 0;
    if (costMode === 'fixedPrice') {
      return parseFloat(fixedPricePerHead) || 0;
    } else {
      const priceKg = parseFloat(pricePerKg) || 0;
      return Math.round(weightNum * priceKg);
    }
  };

  // Resumen del Lote
  const validRows = rows.filter(r => r.tagNumber.trim() !== '');
  const totalAnimals = validRows.length;
  
  let totalKilos = 0;
  let totalPurchaseCost = 0;

  validRows.forEach(r => {
    const w = parseFloat(r.entryWeight) || 0;
    totalKilos += w;
    totalPurchaseCost += calculateRowCost(r.entryWeight);
  });

  const totalBatchExpensesNum = parseFloat(batchExpenses) || 0;
  const expensePerAnimal = totalAnimals > 0 && totalBatchExpensesNum > 0 ? Math.round(totalBatchExpensesNum / totalAnimals) : 0;
  const totalInvestmentWithExpenses = totalPurchaseCost + totalBatchExpensesNum;

  const avgWeight = totalAnimals > 0 ? (totalKilos / totalAnimals) : 0;
  const avgPurchaseCostPerHead = totalAnimals > 0 ? (totalPurchaseCost / totalAnimals) : 0;
  const avgTotalCostPerHead = totalAnimals > 0 ? (totalInvestmentWithExpenses / totalAnimals) : 0;

  const executeSaveBatch = (batchAnimalsPayload) => {
    clearDraft('batch_entry');
    setIsDraftRestored(false);
    onSaveBatch(batchAnimalsPayload);
    onClose();
  };

  // Guardar Lote
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors(null);

    if (validRows.length === 0) {
      setErrors('Debes ingresar al menos 1 animal con número de arete / chapa.');
      return;
    }

    // Validar aretes duplicados en el lote
    const tags = validRows.map(r => r.tagNumber.trim().toUpperCase());
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      setErrors('Hay números de aretes repetidos dentro del lote. Cada animal debe tener un arete único.');
      return;
    }

    // Validar color obligatorio para cada animal del lote
    const missingColorRows = validRows.filter(r => !r.color || !r.color.trim());
    if (missingColorRows.length > 0) {
      setErrors(`El color de pelaje es obligatorio para todos los animales del lote (Hay ${missingColorRows.length} animales sin color asignado).`);
      return;
    }

    // Validar sexo obligatorio para cada animal del lote
    const missingSexRows = validRows.filter(r => !r.sex && !batchInfo.sex);
    if (missingSexRows.length > 0) {
      setErrors('El sexo es obligatorio. Selecciona el sexo predeterminado del lote o asígnalo individualmente en la tabla a cada animal.');
      return;
    }

    const isBorn = batchInfo.entryType === 'Nacimiento';
    const isBatchRequired = !isBorn && (batchInfo.productionType === 'Ceba' || batchInfo.entryType === 'Compañía');

    if (isBatchRequired && (!batchInfo.entryBatch || !batchInfo.entryBatch.trim())) {
      setErrors('Por favor ingresa el número o nombre de Ingreso # (Lote) para este lote de ceba/engorde.');
      return;
    }

    // Validar costos si no es costo cero ($0) (solo administradores)
    if (!isWorker && costMode !== 'zeroCost') {
      if (costMode === 'pricePerKg' && (!pricePerKg || parseFloat(pricePerKg) <= 0)) {
        setErrors('Por favor ingresa un precio pactado por kilo ($/kg) válido.');
        return;
      }

      if (costMode === 'fixedPrice' && (!fixedPricePerHead || parseFloat(fixedPricePerHead) <= 0)) {
        setErrors('Por favor ingresa el valor promedio por animal ($/cab).');
        return;
      }
    }

    const batchAnimalsPayload = validRows.map(r => {
      const weight = parseFloat(r.entryWeight) || null;
      const individualPurchasePrice = calculateRowCost(r.entryWeight);
      const animalSex = r.sex || (batchInfo.sex === 'Hembra' ? 'Hembra' : 'Macho');

      let animalCategory = batchInfo.category;
      if (animalSex === 'Hembra') {
        if (animalCategory === 'Novillo' || animalCategory === 'Toro' || animalCategory === 'Torete' || animalCategory === 'Buey') {
          animalCategory = (batchInfo.productionType === 'Ceba' || isBorn) ? 'Novilla' : 'Vaca';
        }
      } else if (animalSex === 'Macho') {
        if (animalCategory === 'Novilla' || animalCategory === 'Vaca') {
          animalCategory = 'Novillo';
        }
      }

      let animalNotes = batchInfo.notes?.trim() || '';
      if (totalBatchExpensesNum > 0) {
        const expenseDetail = `Gastos de lote prorrateados: ${formatCurrency(expensePerAnimal)}${expensesConcept.trim() ? ` (${expensesConcept.trim()})` : ''}`;
        animalNotes = animalNotes ? `${animalNotes} • ${expenseDetail}` : expenseDetail;
      }

      const rowBrand = (r.ironBrand !== undefined && r.ironBrand.trim() !== '') ? r.ironBrand.trim() : (batchInfo.ironBrand?.trim() || '');

      return {
        tagNumber: r.tagNumber.trim(),
        name: '',
        color: r.color.trim() || '',
        ironBrand: rowBrand,
        owner: batchInfo.owner.trim() || 'Hacienda Principal',
        sex: animalSex,
        productionType: batchInfo.productionType,
        category: animalCategory,
        breed: batchInfo.breed.trim() || '',
        status: 'Activo',
        entryBatch: batchInfo.entryBatch?.trim() || '',
        paddock: batchInfo.entryBatch?.trim() || '',
        entryDate: batchInfo.entryDate || new Date().toISOString().split('T')[0],
        entryType: batchInfo.entryType || 'Compra',
        origin: isBorn ? 'Nacido en finca' : 'Comprado / Externo',
        motherId: enableBatchGenealogy ? (r.motherId || '') : '',
        motherTag: enableBatchGenealogy ? (r.motherTag || '') : '',
        fatherType: enableBatchGenealogy ? (batchInfo.fatherType || 'toro') : 'desconocido',
        fatherId: enableBatchGenealogy ? (batchInfo.fatherId || '') : '',
        fatherTag: enableBatchGenealogy ? (batchInfo.fatherTag || '') : '',
        birthWeight: isBorn && weight ? weight : null,
        entryWeight: weight,
        currentWeight: weight,
        entryPrice: individualPurchasePrice,
        additionalCosts: expensePerAnimal,
        femaleStatus: animalSex === 'Hembra' ? (batchInfo.productionType === 'Ceba' ? 'Ceba / Levante / Engorde' : 'Vacía') : 'No aplica',
        reproductiveStatus: animalSex === 'Hembra' ? (batchInfo.productionType === 'Ceba' ? 'No aplica' : 'Vacía') : 'No aplica',
        milkingStatus: 'No aplica',
        notes: animalNotes || (isBorn ? `Lote de crías nacidas en finca` : (costMode === 'zeroCost' ? 'Ingreso por lote sin costo inicial ($0 COP)' : `Ingreso por lote en bloque (${costMode === 'pricePerKg' ? `$${pricePerKg}/kg` : `Promedio $${fixedPricePerHead}/cab`})`)),
      };
    });

    // Detectar duplicados frente a animales activos existentes
    const duplicatesFound = [];
    validRows.forEach(r => {
      const rowBrand = (r.ironBrand !== undefined && r.ironBrand.trim() !== '') ? r.ironBrand.trim() : (batchInfo.ironBrand?.trim() || '');
      const matches = findDuplicateCattle(
        {
          tagNumber: r.tagNumber,
          ironBrand: rowBrand,
          owner: batchInfo.owner,
        },
        cattleList
      );
      if (matches.length > 0) {
        duplicatesFound.push(...matches);
      }
    });

    if (duplicatesFound.length > 0) {
      setBatchDuplicates(duplicatesFound);
      setPendingPayload(batchAnimalsPayload);
      setIsDuplicateModalOpen(true);
      return;
    }

    executeSaveBatch(batchAnimalsPayload);
  };

  const handleConfirmContinueDuplicate = () => {
    // Registrar decisiones de bypass en el sistema de trazabilidad
    batchDuplicates.forEach(dup => {
      saveTraceabilityLog({
        userId: currentUser?.id,
        farmName: currentUser?.farmName,
        tagNumberEntered: dup.candidate?.tagNumber || dup.animal?.tagNumber,
        ironBrand: dup.candidate?.ironBrand || batchInfo.ironBrand,
        owner: batchInfo.owner,
        matchingAnimals: [dup.animal],
        priority: dup.priority || 'MEDIA',
        reasons: [dup.matchType],
        notes: `Ingreso por lote (${batchInfo.entryBatch}) confirmado por el usuario pese a alerta de duplicado`,
      });
    });

    setIsDuplicateModalOpen(false);
    if (pendingPayload) {
      executeSaveBatch(pendingPayload);
    }
  };

  const availableCategories = (batchInfo.sex === 'Mixto' || !batchInfo.sex)
    ? CATEGORIES 
    : CATEGORIES.filter(c => c.sex === 'Ambos' || c.sex === batchInfo.sex);
  const isBornInBatch = batchInfo.entryType === 'Nacimiento';
  const isBatchRequired = !isBornInBatch && (batchInfo.productionType === 'Ceba' || batchInfo.entryType === 'Compañía');

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📦 Ingresar Lote Completo de Ganado"
      subtitle="Registra múltiples animales de una sola vez con cálculo por kilo o precio promedio"
      maxWidth="max-w-4xl"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BANNER DE BORRADOR RESTAURADO */}
        {isDraftRestored && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 animate-fade-in gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs">
                <p className="font-bold">✨ Borrador recuperado automáticamente</p>
                <p className="text-[11px] opacity-80">Se preservaron los animales, pesos y datos que estabas ingresando.</p>
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

        {/* PASO 1: DATOS GENERALES DEL LOTE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Datos Generales del Ingreso / Lote & Origen</span>
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Se aplicará a todos los animales del lote
            </span>
          </div>

          {/* Selector de Origen / Tipo de Entrada del Lote */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Procedencia / Origen del Lote <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'Compra', label: '🛒 Compra Comercial', desc: 'Ingreso externo / Subasta' },
                { value: 'Nacimiento', label: '🌱 Crías Nacidas en Finca', desc: 'Nacimientos / Partos en predio' },
                { value: 'Compañía', label: '🤝 En Compañía', desc: 'Inversión compartida' },
                { value: 'Traslado', label: '🔄 Traslado Interno', desc: 'Entre fincas / potreros' },
              ].map(item => {
                const isSelected = batchInfo.entryType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setBatchInfo(prev => ({
                        ...prev,
                        entryType: item.value,
                        category: item.value === 'Nacimiento' && prev.category === 'Novillo' ? 'Ternero' : prev.category,
                        entryBatch: item.value === 'Nacimiento' && prev.entryBatch === 'Ingreso #1' ? '' : prev.entryBatch,
                      }));
                      if (item.value === 'Nacimiento') {
                        setCostMode('zeroCost');
                      }
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer min-h-[56px] ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
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
          </div>

          {/* SWITCH / TOGGLE: ACTIVAR DATOS DE GENEALOGÍA DEL LOTE */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition ${
                enableBatchGenealogy ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                🧬
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  ¿Registrar datos de Genealogía (Padre y Madres del Lote)?
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {enableBatchGenealogy ? 'Opción activada. Ingresa el padre común aquí y las madres por fila en el paso 3.' : 'Predeterminado apagado. Actívalo si deseas registrar ancestros para este lote.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !enableBatchGenealogy;
                setEnableBatchGenealogy(next);
                if (!next) {
                  setBatchInfo(prev => ({
                    ...prev,
                    fatherType: 'toro',
                    fatherId: '',
                    fatherTag: '',
                  }));
                  setRows(prev => prev.map(r => ({ ...r, motherTag: '', motherId: '' })));
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enableBatchGenealogy ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={enableBatchGenealogy}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  enableBatchGenealogy ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Panel Condicional: Padre / Reproductor Común del Lote (Si enableBatchGenealogy es true) */}
          {enableBatchGenealogy && (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/40 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                    Padre / Reproductor Común del Lote
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  (La madre de cada animal se asigna en la tabla del Paso 3)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 items-center">
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setBatchInfo(prev => ({ ...prev, fatherType: 'toro' }))}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (batchInfo.fatherType || 'toro') === 'toro'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    🐂 Toro Finca
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchInfo(prev => ({ ...prev, fatherType: 'pajilla' }))}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      batchInfo.fatherType === 'pajilla'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    🧪 Pajilla / I.A.
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchInfo(prev => ({ ...prev, fatherType: 'desconocido', fatherTag: '', fatherId: '' }))}
                    className={`py-1 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      batchInfo.fatherType === 'desconocido'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Padre no registrado"
                  >
                    ❓ No reg.
                  </button>
                </div>

                <div className="sm:col-span-2">
                  {batchInfo.fatherType === 'toro' && (
                    <div className="flex gap-2">
                      {availableBulls.length > 0 && (
                        <select
                          value={batchInfo.fatherId || ''}
                          onChange={(e) => {
                            const bId = e.target.value;
                            const found = availableBulls.find(b => String(b.id) === String(bId));
                            setBatchInfo(prev => ({
                              ...prev,
                              fatherId: bId,
                              fatherTag: found ? found.tagNumber : prev.fatherTag
                            }));
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">-- Toro del Hato --</option>
                          {availableBulls.map(b => (
                            <option key={b.id} value={b.id}>
                              🐂 #{b.tagNumber} {b.name ? `• ${b.name}` : ''} {b.breed ? `(${b.breed})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        value={batchInfo.fatherTag || ''}
                        onChange={(e) => setBatchInfo(prev => ({ ...prev, fatherTag: e.target.value }))}
                        placeholder="O nombre/chapa del toro..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {batchInfo.fatherType === 'pajilla' && (
                    <input
                      type="text"
                      value={batchInfo.fatherTag || ''}
                      onChange={(e) => setBatchInfo(prev => ({ ...prev, fatherTag: e.target.value }))}
                      placeholder="Código de pajilla / Nombre del reproductor donante..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                    />
                  )}

                  {batchInfo.fatherType === 'desconocido' && (
                    <span className="text-xs text-slate-500 italic font-medium">
                      Padre sin identificar para este lote.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Ingreso # */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Ingreso # (Lote) {!isBornInBatch && (batchInfo.productionType === 'Ceba' || batchInfo.entryType === 'Compañía') ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>}
                </label>
                {isBornInBatch && (
                  <span className="text-[10px] text-slate-400 font-medium">Opcional</span>
                )}
              </div>
              <input
                type="text"
                value={batchInfo.entryBatch}
                onChange={(e) => setBatchInfo(prev => ({ ...prev, entryBatch: e.target.value }))}
                placeholder={isBornInBatch ? "Ej. Nacimientos 2026, Lote A (Opcional)" : (!isBornInBatch && (batchInfo.productionType === 'Ceba' || batchInfo.entryType === 'Compañía')) ? "Ej. Ingreso #3, Lote Mayo" : "Ej. Lote Cría (Opcional)"}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600/60 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              />
            </div>

            {/* Fecha de Entrada / Nacimiento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {batchInfo.entryType === 'Nacimiento' ? 'Fecha de Nacimiento' : 'Fecha de Ingreso'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={batchInfo.entryDate}
                onChange={(e) => setBatchInfo(prev => ({ ...prev, entryDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
                required
              />
            </div>

            {/* Dueño / Propietario */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Propietario / Dueño
              </label>
              <input
                type="text"
                value={batchInfo.owner}
                onChange={(e) => setBatchInfo(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Ej. Hacienda Principal, Dueño del Animal"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              />
            </div>

            {/* Hierro de Origen */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hierro / Marca General (Opcional)
                </label>
                {availableIronBrands.length > 0 && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> Sugerencias
                  </span>
                )}
              </div>
              <input
                type="text"
                value={batchInfo.ironBrand}
                onChange={(e) => setBatchInfo(prev => ({ ...prev, ironBrand: e.target.value }))}
                list="batch-brands-list"
                placeholder="Ej. H-12, Corona (Aplica si se deja vacío en tabla)"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              />
              {availableIronBrands.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {availableIronBrands.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBatchInfo(prev => ({ ...prev, ironBrand: b }))}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition cursor-pointer ${
                        batchInfo.ironBrand === b
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      🏷️ {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sexo Común / Predeterminado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sexo Predeterminado del Lote <span className="text-rose-500">*</span>
              </label>
              <select
                value={batchInfo.sex || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setBatchInfo(prev => ({
                    ...prev,
                    sex: val,
                    productionType: val === 'Macho' ? 'Ceba' : (val === 'Hembra' && prev.productionType === 'Ceba' ? 'Cría' : prev.productionType),
                    category: val === 'Macho' ? (prev.category === 'Vaca' || prev.category === 'Novilla' ? 'Novillo' : (prev.category || 'Novillo')) : (val === 'Hembra' ? (prev.category === 'Novillo' ? 'Novilla' : (prev.category || 'Vaca')) : prev.category)
                  }));
                  if (val === 'Macho' || val === 'Hembra') {
                    setRows(prev => prev.map(r => ({ ...r, sex: val })));
                    setSeriesConfig(prev => ({ ...prev, defaultSex: val }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              >
                <option value="">-- Seleccionar Sexo del Lote * --</option>
                <option value="Macho">♂ Macho (Predeterminado para todos)</option>
                <option value="Hembra">♀ Hembra (Predeterminado para todos)</option>
                <option value="Mixto">⚤ Mixto (Machos y Hembras combinados)</option>
              </select>
            </div>

            {/* Propósito */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Propósito Productivo
              </label>
              <select
                value={batchInfo.productionType}
                onChange={(e) => {
                  const val = e.target.value;
                  const isFemaleProd = val === 'Lechería' || val === 'Cría';
                  setBatchInfo(prev => ({
                    ...prev,
                    productionType: val,
                    sex: isFemaleProd ? 'Hembra' : prev.sex,
                    category: isFemaleProd && (prev.category === 'Novillo' || prev.category === 'Toro' || prev.category === 'Torete' || prev.category === 'Buey') ? 'Vaca' : prev.category
                  }));
                  if (isFemaleProd) {
                    setRows(prev => prev.map(r => ({ ...r, sex: 'Hembra' })));
                    setSeriesConfig(prev => ({ ...prev, defaultSex: 'Hembra' }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              >
                {PRODUCTION_TYPES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoría / Etapa {batchInfo.sex ? `(${batchInfo.sex === 'Hembra' ? 'Hembras' : batchInfo.sex === 'Macho' ? 'Machos' : 'Mixto'})` : ''}
              </label>
              <select
                value={batchInfo.category}
                onChange={(e) => {
                  const val = e.target.value;
                  const femaleCats = ['Vaca', 'Novilla'];
                  const maleCats = ['Novillo', 'Toro', 'Torete', 'Buey'];
                  const isFem = femaleCats.includes(val);
                  const isMasc = maleCats.includes(val);

                  setBatchInfo(prev => ({
                    ...prev,
                    category: val,
                    sex: isFem ? 'Hembra' : (isMasc ? 'Macho' : prev.sex),
                    productionType: isFem && prev.productionType === 'Ceba' ? 'Cría' : prev.productionType
                  }));

                  if (isFem) {
                    setRows(prev => prev.map(r => ({ ...r, sex: 'Hembra' })));
                    setSeriesConfig(prev => ({ ...prev, defaultSex: 'Hembra' }));
                  } else if (isMasc) {
                    setRows(prev => prev.map(r => ({ ...r, sex: 'Macho' })));
                    setSeriesConfig(prev => ({ ...prev, defaultSex: 'Macho' }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              >
                {!batchInfo.category && <option value="">-- Seleccionar Categoría --</option>}
                {availableCategories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Raza / Cruce (Opcional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Raza / Cruce (Opcional)
              </label>
              <input
                type="text"
                value={batchInfo.breed}
                onChange={(e) => setBatchInfo(prev => ({ ...prev, breed: e.target.value }))}
                list="batch-breeds-list"
                placeholder="Escoger o escribir raza..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[40px]"
              />
              <datalist id="batch-breeds-list">
                {COMMON_BREEDS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* PASO 2: MODALIDAD DE COSTO DE ENTRADA (Solo Administrador) */}
        {!isWorker && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. ¿Cómo deseas liquidar el costo de este lote?</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Opción 1 (Izquierda): Por Kilos de Entrada * $/kg */}
              <div 
                onClick={() => setCostMode('pricePerKg')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  costMode === 'pricePerKg'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Por Kilos $\times$ $/kg</span>
                    </span>
                    <input 
                      type="radio" 
                      name="costMode" 
                      checked={costMode === 'pricePerKg'} 
                      onChange={() => setCostMode('pricePerKg')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer" 
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Multiplica los kilos de entrada de cada animal por el precio pactado por kilo.
                  </p>
                </div>

                {costMode === 'pricePerKg' && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                      Precio por Kilo (COP/kg) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        value={pricePerKg}
                        onChange={(e) => setPricePerKg(e.target.value)}
                        placeholder="Ej. 8500, 9200"
                        min="0"
                        step="50"
                        className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 text-slate-900 dark:text-white font-extrabold text-sm focus:outline-none focus:border-emerald-500"
                        required={costMode === 'pricePerKg'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opción 2 (Centro): Valor Promedio Fijo por Cabeza */}
              <div 
                onClick={() => setCostMode('fixedPrice')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  costMode === 'fixedPrice'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Valor Fijo por Animal ($/cab)</span>
                    </span>
                    <input 
                      type="radio" 
                      name="costMode" 
                      checked={costMode === 'fixedPrice'} 
                      onChange={() => setCostMode('fixedPrice')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer" 
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    Asigna el mismo costo promedio a todos los animales del lote.
                  </p>
                </div>

                {costMode === 'fixedPrice' && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                      Valor Fijo por Animal (COP) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        value={fixedPricePerHead}
                        onChange={(e) => setFixedPricePerHead(e.target.value)}
                        placeholder="Ej. 2500000"
                        min="0"
                        step="50000"
                        className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 text-slate-900 dark:text-white font-extrabold text-sm focus:outline-none focus:border-emerald-500"
                        required={costMode === 'fixedPrice'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opción 3 (Derecha / Tercera de izq a derecha): $0 COP (Sin Costo Inicial) */}
              <div 
                onClick={() => setCostMode('zeroCost')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  costMode === 'zeroCost'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>$0 COP (Sin Costo Inicial)</span>
                    </span>
                    <input 
                      type="radio" 
                      name="costMode" 
                      checked={costMode === 'zeroCost'} 
                      onChange={() => setCostMode('zeroCost')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer" 
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {batchInfo.entryType === 'Nacimiento'
                      ? 'Asigna costo de compra $0 a cada cría. La rentabilidad se calculará a partir de los gastos de manejo posteriores.'
                      : 'Ingresa los animales sin costo de compra inicial ($0 COP). Ideal para inventario base o animales propios.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 mt-3">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    ✓ Sin costo de compra inicial ($0)
                  </span>
                </div>
              </div>

            </div>

            {/* SECCIÓN ADICIONAL: GASTOS ASOCIADOS AL LOTE (FLETES, COMISIÓN, VACUNACIÓN) */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Gastos Adicionales de Entrada del Lote (Fletes, Comisiones, Insumos)</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Gastos del Lote (COP):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      value={batchExpenses}
                      onChange={(e) => setBatchExpenses(e.target.value)}
                      placeholder="Ej. 600000 (Flete total)"
                      min="0"
                      step="10000"
                      className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white font-extrabold text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Concepto / Detalle de Gastos (Opcional):
                  </label>
                  <input
                    type="text"
                    value={expensesConcept}
                    onChange={(e) => setExpensesConcept(e.target.value)}
                    placeholder="Ej. Flete camión, comisión, vacuna aftosa"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {totalBatchExpensesNum > 0 && (
                <div className="p-3 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Gasto prorrateado por cabeza:
                    <strong className="text-emerald-700 dark:text-emerald-300 text-sm font-black">
                      +{formatCurrency(expensePerAnimal)} / animal
                    </strong>
                  </span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                    Repartido equitativamente entre {totalAnimals} animales del lote
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 3: TABLA DE ANIMALES DEL LOTE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          
          {/* BANNER DESTACADO DE CONTROL DE CONSECUTIVOS DE LA FINCA */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/15 via-emerald-600/10 to-teal-900/15 dark:from-emerald-950/50 dark:via-emerald-900/40 dark:to-teal-950/50 border-2 border-emerald-500/50 dark:border-emerald-500/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Control de Numeración Consecutiva de la Finca
                  </span>
                  <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold">
                      Último Registrado: <strong className="text-slate-900 dark:text-white font-black text-sm sm:text-base">#{farmConsecutiveStats.maxConsecutive || 0}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                    <span className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                      Siguiente Sugerido:
                      <span className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-600/30 tracking-wide">
                        #{farmConsecutiveStats.nextSuggestedConsecutive}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSeriesGenerator(true)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>⚡ Generar Serie desde #{farmConsecutiveStats.nextSuggestedConsecutive}</span>
                </button>
              </div>
            </div>
            
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 pt-1.5">
              ℹ️ La numeración se calcula usando exclusivamente el número <strong>antes de <code>-</code> o <code>/</code></strong> (ej. <strong>25-6 → 25</strong>). Los números posteriores no alteran el consecutivo principal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Lista de Bovinos del Lote (Arete, Color y Peso)</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cada animal aparecerá de forma individual en tu inventario general
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Fila</span>
              </button>
            </div>
          </div>

          {/* GENERADOR DE SERIE CONSECUTIVA */}
          {showSeriesGenerator && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 dark:border-amber-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Configurar Serie Consecutiva Automática</span>
                </span>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                  Último de la finca: #{farmConsecutiveStats.maxConsecutive || 0}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSeriesGenerator(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prefijo (Opcional):</label>
                  <input
                    type="text"
                    value={seriesConfig.prefix}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, prefix: e.target.value }))}
                    placeholder="Ej. EP"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Desde el N°:</label>
                  <input
                    type="number"
                    value={seriesConfig.startNumber}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, startNumber: e.target.value }))}
                    min="1"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sufijo / Año:</label>
                  <input
                    type="text"
                    value={seriesConfig.suffix}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, suffix: e.target.value }))}
                    placeholder="Ej. 6 o /5"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    title="Ejemplo: escribiendo 6 generará 25-6, 26-6..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cantidad:</label>
                  <input
                    type="number"
                    value={seriesConfig.count}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, count: e.target.value }))}
                    min="1"
                    max="100"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sexo Serie:</label>
                  <select
                    value={seriesConfig.defaultSex || 'Macho'}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, defaultSex: e.target.value }))}
                    className={`w-full px-2 py-1.5 rounded-lg border font-bold text-xs cursor-pointer ${
                      (seriesConfig.defaultSex || 'Macho') === 'Hembra'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    }`}
                  >
                    <option value="Macho">♂ Macho</option>
                    <option value="Hembra">♀ Hembra</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hierro Serie:</label>
                  <input
                    type="text"
                    value={seriesConfig.defaultIronBrand !== undefined ? seriesConfig.defaultIronBrand : (batchInfo.ironBrand || '')}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, defaultIronBrand: e.target.value }))}
                    list="batch-brands-list"
                    placeholder={batchInfo.ironBrand || "Ej. H-12, Corona"}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                  {availableIronBrands.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {availableIronBrands.map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSeriesConfig(prev => ({ ...prev, defaultIronBrand: b }))}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            (seriesConfig.defaultIronBrand !== undefined ? seriesConfig.defaultIronBrand : batchInfo.ironBrand) === b
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Color Común:</label>
                  <input
                    type="text"
                    value={seriesConfig.defaultColor}
                    onChange={(e) => setSeriesConfig(prev => ({ ...prev, defaultColor: e.target.value }))}
                    list="colors-list-quick"
                    placeholder="Ej. Castaño"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <div className="mt-1 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {availableColors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSeriesConfig(prev => ({ ...prev, defaultColor: c }))}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                          seriesConfig.defaultColor === c
                            ? 'bg-amber-600 text-white border-amber-600 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={handleGenerateSeries}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition shadow cursor-pointer min-h-[34px]"
                  >
                    Generar ({seriesConfig.count})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TABLA DE FILAS DINÁMICAS */}
          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-extrabold text-[10px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 min-w-[125px]">N° Arete / Chapa <span className="text-rose-500">*</span></th>
                  <th className="p-3 min-w-[115px]">Sexo <span className="text-rose-500">*</span></th>
                  <th className="p-3 min-w-[120px]">Hierro / Marca</th>
                  {enableBatchGenealogy && (
                    <th className="p-3 min-w-[145px]">
                      <span className="text-emerald-700 dark:text-emerald-300 font-black flex items-center gap-1">
                        <span>🐄 Vaca Madre (Chapa)</span>
                      </span>
                    </th>
                  )}
                  <th className="p-3 min-w-[125px]">Color / Pelaje <span className="text-rose-500">*</span></th>
                  <th className="p-3 min-w-[105px]">{batchInfo.entryType === 'Nacimiento' ? 'Peso Nacer (kg)' : 'Peso Entrada (kg)'}</th>
                  <th className="p-3 text-right min-w-[115px]">{isWorker ? 'Categoría' : 'Costo Calculado (COP)'}</th>
                  <th className="p-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((row, idx) => {
                  const rowCost = calculateRowCost(row.entryWeight);
                  const rowBrand = (row.ironBrand !== undefined && row.ironBrand !== '') ? row.ironBrand : batchInfo.ironBrand;
                  const rowDuplicates = row.tagNumber?.trim() ? findDuplicateCattle(
                    {
                      tagNumber: row.tagNumber,
                      ironBrand: rowBrand,
                      owner: batchInfo.owner,
                    },
                    cattleList
                  ) : [];
                  const isRowDuplicate = rowDuplicates.length > 0;
                  const rowSexValue = row.sex || (batchInfo.sex === 'Hembra' ? 'Hembra' : batchInfo.sex === 'Macho' ? 'Macho' : '');

                  return (
                    <tr key={row.id} className={`transition ${isRowDuplicate ? 'bg-amber-50/60 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                      <td className="p-2.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Arete */}
                      <td className="p-2.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.tagNumber}
                            onChange={(e) => handleRowChange(row.id, 'tagNumber', e.target.value)}
                            placeholder={`Ej. ${idx + 1}`}
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                              isRowDuplicate
                                ? 'border-amber-500 ring-2 ring-amber-500/20 text-amber-900 dark:text-amber-200'
                                : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                            } font-extrabold text-xs focus:outline-none focus:border-emerald-500`}
                            required
                          />
                          {isRowDuplicate && (
                            <span 
                              title={`Coincide con un animal activo existente (${rowDuplicates[0]?.animal?.tagNumber})`}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 text-[10px] font-bold"
                            >
                              ⚠️ Duplicado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sexo Individual del Animal */}
                      <td className="p-2.5">
                        <select
                          value={rowSexValue}
                          onChange={(e) => handleRowChange(row.id, 'sex', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-black text-xs cursor-pointer focus:outline-none transition shadow-sm ${
                            rowSexValue === 'Hembra'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                              : rowSexValue === 'Macho'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-400'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                          required
                        >
                          {!rowSexValue && <option value="">-- Sexo * --</option>}
                          <option value="Macho">♂ Macho</option>
                          <option value="Hembra">♀ Hembra</option>
                        </select>
                      </td>

                      {/* Hierro / Marca Individual */}
                      <td className="p-2.5 min-w-[110px]">
                        <input
                          type="text"
                          value={row.ironBrand !== undefined ? row.ironBrand : ''}
                          onChange={(e) => handleRowChange(row.id, 'ironBrand', e.target.value)}
                          list="batch-brands-list"
                          placeholder={batchInfo.ironBrand || "Ej. EP, H-12"}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Vaca Madre (Solo si genealogía está activa) */}
                      {enableBatchGenealogy && (
                        <td className="p-2.5 min-w-[150px]">
                          <input
                            type="text"
                            value={row.motherTag || ''}
                            onChange={(e) => handleRowChange(row.id, 'motherTag', e.target.value)}
                            list="batch-mothers-list"
                            placeholder="Chapa/nombre madre..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                      )}

                      {/* Color */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.color}
                          onChange={(e) => handleRowChange(row.id, 'color', e.target.value)}
                          list="colors-list-quick"
                          placeholder="Ej. Castaño, Hosco"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Peso Entrada / Nacer */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={row.entryWeight}
                          onChange={(e) => handleRowChange(row.id, 'entryWeight', e.target.value)}
                          placeholder={batchInfo.entryType === 'Nacimiento' ? 'Ej. 32, 35' : 'Ej. 280, 315'}
                          min="0"
                          step="0.5"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Costo Calculado / Categoría */}
                      <td className="p-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                        {isWorker ? (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {rowSexValue === 'Hembra' 
                              ? (batchInfo.category === 'Novillo' ? 'Novilla' : (batchInfo.category === 'Toro' || batchInfo.category === 'Torete' ? 'Vaca' : batchInfo.category))
                              : (batchInfo.category === 'Novilla' || batchInfo.category === 'Vaca' ? 'Novillo' : batchInfo.category)}
                          </span>
                        ) : (
                          <>
                            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(rowCost)}
                            </div>
                            {totalBatchExpensesNum > 0 && (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                +{formatCurrency(expensePerAnimal)} gastos
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Eliminar Fila */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={rows.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Eliminar animal de este lote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Datalist de Madres del Hato */}
          <datalist id="batch-mothers-list">
            {availableMothers.map(m => (
              <option key={m.id} value={m.tagNumber}>
                {m.tagNumber} {m.name ? `(${m.name})` : ''} - {m.breed || 'Hembra'}
              </option>
            ))}
          </datalist>

          <datalist id="colors-list-quick">
            {availableColors.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <datalist id="batch-brands-list">
            {availableIronBrands.map(b => (
              <option key={b} value={b} />
            ))}
          </datalist>

          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Otro Animal al Lote</span>
          </button>
        </div>

        {/* RESUMEN TOTAL DEL LOTE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/20 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{isWorker ? 'Resumen de Animales y Báscula del Lote' : 'Resumen Financiero y de Báscula del Lote'}</span>
            </h4>
            <span className="text-[11px] text-emerald-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              {batchInfo.entryBatch}
            </span>
          </div>

          {(() => {
            const machosCount = validRows.filter(r => (r.sex || (batchInfo.sex === 'Hembra' ? 'Hembra' : 'Macho')) === 'Macho').length;
            const hembrasCount = validRows.filter(r => (r.sex || (batchInfo.sex === 'Hembra' ? 'Hembra' : 'Macho')) === 'Hembra').length;

            return isWorker ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <span className="text-emerald-200 block text-[10px] font-semibold">Total Cabezas en el Lote:</span>
                  <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalAnimals} cabezas</p>
                  <span className="text-[10px] text-emerald-200/90 font-bold mt-0.5 block">
                    {machosCount > 0 && hembrasCount > 0 
                      ? `♂ ${machosCount} Machos • ♀ ${hembrasCount} Hembras`
                      : `${batchInfo.category} • ${batchInfo.sex}`}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <span className="text-emerald-200 block text-[10px] font-semibold">Kilos Totales Registrados:</span>
                  <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{formatNumber(totalKilos, 0)} kg</p>
                  <span className="text-[10px] text-emerald-200/80 mt-0.5 block font-bold">Promedio: {formatNumber(avgWeight, 1)} kg/cab</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <span className="text-emerald-200 block text-[10px] font-semibold">Total Cabezas:</span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">{totalAnimals} cab</p>
                  <span className="text-[10px] text-emerald-200/90 font-bold mt-0.5 block">
                    {machosCount > 0 && hembrasCount > 0 
                      ? `♂ ${machosCount}M • ♀ ${hembrasCount}H` 
                      : (batchInfo.sex === 'Mixto' ? 'Lote Mixto' : batchInfo.sex)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <span className="text-emerald-200 block text-[10px] font-semibold">Kilos Totales Báscula:</span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">{formatNumber(totalKilos, 0)} kg</p>
                  <span className="text-[10px] text-emerald-200/80 mt-0.5 block">Prom: {formatNumber(avgWeight, 1)} kg/cab</span>
                </div>

                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <span className="text-emerald-200 block text-[10px] font-semibold">
                    {costMode === 'pricePerKg' ? 'Compra por Kilo:' : (costMode === 'fixedPrice' ? 'Compra por Cabeza:' : 'Costo de Entrada:')}
                  </span>
                  <p className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                    {costMode === 'pricePerKg' 
                      ? (pricePerKg ? `${formatCurrency(pricePerKg)}/kg` : '$0/kg') 
                      : (costMode === 'fixedPrice' ? formatCurrency(fixedPricePerHead || 0) : '$0 COP (Sin Costo)')}
                  </p>
                  {totalBatchExpensesNum > 0 && (
                    <span className="text-[10px] text-blue-200 font-bold mt-0.5 block">
                      + {formatCurrency(expensePerAnimal)}/cab gastos
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/40">
                  <span className="text-emerald-100 block text-[10px] font-semibold">Inversión Total con Gastos:</span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">{formatCurrency(totalInvestmentWithExpenses)}</p>
                  <span className="text-[10px] text-emerald-200 mt-0.5 block font-bold">
                    Costo Real: {formatCurrency(avgTotalCostPerHead)}/cab
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Mensajes de Error */}
        {errors && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer min-h-[44px]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer min-h-[44px]"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Guardar {totalAnimals} Bovinos en Inventario</span>
          </button>
        </div>

      </form>
    </Modal>

    {/* Modal de Advertencia de Identificaciones Duplicadas en Lote */}
    <DuplicateWarningModal
      isOpen={isDuplicateModalOpen}
      onClose={() => setIsDuplicateModalOpen(false)}
      onConfirmContinue={handleConfirmContinueDuplicate}
      duplicates={batchDuplicates}
      candidateData={{
        tagNumber: batchDuplicates.map(d => d.candidate?.tagNumber || d.animal?.tagNumber).join(', '),
        ironBrand: batchInfo.ironBrand,
        owner: batchInfo.owner,
      }}
      zIndex="z-[70]"
    />
    </>
  );
}
