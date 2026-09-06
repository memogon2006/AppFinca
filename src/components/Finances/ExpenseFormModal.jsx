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
  X 
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
  editingExpense = null,
  availableBatches = []
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    batch: 'Toda la Finca (General)',
    supplier: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        date: editingExpense.date || new Date().toISOString().slice(0, 10),
        category: editingExpense.category || EXPENSE_CATEGORIES[0],
        amount: editingExpense.amount || '',
        description: editingExpense.description || editingExpense.concept || '',
        batch: editingExpense.batch || 'Toda la Finca (General)',
        supplier: editingExpense.supplier || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        category: EXPENSE_CATEGORIES[0],
        amount: '',
        description: '',
        batch: 'Toda la Finca (General)',
        supplier: '',
      });
    }
    setError('');
  }, [isOpen, editingExpense]);

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

    onSave({
      ...(editingExpense ? { id: editingExpense.id } : {}),
      date: formData.date,
      category: formData.category,
      amount: numericAmount,
      description: formData.description.trim(),
      batch: formData.batch,
      supplier: formData.supplier.trim(),
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? '✏️ Modificar Gasto de Finca' : '💵 Registrar Gasto Operativo'}
      subtitle="Control opcional de sales, medicamentos, jornales, transporte y mantenimiento"
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
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
              placeholder="Ej. Compra de 4 bultos de sal mineralizada y 1 cantina de melaza"
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
                {availableBatches.map(b => (
                  <option key={b} value={b}>Lote: {b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Proveedor / Tienda (Opcional)
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ej. Almacén Agropecuario"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              />
            </div>
          </div>
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
            <span>{editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
