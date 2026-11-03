import React, { useState, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  History, 
  Search, 
  Clock, 
  User, 
  Tag, 
  AlertTriangle, 
  Flame, 
  Baby, 
  Syringe, 
  ShieldAlert, 
  Check, 
  ChevronRight,
  Filter,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { formatDate } from '../../services/calculations';
import { markAlertAttended, markAlertDismissed, reopenAlert } from '../../services/alertAuditService';

export function AlertsAuditModal({ 
  isOpen, 
  onClose, 
  activeAlerts = [], 
  alertsData = { resolutions: {}, auditLog: [] },
  userId,
  currentUser,
  onOpenCalving,
  onOpenBranding,
  onSelectAnimal
}) {
  const [activeTab, setActiveTab] = useState('attended'); // 'pending' | 'attended' | 'dismissed' | 'audit'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modal rápido de acción
  const [actionAlert, setActionAlert] = useState(null); // alert object
  const [actionType, setActionType] = useState(null); // 'attend' | 'dismiss'
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const operatorName = currentUser?.name || currentUser?.username || 'Administrador';
  const operatorRole = currentUser?.role || 'admin';

  // Separar resoluciones en "Chuleadas / Atendidas" y "Canceladas / Descartadas"
  const resolutionsList = Object.values(alertsData.resolutions || {});
  
  const attendedAlerts = resolutionsList
    .filter(r => r.status === 'attended')
    .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0));

  const dismissedAlerts = resolutionsList
    .filter(r => r.status === 'dismissed')
    .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0));

  const auditLogList = Array.isArray(alertsData.auditLog) ? alertsData.auditLog : [];

  // Filtrado por buscador
  const filterList = (list) => {
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter(item => {
      const title = (item.title || '').toLowerCase();
      const desc = (item.desc || '').toLowerCase();
      const tag = (item.tagNumber || (item.animal && item.animal.tagNumber) || '').toLowerCase();
      const op = (item.operatorName || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || tag.includes(q) || op.includes(q) || notes.includes(q);
    });
  };

  const filteredPending = filterList(activeAlerts);
  const filteredAttended = filterList(attendedAlerts);
  const filteredDismissed = filterList(dismissedAlerts);
  const filteredAudit = filterList(auditLogList);

  const handleStartAttend = (alert, e) => {
    if (e) e.stopPropagation();
    setActionAlert(alert);
    setActionType('attend');
    setActionNotes('Atendida en finca');
  };

  const handleStartDismiss = (alert, e) => {
    if (e) e.stopPropagation();
    setActionAlert(alert);
    setActionType('dismiss');
    setActionNotes('Falsa alarma / No aplica');
  };

  const handleConfirmAction = async () => {
    if (!actionAlert || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'attend') {
        await markAlertAttended({
          alert: actionAlert,
          notes: actionNotes,
          operatorName,
          operatorRole,
          userId
        });
      } else if (actionType === 'dismiss') {
        await markAlertDismissed({
          alert: actionAlert,
          reason: actionNotes,
          operatorName,
          operatorRole,
          userId
        });
      }
      setActionAlert(null);
      setActionType(null);
      setActionNotes('');
    } catch (err) {
      console.error('Error aplicando acción sobre alerta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async (alertId, title, tagNumber, e) => {
    if (e) e.stopPropagation();
    try {
      await reopenAlert({
        alertId,
        alertTitle: title,
        tagNumber,
        operatorName,
        operatorRole,
        userId
      });
    } catch (err) {
      console.error('Error reactivando alerta:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Trazabilidad & Auditoría de Alertas</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial de alertas atendidas (chuleadas), canceladas y activas con registro de operador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas resumen de KPIs de Alertas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === 'pending'
                ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <span>🔔 Pendientes</span>
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeAlerts.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attended')}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === 'attended'
                ? 'bg-emerald-500/15 border-emerald-500/50 ring-2 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span>✅ Chuleadas</span>
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {attendedAlerts.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dismissed')}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === 'dismissed'
                ? 'bg-rose-500/15 border-rose-500/50 ring-2 ring-rose-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <span>🚫 Canceladas</span>
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {dismissedAlerts.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === 'audit'
                ? 'bg-blue-500/15 border-blue-500/50 ring-2 ring-blue-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <span>📜 Bitácora Total</span>
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {auditLogList.length}
            </p>
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por chapa de animal, título de alerta u operario..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Contenedor scrolleable con los listados según la pestaña */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1 min-h-[280px]">
          {/* TAB 1: PENDIENTES */}
          {activeTab === 'pending' && (
            <div className="space-y-2.5">
              {filteredPending.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Sparkles className="w-8 h-8 text-emerald-500/60" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {searchTerm ? 'No hay alertas pendientes que coincidan con la búsqueda.' : '¡No tienes alertas pendientes!'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Todas las alertas zootécnicas y sanitarias están al día o han sido atendidas.
                  </p>
                </div>
              ) : (
                filteredPending.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {alert.title}
                        </h4>
                        {alert.badge && (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${alert.badgeClass || 'bg-amber-500 text-slate-950'}`}>
                            {alert.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {alert.desc}
                      </p>
                    </div>

                    {/* Botones de acción rápida: Chulear (✓) y Cancelar (✕) */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => handleStartAttend(alert, e)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        title="Marcar como atendida / Chulear"
                      >
                        <Check className="w-4 h-4" />
                        <span>Chulear</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleStartDismiss(alert, e)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:text-slate-300 dark:hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Cancelar / Descartar alerta"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ATENDIDAS / CHULEADAS */}
          {activeTab === 'attended' && (
            <div className="space-y-2.5">
              {filteredAttended.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No hay alertas marcadas como atendidas todavía.
                  </p>
                  <p className="text-xs text-slate-500">
                    Cuando chulees alertas pendientes, se guardarán aquí con su registro de fecha y operario.
                  </p>
                </div>
              ) : (
                filteredAttended.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1 rounded-lg bg-emerald-500 text-slate-950 font-black">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        {item.tagNumber && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            #{item.tagNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {item.desc}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                          <User className="w-3.5 h-3.5" />
                          Atendida por: {item.operatorName} ({item.operatorRole})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.resolvedAt)} {new Date(item.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {item.notes && item.notes !== 'Alerta chuleada y atendida en finca' && (
                          <span className="italic text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            "{item.notes}"
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleReopen(item.id, item.title, item.tagNumber, e)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 self-end sm:self-auto"
                      title="Reactivar y devolver al tablero de alertas pendientes"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Deshacer / Reactivar</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CANCELADAS */}
          {activeTab === 'dismissed' && (
            <div className="space-y-2.5">
              {filteredDismissed.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <XCircle className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No tienes alertas canceladas.
                  </p>
                  <p className="text-xs text-slate-500">
                    Las alertas que decidas descartar se archivarán en esta sección para futura referencia.
                  </p>
                </div>
              ) : (
                filteredDismissed.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1 rounded-lg bg-rose-500 text-white font-black">
                          <X className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white line-through opacity-80">
                          {item.title}
                        </h4>
                        {item.tagNumber && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            #{item.tagNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {item.desc}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-rose-800 dark:text-rose-300">
                          <User className="w-3.5 h-3.5" />
                          Cancelada por: {item.operatorName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.resolvedAt)} {new Date(item.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {item.notes && (
                          <span className="italic text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                            Motivo: "{item.notes}"
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleReopen(item.id, item.title, item.tagNumber, e)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 self-end sm:self-auto"
                      title="Reactivar y devolver a la lista de pendientes"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reactivar Alerta</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: BITÁCORA Y TRAZABILIDAD COMPLETA */}
          {activeTab === 'audit' && (
            <div className="space-y-2.5">
              {filteredAudit.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <History className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Aún no hay registros de auditoría de alertas.
                  </p>
                  <p className="text-xs text-slate-500">
                    Cada vez que chulees, canceles o reactives una alerta, quedará grabada aquí con trazabilidad total.
                  </p>
                </div>
              ) : (
                filteredAudit.map((log) => {
                  const isAttended = log.action === 'attended';
                  const isDismissed = log.action === 'dismissed';
                  const isReopened = log.action === 'reopened';

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-start gap-3 shadow-xs"
                    >
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isAttended 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                          : isDismissed 
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isAttended && <CheckCircle2 className="w-4 h-4" />}
                        {isDismissed && <XCircle className="w-4 h-4" />}
                        {isReopened && <RotateCcw className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isAttended 
                                ? 'bg-emerald-500 text-slate-950' 
                                : isDismissed 
                                  ? 'bg-rose-600 text-white' 
                                  : 'bg-blue-600 text-white'
                            }`}>
                              {log.actionLabel || log.action}
                            </span>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              {log.title}
                            </h5>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                          {log.tagNumber && (
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Chapa: #{log.tagNumber}
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                            <User className="w-3 h-3" />
                            {log.operatorName} ({log.operatorRole})
                          </span>
                          {log.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-600 dark:text-slate-400">
                                "{log.notes}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal interno para confirmar Chulear o Cancelar */}
        {actionAlert && (
          <div 
            className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setActionAlert(null)}
          >
            <div 
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${actionType === 'attend' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                    {actionType === 'attend' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    {actionType === 'attend' ? 'Chulear / Marcar Atendida' : 'Cancelar / Descartar Alerta'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActionAlert(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <p className="font-black text-slate-900 dark:text-white">{actionAlert.title}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{actionAlert.desc}</p>
              </div>

              {/* Sugerencias rápidas de motivos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {actionType === 'attend' ? 'Detalle u observación (opcional):' : 'Motivo de descarte (opcional):'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {actionType === 'attend' ? (
                    <>
                      {['✓ Atendida en corral', '✓ Pesaje verificado', '✓ Cría separada', '✓ Tarea realizada'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setActionNotes(preset)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {['✕ Falsa alarma', '✕ No aplica a este animal', '✕ Animal ya vendido/baja', '✕ Postergar'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setActionNotes(preset)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === 'attend' ? 'Ej: Separado en potrero de destete' : 'Ej: Descartado por el administrador'}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionAlert(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 rounded-xl text-xs font-black text-white shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                    actionType === 'attend'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {actionType === 'attend' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar Chuleado</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>Confirmar Cancelación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
