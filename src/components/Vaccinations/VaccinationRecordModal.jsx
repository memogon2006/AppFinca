import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Syringe, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Layers, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Info,
  Search,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react';
import { triggerFeedback } from '../../services/soundService';
import { formatCurrency, formatDate } from '../../services/calculations';

const VACCINE_OPTIONS = [
  {
    id: 'aftosa',
    name: 'Fiebre Aftosa (Ciclo Oficial ICA / FEDEGAN)',
    targetDefault: 'all',
    official: true,
    badge: 'Obligatoria ICA',
    color: 'emerald',
    desc: 'Ciclos obligatorios nacionales (Mayo y Noviembre). Requiere expedición de RUV.'
  },
  {
    id: 'brucelosis',
    name: 'Brucelosis Bovina (Cepa 19 / RB51)',
    targetDefault: 'young_females',
    official: true,
    badge: 'Hembras 3-9 meses',
    color: 'purple',
    desc: 'Dosis única obligatoria para terneras y novillas jóvenes de 3 a 9 meses de edad.'
  },
  {
    id: 'carbon',
    name: 'Carbón Sintomático / Triple (Mancha / Gangrena)',
    targetDefault: 'all',
    official: false,
    badge: 'Preventiva',
    color: 'amber',
    desc: 'Prevención de muerte súbita por Clostridiosis. Aplicar semestralmente antes de lluvias.'
  },
  {
    id: 'rabia',
    name: 'Rabia Silvestre Bovina',
    targetDefault: 'all',
    official: false,
    badge: 'Zonas de Riesgo',
    color: 'rose',
    desc: 'Protección contra el virus transmitido por murciélagos hematófagos en zonas endémicas.'
  },
  {
    id: 'desparasitante',
    name: 'Desparasitación Interna / Externa',
    targetDefault: 'all',
    official: false,
    badge: 'Tratamiento',
    color: 'blue',
    desc: 'Control de parásitos gastrointestinales, garrapatas, moscas y nuche.'
  },
  {
    id: 'vitaminas',
    name: 'Vitaminas & Modificadores Orgánicos',
    targetDefault: 'all',
    official: false,
    badge: 'Nutrición',
    color: 'teal',
    desc: 'Complejo A, D, E + Fósforo y minerales para estimular ganancia de peso y fertilidad.'
  },
  {
    id: 'otro',
    name: 'Otro Biológico / Vacuna Personalizada',
    targetDefault: 'all',
    official: false,
    badge: 'Personalizado',
    color: 'slate',
    desc: 'Cualquier otro tratamiento sanitario o vacuna administrada al hato.'
  }
];

