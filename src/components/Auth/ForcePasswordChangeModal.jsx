import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  LogOut,
  Sparkles,
  KeyRound
} from 'lucide-react';

export function ForcePasswordChangeModal({ isOpen }) {
  const { currentUser, forceSetNewPassword, logout } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanNew) {
      return setError('Por favor ingresa tu nueva contraseña.');
    }
    if (cleanNew.length < 4) {
      return setError('La nueva contraseña debe tener al menos 4 caracteres.');
    }
    if (cleanNew !== cleanConfirm) {
      return setError('Las contraseñas no coinciden. Por favor verifícalas.');
    }

    try {
      setLoading(true);
      await forceSetNewPassword(cleanNew);
    } catch (err) {
      setError(err.message || 'Error al guardar la nueva contraseña.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col my-auto">
        
        {/* Banner Superior Decorativo */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 p-1.5" />

        {/* Encabezado */}
        <div className="p-6 sm:p-7 text-center space-y-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-700/80 shadow-md shadow-amber-500/20">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <ShieldAlert className="w-3.5 h-3.5" />
              Paso Obligatorio por Seguridad
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
              Crea tu Nueva Contraseña
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              Has ingresado utilizando una clave temporal de recuperación para la cuenta de <span className="font-bold text-slate-900 dark:text-white font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{currentUser?.email}</span>.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Por la seguridad de tu ganadería y tus registros, debes definir una contraseña personal y definitiva que recuerdes con facilidad.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Nueva Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nueva Contraseña Personal <span className="text-rose-500">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showNew ? 'Ocultar' : 'Ver clave'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                  placeholder="Mínimo 4 caracteres (ej. MiFinca2026*)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Confirmar Nueva Contraseña <span className="text-rose-500">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showConfirm ? 'Ocultar' : 'Ver'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Vuelve a escribir la contraseña exacta"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition active:scale-[0.98] cursor-pointer min-h-[52px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>🔒 Guardar Nueva Contraseña y Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Opción de Salida */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={logout}
              className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión e ingresar más tarde</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
