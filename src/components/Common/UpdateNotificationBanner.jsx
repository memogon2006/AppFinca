import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { checkAppUpdate, applyAppUpdate } from '../../services/versionService';
import { triggerFeedback } from '../../services/soundService';

export function UpdateNotificationBanner() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const hasAnnouncedUpdateRef = useRef(false);

  // Comprobar actualizaciones al cargar, al cambiar visibilidad en celular, al interactuar y periódicamente
  useEffect(() => {
    let mounted = true;
    let lastCheckTime = 0;

    async function check() {
      const now = Date.now();
      lastCheckTime = now;
      try {
        const res = await checkAppUpdate();
        if (mounted && res && res.hasUpdate) {
          setUpdateInfo(res);
          if (!hasAnnouncedUpdateRef.current) {
            hasAnnouncedUpdateRef.current = true;
            // SONIDO AL DETECTAR NUEVA ACTUALIZACIÓN
            triggerFeedback('update');
          }
        }
      } catch (err) {
        console.warn('Update check failed:', err);
      }
    }

    check();

    // Eventos móviles prioritarios: visibilidad de pestaña, retorno a la app y conexión
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    const handlePageShow = () => check();
    const handleOnline = () => check();
    const handleFocus = () => check();

    // Comprobación al interactuar (toques en celular / clics), con límite de 8 segundos
    const handleUserInteraction = () => {
      if (Date.now() - lastCheckTime > 8000) {
        check();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    // Sondeo ultra frecuente cada 10 segundos
    const interval = setInterval(check, 10 * 1000);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pointerdown', handleUserInteraction);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateClick = async () => {
    triggerFeedback('update');
    setUpdating(true);
    await applyAppUpdate();
  };

  if (!updateInfo || !updateInfo.hasUpdate || dismissed) return null;

  return (
    <div className="fixed top-2 sm:top-4 left-0 right-0 z-[9990] px-3 sm:px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white border-2 border-emerald-400 shadow-2xl p-4 sm:p-5 backdrop-blur-xl animate-fade-in ring-4 ring-emerald-500/30">
        
        {/* Cabecera del Banner */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white tracking-tight">
                  ¡Nueva Versión Disponible!
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase shadow-sm">
                  v{updateInfo.latestVersion}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Tu versión instalada: v{updateInfo.currentVersion}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer shrink-0 active:scale-95"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Descripción de novedades */}
        {updateInfo.description && (
          <p className="mt-2.5 text-xs text-emerald-100/90 leading-relaxed pl-0.5 break-words">
            {updateInfo.description}
          </p>
        )}

        {/* Botón de Actualizar */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold transition cursor-pointer min-h-[40px]"
          >
            Más tarde
          </button>

          <button
            onClick={handleUpdateClick}
            disabled={updating}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition cursor-pointer min-h-[40px]"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Actualizando...' : 'Actualizar Ahora'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
