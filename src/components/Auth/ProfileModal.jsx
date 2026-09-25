import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  MapPin, 
  Mail, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  KeyRound, 
  LogOut, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  AlertTriangle,
  History,
  Tag,
  Volume2,
  VolumeX,
  Play,
  Check,
  Send,
  Users,
  Cloud,
  DownloadCloud,
  Scale,
  Sliders
} from 'lucide-react';
import { CURRENT_APP_VERSION, checkAppUpdate, applyAppUpdate, APP_CHANGELOG } from '../../services/versionService';
import { clearAllData, deleteDemoData, isDemoAnimal, db } from '../../services/db';
import { cloudPushData, cloudPullData, syncCloudAndLocal } from '../../services/cloudSync';
import { adminResendCredentials } from '../../services/auth';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  getSoundProfile, 
  setSoundProfile, 
  playConfirmationSound, 
  SOUND_PROFILES 
} from '../../services/soundService';
import { PrivacyPolicyModal } from '../Common/PrivacyPolicyModal';
import { MODULE_CATALOG, FARM_PRESETS, useActiveModules } from '../../services/moduleService';

export function ProfileModal({ isOpen, onClose, onOpenWorkers, activeCattleCount = 0, zIndex = 'z-[60]' }) {
  const { currentUser, updateProfile, changePassword, deleteAccount, logout, isWorker } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'modules' | 'security' | 'version' | 'delete'
  const [demoCount, setDemoCount] = useState(0);
  const [loadingDeleteDemo, setLoadingDeleteDemo] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [moduleToastMsg, setModuleToastMsg] = useState(null);

  const { modules, isModuleActive: checkModuleActive, toggleModule: handleToggleModule, applyFarmPreset: handleApplyFarmPreset } = useActiveModules();

  // Configuración de Sonido y Selección de Perfil
  const [soundEnabled, setSoundState] = useState(() => isSoundEnabled());
  const [activeSoundProfile, setActiveSoundProfile] = useState(() => getSoundProfile());

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundState(next);
    setSoundEnabled(next);
    if (next) {
      playConfirmationSound(activeSoundProfile, true);
    }
  };

  const handleSelectSoundProfile = (profileId) => {
    setActiveSoundProfile(profileId);
    setSoundProfile(profileId);
    playConfirmationSound(profileId, true);
  };

  const handlePreviewSoundProfile = (e, profileId) => {
    e.stopPropagation();
    playConfirmationSound(profileId, true);
  };

  // Perfil form
  const [profileData, setProfileData] = useState({
    name: '',
    farmName: '',
    email: '',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete form
  const [deleteData, setDeleteData] = useState({
    confirmText: '',
    password: '',
  });

  const [profileMsg, setProfileMsg] = useState(null);
  const [securityMsg, setSecurityMsg] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingClearInventory, setLoadingClearInventory] = useState(false);

  // Version check
  const [versionChecking, setVersionChecking] = useState(false);
  const [versionResult, setVersionResult] = useState(null);
  const [syncingFarm, setSyncingFarm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        farmName: currentUser.farmName || '',
        email: currentUser.email || '',
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setDeleteData({
        confirmText: '',
        password: '',
      });
      setProfileMsg(null);
      setSecurityMsg(null);
      setDeleteMsg(null);
      setVersionResult(null);
    }
  }, [isOpen, currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      setLoadingProfile(true);
      await updateProfile(profileData);
      setProfileMsg({ type: 'success', text: '¡Datos del perfil y nombre de finca actualizados con éxito!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (passwordData.newPassword.length < 4) {
      setSecurityMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    try {
      setLoadingSecurity(true);
      const res = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSecurityMsg({ type: 'success', text: res.message || '¡Contraseña actualizada correctamente!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setSecurityMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingSecurity(false);
    }
  };

  const [loadingAdminReset, setLoadingAdminReset] = useState(false);

  const handleAdminResend = async () => {
    if (!currentUser?.id) return;
    const confirm = window.confirm(
      `¿Deseas generar una nueva clave temporal segura y enviarla a tu correo (${currentUser.email})?\n\nEsta clave reemplazará tu contraseña actual de forma segura.`
    );
    if (!confirm) return;

    try {
      setLoadingAdminReset(true);
      setSecurityMsg(null);
      const res = await adminResendCredentials(currentUser.id);
      setSecurityMsg({
        type: 'success',
        text: `¡Clave temporal generada (${res.tempPassword})! ${res.emailSent ? `Se envió al correo ${currentUser.email}.` : ''}`
      });
      alert(`✅ ¡Nueva clave temporal generada con éxito!\n\nClave: ${res.tempPassword}\n\nGuárdala o revísala en tu correo (${currentUser.email}).`);
    } catch (e) {
      setSecurityMsg({ type: 'error', text: e.message || 'Error al generar clave temporal.' });
    } finally {
      setLoadingAdminReset(false);
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    setDeleteMsg(null);

    if (deleteData.confirmText.trim().toUpperCase() !== 'ELIMINAR') {
      setDeleteMsg({ type: 'error', text: 'Por favor escribe la palabra "ELIMINAR" exactamente para confirmar.' });
      return;
    }

    if (!deleteData.password) {
      setDeleteMsg({ type: 'error', text: 'Debes ingresar tu contraseña para autorizar la eliminación.' });
      return;
    }

    const firstConfirm = window.confirm(
      `⚠️ ¿ESTÁS TOTALMENTE SEGURO DE ELIMINAR LA CUENTA DE "${currentUser?.farmName || currentUser?.name}"?\n\nEsta acción borrará PERMANENTEMENTE tu usuario, todos los bovinos, pesajes y registros en este dispositivo y en la nube.`
    );

    if (!firstConfirm) return;

    try {
      setLoadingDelete(true);
      await deleteAccount(deleteData.password);
      onClose();
      alert('✅ Tu cuenta y todos sus registros han sido eliminados de forma completa y permanente.');
      window.location.replace(window.location.origin + window.location.pathname);
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message });
      setLoadingDelete(false);
    }
  };

  const handleCheckVersion = async () => {
    try {
      setVersionChecking(true);
      const res = await checkAppUpdate();
      setVersionResult(res);
    } catch (e) {
      setVersionResult({ hasUpdate: false });
    } finally {
      setVersionChecking(false);
    }
  };

  const handleApplyUpdate = async () => {
    await applyAppUpdate();
  };

  const handleSyncFarmData = async () => {
    const targetId = isWorker ? (currentUser?.ownerId || currentUser?.id) : (currentUser?.id);
    if (!targetId) return;
    try {
      setSyncingFarm(true);
      await syncCloudAndLocal(targetId);
      setProfileMsg({
        type: 'success',
        text: `¡Datos y animales de la finca "${currentUser?.farmName || 'GANADERIA'}" sincronizados con éxito desde la nube!`
      });
      alert(`☁️ ¡Sincronización Exitosa!\n\nSe han descargado y actualizado los datos de la finca "${currentUser?.farmName || 'Finca Asignada'}".\n\nTodos los animales, pesajes, palpaciones y vacunas están al día.`);
    } catch (e) {
      setProfileMsg({
        type: 'error',
        text: 'Error al sincronizar con la nube: ' + (e.message || e)
      });
    } finally {
      setSyncingFarm(false);
    }
  };

  const handleClearInventory = async () => {
    const farm = currentUser?.farmName || 'tu finca';
    const userId = currentUser?.id;
    
    // Paso 1: Primera confirmación de advertencia
    const step1 = window.confirm(
      `⚠️ PASO 1 DE 2 (PRIMERA CONFIRMACIÓN):\n\n¿Estás completamente seguro de que deseas ELIMINAR TODO EL INVENTARIO de "${farm}" para comenzar en CEROS?\n\n• Se borrarán permanentemente todos los bovinos registrados.\n• Se borrarán todos los historiales de pesajes continuos.\n• Se borrarán todos los registros de ventas y gastos.\n\nEsta acción NO se puede deshacer. (Te sugerimos descargar una copia en Excel antes).`
    );
    if (!step1) return;

    // Paso 2: Segunda confirmación de máxima seguridad con palabra clave
    const step2 = window.prompt(
      `🔴 PASO 2 DE 2 (SEGUNDA CONFIRMACIÓN DE MÁXIMA SEGURIDAD):\n\nEsta es la confirmación definitiva para vaciar todo el inventario de "${farm}" y dejar la cuenta en blanco.\n\nPara confirmar la eliminación total, escribe la palabra BORRAR (en mayúsculas) a continuación:`
    );

    if (step2 === null) {
      setProfileMsg({ type: 'error', text: 'Operación cancelada: Tu inventario se mantiene seguro e intacto.' });
      return;
    }

    if (step2.trim().toUpperCase() !== 'BORRAR') {
      alert(`❌ La palabra escrita ("${step2}") no coincide con "BORRAR".\n\nPor seguridad de tu finca, NO se eliminó ningún dato.`);
      setProfileMsg({ type: 'error', text: 'Confirmación no válida: No se realizaron cambios en el inventario.' });
      return;
    }

    try {
      setLoadingClearInventory(true);
      await clearAllData(userId);
      await cloudPushData(userId).catch(() => null);
      setDemoCount(0);
      setProfileMsg({ type: 'success', text: '¡Inventario de tu finca limpiado por completo! Ahora tu sistema está en ceros para ingresar ganado nuevo.' });
      alert('✅ ¡Inventario limpiado exitosamente! Ahora puedes registrar tu ganado desde ceros.');
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Error al limpiar inventario: ' + err.message });
    } finally {
      setLoadingClearInventory(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    async function checkDemo() {
      try {
        const cattle = await db.cattle.where('userId').equals(currentUser.id).toArray();
        const demoAnimals = cattle.filter(isDemoAnimal);
        setDemoCount(demoAnimals.length);
      } catch (e) {
        console.warn('Error checking demo in profile:', e);
      }
    }
    checkDemo();
  }, [isOpen, currentUser?.id]);

  const handleDeleteDemoData = async () => {
    const userId = currentUser?.id;
    if (!userId || demoCount === 0) {
      alert('ℹ️ No hay datos de demostración presentes en tu cuenta para eliminar.');
      return;
    }

    if (!window.confirm(`¿Deseas eliminar únicamente los ${demoCount} registros de demostración/ejemplo?\n\nTus animales reales registrados permanecerán intactos.`)) {
      return;
    }

    try {
      setLoadingDeleteDemo(true);
      const result = await deleteDemoData(userId);
      await cloudPushData(userId).catch(() => null);
      
      const cattle = await db.cattle.where('userId').equals(userId).toArray();
      setDemoCount(cattle.filter(isDemoAnimal).length);
      
      setProfileMsg({ type: 'success', text: result.message });
      alert('✅ ' + result.message);
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Error al eliminar datos demo: ' + err.message });
    } finally {
      setLoadingDeleteDemo(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(`¿Deseas cerrar la sesión de ${currentUser?.name || 'tu cuenta'}?`)) {
      onClose();
      logout();
    }
  };

  if (!currentUser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isWorker ? "🤠 Mi Perfil de Vaquero de Campo" : "Mi Perfil Ganadero & Configuración"}
      subtitle={isWorker ? `Vaquero: ${currentUser?.name || currentUser?.username} • Finca: ${currentUser?.farmName}` : `Usuario: ${currentUser?.email} • Finca: ${currentUser?.farmName}`}
      maxWidth="max-w-2xl"
      zIndex={zIndex}
    >
      <div className="space-y-5">
        
        {/* Selector de pestañas */}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isWorker ? 'Mi Perfil' : 'Datos Finca'}</span>
          </button>

          {!isWorker && (
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>🎛️ Módulos</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isWorker ? 'Mi Clave / PIN' : 'Contraseña'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('version')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'version'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Versión</span>
          </button>

          {!isWorker && (
            <button
              type="button"
              onClick={() => setActiveTab('delete')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                activeTab === 'delete'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Cuenta</span>
            </button>
          )}
        </div>

        {/* PESTAÑA 1: DATOS DE PROPIETARIO O TRABAJADOR */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            
            {/* Banner de acceso a gestión de trabajadores para el administrador */}
            {!isWorker && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-100 dark:to-slate-800/50 border border-amber-500/30 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    🤠
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Equipo de Trabajo en Corral (Vaqueros)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Crea cuentas, controla accesos y audita movimientos en tiempo real.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenWorkers) onOpenWorkers();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-sm transition shrink-0 cursor-pointer"
                >
                  Gestionar →
                </button>
              </div>
            )}

            {/* Ficha informativa para trabajadores */}
            {isWorker && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                      🤠
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-200">
                        {currentUser?.name || 'Vaquero de Campo'}
                      </h4>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        <span>Mayordomo / Vaquero Operativo</span>
                        <span>•</span>
                        <span>@{currentUser?.username || currentUser?.email}</span>
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Conectado</span>
                  </span>
                </div>

                {/* Métricas del hato compartido */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/60 text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">🌱 Finca Asignada</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate block">
                      {currentUser?.farmName || 'Mi Finca'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/60 text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">🐄 Ganado en Finca</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                      {activeCattleCount} {activeCattleCount === 1 ? 'animal' : 'animales'}
                    </span>
                  </div>
                </div>

                {/* Detalles de conexión con el patrón */}
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-200 dark:border-amber-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Conectado con la cuenta del Administrador:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5">
                    <strong>Patrón / Propietario:</strong> {currentUser?.ownerEmail || 'Administrador del Predio'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5">
                    Tienes acceso para registrar pesajes en báscula, partos, palpaciones y vacunas. Los balances de compra, venta y utilidades son confidenciales del dueño.
                  </p>
                </div>

                {/* Botones de Acción Inmediata para el Vaquero / Mayordomo */}
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSyncFarmData}
                    disabled={syncingFarm}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer min-h-[42px]"
                  >
                    <Cloud className={`w-4 h-4 ${syncingFarm ? 'animate-spin' : ''}`} />
                    <span>{syncingFarm ? 'Sincronizando Finca...' : '☁️ Sincronizar Ganado de la Finca'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyUpdate}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer min-h-[42px]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>⚡ Actualizar Sistema y Limpiar Caché</span>
                  </button>
                </div>
              </div>
            )}

            {profileMsg && (
              <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Campos de edición (Solo Administrador) */}
            {!isWorker && (
              <>
                {/* Nombre de Propietario */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de Propietario / Administrador <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ej. Carlos Mendoza"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 min-h-[44px]"
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
                      placeholder="Ej. Hacienda La Esperanza"
                      value={profileData.farmName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, farmName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-500 min-h-[44px]"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Este nombre aparecerá en la barra superior, reportes y descargas de Excel.
                  </span>
                </div>

                {/* Correo / Usuario */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico o Nombre de Usuario <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ejemplo@miganaderia.com"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[44px]"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* CONFIGURACIÓN EXCLUSIVA DE SONIDO DEL SISTEMA */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    soundEnabled 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 shadow-sm' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Efectos de Sonido del Sistema</span>
                      {soundEnabled && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                          Activo
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {soundEnabled 
                        ? 'Sonido de confirmación al registrar, editar animales, guardar pesajes y ventas.' 
                        : 'Los efectos sonoros del sistema se encuentran silenciados.'}
                    </p>
                  </div>
                </div>

                {/* Botón On/Off */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                      soundEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                    }`}
                    title={soundEnabled ? "Silenciar efectos de sonido" : "Activar efectos de sonido"}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>{soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}</span>
                  </button>
                </div>
              </div>

              {/* Selector de Tonos / Perfiles de Sonido si soundEnabled está activo */}
              {soundEnabled && (
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Elige el tono de confirmación que prefieras:</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Toca cualquier tono para activarlo y probarlo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SOUND_PROFILES.map((profile) => {
                      const isSelected = activeSoundProfile === profile.id;
                      return (
                        <div
                          key={profile.id}
                          onClick={() => handleSelectSoundProfile(profile.id)}
                          className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-left ${
                            isSelected
                              ? 'bg-emerald-50/95 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                            <span className="text-2xl shrink-0 select-none">{profile.emoji}</span>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              {/* Título y Etiqueta del Tono */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-black tracking-tight ${
                                  isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-slate-100'
                                }`}>
                                  {profile.name}
                                </span>
                                {profile.tag && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                                    isSelected 
                                      ? 'bg-emerald-200/90 dark:bg-emerald-800/90 text-emerald-900 dark:text-emerald-100'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                                  }`}>
                                    {profile.tag}
                                  </span>
                                )}
                              </div>

                              {/* Cinta Deslizante / Marquee en Movimiento Continuo */}
                              <div 
                                className="overflow-hidden whitespace-nowrap w-full relative mt-1"
                                style={{
                                  maskImage: 'linear-gradient(to right, transparent, black 4px, black calc(100% - 8px), transparent)',
                                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 4px, black calc(100% - 8px), transparent)'
                                }}
                              >
                                <div className="inline-flex items-center gap-6 animate-marquee-ticker">
                                  <span className={`text-[10.5px] font-semibold ${
                                    isSelected ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {profile.description}
                                  </span>
                                  <span className="text-[10px] text-emerald-500/70 select-none">•</span>
                                  <span className={`text-[10.5px] font-semibold ${
                                    isSelected ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                                  }`} aria-hidden="true">
                                    {profile.description}
                                  </span>
                                  <span className="text-[10px] text-emerald-500/70 select-none" aria-hidden="true">•</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Botón Probar y Estado de Selección */}
                          <div className="flex items-center gap-1.5 shrink-0 pl-1">
                            <button
                              type="button"
                              onClick={(e) => handlePreviewSoundProfile(e, profile.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm ${
                                isSelected
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                              title={`Escuchar ${profile.name}`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span className="text-[11px]">Probar</span>
                            </button>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm' 
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[42px] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loadingProfile}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition min-h-[42px] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loadingProfile ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            {/* Zona de Gestión de Inventario: Limpiar a Ceros (Solo Administrador) */}
            {!isWorker && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      Limpiar Inventario de Mi Finca (Comenzar en Ceros)
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                      Borra los datos de prueba o inventario actual para empezar desde ceros. Requiere doble confirmación con palabra clave.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearInventory}
                    disabled={loadingClearInventory}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{loadingClearInventory ? 'Limpiando...' : 'Limpiar a Ceros'}</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

        {/* PESTAÑA: PERSONALIZACIÓN MODULAR DE LA FINCA */}
        {activeTab === 'modules' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {moduleToastMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{moduleToastMsg}</span>
              </div>
            )}

            {/* Presets Rápidos */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Configuración Rápida por Enfoque de Finca:</span>
                </h4>
                <span className="text-[10px] text-slate-400">1 toque para configurar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {Object.entries(FARM_PRESETS).map(([key, preset]) => {
                  const isCurrent = Object.entries(preset.modules).every(
                    ([modKey, expected]) => Boolean(modules[modKey]) === expected
                  );

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        handleApplyFarmPreset(key);
                        setModuleToastMsg(`Configuración aplicada: ${preset.shortTitle}`);
                        setTimeout(() => setModuleToastMsg(null), 3000);
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer min-h-[85px] ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/50'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="text-xs font-black leading-snug">{preset.shortTitle}</span>
                        {isCurrent && <span className="text-[10px] font-black bg-white/20 px-1 rounded">✓ Activo</span>}
                      </div>
                      <span className={`text-[10px] mt-1 line-clamp-2 ${isCurrent ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {preset.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Módulos Fijos Base */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Módulos Fijos:</strong> Inventario, Potreros, Finanzas, Sanidad y Auditoría permanecen siempre activos como base del sistema.
              </span>
            </div>

            {/* Módulos Conmutables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODULE_CATALOG.map((mod) => {
                const active = checkModuleActive(mod.key);

                return (
                  <div
                    key={mod.key}
                    className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      active
                        ? 'bg-white dark:bg-slate-900 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${
                        active ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {mod.emoji}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">{mod.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 rounded ${
                            active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleToggleModule(mod.key);
                        setModuleToastMsg(`Módulo "${mod.shortName}" ${active ? 'desactivado' : 'activado'}`);
                        setTimeout(() => setModuleToastMsg(null), 2500);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-center ${
                        active ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={active}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: CAMBIO DE CONTRASEÑA */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            
            {securityMsg && (
              <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                securityMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}>
                {securityMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{securityMsg.text}</span>
              </div>
            )}

            {/* Contraseña Actual */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña Actual <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Tu contraseña actual"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nueva Contraseña <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[42px] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loadingSecurity}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition min-h-[42px] cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loadingSecurity ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
              </button>
            </div>

            {/* Zona Administrativa: Blanqueo / Reenvío de Clave por Correo (Solo Administrador) */}
            {!isWorker && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                      Blanqueo & Clave Temporal por Correo
                    </h4>
                    <p className="text-[11px] text-sky-800 dark:text-sky-300/80 mt-0.5 leading-relaxed">
                      Genera una clave temporal nueva y la despacha automáticamente a tu correo registrado (<strong>{currentUser?.email}</strong>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminResend}
                    disabled={loadingAdminReset}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 min-h-[38px]"
                  >
                    <Send className={`w-3.5 h-3.5 ${loadingAdminReset ? 'animate-spin' : ''}`} />
                    <span>{loadingAdminReset ? 'Enviando...' : 'Generar y Enviar al Correo'}</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

        {/* PESTAÑA 3: ACTUALIZACIONES & VERSIÓN */}
        {activeTab === 'version' && (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-emerald-500/30 p-0.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Versión Instalada:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xl font-black text-slate-900 dark:text-white">v{CURRENT_APP_VERSION}</p>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-500/30">
                        🟢 En línea
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckVersion}
                  disabled={versionChecking}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[38px] self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${versionChecking ? 'animate-spin' : ''}`} />
                  <span>{versionChecking ? 'Comprobando...' : 'Buscar Actualizaciones'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Cada vez que se publica una mejora o nueva función en la nube, la app te notificará automáticamente para actualizar con un solo clic.
              </p>

              {/* Botones de Acción Inmediata de Versión & Caché */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  className="w-full py-3 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer min-h-[44px]"
                  title="Fuerza la descarga de la última versión y limpia toda la memoria caché del navegador"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>⚡ Actualizar Sistema y Limpiar Caché</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncFarmData}
                  disabled={syncingFarm}
                  className="w-full py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer min-h-[44px]"
                  title="Descargar todos los animales y registros de la finca desde Firebase"
                >
                  <Cloud className={`w-4 h-4 text-emerald-400 shrink-0 ${syncingFarm ? 'animate-spin' : ''}`} />
                  <span>{syncingFarm ? 'Descargando Datos...' : '☁️ Sincronizar Datos de Finca'}</span>
                </button>
              </div>

              {versionResult && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  {versionResult.hasUpdate ? (
                    <div className="space-y-2.5">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" /> ¡Nueva versión disponible ({versionResult.latestVersion})!
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{versionResult.description}</p>
                      <button
                        onClick={handleApplyUpdate}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow cursor-pointer min-h-[42px] transition active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Actualizar Aplicación Ahora</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tu aplicación está en la versión más reciente (v{CURRENT_APP_VERSION}).
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* HISTORIAL DE LAS ÚLTIMAS 5 ACTUALIZACIONES */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Últimas 5 Actualizaciones Generadas</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">Registro Oficial</span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {APP_CHANGELOG.slice(0, 5).map((item) => (
                  <div
                    key={item.version}
                    className={`p-3.5 rounded-2xl border transition ${
                      item.version === CURRENT_APP_VERSION
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                          item.version === CURRENT_APP_VERSION
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          v{item.version}
                        </span>
                        {item.version === CURRENT_APP_VERSION && (
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-600">
                            ✨ Actual
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {item.date}
                      </span>
                    </div>

                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-1">
                      {item.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-500 dark:text-emerald-400 font-bold mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: ZONA DE PELIGRO - ELIMINACIÓN COMPLETA DE CUENTA */}
        {activeTab === 'delete' && (
          <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
            
            {/* Alerta de Peligro */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>Zona de Peligro: Eliminación Definitiva de Cuenta</span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán de forma definitiva:
              </p>
              <ul className="text-xs text-rose-800 dark:text-rose-300 list-disc list-inside space-y-1 pl-1">
                <li>Tu usuario (<strong>{currentUser.email}</strong>) y perfil de ganadería.</li>
                <li>Todo el inventario de bovinos ({currentUser.farmName}).</li>
                <li>Historial de pesajes continuos, ventas y estadísticas.</li>
                <li>Los datos sincronizados en la Nube Global e Internet.</li>
              </ul>
            </div>

            {/* Opción: Eliminar únicamente datos de demostración */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Eliminar Únicamente Datos de Demostración</span>
                  {demoCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      {demoCount} demo presentes
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      Sin demo
                    </span>
                  )}
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {demoCount > 0
                    ? `Elimina exclusivamente los ${demoCount} animales de demostración y sus pesajes, protegiendo tus datos reales.`
                    : 'Esta opción solo se encuentra disponible cuando hay datos de prueba cargados en la cuenta.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteDemoData}
                disabled={loadingDeleteDemo || demoCount === 0}
                title={demoCount === 0 ? "No hay datos de demostración para eliminar" : "Eliminar únicamente los datos de demostración"}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex-shrink-0 flex items-center gap-1.5 ${
                  demoCount > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{loadingDeleteDemo ? 'Eliminando Demo...' : demoCount > 0 ? `Eliminar Demo (${demoCount})` : 'Sin Datos Demo'}</span>
              </button>
            </div>

            {/* Opción Alternativa: Solo vaciar inventario sin borrar cuenta */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  ¿Solo deseas reiniciar tu ganado y empezar en ceros?
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Puedes vaciar únicamente el inventario conservando tu usuario y contraseña.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearInventory}
                disabled={loadingClearInventory}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold whitespace-nowrap transition cursor-pointer flex-shrink-0"
              >
                Limpiar Solo Inventario
              </button>
            </div>

            {deleteMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{deleteMsg.text}</span>
              </div>
            )}

            {/* Confirmación con palabra "ELIMINAR" */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Para confirmar, escribe la palabra <span className="text-rose-600 dark:text-rose-400 font-black tracking-widest">ELIMINAR</span> en mayúsculas: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Escribe ELIMINAR"
                value={deleteData.confirmText}
                onChange={(e) => setDeleteData(prev => ({ ...prev, confirmText: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 font-extrabold text-xs sm:text-sm focus:outline-none focus:border-rose-600 min-h-[44px]"
                required
              />
            </div>

            {/* Contraseña para autorizar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ingresa tu contraseña actual para autorizar la eliminación: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Tu contraseña actual"
                  value={deleteData.password}
                  onChange={(e) => setDeleteData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500 min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Botón definitivo */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[42px] cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loadingDelete || deleteData.confirmText.trim().toUpperCase() !== 'ELIMINAR' || !deleteData.password}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition min-h-[42px] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loadingDelete ? 'Eliminando Cuenta...' : 'Eliminar Mi Cuenta Permanentemente'}</span>
              </button>
            </div>

          </form>
        )}

        {/* BOTÓN DESTACADO: CERRAR SESIÓN Y POLÍTICA DE PRIVACIDAD */}
        {activeTab !== 'delete' && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPrivacyPolicyOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Términos, Condiciones & Política de Privacidad (Ley 1581)</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition shadow-sm min-h-[46px] cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Cerrar Sesión de Mi Cuenta ({currentUser.name})</span>
            </button>
          </div>
        )}

      </div>

      {/* Modal de Política de Privacidad */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
        zIndex="z-[80]"
      />
    </Modal>
  );
}
