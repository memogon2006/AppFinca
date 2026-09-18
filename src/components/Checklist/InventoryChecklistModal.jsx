import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Printer, 
  MessageCircle, 
  Share2, 
  RotateCcw, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Stethoscope, 
  User, 
  MapPin, 
  Calendar, 
  Layers, 
  Tag, 
  Check, 
  HelpCircle,
  FileText,
  AlertCircle,
  Scale,
  Baby,
  Skull,
  Save,
  Clock
} from 'lucide-react';
import { db } from '../../services/db';
import { triggerFeedback } from '../../services/soundService';
import { formatNumber } from '../../services/calculations';

const QUICK_NOTES = [
  { id: 'bichera', label: '🐛 Bichera / Gusanera', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'cojera', label: '🩹 Cojera / Pata', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'flaco', label: '⚖️ Flaco / Bajo Peso', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'arete', label: '🏷️ Perdió Arete (Re-chapar)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'pario', label: '🍼 Parió / Cría al pie', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'muerto', label: '💀 Hallado Muerto', color: 'bg-slate-200 text-slate-800 border-slate-400' },
  { id: 'ojo', label: '👁️ Ojo malo / Nube', color: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export function InventoryChecklistModal({
  isOpen,
  onClose,
  cattle = [],
  currentUser,
  onDataChanged,
  zIndex = 'z-[60]'
}) {
  // Estados de vista: 'setup' -> 'counting' -> 'summary' -> 'print'
  const [viewStep, setViewStep] = useState('setup');

  // Filtros de configuración inicial
  const [scopeType, setScopeType] = useState('all'); // 'all', 'batch', 'owner', 'sex'
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedSex, setSelectedSex] = useState('');
  const [locationName, setLocationName] = useState('');
  const [inspectorName, setInspectorName] = useState(currentUser?.name || 'Administrador');

  // Estado del conteo activo: Map<animalId, { verified: boolean, verifiedAt: string, note: string, quickTags: string[], isInfiltrated?: boolean }>
  const [checkMap, setCheckMap] = useState({});
  const [infiltratedAnimals, setInfiltratedAnimals] = useState([]);
  
  // Búsqueda y filtros dentro del conteo
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState('all'); // 'all', 'pending', 'verified', 'issues'
  
  // Modal de Novedad Rápida
  const [activeNoteAnimal, setActiveNoteAnimal] = useState(null);
  const [customNoteText, setCustomNoteText] = useState('');
  const [selectedQuickTags, setSelectedQuickTags] = useState([]);

  // Modal para agregar animal infiltrado
  const [showAddInfiltratedModal, setShowAddInfiltratedModal] = useState(false);
  const [infiltratedSearch, setInfiltratedSearch] = useState('');

  // Fecha y hora del arqueo
  const [auditDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [auditTime, setAuditTime] = useState('');

  const searchInputRef = useRef(null);

  // Control de apertura y bloqueo de scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (activeNoteAnimal) {
          setActiveNoteAnimal(null);
        } else if (showAddInfiltratedModal) {
          setShowAddInfiltratedModal(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setInspectorName(currentUser?.name || 'Administrador');
      setAuditTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    } else {
      setViewStep('setup');
      setCheckMap({});
      setInfiltratedAnimals([]);
      setSearchQuery('');
      setTabFilter('all');
      setActiveNoteAnimal(null);
      setShowAddInfiltratedModal(false);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, currentUser]);

  // Solo animales activos en finca
  const activeCattle = useMemo(() => {
    return cattle.filter(c => c.status === 'Activo');
  }, [cattle]);

  // Listados únicos para los selectores
  const uniqueBatches = useMemo(() => {
    const set = new Set();
    activeCattle.forEach(c => {
      const b = c.entryBatch || c.paddock;
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [activeCattle]);

  const uniqueOwners = useMemo(() => {
    const set = new Set();
    activeCattle.forEach(c => {
      if (c.owner) set.add(c.owner);
    });
    return Array.from(set).sort();
  }, [activeCattle]);

  // Animales que entran en el ámbito seleccionado
  const targetCattle = useMemo(() => {
    let list = [...activeCattle];

    if (scopeType === 'batch' && selectedBatch) {
      list = list.filter(c => (c.entryBatch || c.paddock) === selectedBatch);
    } else if (scopeType === 'owner' && selectedOwner) {
      list = list.filter(c => c.owner === selectedOwner);
    } else if (scopeType === 'sex' && selectedSex) {
      list = list.filter(c => c.sex === selectedSex);
    }

    // Ordenar naturalmente por arete
    return list.sort((a, b) => {
      const tagA = a.tagNumber || '';
      const tagB = b.tagNumber || '';
      return tagA.localeCompare(tagB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [activeCattle, scopeType, selectedBatch, selectedOwner, selectedSex]);

  // Animales combinados en el conteo (Objetivo + Infiltrados agregados)
  const allCountingList = useMemo(() => {
    const combined = [...targetCattle];
    infiltratedAnimals.forEach(inf => {
      if (!combined.some(c => String(c.id) === String(inf.id))) {
        combined.push(inf);
      }
    });
    return combined;
  }, [targetCattle, infiltratedAnimals]);

  // Iniciar conteo activo
  const handleStartCounting = () => {
    if (targetCattle.length === 0) {
      alert('No hay animales activos en el grupo seleccionado.');
      return;
    }

    const initialMap = {};
    targetCattle.forEach(c => {
      initialMap[c.id] = {
        verified: false,
        verifiedAt: null,
        note: '',
        quickTags: [],
        isInfiltrated: false
      };
    });

    setCheckMap(initialMap);
    setViewStep('counting');
    setAuditTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    triggerFeedback('click');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  // Marcar / Desmarcar animal individual
  const handleToggleVerify = (animalId) => {
    setCheckMap(prev => {
      const current = prev[animalId] || { verified: false, verifiedAt: null, note: '', quickTags: [] };
      const nextVerified = !current.verified;
      
      if (nextVerified) {
        triggerFeedback('weighin');
      } else {
        triggerFeedback('click');
      }

      return {
        ...prev,
        [animalId]: {
          ...current,
          verified: nextVerified,
          verifiedAt: nextVerified ? new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : null
        }
      };
    });
  };

  // Marcar todos los visibles en pantalla
  const handleVerifyAllVisible = () => {
    const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setCheckMap(prev => {
      const next = { ...prev };
      displayedList.forEach(animal => {
        const current = next[animal.id] || { verified: false, verifiedAt: null, note: '', quickTags: [] };
        next[animal.id] = {
          ...current,
          verified: true,
          verifiedAt: current.verifiedAt || nowTime
        };
      });
      return next;
    });
    triggerFeedback('batch');
  };

  // Desmarcar todos
  const handleUncheckAll = () => {
    if (window.confirm('¿Deseas desmarcar todos los animales de este arqueo?')) {
      setCheckMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = {
            ...next[id],
            verified: false,
            verifiedAt: null
          };
        });
        return next;
      });
      triggerFeedback('warning');
    }
  };

  // Abrir modal de novedad para un animal
  const handleOpenNoteModal = (animal, e) => {
    e?.stopPropagation();
    const data = checkMap[animal.id] || { verified: false, verifiedAt: null, note: '', quickTags: [] };
    setActiveNoteAnimal(animal);
    setCustomNoteText(data.note || '');
    setSelectedQuickTags(data.quickTags || []);
  };

  // Guardar novedad del animal
  const handleSaveNote = () => {
    if (!activeNoteAnimal) return;
    setCheckMap(prev => {
      const current = prev[activeNoteAnimal.id] || { verified: false, verifiedAt: null, note: '', quickTags: [] };
      return {
        ...prev,
        [activeNoteAnimal.id]: {
          ...current,
          // Si tiene novedad, asumimos que fue visto
          verified: true,
          verifiedAt: current.verifiedAt || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          note: customNoteText.trim(),
          quickTags: selectedQuickTags
        }
      };
    });
    setActiveNoteAnimal(null);
    triggerFeedback('click');
  };

  // Agregar animal infiltrado de otro lote
  const handleAddInfiltrated = (animal) => {
    if (!infiltratedAnimals.some(a => String(a.id) === String(animal.id))) {
      setInfiltratedAnimals(prev => [...prev, animal]);
      setCheckMap(prev => ({
        ...prev,
        [animal.id]: {
          verified: true,
          verifiedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          note: `Animal infiltrado (originalmente de ${animal.entryBatch || animal.paddock || 'otro lote'})`,
          quickTags: [],
          isInfiltrated: true
        }
      }));
      triggerFeedback('weighin');
    }
    setShowAddInfiltratedModal(false);
  };

  // Métricas calculadas en tiempo real
  const metrics = useMemo(() => {
    let verifiedCount = 0;
    let pendingCount = 0;
    let issueCount = 0;
    let infiltratedCount = infiltratedAnimals.length;

    allCountingList.forEach(a => {
      const state = checkMap[a.id];
      if (state?.verified) {
        verifiedCount++;
      } else {
        pendingCount++;
      }
      if (state?.note || (state?.quickTags && state.quickTags.length > 0)) {
        issueCount++;
      }
    });

    const expectedTotal = targetCattle.length;
    const progressPercent = expectedTotal > 0 ? Math.round((verifiedCount / expectedTotal) * 100) : 0;

    return {
      expectedTotal,
      verifiedCount,
      pendingCount,
      issueCount,
      infiltratedCount,
      progressPercent
    };
  }, [allCountingList, targetCattle, checkMap, infiltratedAnimals]);

  // Lista de animales mostrada según búsqueda y pestaña de filtro
  const displayedList = useMemo(() => {
    let list = allCountingList;

    // Filtro por pestaña
    if (tabFilter === 'pending') {
      list = list.filter(a => !checkMap[a.id]?.verified);
    } else if (tabFilter === 'verified') {
      list = list.filter(a => checkMap[a.id]?.verified);
    } else if (tabFilter === 'issues') {
      list = list.filter(a => {
        const st = checkMap[a.id];
        return st?.note || (st?.quickTags && st.quickTags.length > 0);
      });
    }

    // Filtro por buscador (arete, color, dueño, lote, nombre)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => {
        const tag = (a.tagNumber || '').toLowerCase();
        const color = (a.color || '').toLowerCase();
        const owner = (a.owner || '').toLowerCase();
        const batch = (a.entryBatch || a.paddock || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        return tag.includes(q) || color.includes(q) || owner.includes(q) || batch.includes(q) || name.includes(q);
      });
    }

    return list;
  }, [allCountingList, checkMap, tabFilter, searchQuery]);

  // Lista de faltantes y novedades para el resumen final
  const missingAnimals = useMemo(() => {
    return targetCattle.filter(a => !checkMap[a.id]?.verified);
  }, [targetCattle, checkMap]);

  const observedAnimals = useMemo(() => {
    return allCountingList.filter(a => {
      const st = checkMap[a.id];
      return st?.note || (st?.quickTags && st.quickTags.length > 0);
    });
  }, [allCountingList, checkMap]);

  // Enviar reporte estructurado a WhatsApp
  const handleSendWhatsApp = () => {
    const farm = currentUser?.farmName || 'Finca Ganadera';
    const scopeLabel = scopeType === 'batch' 
      ? `Lote ${selectedBatch}` 
      : (scopeType === 'owner' ? `Dueño ${selectedOwner}` : 'Inventario General');
    
    let msg = `📋 *ARQUEO DE INVENTARIO - ${farm.toUpperCase()}*\n`;
    msg += `📅 *Fecha:* ${auditDate} - ${auditTime}\n`;
    msg += `📍 *Ámbito:* ${scopeLabel}${locationName ? ` (${locationName})` : ''}\n`;
    msg += `👤 *Responsable:* ${inspectorName}\n\n`;

    msg += `📊 *BALANCE DE CONTEO:*\n`;
    msg += `• Total Esperados: *${metrics.expectedTotal} cabezas*\n`;
    msg += `• ✅ Verificados: *${metrics.verifiedCount}* (${metrics.progressPercent}%)\n`;
    msg += `• ❌ Faltantes: *${metrics.pendingCount}*\n`;
    if (metrics.infiltratedCount > 0) {
      msg += `• 🔄 Infiltrados de otro lote: *${metrics.infiltratedCount}*\n`;
    }
    msg += `\n`;

    if (missingAnimals.length > 0) {
      msg += `🚨 *ANIMALES FALTANTES (${missingAnimals.length}):*\n`;
      missingAnimals.slice(0, 20).forEach(a => {
        msg += `• No. *${a.tagNumber || 'S/N'}* | ${a.color || 'Sin color'} | ${a.owner || 'Hacienda'}\n`;
      });
      if (missingAnimals.length > 20) {
        msg += `• ... y ${missingAnimals.length - 20} animales más.\n`;
      }
      msg += `\n`;
    } else {
      msg += `🎉 *¡Inventario 100% Completo! Cero Faltantes.*\n\n`;
    }

    if (observedAnimals.length > 0) {
      msg += `🩹 *NOVEDADES Y OBSERVACIONES (${observedAnimals.length}):*\n`;
      observedAnimals.forEach(a => {
        const st = checkMap[a.id];
        const tags = (st?.quickTags || []).map(t => {
          const item = QUICK_NOTES.find(q => q.id === t);
          return item ? item.label : t;
        }).join(', ');
        const fullNote = [tags, st?.note].filter(Boolean).join(' - ');
        msg += `• No. *${a.tagNumber}*: ${fullNote || 'Observación registrada'}\n`;
      });
      msg += `\n`;
    }

    msg += `_Reporte generado automáticamente desde App Ganadera._`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Guardar y asentar en base de datos local
  const handleSaveAuditToDatabase = async () => {
    try {
      // 1. Actualizar fecha de verificación y notas en cada animal visto
      const updates = [];
      for (const animal of allCountingList) {
        const state = checkMap[animal.id];
        if (state?.verified) {
          const noteText = state.note || (state.quickTags?.length > 0 ? state.quickTags.join(', ') : '');
          updates.push(
            db.cattle.update(animal.id, {
              lastVerifiedDate: auditDate,
              notes: noteText ? `${animal.notes ? animal.notes + ' | ' : ''}[Arqueo ${auditDate}]: ${noteText}` : animal.notes
            })
          );
        }
      }

      await Promise.all(updates);
      triggerFeedback('success');
      alert('✅ ¡Arqueo de inventario guardado con éxito! Se actualizó la fecha de avistamiento en las fichas del ganado.');
      
      if (onDataChanged) {
        onDataChanged();
      }
      onClose();
    } catch (e) {
      alert(`Error al guardar arqueo: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto`}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* CABECERA PRINCIPAL */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Arqueo & Checklist de Inventario
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-400 shadow-sm">
                  🌾 Conteo en Campo
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                {viewStep === 'setup' && 'Configura el grupo o potrero a verificar y genera la planilla o inicia el conteo.'}
                {viewStep === 'counting' && 'Toca cada animal conforme pase por manga o corral para verificarlo.'}
                {viewStep === 'summary' && 'Balance final consolidado: Faltantes, presentes y reporte para WhatsApp.'}
                {viewStep === 'print' && 'Planilla física limpia lista para imprimir y llevar a la manga.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CUERPO DEL MODAL */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* --------------------------------------------------------------------- */}
          {/* PASO 1: SETUP / CONFIGURACIÓN DE ÁMBITO */}
          {/* --------------------------------------------------------------------- */}
          {viewStep === 'setup' && (
            <div className="space-y-6">
              
              {/* Tarjetas de Ámbito de Conteo */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  1. Selecciona el Grupo de Animales a Contar:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setScopeType('all'); triggerFeedback('click'); }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                      scopeType === 'all'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg block">🌐</span>
                    <span className="text-xs font-black block mt-1">Todo el Hato</span>
                    <span className="text-[10px] text-slate-500 block">{activeCattle.length} activos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setScopeType('batch'); triggerFeedback('click'); }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                      scopeType === 'batch'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg block">📦</span>
                    <span className="text-xs font-black block mt-1">Por Lote</span>
                    <span className="text-[10px] text-slate-500 block">{uniqueBatches.length} lotes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setScopeType('owner'); triggerFeedback('click'); }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                      scopeType === 'owner'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg block">🏷️</span>
                    <span className="text-xs font-black block mt-1">Por Dueño / Socio</span>
                    <span className="text-[10px] text-slate-500 block">{uniqueOwners.length} marcas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setScopeType('sex'); triggerFeedback('click'); }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                      scopeType === 'sex'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg block">🐂</span>
                    <span className="text-xs font-black block mt-1">Por Sexo</span>
                    <span className="text-[10px] text-slate-500 block">Machos / Hembras</span>
                  </button>
                </div>
              </div>

              {/* Selectores dependientes del ámbito */}
              {scopeType === 'batch' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selecciona el Lote de Ingreso:
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Elige un lote --</option>
                    {uniqueBatches.map(b => {
                      const count = activeCattle.filter(c => (c.entryBatch || c.paddock) === b).length;
                      return (
                        <option key={b} value={b}>📦 {b} ({count} cabezas)</option>
                      );
                    })}
                  </select>
                </div>
              )}

              {scopeType === 'owner' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selecciona el Propietario / Socio:
                  </label>
                  <select
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Elige un dueño/socio --</option>
                    {uniqueOwners.map(o => {
                      const count = activeCattle.filter(c => c.owner === o).length;
                      return (
                        <option key={o} value={o}>🏷️ {o} ({count} cabezas)</option>
                      );
                    })}
                  </select>
                </div>
              )}

              {scopeType === 'sex' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selecciona el Sexo:
                  </label>
                  <select
                    value={selectedSex}
                    onChange={(e) => setSelectedSex(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Elige el sexo --</option>
                    <option value="Macho">🐂 Machos ({activeCattle.filter(c => c.sex === 'Macho').length} cabezas)</option>
                    <option value="Hembra">🐄 Hembras ({activeCattle.filter(c => c.sex === 'Hembra').length} cabezas)</option>
                  </select>
                </div>
              )}

              {/* Detalles de Campo (Ubicación y Responsable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Potrero / Ubicación (Opcional):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Potrero El Mango / Manga 1"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Responsable del Conteo:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del contador"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Tarjeta de Resumen Previo */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg">
                    {targetCattle.length}
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                      Cabezas Esperadas a Verificar
                    </span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">
                      Fecha: {auditDate} - {auditTime}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewStep('print')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>Imprimir Planilla</span>
                </button>
              </div>

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PASO 2: CONTEO ACTIVO EN VIVO */}
          {/* --------------------------------------------------------------------- */}
          {viewStep === 'counting' && (
            <div className="space-y-4">
              
              {/* Barra de Progreso y KPIs en Vivo */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Conteo en Curso</span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      ({scopeType === 'batch' ? selectedBatch : (scopeType === 'owner' ? selectedOwner : 'Hato General')})
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono text-sm">
                    {metrics.verifiedCount} / {metrics.expectedTotal} ({metrics.progressPercent}%)
                  </span>
                </div>

                {/* Barra horizontal animada */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, metrics.progressPercent)}%` }}
                  />
                </div>

                {/* Micro-contadores */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                    <span className="text-emerald-300 font-bold block text-sm">{metrics.verifiedCount}</span>
                    <span className="text-[10px] text-slate-400">Verificados</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30">
                    <span className="text-rose-300 font-bold block text-sm">{metrics.pendingCount}</span>
                    <span className="text-[10px] text-slate-400">Faltan</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30">
                    <span className="text-amber-300 font-bold block text-sm">{metrics.issueCount}</span>
                    <span className="text-[10px] text-slate-400">Novedades</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30">
                    <span className="text-purple-300 font-bold block text-sm">+{metrics.infiltratedCount}</span>
                    <span className="text-[10px] text-slate-400">Infiltrados</span>
                  </div>
                </div>
              </div>

              {/* Buscador Rápido y Pestañas de Filtro */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar Arete, Color o Dueño..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddInfiltratedModal(true)}
                    className="px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    title="Registrar animal de otro lote que apareció en este potrero"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">+ Infiltrado</span>
                  </button>
                </div>

                {/* Selector de Pestañas de Vista */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold py-0.5">
                  <button
                    type="button"
                    onClick={() => setTabFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                      tabFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({allCountingList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                      tabFilter === 'pending'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    🔴 Faltan por Ver ({metrics.pendingCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabFilter('verified')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                      tabFilter === 'verified'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🟢 Verificados ({metrics.verifiedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabFilter('issues')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                      tabFilter === 'issues'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    🩹 Con Novedades ({metrics.issueCount})
                  </button>
                </div>
              </div>

              {/* Botones de acción masiva rápida */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
                <span>Mostrando {displayedList.length} animales</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyAllVisible}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    ✓ Marcar Visibles
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleUncheckAll}
                    className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              {/* Grid Táctil de Animales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {displayedList.map(animal => {
                  const state = checkMap[animal.id] || { verified: false, verifiedAt: null, note: '', quickTags: [] };
                  const isChecked = state.verified;
                  const hasNote = Boolean(state.note || (state.quickTags && state.quickTags.length > 0));
                  const isInfiltrated = state.isInfiltrated;

                  return (
                    <div
                      key={animal.id}
                      onClick={() => handleToggleVerify(animal.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                        isChecked
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Cabecera de la Tarjeta: Chapa y Checkbox */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-mono">
                              {animal.tagNumber || 'S/N'}
                            </span>
                            {isInfiltrated && (
                              <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 text-[10px] font-black uppercase">
                                Infiltrado
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px]">
                              {animal.color || 'Sin color'}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[90px]">{animal.owner || 'Hacienda'}</span>
                          </div>
                        </div>

                        {/* Botón de Check Gigante */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-slate-200'
                        }`}>
                          {isChecked ? <Check className="w-5 h-5 font-black" /> : <span className="text-xs font-bold text-slate-400">○</span>}
                        </div>
                      </div>

                      {/* Pie de la Tarjeta: Peso, Estado y Botón de Novedad */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <div className="text-slate-500 dark:text-slate-400">
                          {isChecked ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{state.verifiedAt || 'Visto'}</span>
                            </span>
                          ) : (
                            <span>{animal.currentWeight > 0 ? `${animal.currentWeight} kg` : animal.category || 'Novillo'}</span>
                          )}
                        </div>

                        {/* Botón Novedad 🩹 */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenNoteModal(animal, e)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition ${
                            hasNote
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                          }`}
                          title="Registrar novedad sanitaria o apunte"
                        >
                          <Stethoscope className="w-3 h-3" />
                          <span>{hasNote ? 'Ver Novedad' : '+ Novedad'}</span>
                        </button>
                      </div>

                      {/* Chip de novedad si existe */}
                      {hasNote && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-[10px] text-amber-950 dark:text-amber-200 font-bold truncate">
                          {state.quickTags?.map(t => QUICK_NOTES.find(q => q.id === t)?.label).filter(Boolean).join(', ') || state.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PASO 3: RESUMEN / BALANCE FINAL DE ARQUEO */}
          {/* --------------------------------------------------------------------- */}
          {viewStep === 'summary' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Banner de Felicitación / Estado */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                    {metrics.progressPercent}%
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      Arqueo Finalizado: {metrics.verifiedCount} de {metrics.expectedTotal} Cabezas
                    </h4>
                    <p className="text-xs text-emerald-200">
                      Fecha: {auditDate} • Inspector: {inspectorName} {locationName ? `• ${locationName}` : ''}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  metrics.pendingCount === 0 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  {metrics.pendingCount === 0 ? '✓ 100% Completo' : `⚠️ ${metrics.pendingCount} Faltantes`}
                </span>
              </div>

              {/* Grid de Métricas Finales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white block">{metrics.expectedTotal}</span>
                  <span className="text-[11px] font-bold text-slate-500">Esperados</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 block">{metrics.verifiedCount}</span>
                  <span className="text-[11px] font-bold text-slate-500">Verificados</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block">{metrics.pendingCount}</span>
                  <span className="text-[11px] font-bold text-slate-500">Faltantes</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-center">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400 block">{metrics.issueCount}</span>
                  <span className="text-[11px] font-bold text-slate-500">Con Novedades</span>
                </div>
              </div>

              {/* Detalle de Animales Faltantes */}
              {missingAnimals.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-rose-950 dark:text-rose-200 uppercase">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Animales Faltantes por Verificar ({missingAnimals.length}):</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                    {missingAnimals.map(a => (
                      <div key={a.id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-xs">
                        <span className="font-mono font-black text-slate-900 dark:text-white block">
                          No. {a.tagNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {a.color || 'Sin color'} • {a.owner || 'Hacienda'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle de Novedades Registradas */}
              {observedAnimals.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950 dark:text-amber-200 uppercase">
                    <Stethoscope className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Novedades Sanitarias & Observaciones ({observedAnimals.length}):</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {observedAnimals.map(a => {
                      const st = checkMap[a.id];
                      const tags = (st?.quickTags || []).map(t => QUICK_NOTES.find(q => q.id === t)?.label).filter(Boolean).join(', ');
                      return (
                        <div key={a.id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono font-black text-slate-900 dark:text-white mr-2">
                              No. {a.tagNumber}:
                            </span>
                            <span className="text-amber-900 dark:text-amber-200 font-semibold">
                              {tags || st?.note}
                            </span>
                            {st?.note && tags && (
                              <span className="text-slate-500 text-[11px] block mt-0.5">Nota: {st.note}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* PASO 4: VISTA DE PLANILLA IMPRIMIBLE */}
          {/* --------------------------------------------------------------------- */}
          {viewStep === 'print' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Vista Previa de Planilla Física para Manga / Corral
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Planilla</span>
                </button>
              </div>

              {/* Hoja Formato A4 / Papel */}
              <div className="bg-white text-slate-950 p-6 rounded-2xl border border-slate-300 shadow-sm font-sans space-y-4 printable-area">
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight">
                      {currentUser?.farmName || 'PLANILLA DE ARQUEO DE INVENTARIO GANADERO'}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Fecha: {auditDate} • Ubicación: {locationName || 'Manga Principal'} • Inspector: {inspectorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black bg-slate-100 px-2.5 py-1 rounded border border-slate-300 block">
                      Total: {targetCattle.length} Cabezas
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-black text-[11px]">
                      <th className="p-2 border border-slate-400 w-12 text-center">[ ✓ ]</th>
                      <th className="p-2 border border-slate-400">No. Arete / Chapa</th>
                      <th className="p-2 border border-slate-400">Color / Pelaje</th>
                      <th className="p-2 border border-slate-400">Lote / Potrero</th>
                      <th className="p-2 border border-slate-400">Dueño / Marca</th>
                      <th className="p-2 border border-slate-400 text-right">Peso (kg)</th>
                      <th className="p-2 border border-slate-400">Novedades / Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetCattle.map((a, idx) => (
                      <tr key={a.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-400 text-center font-bold">
                          [ &nbsp; ]
                        </td>
                        <td className="p-2 border border-slate-400 font-mono font-black text-sm">
                          {a.tagNumber}
                        </td>
                        <td className="p-2 border border-slate-400 font-semibold">
                          {a.color || 'No reg.'}
                        </td>
                        <td className="p-2 border border-slate-400">
                          {a.entryBatch || a.paddock || '-'}
                        </td>
                        <td className="p-2 border border-slate-400">
                          {a.owner || '-'}
                        </td>
                        <td className="p-2 border border-slate-400 text-right font-mono font-bold">
                          {a.currentWeight > 0 ? `${a.currentWeight}` : '-'}
                        </td>
                        <td className="p-2 border border-slate-400">
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div className="border-t border-slate-400 pt-1">
                    <span className="font-bold">Firma del Mayordomo / Vaquero</span>
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <span className="font-bold">Firma del Administrador / Propietario</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* FOOTER DEL MODAL CON ACCIONES */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          {viewStep === 'setup' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleStartCounting}
                disabled={targetCattle.length === 0}
                className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <span>🚀 Iniciar Conteo Digital ({targetCattle.length} animales)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {viewStep === 'counting' && (
            <>
              <button
                type="button"
                onClick={() => setViewStep('setup')}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cambiar Lote</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewStep('summary');
                  triggerFeedback('click');
                }}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <span>🏁 Finalizar y Cerrar Arqueo ({metrics.verifiedCount} / {metrics.expectedTotal})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {viewStep === 'summary' && (
            <>
              <button
                type="button"
                onClick={() => setViewStep('counting')}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Conteo</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar a WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAuditToDatabase}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar en Finca</span>
                </button>
              </div>
            </>
          )}

          {viewStep === 'print' && (
            <button
              type="button"
              onClick={() => setViewStep('setup')}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Configuración</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL EMERGENTE DE NOVEDAD RÁPIDA 🩹 */}
        {/* ========================================================================= */}
        {activeNoteAnimal && (
          <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Novedad en Bovino #{activeNoteAnimal.tagNumber}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {activeNoteAnimal.color || 'Sin color'} • {activeNoteAnimal.owner || 'Hacienda'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNoteAnimal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Chips de Selección Rápida */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Selecciona una o más novedades:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map(item => {
                    const isSelected = selectedQuickTags.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedQuickTags(prev => 
                            isSelected ? prev.filter(t => t !== item.id) : [...prev, item.id]
                          );
                          triggerFeedback('click');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? `${item.color} font-black shadow-xs ring-2 ring-amber-400`
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nota o Detalle Escrito */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Detalle adicional / Tratamiento aplicado:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Curación con larvicida en oreja izquierda..."
                  value={customNoteText}
                  onChange={(e) => setCustomNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Botón Guardar Novedad */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNoteAnimal(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
                >
                  Guardar Novedad
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL PARA AGREGAR ANIMAL INFILTRADO DE OTRO LOTE */}
        {/* ========================================================================= */}
        {showAddInfiltratedModal && (
          <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Agregar Animal Infiltrado
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddInfiltratedModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Busca un animal que pertenezca a otro lote o potrero pero que esté físicamente presente aquí:
              </p>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Escribe arete o color..."
                  value={infiltratedSearch}
                  onChange={(e) => setInfiltratedSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                {activeCattle
                  .filter(c => !allCountingList.some(target => String(target.id) === String(c.id)))
                  .filter(c => {
                    if (!infiltratedSearch.trim()) return true;
                    const q = infiltratedSearch.toLowerCase();
                    return (c.tagNumber || '').toLowerCase().includes(q) || (c.color || '').toLowerCase().includes(q);
                  })
                  .slice(0, 10)
                  .map(animal => (
                    <div 
                      key={animal.id} 
                      className="pt-1.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-black font-mono text-slate-900 dark:text-white mr-1.5">
                          No. {animal.tagNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({animal.color || 'Sin color'} • {animal.entryBatch || animal.paddock || 'Sin lote'})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddInfiltrated(animal)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInfiltratedModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
