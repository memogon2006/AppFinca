import React, { useState, useMemo } from 'react';
import { Scale, TrendingUp, PlusCircle, Search, Calendar, ChevronDown, ChevronUp, Zap, Tag, Trash2, Target, Flame, AlertTriangle } from 'lucide-react';
import { calculateWeightMetrics, formatNumber } from '../../services/calculations';

export function WeightsView({ cattle = [], weighings = [], onSelectAnimal, onOpenAddWeight, onDeleteWeight, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState(''); // '' | 'ready480' | 'highGdp' | 'lowGdp'
  const [expandedAnimalId, setExpandedAnimalId] = useState(null);

  const activeCattle = cattle.filter(c => c.status === 'Activo');

  // Obtener lista única de Ingreso #
  const entryBatches = useMemo(() => {
    const set = new Set(activeCattle.map(c => c.entryBatch || c.paddock).filter(Boolean));
    return Array.from(set);
  }, [activeCattle]);

  const cattleWithMetrics = useMemo(() => {
    return activeCattle.map(animal => {
      const animalWeighs = weighings.filter(w => w.cattleId === animal.id);
      const metrics = calculateWeightMetrics(animal, animalWeighs);
      return {
        animal,
        metrics,
        weighingsCount: metrics.continuousLogs.length
      };
    });
  }, [activeCattle, weighings]);

  // Métricas Globales del Hato
  const globalStats = useMemo(() => {
    let totalKg = 0;
    let totalGain = 0;
    let totalGdpSum = 0;
    let weighedCount = 0;
    let readyCount = 0;
    let highGdpCount = 0;
    let lowGdpCount = 0;

    cattleWithMetrics.forEach(({ metrics }) => {
      totalKg += metrics.currentWeight;
      totalGain += metrics.totalGain;
      if (metrics.cebaProjection?.isReady) {
        readyCount++;
      }
      if (metrics.overallGdp > 0) {
        totalGdpSum += metrics.overallGdp;
        weighedCount++;
        if (metrics.performance?.level === 'excelente') highGdpCount++;
        if (metrics.performance?.level === 'bajo') lowGdpCount++;
      } else if (metrics.hasWeight) {
        lowGdpCount++;
      }
    });

    const avgWeight = cattleWithMetrics.length > 0 ? totalKg / cattleWithMetrics.length : 0;
    const avgGain = cattleWithMetrics.length > 0 ? totalGain / cattleWithMetrics.length : 0;
    const avgGdp = weighedCount > 0 ? totalGdpSum / weighedCount : 0;

    return { totalKg, avgWeight, avgGain, avgGdp, readyCount, highGdpCount, lowGdpCount };
  }, [cattleWithMetrics]);

  // Filtrado y ordenamiento
  const filteredCattle = useMemo(() => {
    return cattleWithMetrics.filter(({ animal, metrics }) => {
      if (selectedBatch && (animal.entryBatch || animal.paddock) !== selectedBatch) return false;
      
      if (performanceFilter === 'ready480' && !metrics.cebaProjection?.isReady) return false;
      if (performanceFilter === 'highGdp' && metrics.performance?.level !== 'excelente') return false;
      if (performanceFilter === 'lowGdp' && metrics.performance?.level !== 'bajo' && metrics.performance?.level !== 'estancado') return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const tag = (animal.tagNumber || '').toLowerCase();
        const name = (animal.name || '').toLowerCase();
        const brand = (animal.ironBrand || '').toLowerCase();
        const breed = (animal.breed || '').toLowerCase();
        const batch = (animal.entryBatch || animal.paddock || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || brand.includes(q) || breed.includes(q) || batch.includes(q);
      }
      return true;
    }).sort((a, b) => b.metrics.overallGdp - a.metrics.overallGdp);
  }, [cattleWithMetrics, searchTerm, selectedBatch, performanceFilter]);

  const toggleExpand = (animalId, e) => {
    e.stopPropagation();
    setExpandedAnimalId(prev => prev === animalId ? null : animalId);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Control Continuo de Pesajes & Ganancia de Peso</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Días continuos en finca, aumento total desde el Pesaje 1 (Entrada) y ganancia diaria acumulada (GDP).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('quickWeigh')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition min-h-[44px]"
          >
            <Zap className="w-4 h-4" />
            <span>Báscula Rápida</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Pesaje Continuo y Ceba */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">GDP Continuo Hato</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatNumber(globalStats.avgGdp, 3)} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">kg/d</span>
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">Ganancia diaria promedio</span>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-600/50 shadow-sm cursor-pointer hover:border-teal-500 transition" onClick={() => setPerformanceFilter(prev => prev === 'ready480' ? '' : 'ready480')}>
          <span className="text-xs font-black text-teal-800 dark:text-teal-300 uppercase flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-teal-600" /> Listos Venta (≥ 480 kg)
          </span>
          <p className="text-2xl font-black text-teal-950 dark:text-teal-100 mt-1">
            {globalStats.readyCount} <span className="text-xs font-bold text-teal-700 dark:text-teal-300">cabezas</span>
          </p>
          <span className="text-[11px] text-teal-700 dark:text-teal-300 font-bold">Alcanzaron peso de salida</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 shadow-sm cursor-pointer hover:border-emerald-500 transition" onClick={() => setPerformanceFilter(prev => prev === 'highGdp' ? '' : 'highGdp')}>
          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1">
            <span>🚀 Alto Rendimiento</span>
          </span>
          <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
            {globalStats.highGdpCount} <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">cabezas</span>
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">GDP ≥ 0.75 kg/día</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 shadow-sm cursor-pointer hover:border-rose-500 transition" onClick={() => setPerformanceFilter(prev => prev === 'lowGdp' ? '' : 'lowGdp')}>
          <span className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Bajo Rendimiento
          </span>
          <p className="text-2xl font-black text-rose-950 dark:text-rose-200 mt-1">
            {globalStats.lowGdpCount} <span className="text-xs font-bold text-rose-700 dark:text-rose-300">cabezas</span>
          </p>
          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">GDP &lt; 0.370 kg/día</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Biomasa Total Hato</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatNumber(globalStats.totalKg, 0)} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{activeCattle.length} cabezas activas</span>
        </div>
      </div>

      {/* Buscador, Filtro por Ingreso # y Filtros de Ceba */}
      <div className="space-y-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por arete, nombre, hierro, raza o Ingreso #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 min-h-[42px]"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-400 dark:border-emerald-600/50 text-xs font-black text-emerald-800 dark:text-emerald-300 focus:outline-none min-h-[42px]"
          >
            <option value="">🏷️ Todos los Ingresos #</option>
            {entryBatches.map(b => (
              <option key={b} value={b}>Ingreso: {b}</option>
            ))}
          </select>
        </div>

        {/* Píldoras de Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-400 font-extrabold">Filtrar:</span>
          <button
            onClick={() => setPerformanceFilter('')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${!performanceFilter ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Todos ({cattleWithMetrics.length})
          </button>
          <button
            onClick={() => setPerformanceFilter(prev => prev === 'ready480' ? '' : 'ready480')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer border flex items-center gap-1 ${performanceFilter === 'ready480' ? 'bg-teal-600 text-white border-teal-500 shadow-sm font-black' : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700'}`}
          >
            <Target className="w-3 h-3" /> Listos Venta ≥ 480 kg ({globalStats.readyCount})
          </button>
          <button
            onClick={() => setPerformanceFilter(prev => prev === 'highGdp' ? '' : 'highGdp')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer border flex items-center gap-1 ${performanceFilter === 'highGdp' ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-black' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'}`}
          >
            <span>🚀 Alto Rendimiento ({globalStats.highGdpCount})</span>
          </button>
          <button
            onClick={() => setPerformanceFilter(prev => prev === 'lowGdp' ? '' : 'lowGdp')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer border flex items-center gap-1 ${performanceFilter === 'lowGdp' ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-black' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'}`}
          >
            <AlertTriangle className="w-3 h-3" /> Bajo Rendimiento ({globalStats.lowGdpCount})
          </button>
        </div>
      </div>

      {/* Tabla Principal de Control Continuo de Pesos */}
      <div className="custom-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 font-bold min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 uppercase font-black text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Bovino / Arete</th>
                <th className="p-3.5">Ingreso #</th>
                <th className="p-3.5">Fecha Entrada</th>
                <th className="p-3.5">Días en Finca</th>
                <th className="p-3.5">Peso Actual</th>
                <th className="p-3.5">Aumento Total</th>
                <th className="p-3.5">GDP & Rendimiento</th>
                <th className="p-3.5">Meta 480 kg (Ceba)</th>
                <th className="p-3.5 text-center">Historial Completo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCattle.map(({ animal, metrics }) => {
                const isExpanded = expandedAnimalId === animal.id;
                const batch = animal.entryBatch || animal.paddock || 'Ingreso #1';

                return (
                  <React.Fragment key={animal.id}>
                    <tr 
                      onClick={() => onSelectAnimal(animal)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      {/* Arete */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{animal.tagNumber}</span>
                          {animal.name && <span className="text-slate-600 dark:text-slate-400 font-semibold">({animal.name})</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{animal.breed} • {animal.category}</div>
                      </td>

                      {/* Ingreso # */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 text-[11px]">
                          <Tag className="w-3 h-3" /> {batch}
                        </span>
                      </td>

                      {/* Fecha Entrada */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                        {animal.entryDate || '-'}
                      </td>

                      {/* Días en Finca */}
                      <td className="p-3.5 whitespace-nowrap font-black text-blue-700 dark:text-blue-300">
                        {metrics.totalDays} días
                      </td>

                      {/* Peso Actual */}
                      <td className="p-3.5 whitespace-nowrap font-black text-slate-950 dark:text-white">
                        <div className="flex items-center gap-1">
                          <span>{metrics.hasWeight ? `${metrics.currentWeight} kg` : (animal.sex === 'Hembra' ? 'Vientre' : 'Sin pesaje')}</span>
                        </div>
                        {metrics.lastWeighDate && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-0.5 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            <span>Pesaje: {metrics.lastWeighDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Aumento Total */}
                      <td className="p-3.5 whitespace-nowrap font-black text-emerald-700 dark:text-emerald-400">
                        {metrics.hasEntryWeight ? `+${metrics.totalGain} kg` : '-'}
                      </td>

                      {/* GDP & Rendimiento */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-black text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                          <span>{metrics.hasEntryWeight ? `${formatNumber(metrics.overallGdp, 3)} kg/d` : '-'}</span>
                          {metrics.hasEntryWeight && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${metrics.performance.colorBg} ${metrics.performance.colorText}`}>
                              {metrics.performance.icon} {metrics.performance.shortLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Meta 480 kg */}
                      <td className="p-3.5 whitespace-nowrap">
                        {metrics.cebaProjection?.isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-xs bg-emerald-600 text-white shadow-sm animate-pulse">
                            <Target className="w-3 h-3" /> 🎯 Listo ({metrics.currentWeight} kg)
                          </span>
                        ) : metrics.hasWeight && metrics.cebaProjection ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-700 dark:text-slate-300">
                              <span>Faltan {metrics.cebaProjection.remainingKg} kg</span>
                              <span>{metrics.cebaProjection.progressPercentage}%</span>
                            </div>
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${metrics.cebaProjection.progressPercentage}%` }} />
                            </div>
                            {metrics.cebaProjection.daysToTarget && (
                              <div className="text-[9px] text-slate-500 font-bold">~{metrics.cebaProjection.daysToTarget} días (Salida: {metrics.cebaProjection.estimatedDate})</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Botón Historial Continuo */}
                      <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => toggleExpand(animal.id, e)}>
                        <button
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                          title="Ver pesajes continuos desde la entrada"
                        >
                          <span>{metrics.continuousLogs.length} {metrics.continuousLogs.length === 1 ? 'pesaje' : 'pesajes'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* FILA EXPANDIDA: Historial Continuo Completo (Pesaje 1 ➔ Pesaje 2 ➔ Pesaje 3 ➔ ...) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 dark:bg-slate-950/80">
                        <td colSpan="9" className="p-4 border-y border-slate-200 dark:border-slate-800">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Historial Continuo de Pesajes Desde la Entrada • Bovino {animal.tagNumber}
                              </h5>
                              <button
                                onClick={() => onOpenAddWeight(animal)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                              >
                                <PlusCircle className="w-3 h-3" /> Registrar Nuevo Pesaje
                              </button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase">
                                  <tr>
                                    <th className="p-2.5">Pesaje</th>
                                    <th className="p-2.5">Fecha</th>
                                    <th className="p-2.5">Días Totales Desde Entrada</th>
                                    <th className="p-2.5">Peso en Báscula</th>
                                    <th className="p-2.5">Aumento Total Continuo (kg)</th>
                                    <th className="p-2.5">GDP Continuo (kg/día)</th>
                                    <th className="p-2.5">Aumento vs. Pesaje Anterior</th>
                                    <th className="p-2.5">Notas</th>
                                    <th className="p-2.5 text-right">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                  {metrics.continuousLogs.map((log) => {
                                    const canDelete = log.id !== 'entry' && log.id !== 'exit' && onDeleteWeight;
                                    return (
                                      <tr key={log.id || `${log.date}_${log.weight}`} className={log.index === 1 ? 'bg-slate-50/60 dark:bg-slate-900/40 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}>
                                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                          {log.name}
                                        </td>
                                        <td className="p-2.5 font-medium">{log.date}</td>
                                        <td className="p-2.5 font-extrabold text-blue-600 dark:text-blue-400">
                                          {log.daysFromEntry} días
                                        </td>
                                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                          {log.weight} kg
                                        </td>
                                        <td className="p-2.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                                          {log.index === 1 ? '0.0 kg (Inicial)' : `+${log.totalGain} kg`}
                                        </td>
                                        <td className="p-2.5 font-extrabold text-purple-600 dark:text-purple-400">
                                          {log.index === 1 ? '-' : `${formatNumber(log.gdp, 3)} kg/d`}
                                        </td>
                                        <td className="p-2.5 text-slate-700 dark:text-slate-300">
                                          {log.index === 1 ? (
                                            <span className="text-slate-400">-</span>
                                          ) : (
                                            <span className={log.gainFromPrev >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
                                              {log.gainFromPrev >= 0 ? `+${log.gainFromPrev}` : log.gainFromPrev} kg ({log.daysFromPrev}d)
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-slate-500 dark:text-slate-400 italic">{log.notes || '-'}</td>
                                        <td className="p-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                          {canDelete ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`¿Deseas eliminar este registro de pesaje (${log.weight} kg del ${log.date}) del bovino ${animal.tagNumber}?`)) {
                                                  onDeleteWeight(log.weighingId || log.id, animal.id, log.date, log.weight);
                                                }
                                              }}
                                              className="p-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600/80 transition cursor-pointer"
                                              title="Eliminar este pesaje"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          ) : log.id === 'entry' ? (
                                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Inicial</span>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Salida</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
