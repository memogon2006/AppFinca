import React, { useState, useRef, useEffect } from 'react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { 
  Cloud, 
  CloudOff, 
  CloudUpload, 
  RefreshCw, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Clock, 
  X,
  AlertTriangle,
  HardDrive
} from 'lucide-react';

export function SyncStatusBadge({ userId, isSyncing = false, onManualSync }) {
  const { isOnline, pendingCount, lastSyncedAt, status } = useSyncStatus(userId, isSyncing);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Aún no registrada en esta sesión';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);

      if (diffSec < 15) return 'Hace unos segundos';
      if (diffSec < 60) return `Hace ${diffSec} segundos`;
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHrs < 24) return `Hace ${diffHrs} h`;
      return date.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Reciente';
    }
  };

  const handleSyncClick = () => {
    if (onManualSync && !isSyncing) {
      onManualSync();
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Botón Píldora Principal en Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`inline-flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer backdrop-blur-sm select-none shadow-sm active:scale-95 ${
          status === 'syncing'
            ? 'bg-sky-500/25 hover:bg-sky-500/35 text-sky-200 border-sky-400/40 shadow-sky-950/20'
            : status === 'offline'
            ? 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border-amber-400/50 shadow-amber-950/20'
            : status === 'pending'
            ? 'bg-yellow-500/25 hover:bg-yellow-500/35 text-yellow-200 border-yellow-400/60 shadow-yellow-950/20 animate-pulse'
            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/30 shadow-emerald-950/20'
        }`}
        title="Ver estado de conexión y sincronización con la nube"
      >
        {status === 'syncing' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-sky-300 animate-spin shrink-0" />
            <span className="hidden xs:inline">Sincronizando...</span>
            <span className="xs:hidden">Nube</span>
          </>
        )}

        {status === 'pending' && (
          <>
            <CloudUpload className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-yellow-400 text-slate-950">
              {pendingCount}
            </span>
            <span className="hidden xs:inline">pendiente{pendingCount > 1 ? 's' : ''}</span>
          </>
        )}

        {status === 'offline' && (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Modo Campo</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                {pendingCount}
              </span>
            )}
          </>
        )}

        {status === 'synced' && (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="hidden xs:inline">Al día</span>
          </>
        )}
      </button>

      {/* Popover Desplegable de Estado */}
      {isOpen && (
        <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-72 sm:w-80 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-white z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                status === 'synced' ? 'bg-emerald-500/20 text-emerald-400' :
                status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                status === 'syncing' ? 'bg-sky-500/20 text-sky-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {status === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                 status === 'offline' ? <WifiOff className="w-4 h-4" /> :
                 status === 'pending' ? <CloudUpload className="w-4 h-4" /> :
                 <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Estado de la Nube
                </h4>
                <p className="text-[11px] font-semibold text-slate-400">
                  {isOnline ? '🟢 Conexión a Internet Activa' : '📡 Modo Sin Conexión (Offline)'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Información Detallada */}
          <div className="py-3 space-y-2.5 text-xs">
            
            {/* Estado de Pendientes */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-300">Cambios en este equipo:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    pendingCount > 0 
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {pendingCount === 0 ? '0 pendientes' : `${pendingCount} por subir`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {pendingCount === 0
                    ? 'Todo tu inventario, pesajes y registros están 100% sincronizados con Firebase.'
                    : 'Los registros están a salvo en la memoria del teléfono. Se subirán a la nube automáticamente.'}
                </p>
              </div>
            </div>

            {/* Última Sincronización */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Último respaldo:
              </span>
              <span className="font-bold text-slate-200">
                {formatRelativeTime(lastSyncedAt)}
              </span>
            </div>

            {/* Modo Offline Consejo */}
            {!isOnline && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p leading-tight>
                  Puedes seguir registrando pesajes y vacas con total normalidad sin señal. Nada se perderá.
                </p>
              </div>
            )}
          </div>

          {/* Botón de Acción Directa */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                handleSyncClick();
                setIsOpen(false);
              }}
              disabled={isSyncing || !isOnline}
              className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                isSyncing || !isOnline
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/40 active:scale-[0.98]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Sincronizando ahora...' : !isOnline ? 'Sin Conexión a Internet' : 'Sincronizar Ahora con la Nube'}
              </span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
