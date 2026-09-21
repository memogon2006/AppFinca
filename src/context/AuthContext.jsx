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
  purgeLocalUserData
} from '../services/auth';
import { cloudFindUser } from '../services/cloudSync';
import { triggerFeedback } from '../services/soundService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Valida si la cuenta del usuario aún existe en Firebase Cloud
  const validateSessionWithCloud = async () => {
    const session = getCurrentUser();
    if (session && session.email) {
      try {
        const remoteUser = await cloudFindUser(session.email);
        // Si no se encuentra en la nube (porque fue eliminada en Firebase Console o desde otro equipo)
        if (remoteUser === null && navigator.onLine) {
          console.warn('⚠️ La cuenta fue eliminada en la nube. Purgando datos locales...');
          await purgeLocalUserData(session.id, session.email);
          setCurrentUser(null);
          return null;
        }
      } catch (err) {
        // En caso de modo offline (sin conexión), se mantiene la sesión local
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
