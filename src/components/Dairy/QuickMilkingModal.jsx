import React, { useState, useEffect } from 'react';
import { Milk, X, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Search, Plus, Minus, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { triggerFeedback } from '../../services/soundService';
import { getLocalDateString } from '../../services/calculations';

export function QuickMilkingModal({
  isOpen,
  onClose,
  cattle = [],
  milkRecords = [],
  onSaveBatch,
  defaultDate = getLocalDateString()
}) {
  if (!isOpen) return null;

  const [date, setDate] = useState(defaultDate);
  const [session, setSession] = useState('AM'); // 'AM', 'PM', 'AM_PM'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [entries, setEntries] = useState({}); // { [cowId]: { am: number, pm: number, notes: string } }
  const [activeIndex, setActiveIndex] = useState(0);

  // Filtrar hembras adultas o en ordeño activas
  const milkingCows = cattle.filter(c => 
    c.sex === 'Hembra' && 
    c.status === 'Activo' &&
    (c.milkingStatus === 'En ordeño' || 
     (Array.isArray(c.femaleStatuses) && c.femaleStatuses.includes('Producción de leche')) ||
     c.femaleStatus === 'Producción de leche' ||
     c.productionType === 'Leche' ||
     c.productionType === 'Doble Propósito' ||
     parseFloat(c.dailyMilkLiters) > 0 ||
     c.category === 'Vaca' || 
     c.category === 'Novilla de Vientre')
  );

  // Lotes disponibles para filtro
  const batches = Array.from(new Set(milkingCows.map(c => c.entryBatch || c.paddock || 'Sin Lote'))).filter(Boolean);

  // Inicializar registros de la fecha seleccionada
  useEffect(() => {
    const initialMap = {};
    milkingCows.forEach(cow => {
      const existing = milkRecords.find(r => String(r.cattleId) === String(cow.id) && r.date === date);
      if (existing) {
        initialMap[cow.id] = {
          am: parseFloat(existing.amLiters) || 0,
          pm: parseFloat(existing.pmLiters) || 0,
          notes: existing.notes || '',
        };
      } else {
        const defaultDaily = parseFloat(cow.dailyMilkLiters) || 0;
        initialMap[cow.id] = {
          am: defaultDaily > 0 ? Number((defaultDaily * 0.6).toFixed(1)) : 0,
          pm: defaultDaily > 0 ? Number((defaultDaily * 0.4).toFixed(1)) : 0,
          notes: '',
        };
      }
    });
    setEntries(initialMap);
  }, [date, cattle.length, milkRecords.length]);

  // Lista filtrada para la sala de ordeño
  const filteredCows = milkingCows.filter(cow => {
    const matchesSearch = 
      (cow.tagNumber && cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cow.name && cow.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBatch = selectedBatch === 'all' || (cow.entryBatch || cow.paddock || 'Sin Lote') === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const currentCow = filteredCows[activeIndex] || filteredCows[0];
  const currentCowEntry = currentCow ? (entries[currentCow.id] || { am: 0, pm: 0, notes: '' }) : { am: 0, pm: 0, notes: '' };

  const handleUpdateCurrentLitters = (type, delta) => {
    if (!currentCow) return;
    const currentVal = currentCowEntry[type] || 0;
    const newVal = Math.max(0, Number((currentVal + delta).toFixed(1)));
    
    setEntries(prev => ({
      ...prev,
      [currentCow.id]: {
        ...prev[currentCow.id],
        [type]: newVal,
      }
    }));
    triggerFeedback('single');
  };

  const handleSetExactLiters = (type, val) => {
    if (!currentCow) return;
    const num = parseFloat(val) || 0;
    setEntries(prev => ({
      ...prev,
      [currentCow.id]: {
        ...prev[currentCow.id],
        [type]: Math.max(0, num),
      }
    }));
  };

  const handleNextCow = () => {
    if (activeIndex < filteredCows.length - 1) {
      setActiveIndex(prev => prev + 1);
      triggerFeedback('navigation');
    }
  };

  const handlePrevCow = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      triggerFeedback('navigation');
    }
  };

  const handleSubmitAll = () => {
    const recordsToSave = [];
    Object.keys(entries).forEach(cowId => {
      const cow = milkingCows.find(c => String(c.id) === String(cowId));
      if (!cow) return;
      const data = entries[cowId];
      const am = parseFloat(data.am) || 0;
      const pm = parseFloat(data.pm) || 0;
      const total = am + pm;

      if (total > 0 || data.notes) {
        recordsToSave.push({
          cattleId: String(cow.id),
          tagNumber: cow.tagNumber || 'S/N',
          date,
          milkingSession: session,
          amLiters: am,
          pmLiters: pm,
          totalLiters: Number(total.toFixed(1)),
          notes: data.notes || '',
        });
      }
    });

    if (recordsToSave.length === 0) {
      alert('Por favor ingresa los litros de al menos una vaca.');
      return;
    }

    onSaveBatch(recordsToSave);
    triggerFeedback('batch');
    onClose();
  };

  // Cálculo de totales rápidos en la cabecera
  const totalLitersCalculated = Object.values(entries).reduce((sum, item) => sum + (parseFloat(item.am) || 0) + (parseFloat(item.pm) || 0), 0);
  const cowsWithDataCount = Object.values(entries).filter(item => (parseFloat(item.am) || 0) + (parseFloat(item.pm) || 0) > 0).length;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl shadow-md">
              🥛
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Planilla Rápida de Ordeño
              </h3>
              <p className="text-xs text-slate-400">
                Captura táctil ágil en sala o corral vaca por vaca
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controles de Sesión, Fecha y Filtro */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-emerald-500"
            />
            <div className="flex bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSession('AM')}
                className={`px-2.5 py-1 rounded-lg transition ${session === 'AM' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
              >
                🌅 AM
              </button>
              <button
                type="button"
                onClick={() => setSession('PM')}
                className={`px-2.5 py-1 rounded-lg transition ${session === 'PM' ? 'bg-blue-500 text-slate-950 font-black' : 'text-slate-400'}`}
              >
                🌇 PM
              </button>
              <button
                type="button"
                onClick={() => setSession('AM_PM')}
                className={`px-2.5 py-1 rounded-lg transition ${session === 'AM_PM' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
              >
                ⚡ AM+PM
              </button>
            </div>
          </div>

          {/* Resumen del Lote */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Total:</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-black border border-emerald-500/30">
              {totalLitersCalculated.toFixed(1)} L ({cowsWithDataCount} vacas)
            </span>
          </div>
        </div>

        {/* Cuerpo: Selector y Ficha de Vaca Activa en Sala */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Navegador de Vacas & Tarjeta Principal */}
          {filteredCows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-4xl">🐄</span>
              <p className="text-sm font-bold">No se encontraron hembras para registrar ordeño.</p>
              <p className="text-xs text-slate-500">Asegúrate de tener vacas activas con categoría Hembra o en Ordeño.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Tarjeta de la Vaca en Ordeño Activo */}
              <div className="bg-slate-950 rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-xl space-y-4">
                
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-lg">
                      #{currentCow.tagNumber || 'S/N'}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {currentCow.name || `Bovina #${currentCow.tagNumber || 'S/N'}`}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {currentCow.entryBatch || currentCow.paddock || 'Sin lote'} • {currentCow.breed || 'Cruze Lechero'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400">
                      Vaca {activeIndex + 1} de {filteredCows.length}
                    </span>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      Total: {((currentCowEntry.am || 0) + (currentCowEntry.pm || 0)).toFixed(1)} L
                    </div>
                  </div>
                </div>

                {/* Controles de Litros Táctiles Grandes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Ordeño Mañana (AM) */}
                  <div className={`p-3.5 rounded-2xl border transition ${session === 'AM' || session === 'AM_PM' ? 'bg-amber-950/30 border-amber-500/50' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <span>🌅 Ordeño AM (Mañana)</span>
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={currentCowEntry.am || ''}
                        onChange={(e) => handleSetExactLiters('am', e.target.value)}
                        placeholder="0.0"
                        className="w-20 bg-slate-950 border border-slate-700 text-right px-2.5 py-1 rounded-xl text-base font-black text-white font-mono outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('am', -1)}
                        className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('am', 0.5)}
                        className="py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('am', 1)}
                        className="py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('am', 2)}
                        className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +2
                      </button>
                    </div>
                  </div>

                  {/* Ordeño Tarde (PM) */}
                  <div className={`p-3.5 rounded-2xl border transition ${session === 'PM' || session === 'AM_PM' ? 'bg-blue-950/30 border-blue-500/50' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <span>🌇 Ordeño PM (Tarde)</span>
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={currentCowEntry.pm || ''}
                        onChange={(e) => handleSetExactLiters('pm', e.target.value)}
                        placeholder="0.0"
                        className="w-20 bg-slate-950 border border-slate-700 text-right px-2.5 py-1 rounded-xl text-base font-black text-white font-mono outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('pm', -1)}
                        className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('pm', 0.5)}
                        className="py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('pm', 1)}
                        className="py-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentLitters('pm', 2)}
                        className="py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +2
                      </button>
                    </div>
                  </div>

                </div>

                {/* Nota rápida */}
                <input
                  type="text"
                  placeholder="Nota (ej. Ubre inflamada, calostro, mastitis, cuarto ciego...)"
                  value={currentCowEntry.notes || ''}
                  onChange={(e) => setEntries(prev => ({
                    ...prev,
                    [currentCow.id]: {
                      ...prev[currentCow.id],
                      notes: e.target.value
                    }
                  }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />

                {/* Botones de Navegación de Vaca */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePrevCow}
                    disabled={activeIndex === 0}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextCow}
                    disabled={activeIndex === filteredCows.length - 1}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    <span>Siguiente Vaca</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Lista Rápida Inferior con barra de desplazamiento para saltar a cualquier vaca */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Todas las Vacas en Sala:</span>
                  <input
                    type="text"
                    placeholder="🔍 Buscar chapa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {filteredCows.map((c, idx) => {
                    const cEntry = entries[c.id] || { am: 0, pm: 0 };
                    const tot = (cEntry.am || 0) + (cEntry.pm || 0);
                    const isSelected = idx === activeIndex;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveIndex(idx);
                          triggerFeedback('navigation');
                        }}
                        className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md' 
                            : tot > 0 
                              ? 'bg-slate-950 border-slate-800 text-slate-300' 
                              : 'bg-slate-900/50 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <span className="font-mono font-black text-xs">#{c.tagNumber || 'S/N'}</span>
                        <span className={`text-[11px] font-bold ${tot > 0 ? 'text-emerald-400 font-mono' : 'text-slate-500'}`}>
                          {tot > 0 ? `${tot.toFixed(1)} L` : '-'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Botón Final de Guardar Todo */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmitAll}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Guardar Planilla de Ordeño ({totalLitersCalculated.toFixed(1)} Litros)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
