import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { checkAppUpdate, applyAppUpdate } from '../../services/versionService';
import { triggerFeedback } from '../../services/soundService';

export function UpdateNotificationBanner() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const hasAnnouncedUpdateRef = useRef(false);

  // Comprobar actualizaciones al cargar y periódicamente cada 3 minutos
  useEffect(() => {
    let mounted = true;

    async function check() {
      const res = await checkAppUpdate();
      if (mounted && res.hasUpdate) {
        setUpdateInfo(res);
        if (!hasAnnouncedUpdateRef.current) {
          hasAnnouncedUpdateRef.current = true;
          // SONIDO Y VIBRACIÓN AL DETECTAR NUEVA ACTUALIZACIÓN
          triggerFeedback('update');
        }
      }
    }

    check();

    // Comprobar también cuando el usuario regresa a la pestaña (focus)
    const handleFocus = () => check();
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(check, 3 * 60 * 1000);

    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto animate-bounce shadow-2xl">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white border border-emerald-300 dark:border-emerald-500/50 shadow-2xl flex items-center justify-between gap-3 sm:gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                ¡Nueva Versión Disponible ({updateInfo.latestVersion})!
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase flex-shrink-0">
                Nuevo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 truncate mt-0.5">
              {updateInfo.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleUpdateClick}
            disabled={updating}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition min-h-[38px] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Posponer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
