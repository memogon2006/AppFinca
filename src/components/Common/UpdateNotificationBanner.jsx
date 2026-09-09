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
    <div className="fixed top-2 sm:top-4 left-0 right-0 z-50 px-3 sm:px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white border border-emerald-300/80 dark:border-emerald-500/60 shadow-2xl p-3.5 sm:p-4.5 backdrop-blur-xl transition-all duration-300 ring-2 ring-emerald-400/30">
        
        {/* Cabecera del Banner */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                  ¡Nueva Versión Disponible!
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase shadow-sm">
                  v{updateInfo.latestVersion}
                </span>
              </div>
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

        {/* Descripción sin truncar para que se lea perfectamente en celular */}
        {updateInfo.description && (
          <p className="mt-2 text-xs text-emerald-100/90 leading-relaxed pl-0.5 break-words">
            {updateInfo.description}
          </p>
        )}

        {/* Botón de Actualizar adaptado a móvil y escritorio */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold transition cursor-pointer min-h-[38px]"
          >
            Más tarde
          </button>

          <button
            onClick={handleUpdateClick}
            disabled={updating}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition cursor-pointer min-h-[38px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Actualizando...' : 'Actualizar Ahora'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
