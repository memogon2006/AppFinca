import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Calendar, 
  MapPin, 
  Search, 
  MessageCircle, 
  ArrowRight, 
  Layers, 
  Tag, 
  Clock, 
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  RotateCw,
  History,
  X,
  Eye
} from 'lucide-react';
import { formatNumber, formatDate, parseAuditTimestamp } from '../../services/calculations';
import { db } from '../../services/db';

export function ChecklistAuditWidget({ 
  latestAudit, 
  audits = [],
  cattle = [], 
  onOpenChecklist, 
  onSelectAnimal,
  onOpenNewAnimal
}) {
  const [searchMissing, setSearchMissing] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lista ordenada de todos los arqueos disponibles
  const sortedAudits = useMemo(() => {
    const list = Array.isArray(audits) ? [...audits] : [];
    return list.sort((a, b) => {
      const diff = parseAuditTimestamp(b) - parseAuditTimestamp(a);
      if (diff !== 0 && !isNaN(diff)) return diff;
      return (b.id || 0) - (a.id || 0);
    });
  }, [audits]);

  // Arqueo actualmente activo para visualización (seleccionado o el más reciente)
  const audit = useMemo(() => {
    if (selectedAuditId) {
      const match = sortedAudits.find(a => a.id === selectedAuditId);
      if (match) return match;
    }
    return latestAudit || sortedAudits[0] || null;
  }, [selectedAuditId, sortedAudits, latestAudit]);

  // Determinar si hay un arqueo registrado
  const hasAudit = Boolean(audit && (audit.totalExpected > 0 || audit.date));

  const userId = audit?.userId;

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('ganado_audit_updated'));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteAudit = async (auditToDelete, e) => {
    if (e) e.stopPropagation();
    const dateLabel = formatDate(auditToDelete.date);
    if (!window.confirm(`¿Deseas eliminar este registro de arqueo (${dateLabel} - ${auditToDelete.totalExpected} cabezas)?`)) return;
    try {
      if (db.audits && auditToDelete.id) {
        await db.audits.delete(auditToDelete.id);
      }
      try {
        const activeRaw = localStorage.getItem('ganado_latest_audit_active');
        if (activeRaw) {
          const parsed = JSON.parse(activeRaw);
          if (parsed.id === auditToDelete.id || (parsed.date === auditToDelete.date && parsed.time === auditToDelete.time)) {
            localStorage.removeItem('ganado_latest_audit_active');
          }
        }
      } catch (err) {}
      if (selectedAuditId === auditToDelete.id) {
        setSelectedAuditId(null);
      }
      window.dispatchEvent(new CustomEvent('ganado_audit_updated'));
    } catch (err) {
      alert(`Error al eliminar arqueo: ${err.message}`);
    }
  };

  // Estado para alertas de animales extra no registrados
  const [extraAlerts, setExtraAlerts] = useState(() => {
    let list = [];
    if (userId) {
      try {
        const raw = localStorage.getItem(`ganado_unresolved_extra_alerts_${userId}`);
        if (raw) list = JSON.parse(raw);
      } catch (e) {
        list = [];
      }
    }
    if (list.length === 0 && Array.isArray(audit?.extraAnimals) && audit.extraAnimals.length > 0) {
      list = audit.extraAnimals;
    }
    return list;
  });

  // Re-sincronizar cuando cambie audit
  useEffect(() => {
    if (userId) {
      try {
        const raw = localStorage.getItem(`ganado_unresolved_extra_alerts_${userId}`);
        if (raw) {
          setExtraAlerts(JSON.parse(raw));
          return;
        }
      } catch (e) {}
    }
    if (Array.isArray(audit?.extraAnimals) && audit.extraAnimals.length > 0) {
      setExtraAlerts(audit.extraAnimals);
    }
  }, [audit, userId]);

  // Guardar estado de alertas
  const saveAlerts = (newList) => {
    setExtraAlerts(newList);
    if (userId) {
      localStorage.setItem(`ganado_unresolved_extra_alerts_${userId}`, JSON.stringify(newList));
    }
  };

  // Acción 1: Crear Bovino Oficial a partir del animal extra
  const handleCreateOfficialBovine = (alertItem) => {
    if (onOpenNewAnimal) {
      const isAutoTag = (alertItem.tagNumber || '').startsWith('EXTRA-');
      onOpenNewAnimal({
        tagNumber: isAutoTag ? '' : alertItem.tagNumber,
        name: `Bovino ${alertItem.tagNumber || ''}`,
        color: alertItem.color || '',
        sex: alertItem.sex || 'Macho',
        entryWeight: alertItem.weight || '',
        notes: `Detectado en Arqueo (${alertItem.detectedAt || 'Reciente'}): ${alertItem.note || ''}`
      });
      // Remover de las alertas
      saveAlerts(extraAlerts.filter(a => a.id !== alertItem.id));
    }
  };

  // Acción 2: Marcar como resuelto / aclarado (ej. devuelto a vecino)
  const handleResolveAlert = (alertItem) => {
    const reason = window.prompt('Indica una nota de resolución (ej. "Devuelto al vecino", "Aclarado"):', 'Aclarado / Resuelto');
    if (reason !== null) {
      saveAlerts(extraAlerts.filter(a => a.id !== alertItem.id));
    }
  };

  // Acción 3: Descartar alerta
  const handleDismissAlert = (alertItem) => {
    if (window.confirm(`¿Deseas descartar la alerta del animal extra ${alertItem.tagNumber || ''}?`)) {
      saveAlerts(extraAlerts.filter(a => a.id !== alertItem.id));
    }
  };

  // Animales activos actuales
  const activeCattle = useMemo(() => {
    return cattle.filter(c => c.status === 'Activo');
  }, [cattle]);

  // Lista de faltantes del último arqueo filtrados por búsqueda
  const missingList = useMemo(() => {
    if (!audit || !Array.isArray(audit.missingList)) return [];
    
    let list = audit.missingList;
    if (searchMissing.trim()) {
      const q = searchMissing.toLowerCase().trim();
      list = list.filter(a => {
        const tag = (a.tagNumber || '').toLowerCase();
        const owner = (a.owner || '').toLowerCase();
        const brand = (a.ironBrand || '').toLowerCase();
        const color = (a.color || '').toLowerCase();
        const batch = (a.entryBatch || '').toLowerCase();
        return tag.includes(q) || owner.includes(q) || brand.includes(q) || color.includes(q) || batch.includes(q);
      });
    }
    return list;
  }, [audit, searchMissing]);

  // Compartir solo la lista de faltantes por WhatsApp
  const handleShareMissingWhatsApp = () => {
    if (!audit || !audit.missingList || audit.missingList.length === 0) return;

    let msg = `🚨 *ALERTA DE ANIMALES FALTANTES / EXTRAVIADOS*\n`;
    msg += `📍 *Finca:* ${audit.farmName || 'Hacienda'}\n`;
    msg += `📅 *Fecha Arqueo:* ${audit.date} ${audit.time ? `(${audit.time})` : ''}\n`;
    msg += `👤 *Responsable:* ${audit.inspectorName || 'Administrador'}\n`;
    msg += `📊 *Balance:* ${audit.totalMissing} faltantes de ${audit.totalExpected} esperados\n\n`;
    msg += `*DETALLE DE ANIMALES POR BUSCAR:*\n`;

    audit.missingList.forEach((a, idx) => {
      msg += `\n${idx + 1}. *No. ${a.tagNumber || 'S/N'}*\n`;
      msg += `   • *Dueño:* ${a.owner || 'Hacienda'}\n`;
      if (a.ironBrand) msg += `   • *Marca Hierro:* ${a.ironBrand}\n`;
      msg += `   • *Color:* ${a.color || 'No especificado'}\n`;
      if (a.entryBatch) msg += `   • *Lote/Potrero:* ${a.entryBatch}\n`;
    });

    msg += `\n_Favor verificar potreros y linderos urgentemente._`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Si no hay ningún arqueo guardado aún
  if (!hasAudit) {
    return (
      <div className="custom-card p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-emerald-500/10 border border-amber-300/40 dark:border-amber-500/30 rounded-3xl shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black shrink-0 shadow-md">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Checklist & Arqueo de Inventario Físico
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Control de Campo
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Audita físicamente tus animales en manga o potrero. El sistema te mostrará aquí en tiempo real la <strong>fecha, responsable, cantidad total contada y la lista exacta de animales faltantes con su arete, dueño, marca y color</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenChecklist}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 transition cursor-pointer shrink-0"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>📋 Realizar Primer Arqueo</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = audit.totalExpected > 0 
    ? Math.round((audit.totalVerified / audit.totalExpected) * 100) 
    : 0;

  const isComplete = (audit.totalMissing || 0) === 0;

  return (
    <div className="custom-card p-5 sm:p-6 space-y-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900/90 transition">
      
      {/* ========================================================================= */}
      {/* CABECERA DEL WIDGET */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Último Arqueo & Checklist de Inventario
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isComplete 
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
              }`}>
                {isComplete ? '✓ 100% Verificado' : `⚠️ ${audit.totalMissing} Faltantes`}
              </span>

              {selectedAuditId && (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    👁️ Vista Histórica
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAuditId(null)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 underline font-bold hover:text-amber-500 cursor-pointer"
                  >
                    Volver al Más Reciente
                  </button>
                </div>
              )}
            </div>

            {/* Metadatos del Arqueo: Fecha, Inspector, Ámbito */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Fecha: <strong>{formatDate(audit.date)} {audit.time && `• ${audit.time}`}</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Responsable: <strong>{audit.inspectorName || 'Administrador'}</strong>
              </span>
              {audit.scopeValue && (
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <Layers className="w-3.5 h-3.5 text-teal-500" />
                  Ámbito: <strong>{audit.scopeValue}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Widget */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
          {sortedAudits.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Ver historial de arqueos y conteos pasados"
            >
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Historial ({sortedAudits.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Refrescar datos del arqueo"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {audit.totalMissing > 0 && (
            <button
              onClick={handleShareMissingWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 transition cursor-pointer shadow-sm"
              title="Compartir alerta de faltantes por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Faltantes</span>
            </button>
          )}

          <button
            onClick={onOpenChecklist}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition cursor-pointer"
            title="Iniciar un nuevo arqueo o conteo en manga"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>+ Nuevo Arqueo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 TARJETAS DE MÉTRICAS DEL ARQUEO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Total Esperados */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Totales en Finca / Grupo
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
            {formatNumber(audit.totalExpected || 0, 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Cabezas registradas</span>
        </div>

        {/* Total Contados / Verificados */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 text-center">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Total Contados
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
            {formatNumber(audit.totalVerified || 0, 0)}
          </p>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {progressPercent}% de efectividad
          </span>
        </div>

        {/* Faltantes / Extraviados */}
        <div className={`p-3.5 rounded-2xl border text-center ${
          isComplete 
            ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/80'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            isComplete ? 'text-slate-500 dark:text-slate-400' : 'text-rose-800 dark:text-rose-300'
          }`}>
            Faltantes
          </span>
          <p className={`text-2xl sm:text-3xl font-black tabular-nums mt-0.5 ${
            isComplete ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatNumber(audit.totalMissing || 0, 0)}
          </p>
          <span className={`text-[10px] font-bold ${
            isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isComplete ? '✓ Cero faltantes' : '⚠️ Por ubicar en campo'}
          </span>
        </div>

        {/* Infiltrados / Novedades */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 text-center">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Infiltrados / Novedades
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">
            {(audit.totalInfiltrated || 0) + (audit.observedList?.length || 0)}
          </p>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
            {audit.totalInfiltrated || 0} infiltrados • {audit.observedList?.length || 0} obs.
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN DE ANIMALES FALTANTES (TABLA / TARJETAS DETALLADAS) */}
      {/* ========================================================================= */}
      {audit.totalMissing > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 space-y-3.5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500 text-white font-black">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                  Animales Faltantes por Ubicar ({audit.totalMissing}):
                </h4>
                <p className="text-[11px] text-rose-800 dark:text-rose-300">
                  Desglose con Número de Arete, Dueño, Marca de Hierro y Color:
                </p>
              </div>
            </div>

            {/* Buscador de faltantes */}
            {audit.missingList && audit.missingList.length > 4 && (
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por arete, dueño, marca..."
                  value={searchMissing}
                  onChange={(e) => setSearchMissing(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}
          </div>

          {/* Grilla de Tarjetas de Animales Faltantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {missingList.map((animal) => (
              <div
                key={animal.id || animal.tagNumber}
                onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/80 shadow-xs hover:border-rose-400 transition cursor-pointer flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="font-mono font-black text-sm text-slate-950 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                      No. {animal.tagNumber}
                    </span>
                  </div>

                  {animal.sex && (
                    <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                      animal.sex === 'Macho'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                    }`}>
                      {animal.sex}
                    </span>
                  )}
                </div>

                {/* Campos requeridos: Dueño, Marca de Hierro, Color */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Dueño / Sociedad:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                      {animal.owner || 'Hacienda'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Marca de Hierro:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-[11px] truncate block font-mono">
                      {animal.ironBrand ? `🔥 ${animal.ironBrand}` : 'Sin marca'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Color / Pelaje:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                      🎨 {animal.color || 'No especificado'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Lote / Potrero:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                      📍 {animal.entryBatch || 'General'}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {missingList.length === 0 && searchMissing && (
            <p className="text-xs text-rose-700 dark:text-rose-300 text-center py-2">
              No se encontraron animales faltantes que coincidan con "{searchMissing}".
            </p>
          )}

        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white font-black shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
                ¡Inventario 100% Completo! Cero Animales Faltantes
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Todas las {audit.totalExpected} cabezas del grupo fueron verificadas físicamente en campo.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenChecklist}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shrink-0"
          >
            Repetir Conteo
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN DE ALERTAS DE PROCEDENCIA: ANIMALES EXTRA NO REGISTRADOS ⚠️ */}
      {/* ========================================================================= */}
      {extraAlerts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/90 space-y-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide flex items-center gap-2">
                  <span>Alertas de Procedencia: Animales Extra Detectados ({extraAlerts.length})</span>
                  <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black lowercase">
                    por verificar
                  </span>
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Animales contados en manga que no figuraban en el inventario oficial. Puedes formalizarlos en el hato o aclararlos:
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-xl self-start sm:self-center">
              ⚠️ Requiere Verificación
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {extraAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-xs">
                        {alert.tagNumber || 'EXTRA'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        alert.sex === 'Hembra' ? 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {alert.sex || 'Macho'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-semibold">
                      Detectado: {alert.detectedAt ? formatDate(alert.detectedAt) : 'Arqueo reciente'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                      <span>🎨 Color: <strong>{alert.color || 'Sin color especificado'}</strong></span>
                      {alert.weight > 0 && (
                        <span>• ⚖️ Peso: <strong>{alert.weight} kg</strong></span>
                      )}
                    </div>
                    {alert.note && (
                      <p className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60">
                        💬 <strong>Nota / Procedencia:</strong> {alert.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3 Botones de Acción */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleCreateOfficialBovine(alert)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                    title="Crear ficha oficial para este bovino en el inventario"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ Crear Bovino Oficial</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResolveAlert(alert)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      title="Marcar como resuelto (ej. devuelto a vecino)"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>✓ Aclarado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDismissAlert(alert)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] transition cursor-pointer"
                      title="Descartar alerta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE HISTORIAL DE ARQUEOS Y AUDITORÍAS */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setShowHistoryModal(false)}
        >
          <div 
            className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Historial de Arqueos & Checklist
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sortedAudits.length} conteo(s) registrado(s) en la base de datos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de Arqueos Históricos */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {sortedAudits.map((item, idx) => {
                const isLatest = idx === 0;
                const isViewing = (audit?.id && item.id === audit.id) || (!audit?.id && isLatest);
                return (
                  <div
                    key={item.id || idx}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isViewing
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            📅 {formatDate(item.date)} {item.time && `• ${item.time}`}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              ⭐ Más Reciente
                            </span>
                          )}
                          {isViewing && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              👁️ Activo en Pantalla
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>👤 {item.inspectorName || 'Administrador'}</span>
                          <span>•</span>
                          <span>📍 {item.scopeValue || 'Hato General'}</span>
                        </div>

                        {/* Mini Métricas del Arqueo */}
                        <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300">
                            Total: <strong>{item.totalExpected || 0}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Contados: <strong>{item.totalVerified || 0}</strong>
                          </span>
                          <span>•</span>
                          <span className={(item.totalMissing || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
                            Faltantes: <strong>{item.totalMissing || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAuditId(item.id || null);
                            setShowHistoryModal(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                            isViewing
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isViewing ? 'Viendo' : 'Ver'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteAudit(item, e)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          title="Eliminar este arqueo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pie del modal */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedAuditId(null);
                  setShowHistoryModal(false);
                }}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Volver siempre al Más Reciente
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
