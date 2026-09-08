import React from 'react';
import { Badge, StatusBadge, FemaleStatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { formatCurrency, formatNumber, formatDate, calculateWeightMetrics, calculateFinancials, calculateReproduction, calculateMilkMetrics } from '../../services/calculations';
import { Scale, DollarSign, Trash2, Tag, Flame, Skull, Milk, ShoppingBag, Calendar, Users, Handshake, Target, Zap } from 'lucide-react';

export function CattleCard({ 
  animal, 
  weighings = [], 
  onSelect, 
  onOpenSell, 
  onOpenAddWeight, 
  onOpenDeath, 
  onDelete,
  onOpenGlossary
}) {
  const animalWeighings = weighings.filter(w => String(w.cattleId) === String(animal.id));
  const weightMetrics = calculateWeightMetrics(animal, animalWeighings);
  const financials = calculateFinancials(animal);
  const repro = calculateReproduction(animal);
  const milk = calculateMilkMetrics(animal);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente al bovino ${animal.tagNumber} (${animal.name || 'Sin nombre'})?\n\nEsta acción borrará también su historial de pesajes.`)) {
      onDelete(animal.id);
    }
  };

  const handleDeath = (e) => {
    e.stopPropagation();
    if (onOpenDeath) {
      onOpenDeath(animal);
    }
  };

  const batchName = animal.entryBatch || animal.paddock || 'Ingreso #1';
  const isReadyForSale = animal.status === 'Activo' && weightMetrics.currentWeight >= 480;
  const isCompanySale = animal.status === 'Vendido' && (animal.exitType === 'En Compañía' || !!animal.partnershipDetails);

  const femaleStatus = animal.femaleStatus || (
    animal.reproductiveStatus === 'Preñada' ? 'Gestación' : animal.milkingStatus === 'En ordeño' ? 'Producción de leche' : 'Vacía'
  );

  const entryWeightFormatted = animal.entryWeight && parseFloat(animal.entryWeight) > 0 
    ? `${animal.entryWeight} kg` 
    : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso inicial');

  const entryPriceFormatted = animal.entryPrice && parseFloat(animal.entryPrice) > 0 
    ? formatCurrency(animal.entryPrice) 
    : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '$0 (Nacido)' : '$0');

  // Cálculos de liquidación en compañía si aplica
  const part = animal.partnershipDetails || (isCompanySale ? {
    entryPrice: parseFloat(animal.entryPrice) || 0,
    exitPrice: parseFloat(animal.exitPrice) || 0,
    profit: Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)),
    farmShare: Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)) * 0.5,
    partnerTotalReturn: (parseFloat(animal.entryPrice) || 0) + (Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)) * 0.5),
  } : null);

  return (
    <div 
      onClick={() => onSelect(animal)}
      className={`custom-card custom-card-hover p-4 sm:p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
        animal.status === 'Muerto' 
          ? 'opacity-85 border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10' 
          : animal.status === 'Vendido'
            ? 'border-amber-400 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400/30'
            : isReadyForSale 
              ? 'border-emerald-500 dark:border-emerald-500/80 bg-gradient-to-b from-emerald-500/10 to-transparent ring-2 ring-emerald-500/20' 
              : ''
      }`}
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

          <div className="flex items-center gap-1 flex-shrink-0">
            <StatusBadge status={animal.status} />

            {animal.status === 'Activo' && (
              <button
                onClick={handleDeath}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Descargar del inventario por muerte"
              >
                <Skull className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Eliminar bovino permanentemente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges de Raza, Propósito, Ingreso # y Estado de Venta */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {batchName}
          </span>

          {/* DISTINCIÓN DESTACADA: VENTA EN COMPAÑÍA VS VENTA DIRECTA */}
          {animal.status === 'Vendido' && (
            isCompanySale ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-400 dark:border-teal-600 flex items-center gap-1 shadow-sm">
                <Users className="w-3 h-3 text-teal-600 dark:text-teal-400" /> 🤝 En Compañía (50/50)
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400" /> 💰 Venta Directa
              </span>
            )
          )}

          {/* ALERTA CEBA LISTO >= 480 kg */}
          {isReadyForSale && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex items-center gap-1 shadow-sm animate-pulse">
              <Target className="w-3.5 h-3.5" /> 🎯 Listo Venta (≥ 480 kg)
            </span>
          )}

          {/* Progreso hacia meta 480 kg si aún no llega */}
          {animal.status === 'Activo' && !isReadyForSale && weightMetrics.hasWeight && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700/60 flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Meta 480 kg: {weightMetrics.cebaProjection.progressPercentage}%
            </span>
          )}

          {animal.status === 'Muerto' && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
              <Skull className="w-3 h-3" /> Baja: {animal.deathDate ? formatDate(animal.deathDate) : 'Fallecido'}
            </span>
          )}

          <ProductionTypeBadge type={animal.productionType} />
          <Badge variant="default">{animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}</Badge>
          
          {animal.sex === 'Hembra' && (
            <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
          )}

          {animal.breed && <Badge variant="default">{animal.breed}</Badge>}
          {animal.isBreedingOnly && <Badge variant="purple">⭐ Solo Cría</Badge>}
        </div>

        {/* Reproducción o Leche si es Hembra */}
        {animal.sex === 'Hembra' && (
          <div className="mb-3 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            {repro.isPregnant ? (
              <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
            ) : femaleStatus === 'Producción de leche' || parseFloat(animal.dailyMilkLiters) > 0 ? (
              <span className="text-blue-700 dark:text-blue-300 font-extrabold flex items-center gap-1">
                <Milk className="w-3.5 h-3.5" /> {animal.dailyMilkLiters || 0} L/día {animal.lactationCycleTotalLiters ? `(${formatNumber(animal.lactationCycleTotalLiters, 0)} L/ciclo)` : ''}
              </span>
            ) : femaleStatus === 'Ceba / Levante / Engorde' || femaleStatus === 'Ceba' || femaleStatus === 'Engorde' ? (
              <span className="text-amber-700 dark:text-amber-400 font-extrabold flex items-center gap-1">
                🥩 Ceba / Engorde
              </span>
            ) : femaleStatus === 'Levante de cría' ? (
              <span className="text-purple-700 dark:text-purple-300 font-bold">👶 Cría al pie</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">⭕ Vacía / Abierta</span>
            )}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{animal.category}</span>
          </div>
        )}
      </div>

      {/* BLOQUE DE INFORMACIÓN: DATOS DE COMPRA / ENTRADA Y RENDIMIENTO */}
      <div className="space-y-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
        
        {/* CASO A: SI EL ANIMAL YA ESTÁ VENDIDO -> MOSTRAR DETALLE DE VENTA Y SI ES EN COMPAÑÍA */}
        {animal.status === 'Vendido' ? (
          <div className="space-y-2">
            {/* Banner de Salida / Venta */}
            <div className={`p-2.5 rounded-xl border text-xs ${
              isCompanySale 
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700' 
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
            }`}>
              <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-1.5 mb-1.5">
                <span className="font-extrabold text-[11px] flex items-center gap-1 text-slate-800 dark:text-slate-100">
                  {isCompanySale ? '🤝 Liquidación en Compañía' : '💰 Liquidación de Venta Directa'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                  {animal.exitDate ? formatDate(animal.exitDate) : 'Fecha N/A'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Venta Bruta ({animal.exitWeight || 0} kg):</span>
                  <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                    {formatCurrency(animal.exitPrice || 0)}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {isCompanySale ? '🏢 Parte Finca (50%):' : 'Utilidad Neta:'}
                  </span>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    {isCompanySale ? formatCurrency(part?.farmShare || 0) : formatCurrency(financials.netProfit)}
                  </p>
                </div>
              </div>

              {/* Si es en compañía, mostrar pago al socio */}
              {isCompanySale && part && (
                <div className="mt-2 pt-1.5 border-t border-teal-200/60 dark:border-teal-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-teal-900 dark:text-teal-200 font-medium">
                    👤 Pago a Dueño del Animal (Capital + 50%):
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(animal.partnershipDetails.partnerTotalReturn)}
                  </span>
                </div>
              )}
            </div>

            {/* Datos compra base */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Scale className="w-3 h-3 text-slate-500" /> Peso Entrada:
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">{entryWeightFormatted}</p>
              </div>

              <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-slate-500" /> Costo Entrada:
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">{entryPriceFormatted}</p>
              </div>
            </div>
          </div>
        ) : (
          /* CASO B: ANIMAL ACTIVO EN FINCA */
          <>
            {/* 1. DATOS INICIALES / COMPRA */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Scale className="w-3 h-3 text-slate-500" /> Peso Inicial / Compra:
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {entryWeightFormatted}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-slate-500" /> Precio Inicial / Compra:
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {entryPriceFormatted}
                </p>
              </div>
            </div>

            {/* 2. PESO ACTUAL (CON FECHA ÚLTIMO PESAJE) & UTILIDAD */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                isReadyForSale 
                  ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600' 
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight flex items-center gap-1">
                    <Scale className={`w-3 h-3 ${isReadyForSale ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} /> 
                    Peso Actual:
                  </span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {weightMetrics.hasWeight ? `${weightMetrics.currentWeight} kg` : (animal.sex === 'Hembra' ? 'Vientre' : 'Sin pesaje')}
                    {weightMetrics.hasEntryWeight && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                        (+{weightMetrics.totalGain} kg)
                      </span>
                    )}
                  </p>
                </div>
                
                {weightMetrics.lastWeighDate && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-0.5 mt-1">
                    <Calendar className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">Fecha: {formatDate(weightMetrics.lastWeighDate)}</span>
                  </span>
                )}
              </div>

              <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400" /> 
                    {animal.status === 'Muerto' ? 'Pérdida:' : animal.status === 'Vendido' ? 'Utilidad Real:' : 'Utilidad Proy.:'}
                  </span>
                  <p className={`text-xs sm:text-sm font-black mt-0.5 ${financials.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(financials.netProfit)}
                  </p>
                </div>

                <div className="mt-1 flex flex-col gap-0.5">
                  <span 
                    onClick={(e) => {
                      if (onOpenGlossary) {
                        e.stopPropagation();
                        onOpenGlossary();
                      }
                    }}
                    title="ROI: Retorno sobre la Inversión (% ganancia neta sobre dinero invertido)"
                    className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold hover:text-blue-600 dark:hover:text-blue-300 transition"
                  >
                    ROI: {financials.roi}% ℹ️
                  </span>
                  {financials.pricePerKgUsed > 0 && (
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 px-1 py-0.5 rounded text-center truncate">
                      {formatCurrency(financials.pricePerKgUsed)}/kg {animal.status === 'Vendido' ? '(Venta)' : '(Base)'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer info: GDP continuo y Días en finca */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap gap-1">
          {weightMetrics.hasEntryWeight ? (
            <div className="flex items-center gap-1.5">
              <span 
                onClick={(e) => {
                  if (onOpenGlossary) {
                    e.stopPropagation();
                    onOpenGlossary();
                  }
                }}
                title="GDP: Ganancia Diaria de Peso (kg de carne ganados por día)"
                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition font-bold"
              >
                GDP: <strong className="text-blue-600 dark:text-blue-400">{formatNumber(weightMetrics.overallGdp, 3)} kg/d</strong>
              </span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${weightMetrics.performance.colorBg} ${weightMetrics.performance.colorText}`} title={weightMetrics.performance.label}>
                {weightMetrics.performance.icon} {weightMetrics.performance.shortLabel}
              </span>
            </div>
          ) : (
            <span className="text-purple-600 dark:text-purple-400 font-medium">🐄 {animal.femaleStatus || 'Vientre Cría'}</span>
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {animal.status === 'Vendido' ? `Salió a los ${weightMetrics.totalDays} días` : `${weightMetrics.totalDays} días en finca`}
          </span>
        </div>
      </div>

    </div>
  );
}
