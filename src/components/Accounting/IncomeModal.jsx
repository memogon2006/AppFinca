import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  PlusCircle, 
  Check, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../services/calculations';
import { saveDraft, loadDraft, clearDraft } from '../../services/draftService';

export const INCOME_CATEGORIES = [
  { id: 'leche', label: 'Venta de Leche & Queso', icon: '🥛', examples: 'Liquidación quincenal de leche, venta de quesos' },
  { id: 'arriendo_pasto', label: 'Arriendo de Pastos / Pastoreo', icon: '🌱', examples: 'Alquiler de potrero a terceros, pastoreo por cabeza' },
  { id: 'servicios_monta', label: 'Servicios de Monta & Reproducción', icon: '🐂', examples: 'Servicio de reproductor, inseminación, venta de pajillas' },
  { id: 'abono_organico', label: 'Abono Orgánico & Estiércol', icon: '💩', examples: 'Venta de gallinaza/estiércol seco por bultos' },
  { id: 'subproductos', label: 'Subproductos Agrícolas / Maderas', icon: '🪵', examples: 'Venta de madera, leña, frutas o cosechas de la finca' },
  { id: 'otros_ingresos', label: 'Otros Ingresos Varios', icon: '💰', examples: 'Premios de feria, devoluciones, asesorías' },
];

export function IncomeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  income = null, 
  zIndex = "z-[60]" 
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'leche',
    concept: '',
    amount: '',
    paymentMethod: 'Transferencia',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const isDraftInitializedRef = React.useRef(false);

  useEffect(() => {
    if (income) {
      setFormData({
        id: income.id,
        date: income.date || new Date().toISOString().slice(0, 10),
        category: income.category || 'leche',
        concept: income.concept || '',
        amount: income.amount !== undefined ? String(income.amount) : '',
        paymentMethod: income.paymentMethod || 'Transferencia',
        notes: income.notes || '',
      });
      setIsDraftRestored(false);
    } else {
      const defaultState = {
        date: new Date().toISOString().slice(0, 10),
        category: 'leche',
        concept: '',
        amount: '',
        paymentMethod: 'Transferencia',
        notes: '',
      };

      const draft = loadDraft('income');
      if (draft && (draft.concept || draft.amount || draft.notes)) {
        setFormData(draft);
        setIsDraftRestored(true);
      } else {
        setFormData(defaultState);
        setIsDraftRestored(false);
      }
    }
    setErrors({});
    setTimeout(() => {
      isDraftInitializedRef.current = true;
    }, 100);
  }, [income, isOpen]);

  // Auto-guardar borrador de ingreso
  useEffect(() => {
    if (!isOpen || income || !isDraftInitializedRef.current) return;
    if (formData.concept || formData.amount || formData.notes) {
      saveDraft('income', formData);
    }
  }, [isOpen, income, formData]);

  const handleDiscardDraft = () => {
    clearDraft('income');
    setIsDraftRestored(false);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: 'leche',
      concept: '',
      amount: '',
      paymentMethod: 'Transferencia',
      notes: '',
    });
    setErrors({});
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.date) errs.date = 'La fecha es obligatoria';
    if (!formData.concept || formData.concept.trim().length < 3) {
      errs.concept = 'Ingresa un concepto o detalle del ingreso';
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
      type: 'Ingreso Operativo',
      amount: parseFloat(formData.amount) || 0,
      updatedAt: new Date().toISOString()
    };

    if (!income) {
      clearDraft('income');
      setIsDraftRestored(false);
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in`}>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {income ? 'Editar Ingreso de Finca' : 'Registrar Ingreso Adicional de Finca'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Venta de leche, arriendos, abonos y otros ingresos complementarios
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
          
          {/* BANNER DE BORRADOR RESTAURADO */}
          {isDraftRestored && !income && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200 animate-fade-in gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                <span className="text-xs font-bold">✨ Borrador recuperado automáticamente</span>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-rose-500/20 text-amber-900 dark:text-amber-100 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-xs shrink-0 transition cursor-pointer"
              >
                Descartar
              </button>
            </div>
          )}

          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monto Recibido ($ COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-black text-sm">$</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej: 1200000"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl text-sm font-black bg-slate-50 dark:bg-slate-800 border ${
                    errors.amount ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
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
                Fecha de Cobro / Ingreso *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.date && <p className="text-[11px] text-rose-500 mt-0.5">{errors.date}</p>}
            </div>
          </div>

          {/* Categoría del Ingreso */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Tipo de Ingreso</span>
              <span className="text-[10px] text-slate-400 font-normal">Selecciona la fuente del ingreso</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INCOME_CATEGORIES.map(cat => {
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{cat.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{cat.examples}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concepto / Detalle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Concepto / Detalle del Ingreso *
            </label>
            <input
              type="text"
              placeholder="Ej: Pago quincena 1 de septiembre leche (680 litros a $1.850)"
              value={formData.concept}
              onChange={e => setFormData({ ...formData, concept: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border ${
                errors.concept ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } focus:outline-none focus:ring-2`}
            />
            {errors.concept && <p className="text-[11px] text-rose-500 mt-0.5">{errors.concept}</p>}
          </div>

          {/* Método de Cobro */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Forma de Cobro / Pago
            </label>
            <select
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Transferencia">🏦 Transferencia Bancaria / Nequi / Daviplata</option>
              <option value="Efectivo">💵 Efectivo</option>
              <option value="Cheque">📜 Cheque</option>
              <option value="Crédito">📋 Saldo a Favor / Crédito</option>
            </select>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notas / Comprador / Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Pagado por Comprador Don Carlos. Consignado a cuenta Bancolombia."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{income ? 'Guardar Cambios' : 'Registrar Ingreso'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
