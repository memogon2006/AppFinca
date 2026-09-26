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
  Receipt,
  Percent,
  RefreshCw,
  HelpCircle,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculatePeriodMilkSummary, getMilkPeriodRange } from '../../services/calculations';
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
  const [pricePerLiter, setPricePerLiter] = useState(() => String(defaultPricePerLiter || 2100));
  const [bonuses, setBonuses] = useState('0');
  
  // Deducciones Detalladas:
  // 1. Transporte / Flete
  const [fleteMode, setFleteMode] = useState('per_liter'); // 'per_liter' ($/L) | 'total' ($)
  const [fletePerLiter, setFletePerLiter] = useState('');
  const [fleteAmount, setFleteAmount] = useState('');

  // 2. Fondo Ganadero / Fomento (FNG / Fedegán)
  const [fondoMode, setFondoMode] = useState('percent'); // 'percent' (%) | 'total' ($)
  const [fondoPercent, setFondoPercent] = useState('');
  const [fondoAmount, setFondoAmount] = useState('');

  // 3. Otras Retenciones / Deducciones ($)
  const [otherDeductions, setOtherDeductions] = useState('0');

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
        
        // Cargar deducciones desglosadas si existen
        if (initialData.deductionsBreakdown) {
          const brk = initialData.deductionsBreakdown;
          setFleteMode(brk.fleteMode || 'per_liter');
          setFletePerLiter(brk.fletePerLiter ? String(brk.fletePerLiter) : '');
          setFleteAmount(brk.fleteAmount ? String(brk.fleteAmount) : '');
          setFondoMode(brk.fondoMode || 'percent');
          setFondoPercent(brk.fondoPercent ? String(brk.fondoPercent) : '');
          setFondoAmount(brk.fondoAmount ? String(brk.fondoAmount) : '');
          setOtherDeductions(brk.otherDeductions !== undefined ? String(brk.otherDeductions) : '0');
        } else {
          setFleteMode('per_liter');
          setFletePerLiter('');
          setFleteAmount('');
          setFondoMode('percent');
          setFondoPercent('');
          setFondoAmount('');
          setOtherDeductions(initialData.deductions !== undefined ? String(initialData.deductions) : '0');
        }

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
        setFleteMode('per_liter');
        setFletePerLiter('');
        setFleteAmount('');
        setFondoMode('percent');
        setFondoPercent('');
        setFondoAmount('');
        setOtherDeductions('0');
        setBuyer('');
        setPaymentStatus('Pagada');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setRegisterIncome(true);
        setNotes('');
      }
    }
  }, [isOpen, initialData, currentPeriodRange, dailyMilkLogs, milkRecords, defaultPricePerLiter]);

  // Al cambiar período mediante botones de acceso rápido
  const handlePeriodTypeClick = (type) => {
    setPeriodType(type);
    if (type === 'otro') return;

    const now = new Date();
    let range;
    if (type === 'quincenal') {
      const todayDay = now.getDate();
      range = getMilkPeriodRange(todayDay <= 15 ? 'first_fortnight' : 'second_fortnight', now.getFullYear(), now.getMonth());
    } else if (type === 'mensual') {
      range = getMilkPeriodRange('full_month', now.getFullYear(), now.getMonth());
    } else if (type === 'semanal') {
      range = getMilkPeriodRange('current_week');
    }

    if (range) {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
      const summary = calculatePeriodMilkSummary(dailyMilkLogs, milkRecords, range.startDate, range.endDate, 0);
      const lit = summary.totalSalesLiters > 0 ? summary.totalSalesLiters : summary.totalLiters;
      setTotalLiters(lit > 0 ? String(lit) : '');
    }
  };

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

  // Suma detectada del período activo
  const detectedSummary = calculatePeriodMilkSummary(dailyMilkLogs, milkRecords, startDate, endDate, 0);
  const detectedLiters = detectedSummary.totalSalesLiters > 0 ? detectedSummary.totalSalesLiters : detectedSummary.totalLiters;

  // Cálculos financieros en vivo
  const litersNum = parseFloat(totalLiters) || 0;
  const priceNum = parseFloat(pricePerLiter) || 0;
  const baseAmount = litersNum * priceNum;
  const bonusesNum = parseFloat(bonuses) || 0;

  // 1. Flete calculado
  const fleteVal = fleteMode === 'per_liter' 
    ? (parseFloat(fletePerLiter) || 0) * litersNum 
    : (parseFloat(fleteAmount) || 0);

  // 2. Fondo Ganadero calculado
  const fondoVal = fondoMode === 'percent'
    ? (baseAmount * (parseFloat(fondoPercent) || 0)) / 100
    : (parseFloat(fondoAmount) || 0);

  // 3. Otras deducciones
  const otherDedVal = parseFloat(otherDeductions) || 0;

  // Total deducciones
  const totalDeductions = fleteVal + fondoVal + otherDedVal;

  // Total Neto
  const totalValue = Math.max(0, baseAmount + bonusesNum - totalDeductions);

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
      deductions: totalDeductions,
      deductionsBreakdown: {
        fleteMode,
        fletePerLiter: parseFloat(fletePerLiter) || 0,
        fleteAmount: fleteVal,
        fondoMode,
        fondoPercent: parseFloat(fondoPercent) || 0,
        fondoAmount: fondoVal,
        otherDeductions: otherDedVal,
      },
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Período a Liquidar</span>
            </h4>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'quincenal', label: 'Quincenal' },
                { id: 'mensual', label: 'Mensual' },
                { id: 'semanal', label: 'Semanal' },
                { id: 'otro', label: 'Personalizado' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handlePeriodTypeClick(t.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                    periodType === t.id 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-500'
                  }`}
                >
                  {t.label}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Sección de Volúmenes y Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Milk className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Litros Totales a Liquidar *</span>
              </label>
              {detectedLiters > 0 && parseFloat(totalLiters) !== detectedLiters && (
                <button
                  type="button"
                  onClick={() => setTotalLiters(String(detectedLiters))}
                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Copiar la suma acumulada de los días registrados en el período"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cargar {formatNumber(detectedLiters, 1)} L</span>
                </button>
              )}
            </div>

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

            {/* Aviso de Detección de Suma del Período */}
            <div className="mt-1.5">
              {detectedLiters > 0 ? (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Suma del período: <strong>{formatNumber(detectedLiters, 1)} L</strong> ({detectedSummary.daysLogged} días con ordeño)</span>
                  </span>
                  {parseFloat(totalLiters) === detectedLiters && (
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">Exacto</span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  💡 No hay registros de ordeño guardados en estas fechas. Puedes digitar el total libremente.
                </p>
              )}
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
            <p className="text-[11px] text-slate-400 mt-1.5">
              Subtotal Bruto: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(baseAmount)}</strong>
            </p>
          </div>
        </div>

        {/* Sección de Bonificaciones y Deducciones Desglosadas */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Bonificaciones (+) & Deducciones Desglosadas (-)</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Transporte, Fomento, Retenciones
            </span>
          </div>

          {/* 1. Bonificaciones (+) */}
          <div>
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Bonificaciones Totales (+) (Calidad higiénica, frío, volumen)</span>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                + {formatCurrency(bonusesNum)}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={bonuses}
                onChange={(e) => setBonuses(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* 2. Deducción de Transporte / Flete */}
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-rose-500" />
                <span>1. Transporte / Flete Leche (-)</span>
              </label>
              
              {/* Selector de Modo: $/Litro o Valor Fijo */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFleteMode('per_liter')}
                  className={`px-2 py-0.5 rounded font-black transition ${
                    fleteMode === 'per_liter' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Por Litro ($/L)
                </button>
                <button
                  type="button"
                  onClick={() => setFleteMode('total')}
                  className={`px-2 py-0.5 rounded font-black transition ${
                    fleteMode === 'total' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Valor Total ($)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              {fleteMode === 'per_liter' ? (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      placeholder="Ej. 80 (Flete por litro)"
                      value={fletePerLiter}
                      onChange={(e) => setFletePerLiter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      $/Litro
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Ej. 150000"
                      value={fleteAmount}
                      onChange={(e) => setFleteAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="text-right text-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Descuento Flete:</span>
                <strong className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                  - {formatCurrency(fleteVal)}
                </strong>
                {fleteMode === 'per_liter' && fletePerLiter > 0 && litersNum > 0 && (
                  <span className="text-[10px] text-slate-400 block">
                    (${fletePerLiter}/L × {formatNumber(litersNum, 0)} L)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Deducción por Fondo Ganadero / Fomento (FNG / Fedegán) */}
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Fondo Ganadero / Cuota Fomento (FNG) (-)</span>
              </label>
              
              {/* Selector de Modo: Porcentaje % o Valor Fijo $ */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFondoMode('percent')}
                  className={`px-2 py-0.5 rounded font-black transition ${
                    fondoMode === 'percent' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Porcentaje (%)
                </button>
                <button
                  type="button"
                  onClick={() => setFondoMode('total')}
                  className={`px-2 py-0.5 rounded font-black transition ${
                    fondoMode === 'total' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Valor Fijo ($)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              {fondoMode === 'percent' ? (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.05"
                      placeholder="Ej. 0.75 ó 1.0 (%)"
                      value={fondoPercent}
                      onChange={(e) => setFondoPercent(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Ej. 25000"
                      value={fondoAmount}
                      onChange={(e) => setFondoAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="text-right text-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Descuento Fondo:</span>
                <strong className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                  - {formatCurrency(fondoVal)}
                </strong>
                {fondoMode === 'percent' && fondoPercent > 0 && (
                  <span className="text-[10px] text-slate-400 block">
                    ({fondoPercent}% de {formatCurrency(baseAmount)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Otras Deducciones / Retenciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>3. Otras Retenciones / Pruebas / Descuentos (-)</span>
              </span>
              <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                - {formatCurrency(otherDedVal)}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-slate-500 transition"
              />
            </div>
          </div>

          {/* Tarjeta Resumen Total Liquidación */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-md space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  VALOR NETO LIQUIDACIÓN
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Base: {formatCurrency(baseAmount)} {bonusesNum > 0 ? `| +Bonos: ${formatCurrency(bonusesNum)}` : ''} | -Deducciones: {formatCurrency(totalDeductions)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {formatCurrency(totalValue)}
                </p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  {litersNum > 0 ? `Precio Real Neto: ${formatCurrency(totalValue / litersNum)} / L` : ''}
                </span>
              </div>
            </div>

            {/* Resumen de Descuentos Totales */}
            {totalDeductions > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 pt-1 font-bold">
                <span>Total Descuentos Aplicados:</span>
                <span className="font-mono">- {formatCurrency(totalDeductions)}</span>
              </div>
            )}
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
              placeholder="Ej. Colanta, Alpina, Quesera..."
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
            placeholder="Ej. Cheque #4920, consignación Bancolombia, descuento acordado..."
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

