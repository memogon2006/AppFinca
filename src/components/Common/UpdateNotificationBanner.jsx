import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle2, ShieldCheck, Users, Lock, Award } from 'lucide-react';
import { CURRENT_APP_VERSION, checkAppUpdate, applyAppUpdate, isVersionGreater } from '../../services/versionService';
import { triggerFeedback } from '../../services/soundService';

export function UpdateNotificationBanner() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const hasAnnouncedUpdateRef = useRef(false);

  // 1. Registrar versión instalada sin mostrar popup invasivo
  useEffect(() => {
    try {
      localStorage.setItem('last_seen_app_version', CURRENT_APP_VERSION);
    } catch (e) {
      console.warn('Error registrando versión instalada:', e);
    }
  }, []);

  // 2. Monitoreo ultra-reactivo continuo de actualizaciones en la nube y Service Worker
  useEffect(() => {
    let mounted = true;
    let lastCheckTime = 0;

    async function check() {
      const now = Date.now();
      lastCheckTime = now;
      try {
        const res = await checkAppUpdate();
        if (mounted) {
          if (res && res.hasUpdate && isVersionGreater(res.latestVersion, res.currentVersion)) {
            setUpdateInfo(res);
            if (!hasAnnouncedUpdateRef.current) {
              hasAnnouncedUpdateRef.current = true;
              triggerFeedback('update');
            }
          } else {
            setUpdateInfo(null);
          }
        }
      } catch (err) {
        console.warn('Update check failed:', err);
      }
    }

    // Comprobación instantánea
    check();

    // Eventos móviles y de ventana
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    const handlePageShow = () => check();
    const handleOnline = () => check();
    const handleFocus = () => check();
    const handleCustomUpdateEvent = () => check();

    // Comprobación al interactuar con la pantalla (toques/clics)
    const handleUserInteraction = () => {
      if (Date.now() - lastCheckTime > 4000) {
        check();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('app-update-available', handleCustomUpdateEvent);
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    // Sondeo ultra frecuente cada 4 segundos
    const interval = setInterval(check, 4000);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('app-update-available', handleCustomUpdateEvent);
      window.removeEventListener('pointerdown', handleUserInteraction);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleUpdateClick = async () => {
    triggerFeedback('update');
    setUpdating(true);
    await applyAppUpdate();
  };

  // CASO: HAY UNA NUEVA VERSIÓN DISPONIBLE EN LA NUBE
  if (updateInfo && updateInfo.hasUpdate && isVersionGreater(updateInfo.latestVersion, updateInfo.currentVersion) && !dismissed) {
    return (
      <div className="fixed top-2 sm:top-4 left-0 right-0 z-[99999] px-3 sm:px-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white border-2 border-emerald-400 shadow-2xl p-4 sm:p-5 backdrop-blur-xl animate-fade-in ring-4 ring-emerald-500/40">
          
          {/* Cabecera del Banner */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-white tracking-tight">
                    ¡Nueva Actualización Lista!
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase shadow-md animate-bounce">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 font-medium">
                  Versión actual en dispositivo: v{updateInfo.currentVersion}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer shrink-0 active:scale-95"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Descripción de novedades */}
          {updateInfo.description && (
            <div className="mt-2.5 bg-black/30 rounded-xl p-2.5 border border-white/10">
              <p className="text-xs text-emerald-100/95 leading-relaxed pl-0.5 break-words">
                {updateInfo.description}
              </p>
            </div>
          )}

          {/* Botón de Actualizar */}
          <div className="mt-3.5 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold transition cursor-pointer min-h-[42px]"
            >
              Más tarde
            </button>

            <button
              onClick={handleUpdateClick}
              disabled={updating}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/40 transition cursor-pointer min-h-[42px]"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              <span>{updating ? 'Instalando Novedades...' : '⚡ Actualizar Ahora en 1 Clic'}</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
