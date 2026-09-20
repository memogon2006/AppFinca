import React, { useState, useEffect, useMemo } from 'react';
import { 
  Stethoscope, 
  Search, 
  Calendar, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  Save, 
  RotateCcw, 
  Printer, 
  MessageCircle, 
  Share2, 
  Sparkles, 
  Baby, 
  Filter, 
  ArrowLeft, 
  ChevronRight, 
  Layers, 
  Tag, 
  UserCheck, 
  Zap, 
  Eye, 
  Activity, 
  TrendingUp, 
  HelpCircle,
  X
} from 'lucide-react';
import { FemaleStatusBadge } from '../Common/Badge';
import { BOVINE_GESTATION_DAYS, formatDate, parseDateOnly } from '../../services/calculations';
import { triggerFeedback } from '../../services/soundService';

const DRAFT_PALPATION_KEY = 'bovina_quick_palpation_draft';

// Botones rápidos de meses de preñez con sus días correspondientes
const PREGNANCY_MONTH_SHORTCUTS = [
  { label: '1 mes (30d)', days: 30, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700' },
  { label: '1.5 m (45d)', days: 45, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700' },
  { label: '2 meses (60d)', days: 60, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700' },
  { label: '3 meses (90d)', days: 90, color: 'bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-600' },
  { label: '4 meses (120d)', days: 120, color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700' },
  { label: '5 meses (150d)', days: 150, color: 'bg-orange-200 dark:bg-orange-900/60 text-orange-950 dark:text-orange-100 border-orange-400 dark:border-orange-600' },
  { label: '6 meses (180d)', days: 180, color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700' },
  { label: '7 meses (210d)', days: 210, color: 'bg-rose-200 dark:bg-rose-900/60 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-600' },
  { label: '8 meses (240d)', days: 240, color: 'bg-purple-200 dark:bg-purple-900/60 text-purple-950 dark:text-purple-100 border-purple-400 dark:border-purple-600' },
];

// Hallazgos clínicos para Preñadas
const PREGNANT_FINDINGS = [
  { id: 'cuerno_der', label: '🥚 Cuerno Derecho' },
  { id: 'cuerno_izq', label: '🥚 Cuerno Izquierdo' },
  { id: 'cl_presente', label: '🟡 Cuerpo Lúteo (CL)' },
  { id: 'feto_viable', label: '✨ Feto Viable / Movimiento' },
  { id: 'buen_tono', label: '💪 Buen Tono Uterino' },
  { id: 'cria_al_pie', label: '🍼 Mantiene Cría al Pie' },
  { id: 'posible_mellizo', label: '👥 Posible Mellizos' },
];

// Hallazgos clínicos para Vacías
const OPEN_FINDINGS = [
  { id: 'ciclica', label: '🔄 Ovarios Cíclicos / Normal', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 'cl_vacia', label: '🟡 Cuerpo Lúteo Presente', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'estatica', label: '💤 Ovario Estático / Anestro', color: 'bg-slate-200 text-slate-900 border-slate-400' },
  { id: 'quiste', label: '💧 Quiste Folicular / Lúteo', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  { id: 'celo_reciente', label: '🔥 Celo Reciente / Folículo', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 'apta_ia', label: '✅ Apta para Monta / IA', color: 'bg-emerald-200 text-emerald-950 border-emerald-400' },
  { id: 'protocolo_iatf', label: '💉 Requiere Protocolo IATF', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: 'lavado_uterino', label: '🧪 Lavado / Tratamiento Uterino', color: 'bg-rose-200 text-rose-950 border-rose-400' },
];

// Opciones de Condición Corporal
const BODY_CONDITIONS = [
  { val: '2.0', label: '2.0 (Baja)' },
  { val: '2.5', label: '2.5 (Aceptable)' },
  { val: '3.0', label: '3.0 (Óptima)' },
  { val: '3.5', label: '3.5 (Buena)' },
  { val: '4.0', label: '4.0 (Gorda)' },
];

export function QuickPalpationView({
  cattle = [],
  palpations = [],
  onSavePalpation,
  onSaveBatchPalpations,
  onSelectAnimal,
  onNavigate,
  currentUser
}) {
  // 1. Filtrar exclusivamente hembras activas
  const femaleCattle = useMemo(() => {
    return cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  }, [cattle]);

  // Fecha y veterinario de la jornada
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vetName, setVetName] = useState(() => {
    return localStorage.getItem('bovina_last_vet_name') || 'Dr. Médico Veterinario';
  });
  const [method, setMethod] = useState('Palpación Rectal'); // 'Palpación Rectal', 'Ecografía / Ultrasonido', 'Chequeo Reproductivo'

  // Filtros de visualización
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [subTab, setSubTab] = useState('all'); // 'all', 'pending', 'pregnant', 'open', 'doubt'

  // Borrador de diagnósticos por hembra
  // Map<animalId, { diagnosis: 'Preñada' | 'Vacía' | 'Dudosa' | '', pregnancyDays: number|string, findings: string[], bodyCondition: string, notes: string, recheckDays?: number }>
  const [diagnosesMap, setDiagnosesMap] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_PALPATION_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Mapa de animales guardados exitosamente en esta sesión
  const [savedSuccessMap, setSavedSuccessMap] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);

  // Persistir borrador automáticamente
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_PALPATION_KEY, JSON.stringify(diagnosesMap));
    } catch (e) {
      console.warn('Error guardando borrador de palpación:', e);
    }
  }, [diagnosesMap]);

  // Guardar nombre de veterinario
  useEffect(() => {
    if (vetName) {
      localStorage.setItem('bovina_last_vet_name', vetName);
    }
  }, [vetName]);

  // Lotes únicos de hembras
  const batches = useMemo(() => {
    const set = new Set(femaleCattle.map(c => c.entryBatch || c.paddock).filter(Boolean));
    return Array.from(set);
  }, [femaleCattle]);

  // Cálculo de Fecha Estimada de Parto según días ingresados
  const getCalculatedCalving = (daysInput, refDate = sessionDate) => {
    const days = parseInt(daysInput);
    if (!days || isNaN(days) || days <= 0) return null;
    
    const baseDate = parseDateOnly(refDate) || new Date();
    const remainingDays = BOVINE_GESTATION_DAYS - days;
    const estCalving = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + remainingDays);
    const serviceDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - days);

    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      serviceDate: formatYMD(serviceDate),
      expectedCalvingDate: formatYMD(estCalving),
      remainingDays,
      daysPregnant: days,
      isNearCalving: remainingDays <= 20 && remainingDays >= -15
    };
  };

  // Manejo de actualización de datos de un animal en el borrador
  const updateAnimalDiagnosis = (animalId, field, value) => {
    setDiagnosesMap(prev => {
      const current = prev[animalId] || {
        diagnosis: '',
        pregnancyDays: '',
        findings: [],
        bodyCondition: '3.0',
        notes: '',
        recheckDays: ''
      };

      const updated = { ...current, [field]: value };

      // Si cambia de preñada a vacía, limpiar días de gestación
      if (field === 'diagnosis') {
        if (value === 'Vacía') {
          updated.pregnancyDays = '';
          updated.findings = updated.findings.filter(f => !PREGNANT_FINDINGS.some(pf => pf.id === f));
        } else if (value === 'Preñada') {
          if (!updated.pregnancyDays) updated.pregnancyDays = 60; // 2 meses por defecto si no tenía
          updated.findings = updated.findings.filter(f => !OPEN_FINDINGS.some(of => of.id === f));
        }
      }

      return {
        ...prev,
        [animalId]: updated
      };
    });
  };

  // Alternar hallazgos clínicos
  const toggleFinding = (animalId, findingId) => {
    setDiagnosesMap(prev => {
      const current = prev[animalId] || { diagnosis: '', findings: [] };
      const currentFindings = current.findings || [];
      const hasIt = currentFindings.includes(findingId);
      const newFindings = hasIt 
        ? currentFindings.filter(f => f !== findingId)
        : [...currentFindings, findingId];

      return {
        ...prev,
        [animalId]: {
          ...current,
          findings: newFindings
        }
      };
    });
  };

  // Guardar diagnóstico individual
  const handleSaveSingle = async (animal) => {
    const diag = diagnosesMap[animal.id];
    if (!diag || !diag.diagnosis) {
      triggerFeedback('warning');
      alert(`⚠️ Por favor selecciona si la hembra ${animal.tagNumber} está Preñada, Vacía o Dudosa.`);
      return;
    }

    if (diag.diagnosis === 'Preñada' && (!diag.pregnancyDays || parseInt(diag.pregnancyDays) <= 0)) {
      triggerFeedback('warning');
      alert(`⚠️ Ingresa los días o meses aproximados de preñez para la hembra ${animal.tagNumber}.`);
      return;
    }

    const calc = diag.diagnosis === 'Preñada' ? getCalculatedCalving(diag.pregnancyDays, sessionDate) : null;

    const payload = {
      animalId: animal.id,
      tagNumber: animal.tagNumber,
      date: sessionDate,
      diagnosis: diag.diagnosis,
      pregnancyDays: diag.diagnosis === 'Preñada' ? parseInt(diag.pregnancyDays) : 0,
      serviceDate: calc ? calc.serviceDate : '',
      expectedCalvingDate: calc ? calc.expectedCalvingDate : '',
      findings: diag.findings || [],
      bodyCondition: diag.bodyCondition || '3.0',
      veterinarian: vetName || 'Dr. Médico Veterinario',
      method: method,
      notes: diag.notes || '',
      recheckDays: diag.recheckDays || ''
    };

    if (onSavePalpation) {
      await onSavePalpation(payload);
    }

    setSavedSuccessMap(prev => ({ ...prev, [animal.id]: true }));
    triggerFeedback('success');
  };

  // Guardar todas las hembras evaluadas
  const handleSaveAllBatch = async () => {
    const evaluatedList = femaleCattle.filter(c => {
      const diag = diagnosesMap[c.id];
      return diag && diag.diagnosis;
    });

    if (evaluatedList.length === 0) {
      triggerFeedback('warning');
      alert('⚠️ No hay diagnósticos seleccionados para guardar aún.');
      return;
    }

    setSavingBatch(true);

    try {
      const batchPayloads = evaluatedList.map(animal => {
        const diag = diagnosesMap[animal.id];
        const calc = diag.diagnosis === 'Preñada' ? getCalculatedCalving(diag.pregnancyDays, sessionDate) : null;
        return {
          animalId: animal.id,
          tagNumber: animal.tagNumber,
          date: sessionDate,
          diagnosis: diag.diagnosis,
          pregnancyDays: diag.diagnosis === 'Preñada' ? parseInt(diag.pregnancyDays) : 0,
          serviceDate: calc ? calc.serviceDate : '',
          expectedCalvingDate: calc ? calc.expectedCalvingDate : '',
          findings: diag.findings || [],
          bodyCondition: diag.bodyCondition || '3.0',
          veterinarian: vetName || 'Dr. Médico Veterinario',
          method: method,
          notes: diag.notes || '',
          recheckDays: diag.recheckDays || ''
        };
      });

      if (onSaveBatchPalpations) {
        await onSaveBatchPalpations(batchPayloads);
      } else if (onSavePalpation) {
        for (const p of batchPayloads) {
          await onSavePalpation(p);
        }
      }

      const newSaved = {};
      evaluatedList.forEach(a => { newSaved[a.id] = true; });
      setSavedSuccessMap(prev => ({ ...prev, ...newSaved }));

      triggerFeedback('success');
      alert(`🎉 ¡Jornada guardada exitosamente! Se registraron los diagnósticos de ${evaluatedList.length} hembras.`);
    } catch (e) {
      console.error('Error guardando jornada:', e);
      alert('Error al guardar la jornada: ' + e.message);
    } finally {
      setSavingBatch(false);
    }
  };

  // Limpiar borrador de la sesión
  const handleClearDraft = () => {
    if (window.confirm('¿Deseas reiniciar y limpiar los datos de esta jornada de palpación en pantalla?')) {
      setDiagnosesMap({});
      setSavedSuccessMap({});
      localStorage.removeItem(DRAFT_PALPATION_KEY);
      triggerFeedback('warning');
    }
  };

  // Estadísticas en Vivo de la Jornada
  const stats = useMemo(() => {
    let pregnant = 0;
    let open = 0;
    let doubt = 0;
    let pending = 0;
    let totalEvaluated = 0;

    // Desglose de meses de preñez
    let m1_3 = 0; // 1 a 3 meses (≤ 90d)
    let m4_6 = 0; // 4 a 6 meses (91d a 180d)
    let m7_8 = 0; // 7 a 8+ meses (> 180d)

    femaleCattle.forEach(c => {
      const diag = diagnosesMap[c.id];
      if (!diag || !diag.diagnosis) {
        pending++;
      } else if (diag.diagnosis === 'Preñada') {
        pregnant++;
        totalEvaluated++;
        const pDays = parseInt(diag.pregnancyDays) || 0;
        if (pDays <= 90) m1_3++;
        else if (pDays <= 180) m4_6++;
        else m7_8++;
      } else if (diag.diagnosis === 'Vacía') {
        open++;
        totalEvaluated++;
      } else if (diag.diagnosis === 'Dudosa') {
        doubt++;
        totalEvaluated++;
      }
    });

    const pregRate = totalEvaluated > 0 ? ((pregnant / totalEvaluated) * 100).toFixed(1) : 0;

    return {
      total: femaleCattle.length,
      evaluated: totalEvaluated,
      pregnant,
      open,
      doubt,
      pending,
      pregRate,
      m1_3,
      m4_6,
      m7_8
    };
  }, [femaleCattle, diagnosesMap]);

  // Filtrado de hembras para visualización
  const filteredFemales = useMemo(() => {
    return femaleCattle.filter(c => {
      const batch = c.entryBatch || c.paddock || '';
      if (selectedBatch && batch !== selectedBatch) return false;

      const diag = diagnosesMap[c.id];
      const currentDiag = diag?.diagnosis || '';

      if (subTab === 'pending' && currentDiag) return false;
      if (subTab === 'pregnant' && currentDiag !== 'Preñada') return false;
      if (subTab === 'open' && currentDiag !== 'Vacía') return false;
      if (subTab === 'doubt' && currentDiag !== 'Dudosa') return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const tag = (c.tagNumber || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const color = (c.color || '').toLowerCase();
        const breed = (c.breed || '').toLowerCase();
        const iron = (c.ironBrand || '').toLowerCase();
        return tag.includes(q) || name.includes(q) || color.includes(q) || breed.includes(q) || iron.includes(q) || batch.toLowerCase().includes(q);
      }

      return true;
    });
  }, [femaleCattle, selectedBatch, subTab, searchTerm, diagnosesMap]);

  // Generar reporte formateado para WhatsApp
  const handleShareWhatsApp = () => {
    const farmName = currentUser?.farmName || 'Finca Ganadera';
    const evaluatedList = femaleCattle.filter(c => diagnosesMap[c.id]?.diagnosis);

    let text = `🩺 *INFORME DE JORNADA DE PALPACIÓN & DIAGNÓSTICO REPRODUCTIVO*\n`;
    text += `🏡 *Finca:* ${farmName}\n`;
    text += `📅 *Fecha:* ${formatDate(sessionDate)}\n`;
    text += `👨‍⚕️ *Veterinario:* ${vetName}\n`;
    text += `🔬 *Método:* ${method}\n\n`;

    text += `📊 *RESUMEN GENERAL:*\n`;
    text += `• Total Hembras Evaluadas: *${stats.evaluated}* de ${stats.total}\n`;
    text += `• 🤰 Preñadas: *${stats.pregnant}* (*${stats.pregRate}%* de preñez)\n`;
    text += `  - 1 a 3 meses (≤90d): ${stats.m1_3}\n`;
    text += `  - 4 a 6 meses (91-180d): ${stats.m4_6}\n`;
    text += `  - 7 a 8+ meses (>180d): ${stats.m7_8}\n`;
    text += `• ⚪ Vacías (Abiertas): *${stats.open}*\n`;
    if (stats.doubt > 0) text += `• ❓ Dudosas / Rechequeo: *${stats.doubt}*\n`;
    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📋 *DETALLE POR HEMBRA:*\n`;

    evaluatedList.forEach((c, idx) => {
      const diag = diagnosesMap[c.id];
      text += `\n*${idx + 1}. Vaca ${c.tagNumber}* ${c.name ? `(${c.name})` : ''}\n`;
      text += `• Estado: *${diag.diagnosis === 'Preñada' ? `🤰 PREÑADA (${diag.pregnancyDays} días)` : diag.diagnosis === 'Vacía' ? '⚪ VACÍA' : '❓ DUDOSA'}*\n`;
      
      if (diag.diagnosis === 'Preñada') {
        const calc = getCalculatedCalving(diag.pregnancyDays, sessionDate);
        if (calc) {
          text += `• Parto Estimado: *${formatDate(calc.expectedCalvingDate)}* (en ~${calc.remainingDays} días)\n`;
        }
      }
      
      if (diag.findings && diag.findings.length > 0) {
        const labels = diag.findings.map(fId => {
          const item = [...PREGNANT_FINDINGS, ...OPEN_FINDINGS].find(item => item.id === fId);
          return item ? item.label : fId;
        });
        text += `• Hallazgos: ${labels.join(', ')}\n`;
      }
      
      if (diag.bodyCondition) {
        text += `• Condición Corporal: CC ${diag.bodyCondition}\n`;
      }
      
      if (diag.notes) {
        text += `• Obs/Tratamiento: ${diag.notes}\n`;
      }
    });

    text += `\n_Generado automáticamente desde Inventario Ganadero Pro._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* 1. Header Principal & Controles de la Jornada */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-6 rounded-3xl shadow-xl border border-purple-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shadow-inner text-purple-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Jornada de Palpación & Chequeo Reproductivo</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-400/20 border border-purple-400/30 text-purple-200 uppercase">
                    Solo Hembras ({femaleCattle.length})
                  </span>
                </h1>
                <p className="text-xs text-purple-200/80 font-medium">
                  Diagnóstico ginecológico y de preñez ultrarrápido para manga y corral • Registro simultáneo de días, parto y hallazgos.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas del Encabezado */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {onNavigate && (
              <button
                onClick={() => onNavigate('females')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Volver a la vista de Hembras"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Volver a Hembras</span>
              </button>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer"
              title="Compartir informe clínico de la jornada por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Reporte WhatsApp</span>
            </button>

            <button
              onClick={handleSaveAllBatch}
              disabled={savingBatch || stats.evaluated === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Guardar todos los diagnósticos de esta jornada de una sola vez"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBatch ? 'Guardando...' : `Guardar Todo (${stats.evaluated})`}</span>
            </button>

            <button
              onClick={handleClearDraft}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-400/40 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Reiniciar y limpiar todos los datos de esta jornada de palpación"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Jornada</span>
            </button>
          </div>
        </div>

        {/* Parámetros de la Jornada (Fecha, Veterinario, Método) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-purple-500/20 text-slate-100">
          
          {/* Fecha */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Fecha de Palpación
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-purple-400/30 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Evaluador / Veterinario */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Veterinario / Evaluador
            </label>
            <input
              type="text"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              placeholder="Ej. Dr. Carlos Rodríguez"
              className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-purple-400/30 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Método de Diagnóstico */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Método de Diagnóstico
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-purple-400/30 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="Palpación Rectal">✋ Palpación Rectal</option>
              <option value="Ecografía / Ultrasonido">📡 Ecografía / Ultrasonido</option>
              <option value="Chequeo Reproductivo">🩺 Chequeo Reproductivo General</option>
              <option value="Inseminación / Servicio">💉 Inseminación Artificial / IATF</option>
            </select>
          </div>

        </div>
      </div>

      {/* 2. Barra de Métricas en Vivo de la Jornada */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        
        {/* Total Evaluadas */}
        <div 
          onClick={() => setSubTab('all')}
          className={`p-3 rounded-2xl border cursor-pointer transition ${subTab === 'all' ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-400 shadow-md ring-2 ring-purple-400/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        >
          <span className="text-[10px] sm:text-xs font-extrabold text-purple-800 dark:text-purple-300 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3" /> Evaluadas
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {stats.evaluated} <span className="text-xs font-medium text-slate-400">/ {stats.total}</span>
          </p>
          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">
            {stats.total > 0 ? Math.round((stats.evaluated / stats.total) * 100) : 0}% avance
          </span>
        </div>

        {/* Preñadas */}
        <div 
          onClick={() => setSubTab('pregnant')}
          className={`p-3 rounded-2xl border cursor-pointer transition ${subTab === 'pregnant' ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 shadow-md ring-2 ring-amber-400/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        >
          <span className="text-[10px] sm:text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
            <Baby className="w-3 h-3 text-amber-600" /> Preñadas
          </span>
          <p className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5">
            {stats.pregnant}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-black">
            {stats.pregRate}% de preñez
          </span>
        </div>

        {/* Vacías */}
        <div 
          onClick={() => setSubTab('open')}
          className={`p-3 rounded-2xl border cursor-pointer transition ${subTab === 'open' ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 shadow-md ring-2 ring-slate-400/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        >
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
            ⚪ Vacías
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
            {stats.open}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {stats.evaluated > 0 ? Math.round((stats.open / stats.evaluated) * 100) : 0}% del lote
          </span>
        </div>

        {/* Dudosas */}
        <div 
          onClick={() => setSubTab('doubt')}
          className={`p-3 rounded-2xl border cursor-pointer transition ${subTab === 'doubt' ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-400 shadow-md ring-2 ring-sky-400/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        >
          <span className="text-[10px] sm:text-xs font-extrabold text-sky-800 dark:text-sky-300 uppercase flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-sky-600" /> Dudosas
          </span>
          <p className="text-lg sm:text-xl font-black text-sky-900 dark:text-sky-200 mt-0.5">
            {stats.doubt}
          </p>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
            Rechequeo
          </span>
        </div>

        {/* Pendientes */}
        <div 
          onClick={() => setSubTab('pending')}
          className={`p-3 rounded-2xl border cursor-pointer transition col-span-2 sm:col-span-1 ${subTab === 'pending' ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 shadow-md ring-2 ring-rose-400/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        >
          <span className="text-[10px] sm:text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-600" /> Pendientes
          </span>
          <p className="text-lg sm:text-xl font-black text-rose-900 dark:text-rose-200 mt-0.5">
            {stats.pending}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            Por evaluar en corral
          </span>
        </div>

      </div>

      {/* 3. Toolbar de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        
        {/* Buscador Rápido */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Arete #, Nombre, Color, Raza, Hierro..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro por Lote / Ingreso # */}
        {batches.length > 0 && (
          <div className="w-full sm:w-auto shrink-0">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">🌾 Todos los Lotes ({femaleCattle.length})</option>
              {batches.map(b => (
                <option key={b} value={b}>Lote: {b}</option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* 4. Lista de Hembras para Diagnóstico */}
      {filteredFemales.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">No se encontraron hembras con los filtros aplicados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Intenta limpiar el buscador o seleccionar otra pestaña para continuar con el diagnóstico.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFemales.map((animal) => {
            const diag = diagnosesMap[animal.id] || {
              diagnosis: '',
              pregnancyDays: '',
              findings: [],
              bodyCondition: '3.0',
              notes: '',
              recheckDays: ''
            };

            const isSaved = savedSuccessMap[animal.id];
            const isPregnant = diag.diagnosis === 'Preñada';
            const isOpen = diag.diagnosis === 'Vacía';
            const isDoubt = diag.diagnosis === 'Dudosa';

            const calc = isPregnant ? getCalculatedCalving(diag.pregnancyDays, sessionDate) : null;

            return (
              <div
                key={animal.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-150 ${
                  isSaved
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600/80 shadow-md ring-1 ring-emerald-500/20'
                    : isPregnant
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-sm'
                      : isOpen
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                        : isDoubt
                          ? 'bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 shadow-sm'
                }`}
              >
                
                {/* Cabecera de la Fila: Identidad de la Vaca */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    
                    {/* Número de Arete */}
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-black text-sm sm:text-base tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Tag className="w-3.5 h-3.5 text-purple-400" />
                      <span>{animal.tagNumber}</span>
                    </div>

                    {/* Nombre y datos morfológicos */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {animal.name && (
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {animal.name}
                          </span>
                        )}
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          {animal.color || animal.breed || 'Sin color'}
                        </span>
                        {animal.ironBrand && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Hierro: {animal.ironBrand}
                          </span>
                        )}
                        {(animal.entryBatch || animal.paddock) && (
                          <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md">
                            Lote: {animal.entryBatch || animal.paddock}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estado Anterior & Botón Ver Ficha */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Estado Actual:</span>
                    <FemaleStatusBadge status={animal.femaleStatus} statuses={animal.femaleStatuses} />
                    
                    {onSelectAnimal && (
                      <button
                        onClick={() => onSelectAnimal(animal)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        title="Ver ficha técnica completa del animal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

                {/* 5. Selector de Diagnóstico Rápido (3 Botones Principales) */}
                <div className="mt-3.5 space-y-3">
                  
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* Botón PREÑADA */}
                    <button
                      type="button"
                      onClick={() => updateAnimalDiagnosis(animal.id, 'diagnosis', 'Preñada')}
                      className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isPregnant
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                      }`}
                    >
                      <Baby className="w-4 h-4" />
                      <span>PREÑADA</span>
                      {isPregnant && <Check className="w-4 h-4 ml-0.5" />}
                    </button>

                    {/* Botón VACÍA */}
                    <button
                      type="button"
                      onClick={() => updateAnimalDiagnosis(animal.id, 'diagnosis', 'Vacía')}
                      className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isOpen
                          ? 'bg-slate-700 text-white border-slate-800 shadow-md ring-2 ring-slate-400/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>⚪ VACÍA</span>
                      {isOpen && <Check className="w-4 h-4 ml-0.5" />}
                    </button>

                    {/* Botón DUDOSA */}
                    <button
                      type="button"
                      onClick={() => updateAnimalDiagnosis(animal.id, 'diagnosis', 'Dudosa')}
                      className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isDoubt
                          ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-400/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-sky-100 dark:hover:bg-sky-950/40'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>DUDOSA</span>
                      {isDoubt && <Check className="w-4 h-4 ml-0.5" />}
                    </button>

                  </div>

                  {/* SUB-MÓDULO 1: Opciones de PREÑADA */}
                  {isPregnant && (
                    <div className="p-3.5 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-3 animate-fade-in">
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        
                        {/* Selector de Días y Botones Rápidos de Meses */}
                        <div className="space-y-1.5 flex-1">
                          <label className="text-[11px] font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> Días de Gestación Diagnosticados
                          </label>

                          <div className="flex items-center gap-2 flex-wrap">
                            {PREGNANCY_MONTH_SHORTCUTS.map(sc => (
                              <button
                                key={sc.days}
                                type="button"
                                onClick={() => updateAnimalDiagnosis(animal.id, 'pregnancyDays', sc.days)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-black border transition cursor-pointer ${
                                  parseInt(diag.pregnancyDays) === sc.days
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm scale-105 ring-2 ring-amber-400'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                                }`}
                              >
                                {sc.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input Numérico de Días Exactos */}
                        <div className="w-full md:w-36 shrink-0 space-y-1">
                          <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase">
                            Días Exactos:
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="283"
                              value={diag.pregnancyDays || ''}
                              onChange={(e) => updateAnimalDiagnosis(animal.id, 'pregnancyDays', e.target.value)}
                              placeholder="Ej. 65"
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-400 text-slate-900 dark:text-white font-black text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                              días
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Tarjeta de Cálculo Reproductivo en Vivo */}
                      {calc && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-600 dark:text-slate-400">📅 Parto Estimado:</span>
                            <span className="font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                              {formatDate(calc.expectedCalvingDate)}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              (Faltan ~{calc.remainingDays} días)
                            </span>
                          </div>

                          <div>
                            {calc.remainingDays <= 10 ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[10px] animate-pulse">
                                🚨 Parto Inminente (≤ 10d)
                              </span>
                            ) : calc.remainingDays <= 30 ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px]">
                                ⚠️ Próximo Parto (≤ 30d)
                              </span>
                            ) : calc.remainingDays <= 60 ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500 text-white font-black text-[10px]">
                                🥛 Secado Requerido (≤ 60d)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-400/40">
                                🌱 Gestación Normal
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hallazgos Reproductivos de Preñez */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                          Hallazgos Ginecológicos / Estructura:
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PREGNANT_FINDINGS.map(pf => {
                            const isSelected = (diag.findings || []).includes(pf.id);
                            return (
                              <button
                                key={pf.id}
                                type="button"
                                onClick={() => toggleFinding(animal.id, pf.id)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-black'
                                    : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-amber-200/50'
                                }`}
                              >
                                {pf.label} {isSelected && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-MÓDULO 2: Opciones de VACÍA */}
                  {isOpen && (
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-2.5 animate-fade-in">
                      <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1">
                        🔬 Hallazgos Clínicos & Estado del Tracto Reproductivo
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {OPEN_FINDINGS.map(of => {
                          const isSelected = (diag.findings || []).includes(of.id);
                          return (
                            <button
                              key={of.id}
                              type="button"
                              onClick={() => toggleFinding(animal.id, of.id)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 font-black shadow-sm'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {of.label} {isSelected && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB-MÓDULO 3: Opciones de DUDOSA */}
                  {isDoubt && (
                    <div className="p-3.5 rounded-2xl bg-sky-100/70 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-700 space-y-2.5 animate-fade-in">
                      <label className="text-[11px] font-extrabold text-sky-950 dark:text-sky-200 uppercase tracking-wide flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-sky-600" /> Programar Rechequeo / Repetir Palpación
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[15, 21, 30, 45].map(days => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => updateAnimalDiagnosis(animal.id, 'recheckDays', days)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                              parseInt(diag.recheckDays) === days
                                ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            Rechequear en {days} días
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Condición Corporal & Observaciones / Botón Guardar */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                    
                    {/* Condición Corporal (CC) */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        Condición Corporal (CC):
                      </label>
                      <div className="flex items-center gap-1">
                        {BODY_CONDITIONS.map(bc => (
                          <button
                            key={bc.val}
                            type="button"
                            onClick={() => updateAnimalDiagnosis(animal.id, 'bodyCondition', bc.val)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer text-center ${
                              diag.bodyCondition === bc.val
                                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {bc.val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Observaciones o Tratamientos */}
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        Observaciones / Tratamiento:
                      </label>
                      <input
                        type="text"
                        value={diag.notes || ''}
                        onChange={(e) => updateAnimalDiagnosis(animal.id, 'notes', e.target.value)}
                        placeholder="Ej. Aplicar GnRH, celo inducido, lavar..."
                        className="w-full px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Botón de Guardado Individual */}
                    <div className="md:col-span-3 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleSaveSingle(animal)}
                        className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                          isSaved
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-950/20'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/20'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                            <span>✓ Guardada</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Guardar #{animal.tagNumber}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. Barra Flotante Inferior de Guardado de Jornada (Visible en Móvil y Escritorio) */}
      <div className="sticky bottom-3 z-30 bg-slate-900/95 text-white p-3 sm:p-4 rounded-3xl backdrop-blur-md shadow-2xl border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black">
              {stats.evaluated} de {stats.total} hembras diagnosticadas ({stats.pregRate}% Preñez)
            </p>
            <p className="text-[10px] text-slate-400">
              {stats.pregnant} Preñadas • {stats.open} Vacías • {stats.pending} Pendientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleClearDraft}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-400/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Reiniciar y limpiar todos los datos de esta jornada de palpación"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleSaveAllBatch}
            disabled={savingBatch || stats.evaluated === 0}
            className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-950/60 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingBatch ? 'Guardando...' : `Guardar Todo (${stats.evaluated})`}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
