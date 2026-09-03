import React, { useState } from 'react';
import { HeartHandshake, Milk, Sparkles, PlusCircle, Baby, Tag, CircleDot, Activity } from 'lucide-react';
import { Badge, FemaleStatusBadge, ReproductiveBadge, MilkingBadge } from '../Common/Badge';
import { calculateReproduction, calculateMilkMetrics, formatNumber } from '../../services/calculations';

export function FemalesView({ cattle = [], onSelectAnimal, onOpenNewAnimal }) {
  const [subTab, setSubTab] = useState('all');

  const femaleCattle = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');

  // Clasificación por los 4 estados principales de hembra
  const milkingFemales = femaleCattle.filter(c => 
    c.femaleStatus === 'Producción de leche' || c.milkingStatus === 'En ordeño' || (parseFloat(c.dailyMilkLiters) > 0)
  );
  
  const pregnantFemales = femaleCattle.filter(c => 
    c.femaleStatus === 'Gestación' || c.reproductiveStatus === 'Preñada' || c.reproductiveStatus === 'Gestación'
  );
  
  const calfRaisingFemales = femaleCattle.filter(c => 
    c.femaleStatus === 'Levante de cría' || (c.isBreedingOnly && c.femaleStatus !== 'Producción de leche' && c.femaleStatus !== 'Gestación')
  );
  
  const openFemales = femaleCattle.filter(c => 
    c.femaleStatus === 'Vacía' || (!c.femaleStatus && c.reproductiveStatus === 'Vacía' && c.milkingStatus !== 'En ordeño')
  );

  const totalMilkToday = milkingFemales.reduce((sum, c) => sum + (parseFloat(c.dailyMilkLiters) || 0), 0);
  const avgMilkPerCow = milkingFemales.length > 0 ? (totalMilkToday / milkingFemales.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Control de Hembras • Lechería, Cría & Reproducción</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo de producción de leche, levante de cría, gestaciones (+283d) y hembras vacías.
          </p>
        </div>

        <button
          onClick={onOpenNewAnimal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Hembra</span>
        </button>
      </div>

      {/* KPI Cards de Estados de Hembras */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        
        {/* 1. Producción de Leche */}
        <div 
          onClick={() => setSubTab('milking')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${subTab === 'milking' ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1">
            <Milk className="w-3.5 h-3.5" /> En Producción Leche
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{milkingFemales.length}</p>
          <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            {formatNumber(totalMilkToday, 1)} L/día ({avgMilkPerCow} L/vaca)
          </span>
        </div>

        {/* 2. Gestación */}
        <div 
          onClick={() => setSubTab('pregnant')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${subTab === 'pregnant' ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1">
            <Baby className="w-3.5 h-3.5" /> En Gestación
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{pregnantFemales.length}</p>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Preñadas (+283 días)</span>
        </div>

        {/* 3. Levante de Cría */}
        <div 
          onClick={() => setSubTab('calfRaising')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${subTab === 'calfRaising' ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-purple-800 dark:text-purple-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Levante de Cría
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{calfRaisingFemales.length}</p>
          <span className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 font-medium">Amamantando / Cría al pie</span>
        </div>

        {/* 4. Vacías */}
        <div 
          onClick={() => setSubTab('open')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${subTab === 'open' ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
            <CircleDot className="w-3.5 h-3.5" /> Vacías / Reposo
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{openFemales.length}</p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">Listas para servicio</span>
        </div>

        {/* 5. Total Hembras */}
        <div 
          onClick={() => setSubTab('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer col-span-2 sm:col-span-4 lg:col-span-1 transition ${subTab === 'all' ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-[11px] sm:text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5" /> Total Hembras
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{femaleCattle.length}</p>
          <span className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Inventario activo</span>
        </div>
      </div>

      {/* Sub-Pestañas de Navegación */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `Todas (${femaleCattle.length})`, icon: HeartHandshake },
          { id: 'milking', label: `🥛 En Producción de Leche (${milkingFemales.length})`, icon: Milk },
          { id: 'pregnant', label: `🤰 En Gestación (${pregnantFemales.length})`, icon: Baby },
          { id: 'calfRaising', label: `👶 Levante de Cría (${calfRaisingFemales.length})`, icon: Sparkles },
          { id: 'open', label: `⭕ Vacías (${openFemales.length})`, icon: CircleDot },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] cursor-pointer ${
                isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}

      {/* 1. PRODUCCIÓN DE LECHE */}
      {subTab === 'milking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {milkingFemales.map(cow => {
              const batch = cow.entryBatch || cow.paddock || 'Ingreso #1';
              const milk = calculateMilkMetrics(cow);

              return (
                <div
                  key={cow.id}
                  onClick={() => onSelectAnimal(cow)}
                  className="custom-card p-5 cursor-pointer hover:border-blue-400 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                        {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300">({cow.name})</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.category}</p>
                    </div>
                    <Badge variant="blue">🥛 En Leche</Badge>
                  </div>

                  {/* Panel de Métricas de Leche */}
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Producción Actual / Día:</span>
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {milk.dailyLiters} L/día
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200 dark:border-blue-500/20 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Litros / Ciclo Productivo:</span>
                        <span className="font-extrabold text-blue-700 dark:text-blue-300">
                          {formatNumber(milk.cycleTotalLiters, 0)} Litros
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Promedio Ciclo:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {milk.cycleAvgDaily} L/día
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Dueño: <strong>{cow.owner}</strong></span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Tag className="w-3 h-3" /> {batch}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {milkingFemales.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No hay hembras marcadas en producción de leche actualmente.
            </div>
          )}
        </div>
      )}

      {/* 2. GESTACIÓN / PREÑADAS */}
      {subTab === 'pregnant' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pregnantFemales.map(cow => {
              const repro = calculateReproduction(cow);
              const isUrgent = repro.daysUntilCalving !== null && repro.daysUntilCalving <= 15;
              const batch = cow.entryBatch || cow.paddock || 'Ingreso #1';

              return (
                <div
                  key={cow.id}
                  onClick={() => onSelectAnimal(cow)}
                  className={`custom-card p-5 cursor-pointer hover:border-emerald-400 transition space-y-3 ${isUrgent ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                        {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300">({cow.name})</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.owner}</p>
                    </div>
                    {isUrgent ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold animate-pulse">
                        ¡Parto Cercano!
                      </span>
                    ) : (
                      <Badge variant="emerald">🤰 Gestante</Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Fecha Servicio:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{cow.serviceDate || 'Sin registrar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Días Gestación:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">{repro.daysPregnant} días</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Parto Estimado (+283d):</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{repro.expectedCalvingDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>{repro.statusLabel}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Tag className="w-3 h-3" /> {batch}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {pregnantFemales.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No hay hembras con gestación registrada actualmente.
            </div>
          )}
        </div>
      )}

      {/* 3. LEVANTE DE CRÍA */}
      {subTab === 'calfRaising' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calfRaisingFemales.map(cow => {
              const batch = cow.entryBatch || cow.paddock || 'Ingreso #1';
              return (
                <div
                  key={cow.id}
                  onClick={() => onSelectAnimal(cow)}
                  className="custom-card p-5 cursor-pointer hover:border-purple-400 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                        {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300">({cow.name})</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.owner}</p>
                    </div>
                    <Badge variant="purple">👶 Levante de Cría</Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                      <span className="font-bold text-purple-900 dark:text-purple-200">Amamantando / Cría al pie</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Peso Actual:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{cow.currentWeight || cow.entryWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Ingreso #:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{batch}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{cow.category}</span>
                    <span>{cow.color || 'Sin señas'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {calfRaisingFemales.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No hay hembras marcadas en levante de cría.
            </div>
          )}
        </div>
      )}

      {/* 4. VACÍAS / REPOSO */}
      {subTab === 'open' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openFemales.map(cow => {
              const batch = cow.entryBatch || cow.paddock || 'Ingreso #1';
              return (
                <div
                  key={cow.id}
                  onClick={() => onSelectAnimal(cow)}
                  className="custom-card p-5 cursor-pointer hover:border-slate-400 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                        {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300">({cow.name})</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.owner}</p>
                    </div>
                    <Badge variant="gray">⭕ Vacía / Abierta</Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Condición:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Lista para monta / inseminación</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Peso Actual:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{cow.currentWeight || cow.entryWeight} kg</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{cow.category}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Tag className="w-3 h-3" /> {batch}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {openFemales.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No hay hembras vacías registradas.
            </div>
          )}
        </div>
      )}

      {/* 5. TODAS LAS HEMBRAS */}
      {subTab === 'all' && (
        <div className="custom-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Arete / Nombre</th>
                  <th className="p-3">Ingreso #</th>
                  <th className="p-3">Estado de la Hembra</th>
                  <th className="p-3">Raza & Categoría</th>
                  <th className="p-3">Lechería (L/día)</th>
                  <th className="p-3">Ciclo Productivo</th>
                  <th className="p-3">Peso Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {femaleCattle.map(cow => {
                  const milk = calculateMilkMetrics(cow);
                  const femaleStatus = cow.femaleStatus || (
                    cow.reproductiveStatus === 'Preñada' ? 'Gestación' : cow.milkingStatus === 'En ordeño' ? 'Producción de leche' : 'Vacía'
                  );

                  return (
                    <tr
                      key={cow.id}
                      onClick={() => onSelectAnimal(cow)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {cow.tagNumber} {cow.name && <span className="text-slate-500 dark:text-slate-400 font-normal">({cow.name})</span>}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 text-[11px]">
                          <Tag className="w-3 h-3" /> {cow.entryBatch || cow.paddock || 'Ingreso #1'}
                        </span>
                      </td>
                      <td className="p-3">
                        <FemaleStatusBadge status={femaleStatus} liters={cow.dailyMilkLiters} />
                      </td>
                      <td className="p-3">
                        <div className="font-semibold">{cow.breed}</div>
                        <div className="text-[10px] text-slate-500">{cow.category}</div>
                      </td>
                      <td className="p-3 font-extrabold text-blue-600 dark:text-blue-400">
                        {parseFloat(cow.dailyMilkLiters) > 0 ? `${cow.dailyMilkLiters} L/d` : '-'}
                      </td>
                      <td className="p-3">
                        {parseFloat(cow.lactationCycleTotalLiters) > 0 ? (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(cow.lactationCycleTotalLiters, 0)} L</span>
                            <span className="text-[10px] text-emerald-600 block">Prom: {cow.lactationCycleAvgLiters || milk.cycleAvgDaily} L/d</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{cow.currentWeight || cow.entryWeight} kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
