import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  DollarSign, 
  Calendar, 
  Tag, 
  Layers, 
  FileText, 
  Store, 
  CheckCircle2, 
  Save, 
  X,
  Repeat
} from 'lucide-react';
import { formatCurrency } from '../../services/calculations';

export const EXPENSE_CATEGORIES = [
  'Sal mineral / Suplementos / Melaza',
  'Medicamentos / Vacunas / Purgas',
  'Jornales / Personal / Vaquería',
  'Fletes / Transporte de Ganado',
  'Mantenimiento / Cercas / Pasturas',
  'Insumos / Herramientas / Combustible',
  'Otros Gastos de Finca',
];

export function ExpenseFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  expense = null,
  editingExpense = null,
  batches = [],
  availableBatches = []
}) {
  const currentExpense = expense || editingExpense;
  const currentBatches = (batches && batches.length > 0) ? batches : availableBatches;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    batch: 'Toda la Finca (General)',
    supplier: '',
    isRecurring: false,
    recurringDay: new Date().getDate(),
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (currentExpense) {
      const expDate = currentExpense.date || new Date().toISOString().slice(0, 10);
      const parsedDay = currentExpense.recurringDay || (expDate ? parseInt(expDate.slice(8, 10)) : new Date().getDate());
      setFormData({
        date: expDate,
        category: currentExpense.category || EXPENSE_CATEGORIES[0],
        amount: currentExpense.amount || '',
        description: currentExpense.description || currentExpense.concept || '',
        batch: currentExpense.batch || 'Toda la Finca (General)',
        supplier: currentExpense.supplier || '',
        isRecurring: !!currentExpense.isRecurring,
        recurringDay: parsedDay || 1,
      });
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      setFormData({
        date: todayStr,
        category: EXPENSE_CATEGORIES[0],
        amount: '',
        description: '',
        batch: 'Toda la Finca (General)',
        supplier: '',
        isRecurring: false,
        recurringDay: new Date().getDate(),
      });
    }
    setError('');
  }, [isOpen, currentExpense]);

  // Si cambia la fecha del gasto y el usuario no ha fijado un día diferente, sincronizar el día
  const handleDateChange = (newDate) => {
    setFormData(prev => {
      const day = newDate ? parseInt(newDate.slice(8, 10)) : prev.recurringDay;
      return {
        ...prev,
        date: newDate,
        recurringDay: prev.isRecurring ? prev.recurringDay : (day || 1)
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(formData.amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a $0.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Por favor ingresa una breve descripción del gasto (ej. 5 bultos de sal mineral).');
      return;
    }

    const recDay = parseInt(formData.recurringDay) || 1;
    if (formData.isRecurring && (recDay < 1 || recDay > 31)) {
      setError('El día de repetición mensual debe ser entre 1 y 31.');
      return;
    }

    onSave({
      ...(currentExpense ? { id: currentExpense.id } : {}),
      date: formData.date,
      category: formData.category,
      amount: numericAmount,
      description: formData.description.trim(),
      batch: formData.batch,
      supplier: formData.supplier.trim(),
      isRecurring: formData.isRecurring,
      recurringDay: formData.isRecurring ? recDay : null,
      recurringFrequency: formData.isRecurring ? 'monthly' : null,
      createdAt: currentExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentExpense ? '✏️ Modificar Gasto de Finca' : '💵 Registrar Gasto Operativo'}
      subtitle="Control de insumos, compras y gastos fijos recurrentes mensuales"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Monto del Gasto */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Valor del Gasto ($ COP) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Ej. 180000"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-extrabold focus:outline-none focus:border-emerald-500 min-h-[44px]"
              required
              autoFocus
            />
          </div>
          {formData.amount > 0 && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
              {formatCurrency(formData.amount)}
            </span>
          )}
        </div>

        {/* Categoría y Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoría <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 min-h-[42px]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fecha del Gasto <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 min-h-[42px]"
                required
              />
            </div>
          </div>
        </div>

        {/* Concepto / Detalle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Descripción / Concepto <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <textarea
              rows="2"
              placeholder="Ej. Sueldo vaquero, 4 bultos de sal mineral, arriendo de potrero..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Lote (Opcional) y Proveedor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lote / Destino (Opcional)
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={formData.batch}
                onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 min-h-[42px]"
              >
                <option value="Toda la Finca (General)">Toda la Finca (General)</option>
                {currentBatches.map(b => (
                  <option key={b} value={b}>Lote: {b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Proveedor / Responsable (Opcional)
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ej. Juan Pérez (Vaquero) / Almacén Ganadero"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              />
            </div>
          </div>
        </div>

        {/* Opción de Gasto Recurrente Mensual */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3 transition-all">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <div className="flex items-center gap-1.5 flex-1">
              <Repeat className={`w-4 h-4 ${formData.isRecurring ? 'text-indigo-600 dark:text-indigo-400 animate-spin-slow' : 'text-slate-400'}`} />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                ¿Repetir este gasto mensualmente? (Gasto Fijo)
              </span>
            </div>
          </label>

          {formData.isRecurring && (
            <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Día de cobro / registro mensual:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurringDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringDay: e.target.value }))}
                    className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                    required={formData.isRecurring}
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    de cada mes
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900">
                🔄 Se registrará y proyectará cada mes de forma automática sin necesidad de volver a digitarlo.
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold min-h-[42px] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition min-h-[42px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{currentExpense ? 'Guardar Cambios' : 'Registrar Gasto'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
