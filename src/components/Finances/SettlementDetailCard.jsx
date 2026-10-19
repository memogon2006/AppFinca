import React from 'react';
import { 
  DollarSign, 
  Users, 
  Building2, 
  TrendingUp, 
  Scale, 
  Calendar, 
  Wallet, 
  CheckCircle2 
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateFinancials, calculateSaleCashFlow } from '../../services/calculations';
import { getFarmMeatPrice } from '../../services/farmPriceService';

export function SettlementDetailCard({
  title = "Detalle de Liquidación de Venta",
  badge = null,
  isCompany = true,
  exitPrice = 0,
  exitWeight = 0,
  pricePerKg = 0,
  buyer = "N/A",
  date = null,
  cashInflow = 0,
  userRoleLabel = "🐮 Dueño / Inversionista",
  userRole = "owner",
  netProfit = 0,
  capitalReturn = 0,
  farmShare = 0,
  partnerProfitShare = 0,
  partnerTotalReturn = 0,
  ownerMonthlyRoi = 0,
  ownerMonthlyProfit = 0,
  farmMonthlyRoi = 0,
  farmMonthlyProfit = 0,
  directMonthlyRoi = 0,
  directMonthlyProfit = 0,
  directRoi = 0,
  totalInvested = 0,
  tagNumber = null
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 shadow-sm ${
      isCompany 
        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700' 
        : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40'
    }`}>
      {/* Header con título y Badge */}
      <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
        <h5 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{title} {tagNumber ? `• #${tagNumber}` : ''}</span>
        </h5>
        {isCompany ? (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-200 dark:bg-teal-900 text-teal-950 dark:text-teal-100 font-black text-[11px] border border-teal-400 dark:border-teal-600 flex items-center gap-1">
            <Users className="w-3 h-3 text-teal-800 dark:text-teal-200" />
            <span>{badge || '🤝 En Compañía (50/50)'}</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-950 dark:text-blue-100 font-black text-[11px] border border-blue-400 dark:border-blue-700 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-blue-700 dark:text-blue-300" />
            <span>{badge || '💰 Venta Directa (100%)'}</span>
          </span>
        )}
      </div>

      {/* Fila de 4 Métricas de Venta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
        <div>
          <span className="text-slate-600 dark:text-slate-300 font-black">Precio Total Venta:</span>
          <p className="font-black text-emerald-700 dark:text-emerald-300 text-sm tabular-nums">
            {formatCurrency(exitPrice)}
          </p>
        </div>
        <div>
          <span className="text-slate-600 dark:text-slate-300 font-black">Peso Salida:</span>
          <p className="font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {exitWeight > 0 ? `${formatNumber(exitWeight, 1)} kg` : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-slate-600 dark:text-slate-300 font-black">Precio / kg Vendido:</span>
          <p className="font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {pricePerKg > 0 ? `${formatCurrency(pricePerKg)} / kg` : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-slate-600 dark:text-slate-300 font-black">Comprador / Fecha:</span>
          <p className="font-black text-slate-900 dark:text-slate-100 truncate">
            {buyer || 'N/A'} {date ? `• ${formatDate(date)}` : ''}
          </p>
        </div>
      </div>

      {/* Banner Principal de Dinero a Caja y Utilidad */}
      <div className={`p-3 rounded-xl border flex items-center justify-between ${
        userRole === 'farm'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200'
      }`}>
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider block opacity-75">
            💰 Dinero ingresado a tu caja ({userRoleLabel}):
          </span>
          <p className="text-base sm:text-lg font-black tabular-nums">
            +{formatCurrency(cashInflow)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-black tracking-wider block opacity-75">Utilidad Neta:</span>
          <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatCurrency(netProfit)}
          </span>
        </div>
      </div>

      {/* Grid de Tarjetas de Reparto de Capital y Ganancia */}
      {isCompany ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">Devolución Capital (Dueño):</span>
              <p className="font-black text-slate-950 dark:text-white mt-0.5 tabular-nums">{formatCurrency(capitalReturn)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">🏢 Ganancia Finca (50%):</span>
              <p className="font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">+{formatCurrency(farmShare)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">🐮 Ganancia Dueño (50%):</span>
              <p className="font-black text-blue-700 dark:text-blue-400 mt-0.5 tabular-nums">+{formatCurrency(partnerProfitShare)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">👤 Pago Total al Dueño:</span>
              <p className="font-black text-teal-800 dark:text-teal-300 mt-0.5 tabular-nums">{formatCurrency(partnerTotalReturn)}</p>
            </div>
          </div>

          {/* Fila Inferior: Rentabilidad Mensual de Ambas Partes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800">
              <span className="text-[10px] font-black text-blue-800 dark:text-blue-300 block">📈 Rentabilidad Mensual Dueño:</span>
              <p className="font-black text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                {formatNumber(ownerMonthlyRoi, 2)}% / mes (+{formatCurrency(ownerMonthlyProfit)}/m)
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 block">🏢 Ganancia Mensual Pastoreo Finca:</span>
              <p className="font-black text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
                +{formatCurrency(farmMonthlyProfit)} / mes ({formatNumber(farmMonthlyRoi, 2)}%/m)
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">Costo / Inversión Inicial:</span>
              <p className="font-black text-slate-950 dark:text-white mt-0.5 tabular-nums">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">Capital Recuperado:</span>
              <p className="font-black text-indigo-700 dark:text-indigo-400 mt-0.5 tabular-nums">{formatCurrency(capitalReturn)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">Utilidad Neta Real:</span>
              <p className="font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">+{formatCurrency(netProfit)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-black">Total Cobrado en Venta:</span>
              <p className="font-black text-blue-800 dark:text-blue-300 mt-0.5 tabular-nums">{formatCurrency(exitPrice)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 block">📈 Rentabilidad Mensual Capital:</span>
              <p className="font-black text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
                {formatNumber(directMonthlyRoi, 2)}% / mes (+{formatCurrency(directMonthlyProfit)}/m)
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800">
              <span className="text-[10px] font-black text-blue-800 dark:text-blue-300 block">📊 Rentabilidad Total (ROI):</span>
              <p className="font-black text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                {formatNumber(directRoi, 1)}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Helper para extraer todas las propiedades de SettlementDetailCard a partir de un animal
 */
export function getSettlementCardPropsFromAnimal(animal, currentUser = null) {
  if (!animal) return null;
  const flow = calculateSaleCashFlow(animal, currentUser);
  const fin = calculateFinancials(animal, 0, getFarmMeatPrice(animal.owner));
  const isComp = animal.exitType === 'En Compañía' || !!animal.partnershipDetails;

  const exitPrice = parseFloat(animal.exitPrice) || 0;
  const exitWeight = parseFloat(animal.exitWeight) || 0;
  const pricePerKg = exitWeight > 0 ? (exitPrice / exitWeight) : (fin.pricePerKgSold || 0);
  const buyer = animal.saleBuyer || animal.buyer || 'Venta Directa';
  const date = animal.exitDate || animal.saleDate;
  const entryPrice = parseFloat(animal.entryPrice || animal.purchasePrice) || 0;

  if (isComp) {
    const part = animal.partnershipDetails || {
      entryPrice,
      exitPrice,
      profit: Math.max(0, exitPrice - entryPrice),
      farmShare: Math.max(0, exitPrice - entryPrice) * 0.5,
      partnerProfitShare: Math.max(0, exitPrice - entryPrice) * 0.5,
      partnerTotalReturn: entryPrice + (Math.max(0, exitPrice - entryPrice) * 0.5),
    };

    return {
      title: "Detalle de Liquidación de Venta",
      badge: "🤝 En Compañía (50/50)",
      isCompany: true,
      exitPrice,
      exitWeight,
      pricePerKg,
      buyer,
      date,
      cashInflow: flow.cashInflow,
      userRoleLabel: flow.userRole === 'farm' ? '🏢 Finca / Tenedor' : '🐮 Dueño / Inversionista',
      userRole: flow.userRole,
      netProfit: flow.netProfit,
      capitalReturn: part.entryPrice,
      farmShare: part.farmShare,
      partnerProfitShare: part.partnerProfitShare !== undefined ? part.partnerProfitShare : part.farmShare,
      partnerTotalReturn: part.partnerTotalReturn,
      ownerMonthlyRoi: flow.ownerMonthlyRoi,
      ownerMonthlyProfit: flow.ownerMonthlyProfit,
      farmMonthlyRoi: flow.farmMonthlyRoi,
      farmMonthlyProfit: flow.farmMonthlyProfit,
      totalInvested: fin.totalInvested,
      tagNumber: animal.tagNumber
    };
  } else {
    return {
      title: "Detalle de Liquidación de Venta",
      badge: "💰 Venta Directa (100%)",
      isCompany: false,
      exitPrice,
      exitWeight,
      pricePerKg,
      buyer,
      date,
      cashInflow: exitPrice,
      userRoleLabel: "💰 Venta Directa (100%)",
      userRole: "direct",
      netProfit: fin.netProfit,
      capitalReturn: fin.entryPrice,
      farmShare: 0,
      partnerProfitShare: fin.netProfit,
      partnerTotalReturn: exitPrice,
      directMonthlyRoi: fin.monthlyRoi,
      directMonthlyProfit: fin.monthlyProfit,
      directRoi: fin.roi,
      totalInvested: fin.totalInvested,
      tagNumber: animal.tagNumber
    };
  }
}
