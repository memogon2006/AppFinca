import React, { useState, useMemo } from 'react';
import { Scale, TrendingUp, PlusCircle, Search, Calendar, ChevronDown, ChevronUp, Zap, Tag, Trash2 } from 'lucide-react';
import { calculateWeightMetrics, formatNumber } from '../../services/calculations';

export function WeightsView({ cattle = [], weighings = [], onSelectAnimal, onOpenAddWeight, onDeleteWeight, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
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
    let totalDays = 0;

    cattleWithMetrics.forEach(({ metrics }) => {
      totalKg += metrics.currentWeight;
      totalGain += metrics.totalGain;
      totalDays += metrics.totalDays;
    });

    const avgWeight = cattleWithMetrics.length > 0 ? totalKg / cattleWithMetrics.length : 0;
    const avgGain = cattleWithMetrics.length > 0 ? totalGain / cattleWithMetrics.length : 0;
    const avgDays = cattleWithMetrics.length > 0 ? totalDays / cattleWithMetrics.length : 0;
    const avgGdp = avgDays > 0 ? avgGain / avgDays : 0;

    return { totalKg, avgWeight, avgGain, avgGdp };
  }, [cattleWithMetrics]);

  // Filtrado y ordenamiento
  const filteredCattle = useMemo(() => {
    return cattleWithMetrics.filter(({ animal }) => {
      if (selectedBatch && (animal.entryBatch || animal.paddock) !== selectedBatch) return false;
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
  }, [cattleWithMetrics, searchTerm, selectedBatch]);

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

      {/* Tarjetas KPI de Pesaje Continuo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">GDP Continuo Hato</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatNumber(globalStats.avgGdp, 3)} <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">kg/día</span>
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ganancia diaria acumulada</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 shadow-sm">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase">Aumento Promedio</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            +{formatNumber(globalStats.avgGain, 1)} <span className="text-xs font-medium text-blue-600 dark:text-blue-400">kg</span>
          </p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Ganados desde pesaje inicial</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 shadow-sm">
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase">Peso Promedio Actual</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatNumber(globalStats.avgWeight, 1)} <span className="text-xs font-medium text-purple-600 dark:text-purple-400">kg</span>
          </p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Por cabeza activa</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Biomasa Total Hato</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatNumber(globalStats.totalKg, 0)} <span className="text-xs font-medium text-slate-500 dark:text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{activeCattle.length} cabezas en finca</span>
        </div>
      </div>

      {/* Buscador y Filtro por Ingreso # */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por arete, nombre, hierro, raza o Ingreso #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 min-h-[42px]"
          />
        </div>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-400 dark:border-emerald-600/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none min-h-[42px]"
        >
          <option value="">🏷️ Todos los Ingresos #</option>
          {entryBatches.map(b => (
            <option key={b} value={b}>Ingreso: {b}</option>
          ))}
        </select>
      </div>

      {/* Tabla Principal de Control Continuo de Pesos */}
      <div className="custom-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Bovino / Arete</th>
                <th className="p-3.5">Ingreso #</th>
                <th className="p-3.5">Fecha Entrada (Pesaje 1)</th>
                <th className="p-3.5">Días Totales en Finca</th>
                <th className="p-3.5">Peso Entrada</th>
                <th className="p-3.5">Peso Actual</th>
                <th className="p-3.5">Aumento Total Continuo</th>
                <th className="p-3.5">GDP Continuo (kg/día)</th>
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
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{animal.tagNumber}</span>
                          {animal.name && <span className="text-slate-500 dark:text-slate-400 font-normal">({animal.name})</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">{animal.breed} • {animal.category}</div>
                      </td>

                      {/* Ingreso # */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 text-[11px]">
                          <Tag className="w-3 h-3" /> {batch}
                        </span>
                      </td>

                      {/* Fecha Entrada */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {animal.entryDate}
                      </td>

                      {/* DÍAS TOTALES EN FINCA */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {metrics.totalDays} días
                        </span>
                      </td>

                      {/* Peso Entrada */}
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {animal.entryWeight} kg
                      </td>

                      {/* Peso Actual */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div>{metrics.currentWeight} kg</div>
                        {metrics.lastWeighDate && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            <span>Pesaje: {metrics.lastWeighDate}</span>
                          </div>
                        )}
                      </td>

                      {/* AUMENTO TOTAL CONTINUO */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          +{metrics.totalGain} kg
                        </span>
                        <div className="text-[10px] text-slate-400">Desde entrada</div>
                      </td>

                      {/* GDP CONTINUO */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-500/30">
                          {formatNumber(metrics.overallGdp, 3)} kg/d
                        </span>
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
