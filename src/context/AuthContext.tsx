import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VendorUser } from '../types';
import { apiService, DEFAULT_API_URL } from '../services/api';

interface AuthContextType {
  user: VendorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  login: (loginText: string, passwordText: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<VendorUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_URL);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const initResult = await apiService.init();
      setApiBaseUrlState(initResult.baseUrl);

      if (initResult.token) {
        // Token exists, verify with live profile endpoint
        try {
          const liveProfile = await apiService.getProfile();
          setUser(liveProfile);
          setIsLoading(false);
          return;
        } catch {
          // Token expired or invalid, fall through to auto-login
        }
      }

      // Initial start or fresh launch: attempt connection with default credentials
      try {
        const res = await apiService.login('admin', 'admin');
        setUser(res.vendor);
      } catch {
        // If auto-login failed, show LoginScreen
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const setApiBaseUrl = (url: string) => {
    setApiBaseUrlState(url);
    apiService.setBaseUrl(url);
  };

  const login = async (loginText: string, passwordText: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.login(loginText, passwordText);
      setUser(res.vendor);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiService.getProfile();
      setUser(profile);
    } catch {
      // Keep existing profile state
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        apiBaseUrl,
        setApiBaseUrl,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
