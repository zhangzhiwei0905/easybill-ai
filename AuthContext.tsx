import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from './services/api';

// User Type Definition
export interface User {
  id: string;
  name: string;
  email: string | null;
  avatar?: string | null;
  isPro?: boolean;
  webhookKey?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('easybill_user');
    localStorage.removeItem('easybill_token');
    localStorage.removeItem('easybill_refresh_token');
  }, []);

  // Initialize state from localStorage with async token validation
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('easybill_user');
        const storedToken = localStorage.getItem('easybill_token');
        const storedRefreshToken = localStorage.getItem('easybill_refresh_token');

        if (!storedUser || !storedToken) {
          return;
        }

        // Try to validate the access token
        try {
          const meUser = await api.auth.me(storedToken);
          if (!cancelled) {
            setUser(meUser);
            setToken(storedToken);
            localStorage.setItem('easybill_user', JSON.stringify(meUser));
          }
          return;
        } catch {
          // Access token expired, try refresh
        }

        if (!storedRefreshToken) {
          logout();
          return;
        }

        try {
          const refreshResult = await api.auth.refresh(storedRefreshToken);
          const meUser = await api.auth.me(refreshResult.accessToken);
          if (!cancelled) {
            setUser(meUser);
            setToken(refreshResult.accessToken);
            localStorage.setItem('easybill_user', JSON.stringify(meUser));
            localStorage.setItem('easybill_token', refreshResult.accessToken);
            localStorage.setItem('easybill_refresh_token', refreshResult.refreshToken);
          }
        } catch {
          logout();
        }
      } catch (error) {
        console.error('Failed to restore session', error);
        logout();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    return () => { cancelled = true; };
  }, [logout]);

  // Listen for auth expiry events from API interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [logout]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('easybill_user', JSON.stringify(userData));
    localStorage.setItem('easybill_token', accessToken);
    localStorage.setItem('easybill_refresh_token', refreshToken);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
