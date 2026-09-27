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
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatNumber, formatCurrency, formatDate, getLocalDateString } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

export function DailyMilkLogModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData = null,
  dailyMilkLogs = [],
  activeMilkingCowsCount = 0,
  defaultPricePerLiter = 0,
  zIndex = 'z-50'
}) {
  const [date, setDate] = useState(() => getLocalDateString(new Date()));
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
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cargar automáticamente los datos según la fecha seleccionada
  const loadDataForDate = (targetDate, fallbackData = null) => {
    const existing = fallbackData?.id 
      ? fallbackData 
      : dailyMilkLogs.find(l => l.date === targetDate);

    if (existing) {
      setExistingRecordId(existing.id || null);
      setAmLiters(existing.amLiters ? String(existing.amLiters) : '');
      setPmLiters(existing.pmLiters ? String(existing.pmLiters) : '');
      setTotalLiters(existing.totalLiters ? String(existing.totalLiters) : '');
      setCowsMilked(existing.cowsMilked ? String(existing.cowsMilked) : '');
      setCalvesLiters(existing.calvesLiters !== undefined ? String(existing.calvesLiters) : '0');
      setFarmLiters(existing.farmLiters !== undefined ? String(existing.farmLiters) : '0');
      setRejectedLiters(existing.rejectedLiters !== undefined ? String(existing.rejectedLiters) : '0');
      setSalesLiters(existing.salesLiters !== undefined ? String(existing.salesLiters) : '');
      setPricePerLiter(existing.pricePerLiter ? String(existing.pricePerLiter) : (defaultPricePerLiter > 0 ? String(defaultPricePerLiter) : ''));
      setNotes(existing.notes || '');
      if (parseFloat(existing.calvesLiters) > 0 || parseFloat(existing.farmLiters) > 0 || parseFloat(existing.rejectedLiters) > 0) {
        setShowAdvanced(true);
      }
    } else {
      setExistingRecordId(null);
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
      setShowAdvanced(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const targetDate = initialData?.date || getLocalDateString(new Date());
      setDate(targetDate);
      loadDataForDate(targetDate, initialData);
    }
  }, [isOpen, initialData, dailyMilkLogs, activeMilkingCowsCount, defaultPricePerLiter]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    loadDataForDate(newDate);
  };

  // Recalcular total automáticamente al cambiar AM o PM
  const handleAmChange = (val) => {
    setAmLiters(val);
    const am = parseFloat(val) || 0;
    const pm = parseFloat(pmLiters) || 0;
    const tot = am + pm;
    setTotalLiters(tot > 0 ? String(Number(tot.toFixed(1))) : '');
    
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
      alert('Por favor ingresa los litros producidos en la mañana (AM), tarde (PM) o el total del día.');
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
      id: existingRecordId || initialData?.id || undefined,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🥛 Registro de Producción del Día"
      zIndex={zIndex}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Banner de Estado de Carga Automática */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
          existingRecordId 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {existingRecordId ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Sparkles className="w-4 h-4 text-blue-500" />}
            <span>
              {existingRecordId 
                ? `Cargado: Ya existe producción registrada para este día (Modo edición)`
                : `Nuevo Registro para el ${formatDate(date)}`}
            </span>
          </div>
        </div>

        {/* 1. Selector de Fecha y Vacas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Fecha del Ordeño *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Vacas Ordeñadas</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ej. 18"
                value={cowsMilked}
                onChange={(e) => setCowsMilked(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                vacas
              </span>
            </div>
          </div>
        </div>

        {/* 2. Litros Producidos: AM, PM y Total */}
        <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Milk className="w-4 h-4" />
              <span>Litros de Leche Producidos</span>
            </span>
            {avgPerCow > 0 && (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {formatNumber(avgPerCow, 1)} L/vaca
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* AM */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 block">🌅 Mañana (AM)</span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={amLiters}
                  onChange={(e) => handleAmChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-black text-xl text-center outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addLiters(setAmLiters, amLiters, 5)}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black transition cursor-pointer"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => addLiters(setAmLiters, amLiters, 10)}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black transition cursor-pointer"
                >
                  +10
                </button>
              </div>
            </div>

            {/* PM */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-400 block">🌇 Tarde (PM)</span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={pmLiters}
                  onChange={(e) => handlePmChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-black text-xl text-center outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addLiters(setPmLiters, pmLiters, 5)}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-blue-500 hover:text-slate-950 text-[10px] font-black transition cursor-pointer"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => addLiters(setPmLiters, pmLiters, 10)}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-blue-500 hover:text-slate-950 text-[10px] font-black transition cursor-pointer"
                >
                  +10
                </button>
              </div>
            </div>

            {/* TOTAL */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-950 border border-emerald-500/40 flex flex-col justify-between">
              <span className="text-[11px] font-black text-emerald-400 block uppercase">🥛 Total Día</span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={totalLiters}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500 text-emerald-400 font-black text-2xl text-center outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 block text-center font-medium">
                Auto-suma AM + PM
              </span>
            </div>
          </div>
        </div>

        {/* 3. Distribución / Opciones Avanzadas (Colapsable para no complicar) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-500" />
              <span>Destino de Leche (Venta: {formatNumber(currentSales, 1)} L)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-[11px] font-normal">{showAdvanced ? 'Ocultar' : 'Terneros / Queso / Descarte'}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAdvanced && (
            <div className="p-4 bg-white dark:bg-slate-900 space-y-3 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    🧊 Venta / Tanque
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={salesLiters}
                    onChange={(e) => setSalesLiters(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">
                    🍼 Terneros
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={calvesLiters}
                    onChange={(e) => {
                      setCalvesLiters(e.target.value);
                      handleDeductionChange(e.target.value, undefined, undefined);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                    🧀 Queso / Finca
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={farmLiters}
                    onChange={(e) => {
                      setFarmLiters(e.target.value);
                      handleDeductionChange(undefined, e.target.value, undefined);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                    ⚠️ Descarte
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={rejectedLiters}
                    onChange={(e) => {
                      setRejectedLiters(e.target.value);
                      handleDeductionChange(undefined, undefined, e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Notas / Observación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Lluvia, pasto nuevo, cambio de ordeñador..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Botones de Acción Destacados */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          {existingRecordId && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Deseas eliminar el registro de producción del día ${formatDate(date)}?`)) {
                  onDelete(existingRecordId);
                  onClose();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer active:scale-95"
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
