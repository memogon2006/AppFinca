import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  DollarSign, 
  Calendar, 
  Milk, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  FileText, 
  Share2, 
  PlusCircle, 
  MinusCircle, 
  Building2, 
  TrendingUp, 
  Trash2,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculatePeriodMilkSummary } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

export function MilkSettlementModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData = null,
  dailyMilkLogs = [],
  milkRecords = [],
  currentPeriodRange = null,
  defaultPricePerLiter = 2100,
  farmName = 'Mi Finca Ganadera',
  zIndex = 'z-50'
}) {
  const [periodType, setPeriodType] = useState('quincenal');
  const [startDate, setStartDate] = useState(() => currentPeriodRange?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => currentPeriodRange?.endDate || new Date().toISOString().split('T')[0]);
  
  const [totalLiters, setTotalLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [bonuses, setBonuses] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [buyer, setBuyer] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pagada');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [registerIncome, setRegisterIncome] = useState(true);
  const [notes, setNotes] = useState('');

  // Sincronizar datos al abrir
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPeriodType(initialData.periodType || 'quincenal');
        setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
        setEndDate(initialData.endDate || new Date().toISOString().split('T')[0]);
        setTotalLiters(initialData.totalLiters ? String(initialData.totalLiters) : '');
        setPricePerLiter(initialData.pricePerLiter ? String(initialData.pricePerLiter) : (defaultPricePerLiter ? String(defaultPricePerLiter) : '2100'));
        setBonuses(initialData.bonuses !== undefined ? String(initialData.bonuses) : '0');
        setDeductions(initialData.deductions !== undefined ? String(initialData.deductions) : '0');
        setBuyer(initialData.buyer || '');
        setPaymentStatus(initialData.paymentStatus || 'Pagada');
        setPaymentDate(initialData.paymentDate || new Date().toISOString().split('T')[0]);
        setRegisterIncome(initialData.registerIncome !== false);
        setNotes(initialData.notes || '');
      } else {
        const sDate = currentPeriodRange?.startDate || new Date().toISOString().split('T')[0];
        const eDate = currentPeriodRange?.endDate || new Date().toISOString().split('T')[0];
        setPeriodType(currentPeriodRange?.periodType === 'full_month' ? 'mensual' : currentPeriodRange?.periodType === 'current_week' ? 'semanal' : 'quincenal');
        setStartDate(sDate);
        setEndDate(eDate);

        // Auto-calcular litros acumulados para venta en el rango
        const summary = calculatePeriodMilkSummary(dailyMilkLogs, milkRecords, sDate, eDate, 0);
        const lit = summary.totalSalesLiters > 0 ? summary.totalSalesLiters : summary.totalLiters;
        setTotalLiters(lit > 0 ? String(lit) : '');
        setPricePerLiter(defaultPricePerLiter ? String(defaultPricePerLiter) : '2100');
        setBonuses('0');
        setDeductions('0');
        setBuyer('');
        setPaymentStatus('Pagada');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setRegisterIncome(true);
        setNotes('');
      }
    }
  }, [isOpen, initialData, currentPeriodRange, dailyMilkLogs, milkRecords, defaultPricePerLiter]);

  // Al cambiar rango de fechas en nuevo registro, recalcular litros de venta
  const handleRangeChange = (newStart, newEnd) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    if (!initialData) {
      const summary = calculatePeriodMilkSummary(dailyMilkLogs, milkRecords, newStart, newEnd, 0);
      const lit = summary.totalSalesLiters > 0 ? summary.totalSalesLiters : summary.totalLiters;
      if (lit > 0) {
        setTotalLiters(String(lit));
      }
    }
  };

  // Cálculos financieros en vivo
  const litersNum = parseFloat(totalLiters) || 0;
  const priceNum = parseFloat(pricePerLiter) || 0;
  const baseAmount = litersNum * priceNum;
  const bonusesNum = parseFloat(bonuses) || 0;
  const deductionsNum = parseFloat(deductions) || 0;
  const totalValue = Math.max(0, baseAmount + bonusesNum - deductionsNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (litersNum <= 0) {
      alert('Por favor ingresa la cantidad de litros a liquidar.');
      return;
    }
    if (priceNum <= 0) {
      alert('Por favor ingresa el precio por litro pactado.');
      return;
    }

    const settlement = {
      ...(initialData || {}),
      startDate,
      endDate,
      periodType,
      totalLiters: litersNum,
      pricePerLiter: priceNum,
      baseAmount,
      bonuses: bonusesNum,
      deductions: deductionsNum,
      totalValue,
      buyer: buyer.trim() || 'Planta / Comprador de Leche',
      paymentStatus,
      paymentDate,
      registerIncome,
      notes: notes.trim(),
    };

    onSave(settlement);
    triggerFeedback('success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Liquidación de Leche" : "💰 Generar Liquidación & Venta de Leche"}
      zIndex={zIndex}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Período de Liquidación */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Período a Liquidar</span>
            </h4>
            <div className="flex gap-1.5">
              {['quincenal', 'mensual', 'semanal', 'otro'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPeriodType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    periodType === t 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleRangeChange(e.target.value, endDate)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => handleRangeChange(startDate, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Sección de Volúmenes y Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Milk className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Litros Totales a Liquidar *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                placeholder="Ej. 2450"
                value={totalLiters}
                onChange={(e) => setTotalLiters(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-blue-500 transition pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Litros
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Precio Base por Litro ($/L) *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                step="50"
                required
                placeholder="Ej. 2100"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-emerald-500 transition pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                $/Litro
              </span>
            </div>
          </div>
        </div>

        {/* Bonificaciones y Deducciones */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/20 space-y-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Ajustes, Bonificaciones & Deducciones</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Bonificaciones (+) (Calidad, Frío, Volumen)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={bonuses}
                  onChange={(e) => setBonuses(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-300 mb-1 flex items-center gap-1">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Deducciones (-) (Fletes, Retenciones, Pruebas)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta Resumen Total Liquidación */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Valor Neto Liquidación
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Base: {formatCurrency(baseAmount)} {bonusesNum > 0 ? `+ Bonos: ${formatCurrency(bonusesNum)}` : ''} {deductionsNum > 0 ? `- Ded: ${formatCurrency(deductionsNum)}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalValue)}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">
                {litersNum > 0 ? `Prom Real: ${formatCurrency(totalValue / litersNum)}/L` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Comprador / Empresa y Estado de Pago */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Comprador / Planta</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Colanta, Quesera..."
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Estado de Pago
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="Pagada">🟢 Pagada / Cobrada</option>
              <option value="Pendiente">🟡 Pendiente de Pago</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Fecha de Pago
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {/* Switch para registrar en Contabilidad (farmIncomes) */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Registrar en Ingresos Contables de la Finca</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Crea automáticamente la entrada en el Libro Contable para la Utilidad Neta
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={registerIncome}
              onChange={(e) => setRegisterIncome(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Notas adicionales */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Observaciones de la Liquidación
          </label>
          <input
            type="text"
            placeholder="Ej. Cheque #4920, consignación Bancolombia..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          {initialData?.id && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Deseas eliminar esta liquidación de leche? Los días asociados volverán a estado pendiente.')) {
                  onDelete(initialData.id);
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Liquidación</span>
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
