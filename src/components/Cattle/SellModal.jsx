import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { DollarSign, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

export function SellModal({ isOpen, onClose, animal, onConfirmSale }) {
  if (!animal) return null;

  const entryPrice = parseFloat(animal.entryPrice) || 0;
  const entryWeight = parseFloat(animal.entryWeight) || 0;
  const currentWeight = parseFloat(animal.currentWeight || entryWeight);
  const additionalCosts = parseFloat(animal.additionalCosts) || 0;

  const [saleData, setSaleData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    exitWeight: currentWeight.toString(),
    exitPrice: '',
    buyer: '',
    exitReason: 'Venta comercial',
  });

  const [calcMode, setCalcMode] = useState('total');
  const [pricePerKg, setPricePerKg] = useState('9000');

  const handlePricePerKgChange = (val) => {
    setPricePerKg(val);
    const weight = parseFloat(saleData.exitWeight) || 0;
    const total = weight * (parseFloat(val) || 0);
    setSaleData(prev => ({ ...prev, exitPrice: total ? total.toString() : '' }));
  };

  const handleTotalChange = (val) => {
    setSaleData(prev => ({ ...prev, exitPrice: val }));
    const weight = parseFloat(saleData.exitWeight) || 1;
    if (weight > 0 && val) {
      setPricePerKg(Math.round(parseFloat(val) / weight).toString());
    }
  };

  const exitPriceNum = parseFloat(saleData.exitPrice) || 0;
  const totalCost = entryPrice + additionalCosts;
  const netProfit = exitPriceNum - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const weightGain = (parseFloat(saleData.exitWeight) || 0) - entryWeight;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!saleData.exitPrice || Number(saleData.exitPrice) <= 0) {
      alert('Por favor ingresa un valor de venta válido');
      return;
    }
    if (!saleData.exitWeight || Number(saleData.exitWeight) <= 0) {
      alert('Por favor ingresa el peso de salida en kg');
      return;
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {}

    onConfirmSale(animal.id, {
      status: 'Vendido',
      exitDate: saleData.exitDate,
      exitWeight: parseFloat(saleData.exitWeight),
      exitPrice: parseFloat(saleData.exitPrice),
      buyer: saleData.buyer,
      exitReason: saleData.exitReason,
      currentWeight: parseFloat(saleData.exitWeight),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Liquidar / Vender Bovino: ${animal.tagNumber}`}
      subtitle={`Registra el peso de báscula final, precio de venta y calcula la utilidad neta`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Resumen de costos iniciales */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Peso Inicial:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{entryWeight} kg</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Costo Inicial:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{formatCurrency(entryPrice)}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Gastos Directos:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{formatCurrency(additionalCosts)}</p>
          </div>
        </div>

        {/* Formulario de salida */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Salida / Venta
              </label>
              <input
                type="date"
                value={saleData.exitDate}
                onChange={(e) => setSaleData(prev => ({ ...prev, exitDate: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Final en Báscula (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={saleData.exitWeight}
                onChange={(e) => {
                  setSaleData(prev => ({ ...prev, exitWeight: e.target.value }));
                  if (calcMode === 'perKg') {
                    const total = (parseFloat(e.target.value) || 0) * (parseFloat(pricePerKg) || 0);
                    setSaleData(prev => ({ ...prev, exitPrice: total ? total.toString() : '' }));
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setCalcMode('total')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${calcMode === 'total' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Precio Total de Venta
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('perKg')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${calcMode === 'perKg' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Precio por Kilo en Pie ($/kg)
            </button>
          </div>

          {calcMode === 'perKg' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Precio por Kilo ($/kg)
                </label>
                <input
                  type="number"
                  value={pricePerKg}
                  onChange={(e) => handlePricePerKgChange(e.target.value)}
                  placeholder="Ej. 8800"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Calculado ($)
                </label>
                <input
                  type="number"
                  value={saleData.exitPrice}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total de Venta ($)
              </label>
              <input
                type="number"
                value={saleData.exitPrice}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="Ej. 4800000"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comprador / Frigorífico
              </label>
              <input
                type="text"
                value={saleData.buyer}
                onChange={(e) => setSaleData(prev => ({ ...prev, buyer: e.target.value }))}
                placeholder="Ej. Frigorífico Central"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo de Salida
              </label>
              <input
                type="text"
                value={saleData.exitReason}
                onChange={(e) => setSaleData(prev => ({ ...prev, exitReason: e.target.value }))}
                placeholder="Venta ceba, cría, etc."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Tarjeta de Liquidación de Utilidad */}
        {exitPriceNum > 0 && (
          <div className={`p-4 rounded-2xl border ${netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/40' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/40'} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Resultado Financiero & Utilidad
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'}`}>
                Rentabilidad: {formatNumber(roi, 1)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Utilidad Neta:</span>
                <p className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 dark:text-slate-300">
                <p>Kilos Ganados: <strong className="text-slate-900 dark:text-white">{formatNumber(weightGain, 1)} kg</strong></p>
                {weightGain > 0 && (
                  <p>Utilidad/kg ganado: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(netProfit / weightGain)}/kg</strong></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition"
          >
            <DollarSign className="w-4 h-4" />
            <span>Confirmar Venta y Liquidar</span>
          </button>
        </div>

      </form>
    </Modal>
  );
}
