import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  FileText, 
  Tag, 
  Repeat, 
  CreditCard, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../../services/calculations';

export const EXPENSE_CATEGORIES = [
  { id: 'nomina', label: 'Nómina & Mano de Obra', icon: '🤠', defaultType: 'Fijo', examples: 'Sueldos, jornales, bonificaciones, seguridad social' },
  { id: 'alimentacion', label: 'Nutrición & Alimentación', icon: '🌾', defaultType: 'Variable', examples: 'Sal mineralizada, concentrado, silo, heno, melaza' },
  { id: 'sanidad', label: 'Sanidad & Medicamentos', icon: '💉', defaultType: 'Variable', examples: 'Vacunas, purgas, vitaminas, antibióticos, agujas' },
  { id: 'servicios', label: 'Servicios Públicos & Energía', icon: '⚡', defaultType: 'Fijo', examples: 'Luz eléctrica, agua, combustible para planta/bomba, gas' },
  { id: 'mantenimiento', label: 'Mantenimiento & Potreros', icon: '🛠️', defaultType: 'Variable', examples: 'Cercas, alambre, postes, saladeros, abonos, herbicidas' },
  { id: 'arriendos', label: 'Arriendos & Impuestos', icon: '📜', defaultType: 'Fijo', examples: 'Arriendo de pastos, impuesto predial, cuotas de administración' },
  { id: 'transporte', label: 'Fletes & Transporte', icon: '🚚', defaultType: 'Variable', examples: 'Transporte de ganado, guías ICA, fletes de insumos' },
  { id: 'maquinaria', label: 'Maquinaria & Equipos', icon: '🚜', defaultType: 'Inversión', examples: 'Mantenimiento de tractor, motobomba, báscula, herramientas' },
  { id: 'otros', label: 'Otros Gastos / Imprevistos', icon: '📦', defaultType: 'Variable', examples: 'Papelería, gastos de viaje, emergencias de manga' },
];

export function ExpenseModal({ 
  isOpen, 
  onClose, 
  onSave, 
  expense = null, 
  zIndex = "z-[60]" 
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'Variable',
    category: 'alimentacion',
    concept: '',
    amount: '',
    paymentMethod: 'Efectivo',
    isRecurring: false,
    recurrenceFrequency: 'Mensual',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setFormData({
        id: expense.id,
        date: expense.date || new Date().toISOString().slice(0, 10),
        type: expense.type || 'Variable',
        category: expense.category || 'alimentacion',
        concept: expense.concept || '',
        amount: expense.amount !== undefined ? String(expense.amount) : '',
        paymentMethod: expense.paymentMethod || 'Efectivo',
        isRecurring: !!expense.isRecurring,
        recurrenceFrequency: expense.recurrenceFrequency || 'Mensual',
        notes: expense.notes || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        type: 'Variable',
        category: 'alimentacion',
        concept: '',
        amount: '',
        paymentMethod: 'Efectivo',
        isRecurring: false,
        recurrenceFrequency: 'Mensual',
        notes: '',
      });
    }
    setErrors({});
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (catId) => {
    const found = EXPENSE_CATEGORIES.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      category: catId,
      type: found ? found.defaultType : prev.type
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.date) errs.date = 'La fecha es obligatoria';
    if (!formData.concept || formData.concept.trim().length < 3) {
      errs.concept = 'Ingresa un concepto o descripción clara del gasto';
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Ingresa un monto válido mayor a 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      updatedAt: new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in`}>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {expense ? 'Editar Gasto / Egreso' : 'Registrar Nuevo Gasto de Finca'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lleva la contabilidad exacta de costos operativos y de campo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monto del Gasto ($ COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-black text-sm">$</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej: 350000"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl text-sm font-black bg-slate-50 dark:bg-slate-800 border ${
                    errors.amount ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-rose-500'
                  } focus:outline-none focus:ring-2`}
                  autoFocus
                />
              </div>
              {errors.amount && <p className="text-[11px] text-rose-500 mt-0.5">{errors.amount}</p>}
              {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  {formatCurrency(parseFloat(formData.amount))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del Gasto *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              {errors.date && <p className="text-[11px] text-rose-500 mt-0.5">{errors.date}</p>}
            </div>
          </div>

          {/* Categoría del Gasto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Rubro / Categoría Ganadera</span>
              <span className="text-[10px] text-slate-400 font-normal">Selecciona la que corresponda</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map(cat => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black truncate">{cat.label}</div>
                      <div className="text-[9px] text-slate-400 truncate">{cat.defaultType}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de Gasto & Método de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Costo
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Fijo">Gasto Fijo (Nómina, arriendo, servicios)</option>
                <option value="Variable">Gasto Variable (Insumos, sal, sanidad)</option>
                <option value="Inversión">Inversión / Activo (Maquinaria, mejoras)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Método de Pago
              </label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Transferencia">🏦 Transferencia / Bancolombia / Nequi</option>
                <option value="Crédito">📋 Crédito / Cuenta por Pagar</option>
                <option value="Cheque">📜 Cheque</option>
              </select>
            </div>
          </div>

          {/* Concepto / Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Concepto / Detalle del Gasto *
            </label>
            <input
              type="text"
              placeholder="Ej: Sal mineralizada 40kg Somex 8% (4 bultos)"
              value={formData.concept}
              onChange={e => setFormData({ ...formData, concept: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border ${
                errors.concept ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-rose-500'
              } focus:outline-none focus:ring-2`}
            />
            {errors.concept && <p className="text-[11px] text-rose-500 mt-0.5">{errors.concept}</p>}
          </div>

          {/* Gasto Recurrente Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">¿Es un gasto recurrente mensual?</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Marca si este costo se repite cada mes (ej. sueldo, luz)</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notas / Proveedor / Factura (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Factura #4829 de Agroveterinaria El Ganadero. Pagado por el administrador."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{expense ? 'Guardar Cambios' : 'Registrar Gasto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
