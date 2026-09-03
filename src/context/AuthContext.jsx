import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getCurrentUser, 
  loginUser, 
  registerUser, 
  logoutUser, 
  updateUserProfile, 
  changeUserPassword,
  deleteUserAccount
} from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const handleLogin = async (credentials) => {
    const user = await loginUser(credentials);
    setCurrentUser(user);
    return user;
  };

  const handleRegister = async (userData) => {
    const user = await registerUser(userData);
    setCurrentUser(user);
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
    return await changeUserPassword(currentUser.id, currentPassword, newPassword);
  };

  const handleDeleteAccount = async (password) => {
    if (!currentUser) return;
    await deleteUserAccount(currentUser.id, password);
    setCurrentUser(null);
  };

  const handleSetSessionUser = (user) => {
    localStorage.setItem('ganado_current_user_session', JSON.stringify(user));
    setCurrentUser(user);
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
        deleteAccount: handleDeleteAccount,
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
