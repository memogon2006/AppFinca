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
  AlertCircle
} from 'lucide-react';
import { formatNumber, formatDate } from '../../services/calculations';

export function ChecklistAuditWidget({ 
  latestAudit, 
  cattle = [], 
  onOpenChecklist, 
  onSelectAnimal,
  onOpenNewAnimal
}) {
  const [searchMissing, setSearchMissing] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Determinar si hay un arqueo registrado
  const hasAudit = Boolean(latestAudit && (latestAudit.totalExpected > 0 || latestAudit.date));

  const userId = latestAudit?.userId;

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
    if (list.length === 0 && Array.isArray(latestAudit?.extraAnimals) && latestAudit.extraAnimals.length > 0) {
      list = latestAudit.extraAnimals;
    }
    return list;
  });

  // Re-sincronizar cuando cambie latestAudit
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
    if (Array.isArray(latestAudit?.extraAnimals) && latestAudit.extraAnimals.length > 0) {
      setExtraAlerts(latestAudit.extraAnimals);
    }
  }, [latestAudit, userId]);

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
    if (!latestAudit || !Array.isArray(latestAudit.missingList)) return [];
    
    let list = latestAudit.missingList;
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
  }, [latestAudit, searchMissing]);

  // Compartir solo la lista de faltantes por WhatsApp
  const handleShareMissingWhatsApp = () => {
    if (!latestAudit || !latestAudit.missingList || latestAudit.missingList.length === 0) return;

    let msg = `🚨 *ALERTA DE ANIMALES FALTANTES / EXTRAVIADOS*\n`;
    msg += `📍 *Finca:* ${latestAudit.farmName || 'Hacienda'}\n`;
    msg += `📅 *Fecha Arqueo:* ${latestAudit.date} ${latestAudit.time ? `(${latestAudit.time})` : ''}\n`;
    msg += `👤 *Responsable:* ${latestAudit.inspectorName || 'Administrador'}\n`;
    msg += `📊 *Balance:* ${latestAudit.totalMissing} faltantes de ${latestAudit.totalExpected} esperados\n\n`;
    msg += `*DETALLE DE ANIMALES POR BUSCAR:*\n`;

    latestAudit.missingList.forEach((a, idx) => {
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

  const progressPercent = latestAudit.totalExpected > 0 
    ? Math.round((latestAudit.totalVerified / latestAudit.totalExpected) * 100) 
    : 0;

  const isComplete = (latestAudit.totalMissing || 0) === 0;

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
                {isComplete ? '✓ 100% Verificado' : `⚠️ ${latestAudit.totalMissing} Faltantes`}
              </span>
            </div>

            {/* Metadatos del Arqueo: Fecha, Inspector, Ámbito */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Fecha: <strong>{formatDate(latestAudit.date)} {latestAudit.time && `• ${latestAudit.time}`}</strong>
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Responsable: <strong>{latestAudit.inspectorName || 'Administrador'}</strong>
              </span>
              {latestAudit.scopeValue && (
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                  <Layers className="w-3.5 h-3.5 text-teal-500" />
                  Ámbito: <strong>{latestAudit.scopeValue}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Widget */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {latestAudit.totalMissing > 0 && (
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
            {formatNumber(latestAudit.totalExpected || 0, 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Cabezas registradas</span>
        </div>

        {/* Total Contados / Verificados */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 text-center">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Total Contados
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
            {formatNumber(latestAudit.totalVerified || 0, 0)}
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
            {formatNumber(latestAudit.totalMissing || 0, 0)}
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
            {(latestAudit.totalInfiltrated || 0) + (latestAudit.observedList?.length || 0)}
          </p>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
            {latestAudit.totalInfiltrated || 0} infiltrados • {latestAudit.observedList?.length || 0} obs.
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN DE ANIMALES FALTANTES (TABLA / TARJETAS DETALLADAS) */}
      {/* ========================================================================= */}
      {latestAudit.totalMissing > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/80 space-y-3.5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500 text-white font-black">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                  Animales Faltantes por Ubicar ({latestAudit.totalMissing}):
                </h4>
                <p className="text-[11px] text-rose-800 dark:text-rose-300">
                  Desglose con Número de Arete, Dueño, Marca de Hierro y Color:
                </p>
              </div>
            </div>

            {/* Buscador de faltantes */}
            {latestAudit.missingList && latestAudit.missingList.length > 4 && (
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
                Todas las {latestAudit.totalExpected} cabezas del grupo fueron verificadas físicamente en campo.
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

    </div>
  );
}
