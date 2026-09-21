import React, { useState, useRef } from 'react';
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
  HelpCircle,
  Smartphone,
  KeyRound,
  FileCheck,
  Copy,
  Check,
  ArrowLeft,
  Send
} from 'lucide-react';

import { PrivacyPolicyModal } from '../Common/PrivacyPolicyModal';

export function AuthView() {
  const { login, register, setSessionUser, requestResetPassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Toggle para ver / ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    farmName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

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

      try {
        setLoading(true);
        await register({ name, farmName, email, password });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        return setError('Por favor ingresa tu correo/usuario y contraseña.');
      }
      try {
        setLoading(true);
        await login({ email, password });
      } catch (err) {
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 transition-colors duration-200">
      
      {/* Botón Flotante de Tema */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-md hover:scale-105 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="Cambiar Modo Claro/Oscuro"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      <div className="max-w-md w-full space-y-4">
        
        {/* Logo & Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 mb-1 overflow-hidden p-0.5">
            <img src="/icon-512.png" alt="Logo Inventario Bovino" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            INVENTARIO BOVINO APP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Plataforma Integral de Gestión Ganadera
          </p>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
          
          {/* Selector de Pestañas: Iniciar Sesión / Crear Cuenta / Recuperar */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); setRecoveredData(null); }}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${mode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); setRecoveredData(null); }}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${mode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Crear Cuenta
            </button>
            {mode === 'forgot' && (
              <button
                type="button"
                className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
              >
                Recuperar Clave
              </button>
            )}
          </div>

          {/* ☁️ CONEXIÓN EN LA NUBE ACTIVA & COPIA DE SEGURIDAD */}
          {mode !== 'forgot' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/60 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200 mb-4 shadow-sm">
              <span className="text-lg flex-shrink-0">☁️</span>
              <div className="space-y-1.5 w-full">
                <p className="font-extrabold text-emerald-900 dark:text-emerald-300">
                  Sincronización en la Nube Activa (Multi-dispositivo)
                </p>
                <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300/90">
                  Tu información de ganado, pesajes y finanzas se sincroniza en la nube. Inicia sesión con tu correo y contraseña desde cualquier dispositivo para ver toda tu finca.
                </p>
                
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>📥 Restaurar desde Copia de Seguridad (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mensajes de Éxito o Error */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* VISTA 1: RECUPERACIÓN / BLANQUEO DE CLAVE */}
          {mode === 'forgot' ? (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 mb-1 border border-sky-300 dark:border-sky-800">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Recuperación & Blanqueo de Clave
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ingresa tu correo electrónico registrado. El sistema generará una clave temporal segura, actualizará la base de datos y te la enviará por correo.
                </p>
              </div>

              {recoveredData ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-300 dark:border-sky-700/70 text-center space-y-2.5">
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
                        ? `📨 Se despachó un correo de confirmación a ${recoveredData.email}.` 
                        : `Usa esta clave temporal para ingresar ahora mismo.`}
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
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition min-h-[48px] cursor-pointer"
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 min-h-[46px]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition min-h-[48px] cursor-pointer"
                  >
                    {loading ? (
                      <span>Generando y enviando clave...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Generar & Enviar Clave Temporal</span>
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
            /* VISTA 2: FORMULARIO LOGIN / REGISTRO */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <>
                  {/* Nombre de Ganadero */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Ganadero / Administrador <span className="text-rose-500">*</span>
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Nombre del Predio / Finca / Hacienda */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Predio / Finca / Hacienda <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="farmName"
                        placeholder="Ej. Hacienda La Esperanza"
                        value={formData.farmName}
                        onChange={handleChange}
                        autoCapitalize="words"
                        autoCorrect="off"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                        required
                      />
                    </div>
                  </div>
                </>
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
                    <span>{showPassword ? 'Ocultar clave' : 'Ver clave'}</span>
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
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

                {/* Enlace de recuperación de contraseña solo en login */}
                {mode === 'login' && (
                  <div className="flex items-center justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                        setRecoveredData(null);
                      }}
                      className="text-[11.5px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>¿Olvidaste tu contraseña? Recuperar clave</span>
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

              {/* Botón Principal de Envío */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition min-h-[48px] mt-2 cursor-pointer"
              >
                {loading ? (
                  <span>Conectando con la Nube...</span>
                ) : mode === 'login' ? (
                  <>
                    <span>Ingresar a Mi Finca</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Crear / Vincular Mi Finca</span>
                  </>
                )}
              </button>

            </form>
          )}


          {/* Opciones Adicionales: Cargar Respaldo / Restaurar */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
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
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-blue-500" />
              <span>Restaurar Finca desde Archivo de Respaldo (.json)</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
              Al usar la plataforma aceptas la{' '}
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Política de Privacidad y Tratamiento de Datos (Ley 1581)
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Política de Privacidad & Habeas Data */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

    </div>
  );
}
