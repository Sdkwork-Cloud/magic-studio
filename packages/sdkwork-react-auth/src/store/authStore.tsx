import { User } from '../entities/user.entity';
import { authBusinessService, authSessionService } from '../services';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { LoginVO } from '@sdkwork/app-sdk';

interface AuthStoreContextType {
    user: User | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithPhone: (phone: string, code: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, password: string, email?: string, phone?: string) => Promise<void>;
    refreshAccessToken: () => Promise<void>;
}

const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

export const AuthStoreProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
    const [initialSession] = useState(() => authSessionService.readSession());
    const [user, setUser] = useState<User | null>(() => initialSession.user);
    const [accessToken, setAccessToken] = useState<string | null>(() => initialSession.accessToken);
    const [refreshToken, setRefreshToken] = useState<string | null>(() => initialSession.refreshToken);

    const saveAuthData = useCallback((userData: User, loginVO: LoginVO) => {
        setUser(userData);
        setAccessToken(loginVO.accessToken);
        setRefreshToken(loginVO.refreshToken ?? null);
        authSessionService.saveSession(userData, loginVO);
    }, []);

    const clearAuthData = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        authSessionService.clearSession();
    }, []);

    const login = async (username: string, password: string) => {
        const result = await authBusinessService.login(username, password);
        if (result.success && result.data) {
            saveAuthData(result.data.user, result.data.loginVO);
        } else {
            throw new Error(result.message || 'Login failed');
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        const result = await authBusinessService.loginWithEmail(email, password);
        if (result.success && result.data) {
            saveAuthData(result.data.user, result.data.loginVO);
        } else {
            throw new Error(result.message || 'Login failed');
        }
    };

    const loginWithPhone = async (phone: string, code: string) => {
        const result = await authBusinessService.loginWithPhone(phone, code);
        if (result.success && result.data) {
            saveAuthData(result.data.user, result.data.loginVO);
        } else {
            throw new Error(result.message || 'Login failed');
        }
    };

    const logout = async () => {
        await authBusinessService.logout();
        clearAuthData();
    };

    const register = async (username: string, password: string, email?: string, phone?: string) => {
        const result = await authBusinessService.register(username, password, email, phone);
        if (result.success && result.data) {
            setUser(result.data);
            authSessionService.saveUser(result.data);
        } else {
            throw new Error(result.message || 'Registration failed');
        }
    };

    const refreshAccessToken = async () => {
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const result = await authBusinessService.refreshToken(refreshToken);
        if (result.success && result.data) {
            setAccessToken(result.data.accessToken);
            setRefreshToken(result.data.refreshToken ?? null);
            authSessionService.saveTokens(result.data.accessToken, result.data.refreshToken ?? null);
        } else {
            clearAuthData();
            throw new Error(result.message || 'Token refresh failed');
        }
    };

    return (
        <AuthStoreContext.Provider value={{
            user,
            isAuthenticated: !!user,
            accessToken,
            refreshToken,
            login,
            loginWithEmail,
            loginWithPhone,
            logout,
            register,
            refreshAccessToken,
        }}>
            {children}
        </AuthStoreContext.Provider>
    );
};

export const useAuthStore = () => {
    const context = useContext(AuthStoreContext);
    if (context === null) {
        throw new Error('useAuthStore must be used within a AuthStoreProvider');
    }
    return context;
};

