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
import { cloudFindUser, cloudPullData, cloudIsWorkerDeleted } from '../services/cloudSync';
import { triggerFeedback } from '../services/soundService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    return getCurrentUser();
  });
  const [loading, setLoading] = useState(false);

  // Valida si la cuenta del usuario o trabajador aún existe y está activa en Firebase Cloud o en la base local
  const validateSessionWithCloud = async () => {
    const session = getCurrentUser();
    if (!session || (!session.id && !session.email && !session.username)) {
      return null;
    }

    // 1. Si el dispositivo está sin internet (offline), retornar de inmediato la sesión local sin demoras
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return session;
    }

    const cleanEmail = (session.email || session.username || session.name || '').trim().toLowerCase();
    const cleanId = String(session.id || '').trim();
    const sessionEmail = (session.email || '').trim().toLowerCase();
    const sessionUser = (session.username || '').trim().toLowerCase();

    // 2. Comprobar si el trabajador fue marcado como eliminado localmente
    try {
      if (db.users) {
        const localUser = cleanId ? await db.users.get(cleanId) : null;
        if (session.role === 'worker') {
          if (localUser && (localUser.isDeleted || localUser.isActive === false)) {
            console.warn('⚠️ La cuenta de trabajador está deshabilitada o eliminada localmente.');
            logoutUser();
            localStorage.removeItem('ganado_current_user_session');
            setCurrentUser(null);
            if (localUser.isActive === false) {
              alert('⚠️ Tu cuenta de trabajador ha sido deshabilitada por el administrador del predio.');
            }
            return null;
          }
        }
      }
    } catch (dbErr) {
      console.warn('Error verificando usuario local:', dbErr);
    }

    // 3. Validar con la Nube Firebase con timeout estricto de 2 segundos para no bloquear la app
    const cloudCheckPromise = (async () => {
      try {
        if (session.role === 'worker') {
          const isRemoteDel = await cloudIsWorkerDeleted(sessionEmail || sessionUser || cleanEmail);
          if (isRemoteDel) {
            logoutUser();
            localStorage.removeItem('ganado_current_user_session');
            if (db.users && session.id) await db.users.delete(session.id).catch(() => null);
            setCurrentUser(null);
            return null;
          }
        }

        let remoteUser = await cloudFindUser(cleanEmail);
        if (!remoteUser && !cleanEmail.includes('@')) {
          remoteUser = await cloudFindUser(`${cleanEmail}@finca.local`);
        }

        if (remoteUser && remoteUser.isDeleted) {
          logoutUser();
          localStorage.removeItem('ganado_current_user_session');
          if (db.users && session.id) await db.users.delete(session.id).catch(() => null);
          setCurrentUser(null);
          return null;
        }

        if (remoteUser) {
          if ((remoteUser.role === 'worker' || session.role === 'worker') && remoteUser.isActive === false && navigator.onLine) {
            logoutUser();
            localStorage.removeItem('ganado_current_user_session');
            setCurrentUser(null);
            alert('⚠️ Tu cuenta de trabajador ha sido deshabilitada por el administrador del predio.');
            return null;
          }

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
          await db.users.put(merged).catch(() => null);

          const targetDataId = merged.role === 'worker' ? (merged.ownerId || merged.id) : merged.id;
          if (targetDataId && navigator.onLine) {
            cloudPullData(targetDataId).catch(() => null);
          }

          return merged;
        }
      } catch (err) {
        console.warn('Nota: validación remota en segundo plano omitida:', err);
      }
      return session;
    })();

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(session), 2000));
    return await Promise.race([cloudCheckPromise, timeoutPromise]);
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const user = await validateSessionWithCloud();
        if (mounted && user !== undefined) {
          setCurrentUser(user);
        }
      } catch (e) {
        console.warn('Error en validación de fondo:', e);
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
    return await getFarmWorkers(currentUser.id, currentUser.email);
  };

  const handleToggleWorker = async (workerId, workerEmail, isActive) => {
    if (!currentUser) return false;
    return await toggleWorkerStatus(workerId, workerEmail, currentUser.id, isActive, currentUser.name);
  };

  const handleUpdateWorkerPassword = async (workerId, workerEmail, newPassword) => {
    if (!currentUser) return false;
    return await updateWorkerPassword(workerId, workerEmail, currentUser.id, newPassword, currentUser.name);
  };

  const handleDeleteWorker = async (workerId, workerEmail, workerName = null) => {
    if (!currentUser) return false;
    return await deleteWorkerAccount(workerId, workerEmail, currentUser.id, currentUser.name, workerName, currentUser.email);
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
