import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Company } from '../types';
import { apiService, DEFAULT_API_URL } from '../services/api';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  isLoading: boolean;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  login: (emailText: string, passwordText: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
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
          const [liveProfile, liveCompany] = await Promise.all([
            apiService.getProfile(),
            apiService.getCurrentCompany().catch(() => null),
          ]);
          setUser(liveProfile);
          setCompany(liveCompany);
          setIsLoading(false);
          return;
        } catch {
          // Token expired or invalid, clear
          await apiService.logout();
          setUser(null);
          setCompany(null);
        }
      }
    } catch {
      setUser(null);
      setCompany(null);
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

  const login = async (emailText: string, passwordText: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiService.login(emailText, passwordText);
      setUser(res.user);

      // Load company details in background
      try {
        const comp = await apiService.getCurrentCompany();
        setCompany(comp);
      } catch {
        // Continue even if company details take a moment
      }

      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      // Update local user state so mustChangePassword becomes false
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        setUser(updatedUser);
      }
      // Re-fetch profile to sync with server
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    setCompany(null);
  };

  const refreshProfile = async () => {
    try {
      const [liveProfile, liveCompany] = await Promise.all([
        apiService.getProfile(),
        apiService.getCurrentCompany().catch(() => null),
      ]);
      setUser(liveProfile);
      setCompany(liveCompany);
    } catch {
      // Keep existing profile state
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: !!user,
        mustChangePassword: !!user?.mustChangePassword,
        isLoading,
        apiBaseUrl,
        setApiBaseUrl,
        login,
        changePassword,
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
