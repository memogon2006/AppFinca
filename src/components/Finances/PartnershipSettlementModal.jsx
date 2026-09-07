import React, { useState, useMemo } from 'react';
import { 
  X, 
  Users, 
  DollarSign, 
  Scale, 
  Printer, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  Building2, 
  UserCheck, 
  Tag, 
  Layers, 
  Search,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  SplitSquareVertical,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateWeightMetrics } from '../../services/calculations';
import confetti from 'canvas-confetti';

export function PartnershipSettlementModal({ 
  isOpen, 
  onClose, 
  cattle = [], 
  weighings = [], 
  onConfirmBatchSale,
  zIndex = 'z-[60]'
}) {
  if (!isOpen) return null;

  const activeCattle = useMemo(() => {
    return cattle.filter(c => c.status === 'Activo');
  }, [cattle]);

  // Estados del filtro de selección
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState('');

  // Animales seleccionados y sus pesos de salida modificables
  const [selectedIds, setSelectedIds] = useState([]);
  const [customExitWeights, setCustomExitWeights] = useState({});

  // Mapa de modalidades individuales por animal: { [animalId]: 'partnership' | 'direct' }
  const [animalModes, setAnimalModes] = useState({});

  // Modo global rápido: 'mixed' | 'partnership' | 'direct'
  const [globalMode, setGlobalMode] = useState('mixed');

  // Parámetros comerciales de la venta / liquidación
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyerName, setBuyerName] = useState('');
  const [pricePerKg, setPricePerKg] = useState('9200');
  const [farmPercent, setFarmPercent] = useState(50); // % para la Finca en los que son en compañía
  const [partnerPercent, setPartnerPercent] = useState(50); // % para el Dueño del Animal
  const [activeTab, setActiveTab] = useState('selection'); // 'selection' | 'preview' | 'report'

  // Batches y Propietarios únicos
  const entryBatches = useMemo(() => {
    return Array.from(new Set(activeCattle.map(c => c.entryBatch || c.paddock).filter(Boolean)));
  }, [activeCattle]);

  const owners = useMemo(() => {
    return Array.from(new Set(activeCattle.map(c => c.owner).filter(Boolean)));
  }, [activeCattle]);

  // Filtrar lista disponible
  const filteredAvailable = useMemo(() => {
    return activeCattle.filter(c => {
      if (selectedBatchFilter && (c.entryBatch || c.paddock) !== selectedBatchFilter) return false;
      if (selectedOwnerFilter && c.owner !== selectedOwnerFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const tag = (c.tagNumber || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const brand = (c.ironBrand || '').toLowerCase();
        const owner = (c.owner || '').toLowerCase();
        const batch = (c.entryBatch || c.paddock || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || brand.includes(q) || owner.includes(q) || batch.includes(q);
      }
      return true;
    });
  }, [activeCattle, selectedBatchFilter, selectedOwnerFilter, searchTerm]);

  // Manejar selección / deselección de un animal
  const toggleSelectAnimal = (animal) => {
    setSelectedIds(prev => {
      const exists = prev.includes(animal.id);
      if (exists) {
        return prev.filter(id => id !== animal.id);
      } else {
        const animalWeighs = weighings.filter(w => w.cattleId === animal.id);
        const wm = calculateWeightMetrics(animal, animalWeighs);
        const exitW = wm.currentWeight || parseFloat(animal.entryWeight) || 0;
        setCustomExitWeights(cw => ({ ...cw, [animal.id]: exitW }));
        
        // Si no tiene modalidad asignada, inicializar
        setAnimalModes(am => {
          if (!am[animal.id]) {
            const defaultMode = globalMode === 'direct' ? 'direct' : 'partnership';
            return { ...am, [animal.id]: defaultMode };
          }
          return am;
        });

        return [...prev, animal.id];
      }
    });
  };

  // Seleccionar / Deseleccionar todos los filtrados
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredAvailable.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const newSelected = Array.from(new Set([...selectedIds, ...filteredIds]));
      setSelectedIds(newSelected);
      const newWeights = { ...customExitWeights };
      const newModes = { ...animalModes };
      filteredAvailable.forEach(c => {
        if (!newWeights[c.id]) {
          const animalWeighs = weighings.filter(w => w.cattleId === c.id);
          const wm = calculateWeightMetrics(c, animalWeighs);
          newWeights[c.id] = wm.currentWeight || parseFloat(c.entryWeight) || 0;
        }
        if (!newModes[c.id]) {
          newModes[c.id] = globalMode === 'direct' ? 'direct' : 'partnership';
        }
      });
      setCustomExitWeights(newWeights);
      setAnimalModes(newModes);
    }
  };

  const handleExitWeightChange = (animalId, weightVal) => {
    setCustomExitWeights(prev => ({
      ...prev,
      [animalId]: parseFloat(weightVal) || 0
    }));
  };

  // Cambiar modalidad individual de un animal específico
  const toggleAnimalMode = (animalId, e) => {
    if (e) e.stopPropagation();
    setAnimalModes(prev => {
      const current = prev[animalId] || 'partnership';
      const next = current === 'partnership' ? 'direct' : 'partnership';
      return { ...prev, [animalId]: next };
    });
    setGlobalMode('mixed');
  };

  // Aplicar modalidad a todos los animales seleccionados
  const applyGlobalMode = (mode) => {
    setGlobalMode(mode);
    if (mode === 'partnership' || mode === 'direct') {
      const updated = {};
      selectedIds.forEach(id => {
        updated[id] = mode;
      });
      setAnimalModes(prev => ({ ...prev, ...updated }));
    }
  };

  // Cálculos detallados por cada animal seleccionado (según su propia modalidad)
  const selectedAnimalsData = useMemo(() => {
    const priceKg = parseFloat(pricePerKg) || 0;
    const fPct = parseFloat(farmPercent) / 100;
    const pPct = parseFloat(partnerPercent) / 100;

    return selectedIds.map(id => {
      const animal = cattle.find(c => c.id === id);
      if (!animal) return null;

      const animalWeighs = weighings.filter(w => w.cattleId === animal.id);
      const wm = calculateWeightMetrics(animal, animalWeighs);

      const entryW = parseFloat(animal.entryWeight) || 0;
      const entryP = parseFloat(animal.entryPrice) || 0;
      const exitW = customExitWeights[id] !== undefined ? customExitWeights[id] : (wm.currentWeight || entryW);
      const weightGain = exitW - entryW;

      const mode = animalModes[id] || (globalMode === 'direct' ? 'direct' : 'partnership');
      const isPart = mode === 'partnership';

      const grossSale = exitW * priceKg;
      const profit = grossSale - entryP; // Ganancia / Aumento

      // En Venta Directa la venta bruta completa va directamente al dueño del animal
      const farmShare = isPart ? (profit > 0 ? profit * fPct : 0) : grossSale;
      const farmProfitOnly = isPart ? (profit > 0 ? profit * fPct : 0) : profit;
      const partnerProfitShare = isPart ? (profit > 0 ? profit * pPct : 0) : 0;
      const partnerTotalReturn = isPart ? (entryP + partnerProfitShare) : 0;

      return {
        animal,
        mode, // 'partnership' | 'direct'
        isPart,
        entryWeight: entryW,
        entryPrice: entryP,
        exitWeight: exitW,
        weightGain,
        grossSale,
        profit,
        farmShare,
        farmProfitOnly,
        partnerProfitShare,
        partnerTotalReturn,
      };
    }).filter(Boolean);
  }, [selectedIds, cattle, weighings, customExitWeights, pricePerKg, farmPercent, partnerPercent, animalModes, globalMode]);

  // Consolidado total del lote con desglose combinado
  const totals = useMemo(() => {
    let totalHeads = selectedAnimalsData.length;
    let totalEntryWeight = 0;
    let totalExitWeight = 0;
    let totalWeightGain = 0;
    let totalEntryCost = 0; // Capital invertido total
    let totalGrossSale = 0; // Venta bruta total
    let totalProfit = 0; // Ganancia total bruta

    // Desglose Compañía vs Directa
    let countPartnership = 0;
    let countDirect = 0;
    let partnershipGross = 0;
    let directGross = 0;
    let directEntryCost = 0;
    let partnershipPartnerCapital = 0;
    let partnershipPartnerProfit = 0;
    let partnershipPartnerReturn = 0;
    let partnershipFarmProfit = 0;
    let directFarmProfit = 0;

    selectedAnimalsData.forEach(d => {
      totalEntryWeight += d.entryWeight;
      totalExitWeight += d.exitWeight;
      totalWeightGain += d.weightGain;
      totalEntryCost += d.entryPrice;
      totalGrossSale += d.grossSale;
      totalProfit += d.profit;

      if (d.isPart) {
        countPartnership++;
        partnershipGross += d.grossSale;
        partnershipPartnerCapital += d.entryPrice;
        partnershipPartnerProfit += d.partnerProfitShare;
        partnershipPartnerReturn += d.partnerTotalReturn;
        partnershipFarmProfit += d.farmProfitOnly;
      } else {
        countDirect++;
        directGross += d.grossSale;
        directEntryCost += d.entryPrice;
        directFarmProfit += d.profit;
      }
    });

    // En venta directa, la venta bruta va 100% directa para el dueño
    const totalFarmGrossCash = directGross + partnershipFarmProfit;
    const totalFarmNetProfit = directFarmProfit + partnershipFarmProfit;
    const avgGdpOverall = totalHeads > 0 ? (totalWeightGain / totalHeads) : 0;
    const batchRoi = totalEntryCost > 0 ? (totalProfit / totalEntryCost) * 100 : 0;

    return {
      totalHeads,
      totalEntryWeight,
      totalExitWeight,
      totalWeightGain,
      totalEntryCost,
      totalGrossSale,
      totalProfit,
      countPartnership,
      countDirect,
      partnershipGross,
      directGross,
      directEntryCost,
      partnershipPartnerCapital,
      partnershipPartnerProfit,
      partnershipPartnerReturn,
      partnershipFarmProfit,
      directFarmProfit,
      totalFarmGrossCash,
      totalFarmNetProfit,
      avgGdpOverall,
      batchRoi
    };
  }, [selectedAnimalsData]);

  // Manejar cambio de porcentaje (auto balancear a 100%)
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

  // Confirmar y asentar la venta de todo el lote en una sola transacción
  const handleConfirmSale = () => {
    if (selectedAnimalsData.length === 0) {
      alert('Por favor selecciona al menos un bovino para liquidar.');
      return;
    }
    if (!pricePerKg || parseFloat(pricePerKg) <= 0) {
      alert('Por favor ingresa un precio válido por kilo.');
      return;
    }

    const confirmMsg = `⚠️ ¿Confirmas la venta/liquidación de este lote (${totals.totalHeads} bovinos por un total de ${formatCurrency(totals.totalGrossSale)})?\n\n` +
      `• 💰 Animales en Venta Directa: ${totals.countDirect} cabezas (${formatCurrency(totals.directGross)} Venta Bruta directa al Dueño)\n` +
      `• 🤝 Animales en Compañía: ${totals.countPartnership} cabezas (${formatCurrency(totals.partnershipGross)})\n\n` +
      `• 🏢 Total Dinero para la Finca: ${formatCurrency(totals.totalFarmGrossCash)} (Utilidad Neta: ${formatCurrency(totals.totalFarmNetProfit)})\n` +
      `• 👤 Total a Entregar al Dueño del Animal: ${formatCurrency(totals.partnershipPartnerReturn)}`;
    
    if (window.confirm(confirmMsg)) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // Preparar lote consolidado para asentar en base de datos
      const batchPayload = selectedAnimalsData.map(d => ({
        id: d.animal.id,
        exitDate: saleDate,
        exitWeight: d.exitWeight,
        exitPrice: d.grossSale,
        saleBuyer: buyerName || (d.isPart ? 'Comprador Lote Compañía' : 'Comprador Lote Directo'),
        saleReason: d.isPart 
          ? `Venta en Compañía (${farmPercent}% Finca / ${partnerPercent}% Dueño)` 
          : 'Venta Directa de Lote',
        exitType: d.isPart ? 'En Compañía' : 'En Pie',
        partnershipDetails: d.isPart ? {
          pricePerKg: parseFloat(pricePerKg),
          entryPrice: d.entryPrice,
          profit: d.profit,
          farmPercent,
          partnerPercent,
          farmShare: d.farmProfitOnly,
          partnerTotalReturn: d.partnerTotalReturn,
          partnerProfitShare: d.partnerProfitShare,
          owner: d.animal.owner,
        } : null
      }));

      onConfirmBatchSale(batchPayload);
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`modal-backdrop-root fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto`}>
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header del Modal */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Liquidación & Venta de Ganado por Lote
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-300">
                  ⚡ Venta Combinada: Individual / Compañía
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                En venta directa, la <strong>venta bruta ingresa 100% para el dueño del animal</strong>. En compañía, se liquida capital y utilidad al partir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas de Navegación */}
        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold flex-shrink-0">
          <button
            onClick={() => setActiveTab('selection')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'selection' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>1. Selección & Modalidad ({selectedIds.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${selectedIds.length === 0 ? 'opacity-40 cursor-not-allowed' : activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>2. Liquidación Consolidada</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${selectedIds.length === 0 ? 'opacity-40 cursor-not-allowed' : activeTab === 'report' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Comprobante Oficial</span>
          </button>
        </div>

        {/* Contenido Dinámico según Pestaña */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ========================================================================= */}
          {/* PESTAÑA 1: SELECCIÓN DE BOVINOS & ASIGNACIÓN DE MODALIDAD                 */}
          {/* ========================================================================= */}
          {activeTab === 'selection' && (
            <div className="space-y-4">
              
              {/* Barra Superior con Acciones Globales Rápidas */}
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-extrabold text-teal-900 dark:text-teal-200 block">
                    🔀 Asignar modalidad a los seleccionados:
                  </span>
                  <span className="text-[11px] text-teal-700 dark:text-teal-300">
                    En <strong>Venta Directa</strong> la venta bruta va 100% al dueño del animal. En <strong>Compañía</strong> se reconoce el costo inicial al dueño y se reparte la ganancia.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyGlobalMode('partnership')}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    🤝 Todos en Compañía
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGlobalMode('direct')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    💰 Todos en Directa
                  </button>
                </div>
              </div>

              {/* Filtros de Búsqueda */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por arete, hierro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <select
                    value={selectedBatchFilter}
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="">🏷️ Filtrar por Ingreso # (Todos)</option>
                    {entryBatches.map(b => (
                      <option key={b} value={b}>Ingreso: {b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedOwnerFilter}
                    onChange={(e) => setSelectedOwnerFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="">👤 Filtrar por Dueño del Animal (Todos)</option>
                    {owners.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón de selección rápida */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>
                    {filteredAvailable.every(c => selectedIds.includes(c.id))
                      ? 'Deseleccionar todos los filtrados'
                      : `Seleccionar todos los visibles (${filteredAvailable.length} cabezas)`}
                  </span>
                </button>

                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>{selectedIds.length} seleccionados</span>
                  {totals.countDirect > 0 && <span className="text-blue-600 dark:text-blue-400 font-extrabold">• 💰 {totals.countDirect} Directos</span>}
                  {totals.countPartnership > 0 && <span className="text-teal-600 dark:text-teal-400 font-extrabold">• 🤝 {totals.countPartnership} Compañía</span>}
                </div>
              </div>

              {/* Tabla de Selección con Botón de Modalidad Individual */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">Sel.</th>
                        <th className="p-3">Arete</th>
                        <th className="p-3">Modalidad Individual</th>
                        <th className="p-3">Ingreso #</th>
                        <th className="p-3">Dueño del Animal</th>
                        <th className="p-3">Peso Inicial</th>
                        <th className="p-3">Costo Inicial</th>
                        <th className="p-3">Peso de Salida (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredAvailable.map(animal => {
                        const isSelected = selectedIds.includes(animal.id);
                        const animalWeighs = weighings.filter(w => w.cattleId === animal.id);
                        const wm = calculateWeightMetrics(animal, animalWeighs);
                        const exitWeightVal = customExitWeights[animal.id] !== undefined 
                          ? customExitWeights[animal.id] 
                          : (wm.currentWeight || animal.entryWeight || 0);
                        const mode = animalModes[animal.id] || (globalMode === 'direct' ? 'direct' : 'partnership');
                        const isPart = mode === 'partnership';

                        return (
                          <tr 
                            key={animal.id}
                            onClick={() => toggleSelectAnimal(animal)}
                            className={`cursor-pointer transition ${
                              isSelected ? 'bg-teal-50/80 dark:bg-teal-950/40 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {animal.tagNumber}
                            </td>
                            
                            {/* BOTÓN DE MODALIDAD INDIVIDUAL */}
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={(e) => toggleAnimalMode(animal.id, e)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1 cursor-pointer ${
                                    isPart 
                                      ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                                  }`}
                                  title="Haz clic para cambiar entre Compañía y Venta Directa"
                                >
                                  <span>{isPart ? '🤝 En Compañía' : '💰 Venta Directa'}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                {animal.entryBatch || animal.paddock || 'Ingreso #1'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{animal.owner || 'Dueño Principal'}</div>
                              <div className="text-[10px] text-slate-400">Hierro: {animal.ironBrand || 'N/A'}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                              {animal.entryWeight || 0} kg
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {formatCurrency(animal.entryPrice || 0)}
                            </td>
                            <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400" onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={exitWeightVal}
                                    onChange={(e) => handleExitWeightChange(animal.id, e.target.value)}
                                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-400 text-xs font-bold text-slate-900 dark:text-white"
                                  />
                                  <span className="text-slate-500 text-[11px]">kg</span>
                                </div>
                              ) : (
                                <span>{wm.currentWeight || animal.entryWeight || 0} kg</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: LIQUIDACIÓN CONSOLIDADA & PARÁMETROS DEL LOTE                  */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              
              {/* Formulario de Parámetros de Venta */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Parámetros Comerciales del Lote Completo</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-bold">Cambiar todos a:</span>
                    <button
                      type="button"
                      onClick={() => applyGlobalMode('partnership')}
                      className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[11px] font-bold hover:bg-teal-200 transition cursor-pointer"
                    >
                      🤝 Compañía
                    </button>
                    <button
                      type="button"
                      onClick={() => applyGlobalMode('direct')}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-200 transition cursor-pointer"
                    >
                      💰 Directa
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Liquidación / Venta:
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Comprador / Frigorífico / Subasta:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Frigorífico del Valle, Subasta..."
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Precio de Venta por Kilo ($/kg en Pie):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="50"
                        placeholder="Ej. 9200"
                        value={pricePerKg}
                        onChange={(e) => setPricePerKg(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-500 text-teal-600 dark:text-teal-400 font-black text-sm focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">COP / kg</span>
                    </div>
                  </div>
                </div>

                {/* Configuración de Porcentaje para animales en Compañía */}
                {totals.countPartnership > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        Distribución de Ganancia para los {totals.countPartnership} animales en Compañía:
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        * El dueño del animal recupera primero el capital de compra de sus animales y luego se reparte la ganancia.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          🏢 Parte Finca (Cuidado / Pastos):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={farmPercent}
                            onChange={(e) => handleFarmPercentChange(e.target.value)}
                            className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-extrabold text-teal-600 text-sm"
                          />
                          <span className="font-black text-sm text-teal-600">%</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          👤 Parte Dueño del Animal:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={partnerPercent}
                            onChange={(e) => handlePartnerPercentChange(e.target.value)}
                            className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-extrabold text-blue-600 text-sm"
                          />
                          <span className="font-black text-sm text-blue-600">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Gran Resumen de Liquidación Consolidada (4 Tarjetas Gigantes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* 1. Total Venta del Lote */}
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider block">
                    1. Venta Total del Lote
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(totals.totalGrossSale)}
                  </p>
                  <div className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1">
                    {formatNumber(totals.totalExitWeight, 1)} kg ({totals.totalHeads} cabezas)
                  </div>
                </div>

                {/* 2. Capital Inicial de Compra */}
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    2. Capital Compra Inicial
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
                    {formatCurrency(totals.totalEntryCost)}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {totals.countPartnership > 0 && `Dueño: ${formatCurrency(totals.partnershipPartnerCapital)}`} {totals.countDirect > 0 && `• Finca: ${formatCurrency(totals.directEntryCost)}`}
                  </div>
                </div>

                {/* 3. DINERO TOTAL PARA LA FINCA */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 shadow-sm">
                  <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> 3. Total Dinero para la Finca
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatCurrency(totals.totalFarmGrossCash)}
                  </p>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold mt-1">
                    {totals.countDirect > 0 && `100% Venta Directa (${formatCurrency(totals.directGross)})`} {totals.countPartnership > 0 && `• Ganancia Compañía (${formatCurrency(totals.partnershipFarmProfit)})`}
                  </div>
                </div>

                {/* 4. TOTAL DUEÑO DEL ANIMAL */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 shadow-sm">
                  <span className="text-[11px] font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider block flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> 4. Entrega Total al Dueño
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                    {formatCurrency(totals.partnershipPartnerReturn)}
                  </p>
                  <div className="text-[11px] text-blue-800 dark:text-blue-400 font-bold mt-1">
                    {totals.countPartnership > 0 
                      ? `Capital (${formatCurrency(totals.partnershipPartnerCapital)}) + Ganancia (${formatCurrency(totals.partnershipPartnerProfit)})`
                      : 'Sin animales en compañía'}
                  </div>
                </div>

              </div>

              {/* Desglose Tabla Animal por Animal con Selector Rápido */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Desglose Individual por Bovino ({selectedAnimalsData.length} cabezas)
                  </h5>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ver Acta Imprimible
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="max-h-[250px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                        <tr>
                          <th className="p-2.5">Arete</th>
                          <th className="p-2.5">Modalidad</th>
                          <th className="p-2.5">Dueño del Animal</th>
                          <th className="p-2.5">Peso Ent.</th>
                          <th className="p-2.5">Peso Sal.</th>
                          <th className="p-2.5">Aumento</th>
                          <th className="p-2.5">Costo Compra</th>
                          <th className="p-2.5">Venta Bruta</th>
                          <th className="p-2.5 text-emerald-600 dark:text-emerald-400">Total Finca (Dinero)</th>
                          <th className="p-2.5 text-blue-600 dark:text-blue-400">Pago a Dueño</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedAnimalsData.map(d => (
                          <tr key={d.animal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{d.animal.tagNumber}</td>
                            <td className="p-2.5">
                              <button
                                type="button"
                                onClick={(e) => toggleAnimalMode(d.animal.id, e)}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer transition ${
                                  d.isPart 
                                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 hover:bg-teal-200' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200'
                                }`}
                                title="Haz clic para cambiar modalidad"
                              >
                                {d.isPart ? '🤝 Compañía' : '💰 Directa'}
                              </button>
                            </td>
                            <td className="p-2.5 text-slate-500 truncate max-w-[100px]">{d.animal.owner || 'Dueño Principal'}</td>
                            <td className="p-2.5">{d.entryWeight} kg</td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{d.exitWeight} kg</td>
                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">+{d.weightGain} kg</td>
                            <td className="p-2.5">{formatCurrency(d.entryPrice)}</td>
                            <td className="p-2.5 font-bold">{formatCurrency(d.grossSale)}</td>
                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                              {d.isPart ? formatCurrency(d.farmProfitOnly) : formatCurrency(d.grossSale)}
                            </td>
                            <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                              {d.isPart ? formatCurrency(d.partnerTotalReturn) : '$0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: ACTA OFICIAL / COMPROBANTE DE LIQUIDACIÓN                       */}
          {/* ========================================================================= */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Comprobante consolidado de venta y liquidación de ganado (Ventas directas y en compañía).
                </span>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
              </div>

              {/* Hoja de Liquidación Oficial */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white text-slate-900 border border-slate-300 shadow-lg space-y-6 font-sans">
                
                {/* Cabecera del Acta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                      <span>🐄 ACTA DE LIQUIDACIÓN Y VENTA DE GANADO POR LOTE</span>
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Finca Ganadera • Sistema de Ceba & Aumento en Pastoreo
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">Fecha: {formatDate(saleDate)}</p>
                    <p className="text-slate-600">Comprador: {buyerName || 'Mercado Abierto'}</p>
                    <p className="text-slate-600">Precio Base: {formatCurrency(pricePerKg)} / kg</p>
                  </div>
                </div>

                {/* Datos del Acuerdo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Cabezas:</span>
                    <strong className="text-sm">{totals.totalHeads} Bovinos ({totals.countDirect} Directos / {totals.countPartnership} Compañía)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kilos Totales Báscula:</span>
                    <strong className="text-sm">{formatNumber(totals.totalExitWeight, 1)} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Venta Directa:</span>
                    <strong className="text-sm">100% Venta Bruta al Dueño</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kilos Ganados en Pastos:</span>
                    <strong className="text-sm text-emerald-700">+{formatNumber(totals.totalWeightGain, 1)} kg</strong>
                  </div>
                </div>

                {/* Tabla de Bovinos */}
                <table className="w-full text-left text-xs border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200">Arete</th>
                      <th className="p-2 border-r border-slate-200">Modalidad</th>
                      <th className="p-2 border-r border-slate-200">Dueño del Animal</th>
                      <th className="p-2 border-r border-slate-200">Peso Ent.</th>
                      <th className="p-2 border-r border-slate-200">Peso Sal.</th>
                      <th className="p-2 border-r border-slate-200">Aumento</th>
                      <th className="p-2 border-r border-slate-200">Costo Compra</th>
                      <th className="p-2 border-r border-slate-200">Venta Bruta</th>
                      <th className="p-2 border-r border-slate-200 text-emerald-800">Total Finca (Dinero)</th>
                      <th className="p-2 text-blue-800">Total Pago a Dueño</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAnimalsData.map((d, index) => (
                      <tr key={d.animal.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2 font-extrabold border-r border-slate-200">{d.animal.tagNumber}</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-[10px]">
                          {d.isPart ? '🤝 En Compañía' : '💰 Venta Directa'}
                        </td>
                        <td className="p-2 border-r border-slate-200">{d.animal.owner || 'Dueño Principal'} ({d.animal.ironBrand || 'N/A'})</td>
                        <td className="p-2 border-r border-slate-200">{d.entryWeight} kg</td>
                        <td className="p-2 font-bold border-r border-slate-200">{d.exitWeight} kg</td>
                        <td className="p-2 font-bold text-emerald-700 border-r border-slate-200">+{d.weightGain} kg</td>
                        <td className="p-2 border-r border-slate-200">{formatCurrency(d.entryPrice)}</td>
                        <td className="p-2 font-bold border-r border-slate-200">{formatCurrency(d.grossSale)}</td>
                        <td className="p-2 font-bold text-emerald-800 border-r border-slate-200">
                          {d.isPart ? formatCurrency(d.farmProfitOnly) : formatCurrency(d.grossSale)}
                        </td>
                        <td className="p-2 font-bold text-blue-800">
                          {d.isPart ? formatCurrency(d.partnerTotalReturn) : '$0'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-extrabold border-t-2 border-slate-400">
                      <td colSpan="3" className="p-2.5 border-r border-slate-300">TOTALES DEL LOTE</td>
                      <td className="p-2.5 border-r border-slate-300">{formatNumber(totals.totalEntryWeight, 1)} kg</td>
                      <td className="p-2.5 border-r border-slate-300">{formatNumber(totals.totalExitWeight, 1)} kg</td>
                      <td className="p-2.5 border-r border-slate-300 text-emerald-800">+{formatNumber(totals.totalWeightGain, 1)} kg</td>
                      <td className="p-2.5 border-r border-slate-300">{formatCurrency(totals.totalEntryCost)}</td>
                      <td className="p-2.5 border-r border-slate-300">{formatCurrency(totals.totalGrossSale)}</td>
                      <td className="p-2.5 border-r border-slate-300 text-emerald-900">{formatCurrency(totals.totalFarmGrossCash)}</td>
                      <td className="p-2.5 text-blue-900">{formatCurrency(totals.partnershipPartnerReturn)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Cuadro Resumen Final Consolidado */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-100 border border-slate-300 text-xs">
                  <div className="space-y-1">
                    <p className="font-extrabold text-emerald-900 uppercase">🏢 TOTAL DINERO PARA LA FINCA:</p>
                    <p className="text-2xl font-black text-emerald-700">{formatCurrency(totals.totalFarmGrossCash)}</p>
                    <span className="text-slate-600 text-[11px]">
                      100% Venta Bruta de Directos ({formatCurrency(totals.directGross)}) + Ganancia en Pastoreo de Compañía ({formatCurrency(totals.partnershipFarmProfit)}). Utilidad neta total: {formatCurrency(totals.totalFarmNetProfit)}.
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-blue-900 uppercase">👤 TOTAL A ENTREGAR AL DUEÑO DEL ANIMAL:</p>
                    <p className="text-2xl font-black text-blue-700">{formatCurrency(totals.partnershipPartnerReturn)}</p>
                    <span className="text-slate-600 text-[11px]">
                      {totals.countPartnership > 0 
                        ? `Devolución de Capital (${formatCurrency(totals.partnershipPartnerCapital)}) + Ganancia Dueño (${formatCurrency(totals.partnershipPartnerProfit)}).`
                        : 'Sin participación de animales en compañía en este lote.'}
                    </span>
                  </div>
                </div>

                {/* Firmas de Conformidad */}
                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-300 text-xs">
                  <div className="text-center space-y-1">
                    <div className="border-t border-slate-400 mx-8"></div>
                    <p className="font-bold text-slate-800 mt-2">ADMINISTRADOR / FINCA</p>
                    <p className="text-slate-500">C.C. ___________________</p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="border-t border-slate-400 mx-8"></div>
                    <p className="font-bold text-slate-800 mt-2">DUEÑO DEL ANIMAL O COMPRADOR</p>
                    <p className="text-slate-500">C.C. / NIT: ___________________</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer con Acciones */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {selectedIds.length > 0 ? (
              <span>Lote: <strong>{totals.totalHeads} bovinos</strong> ({totals.countDirect} directos, {totals.countPartnership} en compañía) • Total Venta: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.totalGrossSale)}</strong></span>
            ) : (
              <span>Selecciona los bovinos que vas a liquidar</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            {activeTab === 'selection' && selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Liquidación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {(activeTab === 'preview' || activeTab === 'report') && (
              <button
                type="button"
                onClick={handleConfirmSale}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg transition flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Liquidar Lote Completo</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
