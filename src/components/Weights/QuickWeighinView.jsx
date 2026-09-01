import React, { useState } from 'react';
import { Scale, Zap, CheckCircle2, Search, Tag } from 'lucide-react';
import { calculateWeightMetrics } from '../../services/calculations';

export function QuickWeighinView({ cattle = [], weighings = [], onSaveBatchWeighings, onSelectAnimal }) {
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  
  const [weighDate, setWeighDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [weightsMap, setWeightsMap] = useState({});

  const filteredActive = activeCattle.filter(c => {
    const q = searchTerm.toLowerCase();
    const batch = (c.entryBatch || c.paddock || '').toLowerCase();
    return (
      (c.tagNumber || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.ironBrand || '').toLowerCase().includes(q) ||
      batch.includes(q)
    );
  });

  const handleWeightChange = (animalId, weightVal) => {
    setWeightsMap(prev => ({
      ...prev,
      [animalId]: weightVal
    }));
  };

  const handleSaveSingle = (animal) => {
    const wVal = parseFloat(weightsMap[animal.id]);
    if (!wVal || wVal <= 0) {
      alert('Por favor ingresa un peso válido para el animal ' + animal.tagNumber);
      return;
    }

    onSaveBatchWeighings([{
      cattleId: animal.id,
      date: weighDate,
      weight: wVal,
      conditionScore: 3.5,
      notes: 'Pesaje rápido de lote'
    }]);

    alert(`¡Pesaje de ${animal.tagNumber} guardado!`);
  };

  const handleSaveAllFilled = () => {
    const batch = [];
    Object.keys(weightsMap).forEach(cattleId => {
      const wVal = parseFloat(weightsMap[cattleId]);
      if (wVal && wVal > 0) {
        batch.push({
          cattleId,
          date: weighDate,
          weight: wVal,
          conditionScore: 3.5,
          notes: 'Pesaje masivo de báscula'
        });
      }
    });

    if (batch.length === 0) {
      alert('No has ingresado ningún peso nuevo.');
      return;
    }

    onSaveBatchWeighings(batch);
    alert(`¡Se guardaron ${batch.length} pesajes exitosamente!`);
    setWeightsMap({});
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      
      {/* Banner Báscula Rápida */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 animate-bounce" />
            Modo Báscula / Chute en Tiempo Real
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white">
            Pesaje Rápido por Lote
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Digita de forma ágil el peso de cada animal conforme pasa por la báscula de la finca.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-[11px] font-semibold text-emerald-200 mb-1">Fecha de Pesaje</label>
            <input
              type="date"
              value={weighDate}
              onChange={(e) => setWeighDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/20 text-white text-xs font-bold border border-white/30 backdrop-blur-sm min-h-[40px]"
            />
          </div>
          <button
            onClick={handleSaveAllFilled}
            className="self-end px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition min-h-[40px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Todo</span>
          </button>
        </div>
      </div>

      {activeCattle.length === 0 ? (
        <div className="custom-card p-8 sm:p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
          No hay bovinos activos para pesar. Registra animales en el inventario primero.
        </div>
      ) : (
        <>
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar animal por chapa, nombre, hierro o Ingreso #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 shadow-sm min-h-[44px]"
            />
          </div>

          {/* Grid de pesaje rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredActive.map(animal => {
              const animalWeighs = weighings.filter(w => w.cattleId === animal.id);
              const wm = calculateWeightMetrics(animal, animalWeighs);
              const currentWeightInput = weightsMap[animal.id] || '';
              const newWeightNum = parseFloat(currentWeightInput) || 0;
              const gain = newWeightNum > 0 ? (newWeightNum - wm.currentWeight) : 0;
              const batch = animal.entryBatch || animal.paddock || 'Ingreso #1';

              return (
                <div 
                  key={animal.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {animal.tagNumber}
                        </span>
                        {animal.name && <span className="text-xs text-slate-500 dark:text-slate-300">({animal.name})</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-500" />
                        <strong>{batch}</strong> • Hierro: {animal.ironBrand || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      {animal.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Peso Anterior:</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{wm.currentWeight} kg</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Diferencia:</span>
                      <p className={`text-sm font-bold mt-0.5 ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {newWeightNum > 0 ? (gain >= 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)) : '0'} kg
                      </p>
                    </div>
                  </div>

                  {/* Input de báscula */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Nuevo peso (kg)"
                        value={currentWeightInput}
                        onChange={(e) => handleWeightChange(animal.id, e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-extrabold text-base focus:outline-none focus:border-emerald-500 min-h-[44px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveSingle(animal)}
                      disabled={!currentWeightInput}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-sm min-h-[44px]"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
