import type { User } from '../entities/user.entity';
import {
    APP_SDK_AUTH_TOKEN_STORAGE_KEY,
    APP_SDK_REFRESH_TOKEN_STORAGE_KEY,
} from './useAppSdkClient';

const USER_KEY = 'sdkwork_user';
const TOKEN_KEY = APP_SDK_AUTH_TOKEN_STORAGE_KEY;
const REFRESH_TOKEN_KEY = APP_SDK_REFRESH_TOKEN_STORAGE_KEY;

export interface AuthSessionSnapshot {
    user: User | null;
    authToken: string | null;
    refreshToken: string | null;
}

class AuthSessionService {
    private normalizeAuthToken(value: string | null): string | null {
        const normalized = (value || '').trim();
        if (!normalized) {
            return null;
        }
        if (normalized.toLowerCase().startsWith('bearer ')) {
            const token = normalized.slice(7).trim();
            return token || null;
        }
        return normalized;
    }

    private readAuthTokenFromStorage(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }
        return this.normalizeAuthToken(window.localStorage.getItem(TOKEN_KEY));
    }

    private writeAuthTokenToStorage(authToken: string): void {
        if (typeof window === 'undefined') {
            return;
        }
        const normalized = this.normalizeAuthToken(authToken) || '';
        if (normalized) {
            window.localStorage.setItem(TOKEN_KEY, normalized);
        } else {
            window.localStorage.removeItem(TOKEN_KEY);
        }
    }

    readSession(): AuthSessionSnapshot {
        if (typeof window === 'undefined') {
            return { user: null, authToken: null, refreshToken: null };
        }

        try {
            const storedUser = window.localStorage.getItem(USER_KEY);
            const authToken = this.readAuthTokenFromStorage();
            if (!authToken) {
                return { user: null, authToken: null, refreshToken: null };
            }
            return {
                user: storedUser ? (JSON.parse(storedUser) as User) : null,
                authToken,
                refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY)
            };
        } catch (error) {
            console.warn('[AuthSessionService] Failed to read auth session', error);
            return { user: null, authToken: null, refreshToken: null };
        }
    }

    saveSession(user: User, tokens: { authToken: string; refreshToken?: string | null }): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.writeAuthTokenToStorage(tokens.authToken);
        if (tokens.refreshToken) {
            window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        } else {
            window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    }

    saveUser(user: User): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    saveTokens(authToken: string, refreshToken?: string | null): void {
        if (typeof window === 'undefined') {
            return;
        }
        this.writeAuthTokenToStorage(authToken);
        if (refreshToken) {
            window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } else {
            window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    }

    clearSession(): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
}

export const authSessionService = new AuthSessionService();
