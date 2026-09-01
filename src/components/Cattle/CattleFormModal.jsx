import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  SEX_OPTIONS, 
  PRODUCTION_TYPES, 
  CATEGORIES, 
  REPRODUCTIVE_STATUSES, 
  ENTRY_TYPES, 
  COMMON_BREEDS 
} from '../../types/cattle';
import { BOVINE_GESTATION_DAYS } from '../../services/calculations';
import { Save } from 'lucide-react';

export function CattleFormModal({ isOpen, onClose, onSave, animal = null }) {
  const isEditing = Boolean(animal && animal.id);

  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    ironBrand: '',
    owner: 'Hacienda Principal',
    sex: 'Macho',
    breed: 'Brahman Blanco',
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
    reproductiveStatus: 'No aplica',
    serviceDate: '',
    expectedCalvingDate: '',
    milkingStatus: 'No aplica',
    dailyMilkLiters: 0,
    isBreedingOnly: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (animal) {
      setFormData({
        ...animal,
        entryBatch: animal.entryBatch || animal.paddock || 'Ingreso #1',
        entryWeight: animal.entryWeight || '',
        entryPrice: animal.entryPrice || '',
        additionalCosts: animal.additionalCosts || 0,
        currentWeight: animal.currentWeight || animal.entryWeight || '',
        dailyMilkLiters: animal.dailyMilkLiters || 0,
        serviceDate: animal.serviceDate || '',
        expectedCalvingDate: animal.expectedCalvingDate || '',
        isBreedingOnly: Boolean(animal.isBreedingOnly),
      });
    } else {
      setFormData({
        tagNumber: '',
        name: '',
        ironBrand: '',
        owner: 'Hacienda Principal',
        sex: 'Macho',
        breed: 'Brahman Blanco',
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
        reproductiveStatus: 'No aplica',
        serviceDate: '',
        expectedCalvingDate: '',
        milkingStatus: 'No aplica',
        dailyMilkLiters: 0,
        isBreedingOnly: false,
      });
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'sex') {
      if (value === 'Macho') {
        setFormData(prev => ({
          ...prev,
          sex: 'Macho',
          category: 'Novillo',
          productionType: prev.productionType === 'Lechería' ? 'Ceba' : prev.productionType,
          reproductiveStatus: 'No aplica',
          serviceDate: '',
          expectedCalvingDate: '',
          milkingStatus: 'No aplica',
          dailyMilkLiters: 0,
          isBreedingOnly: false,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          sex: 'Hembra',
          category: 'Vaca',
          reproductiveStatus: 'Vacía',
          milkingStatus: 'Seca',
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.tagNumber.trim()) {
      newErrors.tagNumber = 'El número de arete o chapa es obligatorio';
    }
    if (!formData.entryWeight || Number(formData.entryWeight) <= 0) {
      newErrors.entryWeight = 'El peso inicial debe ser mayor a 0 kg';
    }
    if (formData.entryPrice === '' || Number(formData.entryPrice) < 0) {
      newErrors.entryPrice = 'El valor o costo de entrada no puede ser negativo';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      entryBatch: formData.entryBatch || 'Ingreso #1',
      paddock: formData.entryBatch || 'Ingreso #1', // backward compatibility
      entryWeight: parseFloat(formData.entryWeight),
      currentWeight: parseFloat(formData.currentWeight || formData.entryWeight),
      entryPrice: parseFloat(formData.entryPrice),
      additionalCosts: parseFloat(formData.additionalCosts || 0),
      dailyMilkLiters: parseFloat(formData.dailyMilkLiters || 0),
    });
  };

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
                Categoría / Etapa
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              >
                {CATEGORIES.map(c => (
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

        {/* SECCIÓN CONDICIONAL: Hembras */}
        {formData.sex === 'Hembra' && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-2">
              <span>🐄 Control Reproductivo & Producción de Leche (Hembras)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Estado Reproductivo
                </label>
                <select
                  name="reproductiveStatus"
                  value={formData.reproductiveStatus}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-purple-500 transition min-h-[44px]"
                >
                  {REPRODUCTIVE_STATUSES.filter(r => r.value !== 'No aplica').map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {formData.reproductiveStatus === 'Preñada' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                      Fecha de Servicio / Inseminación
                    </label>
                    <input
                      type="date"
                      name="serviceDate"
                      value={formData.serviceDate}
                      onChange={(e) => handleServiceDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                      Fecha Estimada Parto (+283d)
                    </label>
                    <input
                      type="date"
                      name="expectedCalvingDate"
                      value={formData.expectedCalvingDate}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none min-h-[44px]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Producción de Leche (Ordeño)
                </label>
                <select
                  name="milkingStatus"
                  value={formData.milkingStatus}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-purple-500 transition min-h-[44px]"
                >
                  <option value="En ordeño">🥛 En Producción de Leche (Ordeño)</option>
                  <option value="Seca">🍂 Seca (Descanso)</option>
                  <option value="No aplica">No aplica (Novilla de levante)</option>
                </select>
              </div>

              {formData.milkingStatus === 'En ordeño' && (
                <div>
                  <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                    Litros Promedio / Día
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="dailyMilkLiters"
                    value={formData.dailyMilkLiters}
                    onChange={handleChange}
                    placeholder="Ej. 14.5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500 transition min-h-[44px]"
                  />
                </div>
              )}

              <div className="sm:col-span-3 flex items-center gap-3 p-3 rounded-xl bg-purple-100/70 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/20">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Inicial (kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                name="entryWeight"
                value={formData.entryWeight}
                onChange={handleChange}
                placeholder="Ej. 280"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
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
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Guardar Cambios' : 'Registrar Bovino'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
