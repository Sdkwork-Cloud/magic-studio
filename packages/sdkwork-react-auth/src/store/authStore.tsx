import { User } from '../entities/user.entity';
import { authService } from '../services/authService';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { LoginVO } from '@sdkwork/app-sdk';

interface AuthStoreContextType {
    user: User | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithPhone: (phone: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, password: string, email?: string, phone?: string) => Promise<void>;
    refreshAccessToken: () => Promise<void>;
}

const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

const TOKEN_KEY = 'sdkwork_auth_token';
const REFRESH_TOKEN_KEY = 'sdkwork_refresh_token';

export const AuthStoreProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('sdkwork_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [accessToken, setAccessToken] = useState<string | null>(() => {
        return localStorage.getItem(TOKEN_KEY);
    });
    const [refreshToken, setRefreshToken] = useState<string | null>(() => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    });

    const saveAuthData = useCallback((userData: User, loginVO: LoginVO) => {
        setUser(userData);
        setAccessToken(loginVO.accessToken);
        setRefreshToken(loginVO.refreshToken);
        
        localStorage.setItem('sdkwork_user', JSON.stringify(userData));
        localStorage.setItem(TOKEN_KEY, loginVO.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, loginVO.refreshToken);
    }, []);

    const clearAuthData = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        
        localStorage.removeItem('sdkwork_user');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }, []);

    const login = async (username: string, password: string) => {
        const result = await authService.login(username, password);
        if (result.success && result.data) {
            saveAuthData(result.data.user, result.data.loginVO);
        } else {
            throw new Error(result.message || 'Login failed');
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        const result = await authService.loginWithEmail(email, password);
        if (result.success && result.data) {
            saveAuthData(result.data.user, result.data.loginVO);
        } else {
            throw new Error(result.message || 'Login failed');
        }
    };

    const loginWithPhone = async (phone: string, password: string) => {
        const result = await authService.loginWithPhone(phone, password);
        if (result.success && result.data) {
            saveAuthData(result.data.user, result.data.loginVO);
        } else {
            throw new Error(result.message || 'Login failed');
        }
    };

    const logout = async () => {
        await authService.logout();
        clearAuthData();
    };

    const register = async (username: string, password: string, email?: string, phone?: string) => {
        const result = await authService.register(username, password, email, phone);
        if (result.success && result.data) {
            setUser(result.data);
            localStorage.setItem('sdkwork_user', JSON.stringify(result.data));
        } else {
            throw new Error(result.message || 'Registration failed');
        }
    };

    const refreshAccessToken = async () => {
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const result = await authService.refreshToken(refreshToken);
        if (result.success && result.data) {
            setAccessToken(result.data.accessToken);
            setRefreshToken(result.data.refreshToken);
            
            localStorage.setItem(TOKEN_KEY, result.data.accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
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
