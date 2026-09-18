import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scale, 
  Zap, 
  CheckCircle2, 
  Search, 
  Tag, 
  Flame, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  Calendar, 
  Trash2, 
  Sparkles,
  ClipboardCheck,
  MessageCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { calculateWeightMetrics, formatDate } from '../../services/calculations';
import { triggerWeighingFeedback } from '../../services/soundService';
import { db } from '../../services/db';

const DRAFT_WEIGHTS_KEY = 'bovina_quick_weights_draft';

export function QuickWeighinView({ 
  cattle = [], 
  weighings = [], 
  onSaveBatchWeighings, 
  onSaveBatch,
  onSelectAnimal,
  onNavigate,
  currentUser,
  onOpenChecklist
}) {
  const saveBatchFn = onSaveBatchWeighings || onSaveBatch;
  const activeCattle = cattle.filter(c => c.status === 'Activo');
  const dateInputRef = useRef(null);

  // Modo Checklist & Arqueo conectado a la Báscula
  const [enableChecklistMode, setEnableChecklistMode] = useState(false);

  // La fecha SIEMPRE inicia vacía por solicitud explícita del usuario
  const [weighDate, setWeighDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  
  // Cargar borrador persistente de pesos para que nunca se borren
  const [weightsMap, setWeightsMap] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_WEIGHTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Mapa persistente de animales registrados exitosamente en esta sesión
  const [savedSuccessMap, setSavedSuccessMap] = useState({});
  const [saving, setSaving] = useState(false);

  // Sincronizar automáticamente los pesos en localStorage en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_WEIGHTS_KEY, JSON.stringify(weightsMap));
    } catch (e) {
      console.warn('Error guardando borrador de pesajes:', e);
    }
  }, [weightsMap]);

  // Lista única de Ingreso #
  const entryBatches = useMemo(() => {
    const set = new Set(activeCattle.map(c => c.entryBatch || c.paddock).filter(Boolean));
    return Array.from(set);
  }, [activeCattle]);

  const filteredActive = activeCattle.filter(c => {
    if (selectedBatch && (c.entryBatch || c.paddock) !== selectedBatch) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const batch = (c.entryBatch || c.paddock || '').toLowerCase();
      const tag = (c.tagNumber || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const brand = (c.ironBrand || '').toLowerCase();
      const owner = (c.owner || '').toLowerCase();
      const color = (c.color || '').toLowerCase();
      const breed = (c.breed || '').toLowerCase();
      return tag.includes(q) || name.includes(q) || brand.includes(q) || owner.includes(q) || color.includes(q) || breed.includes(q) || batch.includes(q);
    }
    return true;
  });

  const handleWeightChange = (animalId, weightVal) => {
    setWeightsMap(prev => {
      const updated = { ...prev };
      if (weightVal === '' || weightVal === undefined) {
        delete updated[animalId];
      } else {
        updated[animalId] = weightVal;
      }
      return updated;
    });
  };

  const handleSaveSingle = async (animal) => {
    if (!weighDate || weighDate.trim() === '') {
      triggerWeighingFeedback('warning');
      alert('⚠️ Se tiene que añadir fecha para continuar. Los pesos ingresados se mantendrán intactos.');
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
      return;
    }

    const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(animal.id));
    const existingDates = [animal.entryDate, ...animalWeighs.map(w => w.date)].filter(Boolean).sort();
    const lastRecordedDate = existingDates.length > 0 ? existingDates[existingDates.length - 1] : (animal.entryDate || '');

    if (lastRecordedDate && weighDate < lastRecordedDate) {
      triggerWeighingFeedback('warning');
      alert(`⚠️ La fecha del pesaje (${formatDate(weighDate)}) no puede ser anterior a la última fecha registrada para el animal ${animal.tagNumber} (${formatDate(lastRecordedDate)}). Debe ser una fecha igual o posterior.`);
      return;
    }

    const wVal = parseFloat(weightsMap[animal.id]);
    if (!wVal || wVal <= 0) {
      triggerWeighingFeedback('warning');
      alert('Por favor ingresa un peso válido mayor a 0 kg');
      return;
    }

    if (!saveBatchFn) {
      alert('Error: Función de guardado no disponible');
      return;
    }

    try {
      setSaving(true);
      await saveBatchFn([{
        cattleId: animal.id,
        date: weighDate,
        weight: wVal,
        conditionScore: 3.5,
        notes: 'Pesaje rápido de báscula'
      }]);

      // FEEDBACK SONORO (BEEP DE BÁSCULA) Y HÁPTICO (VIBRACIÓN)
      triggerWeighingFeedback('single');

      // Marcar en VERDE permanente en esta sesión y limpiar el input de borrador
      setSavedSuccessMap(prev => ({ ...prev, [animal.id]: wVal }));
      setWeightsMap(prev => {
        const next = { ...prev };
        delete next[animal.id];
        return next;
      });
    } catch (e) {
      triggerWeighingFeedback('warning');
      alert('Error guardando pesaje: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllFilled = async () => {
    if (!weighDate || weighDate.trim() === '') {
      triggerWeighingFeedback('warning');
      alert('⚠️ Se tiene que añadir fecha para continuar. Todos los pesos ingresados se mantendrán guardados.');
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
      return;
    }

    const invalidAnimals = [];
    Object.keys(weightsMap).forEach(cattleId => {
      const wVal = parseFloat(weightsMap[cattleId]);
      if (!wVal || wVal <= 0) return;
      const a = activeCattle.find(c => String(c.id) === String(cattleId));
      if (!a) return;
      const aWeighs = (weighings || []).filter(w => String(w.cattleId) === String(a.id));
      const dates = [a.entryDate, ...aWeighs.map(w => w.date)].filter(Boolean).sort();
      const lastD = dates.length > 0 ? dates[dates.length - 1] : (a.entryDate || '');
      if (lastD && weighDate < lastD) {
        invalidAnimals.push({ tag: a.tagNumber, lastDate: lastD });
      }
    });

    if (invalidAnimals.length > 0) {
      triggerWeighingFeedback('warning');
      const sample = invalidAnimals[0];
      alert(`⚠️ La fecha de pesaje (${formatDate(weighDate)}) no puede ser anterior a la última fecha registrada del animal ${sample.tag} (${formatDate(sample.lastDate)}). Por favor selecciona una fecha igual o posterior.`);
      return;
    }

    const batch = [];
    const savedIds = {};

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
        savedIds[cattleId] = wVal;
      }
    });

    if (batch.length === 0) {
      triggerWeighingFeedback('warning');
      alert('No has ingresado ningún peso nuevo todavía.');
      return;
    }

    if (!saveBatchFn) {
      alert('Error: Función de guardado no disponible');
      return;
    }

    try {
      setSaving(true);
      await saveBatchFn(batch);
      
      // FEEDBACK SONORO MELÓDICO Y VIBRACIÓN DE LOTE
      triggerWeighingFeedback('batch');

      // Marcar en VERDE todos los registrados
      setSavedSuccessMap(prev => ({ ...prev, ...savedIds }));
      
      // Limpiar solo los que fueron guardados del borrador
      setWeightsMap(prev => {
        const next = { ...prev };
        Object.keys(savedIds).forEach(id => {
          delete next[id];
        });
        return next;
      });
    } catch (e) {
      triggerWeighingFeedback('warning');
      alert('Error guardando pesajes: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('¿Deseas borrar todos los pesos que has escrito temporalmente en pantalla?')) {
      setWeightsMap({});
      try {
        localStorage.removeItem(DRAFT_WEIGHTS_KEY);
      } catch {}
    }
  };

  const filledCount = Object.values(weightsMap).filter(v => parseFloat(v) > 0).length;
  const savedCount = Object.keys(savedSuccessMap).length;
  const isDateMissing = !weighDate || weighDate.trim() === '';
  const isReadyToSaveAll = filledCount > 0 && !isDateMissing;

  // Animales objetivo para el Checklist / Arqueo según filtro activo
  const targetCattleForAudit = useMemo(() => {
    if (selectedBatch) {
      return activeCattle.filter(c => (c.entryBatch || c.paddock) === selectedBatch);
    }
    return activeCattle;
  }, [activeCattle, selectedBatch]);

  // Balance de Arqueo en vivo en la Báscula
  const auditMetrics = useMemo(() => {
    const totalExpected = targetCattleForAudit.length;
    
    const verifiedList = [];
    const missingList = [];

    targetCattleForAudit.forEach(animal => {
      const hasSavedInSession = savedSuccessMap[animal.id];
      const hasTyped = parseFloat(weightsMap[animal.id]) > 0;
      const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(animal.id));
      const hasDateWeigh = weighDate && animalWeighs.some(w => w.date === weighDate);

      if (hasSavedInSession || hasTyped || hasDateWeigh) {
        verifiedList.push(animal);
      } else {
        missingList.push(animal);
      }
    });

    const totalVerified = verifiedList.length;
    const totalMissing = missingList.length;
    const progressPercent = totalExpected > 0 ? Math.round((totalVerified / totalExpected) * 100) : 0;

    return {
      totalExpected,
      totalVerified,
      totalMissing,
      verifiedList,
      missingList,
      progressPercent
    };
  }, [targetCattleForAudit, savedSuccessMap, weightsMap, weighings, weighDate]);

  // Finalizar sesión de pesaje como un Arqueo de Inventario certificado
  const handleFinishAuditSession = async () => {
    if (!weighDate || weighDate.trim() === '') {
      triggerWeighingFeedback('warning');
      alert('⚠️ Se tiene que añadir la Fecha del Pesaje para asentar el Arqueo de Campo.');
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
      return;
    }

    // 1. Guardar cualquier peso pendiente escrito en pantalla
    if (filledCount > 0) {
      await handleSaveAllFilled();
    }

    try {
      setSaving(true);

      const missingListMapped = auditMetrics.missingList.map(a => ({
        id: a.id,
        tagNumber: a.tagNumber || 'S/N',
        name: a.name || '',
        owner: a.owner || 'Hacienda',
        ironBrand: a.ironBrand || '',
        color: a.color || 'No especificado',
        sex: a.sex || '',
        entryBatch: a.entryBatch || a.paddock || '',
        entryWeight: a.entryWeight || '',
        currentWeight: a.currentWeight || a.entryWeight || ''
      }));

      const auditRecord = {
        date: weighDate,
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        inspectorName: currentUser?.name || 'Administrador / Báscula',
        farmName: currentUser?.farmName || 'Mi Finca Ganadera',
        scopeType: selectedBatch ? 'batch' : 'all',
        scopeValue: selectedBatch ? selectedBatch : 'Hato General (Báscula Rápida)',
        locationName: 'Manga / Báscula de Pesaje',
        totalExpected: auditMetrics.totalExpected,
        totalVerified: auditMetrics.totalVerified,
        totalMissing: auditMetrics.totalMissing,
        totalInfiltrated: 0,
        totalWeighed: auditMetrics.totalVerified,
        totalBiomass: Object.values(savedSuccessMap).reduce((acc, v) => acc + (parseFloat(v) || 0), 0),
        missingList: missingListMapped,
        observedList: [],
        userId: currentUser?.id,
        createdAt: new Date().toISOString()
      };

      if (db.audits) {
        await db.audits.add(auditRecord);
      }
      if (currentUser?.id) {
        localStorage.setItem(`ganado_latest_audit_${currentUser.id}`, JSON.stringify(auditRecord));
      }

      // Actualizar fecha de última verificación en el ganado verificado
      const verifiedUpdates = auditMetrics.verifiedList.map(a => 
        db.cattle.update(a.id, { lastVerifiedDate: weighDate })
      );
      await Promise.all(verifiedUpdates);

      triggerWeighingFeedback('batch');

      // WhatsApp Share Message
      const farm = currentUser?.farmName || 'Finca Ganadera';
      let msg = `📋 *ARQUEO & PESAJE DE BÁSCULA - ${farm.toUpperCase()}*\n`;
      msg += `📅 *Fecha:* ${weighDate}\n`;
      msg += `📍 *Lote / Ámbito:* ${selectedBatch ? `Lote ${selectedBatch}` : 'Hato General'}\n`;
      msg += `👤 *Responsable:* ${currentUser?.name || 'Báscula'}\n\n`;
      msg += `📊 *BALANCE DE CAMPO:*\n`;
      msg += `• Total Esperados: *${auditMetrics.totalExpected} cabezas*\n`;
      msg += `• ✅ Verificados / Pesados: *${auditMetrics.totalVerified}* (${auditMetrics.progressPercent}%)\n`;
      msg += `• ❌ Faltantes por Manga: *${auditMetrics.totalMissing}*\n\n`;

      if (auditMetrics.missingList.length > 0) {
        msg += `🚨 *ANIMALES FALTANTES (${auditMetrics.missingList.length}):*\n`;
        auditMetrics.missingList.slice(0, 15).forEach(a => {
          msg += `• No. *${a.tagNumber || 'S/N'}* | ${a.color || 'Sin color'} | ${a.owner || 'Hacienda'}\n`;
        });
        if (auditMetrics.missingList.length > 15) {
          msg += `• ... y ${auditMetrics.missingList.length - 15} animales más.\n`;
        }
        msg += `\n`;
      } else {
        msg += `🎉 *¡100% de animales pesados y verificados! Cero faltantes.*\n\n`;
      }

      msg += `_Generado desde Báscula Rápida en App Ganadera._`;

      const shareConfirm = window.confirm(
        `✅ ¡Arqueo de campo guardado exitosamente en el Tablero!\n\n` +
        `• Esperados: ${auditMetrics.totalExpected}\n` +
        `• Verificados/Pesados: ${auditMetrics.totalVerified}\n` +
        `• Faltantes: ${auditMetrics.totalMissing}\n\n` +
        `¿Deseas compartir este reporte de arqueo por WhatsApp ahora?`
      );

      if (shareConfirm) {
        const encoded = encodeURIComponent(msg);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
      }

    } catch (err) {
      alert('Error guardando arqueo desde báscula: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      
      {/* Banner Báscula Rápida con Feedback de Color Dinámico */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 animate-bounce" />
            Modo Báscula / Chute en Tiempo Real
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            Pesaje Rápido por Lote
            {savedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">
                ✅ {savedCount} Registrados en Verde
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Digita los pesos del lote (amarillo). Selecciona la <strong>Fecha del Pesaje</strong> y al registrar cambiará a <strong>Verde</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Botón Switch Modo Checklist / Arqueo */}
          <button
            type="button"
            onClick={() => setEnableChecklistMode(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer min-h-[42px] border ${
              enableChecklistMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="Activar control de checklist y conteo de faltantes en vivo durante el pesaje"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{enableChecklistMode ? '📋 Checklist Activo' : '📋 + Conectar Checklist'}</span>
          </button>

          <div className="flex-1 sm:flex-initial">
            <label className="block text-[11px] font-black text-amber-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Fecha del Pesaje * (Seleccionar)</span>
            </label>
            <input
              ref={dateInputRef}
              type="date"
              value={weighDate}
              onChange={(e) => setWeighDate(e.target.value)}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-extrabold border backdrop-blur-sm min-h-[42px] focus:outline-none transition ${
                isDateMissing 
                  ? 'bg-rose-500/30 border-rose-400 text-white ring-2 ring-rose-400 animate-pulse' 
                  : 'bg-emerald-500/30 text-white border-emerald-300 ring-2 ring-emerald-400/40'
              }`}
              required
            />
            {isDateMissing && (
              <span className="text-[10px] text-rose-300 font-bold block mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Se tiene que añadir fecha para continuar
              </span>
            )}
          </div>
          
          {/* BOTÓN GUARDAR TODO */}
          <button
            onClick={handleSaveAllFilled}
            disabled={saving}
            className={`self-end px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 min-h-[42px] cursor-pointer ${
              isReadyToSaveAll
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-xl shadow-emerald-500/40 ring-4 ring-emerald-300/40 scale-105 animate-pulse'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/30'
            }`}
            title={
              isReadyToSaveAll 
                ? '¡Listo! Guardar todos los pesajes' 
                : isDateMissing 
                  ? 'Se tiene que añadir fecha para continuar' 
                  : 'Ingresa pesos en los animales abajo'
            }
          >
            {isReadyToSaveAll ? <Sparkles className="w-4 h-4 text-slate-950 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Guardar Todo {filledCount > 0 ? `(${filledCount})` : ''}</span>
          </button>

          {filledCount > 0 && (
            <button
              onClick={handleClearDraft}
              className="self-end p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-rose-200 border border-white/20 text-xs transition cursor-pointer"
              title="Borrar borrador escrito en pantalla"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BARRA FLOTANTE DE AUDITORÍA / CHECKLIST SI ESTÁ ACTIVO */}
      {enableChecklistMode && (
        <div className="p-4 rounded-3xl bg-slate-900 border-2 border-amber-500/60 text-white shadow-2xl space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Modo Arqueo de Campo en Manga Activo
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {selectedBatch ? `Lote ${selectedBatch}` : 'Hato General'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Cada pesaje registrado verifica el animal. Al terminar puedes cerrar el arqueo para actualizar el tablero y enviar a WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenChecklist && (
                <button
                  type="button"
                  onClick={onOpenChecklist}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Planilla / Faltantes</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFinishAuditSession}
                disabled={saving || auditMetrics.totalVerified === 0}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar como Arqueo ({auditMetrics.totalVerified}/{auditMetrics.totalExpected})</span>
              </button>
            </div>
          </div>

          {/* Barra de Progreso y Mini KPIs */}
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.min(100, auditMetrics.progressPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-300 font-bold block text-sm sm:text-base font-mono">{auditMetrics.totalExpected}</span>
                <span className="text-[10px] text-slate-400">Total Esperados</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                <span className="text-emerald-300 font-bold block text-sm sm:text-base font-mono">{auditMetrics.totalVerified}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Pesados / Verificados</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/30">
                <span className="text-rose-300 font-bold block text-sm sm:text-base font-mono">{auditMetrics.totalMissing}</span>
                <span className="text-[10px] text-rose-400 font-semibold">Faltan por Manga</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCattle.length === 0 ? (
        <div className="custom-card p-8 sm:p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
          No hay bovinos activos para pesar. Registra animales en el inventario primero.
        </div>
      ) : (
        <>
          {/* Buscador, Filtro por Ingreso # y Contador de Memoria */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por arete, marca/hierro, dueño, color, nombre o Ingreso #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 shadow-sm min-h-[44px]"
              />
            </div>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none min-h-[44px]"
            >
              <option value="">🏷️ Todos los Ingresos #</option>
              {entryBatches.map(b => (
                <option key={b} value={b}>Ingreso: {b}</option>
              ))}
            </select>

            {filledCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-black whitespace-nowrap shadow-sm">
                ✍️ {filledCount} pesos en amarillo (por registrar)
              </div>
            )}

            {savedCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-black whitespace-nowrap shadow-sm">
                ✅ {savedCount} registrados en verde
              </div>
            )}
          </div>

          {/* Grid de pesaje rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredActive.map(animal => {
              const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
              const wm = calculateWeightMetrics(animal, animalWeighs);
              const currentWeightInput = weightsMap[animal.id] || '';
              const newWeightNum = parseFloat(currentWeightInput) || 0;
              const hasTypedWeight = newWeightNum > 0;
              const gain = newWeightNum > 0 ? (newWeightNum - wm.currentWeight) : 0;
              const batch = animal.entryBatch || animal.paddock || 'Ingreso #1';
              
              // Verificar si fue registrado en esta sesión o si ya tiene pesaje en la fecha seleccionada
              const wasSavedInSession = savedSuccessMap[animal.id];
              const registeredWeight = wasSavedInSession || (weighDate && animalWeighs.find(w => w.date === weighDate)?.weight);
              const isRegistered = Boolean(registeredWeight);
              const isFatReady = animal.sex === 'Macho' && (newWeightNum >= 480 || wm.currentWeight >= 480);

              return (
                <div 
                  key={animal.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                    isRegistered
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 shadow-lg ring-2 ring-emerald-400/50' 
                      : hasTypedWeight
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/40'
                        : isFatReady
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Encabezado del animal */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            {animal.tagNumber}
                          </span>
                          {animal.name && (
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                              ({animal.name})
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                            {batch}
                          </span>
                          {isRegistered && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black animate-fade-in shadow-sm">
                              ✓ REGISTRADO
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {isRegistered ? 'Peso Registrado' : 'Peso Anterior'}
                        </span>
                        <span className={`text-xs font-black ${isRegistered ? 'text-emerald-600 dark:text-emerald-400 text-sm' : 'text-slate-800 dark:text-slate-200'}`}>
                          {isRegistered ? `${registeredWeight} kg` : `${wm.currentWeight} kg`}
                        </span>
                      </div>
                    </div>

                    {/* Fila Destacada: Marca/Hierro, Dueño y Color del Animal */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
                        🏷️ Hierro: <strong className="text-slate-900 dark:text-white font-black">{animal.ironBrand || 'N/A'}</strong>
                      </span>
                      {animal.owner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 max-w-[200px] truncate" title={animal.owner}>
                          👤 Dueño: <strong className="text-blue-900 dark:text-blue-200 font-black truncate">{animal.owner}</strong>
                        </span>
                      )}
                      {animal.color ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-800/60">
                          🎨 Color: <strong className="text-amber-950 dark:text-amber-100 font-black">{animal.color}</strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-medium text-[10px]">
                          🎨 Color: S/R
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {animal.breed || 'Sin raza'} • {animal.sex}
                      </span>
                    </div>
                  </div>

                  {/* Input de Pesaje y Botón de Acción OK */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.5"
                          placeholder={isRegistered ? `Registrado: ${registeredWeight} kg` : "Nuevo peso (kg)"}
                          value={currentWeightInput}
                          onChange={(e) => handleWeightChange(animal.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveSingle(animal);
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-sm font-extrabold border bg-slate-50 dark:bg-slate-950/80 focus:outline-none transition-all ${
                            isRegistered
                              ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/30'
                              : hasTypedWeight 
                                ? 'border-amber-400 ring-2 ring-amber-400/40 text-amber-900 dark:text-amber-200 font-black' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          kg
                        </span>
                      </div>

                      {/* BOTÓN OK: AMARILLO SI ESTÁ PENDIENTE / VERDE SI SE REGISTRÓ */}
                      <button
                        onClick={() => handleSaveSingle(animal)}
                        disabled={saving || (!hasTypedWeight && !isRegistered)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                          isRegistered && !hasTypedWeight
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                            : !hasTypedWeight
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700/60 dark:text-amber-400/50 border border-amber-200 dark:border-amber-800/60 cursor-not-allowed opacity-60'
                              : isDateMissing
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md shadow-amber-400/40 scale-105 animate-bounce'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/30 scale-105'
                        }`}
                        title={
                          isRegistered && !hasTypedWeight
                            ? 'Pesaje ya registrado en verde'
                            : !hasTypedWeight
                              ? 'Digita un peso para activar'
                              : isDateMissing
                                ? 'Se tiene que añadir fecha para continuar'
                                : 'Guardar pesaje de este animal'
                        }
                      >
                        <Check className="w-4 h-4" />
                        <span>{isRegistered && !hasTypedWeight ? 'Listo' : 'OK'}</span>
                      </button>
                    </div>

                    {/* Indicador de Ganancia de Peso en Vivo */}
                    <div className="flex items-center justify-between text-[11px] min-h-[16px]">
                      {newWeightNum > 0 ? (
                        <div className={`font-bold flex items-center gap-1 ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          <span>Diferencia: {gain >= 0 ? `+${gain.toFixed(1)} kg` : `${gain.toFixed(1)} kg`}</span>
                        </div>
                      ) : isRegistered ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ¡Registrado en verde: {registeredWeight} kg!
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          GDP Histórico: {wm.averageDailyGain ? `${wm.averageDailyGain} kg/d` : '-'}
                        </span>
                      )}

                      {isFatReady && (
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5 text-[10px]">
                          <Flame className="w-3 h-3" /> Gordo
                        </span>
                      )}
                    </div>
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
