import type { LoginVO } from '@sdkwork/app-sdk';
import type { User } from '../entities/user.entity';

const USER_KEY = 'sdkwork_user';
const TOKEN_KEY = 'sdkwork_auth_token';
const REFRESH_TOKEN_KEY = 'sdkwork_refresh_token';

export interface AuthSessionSnapshot {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
}

class AuthSessionService {
    readSession(): AuthSessionSnapshot {
        if (typeof window === 'undefined') {
            return { user: null, accessToken: null, refreshToken: null };
        }

        try {
            const storedUser = window.localStorage.getItem(USER_KEY);
            return {
                user: storedUser ? (JSON.parse(storedUser) as User) : null,
                accessToken: window.localStorage.getItem(TOKEN_KEY),
                refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY)
            };
        } catch (error) {
            console.warn('[AuthSessionService] Failed to read auth session', error);
            return { user: null, accessToken: null, refreshToken: null };
        }
    }

    saveSession(user: User, loginVO: LoginVO): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
        window.localStorage.setItem(TOKEN_KEY, loginVO.accessToken);
        if (loginVO.refreshToken) {
            window.localStorage.setItem(REFRESH_TOKEN_KEY, loginVO.refreshToken);
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

    saveTokens(accessToken: string, refreshToken?: string | null): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(TOKEN_KEY, accessToken);
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
