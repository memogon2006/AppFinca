import React, { useState } from 'react';
import { HeartHandshake, Milk, Sparkles, PlusCircle, Baby, Tag } from 'lucide-react';
import { Badge, ReproductiveBadge, MilkingBadge } from '../Common/Badge';
import { calculateReproduction, formatNumber } from '../../services/calculations';

export function FemalesView({ cattle = [], onSelectAnimal, onOpenNewAnimal }) {
  const [subTab, setSubTab] = useState('pregnant');

  const femaleCattle = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');

  const pregnantFemales = femaleCattle.filter(c => c.reproductiveStatus === 'Preñada');
  const milkingFemales = femaleCattle.filter(c => c.milkingStatus === 'En ordeño');
  const breedingOnlyFemales = femaleCattle.filter(c => c.isBreedingOnly);
  const openFemales = femaleCattle.filter(c => c.reproductiveStatus === 'Vacía');

  const totalMilkToday = milkingFemales.reduce((sum, c) => sum + (parseFloat(c.dailyMilkLiters) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Módulo de Hembras, Reproducción & Lechería</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control de gestaciones, fechas estimadas de parto (+283 días), curvas de ordeño y vientres de cría.
          </p>
        </div>

        <button
          onClick={onOpenNewAnimal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition self-start sm:self-auto min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Hembra</span>
        </button>
      </div>

      {/* KPI Cards de Hembras */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setSubTab('pregnant')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${subTab === 'pregnant' ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase">Preñadas (Gestantes)</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{pregnantFemales.length}</p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Con fecha probable de parto</span>
        </div>

        <div 
          onClick={() => setSubTab('milking')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${subTab === 'milking' ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase">En Ordeño Activo</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{milkingFemales.length}</p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{formatNumber(totalMilkToday, 1)} L/día totales</span>
        </div>

        <div 
          onClick={() => setSubTab('breeding')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${subTab === 'breeding' ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">Solo de Cría (Vientres)</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{breedingOnlyFemales.length}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Reemplazos y matrices</span>
        </div>

        <div 
          onClick={() => setSubTab('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${subTab === 'all' ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 shadow-md' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
        >
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">Total Hembras Activas</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{femaleCattle.length}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{openFemales.length} hembras vacías</span>
        </div>
      </div>

      {/* Sub-Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {[
          { id: 'pregnant', label: `Gestantes / Partos (${pregnantFemales.length})`, icon: Baby },
          { id: 'milking', label: `Producción de Leche (${milkingFemales.length})`, icon: Milk },
          { id: 'breeding', label: `Vientres Solo Cría (${breedingOnlyFemales.length})`, icon: Sparkles },
          { id: 'all', label: `Todas las Hembras (${femaleCattle.length})`, icon: HeartHandshake },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] ${
                isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VISTA 1: Preñadas y Próximos Partos */}
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
                  className={`custom-card p-5 cursor-pointer hover:border-purple-400 transition space-y-3 ${isUrgent ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                      {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300 ml-1.5">({cow.name})</span>}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.owner}</p>
                    </div>
                    {isUrgent ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold animate-pulse">
                        ¡Parto Cercano!
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                        Gestante
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Fecha Servicio:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{cow.serviceDate || 'Sin registrar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Días de Gestación:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">{repro.daysPregnant} días</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Fecha Estimada Parto:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{repro.expectedCalvingDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>Estado: {cow.milkingStatus}</span>
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
              No hay hembras con estado preñada registradas.
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Producción de Leche */}
      {subTab === 'milking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {milkingFemales.map(cow => {
              const batch = cow.entryBatch || cow.paddock || 'Ingreso #1';
              return (
                <div
                  key={cow.id}
                  onClick={() => onSelectAnimal(cow)}
                  className="custom-card p-5 cursor-pointer hover:border-blue-400 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                      {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300 ml-1.5">({cow.name})</span>}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.category}</p>
                    </div>
                    <MilkingBadge status={cow.milkingStatus} />
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Producción Diaria:</span>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{cow.dailyMilkLiters || 0} L/día</p>
                    </div>
                    <Milk className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Reproductivo: <strong>{cow.reproductiveStatus}</strong></span>
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
              No hay hembras en producción de leche activas.
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: Solo de Cría */}
      {subTab === 'breeding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {breedingOnlyFemales.map(cow => (
            <div
              key={cow.id}
              onClick={() => onSelectAnimal(cow)}
              className="custom-card p-5 cursor-pointer hover:border-purple-400 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{cow.tagNumber}</span>
                  {cow.name && <span className="text-xs text-slate-500 dark:text-slate-300 ml-1.5">({cow.name})</span>}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{cow.breed} • {cow.owner}</p>
                </div>
                <Badge variant="purple">⭐ Vientre Cría</Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Estado Reproductivo:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{cow.reproductiveStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Peso Actual:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{cow.currentWeight || cow.entryWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ingreso #:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{cow.entryBatch || cow.paddock || 'Ingreso #1'}</span>
                </div>
              </div>
            </div>
          ))}

          {breedingOnlyFemales.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No hay hembras marcadas exclusivamente de cría.
            </div>
          )}
        </div>
      )}

      {/* VISTA 4: Todas las Hembras */}
      {subTab === 'all' && (
        <div className="custom-card overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Arete / Nombre</th>
                <th className="p-3">Ingreso #</th>
                <th className="p-3">Raza</th>
                <th className="p-3">Reproductivo</th>
                <th className="p-3">Lechería</th>
                <th className="p-3">¿Solo Cría?</th>
                <th className="p-3">Peso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {femaleCattle.map(cow => (
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
                  <td className="p-3">{cow.breed}</td>
                  <td className="p-3">
                    <ReproductiveBadge status={cow.reproductiveStatus} />
                  </td>
                  <td className="p-3">
                    <MilkingBadge status={cow.milkingStatus} liters={cow.dailyMilkLiters} />
                  </td>
                  <td className="p-3">
                    {cow.isBreedingOnly ? <Badge variant="purple" size="sm">Sí</Badge> : <span className="text-slate-400">No</span>}
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{cow.currentWeight || cow.entryWeight} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
