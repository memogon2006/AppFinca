import React, { useState, useMemo } from 'react';
import { 
  Leaf, 
  PlusCircle, 
  ArrowRightLeft, 
  Calculator, 
  Search, 
  Filter, 
  MapPin, 
  Droplets, 
  Clock, 
  Sun, 
  Zap, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Sparkles,
  TrendingUp,
  Layers,
  Info,
  Calendar
} from 'lucide-react';
import { formatDate } from '../../services/calculations';
import { PaddockFormModal } from './PaddockFormModal';
import { RotateBatchModal } from './RotateBatchModal';
import { ForageCalculatorModal } from './ForageCalculatorModal';

export function PaddocksView({
  paddocks = [],
  cattle = [],
  onSavePaddock,
  onDeletePaddock,
  onRotateBatch,
  isWorker = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'descanso' | 'ocupado' | 'mantenimiento' | 'ready'
  
  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPaddock, setEditingPaddock] = useState(null);
  
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [rotationOriginId, setRotationOriginId] = useState(null);

  const [isForageCalcOpen, setIsForageCalcOpen] = useState(false);
  const [calculatorPaddock, setCalculatorPaddock] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  // Métricas zootécnicas de días de descanso / pastoreo
  const getPaddockMetrics = (p) => {
    let restDays = 0;
    let grazingDays = 0;
    
    if (p.lastRestStartDate) {
      const diff = Math.floor((new Date(today) - new Date(p.lastRestStartDate)) / (1000 * 60 * 60 * 24));
      restDays = Math.max(0, diff);
    }
    
    if (p.entryDate) {
      const diff = Math.floor((new Date(today) - new Date(p.entryDate)) / (1000 * 60 * 60 * 24));
      grazingDays = Math.max(0, diff);
    }

    const targetRest = p.targetRestDays || 30;
    const targetGrazing = p.targetGrazingDays || 3;
    const isRestCompleted = restDays >= targetRest;
    const isGrazingExceeded = grazingDays > targetGrazing;

    // Animales activos en este potrero o lote
    const activeAnimals = cattle.filter(c => 
      c.status === 'Activo' && 
      ((p.currentBatchName && c.entryBatch === p.currentBatchName) || c.paddock === p.name)
    );

    return {
      restDays,
      grazingDays,
      targetRest,
      targetGrazing,
      isRestCompleted,
      isGrazingExceeded,
      activeAnimalsCount: activeAnimals.length,
    };
  };

  // KPI Generales
  const totalAreaHa = useMemo(() => {
    return Math.round(paddocks.reduce((acc, p) => acc + (parseFloat(p.areaHa) || 0), 0) * 10) / 10;
  }, [paddocks]);

  const activeCattleCount = useMemo(() => {
    return cattle.filter(c => c.status === 'Activo').length;
  }, [cattle]);

  const stockingRate = totalAreaHa > 0 ? Math.round((activeCattleCount / totalAreaHa) * 10) / 10 : 0;

  const restingPaddocks = paddocks.filter(p => p.status === 'descanso');
  const occupiedPaddocks = paddocks.filter(p => p.status === 'ocupado');
  const maintenancePaddocks = paddocks.filter(p => p.status === 'mantenimiento');
  const readyPaddocks = restingPaddocks.filter(p => {
    const m = getPaddockMetrics(p);
    return m.isRestCompleted;
  });

  // Filtrado de Potreros
  const filteredPaddocks = useMemo(() => {
    return paddocks.filter(p => {
      // Filtro de estado
      if (statusFilter === 'ready') {
        const m = getPaddockMetrics(p);
        if (p.status !== 'descanso' || !m.isRestCompleted) return false;
      } else if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      // Filtro de búsqueda
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.pastureType || '').toLowerCase().includes(q) ||
        (p.waterSource || '').toLowerCase().includes(q) ||
        (p.currentBatchName || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    });
  }, [paddocks, statusFilter, searchQuery]);

  const handleOpenNew = () => {
    setEditingPaddock(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPaddock(p);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (p) => {
    if (window.confirm(`¿Estás seguro de eliminar el potrero "${p.name}"?`)) {
      await onDeletePaddock(p.id);
    }
  };

  const handleOpenRotate = (originPaddockId = null) => {
    setRotationOriginId(originPaddockId);
    setIsRotateModalOpen(true);
  };

  const handleOpenCalculator = (p = null) => {
    setCalculatorPaddock(p);
    setIsForageCalcOpen(true);
  };

  const handleApplyGrazingDays = async (paddockId, days) => {
    const target = paddocks.find(p => String(p.id) === String(paddockId));
    if (target) {
      await onSavePaddock({
        ...target,
        targetGrazingDays: days,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. CABECERA & BOTONES PRINCIPALES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Potreros & Pastoreo Rotacional</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {paddocks.length} {paddocks.length === 1 ? 'potrero' : 'potreros'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                Control de descansos, periodos de ocupación, aforo 1m² y rotación inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            type="button"
            onClick={() => handleOpenCalculator(null)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Calcular aforo en marco de 1m2 y carga animal"
          >
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Calculadora Aforo 1m²</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenRotate(null)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-teal-700/20 active:scale-95 transition cursor-pointer"
            title="Mover lote de ganado a otro potrero"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Rotar Lote</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nuevo Potrero</span>
          </button>

        </div>
      </div>

      {/* 2. TARJETAS KPI RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Área */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider">Área Total Pastoreo</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalAreaHa}</span>
            <span className="text-xs font-bold text-slate-500">ha</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Carga Global: <strong>{stockingRate} cab/ha</strong>
          </p>
        </div>

        {/* En Descanso / Listos */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-xs font-black uppercase tracking-wider">En Descanso (Reposo)</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{restingPaddocks.length}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ({readyPaddocks.length} listos ✅)
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
            {Math.round(restingPaddocks.reduce((acc, p) => acc + (parseFloat(p.areaHa) || 0), 0) * 10) / 10} ha recuperándose
          </p>
        </div>

        {/* Ocupados / Pastoreo */}
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
            <span className="text-xs font-black uppercase tracking-wider">Ocupados (Pastando)</span>
            <Boxes className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{occupiedPaddocks.length}</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">potreros</span>
          </div>
          <p className="text-[11px] text-rose-800 dark:text-rose-400 font-medium">
            {Math.round(occupiedPaddocks.reduce((acc, p) => acc + (parseFloat(p.areaHa) || 0), 0) * 10) / 10} ha bajo pastoreo
          </p>
        </div>

        {/* Mantenimiento */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
            <span className="text-xs font-black uppercase tracking-wider">En Mantenimiento</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{maintenancePaddocks.length}</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">potreros</span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
            Cercas, guadaña o siembra
          </p>
        </div>

      </div>

      {/* 3. FILTROS & BÚSQUEDA */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, pasto, lote..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 pl-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Píldoras de Estado */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({paddocks.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('descanso')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'descanso'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span>🟢 En Descanso</span>
            <span>({restingPaddocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'ready'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100'
            }`}
            title="Potreros que ya completaron sus días meta de descanso"
          >
            <span>✅ Listos para Pastoreo</span>
            <span>({readyPaddocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ocupado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'ocupado'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <span>🔴 Ocupados</span>
            <span>({occupiedPaddocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('mantenimiento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'mantenimiento'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <span>🟡 Mantenimiento</span>
            <span>({maintenancePaddocks.length})</span>
          </button>

        </div>

      </div>

      {/* 4. LISTA O GRID DE POTREROS */}
      {filteredPaddocks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Leaf className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {paddocks.length === 0 ? '¡No tienes potreros registrados todavía!' : 'No se encontraron potreros con este filtro'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              {paddocks.length === 0 
                ? 'Registra tus potreros para controlar descansos, pastoreos, fuentes de agua y rotaciones de tus lotes con precisión.'
                : 'Prueba cambiando los criterios de búsqueda o seleccionando otra pestaña de estado.'}
            </p>
          </div>
          {paddocks.length === 0 && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Mi Primer Potrero</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPaddocks.map((p) => {
            const m = getPaddockMetrics(p);
            const areaM2 = (parseFloat(p.areaHa) || 0) * 10000;

            // Progreso de Descanso o Pastoreo
            const restProgressPct = Math.min(100, Math.round((m.restDays / m.targetRest) * 100));
            const grazingProgressPct = Math.min(100, Math.round((m.grazingDays / m.targetGrazing) * 100));

            return (
              <div
                key={p.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-800/90 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 ${
                  p.status === 'ocupado'
                    ? 'border-rose-300/80 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : m.isRestCompleted
                      ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                        <span className="text-emerald-700 dark:text-emerald-300 font-black">{p.areaHa} ha</span>
                        <span>•</span>
                        <span>{areaM2.toLocaleString('es-CO')} m²</span>
                      </div>
                    </div>

                    {/* Badge de Estado */}
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 shadow-sm ${
                      p.status === 'descanso'
                        ? m.isRestCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                        : p.status === 'ocupado'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200'
                    }`}>
                      {p.status === 'descanso' && (m.isRestCompleted ? '✅ Listo para Pastar' : '🟢 En Descanso')}
                      {p.status === 'ocupado' && '🔴 Ocupado'}
                      {p.status === 'mantenimiento' && '🟡 Mantenimiento'}
                    </span>
                  </div>

                  {/* Badges de Pasto, Agua y Cerca */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {p.pastureType && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        <span className="truncate max-w-[140px]">{p.pastureType}</span>
                      </span>
                    )}
                    {p.waterSource && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-800 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-600" />
                        <span className="truncate max-w-[120px]">{p.waterSource}</span>
                      </span>
                    )}
                    {p.fencingType && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{p.fencingType}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Semáforo / Días de Descanso u Ocupación */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  
                  {p.status === 'ocupado' ? (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Boxes className="w-3.5 h-3.5 text-rose-600" />
                          <span>Lote: <strong>{p.currentBatchName || 'Activo'}</strong></span>
                        </span>
                        <span className="font-black text-rose-600 dark:text-rose-400">
                          {m.activeAnimalsCount} {m.activeAnimalsCount === 1 ? 'bovino' : 'bovinos'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        <span>Pastoreando: <strong>{m.grazingDays} días</strong></span>
                        <span>Meta máx: {m.targetGrazing} días</span>
                      </div>

                      {/* Barra de progreso de pastoreo */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            m.isGrazingExceeded ? 'bg-rose-600 animate-pulse' : 'bg-rose-500'
                          }`}
                          style={{ width: `${grazingProgressPct}%` }}
                        />
                      </div>

                      {m.isGrazingExceeded ? (
                        <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>¡Pastoreo excedido por {m.grazingDays - m.targetGrazing} días! Rotar de inmediato.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-1">
                          {m.targetGrazing - m.grazingDays > 0 
                            ? `Le quedan aprox. ${m.targetGrazing - m.grazingDays} días de pastoreo ideal.`
                            : 'Cumplió el tiempo de pastoreo recomendado.'}
                        </p>
                      )}
                    </div>
                  ) : p.status === 'descanso' ? (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 mb-1">
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Descanso: <strong>{m.restDays} días</strong></span>
                        </span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300">
                          Meta: {m.targetRest} días
                        </span>
                      </div>

                      {/* Barra de progreso de descanso */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            m.isRestCompleted ? 'bg-emerald-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${restProgressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] mt-1.5">
                        {m.isRestCompleted ? (
                          <span className="font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Pasto recuperado con éxito ({restProgressPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            Faltan {m.targetRest - m.restDays} días para descanso óptimo
                          </span>
                        )}
                        <span className="font-bold text-slate-400">{restProgressPct}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                      <p className="font-bold">Potrero en Mantenimiento</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">
                        "{p.notes || 'Labores agrícolas / control de malezas'}"
                      </p>
                    </div>
                  )}

                </div>

                {/* Acciones de la Tarjeta */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                  
                  {/* Botón de Acción Principal de la Tarjeta */}
                  {p.status === 'ocupado' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenRotate(p.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Rotar Lote</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenRotate(null)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Meter Lote</span>
                    </button>
                  )}

                  {/* Acciones secundarias: Aforar, Editar, Eliminar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCalculator(p)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-700 text-slate-600 hover:text-emerald-700 dark:text-slate-300 transition cursor-pointer"
                      title="Calcular aforo de forraje para este potrero"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      title="Editar información del potrero"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {!isWorker && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-700 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Eliminar potrero"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODALES DEL MÓDULO */}
      {isFormModalOpen && (
        <PaddockFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          editingPaddock={editingPaddock}
          onSavePaddock={onSavePaddock}
          cattle={cattle}
        />
      )}

      {isRotateModalOpen && (
        <RotateBatchModal
          isOpen={isRotateModalOpen}
          onClose={() => setIsRotateModalOpen(false)}
          paddocks={paddocks}
          cattle={cattle}
          initialFromPaddockId={rotationOriginId}
          onConfirmRotation={onRotateBatch}
        />
      )}

      {isForageCalcOpen && (
        <ForageCalculatorModal
          isOpen={isForageCalcOpen}
          onClose={() => setIsForageCalcOpen(false)}
          paddocks={paddocks}
          selectedPaddock={calculatorPaddock}
          cattle={cattle}
          onApplyGrazingDays={handleApplyGrazingDays}
        />
      )}

    </div>
  );
}
