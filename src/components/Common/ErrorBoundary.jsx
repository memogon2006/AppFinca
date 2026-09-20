import React from 'react';
import { applyAppUpdate } from '../../services/versionService';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
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

            <button
              type="button"
              onClick={this.handleRecover}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <span>🔄 Recargar y Restaurar Sistema</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
