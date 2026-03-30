import { User } from '../entities/user.entity';
import {
    appAuthService,
    authSessionService,
    registerAppSdkSessionRecoveryHandler,
    resolveAppSdkAccessToken,
    shouldHydrateStoredSession,
} from '../services';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { i18nService } from '@sdkwork/react-i18n';

export interface AuthStoreContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAuthResolved: boolean;
    authToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithPhone: (phone: string, code: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, password: string, email?: string, phone?: string, verificationCode?: string) => Promise<void>;
    refreshAuthToken: () => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    syncCurrentSession: () => Promise<boolean>;
}

const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

export const AuthStoreProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
    const [initialSession] = useState(() => authSessionService.readSession());
    const hasHydratableInitialSession = shouldHydrateStoredSession(initialSession);
    const [user, setUser] = useState<User | null>(() => hasHydratableInitialSession ? (initialSession.user ?? null) : null);
    const [authToken, setAuthToken] = useState<string | null>(() => hasHydratableInitialSession ? initialSession.authToken : null);
    const [accessToken, setAccessToken] = useState<string | null>(() => resolveAppSdkAccessToken() || null);
    const [refreshToken, setRefreshToken] = useState<string | null>(() => hasHydratableInitialSession ? initialSession.refreshToken : null);
    const [isAuthResolved, setIsAuthResolved] = useState<boolean>(() => !hasHydratableInitialSession);

    const saveAuthData = useCallback((userData: User, loginVO: {
        authToken: string;
        refreshToken?: string;
    }) => {
        const nextAccessToken = resolveAppSdkAccessToken();
        setUser(userData);
        setAuthToken(loginVO.authToken);
        setAccessToken(nextAccessToken || null);
        setRefreshToken(loginVO.refreshToken ?? null);
        setIsAuthResolved(true);
        authSessionService.saveSession(userData, loginVO);
    }, []);

    const saveAppSession = useCallback((session: {
        userId: string;
        username: string;
        displayName: string;
        authToken: string;
        accessToken: string;
        refreshToken?: string;
    }) => {
        const userData: User = {
            id: session.userId,
            uuid: session.userId,
            name: session.displayName,
            username: session.username,
            email: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        saveAuthData(userData, {
            authToken: session.authToken,
            refreshToken: session.refreshToken,
        });
    }, [saveAuthData]);

    const clearAuthData = useCallback(() => {
        const configuredAccessToken = resolveAppSdkAccessToken();
        setUser(null);
        setAuthToken(null);
        setAccessToken(configuredAccessToken || null);
        setRefreshToken(null);
        setIsAuthResolved(true);
        authSessionService.clearSession();
    }, []);

    const login = async (username: string, password: string) => {
        const session = await appAuthService.login({ username, password });
        saveAppSession(session);
    };

    const loginWithEmail = async (email: string, password: string) => {
        const session = await appAuthService.login({ username: email, password });
        saveAppSession(session);
    };

    const loginWithPhone = async (phone: string, code: string) => {
        const session = await appAuthService.loginWithPhone({ phone, code });
        saveAppSession(session);
    };

    const logout = async () => {
        await appAuthService.logout();
        clearAuthData();
    };

    const register = async (username: string, password: string, email?: string, phone?: string, verificationCode?: string) => {
        const session = await appAuthService.register({
            username,
            password,
            email,
            phone,
            name: username,
            verificationCode,
        });
        saveAppSession(session);
    };

    const syncCurrentSession = async (): Promise<boolean> => {
        const session = await appAuthService.getCurrentSession();
        if (!session) {
            clearAuthData();
            return false;
        }
        saveAppSession(session);
        return true;
    };

    const refreshAuthToken = async () => {
        try {
            const session = await appAuthService.refreshToken(refreshToken || undefined);
            setAuthToken(session.authToken);
            setAccessToken((session.accessToken || '').trim() || resolveAppSdkAccessToken() || null);
            setRefreshToken(session.refreshToken ?? null);
            setIsAuthResolved(true);
            authSessionService.saveTokens(session.authToken, session.refreshToken ?? null);
        } catch (error) {
            clearAuthData();
            throw new Error(
                error instanceof Error
                    ? error.message
                    : i18nService.t('auth.error.token_refresh_failed')
            );
        }
    };

    const refreshAccessToken = refreshAuthToken;

    useEffect(() => {
        if (!hasHydratableInitialSession) {
            return;
        }

        void syncCurrentSession().catch(() => {
            clearAuthData();
        }).finally(() => {
            setIsAuthResolved(true);
        });
    }, [clearAuthData, hasHydratableInitialSession]);

    useEffect(() => {
        return registerAppSdkSessionRecoveryHandler(async () => {
            const persistedSession = authSessionService.readSession();
            const nextRefreshToken = (persistedSession.refreshToken || refreshToken || '').trim();
            if (!nextRefreshToken) {
                clearAuthData();
                return { recovered: false };
            }

            try {
                const session = await appAuthService.refreshToken(nextRefreshToken);
                saveAppSession(session);
                return { recovered: true };
            } catch {
                clearAuthData();
                return { recovered: false };
            }
        });
    }, [clearAuthData, refreshToken, saveAppSession]);

    return (
        <AuthStoreContext.Provider value={{
            user,
            isAuthenticated: !!user && !!authToken,
            isAuthResolved,
            authToken,
            accessToken,
            refreshToken,
            login,
            loginWithEmail,
            loginWithPhone,
            logout,
            register,
            refreshAuthToken,
            refreshAccessToken,
            syncCurrentSession,
        }}>
            {children}
        </AuthStoreContext.Provider>
    );
};

export const useAuthStore = (): AuthStoreContextType => {
    const context = useContext(AuthStoreContext);
    if (context === null) {
        throw new Error('useAuthStore must be used within a AuthStoreProvider');
    }
    return context;
};

