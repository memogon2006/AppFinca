import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/db';
import { cloudSaveUser, cloudPushData } from '../../services/cloudSync';
import { 
  Lock, 
  Mail, 
  User, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Moon, 
  AlertCircle,
  DownloadCloud,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
  Send,
  Zap,
  TrendingUp,
  Square
} from 'lucide-react';

import { PrivacyPolicyModal } from '../Common/PrivacyPolicyModal';
import { checkAppUpdate, isVersionGreater } from '../../services/versionService';
import { getLoginLockoutStatus } from '../../services/auth';
import { FARM_PRESETS, applyFarmPreset } from '../../services/moduleService';

export function AuthView() {
  const { login, register, setSessionUser, requestResetPassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Auto-actualización silenciosa y transparente en segundo plano (sin popups ni alertas en el login)
  useEffect(() => {
    async function silentBackgroundUpdate() {
      try {
        const res = await checkAppUpdate();
        if (res && res.hasUpdate && isVersionGreater(res.latestVersion, res.currentVersion)) {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) {
              await r.update();
            }
          }
        }
      } catch (e) {}
    }
    silentBackgroundUpdate();
  }, []);

  // Toggle para ver / ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Recordar correo en este dispositivo
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('ganado_remember_login') === 'true';
  });

  const [selectedFarmPreset, setSelectedFarmPreset] = useState('completo');

  const [formData, setFormData] = useState({
    name: '',
    farmName: '',
    email: localStorage.getItem('ganado_saved_email') || '',
    password: '',
    confirmPassword: '',
  });

  // Estado de bloqueo de seguridad por 5 intentos fallidos
  const [lockoutStatus, setLockoutStatus] = useState(() => {
    const savedEmail = localStorage.getItem('ganado_saved_email') || '';
    return getLoginLockoutStatus(savedEmail);
  });

  // Monitoreo segundo a segundo del tiempo de bloqueo
  useEffect(() => {
    const email = (formData.email || '').trim().toLowerCase();
    const checkLockout = () => {
      const status = getLoginLockoutStatus(email);
      setLockoutStatus(status);
      if (!status.isLocked && error && error.includes('bloqueado temporalmente')) {
        setError(null);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [formData.email, error]);

  // Estado para clave temporal recuperada
  const [recoveredData, setRecoveredData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  const handleCopyTempKey = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setRecoveredData(null);

    const email = (formData.email || '').trim();
    if (!email) {
      return setError('Por favor ingresa el correo electrónico de tu cuenta.');
    }

    try {
      setLoading(true);
      const res = await (requestResetPassword ? requestResetPassword(email) : Promise.reject(new Error('Función no disponible')));
      setRecoveredData(res);
      setSuccessMsg(`¡Clave temporal generada! Revisa tu correo ${email} o usa la clave que aparece en pantalla.`);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = (formData.email || '').trim();
    const password = (formData.password || '').trim();

    // Guardar o borrar preferencia de recordar correo
    if (rememberMe && email) {
      localStorage.setItem('ganado_remember_login', 'true');
      localStorage.setItem('ganado_saved_email', email);
    } else {
      localStorage.removeItem('ganado_remember_login');
      localStorage.removeItem('ganado_saved_email');
    }

    if (mode === 'register') {
      const name = (formData.name || '').trim();
      const farmName = (formData.farmName || '').trim();
      const confirmPassword = (formData.confirmPassword || '').trim();

      if (!name) return setError('Por favor ingresa tu nombre de ganadero.');
      if (!farmName) return setError('Por favor ingresa el nombre de tu finca o hacienda.');
      if (!email) return setError('Por favor ingresa un correo o usuario.');
      if (!password) return setError('Por favor ingresa una contraseña.');
      if (password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres.');
      if (password !== confirmPassword) {
        return setError('Las contraseñas no coinciden. Verifícalas por favor.');
      }
      if (!acceptedTerms) {
        return setError('⚠️ Debes marcar la casilla para aceptar los Términos y Condiciones y la Política de Privacidad.');
      }

      try {
        setLoading(true);
        const presetModules = FARM_PRESETS[selectedFarmPreset.toUpperCase()]?.modules || null;
        await register({ 
          name, 
          farmName, 
          email, 
          password,
          farmPreset: selectedFarmPreset,
          activeModules: presetModules
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        return setError('Por favor ingresa tu correo/usuario y contraseña.');
      }
      if (lockoutStatus.isLocked) {
        return setError(`⛔ Acceso bloqueado temporalmente por seguridad tras 5 intentos fallidos. Podrás intentar nuevamente en ${lockoutStatus.formattedRemaining}.`);
      }
      try {
        setLoading(true);
        await login({ email, password });
      } catch (err) {
        const status = getLoginLockoutStatus(email);
        setLockoutStatus(status);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Restauración de respaldo directo desde la pantalla de login con auto-inicio de sesión
  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const data = JSON.parse(event.target.result);
        let activeUser = null;

        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
          for (const u of data.users) {
            await db.users.put(u);
            await cloudSaveUser(u);
            await cloudPushData(u.id);
          }
          activeUser = data.users[0];
        }

        if (data.cattle && Array.isArray(data.cattle)) {
          for (const item of data.cattle) {
            await db.cattle.put(item);
          }
        }
        if (data.weighings && Array.isArray(data.weighings)) {
          for (const item of data.weighings) {
            await db.weighings.put(item);
          }
        }

        if (activeUser) {
          const session = {
            id: activeUser.id,
            name: activeUser.name || 'Ganadero',
            farmName: activeUser.farmName || 'Mi Finca Ganadera',
            email: activeUser.email,
            createdAt: activeUser.createdAt,
          };
          setSessionUser(session);
        } else {
          setSuccessMsg('¡Copia de seguridad restaurada con éxito! Ya puedes iniciar sesión con tu cuenta.');
        }
      } catch (err) {
        setError('El archivo de respaldo no tiene el formato correcto o está dañado.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 dark:bg-slate-950 p-3 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Luces de fondo ambientales / Gradientes sutiles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Botón Flotante de Modo Claro/Oscuro */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-lg hover:scale-105 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Cambiar Modo Claro/Oscuro"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-slate-100" />}
        </button>
      </div>

      {/* Contenedor Principal: Split Screen en desktop / Tarjeta única en móvil */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: HERO VISUAL & BENEFICIOS GANADEROS (5 Columnas en lg) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#063327] via-[#084233] to-[#04241b] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-emerald-900/50">
          
          {/* Patrón de luz interno */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            
            {/* Logo de la App */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950 border border-emerald-400/30 shadow-xl overflow-hidden p-0.5 shrink-0 flex items-center justify-center">
                <img src="/icon-512.png" alt="Logo Ganadero" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[#e8fe85] font-extrabold text-[10px] uppercase tracking-wider">
                  Sistema Ganadero
                </span>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight mt-0.5">
                  INVENTARIO BOVINO
                </h1>
              </div>
            </div>

            {/* Slogan */}
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-100">
                Control Total de tu Hato en Campo
              </p>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Diseñado para ganaderos: pesos, reproducción, costos y rentabilidad en tiempo real.
              </p>
            </div>

            {/* 3 Beneficios Clave con Iconos */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="p-1.5 rounded-lg bg-emerald-400/20 text-emerald-300 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Modo 100% Sin Internet</h4>
                  <p className="text-[11px] text-emerald-200/70">Registra en corral y sincroniza al volver a tener señal.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="p-1.5 rounded-lg bg-emerald-400/20 text-emerald-300 shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ganancia Diaria de Peso (GDP)</h4>
                  <p className="text-[11px] text-emerald-200/70">Cálculo automático de rendimiento y kilos ganados.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="p-1.5 rounded-lg bg-emerald-400/20 text-emerald-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Trazabilidad & Censo ICA</h4>
                  <p className="text-[11px] text-emerald-200/70">Control sanitario oficial y conteo por lotes o marcas.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Pie del Hero */}
          <div className="pt-6 relative z-10 hidden sm:flex items-center justify-between text-[11px] text-emerald-200/60 border-t border-emerald-800/60 mt-6">
            <span>🔒 Conexión Cifrada SSL</span>
            <span>☁️ Sincronización Multi-dispositivo</span>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: FORMULARIO DE ACCESO / REGISTRO (7 Columnas en lg) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 sm:py-9 flex flex-col justify-between bg-white dark:bg-slate-900">
          
          <div className="space-y-5">

            {/* Cabecera de Formulario & Selector de Pestañas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Bienvenido a tu Finca' : mode === 'register' ? 'Crear Nueva Cuenta' : 'Recuperar Acceso'}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Nube Activa
                </span>
              </div>

              {/* Selector de Pestañas: Iniciar Sesión / Crear Cuenta */}
              {mode !== 'forgot' && (
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 min-h-[40px] cursor-pointer ${
                      mode === 'login' 
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 min-h-[40px] cursor-pointer ${
                      mode === 'register' 
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Crear Cuenta
                  </button>
                </div>
              )}
            </div>

            {/* Mensaje de Éxito */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/40 flex flex-col gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
                {mode === 'register' && (error.toLowerCase().includes('iniciar sesión') || error.toLowerCase().includes('registrado')) && (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="mt-1 self-start px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <span>👉 Iniciar sesión con este correo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VISTA 1: RECUPERACIÓN DE CLAVE */}
            {/* ========================================================================= */}
            {mode === 'forgot' ? (
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 mb-1 border border-sky-300 dark:border-sky-800">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Recuperación de Contraseña
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ingresa el correo registrado. Generaremos una clave temporal segura para que puedas ingresar de inmediato.
                  </p>
                </div>

                {recoveredData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-300 dark:border-sky-700/70 text-center space-y-2.5">
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
                        🔑 Clave Temporal Generada
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-black font-mono tracking-wider text-sky-950 dark:text-sky-100 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-sky-300 dark:border-sky-600 shadow-sm select-all">
                          {recoveredData.tempPassword}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTempKey(recoveredData.tempPassword)}
                          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer min-h-[42px]"
                          title="Copiar Clave"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedKey ? '¡Copiada!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-sky-800 dark:text-sky-300/90">
                        {recoveredData.emailSent 
                          ? `📨 Correo de confirmación enviado a ${recoveredData.email}.` 
                          : `Usa esta clave para acceder inmediatamente.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, email: recoveredData.email, password: recoveredData.tempPassword }));
                        setMode('login');
                        setError(null);
                        setSuccessMsg('¡Clave cargada! Pulsa "Ingresar a Mi Finca" para acceder.');
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition min-h-[46px] cursor-pointer"
                    >
                      <span>Ingresar con esta Clave Ahora</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver al inicio de sesión</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico Registrado <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="email"
                          placeholder="ejemplo@miganaderia.com"
                          value={formData.email}
                          onChange={handleChange}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition min-h-[46px] cursor-pointer"
                    >
                      {loading ? (
                        <span>Generando clave...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Generar Clave Temporal</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver al inicio de sesión</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* ========================================================================= */
              /* VISTA 2: FORMULARIO LOGIN / REGISTRO */
              /* ========================================================================= */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Banner de Bloqueo por 5 Intentos Fallidos */}
                {mode === 'login' && lockoutStatus.isLocked && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-600 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-black text-amber-950 dark:text-amber-100 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>⛔ Acceso Bloqueado Temporalmente</span>
                      </h4>
                      <p className="text-[11.5px] leading-relaxed text-amber-800 dark:text-amber-300">
                        Has superado el límite de 5 intentos fallidos consecutivos de contraseña. Por seguridad, podrás volver a intentar en:
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 font-mono font-black text-amber-950 dark:text-amber-100 text-sm tracking-wider mt-0.5">
                        <span>⏱️ {lockoutStatus.formattedRemaining}</span>
                        <span className="text-[10px] uppercase font-sans font-bold text-amber-800 dark:text-amber-300">min</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {mode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nombre de Ganadero */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre / Administrador <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="name"
                          placeholder="Ej. Carlos Mendoza"
                          value={formData.name}
                          onChange={handleChange}
                          autoCapitalize="words"
                          autoCorrect="off"
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                          required
                        />
                      </div>
                    </div>

                    {/* Nombre del Predio / Finca / Hacienda */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Finca / Hacienda <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="farmName"
                          placeholder="Ej. La Esperanza"
                          value={formData.farmName}
                          onChange={handleChange}
                          autoCapitalize="words"
                          autoCorrect="off"
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                          required
                        />
                      </div>
                    </div>

                    {/* Selector de Enfoque Principal de la Finca */}
                    <div className="sm:col-span-2 space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          🎯 Enfoque de la Finca (Módulos Iniciales)
                        </label>
                        <span className="text-[10px] text-slate-400">Puedes cambiarlo adentro</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(FARM_PRESETS).map(([key, preset]) => {
                          const isSelected = selectedFarmPreset === key.toLowerCase();
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedFarmPreset(key.toLowerCase())}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-black">{preset.shortTitle}</span>
                                {isSelected && <span className="text-[10px] font-bold">✓</span>}
                              </div>
                              <span className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                {key === 'CEBA' ? 'Ceba, Báscula, Potreros' : key === 'LECHERIA' ? 'Lechería, Ordeño, Secado' : key === 'CRIA' ? 'Palpación, IATF, Cría' : 'Todos los módulos'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Correo / Usuario */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico o Usuario <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="email"
                      placeholder={mode === 'login' ? 'ejemplo@gmail.com o usuario' : 'ejemplo@miganaderia.com'}
                      value={formData.email}
                      onChange={handleChange}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-h-[46px] transition"
                      required
                    />
                  </div>
                </div>

                {/* Contraseña con botón de Ver/Ocultar Clave */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Contraseña <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-h-[46px] transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Opciones debajo de la contraseña en modo Login */}
                  {mode === 'login' && (
                    <div className="flex items-center justify-between mt-2 text-[11.5px]">
                      <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Recordar correo</span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setSuccessMsg(null);
                          setRecoveredData(null);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>¿Olvidaste tu contraseña?</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Confirmar Contraseña (solo al registrarse) */}
                {mode === 'register' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Confirmar Contraseña <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showConfirmPassword ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Casilla Obligatoria de Aceptación de Términos al Registrarse */}
                {mode === 'register' && (
                  <div className={`p-3 rounded-2xl border transition-all ${
                    acceptedTerms 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs' 
                      : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                  }`}>
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="acceptedTerms"
                        checked={acceptedTerms}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          setError(null);
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        required
                      />
                      <span className="leading-snug text-[11.5px]">
                        He leído y acepto obligatoriamente los{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPrivacyModalOpen(true);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline inline cursor-pointer"
                        >
                          Términos y Condiciones de Uso
                        </button>{' '}
                        y la{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPrivacyModalOpen(true);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline inline cursor-pointer"
                        >
                          Política de Privacidad y Tratamiento de Datos (Ley 1581)
                        </button>
                        . <span className="text-rose-500 font-bold">*</span>
                      </span>
                    </label>
                  </div>
                )}

                {/* Botón Principal de Envío */}
                <button
                  type="submit"
                  disabled={loading || (mode === 'login' && lockoutStatus.isLocked)}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 transition min-h-[48px] mt-3 cursor-pointer ${
                    mode === 'login' && lockoutStatus.isLocked
                      ? 'bg-amber-600 dark:bg-amber-700 opacity-90 cursor-not-allowed shadow-md shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-600/25'
                  }`}
                >
                  {loading ? (
                    <span>Conectando con la Nube...</span>
                  ) : mode === 'login' ? (
                    lockoutStatus.isLocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Bloqueado temporalmente ({lockoutStatus.formattedRemaining})</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar a Mi Finca</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Crear Cuenta Ganadera</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

          {/* ========================================================================= */}
          {/* PIE DE TARJETA: RESPALDO Y POLÍTICAS */}
          {/* ========================================================================= */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
              accept=".json" 
              className="hidden" 
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Restaurar Finca desde Copia de Seguridad (.json)</span>
            </button>

            <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Al usar la plataforma aceptas los{' '}
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Términos y Condiciones & Política de Privacidad y Tratamiento de Datos (Ley 1581)
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Política de Privacidad & Habeas Data */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
      />

    </div>
  );
}