export function VaccinationRecordModal({
  isOpen,
  onClose,
  cattle = [],
  onSaveVaccination,
  zIndex = 'z-[60]'
}) {
  if (!isOpen) return null;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Estado del Formulario
  const [selectedVaccineId, setSelectedVaccineId] = useState('aftosa');
  const [customVaccineName, setCustomVaccineName] = useState('');
  const [date, setDate] = useState(todayStr);
  const [targetType, setTargetType] = useState('all'); // 'all' | 'multiple' | 'batch' | 'young_females' | 'individual'
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCattleId, setSelectedCattleId] = useState('');
  
  // Selección múltiple interactiva
  const [selectedCattleIds, setSelectedCattleIds] = useState([]);
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const [animalFilterSex, setAnimalFilterSex] = useState('all');
  const [animalFilterBatch, setAnimalFilterBatch] = useState('all');

  const [officialCycle, setOfficialCycle] = useState('Ciclo I - 2026');
  const [ruvNumber, setRuvNumber] = useState('');
  const [biologicalBatch, setBiologicalBatch] = useState('');
  const [vaccinator, setVaccinator] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  // Animales activos
  const activeCattle = useMemo(() => cattle.filter(c => c.status === 'Activo'), [cattle]);

  // Lotes únicos activos
  const batches = useMemo(() => {
    const list = new Set();
    activeCattle.forEach(c => {
      const b = c.entryBatch || c.paddock;
      if (b) list.add(b);
    });
    return Array.from(list);
  }, [activeCattle]);

  // Hembras elegibles para brucelosis (terneras / novillas 3-9 meses aprox)
  const youngFemales = useMemo(() => {
    return activeCattle.filter(c => {
      if (c.sex !== 'Hembra') return false;
      const cat = (c.category || '').toLowerCase();
      if (cat.includes('ternera') || cat.includes('novilla')) return true;
      if (c.birthDate) {
        const diffMonths = (new Date() - new Date(c.birthDate)) / (1000 * 60 * 60 * 24 * 30.4375);
        return diffMonths >= 3 && diffMonths <= 9;
      }
      return false;
    });
  }, [activeCattle]);

  // Filtrado reactivo de animales para la selección múltiple
  const filteredActiveCattle = useMemo(() => {
    return activeCattle.filter(c => {
      if (animalFilterSex !== 'all' && c.sex !== animalFilterSex) return false;
      const b = c.entryBatch || c.paddock || '';
      if (animalFilterBatch !== 'all' && b !== animalFilterBatch) return false;
      if (animalSearchTerm.trim()) {
        const q = animalSearchTerm.toLowerCase();
        const matchTag = (c.tagNumber || '').toLowerCase().includes(q);
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchBrand = (c.ironBrand || '').toLowerCase().includes(q);
        const matchColor = (c.color || '').toLowerCase().includes(q);
        const matchBatch = b.toLowerCase().includes(q);
        return matchTag || matchName || matchBrand || matchColor || matchBatch;
      }
      return true;
    });
  }, [activeCattle, animalFilterSex, animalFilterBatch, animalSearchTerm]);

  // Ajustar ciclo oficial según el mes actual
  useEffect(() => {
    const m = new Date().getMonth() + 1;
    const y = new Date().getFullYear();
    if (m >= 4 && m <= 8) {
      setOfficialCycle(`Ciclo I - ${y}`);
    } else if (m >= 9 || m <= 2) {
      setOfficialCycle(`Ciclo II - ${y}`);
    } else {
      setOfficialCycle(`Plan Sanitario Finca - ${y}`);
    }
  }, []);

  // Manejar cambio de vacuna
  const handleVaccineChange = (vId) => {
    setSelectedVaccineId(vId);
    const opt = VACCINE_OPTIONS.find(o => o.id === vId);
    if (opt?.targetDefault === 'young_females') {
      setTargetType('young_females');
    } else if (targetType === 'young_females' && opt?.targetDefault === 'all') {
      setTargetType('all');
    }
  };

  // Toggle selección de animal individual en la lista múltiple
  const handleToggleAnimal = (animalId) => {
    setSelectedCattleIds(prev => {
      const exists = prev.some(id => String(id) === String(animalId));
      if (exists) {
        return prev.filter(id => String(id) !== String(animalId));
      } else {
        return [...prev, animalId];
      }
    });
    triggerFeedback('click');
  };

  // Seleccionar todos los visibles filtrados
  const handleSelectAllVisible = () => {
    const visibleIds = filteredActiveCattle.map(c => c.id);
    setSelectedCattleIds(prev => {
      const combined = new Set([...prev, ...visibleIds]);
      return Array.from(combined);
    });
    triggerFeedback('single');
  };

  // Deseleccionar todos
  const handleDeselectAll = () => {
    setSelectedCattleIds([]);
    triggerFeedback('warning');
  };

  // Calcular número de animales cubiertos
  const coveredCount = useMemo(() => {
    if (targetType === 'all') return activeCattle.length;
    if (targetType === 'multiple') return selectedCattleIds.length;
    if (targetType === 'young_females') return youngFemales.length > 0 ? youngFemales.length : Math.ceil(activeCattle.filter(c => c.sex === 'Hembra').length * 0.35);
    if (targetType === 'batch') {
      if (!selectedBatch) return 0;
      return activeCattle.filter(c => (c.entryBatch || c.paddock) === selectedBatch).length;
    }
    if (targetType === 'individual') return selectedCattleId ? 1 : 0;
    return 0;
  }, [targetType, activeCattle, selectedCattleIds, youngFemales, selectedBatch, selectedCattleId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (targetType === 'multiple' && selectedCattleIds.length === 0) {
      alert('Por favor selecciona al menos un bovino en la lista.');
      return;
    }

    const selectedOption = VACCINE_OPTIONS.find(o => o.id === selectedVaccineId);
    const finalVaccineName = selectedVaccineId === 'otro' 
      ? (customVaccineName.trim() || 'Vacuna / Tratamiento Sanitario')
      : (selectedOption?.name || 'Vacuna');

    let targetLabel = 'Todo el hato';
    let selectedTags = [];

    if (targetType === 'multiple') {
      targetLabel = `${selectedCattleIds.length} bovinos seleccionados`;
      selectedTags = activeCattle
        .filter(c => selectedCattleIds.some(id => String(id) === String(c.id)))
        .map(c => c.tagNumber);
    } else if (targetType === 'batch') {
      targetLabel = `Lote: ${selectedBatch || 'Sin lote'}`;
    } else if (targetType === 'young_females') {
      targetLabel = 'Hembras jóvenes (Brucelosis 3-9m)';
    } else if (targetType === 'individual') {
      const single = activeCattle.find(c => String(c.id) === String(selectedCattleId));
      targetLabel = `Individual: ${single?.tagNumber || 'Bovino'}`;
      selectedTags = single?.tagNumber ? [single.tagNumber] : [];
    }

    const vaccinationData = {
      id: 'vac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date,
      vaccineType: finalVaccineName,
      vaccineCode: selectedVaccineId,
      targetType,
      targetLabel,
      batchName: targetType === 'batch' ? selectedBatch : (targetType === 'individual' ? selectedCattleId : 'Todo el Hato'),
      cattleId: targetType === 'individual' ? selectedCattleId : null,
      selectedCattleIds: targetType === 'multiple' ? selectedCattleIds : (targetType === 'individual' ? [selectedCattleId] : null),
      selectedTags: selectedTags.length > 0 ? selectedTags : null,
      animalCount: coveredCount,
      officialCycle: (selectedVaccineId === 'aftosa' || selectedVaccineId === 'brucelosis') ? officialCycle : 'Plan Sanitario Interno',
      ruvNumber: ruvNumber.trim(),
      biologicalBatch: biologicalBatch.trim(),
      vaccinator: vaccinator.trim(),
      cost: parseFloat(cost) || 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    if (onSaveVaccination) {
      onSaveVaccination(vaccinationData);
    }

    // Actualizar estado de vacunación ICA en localStorage si es Aftosa
    if (selectedVaccineId === 'aftosa') {
      try {
        localStorage.setItem('ganado_colombia_vaccine_status', JSON.stringify({
          isVaccinated: true,
          ruvNumber: ruvNumber.trim(),
          cycle: officialCycle,
          dateApplied: date,
          updatedAt: new Date().toISOString()
        }));
      } catch (err) {}
    }

    triggerFeedback('success');
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 ${zIndex} overflow-y-auto animate-fadeIn`}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Registrar Vacunación / Plan Sanitario</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro oficial FEDEGAN-ICA o plan sanitario preventivo de la finca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* 1. SELECCIÓN DE VACUNA / BIOLÓGICO */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>1. Tipo de Vacuna o Tratamiento</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Paso 1 de 3</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VACCINE_OPTIONS.map(opt => {
                const isSelected = selectedVaccineId === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => handleVaccineChange(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                        opt.official
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {opt.badge}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {opt.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedVaccineId === 'otro' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Nombre de la vacuna o biológico (ej. Vacuna Reproductiva IBR/DVB)..."
                  value={customVaccineName}
                  onChange={(e) => setCustomVaccineName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* 2. FECHA Y CAMPAÑA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Fecha de Aplicación */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fecha de Aplicación *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                required
              />
            </div>

            {/* Ciclo Oficial */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Campaña / Ciclo</span>
              </label>
              <input
                type="text"
                value={officialCycle}
                onChange={(e) => setOfficialCycle(e.target.value)}
                placeholder="Ej. Ciclo I - 2026"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

          </div>

          {/* 3. ALCANCE / POBLACIÓN A VACUNAR */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>2. Población Objetivo (¿A quiénes se aplicó?)</span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 shadow-sm">
                🎯 {coveredCount} cabezas seleccionadas
              </span>
            </label>

            {/* 5 Opciones de Selección de Destinatarios */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              
              {/* Opción 1: Todo el Hato */}
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  targetType === 'all'
                    ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs block leading-tight">Todo el Hato</span>
                <span className="text-[10px] opacity-75 font-semibold block">({activeCattle.length} cab.)</span>
              </button>

              {/* Opción 2: SELECCIÓN MÚLTIPLE PERSONALIZADA */}
              <button
                type="button"
                onClick={() => setTargetType('multiple')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  targetType === 'multiple'
                    ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <CheckSquare className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs block leading-tight">Varios Animales</span>
                <span className="text-[10px] opacity-75 font-semibold block">({selectedCattleIds.length} marcados)</span>
              </button>

              {/* Opción 3: Por Lote */}
              <button
                type="button"
                onClick={() => setTargetType('batch')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  targetType === 'batch'
                    ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs block leading-tight">Por Lote</span>
                <span className="text-[10px] opacity-75 font-semibold block">Potrero</span>
              </button>

              {/* Opción 4: Brucelosis (Terneras 3-9m) */}
              <button
                type="button"
                onClick={() => setTargetType('young_females')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  targetType === 'young_females'
                    ? 'bg-purple-600 text-white font-black shadow-sm ring-2 ring-purple-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs block leading-tight">Terneras 3-9m</span>
                <span className="text-[10px] opacity-75 font-semibold block">(Brucelosis)</span>
              </button>

              {/* Opción 5: 1 Bovino Individual */}
              <button
                type="button"
                onClick={() => setTargetType('individual')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer col-span-2 sm:col-span-1 ${
                  targetType === 'individual'
                    ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Tag className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs block leading-tight">1 Bovino</span>
                <span className="text-[10px] opacity-75 font-semibold block">Individual</span>
              </button>
            </div>

            {/* PANEL DE SELECCIÓN MÚLTIPLE DE BOVINOS */}
            {targetType === 'multiple' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Marca los animales vacunados en la lista</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Puedes buscar por chapa, filtrar por sexo o lote, y marcar solo los vacunados.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllVisible}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                    >
                      Marcar Visibles ({filteredActiveCattle.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                {/* Barra de Búsqueda y Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por chapa, nombre, color..."
                      value={animalSearchTerm}
                      onChange={(e) => setAnimalSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={animalFilterSex}
                      onChange={(e) => setAnimalFilterSex(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">Todos los sexos</option>
                      <option value="Macho">Solo Machos</option>
                      <option value="Hembra">Solo Hembras</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={animalFilterBatch}
                      onChange={(e) => setAnimalFilterBatch(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="all">Todos los lotes</option>
                      {batches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista interactiva con scroll */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900">
                  {filteredActiveCattle.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No se encontraron bovinos activos con los filtros aplicados.
                    </div>
                  ) : (
                    filteredActiveCattle.map(animal => {
                      const isSelected = selectedCattleIds.some(id => String(id) === String(animal.id));
                      const bName = animal.entryBatch || animal.paddock || 'Sin lote';

                      return (
                        <div
                          key={animal.id}
                          onClick={() => handleToggleAnimal(animal.id)}
                          className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 fill-emerald-600 text-white" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                  {animal.tagNumber}
                                </span>
                                {animal.name && (
                                  <span className="text-[11px] text-slate-500 font-bold truncate">
                                    ({animal.name})
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  {animal.sex === 'Hembra' ? '🐄 Hembra' : '🐂 Macho'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                                  {bName}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {animal.category || 'Bovino'} • {animal.color || 'Sin color'} • Peso actual: {animal.currentWeight || animal.entryWeight || 0} kg
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            isSelected 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {isSelected ? 'Vacunado ✓' : 'No marcado'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* SELECCIÓN POR LOTE */}
            {targetType === 'batch' && (
              <div className="pt-1">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  required
                >
                  <option value="">-- Selecciona el lote a vacunar --</option>
                  {batches.map(b => (
                    <option key={b} value={b}>
                      Lote: {b} ({activeCattle.filter(c => (c.entryBatch || c.paddock) === b).length} bovinos)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SELECCIÓN INDIVIDUAL */}
            {targetType === 'individual' && (
              <div className="pt-1">
                <select
                  value={selectedCattleId}
                  onChange={(e) => setSelectedCattleId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  required
                >
                  <option value="">-- Selecciona el animal por chapa / nombre --</option>
                  {activeCattle.map(c => (
                    <option key={c.id} value={c.id}>
                      Chapa: {c.tagNumber} {c.name ? `(${c.name})` : ''} • {c.category || 'Bovino'} ({c.entryBatch || c.paddock || 'Sin lote'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 4. DATOS OFICIALES Y TRAZABILIDAD (OPCIONALES) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Datos Oficiales & Trazabilidad (Opcional)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  N° Certificado RUV
                </label>
                <input
                  type="text"
                  placeholder="Ej. RUV-849204"
                  value={ruvNumber}
                  onChange={(e) => setRuvNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Lote Biológico / Lab
                </label>
                <input
                  type="text"
                  placeholder="Ej. Vecol Lote #293"
                  value={biologicalBatch}
                  onChange={(e) => setBiologicalBatch(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Vacunador / Responsable
                </label>
                <input
                  type="text"
                  placeholder="Ej. Brigada FEDEGAN"
                  value={vaccinator}
                  onChange={(e) => setVaccinator(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Costo Total de la Vacunación ($ COP)</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej. 120000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Observaciones / Notas
                </label>
                <input
                  type="text"
                  placeholder="Ej. Animales vacunados sin novedad..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Registro ({coveredCount} Bovinos)</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
