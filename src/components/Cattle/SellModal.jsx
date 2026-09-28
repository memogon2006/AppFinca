import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency, formatNumber, getLocalDateString } from '../../services/calculations';
import { getFarmMeatPrice, setFarmMeatPrice } from '../../services/farmPriceService';
import { DollarSign, TrendingUp, Users, Building2, UserCheck, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

export function SellModal({ isOpen, onClose, animal, onConfirmSale, zIndex = 'z-[60]' }) {
  const { currentUser } = useAuth();

  const entryPrice = parseFloat(animal?.entryPrice) || 0;
  const entryWeight = parseFloat(animal?.entryWeight) || 0;
  const currentWeight = parseFloat(animal?.currentWeight || entryWeight);
  const additionalCosts = parseFloat(animal?.additionalCosts) || 0;

  const farmMeatPrice = getFarmMeatPrice(animal?.owner);

  const [saleData, setSaleData] = useState({
    exitDate: getLocalDateString(),
    exitWeight: currentWeight.toString(),
    exitPrice: '',
    buyer: '',
    exitReason: 'Venta comercial',
  });

  const [calcMode, setCalcMode] = useState('total');
  const [pricePerKg, setPricePerKg] = useState(() => String(farmMeatPrice));

  // Modalidad: 'direct' (Solo yo / 100% utilidad finca) | 'partnership' (En compañía 50/50)
  const [settlementMode, setSettlementMode] = useState('direct');
  const [myRole, setMyRole] = useState('farm'); // 'farm' (Soy la Finca) | 'owner' (Soy el Dueño del Animal)
  const [farmPercent, setFarmPercent] = useState(50);
  const [partnerPercent, setPartnerPercent] = useState(50);

  // Partes de la liquidación en compañía
  const [farmPartyName, setFarmPartyName] = useState(() => currentUser?.farmName || currentUser?.name || 'Finca Principal');
  const [partnerPartyName, setPartnerPartyName] = useState(() => animal?.owner || 'Dueño del Animal');

  useEffect(() => {
    if (isOpen && animal) {
      const pMeat = getFarmMeatPrice(animal?.owner);
      setPricePerKg(String(pMeat));
      const w = parseFloat(animal?.currentWeight || animal?.entryWeight) || 0;
      setSaleData(prev => ({
        ...prev,
        exitWeight: w > 0 ? w.toString() : prev.exitWeight,
      }));
      setPartnerPartyName(animal?.owner || 'Dueño del Animal');
      if (currentUser?.farmName || currentUser?.name) {
        setFarmPartyName(currentUser?.farmName || currentUser?.name);
      }
    }
  }, [isOpen, animal, currentUser]);

  if (!isOpen || !animal) return null;

  const isPartnership = settlementMode === 'partnership';

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

  const handleFarmPercentChange = (val) => {
    const fVal = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setFarmPercent(fVal);
    setPartnerPercent(100 - fVal);
  };

  const handlePartnerPercentChange = (val) => {
    const pVal = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setPartnerPercent(pVal);
    setFarmPercent(100 - pVal);
  };

  const exitPriceNum = parseFloat(saleData.exitPrice) || 0;
  const totalCost = entryPrice + additionalCosts;
  const netProfit = exitPriceNum - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const weightGain = (parseFloat(saleData.exitWeight) || 0) - entryWeight;

  const daysInFarm = Math.max(getDaysDifference(animal.entryDate, saleData.exitDate || getLocalDateString()), 1);
  const monthsInFarm = Math.max(daysInFarm / 30.417, 0.1);

  // Cálculos de Compañía
  const farmProfitShare = netProfit > 0 ? netProfit * (farmPercent / 100) : 0;
  const partnerProfitShare = netProfit > 0 ? netProfit * (partnerPercent / 100) : 0;
  const partnerTotalReturn = entryPrice + partnerProfitShare;

  // Rentabilidades Mensuales del Capital
  const partnerTotalRoi = entryPrice > 0 ? (partnerProfitShare / entryPrice) * 100 : 0;
  const partnerMonthlyRoi = monthsInFarm > 0 ? partnerTotalRoi / monthsInFarm : 0;
  const partnerMonthlyProfit = monthsInFarm > 0 ? partnerProfitShare / monthsInFarm : 0;

  const farmMonthlyProfit = monthsInFarm > 0 ? farmProfitShare / monthsInFarm : 0;
  const farmMonthlyRoi = entryPrice > 0 && monthsInFarm > 0 ? (farmProfitShare / entryPrice) * 100 / monthsInFarm : 0;

  const directMonthlyRoi = monthsInFarm > 0 ? roi / monthsInFarm : 0;
  const directMonthlyProfit = monthsInFarm > 0 ? netProfit / monthsInFarm : 0;

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

    onConfirmSale({
      id: animal.id,
      status: 'Vendido',
      exitDate: saleData.exitDate,
      exitWeight: parseFloat(saleData.exitWeight),
      exitPrice: parseFloat(saleData.exitPrice),
      saleBuyer: saleData.buyer,
      saleReason: isPartnership 
        ? `Venta en Compañía (${farmPercent}% ${farmPartyName} / ${partnerPercent}% ${partnerPartyName})` 
        : (saleData.exitReason || 'Venta Directa'),
      exitType: isPartnership ? 'En Compañía' : 'En Pie',
      currentWeight: parseFloat(saleData.exitWeight),
      partnershipDetails: isPartnership ? {
        isPartnership: true,
        userRole: myRole, // 'farm' | 'owner'
        userCashInflow: myRole === 'farm' ? farmProfitShare : partnerTotalReturn,
        userNetProfit: myRole === 'farm' ? farmProfitShare : partnerProfitShare,
        farmPercent,
        partnerPercent,
        farmShare: farmProfitShare,
        partnerTotalReturn,
        partnerProfitShare,
        entryPrice,
        profit: netProfit,
        owner: animal.owner || partnerPartyName,
        farmPartyName,
        partnerPartyName,
        daysInFarm,
        monthsInFarm: Number(monthsInFarm.toFixed(1)),
        partnerMonthlyRoi: Number(partnerMonthlyRoi.toFixed(2)),
        partnerMonthlyProfit: Number(partnerMonthlyProfit.toFixed(0)),
        farmMonthlyProfit: Number(farmMonthlyProfit.toFixed(0)),
      } : null
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Liquidar / Vender Bovino: ${animal.tagNumber}`}
      subtitle={`Registra el peso final, precio de venta y elige si es venta propia o en compañía`}
      maxWidth="max-w-xl"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Resumen de costos iniciales */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Peso Inicial:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{entryWeight} kg</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Costo Inicial / Compra:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{formatCurrency(entryPrice)}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Dueño Registrado:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 truncate">{animal.owner}</p>
          </div>
        </div>

        {/* 1. ELECCIÓN DE MODALIDAD: ¿VENTA DIRECTA (SOLO YO) O EN COMPAÑÍA (AL PARTIR)? */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            ¿Cómo se liquida esta venta?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Opción Directa / Solo Yo */}
            <div
              onClick={() => setSettlementMode('direct')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                !isPartnership
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70 hover:opacity-100'
              }`}
            >
              <input
                type="radio"
                name="settlementMode"
                checked={!isPartnership}
                onChange={() => setSettlementMode('direct')}
                className="mt-0.5 accent-blue-600 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  💰 Venta Directa (Solo Yo)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  El 100% de la ganancia neta y de la venta es para la finca.
                </span>
              </div>
            </div>

            {/* Opción Compañía / 50-50 */}
            <div
              onClick={() => setSettlementMode('partnership')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                isPartnership
                  ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70 hover:opacity-100'
              }`}
            >
              <input
                type="radio"
                name="settlementMode"
                checked={isPartnership}
                onChange={() => setSettlementMode('partnership')}
                className="mt-0.5 accent-teal-600 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  🤝 En Compañía (50/50)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  El dueño del animal recupera su capital y se divide la ganancia al 50%.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Formulario de salida */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Salida / Venta
              </label>
              <input
                type="date"
                value={saleData.exitDate}
                onChange={(e) => setSaleData(prev => ({ ...prev, exitDate: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs font-bold"
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
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-xs focus:outline-none focus:border-emerald-500"
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
                  placeholder="Ej. 9200"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs focus:outline-none"
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
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-base focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comprador / Frigorífico
              </label>
              <input
                type="text"
                value={saleData.buyer}
                onChange={(e) => setSaleData(prev => ({ ...prev, buyer: e.target.value }))}
                placeholder="Ej. Frigorífico Central"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
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
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* DESGLOSE SI ES EN COMPAÑÍA */}
        {isPartnership && (
          <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Reparto de Ganancia en Compañía
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100">
                {farmPercent}% Finca / {partnerPercent}% Dueño
              </span>
            </div>

            {/* SELECTOR DE ROL: ¿QUIÉN SOY YO EN ESTE NEGOCIO? */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700/80 space-y-2">
              <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                🎯 ¿Cuál es tu rol en esta liquidación?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMyRole('farm')}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    myRole === 'farm'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      🏢 Soy la Finca (Tenedor)
                    </span>
                    {myRole === 'farm' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    Aporte: Pastos y cuidado. <strong>Recibes {farmPercent}% de la ganancia</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMyRole('owner')}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    myRole === 'owner'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30 text-blue-950 dark:text-blue-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      🐮 Soy el Dueño (Inversionista)
                    </span>
                    {myRole === 'owner' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    Aporte: Capital de compra. <strong>Recibes tu capital + {partnerPercent}% de ganancia</strong>.
                  </p>
                </button>
              </div>
            </div>

            {/* SELECCIÓN DE NOMBRES DE PARTES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-600" />
                  <span>🏢 1. ¿Quién es la Finca? (Tenedor):</span>
                </label>
                <input
                  type="text"
                  value={farmPartyName}
                  onChange={(e) => setFarmPartyName(e.target.value)}
                  placeholder="Nombre de la Finca..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  <span>👤 2. ¿Quién es el Dueño? (Inversionista):</span>
                </label>
                <input
                  type="text"
                  value={partnerPartyName}
                  onChange={(e) => setPartnerPartyName(e.target.value)}
                  placeholder="Nombre del Dueño..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 pt-1 border-t border-teal-200/80 dark:border-teal-800/60 text-xs">
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                <strong>{partnerPartyName}</strong> recupera el 100% de su costo de compra ({formatCurrency(entryPrice)}) y la ganancia restante ({formatCurrency(Math.max(0, netProfit))}) se reparte:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-700">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">🏢 {farmPartyName} (%):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={farmPercent}
                      onChange={(e) => handleFarmPercentChange(e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-black text-teal-600"
                    />
                    <span className="font-bold text-teal-600">%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-700">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">👤 {partnerPartyName} (%):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={partnerPercent}
                      onChange={(e) => handlePartnerPercentChange(e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-black text-blue-600"
                    />
                    <span className="font-bold text-blue-600">%</span>
                  </div>
                </div>
              </div>

              {exitPriceNum > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">🏢 PARTE {farmPartyName.toUpperCase()} ({farmPercent}%):</span>
                      <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(farmProfitShare)}</strong>
                      <span className="text-[9px] text-slate-400 block">Ganancia en pastos</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 block">👤 PAGO TOTAL {partnerPartyName.toUpperCase()}:</span>
                      <strong className="text-sm font-black text-blue-600 dark:text-blue-400">{formatCurrency(partnerTotalReturn)}</strong>
                      <span className="text-[9px] text-slate-400 block">Capital ({formatCurrency(entryPrice)}) + {partnerPercent}% ganancia</span>
                    </div>
                  </div>

                  {/* DESTACADO PARA EL USUARIO */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    myRole === 'farm'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                      : 'bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-200'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider block opacity-75">
                        💰 Dinero que entra a tu caja / Finanzas ({myRole === 'farm' ? 'Finca' : 'Dueño del Ganado'}):
                      </span>
                      <p className="text-base font-black">
                        {myRole === 'farm' ? formatCurrency(farmProfitShare) : formatCurrency(partnerTotalReturn)}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-right">
                      {myRole === 'farm'
                        ? `(100% Utilidad de pastoreo)`
                        : `(${formatCurrency(entryPrice)} capital + ${formatCurrency(partnerProfitShare)} ganancia)`}
                    </span>
                  </div>

                  {/* INDICADORES DE RENTABILIDAD MENSUAL DEL CAPITAL */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase text-teal-900 dark:text-teal-300">
                      <span>📈 Rentabilidad Mensual del Capital ({formatNumber(monthsInFarm, 1)} meses)</span>
                      <span className="text-[10px] font-bold text-slate-400">{daysInFarm} días en finca</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">🏢 Finca ({farmPartyName}):</span>
                        <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm">{formatCurrency(farmMonthlyProfit)} / mes</p>
                        <span className="text-[9px] text-slate-500">Ganancia mensual pastos</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                        <span className="text-[9px] uppercase font-bold text-blue-800 dark:text-blue-300 block">🐮 Dueño ({partnerPartyName}):</span>
                        <p className="font-black text-blue-700 dark:text-blue-300 text-sm">{formatNumber(partnerMonthlyRoi, 2)}% / mes</p>
                        <span className="text-[9px] text-slate-500">+{formatCurrency(partnerMonthlyProfit)}/mes ({formatNumber(partnerTotalRoi, 1)}% tot)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tarjeta de Liquidación de Utilidad Directa (Solo Yo) */}
        {!isPartnership && exitPriceNum > 0 && (
          <div className={`p-3.5 rounded-2xl border ${netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/40' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/40'} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Liquidación Propia (100% Utilidad Finca)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'}`}>
                ROI Total: {formatNumber(roi, 1)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Ganancia Neta para la Finca:</span>
                <p className={`text-xl font-extrabold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                  📈 Rentabilidad Mensual del Capital: <strong>{formatNumber(directMonthlyRoi, 2)}% / mes</strong> ({formatCurrency(directMonthlyProfit)}/mes)
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 dark:text-slate-300">
                <p>Kilos Ganados: <strong className="text-slate-900 dark:text-white">+{formatNumber(weightGain, 1)} kg</strong></p>
                <p className="text-[11px] text-slate-400">Permanencia: {formatNumber(monthsInFarm, 1)} meses ({daysInFarm} días)</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            {isPartnership ? 'Confirmar Venta en Compañía (50/50)' : 'Confirmar Venta Directa (Solo Yo)'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
