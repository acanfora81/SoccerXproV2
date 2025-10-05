import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    console.log('🔵 [AUTH] Verifica sessione esistente...');
    try {
      const userData = await authService.checkAuth();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.log('🟢 [AUTH] Sessione valida trovata:', userData.email);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('🟡 [AUTH] Nessuna sessione valida');
      }
    } catch (error) {
      console.log('🟡 [AUTH] Nessuna sessione valida');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    console.log('🔵 [AUTH] Tentativo login:', email);
    const userData = await authService.login(email, password);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('🟢 [AUTH] Login completato');
    return userData;
  };

  const registerWithTeam = async (formData) => {
    console.log('🔵 [AUTH] Tentativo registrazione con team:', formData.email);
    const userData = await authService.registerWithTeam(formData);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('🟢 [AUTH] Registrazione completata');
    return userData;
  };

  const logout = async () => {
    console.log('🔵 [AUTH] Logout in corso...');
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    console.log('🟢 [AUTH] Logout completato');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await authService.refreshToken();
        console.log('🟢 [AUTH] Token auto-rinnovato');
      } catch (error) {
        console.log('🔴 [AUTH] Auto-refresh fallito - logout');
        logout();
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const value = { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    registerWithTeam, 
    logout, 
    checkAuth 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}