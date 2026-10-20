import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Common/Modal';
import { 
  AUCTION_HOUSES, 
  MARKET_CATEGORIES, 
  getAuctionPricesData, 
  getDefaultAuctionId, 
  setDefaultAuctionId, 
  getAuctionPriceHistory, 
  calculateHerdValuation, 
  saveCustomAuctionPrice, 
  generateAuctionWhatsAppReport 
} from '../../services/auctionPriceService';
import { setFarmMeatPrice } from '../../services/farmPriceService';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  DollarSign, 
  Building2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageCircle, 
  Radio, 
  Sparkles, 
  Star, 
  RefreshCw, 
  Edit3, 
  Share2, 
  ArrowRight, 
  BarChart3, 
  Layers 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function MarketPricesModal({ 
  isOpen, 
  onClose, 
  activeCattle = [], 
  weighings = [], 
  currentUser = null,
  zIndex = 'z-[60]' 
}) {
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'valuation' | 'compare' | 'custom'
  const [selectedAuction, setSelectedAuction] = useState(() => getDefaultAuctionId());
  const [defaultAuction, setDefaultAuction] = useState(() => getDefaultAuctionId());
  const [marketData, setMarketData] = useState(() => getAuctionPricesData());
  const [copied, setCopied] = useState(false);
  const [adoptedPriceMsg, setAdoptedPriceMsg] = useState(null);
  const [selectedChartCategory, setSelectedChartCategory] = useState('macho_ceba');

  // Formulario de edición / subasta local
  const [customAuctionId, setCustomAuctionId] = useState('sugaberrio');
  const [customCatId, setCustomCatId] = useState('macho_ceba');
  const [customPriceVal, setCustomPriceVal] = useState('');
  const [customPrevPriceVal, setCustomPrevPriceVal] = useState('');
  const [saveCustomMsg, setSaveCustomMsg] = useState(null);

  // Recargar datos cuando se abre el modal o cambia el storage
  const reloadData = () => {
    setMarketData(getAuctionPricesData());
    setDefaultAuction(getDefaultAuctionId());
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
      setAdoptedPriceMsg(null);
      setSaveCustomMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('auction_prices_updated', handleUpdate);
    return () => window.removeEventListener('auction_prices_updated', handleUpdate);
  }, []);

  const currentAuctionInfo = marketData[selectedAuction] || marketData.sugaberrio;

  // Valuación comercial del hato
  const herdValuation = useMemo(() => {
    return calculateHerdValuation(activeCattle, weighings, selectedAuction);
  }, [activeCattle, weighings, selectedAuction, marketData]);

  // Historial para la gráfica
  const chartHistory = useMemo(() => {
    return getAuctionPriceHistory(selectedAuction, selectedChartCategory);
  }, [selectedAuction, selectedChartCategory, marketData]);

  // Fijar como favorita
  const handleSetFavorite = (auctionId) => {
    setDefaultAuctionId(auctionId);
    setDefaultAuction(auctionId);
    setSelectedAuction(auctionId);
  };

  // Adoptar precio en la finca
  const handleAdoptPrice = (category) => {
    const price = category.currentPrice;
    setFarmMeatPrice(currentUser, price);
    setAdoptedPriceMsg({
      categoryName: category.name,
      price
    });
    setTimeout(() => {
      setAdoptedPriceMsg(null);
    }, 4000);
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    const text = generateAuctionWhatsAppReport(selectedAuction, herdValuation, currentUser?.farmName || 'Mi Finca');
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copiar al portapapeles
  const handleCopyReport = () => {
    const text = generateAuctionWhatsAppReport(selectedAuction, herdValuation, currentUser?.farmName || 'Mi Finca');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Guardar precio manual
  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!customPriceVal || parseFloat(customPriceVal) <= 0) return;

    const ok = saveCustomAuctionPrice(
      customAuctionId, 
      customCatId, 
      customPriceVal, 
      customPrevPriceVal || null
    );

    if (ok) {
      setSaveCustomMsg({ type: 'success', text: '¡Precio de subasta actualizado con éxito!' });
      setCustomPriceVal('');
      setCustomPrevPriceVal('');
      reloadData();
      setTimeout(() => setSaveCustomMsg(null), 3000);
    } else {
      setSaveCustomMsg({ type: 'error', text: 'No se pudo guardar el precio.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monitor de Precios de Subastas Ganaderas & Valuador"
      maxWidth="max-w-4xl"
      zIndex={zIndex}
    >
      <div className="space-y-4">
        {/* Cabecera Informativa con Banner en Vivo */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              📡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  Radar Comercial de Subastas en Colombia
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
                  ● En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Precios semanales en pie ($/kg), comparativas entre plazas y valuación en tiempo real de tus animales en potrero.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
              title="Compartir boletín por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Copiar boletín"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Notificación cuando se adopta un precio */}
        {adoptedPriceMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ¡Has adoptado el precio de <strong>{adoptedPriceMsg.categoryName}</strong> (<strong>${adoptedPriceMsg.price.toLocaleString('es-CO')} / kg</strong>) como precio oficial de tu finca! El inventario se ha actualizado en tiempo real.
            </span>
          </div>
        )}

        {/* Selector de Pestañas Principales */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('prices')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'prices'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Precios de Subastas</span>
          </button>

          <button
            onClick={() => setActiveTab('valuation')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'valuation'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Valuador del Hato ({activeCattle.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'compare'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Comparativa & Tendencia</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Subasta Local / Manual</span>
          </button>
        </div>

        {/* TAB 1: PRECIOS DE SUBASTAS */}
        {activeTab === 'prices' && (
          <div className="space-y-4">
            {/* Carrusel / Selector de Plaza Ganadera */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Selecciona la Plaza o Subasta de Referencia:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Haz clic en la estrella para dejarla como favorita)
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {Object.values(marketData).map(auc => {
                  const isSelected = selectedAuction === auc.id;
                  const isFav = defaultAuction === auc.id;

                  return (
                    <div
                      key={auc.id}
                      onClick={() => setSelectedAuction(auc.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xl">{auc.logo}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetFavorite(auc.id);
                          }}
                          className={`p-1 rounded-md transition ${isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
                          title={isFav ? 'Plaza favorita por defecto' : 'Marcar como plaza favorita'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      <div className="mt-1">
                        <div className={`text-xs font-black truncate leading-tight ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                          {auc.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {auc.auctionDays}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cabecera de la Subasta Seleccionada */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentAuctionInfo.logo}</span>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white">
                    {currentAuctionInfo.name} — <span className="font-normal text-slate-500">{currentAuctionInfo.location}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>📅 Días de remate: <strong>{currentAuctionInfo.auctionDays}</strong></span>
                    <span>•</span>
                    <span>Último boletín: <strong>{currentAuctionInfo.lastDate}</strong></span>
                  </p>
                </div>
              </div>

              {defaultAuction !== selectedAuction && (
                <button
                  type="button"
                  onClick={() => handleSetFavorite(selectedAuction)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span>Fijar como Favorita</span>
                </button>
              )}
            </div>

            {/* Grilla de Precios por Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(currentAuctionInfo.categories).map(cat => {
                const isUp = cat.trend === 'up';
                const isDown = cat.trend === 'down';
                const sign = cat.diff > 0 ? '+' : '';

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-base">{cat.emoji}</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {cat.shortName}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                          {cat.weightRange}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight">
                        {cat.desc}
                      </p>
                    </div>

                    <div>
                      {/* Precio Grande */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                          ${cat.currentPrice.toLocaleString('es-CO')}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ kg en pie</span>
                      </div>

                      {/* Variación Semanal */}
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isUp 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : isDown 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isUp && <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {isDown && <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                          <span>{sign}${cat.diff.toLocaleString('es-CO')} ({sign}{cat.diffPercent}%)</span>
                        </span>

                        <span className="text-[10px] text-slate-400">
                          Ant: ${cat.previousPrice.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Botón para adoptar precio en la finca */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleAdoptPrice(cat)}
                        className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Aplicar este precio por kilo como valor de referencia oficial en mi finca"
                      >
                        <Scale className="w-3 h-3 text-emerald-600" />
                        <span>Adoptar en mi Finca</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VALUADOR DEL HATO EN VIVO */}
        {activeTab === 'valuation' && (
          <div className="space-y-4">
            {/* Banner Principal de Valuación */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/20 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-200 block">
                    💰 Valuación Comercial del Hato en Pie
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">
                    {currentUser?.farmName || 'Mi Finca Ganadera'}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-200 block">
                    Plaza de cotización:
                  </span>
                  <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full inline-block mt-0.5">
                    {herdValuation.auctionName} ({herdValuation.auctionDate})
                  </span>
                </div>
              </div>

              {/* Métricas Principales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-emerald-200 block text-[11px]">Valor Total Estimado:</span>
                  <p className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight">
                    ${herdValuation.totalValue.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <span className="text-emerald-200 block text-[11px]">Kilos Totales en Pie:</span>
                  <p className="text-xl sm:text-2xl font-black tabular-nums">
                    {herdValuation.totalWeight.toLocaleString('es-CO')} kg
                  </p>
                </div>
                <div>
                  <span className="text-emerald-200 block text-[11px]">Inventario Activo:</span>
                  <p className="text-xl sm:text-2xl font-black tabular-nums">
                    {herdValuation.animalCount} cabezas
                  </p>
                </div>
                <div>
                  <span className="text-emerald-200 block text-[11px]">Precio / kg Ponderado:</span>
                  <p className="text-xl sm:text-2xl font-black tabular-nums text-emerald-300">
                    ${herdValuation.avgPricePerKg.toLocaleString('es-CO')} / kg
                  </p>
                </div>
              </div>
            </div>

            {/* Desglose por Categorías de Mercado */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Desglose por Categoría Comercial en Potrero:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (Cotizado según los precios de {herdValuation.auctionName})
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.entries(herdValuation.breakdown).map(([catId, data]) => {
                  const catObj = MARKET_CATEGORIES[catId];
                  if (!catObj) return null;

                  return (
                    <div 
                      key={catId}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="text-base">{catObj.emoji}</span>
                          <span className="text-slate-900 dark:text-white truncate">{catObj.shortName}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {data.count} {data.count === 1 ? 'cabeza' : 'cabezas'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-500 text-[11px]">Kilos Totales:</span>
                        <span className="font-black text-slate-900 dark:text-white tabular-nums">
                          {data.weight.toLocaleString('es-CO')} kg
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">Precio Subasta:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ${data.pricePerKg.toLocaleString('es-CO')} / kg
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-dashed border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-bold text-[11px]">Valor del Grupo:</span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                          ${data.value.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPARATIVA ENTRE PLAZAS & GRÁFICA DE TENDENCIA */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            {/* Tabla Comparativa Multi-Subasta */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Comparativa de Precios entre las Principales Plazas de Colombia:</span>
                <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 font-bold">
                  ★ Verde resalta el mejor precio del mercado
                </span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Categoría</th>
                      <th className="p-3 text-center">Sugaberrío</th>
                      <th className="p-3 text-center">Central Ganadera</th>
                      <th className="p-3 text-center">Sugamagdalena</th>
                      <th className="p-3 text-center">Suganusa</th>
                      <th className="p-3 text-center">Subastar</th>
                      <th className="p-3 text-center">Promedio FEDEGÁN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                    {Object.keys(MARKET_CATEGORIES).map(catId => {
                      const catObj = MARKET_CATEGORIES[catId];
                      const prices = [
                        marketData.sugaberrio.categories[catId]?.currentPrice || 0,
                        marketData.central_ganadera.categories[catId]?.currentPrice || 0,
                        marketData.sugamagdalena.categories[catId]?.currentPrice || 0,
                        marketData.suganusa.categories[catId]?.currentPrice || 0,
                        marketData.subastar.categories[catId]?.currentPrice || 0,
                        marketData.fedegan_nacional.categories[catId]?.currentPrice || 0
                      ];
                      const maxPrice = Math.max(...prices);

                      return (
                        <tr key={catId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-sans font-bold text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                            <span>{catObj.emoji}</span>
                            <span>{catObj.shortName}</span>
                          </td>
                          {prices.map((p, idx) => {
                            const isBest = p === maxPrice && p > 0;
                            return (
                              <td key={idx} className="p-3 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-lg font-black ${
                                  isBest 
                                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-400 font-extrabold' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  ${p.toLocaleString('es-CO')}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfica de Tendencia de las Últimas 8 Semanas */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Tendencia Histórica de Precios (Últimas 8 Semanas)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evolución del $/kg en {currentAuctionInfo.name}
                  </p>
                </div>

                {/* Selector de Categoría para la Gráfica */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                  {Object.entries(MARKET_CATEGORIES).slice(0, 3).map(([cId, cat]) => (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => setSelectedChartCategory(cId)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                        selectedChartCategory === cId
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.emoji} {cat.shortName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenedor Recharts */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(val) => `$${val}`} 
                    />
                    <Tooltip 
                      formatter={(val) => [`$${val.toLocaleString('es-CO')} / kg`, 'Precio']}
                      labelFormatter={(label) => `Semana: ${label}`}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REGISTRAR SUBASTA LOCAL O MANUAL */}
        {activeTab === 'custom' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Actualizar Precios con Boletín Local o Personalizado</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Si asististe a una subasta local de tu municipio o recibiste el volante por WhatsApp, puedes ingresar el precio por kilo para que la app lo tome en cuenta.
              </p>
            </div>

            {saveCustomMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                saveCustomMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300' 
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
              }`}>
                {saveCustomMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{saveCustomMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustom} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Plaza o Subasta a Actualizar:
                  </label>
                  <select
                    value={customAuctionId}
                    onChange={(e) => setCustomAuctionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    {Object.values(AUCTION_HOUSES).map(auc => (
                      <option key={auc.id} value={auc.id}>
                        {auc.logo} {auc.name} ({auc.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría del Ganado:
                  </label>
                  <select
                    value={customCatId}
                    onChange={(e) => setCustomCatId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    {Object.values(MARKET_CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name} ({cat.weightRange})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nuevo Precio de Remate ($/kg):
                  </label>
                  <input
                    type="number"
                    step="10"
                    required
                    placeholder="Ej. 8550"
                    value={customPriceVal}
                    onChange={(e) => setCustomPriceVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-black text-emerald-600 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Precio del Remate Anterior ($/kg - Opcional):
                  </label>
                  <input
                    type="number"
                    step="10"
                    placeholder="Ej. 8350 (para calcular variación)"
                    value={customPrevPriceVal}
                    onChange={(e) => setCustomPrevPriceVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  ✓ Guardar Precio de Subasta
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            🏛️ Fuente: Boletines oficiales de remate de subastas ganaderas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
