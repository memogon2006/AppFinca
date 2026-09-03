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
  AlertTriangle
} from 'lucide-react';
import { CURRENT_APP_VERSION, checkAppUpdate, applyAppUpdate } from '../../services/versionService';

export function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile, changePassword, deleteAccount, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'version' | 'delete'

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

  // Version check
  const [versionChecking, setVersionChecking] = useState(false);
  const [versionResult, setVersionResult] = useState(null);

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
      alert('Tu cuenta y todos sus registros asociados han sido eliminados permanentemente.');
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
      title="Mi Perfil Ganadero & Configuración"
      subtitle={`Usuario: ${currentUser.email} • Finca: ${currentUser.farmName}`}
      maxWidth="max-w-2xl"
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
            <span>Datos Finca</span>
          </button>

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
            <span>Contraseña</span>
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
        </div>

        {/* PESTAÑA 1: DATOS DE PROPIETARIO Y FINCA */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            
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

            {/* Nombre de Propietario */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de Propietario / Administrador <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Nombre de la Finca */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Finca / Ganadería <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
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
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
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
                disabled={loadingProfile}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition min-h-[42px] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loadingProfile ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

          </form>
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

          </form>
        )}

        {/* PESTAÑA 3: ACTUALIZACIONES & VERSIÓN */}
        {activeTab === 'version' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Versión Instalada:</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">v{CURRENT_APP_VERSION}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-500/30">
                  En línea
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Cada vez que se publica una mejora o nueva función en la nube, la app te notificará automáticamente para actualizar con un solo clic.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCheckVersion}
                  disabled={versionChecking}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${versionChecking ? 'animate-spin' : ''}`} />
                  <span>{versionChecking ? 'Comprobando en la nube...' : 'Buscar Actualizaciones Ahora'}</span>
                </button>
              </div>

              {versionResult && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  {versionResult.hasUpdate ? (
                    <div className="space-y-2">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> ¡Nueva versión disponible ({versionResult.latestVersion})!
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">{versionResult.description}</p>
                      <button
                        onClick={handleApplyUpdate}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Actualizar Aplicación Ahora
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

        {/* BOTÓN DESTACADO: CERRAR SESIÓN (CUANDO NO ESTÁ EN ELIMINAR) */}
        {activeTab !== 'delete' && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
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
    </Modal>
  );
}
