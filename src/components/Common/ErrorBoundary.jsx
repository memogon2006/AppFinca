import React from 'react';
import { applyAppUpdate } from '../../services/versionService';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚠️ Error atrapado por ErrorBoundary:', error, errorInfo);
  }

  handleRecover = async () => {
    try {
      await applyAppUpdate();
    } catch (e) {
      window.location.replace(window.location.origin + window.location.pathname + '?_v=' + Date.now());
    }
  };

  handleHardReset = async () => {
    try {
      sessionStorage.clear();
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {}
    window.location.replace(window.location.origin + window.location.pathname + '?_reset=' + Date.now());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 select-none">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center overflow-hidden p-0.5">
              <img src="/icon-512.png" alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                Sincronizando Plataforma Ganadera
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Se ha detectado una nueva versión o un ajuste de memoria en el navegador. Haz clic en el botón inferior para restaurar y abrir la app de inmediato.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={this.handleRecover}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <span>🔄 Recargar y Restaurar Sistema</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                🧹 Limpiar Caché y Forzar Apertura
              </button>
            </div>

            {this.state.error && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  {this.state.showDetails ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 rounded-xl bg-slate-950 border border-rose-500/20 text-rose-400 text-[10px] text-left overflow-x-auto whitespace-pre-wrap font-mono">
                    {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
