import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getCurrentUser, 
  loginUser, 
  registerUser, 
  logoutUser, 
  updateUserProfile, 
  changeUserPassword,
  deleteUserAccount,
  requestPasswordReset,
  forceSetNewPassword,
  purgeLocalUserData,
  createWorkerAccount,
  getFarmWorkers,
  toggleWorkerStatus,
  updateWorkerPassword,
  deleteWorkerAccount
} from '../services/auth';
import { db } from '../services/db';
import { cloudFindUser, cloudPullData } from '../services/cloudSync';
import { triggerFeedback } from '../services/soundService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Valida si la cuenta del usuario o trabajador aún existe y está activa en Firebase Cloud
  const validateSessionWithCloud = async () => {
    const session = getCurrentUser();
    if (session && (session.email || session.username)) {
      try {
        const cleanEmail = (session.email || session.username || '').trim().toLowerCase();
        let remoteUser = await cloudFindUser(cleanEmail);
        if (!remoteUser && !cleanEmail.includes('@')) {
          remoteUser = await cloudFindUser(`${cleanEmail}@finca.local`);
        }
        
        // 1. Si no se encuentra en la nube (porque fue eliminada en Firebase Console o por el administrador)
        if (remoteUser === null && navigator.onLine) {
          console.warn('⚠️ La cuenta fue eliminada en la nube. Purgando sesión...');
          await purgeLocalUserData(session.id, session.email);
          logoutUser();
          setCurrentUser(null);
          return null;
        }

        // 2. Si es cuenta de trabajador y fue deshabilitada por el administrador
        if (remoteUser && (remoteUser.role === 'worker' || session.role === 'worker') && remoteUser.isActive === false && navigator.onLine) {
          console.warn('⚠️ La cuenta de trabajador fue deshabilitada por el patrón.');
          logoutUser();
          setCurrentUser(null);
          alert('⚠️ Tu cuenta de trabajador ha sido deshabilitada por el administrador del predio.');
          return null;
        }

        // 3. Sincronizar y actualizar todos los datos de sesión con la versión más fresca de la nube
        if (remoteUser) {
          let farmName = remoteUser.farmName || session.farmName;
          const ownerEmail = remoteUser.ownerEmail || session.ownerEmail;
          if ((remoteUser.role === 'worker' || session.role === 'worker') && ownerEmail) {
            try {
              const ownerRecord = await cloudFindUser(ownerEmail);
              if (ownerRecord && ownerRecord.farmName) {
                farmName = ownerRecord.farmName;
              }
            } catch (e) {}
          }

          const merged = {
            ...session,
            ...remoteUser,
            id: remoteUser.id || session.id,
            name: remoteUser.name || session.name,
            farmName,
            role: remoteUser.role || session.role || 'admin',
            ownerId: remoteUser.ownerId || session.ownerId || null,
            ownerEmail: ownerEmail || null,
            isActive: remoteUser.isActive !== false,
          };
          localStorage.setItem('ganado_current_user_session', JSON.stringify(merged));
          await db.users.put(merged);

          // Si es trabajador, forzar descarga inmediata de los animales y registros de la finca del patrón
          const targetDataId = merged.role === 'worker' ? (merged.ownerId || merged.id) : merged.id;
          if (targetDataId) {
            await cloudPullData(targetDataId);
          }

          return merged;
        }
      } catch (err) {
        console.warn('Error validando sesión con la nube:', err);
      }
    }
    return session;
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const user = await validateSessionWithCloud();
      if (mounted) {
        setCurrentUser(user);
        setLoading(false);
      }
    }

    initAuth();

    const handleCheck = () => {
      validateSessionWithCloud().then(u => {
        if (mounted && u !== undefined) setCurrentUser(u);
      });
    };

    window.addEventListener('focus', handleCheck);
    window.addEventListener('online', handleCheck);

    return () => {
      mounted = false;
      window.removeEventListener('focus', handleCheck);
      window.removeEventListener('online', handleCheck);
    };
  }, []);

  const handleLogin = async (credentials) => {
    const user = await loginUser(credentials);
    setCurrentUser(user);
    triggerFeedback('login');
    return user;
  };

  const handleRegister = async (userData) => {
    const user = await registerUser(userData);
    setCurrentUser(user);
    triggerFeedback('login');
    return user;
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleUpdateProfile = async (updates) => {
    if (!currentUser) return;
    const updated = await updateUserProfile(currentUser.id, updates);
    if (updated) setCurrentUser(updated);
    return updated;
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return;
    const res = await changeUserPassword(currentUser.id, currentPassword, newPassword);
    setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
    return res;
  };

  const handleForceSetNewPassword = async (newPassword) => {
    if (!currentUser) return;
    const updatedSession = await forceSetNewPassword(currentUser.id, newPassword);
    if (updatedSession) {
      setCurrentUser(updatedSession);
      triggerFeedback('success');
    }
    return updatedSession;
  };

  const handleDeleteAccount = async (password) => {
    if (!currentUser) return;
    await deleteUserAccount(currentUser.id, password);
    setCurrentUser(null);
  };

  const handleSetSessionUser = (user) => {
    localStorage.setItem('ganado_current_user_session', JSON.stringify(user));
    setCurrentUser(user);
    triggerFeedback('login');
  };

  // Métodos de gestión de trabajadores para el Administrador
  const handleCreateWorker = async ({ name, username, password }) => {
    if (!currentUser) throw new Error('No hay sesión activa.');
    return await createWorkerAccount({ name, username, password, ownerUser: currentUser });
  };

  const handleGetWorkers = async () => {
    if (!currentUser) return [];
    return await getFarmWorkers(currentUser.id);
  };

  const handleToggleWorker = async (workerId, workerEmail, isActive) => {
    if (!currentUser) return false;
    return await toggleWorkerStatus(workerId, workerEmail, currentUser.id, isActive, currentUser.name);
  };

  const handleUpdateWorkerPassword = async (workerId, workerEmail, newPassword) => {
    if (!currentUser) return false;
    return await updateWorkerPassword(workerId, workerEmail, currentUser.id, newPassword, currentUser.name);
  };

  const handleDeleteWorker = async (workerId, workerEmail) => {
    if (!currentUser) return false;
    return await deleteWorkerAccount(workerId, workerEmail, currentUser.id, currentUser.name);
  };

  const isWorker = currentUser?.role === 'worker';
  const isAdmin = !isWorker;
  const effectiveUserId = isWorker ? (currentUser.ownerId || currentUser.id) : (currentUser?.id || 'default');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        setSessionUser: handleSetSessionUser,
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
        forceSetNewPassword: handleForceSetNewPassword,
        deleteAccount: handleDeleteAccount,
        requestResetPassword: requestPasswordReset,
        createWorker: handleCreateWorker,
        getWorkers: handleGetWorkers,
        toggleWorker: handleToggleWorker,
        updateWorkerPassword: handleUpdateWorkerPassword,
        deleteWorker: handleDeleteWorker,
        isWorker,
        isAdmin,
        effectiveUserId,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
