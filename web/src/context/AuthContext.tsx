import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginCredentials } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Clear any legacy insecure credentials or session blobs from browser storage
  useEffect(() => {
    try {
      localStorage.removeItem('deltaharvest_auth_user');
      localStorage.removeItem('deltaharvest_local_users');
      localStorage.removeItem('tradier_api_key');
      localStorage.removeItem('schwab_app_key');
      localStorage.removeItem('schwab_app_secret');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      // Server unreachable or network error - fail closed
      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(credentials),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return {
        success: false,
        error: data.error || 'Authentication failed. Please verify your credentials or contact administrator.',
      };
    } catch {
      // Fail closed: Never fall back to client-side verification
      return {
        success: false,
        error: 'Authentication server unreachable. Please check connection and try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      try {
        sessionStorage.clear();
        localStorage.removeItem('deltaharvest_auth_user');
        localStorage.removeItem('deltaharvest_local_users');
        localStorage.removeItem('tradier_api_key');
        localStorage.removeItem('schwab_app_key');
        localStorage.removeItem('schwab_app_secret');
      } catch {
        // Ignore
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Password update failed' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Authentication service unreachable.' };
    }
  };

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isAuthenticated,
        login,
        logout,
        refreshSession,
        changePassword,
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

