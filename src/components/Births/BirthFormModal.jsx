import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Baby, 
  AlertCircle, 
  CheckCircle2, 
  HeartCrack, 
  Scale, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Tag, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../../services/calculations';
import { useAuth } from '../../context/AuthContext';

const COMMON_BREEDS = [
  'Brahman Blanco',
  'Brahman Rojo',
  'Gyr Lechero',
  'Guzerá',
  'Nelore',
  'Girolando',
  'Holstein',
  'Jersey',
  'Pardo Suizo',
  'Simmental',
  'Angus',
  'Brangus',
  'Cebú Comercial',
  'Cruce / Mestizo'
];

export function BirthFormModal({ 
  isOpen, 
  onClose, 
  cattle = [], 
  births = [],
  onSaveBirth 
}) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    birthDate: new Date().toISOString().split('T')[0],
    tagNumber: '',
    sex: 'Macho',
    breed: 'Cebú Comercial',
    motherTag: '',
    fatherTag: '',
    farmName: currentUser?.farmName || 'Mi Finca Ganadera',
    paddock: 'Maternidad',
    birthWeight: '',
    estimatedValue: '800000',
    status: 'Vivo', // 'Vivo' | 'Muerto al nacimiento'
    notes: '',
  });

  const [error, setError] = useState(null);
  const [tagError, setTagError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de hembras para el selector de madre
  const females = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  // Lista de machos para el selector de padre
  const males = cattle.filter(c => c.sex === 'Macho' && c.status === 'Activo');

  // Obtener potreros únicos existentes
  const existingPaddocks = Array.from(new Set(
    cattle.map(c => c.paddock).filter(Boolean).concat(['Maternidad', 'Paritorio', 'Potrero 1', 'Potrero 2'])
  ));

  useEffect(() => {
    if (isOpen) {
      setFormData({
        birthDate: new Date().toISOString().split('T')[0],
        tagNumber: '',
        sex: 'Macho',
        breed: 'Cebú Comercial',
        motherTag: females.length > 0 ? females[0].tagNumber : '',
        fatherTag: '',
        farmName: currentUser?.farmName || 'Mi Finca Ganadera',
        paddock: 'Maternidad',
        birthWeight: '32',
        estimatedValue: '800000',
        status: 'Vivo',
        notes: '',
      });
      setError(null);
      setTagError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Validar identificación única en tiempo real
  const handleTagChange = (e) => {
    const rawVal = e.target.value.toUpperCase().trim();
    setFormData(prev => ({ ...prev, tagNumber: rawVal }));
    setError(null);

    if (!rawVal) {
      setTagError(null);
      return;
    }

    const tagExistsInCattle = cattle.some(c => (c.tagNumber || '').toUpperCase().trim() === rawVal && c.status === 'Activo');
    const tagExistsInBirths = births.some(b => (b.tagNumber || '').toUpperCase().trim() === rawVal && b.status === 'Vivo');

    if (tagExistsInCattle || tagExistsInBirths) {
      setTagError('Esta identificación ya está registrada. Verifique el número antes de registrar el nacimiento.');
    } else {
      setTagError(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanTag = (formData.tagNumber || '').trim().toUpperCase();
    const cleanMother = (formData.motherTag || '').trim().toUpperCase();
    const cleanFather = (formData.fatherTag || '').trim().toUpperCase();
    const cleanFarm = (formData.farmName || '').trim();
    const cleanPaddock = (formData.paddock || '').trim();
    const birthDate = formData.birthDate;
    const status = formData.status;
    const sex = formData.sex;

    // VALIDACIONES OBLIGATORIAS
    if (!birthDate) return setError('Por favor selecciona la fecha de nacimiento.');
    if (!cleanTag) return setError('Por favor ingresa el número de identificación del ternero/a.');
    if (!sex) return setError('Por favor selecciona el sexo del animal.');
    if (!cleanMother) return setError('Por favor indica o selecciona la madre del ternero/a.');
    if (!cleanFarm) return setError('Por favor ingresa la finca donde nació.');
    if (!status) return setError('Por favor selecciona el estado del nacimiento.');

    // Validar si el tag ya existe (en caso de nacimiento vivo)
    if (status === 'Vivo') {
      const tagExistsInCattle = cattle.some(c => (c.tagNumber || '').toUpperCase().trim() === cleanTag && c.status === 'Activo');
      const tagExistsInBirths = births.some(b => (b.tagNumber || '').toUpperCase().trim() === cleanTag && b.status === 'Vivo');

      if (tagExistsInCattle || tagExistsInBirths) {
        setError('Esta identificación ya está registrada. Verifique el número antes de registrar el nacimiento.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSaveBirth({
        ...formData,
        tagNumber: cleanTag,
        motherTag: cleanMother,
        fatherTag: cleanFather,
        farmName: cleanFarm,
        paddock: cleanPaddock,
        birthWeight: parseFloat(formData.birthWeight) || 0,
        estimatedValue: parseFloat(formData.estimatedValue) || 0,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error registrando el nacimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedEstimatedValue = parseFloat(formData.estimatedValue) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner border border-white/20">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Registrar Nacimiento</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  +1 Inventario
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
                Incorporación automática de nuevo ternero/a al hato
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* Banner de Estado del Nacimiento: Vivo vs Muerto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Estado del Nacimiento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, status: 'Vivo' }))}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition cursor-pointer text-left ${
                  formData.status === 'Vivo'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${formData.status === 'Vivo' ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs sm:text-sm leading-tight">🟢 Nacimiento Vivo</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Incorpora +1 animal activo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, status: 'Muerto al nacimiento' }))}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition cursor-pointer text-left ${
                  formData.status === 'Muerto al nacimiento'
                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${formData.status === 'Muerto al nacimiento' ? 'bg-rose-600' : 'bg-slate-400'}`}>
                  <HeartCrack className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs sm:text-sm leading-tight">🔴 Muerto al Nacer</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Solo trazabilidad de la madre</p>
                </div>
              </button>
            </div>
          </div>

          {/* Mensajes de Alerta y Error */}
          {(error || tagError) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error || tagError}</span>
            </div>
          )}

          {/* Fila 1: Fecha y Número de Identificación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Fecha de Nacimiento *</span>
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Identificación / Arete *</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Debe ser único</span>
              </label>
              <input
                type="text"
                name="tagNumber"
                value={formData.tagNumber}
                onChange={handleTagChange}
                placeholder="Ej. NAC-001 o 104"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold uppercase focus:ring-2 focus:outline-none shadow-sm ${
                  tagError 
                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 focus:ring-rose-500' 
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500'
                }`}
                required
              />
            </div>
          </div>

          {/* Fila 2: Sexo y Raza */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Sexo del Ternero/a *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, sex: 'Macho' }))}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    formData.sex === 'Macho'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🐂 Macho (Ternero)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, sex: 'Hembra' }))}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    formData.sex === 'Hembra'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🐄 Hembra (Ternera)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Raza *
              </label>
              <input
                type="text"
                name="breed"
                list="breeds-list"
                value={formData.breed}
                onChange={handleChange}
                placeholder="Selecciona o escribe la raza"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                required
              />
              <datalist id="breeds-list">
                {COMMON_BREEDS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Fila 3: Madre y Padre */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🧬 Genealogía & Trazabilidad Maternal</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  Madre (Vaca / Novilla) *
                </label>
                <input
                  type="text"
                  name="motherTag"
                  list="females-list"
                  value={formData.motherTag}
                  onChange={handleChange}
                  placeholder="Arete o nombre de la madre"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                  required
                />
                <datalist id="females-list">
                  {females.map(f => (
                    <option key={f.id} value={f.tagNumber}>
                      {f.tagNumber} {f.name ? `(${f.name})` : ''} - {f.breed || f.category}
                    </option>
                  ))}
                </datalist>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  {females.length} hembras activas en inventario
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  Padre / Toro (Opcional)
                </label>
                <input
                  type="text"
                  name="fatherTag"
                  list="males-list"
                  value={formData.fatherTag}
                  onChange={handleChange}
                  placeholder="Toro o código de pajilla I.A."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                />
                <datalist id="males-list">
                  {males.map(m => (
                    <option key={m.id} value={m.tagNumber}>
                      {m.tagNumber} {m.name ? `(${m.name})` : ''} - {m.breed}
                    </option>
                  ))}
                </datalist>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Toro reproductor o inseminación
                </span>
              </div>
            </div>
          </div>

          {/* Fila 4: Ubicación (Finca y Potrero) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Finca donde nació *</span>
              </label>
              <input
                type="text"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                placeholder="Nombre de la finca o hacienda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Potrero / Lote de Maternidad
              </label>
              <input
                type="text"
                name="paddock"
                list="paddocks-list"
                value={formData.paddock}
                onChange={handleChange}
                placeholder="Ej. Maternidad o Potrero 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
              />
              <datalist id="paddocks-list">
                {existingPaddocks.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Fila 5: Peso al Nacer y Valor Estimado al Nacimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Peso al Nacimiento (kg)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="birthWeight"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.birthWeight}
                  onChange={handleChange}
                  placeholder="Ej. 32"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">kg</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Inicia la curva de ganancia de peso (GDP)
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Valor Estimado al Nacimiento ($)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="estimatedValue"
                  step="10000"
                  min="0"
                  value={formData.estimatedValue}
                  onChange={handleChange}
                  placeholder="Ej. 800000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                />
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5 block">
                {formatCurrency(parsedEstimatedValue)} estimado
              </span>
            </div>
          </div>

          {/* Banner Explicativo de Valor Patrimonial Incorporado */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-extrabold uppercase">Valor incorporado al inventario: </span>
              Este valor representa únicamente el valor patrimonial estimado del nuevo animal. 
              <strong className="underline ml-1">NO</strong> se registra como ingreso por venta, dinero recibido ni utilidad realizada.
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Observaciones del Parto
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ej. Parto natural sin complicaciones, ternero vigoroso, mamó calostro a la primera hora..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
            />
          </div>

        </form>

        {/* Footer con Botones de Acción */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer min-h-[42px]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !!tagError}
            className={`px-5 py-2.5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer min-h-[42px] ${
              formData.status === 'Vivo'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-700/25'
            } ${(isSubmitting || !!tagError) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {formData.status === 'Vivo' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Incorporar Nacimiento al Inventario (+1)</span>
              </>
            ) : (
              <>
                <HeartCrack className="w-4 h-4" />
                <span>Registrar Pérdida Perinatal (Trazabilidad)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
