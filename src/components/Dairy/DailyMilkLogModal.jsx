import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { 
  Milk, 
  Calendar, 
  Users, 
  DollarSign, 
  Baby, 
  Store, 
  AlertTriangle, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Trash2,
  Clock,
  HelpCircle,
  Plus,
  Minus
} from 'lucide-react';
import { formatNumber, formatCurrency } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

export function DailyMilkLogModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData = null,
  activeMilkingCowsCount = 0,
  defaultPricePerLiter = 0,
  zIndex = 'z-50'
}) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amLiters, setAmLiters] = useState('');
  const [pmLiters, setPmLiters] = useState('');
  const [totalLiters, setTotalLiters] = useState('');
  const [cowsMilked, setCowsMilked] = useState('');
  const [calvesLiters, setCalvesLiters] = useState('0');
  const [farmLiters, setFarmLiters] = useState('0');
  const [rejectedLiters, setRejectedLiters] = useState('0');
  const [salesLiters, setSalesLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [notes, setNotes] = useState('');

  // Sincronizar datos al abrir o cambiar de registro
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setAmLiters(initialData.amLiters ? String(initialData.amLiters) : '');
        setPmLiters(initialData.pmLiters ? String(initialData.pmLiters) : '');
        setTotalLiters(initialData.totalLiters ? String(initialData.totalLiters) : '');
        setCowsMilked(initialData.cowsMilked ? String(initialData.cowsMilked) : '');
        setCalvesLiters(initialData.calvesLiters !== undefined ? String(initialData.calvesLiters) : '0');
        setFarmLiters(initialData.farmLiters !== undefined ? String(initialData.farmLiters) : '0');
        setRejectedLiters(initialData.rejectedLiters !== undefined ? String(initialData.rejectedLiters) : '0');
        setSalesLiters(initialData.salesLiters !== undefined ? String(initialData.salesLiters) : '');
        setPricePerLiter(initialData.pricePerLiter ? String(initialData.pricePerLiter) : (defaultPricePerLiter > 0 ? String(defaultPricePerLiter) : ''));
        setNotes(initialData.notes || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setAmLiters('');
        setPmLiters('');
        setTotalLiters('');
        setCowsMilked(activeMilkingCowsCount > 0 ? String(activeMilkingCowsCount) : '');
        setCalvesLiters('0');
        setFarmLiters('0');
        setRejectedLiters('0');
        setSalesLiters('');
        setPricePerLiter(defaultPricePerLiter > 0 ? String(defaultPricePerLiter) : '');
        setNotes('');
      }
    }
  }, [isOpen, initialData, activeMilkingCowsCount, defaultPricePerLiter]);

  // Recalcular total automáticamente al cambiar AM o PM
  const handleAmChange = (val) => {
    setAmLiters(val);
    const am = parseFloat(val) || 0;
    const pm = parseFloat(pmLiters) || 0;
    const tot = am + pm;
    setTotalLiters(tot > 0 ? String(Number(tot.toFixed(1))) : '');
    
    // Auto-calcular venta descontando terneros, finca y descarte
    const cal = parseFloat(calvesLiters) || 0;
    const frm = parseFloat(farmLiters) || 0;
    const rej = parseFloat(rejectedLiters) || 0;
    const sal = Math.max(0, tot - cal - frm - rej);
    setSalesLiters(sal > 0 ? String(Number(sal.toFixed(1))) : (tot > 0 ? String(Number(tot.toFixed(1))) : ''));
  };

  const handlePmChange = (val) => {
    setPmLiters(val);
    const am = parseFloat(amLiters) || 0;
    const pm = parseFloat(val) || 0;
    const tot = am + pm;
    setTotalLiters(tot > 0 ? String(Number(tot.toFixed(1))) : '');

    const cal = parseFloat(calvesLiters) || 0;
    const frm = parseFloat(farmLiters) || 0;
    const rej = parseFloat(rejectedLiters) || 0;
    const sal = Math.max(0, tot - cal - frm - rej);
    setSalesLiters(sal > 0 ? String(Number(sal.toFixed(1))) : (tot > 0 ? String(Number(tot.toFixed(1))) : ''));
  };

  const handleTotalChange = (val) => {
    setTotalLiters(val);
    const tot = parseFloat(val) || 0;
    const cal = parseFloat(calvesLiters) || 0;
    const frm = parseFloat(farmLiters) || 0;
    const rej = parseFloat(rejectedLiters) || 0;
    const sal = Math.max(0, tot - cal - frm - rej);
    setSalesLiters(sal > 0 ? String(Number(sal.toFixed(1))) : (tot > 0 ? String(Number(tot.toFixed(1))) : ''));
  };

  const handleDeductionChange = (calVal, frmVal, rejVal) => {
    const tot = parseFloat(totalLiters) || ((parseFloat(amLiters) || 0) + (parseFloat(pmLiters) || 0));
    const cal = parseFloat(calVal !== undefined ? calVal : calvesLiters) || 0;
    const frm = parseFloat(frmVal !== undefined ? frmVal : farmLiters) || 0;
    const rej = parseFloat(rejVal !== undefined ? rejVal : rejectedLiters) || 0;
    const sal = Math.max(0, tot - cal - frm - rej);
    setSalesLiters(sal > 0 ? String(Number(sal.toFixed(1))) : '');
  };

  // Botones rápidos de incremento
  const addLiters = (setter, getter, amount) => {
    const cur = parseFloat(getter) || 0;
    const next = Math.max(0, Number((cur + amount).toFixed(1)));
    setter(String(next));
    triggerFeedback('click');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const am = parseFloat(amLiters) || 0;
    const pm = parseFloat(pmLiters) || 0;
    let tot = parseFloat(totalLiters) || 0;
    if (tot === 0 && (am > 0 || pm > 0)) {
      tot = am + pm;
    }

    if (tot <= 0) {
      alert('Por favor ingresa al menos la cantidad de litros producidos en la mañana (AM), tarde (PM) o el total del día.');
      return;
    }

    const cows = parseInt(cowsMilked, 10) || 0;
    const cal = parseFloat(calvesLiters) || 0;
    const frm = parseFloat(farmLiters) || 0;
    const rej = parseFloat(rejectedLiters) || 0;
    let sal = parseFloat(salesLiters);
    if (isNaN(sal)) {
      sal = Math.max(0, tot - cal - frm - rej);
    }
    const price = parseFloat(pricePerLiter) || 0;

    const record = {
      ...(initialData || {}),
      date,
      amLiters: am,
      pmLiters: pm,
      totalLiters: tot,
      cowsMilked: cows,
      calvesLiters: cal,
      farmLiters: frm,
      rejectedLiters: rej,
      salesLiters: sal,
      pricePerLiter: price,
      notes: notes.trim(),
    };

    onSave(record);
    onClose();
  };

  const currentTotal = parseFloat(totalLiters) || ((parseFloat(amLiters) || 0) + (parseFloat(pmLiters) || 0));
  const currentSales = parseFloat(salesLiters) || Math.max(0, currentTotal - (parseFloat(calvesLiters) || 0) - (parseFloat(farmLiters) || 0) - (parseFloat(rejectedLiters) || 0));
  const currentCows = parseInt(cowsMilked, 10) || 0;
  const avgPerCow = currentCows > 0 ? (currentTotal / currentCows) : 0;
  const currentPrice = parseFloat(pricePerLiter) || 0;
  const estimatedDayValue = currentSales * currentPrice;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Producción Diaria General" : "🥛 Registrar Producción General del Día"}
      zIndex={zIndex}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Encabezado / Fecha y Vacas Ordeñadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Fecha del Ordeño *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Vacas Ordeñadas Hoy</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ej. 18"
                value={cowsMilked}
                onChange={(e) => setCowsMilked(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                cabezas
              </span>
            </div>
            {activeMilkingCowsCount > 0 && !cowsMilked && (
              <button
                type="button"
                onClick={() => setCowsMilked(String(activeMilkingCowsCount))}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline mt-1 font-semibold block"
              >
                ⚡ Usar {activeMilkingCowsCount} vacas en ordeño del inventario
              </button>
            )}
          </div>
        </div>

        {/* Sección 1: Pesaje de Ordeño AM y PM */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-emerald-500/10 border border-blue-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Milk className="w-4 h-4" />
              <span>Volumen de Leche Producido (Litros)</span>
            </h4>
            {avgPerCow > 0 && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300/40">
                Prom: {formatNumber(avgPerCow, 1)} L/vaca
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Ordeño Mañana (AM) */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>🌅 Mañana (AM)</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={amLiters}
                  onChange={(e) => handleAmChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-amber-500 transition pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addLiters(setAmLiters, amLiters, 5)}
                  className="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  +5 L
                </button>
                <button
                  type="button"
                  onClick={() => addLiters(setAmLiters, amLiters, 10)}
                  className="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  +10 L
                </button>
              </div>
            </div>

            {/* Ordeño Tarde (PM) */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>🌇 Tarde (PM)</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={pmLiters}
                  onChange={(e) => handlePmChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 transition pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addLiters(setPmLiters, pmLiters, 5)}
                  className="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  +5 L
                </button>
                <button
                  type="button"
                  onClick={() => addLiters(setPmLiters, pmLiters, 10)}
                  className="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  +10 L
                </button>
              </div>
            </div>

            {/* Total Litros del Día */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                <span>🥛 TOTAL DÍA</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={totalLiters}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-400/50 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-black text-xl focus:ring-2 focus:ring-emerald-500 transition pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-600 dark:text-emerald-400">L</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block text-center font-medium">
                Auto-suma AM + PM o directo
              </span>
            </div>
          </div>
        </div>

        {/* Sección 2: Destino de la Leche (Venta vs Terneros vs Queso/Finca) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Distribución & Destino de la Leche</span>
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Venta: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatNumber(currentSales, 1)} L</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Litros a Venta / Tanque */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                🧊 Venta / Tanque *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={salesLiters}
                  onChange={(e) => setSalesLiters(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
              </div>
            </div>

            {/* Litros Terneros */}
            <div>
              <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                <Baby className="w-3 h-3" />
                <span>Terneros</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={calvesLiters}
                  onChange={(e) => {
                    setCalvesLiters(e.target.value);
                    handleDeductionChange(e.target.value, undefined, undefined);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-purple-500 transition pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
              </div>
            </div>

            {/* Litros Consumo / Quesería */}
            <div>
              <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span>Queso / Finca</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={farmLiters}
                  onChange={(e) => {
                    setFarmLiters(e.target.value);
                    handleDeductionChange(undefined, e.target.value, undefined);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 transition pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
              </div>
            </div>

            {/* Litros Descarte / Rechazo */}
            <div>
              <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Descarte / Mastitis</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={rejectedLiters}
                  onChange={(e) => {
                    setRejectedLiters(e.target.value);
                    handleDeductionChange(undefined, undefined, e.target.value);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-rose-500 transition pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Precio / Facturación Estimada & Notas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Precio Base por Litro (Opcional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                placeholder="Ej. 2100"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                $/Litro
              </span>
            </div>
            {estimatedDayValue > 0 && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                Valor estimado día: {formatCurrency(estimatedDayValue)}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Observaciones / Novedades
            </label>
            <input
              type="text"
              placeholder="Ej. Lluvia fuerte en la tarde, pasto nuevo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          {initialData?.id && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Deseas eliminar este registro de producción diaria?')) {
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
              <span>Guardar Producción</span>
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
