import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  SEX_OPTIONS, 
  PRODUCTION_TYPES, 
  CATEGORIES, 
  FEMALE_STATUSES,
  ENTRY_TYPES, 
  COMMON_BREEDS 
} from '../../types/cattle';
import { BOVINE_GESTATION_DAYS } from '../../services/calculations';
import { Save, Milk, ChevronDown, ChevronUp } from 'lucide-react';

export function CattleFormModal({ isOpen, onClose, onSave, animal = null }) {
  const isEditing = Boolean(animal && animal.id);

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
  }, [animal, isOpen]);

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

    if (status === 'Gestación') {
      repro = 'Preñada';
      milk = formData.milkingStatus === 'En ordeño' ? 'En ordeño' : 'Seca';
    } else if (status === 'Producción de leche') {
      repro = 'Vacía';
      milk = 'En ordeño';
      setShowAdvancedMilk(true);
    } else if (status === 'Levante de cría') {
      repro = 'Vacía';
      milk = 'No aplica';
      breedingOnly = true;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.tagNumber.trim()) {
      newErrors.tagNumber = 'El número de arete o chapa es obligatorio';
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

    const parsedEntryWeight = formData.entryWeight && parseFloat(formData.entryWeight) > 0 ? parseFloat(formData.entryWeight) : null;
    const parsedCurrentWeight = formData.currentWeight && parseFloat(formData.currentWeight) > 0 ? parseFloat(formData.currentWeight) : parsedEntryWeight;

    onSave({
      ...formData,
      entryBatch: formData.entryBatch || 'Ingreso #1',
      paddock: formData.entryBatch || 'Ingreso #1',
      entryWeight: parsedEntryWeight,
      currentWeight: parsedCurrentWeight,
      entryPrice: parseFloat(formData.entryPrice || 0),
      additionalCosts: parseFloat(formData.additionalCosts || 0),
      // Campos de hembra: se guardan sólo si es hembra, si es macho se limpian por completo
      femaleStatus: isFemale ? (formData.femaleStatus || 'Vacía') : 'No aplica',
      reproductiveStatus: isFemale ? (formData.reproductiveStatus || 'Vacía') : 'No aplica',
      milkingStatus: isFemale ? (formData.milkingStatus || 'No aplica') : 'No aplica',
      dailyMilkLiters: isFemale ? parseFloat(formData.dailyMilkLiters || 0) : 0,
      lactationCycleDays: isFemale ? parseInt(formData.lactationCycleDays || 305) : 0,
      lactationCycleTotalLiters: isFemale ? parseFloat(formData.lactationCycleTotalLiters || 0) : 0,
      lactationCycleAvgLiters: isFemale ? parseFloat(formData.lactationCycleAvgLiters || 0) : 0,
      serviceDate: isFemale ? (formData.serviceDate || '') : '',
      expectedCalvingDate: isFemale ? (formData.expectedCalvingDate || '') : '',
      isBreedingOnly: isFemale ? Boolean(formData.isBreedingOnly) : false,
    });
  };

  const availableCategories = CATEGORIES.filter(c => c.sex === 'Ambos' || c.sex === formData.sex);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Bovino ${formData.tagNumber}` : 'Registrar Nuevo Bovino en Finca'}
      subtitle="Ingresa la identificación, Ingreso #, procedencia, peso y costos"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        
        {/* SECCIÓN 1: Identificación y Origen */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            1. Identificación y Propiedad
          </h4>

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
                placeholder="Ej. EP-105, 452, A-12"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color de Pelaje / Señas Particulares
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="Ej. Blanco aperlado, mocho, calzado"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />
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
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Lechería o Cría</span>
            </div>

            {/* Selector Principal de Estado de Hembra */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FEMALE_STATUSES.map((item) => {
                const isSelected = formData.femaleStatus === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => handleFemaleStatusChange(item.value)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition min-h-[56px] cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-white dark:bg-slate-800/80 border-purple-200 dark:border-purple-500/30 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <span className="text-xs font-extrabold leading-snug">{item.label}</span>
                    <span className={`text-[10px] mt-1 ${isSelected ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.value === 'Producción de leche' ? 'Ordeño' : item.value === 'Levante de cría' ? 'Con ternero' : item.value === 'Gestación' ? 'Preñez' : 'Abierta'}
                    </span>
                  </button>
                );
              })}
            </div>

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
  );
}
