import React, { useState, useMemo } from 'react';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  Scale, 
  Users, 
  Tag, 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  MessageCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight, 
  Info,
  Layers,
  ChevronRight,
  Eye,
  Percent,
  BadgeCheck,
  Building2,
  Wallet
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateFinancials, getLocalDateString } from '../../services/calculations';
import { getFarmMeatPrice } from '../../services/farmPriceService';
import { SettlementDetailCard, getSettlementCardPropsFromAnimal } from './SettlementDetailCard';
import * as XLSX from 'xlsx-js-style';
import { useScrollLock } from '../../hooks/useScrollLock';

export function OwnerFinancialDetailModal({
  isOpen,
  onClose,
  ownerName,
  cattle = [],
  weighings = [],
  onSelectAnimal,
  zIndex = 'z-[60]'
}) {
  useScrollLock(isOpen);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'sold' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [expandedAnimalId, setExpandedAnimalId] = useState(null);

  // Animales de este dueño
  const ownerCattle = useMemo(() => {
    return cattle.filter(c => (c.owner || 'Hacienda Principal') === ownerName);
  }, [cattle, ownerName]);

  const brandName = useMemo(() => {
    const found = ownerCattle.find(c => c.ironBrand);
    return found?.ironBrand || 'N/A';
  }, [ownerCattle]);

  const activeOwnerCattle = useMemo(() => {
    return ownerCattle.filter(c => c.status === 'Activo');
  }, [ownerCattle]);

  const soldOwnerCattle = useMemo(() => {
    return ownerCattle.filter(c => c.status === 'Vendido');
  }, [ownerCattle]);

  const deadOwnerCattle = useMemo(() => {
    return ownerCattle.filter(c => c.status === 'Muerto');
  }, [ownerCattle]);

  // Lista de lotes disponibles para este dueño
  const availableBatches = useMemo(() => {
    const set = new Set(ownerCattle.map(c => c.entryBatch || c.paddock).filter(Boolean));
    return Array.from(set);
  }, [ownerCattle]);

  // --- CÁLCULOS FINANCIEROS CLAVE ---

  // 1. Ganado Activo
  const totalActiveCount = activeOwnerCattle.length;
  const totalActivePurchaseValue = activeOwnerCattle.reduce((sum, c) => sum + (parseFloat(c.entryPrice) || 0), 0);
  const averageActivePurchaseValue = totalActiveCount > 0 ? totalActivePurchaseValue / totalActiveCount : 0;
  const totalActiveWeight = activeOwnerCattle.reduce((sum, c) => sum + (parseFloat(c.currentWeight || c.entryWeight) || 0), 0);
  const averageActiveWeight = totalActiveCount > 0 ? totalActiveWeight / totalActiveCount : 0;

  // 2. Ganado Vendido
  const totalSoldCount = soldOwnerCattle.length;
  const totalSoldRevenue = soldOwnerCattle.reduce((sum, c) => sum + (parseFloat(c.exitPrice) || 0), 0);
  const averageSoldRevenue = totalSoldCount > 0 ? totalSoldRevenue / totalSoldCount : 0;
  
  const ownerMeatPrice = getFarmMeatPrice(ownerName);

  const totalSoldCost = soldOwnerCattle.reduce((sum, c) => {
    const fin = calculateFinancials(c, 0, ownerMeatPrice);
    return sum + fin.totalInvested;
  }, 0);
  const averageSoldCost = totalSoldCount > 0 ? totalSoldCost / totalSoldCount : 0;

  const totalSoldNetProfit = soldOwnerCattle.reduce((sum, c) => {
    const fin = calculateFinancials(c, 0, ownerMeatPrice);
    return sum + fin.netProfit;
  }, 0);
  const soldRoi = totalSoldCost > 0 ? (totalSoldNetProfit / totalSoldCost) * 100 : 0;

  const totalSoldMonthlyProfit = soldOwnerCattle.reduce((sum, c) => {
    const fin = calculateFinancials(c, 0, ownerMeatPrice);
    return sum + (fin.monthlyProfit || 0);
  }, 0);
  const averageSoldMonthlyRoi = totalSoldCost > 0 ? (totalSoldMonthlyProfit / totalSoldCost) * 100 : 0;

  const totalSoldExitWeight = soldOwnerCattle.reduce((sum, c) => sum + (parseFloat(c.exitWeight) || 0), 0);
  const averageSoldExitWeight = totalSoldCount > 0 ? totalSoldExitWeight / totalSoldCount : 0;
  const averageSoldPricePerKg = totalSoldExitWeight > 0 ? totalSoldRevenue / totalSoldExitWeight : 0;

  // Desglose de ganancia en compañía (Finca vs Dueño)
  const getCompanySplit = (animal) => {
    const isComp = animal.exitType === 'En Compañía' || !!animal.partnershipDetails;
    const exitP = parseFloat(animal.exitPrice) || 0;
    const entryP = parseFloat(animal.entryPrice || animal.purchasePrice) || 0;
    const addCosts = parseFloat(animal.additionalCosts) || 0;
    const totalCost = entryP + addCosts;
    const netProfit = exitP - totalCost;

    if (!isComp) {
      return {
        isCompany: false,
        farmShare: 0,
        partnerProfitShare: netProfit,
        partnerTotalReturn: exitP,
        totalProfit: netProfit,
        farmPercent: 0,
        partnerPercent: 100,
        entryPrice: entryP
      };
    }

    const p = animal.partnershipDetails;
    const farmPercent = parseFloat(p?.farmPercent) || 50;
    const partnerPercent = parseFloat(p?.partnerPercent) || 50;

    const totalProfit = p?.profit !== undefined && !isNaN(parseFloat(p.profit))
      ? parseFloat(p.profit)
      : netProfit;

    const farmShare = p?.farmShare !== undefined && !isNaN(parseFloat(p.farmShare))
      ? parseFloat(p.farmShare)
      : (totalProfit * (farmPercent / 100));

    const partnerProfitShare = p?.partnerProfitShare !== undefined && !isNaN(parseFloat(p.partnerProfitShare))
      ? parseFloat(p.partnerProfitShare)
      : (totalProfit * (partnerPercent / 100));

    const partnerTotalReturn = p?.partnerTotalReturn !== undefined && !isNaN(parseFloat(p.partnerTotalReturn))
      ? parseFloat(p.partnerTotalReturn)
      : (entryP + partnerProfitShare);

    return {
      isCompany: true,
      farmShare,
      partnerProfitShare,
      partnerTotalReturn,
      totalProfit,
      farmPercent,
      partnerPercent,
      entryPrice: entryP
    };
  };

  // Animales vendidos en compañía y métricas consolidadas Finca vs Dueño
  const companySoldCattle = useMemo(() => {
    return soldOwnerCattle.filter(c => c.exitType === 'En Compañía' || !!c.partnershipDetails);
  }, [soldOwnerCattle]);

  const hasCompanySales = companySoldCattle.length > 0;

  const totalFarmProfitShare = useMemo(() => {
    return soldOwnerCattle.reduce((sum, c) => {
      const split = getCompanySplit(c);
      return sum + (split.isCompany ? split.farmShare : 0);
    }, 0);
  }, [soldOwnerCattle]);

  const totalPartnerProfitShare = useMemo(() => {
    return soldOwnerCattle.reduce((sum, c) => {
      const split = getCompanySplit(c);
      return sum + split.partnerProfitShare;
    }, 0);
  }, [soldOwnerCattle]);

  const totalPartnerCapitalReturn = useMemo(() => {
    return soldOwnerCattle.reduce((sum, c) => {
      const split = getCompanySplit(c);
      return sum + (parseFloat(c.entryPrice || c.purchasePrice) || 0);
    }, 0);
  }, [soldOwnerCattle]);

  const totalPartnerCashInflow = useMemo(() => {
    return soldOwnerCattle.reduce((sum, c) => {
      const split = getCompanySplit(c);
      return sum + (split.isCompany ? split.partnerTotalReturn : (parseFloat(c.exitPrice) || 0));
    }, 0);
  }, [soldOwnerCattle]);

  // 3. Totales Generales
  const totalRegisteredCount = ownerCattle.length;
  const totalHistoricalInvestment = totalActivePurchaseValue + totalSoldCost;

  // Filtro de búsqueda y lote para las tablas
  const filterList = (list) => {
    return list.filter(animal => {
      if (batchFilter && (animal.entryBatch || animal.paddock) !== batchFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const tag = (animal.tagNumber || '').toLowerCase();
        const name = (animal.name || '').toLowerCase();
        const color = (animal.color || '').toLowerCase();
        const batch = (animal.entryBatch || animal.paddock || '').toLowerCase();
        const buyer = (animal.saleBuyer || animal.buyer || '').toLowerCase();
        if (!tag.includes(q) && !name.includes(q) && !color.includes(q) && !batch.includes(q) && !buyer.includes(q)) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredActiveList = useMemo(() => filterList(activeOwnerCattle), [activeOwnerCattle, searchTerm, batchFilter]);
  const filteredSoldList = useMemo(() => filterList(soldOwnerCattle), [soldOwnerCattle, searchTerm, batchFilter]);
  const filteredAllList = useMemo(() => filterList(ownerCattle), [ownerCattle, searchTerm, batchFilter]);

  // Exportar a Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Hoja de Ganado Activo
    const activeData = [
      ['REPORTE FINANCIERO - GANADO ACTIVO'],
      [`Propietario / Marca: ${ownerName}`, `Hierro: ${brandName}`, `Fecha: ${formatDate(new Date())}`],
      [],
      ['Chapa/Arete', 'Nombre', 'Lote', 'Sexo', 'Categoría', 'Fecha Entrada', 'Peso Entrada (kg)', 'Peso Actual (kg)', 'Precio Compra ($)', 'Costo/Kg Entrada ($/kg)']
    ];

    activeOwnerCattle.forEach(a => {
      const ePrice = parseFloat(a.entryPrice) || 0;
      const eWeight = parseFloat(a.entryWeight) || 0;
      const cWeight = parseFloat(a.currentWeight || a.entryWeight) || 0;
      const costPerKg = eWeight > 0 ? (ePrice / eWeight) : 0;

      activeData.push([
        a.tagNumber || 'S/N',
        a.name || '-',
        a.entryBatch || a.paddock || '-',
        a.sex || '-',
        a.category || '-',
        formatDate(a.entryDate),
        eWeight,
        cWeight,
        ePrice,
        Math.round(costPerKg)
      ]);
    });

    activeData.push([]);
    activeData.push([
      'TOTALES Y PROMEDIOS',
      '',
      '',
      '',
      '',
      `Total: ${totalActiveCount} animales`,
      '',
      `Promedio: ${formatNumber(averageActiveWeight, 1)} kg`,
      totalActivePurchaseValue,
      Math.round(averageActivePurchaseValue)
    ]);

    const wsActive = XLSX.utils.aoa_to_sheet(activeData);
    XLSX.utils.book_append_sheet(wb, wsActive, 'Ganado Activo');

    // 2. Hoja de Ganado Vendido
    const soldData = [
      ['REPORTE FINANCIERO - GANADO VENDIDO & LIQUIDACIONES (FINCA VS DUEÑO)'],
      [`Propietario / Socio: ${ownerName}`, `Hierro: ${brandName}`, `Fecha: ${formatDate(new Date())}`],
      [],
      [
        'Chapa/Arete',
        'Nombre',
        'Fecha Venta',
        'Comprador',
        'Modalidad',
        'Meses Finca',
        'Peso Salida (kg)',
        'Precio Compra ($)',
        'Precio Venta ($)',
        'Precio/Kg Venta ($/kg)',
        'Utilidad Total ($)',
        'Utilidad Finca (50%) ($)',
        'Utilidad Dueño (50%) ($)',
        'Total Retorno Dueño ($)',
        'ROI Total (%)',
        'Rentabilidad Mensual (%/mes)',
        'Ganancia Mensual ($/mes)'
      ]
    ];

    soldOwnerCattle.forEach(a => {
      const fin = calculateFinancials(a, 0, ownerMeatPrice);
      const split = getCompanySplit(a);
      const exitW = parseFloat(a.exitWeight) || 0;
      const exitP = parseFloat(a.exitPrice) || 0;
      const pricePerKg = exitW > 0 ? (exitP / exitW) : 0;

      soldData.push([
        a.tagNumber || 'S/N',
        a.name || '-',
        formatDate(a.exitDate),
        a.saleBuyer || a.buyer || 'Venta Directa',
        split.isCompany ? 'En Compañía' : (a.exitType || 'En Pie'),
        formatNumber(fin.monthsInFarm, 1),
        exitW,
        fin.totalInvested,
        exitP,
        Math.round(pricePerKg),
        fin.netProfit,
        Math.round(split.isCompany ? split.farmShare : 0),
        Math.round(split.isCompany ? split.partnerProfitShare : fin.netProfit),
        Math.round(split.isCompany ? split.partnerTotalReturn : exitP),
        `${fin.roi}%`,
        `${formatNumber(fin.monthlyRoi, 2)}%`,
        Math.round(fin.monthlyProfit)
      ]);
    });

    soldData.push([]);
    soldData.push([
      'TOTALES Y PROMEDIOS',
      '',
      '',
      '',
      `Total: ${totalSoldCount} vendidos`,
      '',
      `Prom: ${formatNumber(averageSoldExitWeight, 1)} kg`,
      totalSoldCost,
      totalSoldRevenue,
      Math.round(averageSoldPricePerKg),
      totalSoldNetProfit,
      Math.round(totalFarmProfitShare),
      Math.round(totalPartnerProfitShare),
      Math.round(totalPartnerCashInflow),
      `${formatNumber(soldRoi, 1)}%`,
      `${formatNumber(averageSoldMonthlyRoi, 2)}%`,
      Math.round(totalSoldMonthlyProfit)
    ]);

    const wsSold = XLSX.utils.aoa_to_sheet(soldData);
    XLSX.utils.book_append_sheet(wb, wsSold, 'Ganado Vendido');

    // Descargar archivo
    const safeName = ownerName.replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `Balance_Financiero_${safeName}_${getLocalDateString()}.xlsx`);
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    let msg = `📊 *ESTADO DE CUENTA & BALANCE FINANCIERO GANADERO*\n`;
    msg += `👤 *Propietario / Socio:* ${ownerName.toUpperCase()}\n`;
    msg += `🏷️ *Marca de Hierro:* ${brandName}\n`;
    msg += `📅 *Fecha:* ${formatDate(new Date())}\n\n`;

    msg += `🟢 *GANADO ACTIVO EN FINCA:*\n`;
    msg += `• Cabezas activas: ${totalActiveCount} animales\n`;
    msg += `• Valor total de compra activos: *${formatCurrency(totalActivePurchaseValue)}*\n`;
    msg += `• Valor promedio por cabeza activa: *${formatCurrency(averageActivePurchaseValue)}*\n`;
    msg += `• Peso promedio actual: ${formatNumber(averageActiveWeight, 1)} kg\n\n`;

    msg += `💰 *HISTORIAL DE GANADO VENDIDO:*\n`;
    msg += `• Cabezas liquidadas/vendidas: ${totalSoldCount} animales\n`;
    msg += `• Ingresos totales por ventas: *${formatCurrency(totalSoldRevenue)}*\n`;
    msg += `• Costo total de compra (vendidos): *${formatCurrency(totalSoldCost)}*\n`;
    msg += `• Costo promedio por animal vendido: *${formatCurrency(averageSoldCost)}*\n`;
    msg += `• Precio promedio de venta por animal: *${formatCurrency(averageSoldRevenue)}*\n`;
    msg += `• Utilidad Neta Realizada: *${formatCurrency(totalSoldNetProfit)}*\n`;
    msg += `• Rentabilidad Total (ROI): *${formatNumber(soldRoi, 1)}%*\n`;
    msg += `• 📈 *Rentabilidad Mensual del Capital:* *${formatNumber(averageSoldMonthlyRoi, 2)}% / mes* (+${formatCurrency(totalSoldMonthlyProfit)} / mes)\n\n`;

    if (hasCompanySales) {
      msg += `🤝 *LIQUIDACIÓN GANADO EN COMPAÑÍA (REPARTO 50/50):*\n`;
      msg += `• 🏢 *Entró a la Finca (50% Utilidad):* *${formatCurrency(totalFarmProfitShare)}*\n`;
      msg += `• 🐮 *Utilidad Dueño del Ganado (50%):* *${formatCurrency(totalPartnerProfitShare)}*\n`;
      msg += `• 💵 *Capital Reintegrado al Dueño:* *${formatCurrency(totalPartnerCapitalReturn)}*\n`;
      msg += `• 💰 *Total Liquidado al Dueño (Capital + 50%):* *${formatCurrency(totalPartnerCashInflow)}*\n\n`;
    }

    msg += `📋 *RESUMEN TOTAL REGISTRADO:* ${totalRegisteredCount} cabezas\n`;
    msg += `_Generado automáticamente por Inventario Bovino App_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (!isOpen || !ownerName) return null;

  return (
    <div 
      className={`modal-backdrop-root fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 ${zIndex} animate-fade-in overflow-y-auto`}
      style={{ overscrollBehavior: 'contain', overscrollBehaviorY: 'contain' }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        data-modal-container="true"
        style={{ overscrollBehavior: 'contain', overscrollBehaviorY: 'contain' }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Principal */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight">{ownerName}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-black backdrop-blur-sm">
                  Marca: {brandName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                Balance financiero individual, inventario valorizado y liquidaciones de ventas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              title="Compartir por WhatsApp"
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black flex items-center gap-1.5 transition shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleExportExcel}
              title="Descargar Excel"
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel de KPIs Financieros Destacados (Cumpliendo cada métrica solicitada) */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto max-h-[35vh]">
          
          {/* Fila 1: Métricas de Ganado Activo */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Inventario Activo en Finca ({totalActiveCount} cabezas)</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor Total Activos</span>
                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(totalActivePurchaseValue)}
                </p>
                <span className="text-[10px] text-slate-400">Inversión compra en pie</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Promedio Valor Activo</span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(averageActivePurchaseValue)}
                </p>
                <span className="text-[10px] text-slate-400">Costo compra / cabeza</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Peso Total Activo</span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatNumber(totalActiveWeight, 0)} kg
                </p>
                <span className="text-[10px] text-slate-400">Biomasa en potreros</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Peso Promedio Activo</span>
                <p className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 tabular-nums">
                  {formatNumber(averageActiveWeight, 1)} kg
                </p>
                <span className="text-[10px] text-slate-400">Promedio por animal</span>
              </div>
            </div>
          </div>

          {/* Fila 2: Métricas de Ganado Vendido & Rentabilidad */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Ventas, Costos y Liquidaciones ({totalSoldCount} liquidados)</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor Total Vendido</span>
                <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatCurrency(totalSoldRevenue)}
                </p>
                <span className="text-[10px] text-slate-400">Ingresos brutos cobrados</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Prom. Venta / Animal</span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(averageSoldRevenue)}
                </p>
                <span className="text-[10px] text-slate-400">Precio promedio salida</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/30 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Prom. Costo Animal Vendido</span>
                <p className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 tabular-nums">
                  {formatCurrency(averageSoldCost)}
                </p>
                <span className="text-[10px] text-slate-400">Costo compra de vendidos</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Utilidad Neta Realizada</span>
                <p className={`text-base sm:text-lg font-black tabular-nums ${totalSoldNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(totalSoldNetProfit)}
                </p>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between flex-wrap gap-1 mt-0.5">
                  <span>ROI: {formatNumber(soldRoi, 1)}%</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-black text-[9px]">
                    📈 {formatNumber(averageSoldMonthlyRoi, 2)}%/m (+{formatCurrency(totalSoldMonthlyProfit)}/m)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fila 3: Liquidación Ganado en Compañía (Reparto Finca vs Dueño) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Liquidación & Reparto de Utilidades {hasCompanySales ? '(En Compañía 50% Finca / 50% Dueño)' : '(Finca vs Dueño)'}</span>
              </span>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                {hasCompanySales ? `🤝 ${companySoldCattle.length} en compañía` : 'Ventas registradas'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Tarjeta 1: Entró a la Finca */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-400 dark:border-emerald-600 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Entró a la Finca (50% Utilidad)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                    50% Finca
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-1.5">
                  +{formatCurrency(totalFarmProfitShare)}
                </p>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium block mt-0.5">
                  Ganancia neta generada para la finca por pastoreo y cuidado
                </span>
              </div>

              {/* Tarjeta 2: Utilidad Dueño del Ganado */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-400 dark:border-blue-600 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Utilidad Dueño del Ganado (50%)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white shadow-xs">
                    50% Dueño
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums mt-1.5">
                  +{formatCurrency(totalPartnerProfitShare)}
                </p>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium block mt-0.5">
                  Ganancia neta correspondiente al dueño / socio inversionista
                </span>
              </div>

              {/* Tarjeta 3: Total Retorno al Dueño (Capital + 50%) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-400 dark:border-indigo-600 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                    Total Entregado al Dueño
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white shadow-xs">
                    Cap + 50%
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 tabular-nums mt-1.5">
                  {formatCurrency(totalPartnerCashInflow)}
                </p>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium block mt-0.5">
                  Capital ({formatCurrency(totalPartnerCapitalReturn)}) + Utilidad ({formatCurrency(totalPartnerProfitShare)})
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Barra de Filtros y Selector de Pestañas */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🐮 Ganado Activo</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                {totalActiveCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sold')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'sold'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>💰 Vendidos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'sold' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                {totalSoldCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-md dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📋 Todo el Hato</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                {totalRegisteredCount}
              </span>
            </button>
          </div>

          {/* Buscador y Filtro por Lote */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {availableBatches.length > 0 && (
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              >
                <option value="">Todos los lotes</option>
                {availableBatches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar chapa, comprador, lote..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenido de Tablas Detalladas */}
        <div 
          data-modal-scrollable="true"
          style={{ overscrollBehavior: 'contain', overscrollBehaviorY: 'contain' }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >

          {/* TAB 1: GANADO ACTIVO */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mostrando <strong>{filteredActiveList.length}</strong> de {totalActiveCount} animales activos</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  👆 Haz clic en cualquier animal para ver su historial completo
                </span>
              </div>

              {filteredActiveList.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Chapa / Arete</th>
                        <th className="p-3">Lote / Ubicación</th>
                        <th className="p-3">Sexo / Cat.</th>
                        <th className="p-3">Fecha Entrada</th>
                        <th className="p-3 text-right">Peso Entrada</th>
                        <th className="p-3 text-right">Peso Actual</th>
                        <th className="p-3 text-right">Precio Compra</th>
                        <th className="p-3 text-right">Costo/Kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredActiveList.map(animal => {
                        const ePrice = parseFloat(animal.entryPrice) || 0;
                        const eWeight = parseFloat(animal.entryWeight) || 0;
                        const cWeight = parseFloat(animal.currentWeight || animal.entryWeight) || 0;
                        const costKg = eWeight > 0 ? ePrice / eWeight : 0;

                        return (
                          <tr
                            key={animal.id}
                            onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                            className="hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition cursor-pointer"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                  #{animal.tagNumber || 'S/N'}
                                </span>
                                {animal.name && <span className="text-slate-500 text-[11px]">({animal.name})</span>}
                              </div>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">
                              {animal.entryBatch || animal.paddock || 'General'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                animal.sex === 'Hembra' 
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                              }`}>
                                {animal.sex || 'Macho'} {animal.category ? `• ${animal.category}` : ''}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {formatDate(animal.entryDate)}
                            </td>
                            <td className="p-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                              {eWeight > 0 ? `${formatNumber(eWeight, 0)} kg` : '-'}
                            </td>
                            <td className="p-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                              {cWeight > 0 ? `${formatNumber(cWeight, 0)} kg` : '-'}
                            </td>
                            <td className="p-3 text-right tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(ePrice)}
                            </td>
                            <td className="p-3 text-right tabular-nums text-slate-500 text-[11px]">
                              {costKg > 0 ? `${formatCurrency(costKg)}/kg` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100/90 dark:bg-slate-950 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                      <tr>
                        <td className="p-3" colSpan="4">
                          TOTALES ({filteredActiveList.length} ACTIVOS)
                        </td>
                        <td className="p-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          -
                        </td>
                        <td className="p-3 text-right tabular-nums text-teal-600 dark:text-teal-400">
                          Prom: {formatNumber(averageActiveWeight, 1)} kg
                        </td>
                        <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(totalActivePurchaseValue)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-slate-500 text-[11px]">
                          Prom: {formatCurrency(averageActivePurchaseValue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  No se encontraron animales activos con los filtros aplicados.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GANADO VENDIDO */}
          {activeTab === 'sold' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mostrando <strong>{filteredSoldList.length}</strong> de {totalSoldCount} animales vendidos</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                  👆 Toca cualquier fila para ver el desglose completo de la liquidación
                </span>
              </div>

              {/* Ficha de Liquidación Consolidada para todo el lote vendido */}
              {filteredSoldList.length > 0 && (
                <SettlementDetailCard
                  title="Detalle de Liquidación Consolidada"
                  badge={hasCompanySales ? `🤝 En Compañía (${companySoldCattle.length} / ${totalSoldCount} cabezas)` : `💰 Venta Directa (${totalSoldCount} cabezas)`}
                  isCompany={hasCompanySales}
                  exitPrice={totalSoldRevenue}
                  exitWeight={totalSoldExitWeight}
                  pricePerKg={averageSoldPricePerKg}
                  buyer={`${totalSoldCount} cabezas liquidadas • ${ownerName}`}
                  date={soldOwnerCattle[0]?.exitDate}
                  cashInflow={totalPartnerCashInflow}
                  userRoleLabel={hasCompanySales ? "🐮 Dueño / Inversionista" : "Total Cobrado"}
                  userRole="owner"
                  netProfit={hasCompanySales ? totalPartnerProfitShare : totalSoldNetProfit}
                  capitalReturn={totalPartnerCapitalReturn}
                  farmShare={totalFarmProfitShare}
                  partnerProfitShare={totalPartnerProfitShare}
                  partnerTotalReturn={totalPartnerCashInflow}
                  ownerMonthlyRoi={averageSoldMonthlyRoi}
                  ownerMonthlyProfit={totalSoldMonthlyProfit * 0.5}
                  farmMonthlyRoi={averageSoldMonthlyRoi}
                  farmMonthlyProfit={totalSoldMonthlyProfit * 0.5}
                  directMonthlyRoi={averageSoldMonthlyRoi}
                  directMonthlyProfit={totalSoldMonthlyProfit}
                  directRoi={soldRoi}
                  totalInvested={totalSoldCost}
                />
              )}

              {filteredSoldList.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Chapa / Arete</th>
                        <th className="p-3">Fecha Venta</th>
                        <th className="p-3">Comprador</th>
                        <th className="p-3">Modalidad</th>
                        <th className="p-3 text-right">Peso Salida</th>
                        <th className="p-3 text-right">Precio Compra</th>
                        <th className="p-3 text-right">Precio Venta</th>
                        <th className="p-3 text-right">Utilidad Total</th>
                        <th className="p-3 text-right bg-emerald-100/40 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                          🏢 Finca (50%)
                        </th>
                        <th className="p-3 text-right bg-blue-100/40 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300">
                          🐮 Dueño Ganado
                        </th>
                        <th className="p-3 text-right">Rentab. ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredSoldList.map(animal => {
                        const fin = calculateFinancials(animal, 0, ownerMeatPrice);
                        const split = getCompanySplit(animal);
                        const exitW = parseFloat(animal.exitWeight) || 0;
                        const exitP = parseFloat(animal.exitPrice) || 0;
                        const isComp = split.isCompany;
                        const isExpanded = expandedAnimalId === animal.id;

                        return (
                          <React.Fragment key={animal.id}>
                            <tr
                              onClick={() => setExpandedAnimalId(prev => prev === animal.id ? null : animal.id)}
                              className={`transition cursor-pointer ${
                                isExpanded 
                                  ? 'bg-blue-100/70 dark:bg-blue-950/60 ring-2 ring-blue-400 dark:ring-blue-600' 
                                  : 'hover:bg-blue-50/60 dark:hover:bg-blue-950/20'
                              }`}
                            >
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    #{animal.tagNumber || 'S/N'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition ${
                                    isExpanded 
                                      ? 'bg-blue-600 text-white border-blue-600' 
                                      : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  }`}>
                                    {isExpanded ? '▼ Cerrar' : '▶ Liquidación'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formatDate(animal.exitDate)}
                              </td>
                              <td className="p-3 text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                                {animal.saleBuyer || animal.buyer || 'Venta Directa'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isComp
                                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                }`}>
                                  {isComp ? '🤝 En Compañía' : (animal.exitType || 'En Pie')}
                                </span>
                              </td>
                              <td className="p-3 text-right tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {exitW > 0 ? `${formatNumber(exitW, 0)} kg` : '-'}
                              </td>
                              <td className="p-3 text-right tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formatCurrency(fin.totalInvested)}
                              </td>
                              <td className="p-3 text-right tabular-nums font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                {formatCurrency(exitP)}
                              </td>
                              <td className="p-3 text-right tabular-nums font-black whitespace-nowrap">
                                <span className={fin.netProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}>
                                  {formatCurrency(fin.netProfit)}
                                </span>
                              </td>
                              {/* Finca (50%) */}
                              <td className="p-3 text-right tabular-nums font-black whitespace-nowrap bg-emerald-50/50 dark:bg-emerald-950/20">
                                {isComp ? (
                                  <div>
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                                      +{formatCurrency(split.farmShare)}
                                    </span>
                                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold block">
                                      {split.farmPercent}% utilidad
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </td>
                              {/* Dueño Ganado (50% utilidad y retorno) */}
                              <td className="p-3 text-right tabular-nums whitespace-nowrap bg-blue-50/50 dark:bg-blue-950/20">
                                {isComp ? (
                                  <div>
                                    <span className="text-blue-600 dark:text-blue-400 font-black text-xs">
                                      +{formatCurrency(split.partnerProfitShare)}
                                    </span>
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-semibold" title="Capital inicial recuperado + 50% de ganancia">
                                      Total: {formatCurrency(split.partnerTotalReturn)}
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                                      +{formatCurrency(fin.netProfit)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block">100% Dueño</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right tabular-nums whitespace-nowrap">
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">{formatNumber(fin.roi, 1)}%</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black block">📈 {formatNumber(fin.monthlyRoi, 1)}%/m</span>
                              </td>
                            </tr>

                            {/* Desglose Expandible Completo (Idéntico a la Ficha Técnica) */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90 dark:bg-slate-950 border-y-2 border-teal-400 dark:border-teal-600 animate-fade-in">
                                <td colSpan="11" className="p-3 sm:p-5">
                                  <div className="max-w-4xl mx-auto space-y-3">
                                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-bold px-1">
                                      <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold">
                                        <span>📄 Liquidación Individual Completa</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">#{animal.tagNumber}</span>
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectAnimal && onSelectAnimal(animal);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer transition shadow-md"
                                      >
                                        <span>Abrir Ficha Técnica Completa</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <SettlementDetailCard {...getSettlementCardPropsFromAnimal(animal, null)} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100/90 dark:bg-slate-950 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                      <tr>
                        <td className="p-3" colSpan="4">
                          TOTALES ({filteredSoldList.length} VENDIDOS)
                        </td>
                        <td className="p-3 text-right tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          Prom: {formatNumber(averageSoldExitWeight, 1)} kg
                        </td>
                        <td className="p-3 text-right tabular-nums text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {formatCurrency(totalSoldCost)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">
                          {formatCurrency(totalSoldRevenue)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {formatCurrency(totalSoldNetProfit)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap bg-emerald-100/50 dark:bg-emerald-950/40">
                          <div>
                            <span>+{formatCurrency(totalFarmProfitShare)}</span>
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold block">50% Finca</span>
                          </div>
                        </td>
                        <td className="p-3 text-right tabular-nums text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap bg-blue-100/50 dark:bg-blue-950/40">
                          <div>
                            <span>+{formatCurrency(totalPartnerProfitShare)}</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-bold block">
                              Total: {formatCurrency(totalPartnerCashInflow)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right tabular-nums text-emerald-700 dark:text-emerald-300 text-[11px] whitespace-nowrap">
                          <span className="block font-black">{formatNumber(soldRoi, 1)}%</span>
                          <span className="block text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">📈 {formatNumber(averageSoldMonthlyRoi, 2)}%/m</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  No hay registros de ventas para este propietario.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TODOS LOS ANIMALES */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Historial completo: <strong>{filteredAllList.length}</strong> de {totalRegisteredCount} cabezas</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Chapa</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Lote</th>
                      <th className="p-3">Sexo</th>
                      <th className="p-3 text-right">Peso Entrada</th>
                      <th className="p-3 text-right">Peso Actual/Salida</th>
                      <th className="p-3 text-right">Precio Compra</th>
                      <th className="p-3 text-right">Precio Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredAllList.map(animal => {
                      const ePrice = parseFloat(animal.entryPrice) || 0;
                      const exPrice = parseFloat(animal.exitPrice) || 0;

                      return (
                        <tr
                          key={animal.id}
                          onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                        >
                          <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                            #{animal.tagNumber || 'S/N'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              animal.status === 'Activo' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                                : animal.status === 'Vendido'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}>
                              {animal.status || 'Activo'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {animal.entryBatch || animal.paddock || '-'}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {animal.sex || '-'}
                          </td>
                          <td className="p-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                            {animal.entryWeight ? `${animal.entryWeight} kg` : '-'}
                          </td>
                          <td className="p-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                            {animal.currentWeight || animal.exitWeight ? `${animal.currentWeight || animal.exitWeight} kg` : '-'}
                          </td>
                          <td className="p-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {ePrice > 0 ? formatCurrency(ePrice) : '-'}
                          </td>
                          <td className="p-3 text-right tabular-nums font-bold text-blue-600 dark:text-blue-400">
                            {exPrice > 0 ? formatCurrency(exPrice) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Los valores están sincronizados y calculados en tiempo real con base en las compras y ventas registradas.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
