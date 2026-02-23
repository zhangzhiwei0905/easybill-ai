import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User Type Definition
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  isPro?: boolean;
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

  // Initialize state from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('easybill_user');
      const storedToken = localStorage.getItem('easybill_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to restore session', error);
      localStorage.removeItem('easybill_user');
      localStorage.removeItem('easybill_token');
      localStorage.removeItem('easybill_refresh_token');
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('easybill_user', JSON.stringify(userData));
    localStorage.setItem('easybill_token', accessToken);
    localStorage.setItem('easybill_refresh_token', refreshToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('easybill_user');
    localStorage.removeItem('easybill_token');
    localStorage.removeItem('easybill_refresh_token');
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