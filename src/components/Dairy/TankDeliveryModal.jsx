import React, { useState, useEffect } from 'react';
import { Milk, X, CheckCircle2, DollarSign, Truck, AlertTriangle, Sparkles, Building2 } from 'lucide-react';
import { triggerFeedback } from '../../services/soundService';
import { formatCurrency } from '../../services/calculations';

export function TankDeliveryModal({
  isOpen,
  onClose,
  onSaveDelivery,
  editingDelivery = null,
  suggestedLiters = 0,
  defaultDate = new Date().toISOString().split('T')[0]
}) {
  if (!isOpen) return null;

  const [date, setDate] = useState(defaultDate);
  const [totalLiters, setTotalLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('2100'); // Precio base orientativo común
  const [buyer, setBuyer] = useState('');
  const [milkDestination, setMilkDestination] = useState('Planta / Industria');
  const [rejectedLiters, setRejectedLiters] = useState('0');
  const [temperature, setTemperature] = useState('4');
  const [paymentStatus, setPaymentStatus] = useState('Pendiente'); // 'Pagado', 'Pendiente'
  const [notes, setNotes] = useState('');
  const [syncToAccounting, setSyncToAccounting] = useState(true);

  useEffect(() => {
    if (editingDelivery) {
      setDate(editingDelivery.date || defaultDate);
      setTotalLiters(String(editingDelivery.totalLiters || ''));
      setPricePerLiter(String(editingDelivery.pricePerLiter || '2100'));
      setBuyer(editingDelivery.buyer || '');
      setMilkDestination(editingDelivery.milkDestination || editingDelivery.destination || 'Planta / Industria');
      setRejectedLiters(String(editingDelivery.rejectedLiters || '0'));
      setTemperature(String(editingDelivery.temperature || '4'));
      setPaymentStatus(editingDelivery.paymentStatus || 'Pagado');
      setNotes(editingDelivery.notes || '');
      setSyncToAccounting(false);
    } else {
      setDate(defaultDate);
      setTotalLiters(suggestedLiters > 0 ? String(suggestedLiters) : '');
      setPricePerLiter('2100');
      setBuyer('');
      setMilkDestination('Planta / Industria');
      setRejectedLiters('0');
      setTemperature('4');
      setPaymentStatus('Pendiente');
      setNotes('');
      setSyncToAccounting(true);
    }
  }, [editingDelivery, isOpen, suggestedLiters]);

  const numLiters = parseFloat(totalLiters) || 0;
  const numPrice = parseFloat(pricePerLiter) || 0;
  const calculatedTotal = numLiters * numPrice;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numLiters <= 0) {
      alert('Por favor ingresa una cantidad válida de litros entregados.');
      return;
    }

    const deliveryData = {
      ...(editingDelivery ? { id: editingDelivery.id } : {}),
      date,
      totalLiters: numLiters,
      pricePerLiter: numPrice,
      totalValue: calculatedTotal,
      buyer: buyer.trim() || 'Acopio Lechero',
      milkDestination,
      rejectedLiters: parseFloat(rejectedLiters) || 0,
      temperature: parseFloat(temperature) || 4,
      paymentStatus,
      notes: notes.trim(),
      syncToAccounting,
    };

    onSaveDelivery(deliveryData);
    triggerFeedback('single');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xl shadow-md">
              🧊
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {editingDelivery ? 'Editar Despacho de Leche' : 'Registrar Entrega / Tanque Frío'}
              </h3>
              <p className="text-xs text-slate-400">
                Liquidación económica de litros despachados a planta o venta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Fecha y Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Fecha del Despacho:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Destino de la Leche:
              </label>
              <select
                value={milkDestination}
                onChange={(e) => setMilkDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-cyan-500"
              >
                <option value="Planta / Industria">🚚 Planta / Industria Láctea</option>
                <option value="Quesería">🧀 Quesería Artesanal / Local</option>
                <option value="Venta Directa">🥛 Venta Directa al Consumidor</option>
                <option value="Consumo Finca">🍼 Consumo Finca / Terneros</option>
              </select>
            </div>
          </div>

          {/* Litros y Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Litros Entregados / Despachados:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="0.0"
                  value={totalLiters}
                  onChange={(e) => setTotalLiters(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-base font-black text-white font-mono outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-3 text-xs font-black text-slate-500">
                  LITROS
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Precio por Litro ($):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  min="0"
                  required
                  placeholder="2100"
                  value={pricePerLiter}
                  onChange={(e) => setPricePerLiter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-base font-black text-emerald-400 font-mono outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-3 text-xs font-black text-slate-500">
                  $/L
                </span>
              </div>
            </div>
          </div>

          {/* Resumen de Liquidación */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-950 to-emerald-950/40 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total a Liquidar:
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-cyan-300">
                {numLiters.toFixed(1)} L × ${numPrice.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Comprador & Estado de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Comprador / Empresa Acopiadora:
              </label>
              <input
                type="text"
                placeholder="Ej. Colanta, Alquería, Quesera..."
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Estado del Pago:
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-cyan-500"
              >
                <option value="Pendiente">⏳ Pendiente de Pago / Quincena</option>
                <option value="Pagado">✅ Pagado / Consignado</option>
              </select>
            </div>
          </div>

          {/* Litros Rechazados & Temperatura Tanque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Litros Rechazados / Descarte (L):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={rejectedLiters}
                onChange={(e) => setRejectedLiters(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Temperatura del Tanque (°C):
              </label>
              <input
                type="number"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="4.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Notas / Remisión */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observaciones / # Guía de Remisión:
            </label>
            <input
              type="text"
              placeholder="Ej. Remisión #84920, tanque lavado y desinfectado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          {/* Checkbox de Enlace a Contabilidad */}
          {!editingDelivery && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToAccounting}
                onChange={(e) => setSyncToAccounting(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-bold text-emerald-200">
                💰 Registrar automáticamente como Ingreso por Venta de Leche en Contabilidad
              </span>
            </label>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Despacho</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
