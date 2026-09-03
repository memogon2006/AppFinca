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
  FileCheck
} from 'lucide-react';

export function AuthView() {
  const { login, register, setSessionUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
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
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 mb-1">
            <span className="text-3xl">🐂</span>
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
          
          {/* Selector de Pestañas: Iniciar Sesión / Crear Cuenta */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${mode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition min-h-[44px] cursor-pointer ${mode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* 💡 CONSEJO DE ACCESO MULTI-DISPOSITIVO & COPIA DE SEGURIDAD (Visible en Login y Registro) */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200 mb-4 shadow-sm">
            <span className="text-lg flex-shrink-0">💡</span>
            <div className="space-y-1.5 w-full">
              <p className="font-extrabold text-amber-900 dark:text-amber-300">
                ¿Estás en un nuevo dispositivo o no te deja ingresar?
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                Si el sistema no reconoce tu cuenta en este teléfono o navegador:
              </p>
              <div className="text-[11px] space-y-1 text-amber-900 dark:text-amber-200 font-medium">
                <p>
                  1. Pulsa la pestaña <strong className="underline font-bold">"Crear Cuenta"</strong> arriba y crea la cuenta con los <strong>mismos datos exactos</strong> (mismo correo, finca y contraseña).
                </p>
                <p>
                  2. O si tienes tu <strong>archivo de copia de seguridad (.json)</strong>, cárgalo directamente abajo para restaurar todo tu ganado y datos de inmediato.
                </p>
              </div>
              
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>📥 Cargar Archivo de Copia de Seguridad (.json)</span>
                </button>
              </div>
            </div>
          </div>

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

          {/* Formulario */}
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
                      placeholder="Ej. Luis González"
                      value={formData.name}
                      onChange={handleChange}
                      autoCapitalize="words"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[46px]"
                      required
                    />
                  </div>
                </div>

                {/* Nombre de la Finca */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de tu Finca / Hacienda <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="farmName"
                      placeholder="Ej. Criadero Santa Teresa"
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
                  placeholder="usuario@ganaderia.com"
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

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Sincronización segura en la nube para acceso universal en cualquier dispositivo.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
