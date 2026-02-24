
import { User } from '../entities/user.entity'
import { authService } from '../services/authService'
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthStoreContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (method: 'email' | 'phone' | 'wechat', credentials: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

export const AuthStoreProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (method: 'email' | 'phone' | 'wechat', credentials: any) => {
    const result = await authService.login(method, credentials);
    if (result.success && result.data) {
        setUser(result.data);
    } else {
        throw new Error(result.message || 'Login failed');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthStoreContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthStoreContext.Provider>
  );
};

export const useAuthStore = () => {
  const context = useContext(AuthStoreContext);
  if (context === null) throw new Error('useAuthStore must be used within a AuthStoreProvider');
  return context;
};
