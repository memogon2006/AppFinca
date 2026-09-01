import React from 'react';
import { Badge, StatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { formatCurrency, formatNumber, calculateWeightMetrics, calculateFinancials, calculateReproduction } from '../../services/calculations';
import { Scale, DollarSign, Trash2, Tag } from 'lucide-react';

export function CattleCard({ animal, weighings = [], onSelect, onOpenSell, onOpenAddWeight, onDelete }) {
  const animalWeighings = weighings.filter(w => w.cattleId === animal.id);
  const weightMetrics = calculateWeightMetrics(animal, animalWeighings);
  const financials = calculateFinancials(animal);
  const repro = calculateReproduction(animal);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente al bovino ${animal.tagNumber} (${animal.name || 'Sin nombre'})?\n\nEsta acción borrará también su historial de pesajes.`)) {
      onDelete(animal.id);
    }
  };

  const batchName = animal.entryBatch || animal.paddock || 'Ingreso #1';

  return (
    <div 
      onClick={() => onSelect(animal)}
      className="custom-card custom-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      {/* Top Banner Tag & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                {animal.tagNumber}
              </span>
              {animal.name && (
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                  ({animal.name})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Hierro: <strong className="text-slate-700 dark:text-slate-200">{animal.ironBrand || 'N/A'}</strong> • {animal.owner}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={animal.status} />
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Eliminar bovino"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges de Raza, Propósito e Ingreso # */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {batchName}
          </span>
          <ProductionTypeBadge type={animal.productionType} />
          <Badge variant="default">{animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</Badge>
          <Badge variant="default">{animal.breed}</Badge>
          {animal.isBreedingOnly && <Badge variant="purple">⭐ Solo Cría</Badge>}
        </div>

        {/* Reproducción o Leche si es Hembra */}
        {animal.sex === 'Hembra' && (animal.reproductiveStatus === 'Preñada' || animal.milkingStatus === 'En ordeño') && (
          <div className="mb-3.5 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 flex flex-wrap items-center gap-2 text-xs">
            {animal.reproductiveStatus === 'Preñada' && (
              <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
            )}
            {animal.milkingStatus === 'En ordeño' && (
              <MilkingBadge status={animal.milkingStatus} liters={animal.dailyMilkLiters} />
            )}
          </div>
        )}
      </div>

      {/* Métricas de Peso & Utilidades */}
      <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Peso Actual:
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {weightMetrics.currentWeight} kg
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                (+{weightMetrics.totalGain} kg)
              </span>
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> 
              {animal.status === 'Vendido' ? 'Utilidad Real:' : 'Utilidad Proy.:'}
            </span>
            <p className={`text-sm font-bold mt-0.5 ${financials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
          </div>
        </div>

        {/* Footer info: GDP y Fecha de Ingreso */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span>GDP: <strong className="text-blue-600 dark:text-blue-400">{formatNumber(weightMetrics.overallGdp, 3)} kg/d</strong></span>
          <span className="truncate max-w-[130px]">Entrada: {animal.entryDate}</span>
        </div>
      </div>

    </div>
  );
}
