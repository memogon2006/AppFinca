import React from 'react';
import { Scale, TrendingUp, Award, Zap } from 'lucide-react';
import { formatNumber, calculateWeightMetrics } from '../../services/calculations';

export function WeightsView({ cattle = [], weighings = [], onSelectAnimal, onOpenAddWeight, onNavigate }) {
  const activeCattle = cattle.filter(c => c.status === 'Activo');

  const rankedCattle = activeCattle.map(animal => {
    const aWeighs = weighings.filter(w => w.cattleId === animal.id);
    const metrics = calculateWeightMetrics(animal, aWeighs);
    return {
      animal,
      metrics,
    };
  }).sort((a, b) => b.metrics.overallGdp - a.metrics.overallGdp);

  const topGainers = rankedCattle.slice(0, 5);

  const totalBiomass = rankedCattle.reduce((sum, item) => sum + item.metrics.currentWeight, 0);
  const avgWeight = rankedCattle.length > 0 ? (totalBiomass / rankedCattle.length) : 0;
  const avgGdp = rankedCattle.length > 0 
    ? (rankedCattle.reduce((sum, item) => sum + item.metrics.overallGdp, 0) / rankedCattle.length) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Control de Pesajes & Rendimientos (GDP)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitorea la conversión alimenticia, Ganancia Diaria de Peso (kg/día) y evolución de la báscula.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('quickWeigh')}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-300 dark:border-emerald-500/30 transition shadow-sm"
          >
            <Zap className="w-4 h-4" />
            <span>Pesaje Rápido en Báscula</span>
          </button>
        </div>
      </div>

      {/* Métricas Principales de Báscula */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Biomasa Total del Hato</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{formatNumber(totalBiomass, 0)} kg</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">{activeCattle.length} cabezas activas en la finca</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Peso Promedio por Bovino</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{formatNumber(avgWeight, 1)} kg</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">Promedio general del hato</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">GDP Promedio (kg/día)</span>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{formatNumber(avgGdp, 3)} kg/d</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">Ganancia Diaria de Peso promedio</span>
        </div>
      </div>

      {activeCattle.length === 0 ? (
        <div className="custom-card p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
          No hay animales registrados. Ingresa bovinos para calcular ganancias de peso y GDP.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Mejores Ganancias */}
          <div className="custom-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Top Ganancia Diaria (GDP)</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                Líderes
              </span>
            </div>

            <div className="space-y-2.5">
              {topGainers.map(({ animal, metrics }, idx) => (
                <div
                  key={animal.id}
                  onClick={() => onSelectAnimal(animal)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center justify-between cursor-pointer transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{animal.tagNumber}</span>
                      {animal.name && <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">({animal.name})</span>}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{animal.breed} • {animal.productionType}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">+{formatNumber(metrics.overallGdp, 3)} kg/d</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Total: +{metrics.totalGain} kg ({metrics.currentWeight} kg)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla General de Rendimiento */}
          <div className="custom-card p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Registro Detallado por Animal</span>
            </h3>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Arete</th>
                    <th className="p-2.5">Peso Inicial</th>
                    <th className="p-2.5">Peso Actual</th>
                    <th className="p-2.5">Ganancia</th>
                    <th className="p-2.5">GDP</th>
                    <th className="p-2.5 text-right">Pesar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rankedCattle.map(({ animal, metrics }) => (
                    <tr 
                      key={animal.id} 
                      onClick={() => onSelectAnimal(animal)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{animal.tagNumber}</td>
                      <td className="p-2.5">{animal.entryWeight} kg</td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{metrics.currentWeight} kg</td>
                      <td className="p-2.5 font-bold">+{metrics.totalGain} kg</td>
                      <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">{formatNumber(metrics.overallGdp, 3)} kg/d</td>
                      <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenAddWeight(animal)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 transition"
                          title="Registrar Pesaje"
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
