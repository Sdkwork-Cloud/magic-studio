import { useMemo } from 'react';
import {
    createClient,
    type AnalyticApi,
    type AssetApi,
    type CouponApi,
    type OrderApi,
    type PaymentApi,
    type ProjectApi,
    type SettingApi,
    type SdkworkAppClient,
    type SdkworkAppConfig,
    type WorkspaceApi,
} from '@sdkwork/app-sdk';
import {
    createAppSdkClientConfigFromEnv,
    readAppSdkEnv,
    resolveAppSdkAccessTokenFromEnv,
    type AppRuntimeEnv,
    type AppSdkEnvResolvedConfig,
} from './appSdkEnv';

export type { AppRuntimeEnv } from './appSdkEnv';

export interface AppSdkClientConfig extends AppSdkEnvResolvedConfig {}

export interface AppSdkClient extends SdkworkAppClient {
    readonly assets: AssetApi;
    readonly notes: SdkworkAppClient['note'];
    readonly projects: ProjectApi;
    readonly payments: PaymentApi;
    readonly orders: OrderApi;
    readonly coupons: CouponApi;
    readonly settings: SettingApi;
    readonly workspaces: WorkspaceApi;
    readonly analytics: AnalyticApi;
}

export interface AppSdkSessionTokens {
    authToken?: string;
    accessToken?: string;
    refreshToken?: string;
}

export const APP_SDK_AUTH_TOKEN_STORAGE_KEY = 'sdkwork_token';
export const APP_SDK_ACCESS_TOKEN_STORAGE_KEY = 'sdkwork_access_token';
export const APP_SDK_REFRESH_TOKEN_STORAGE_KEY = 'sdkwork_refresh_token';

const compatClients = new WeakSet<object>();

function ensureAppSdkClientCompat(client: SdkworkAppClient): AppSdkClient {
    if (!compatClients.has(client as object)) {
        Object.defineProperties(client, {
            assets: {
                configurable: true,
                get() {
                    return client.asset;
                },
            },
            notes: {
                configurable: true,
                get() {
                    return client.note;
                },
            },
            projects: {
                configurable: true,
                get() {
                    return client.project;
                },
            },
            payments: {
                configurable: true,
                get() {
                    return client.payment;
                },
            },
            orders: {
                configurable: true,
                get() {
                    return client.order;
                },
            },
            coupons: {
                configurable: true,
                get() {
                    return client.coupon;
                },
            },
            settings: {
                configurable: true,
                get() {
                    return client.setting;
                },
            },
            workspaces: {
                configurable: true,
                get() {
                    return client.workspace;
                },
            },
            analytics: {
                configurable: true,
                get() {
                    return client.analytic;
                },
            },
        });
        compatClients.add(client as object);
    }

    return client as AppSdkClient;
}

let appSdkClient: AppSdkClient | null = null;
let appSdkConfig: AppSdkClientConfig | null = null;

function applySessionTokensToClient(
    client: AppSdkClient,
    tokens: {
        authToken?: string;
        accessToken?: string;
    }
): void {
    client.setAuthToken(normalizeAuthToken(tokens.authToken));
    if (tokens.accessToken !== undefined) {
        client.setAccessToken((tokens.accessToken || '').trim());
    }
}

function readStorage(key: string): string | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }
    try {
        const value = window.localStorage.getItem(key);
        return value || undefined;
    } catch {
        return undefined;
    }
}

function writeStorage(key: string, value?: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        if (value && value.trim()) {
            window.localStorage.setItem(key, value.trim());
        } else {
            window.localStorage.removeItem(key);
        }
    } catch {
        // ignore storage errors
    }
}

function removeStorage(key: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.removeItem(key);
    } catch {
        // ignore storage errors
    }
}

function normalizeAuthToken(value?: string): string {
    const normalized = (value || '').trim();
    if (!normalized) {
        return '';
    }
    if (normalized.toLowerCase().startsWith('bearer ')) {
        return normalized.slice(7).trim();
    }
    return normalized;
}

export function createAppSdkClientConfig(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClientConfig {
    return createAppSdkClientConfigFromEnv(readAppSdkEnv(), overrides);
}

export function initAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
    appSdkConfig = createAppSdkClientConfig(overrides);
    appSdkClient = ensureAppSdkClientCompat(createClient(appSdkConfig));
    return appSdkClient;
}

export function getAppSdkClient(): AppSdkClient {
    if (!appSdkClient) {
        return initAppSdkClient();
    }
    return appSdkClient;
}

export function getAppSdkClientConfig(): AppSdkClientConfig | null {
    return appSdkConfig;
}

export function resolveAppSdkAccessToken(): string {
    const fromConfig = (getAppSdkClientConfig()?.accessToken || '').trim();
    if (fromConfig) {
        return fromConfig;
    }

    const fromEnv = resolveAppSdkAccessTokenFromEnv(readAppSdkEnv());
    if (fromEnv) {
        return fromEnv;
    }

    getAppSdkClient();
    return (getAppSdkClientConfig()?.accessToken || '').trim();
}

export function resetAppSdkClient(): void {
    appSdkClient = null;
    appSdkConfig = null;
}

export function applyAppSdkSessionTokens(tokens: {
    authToken?: string;
    accessToken?: string;
}): void {
    const client = getAppSdkClient();
    applySessionTokensToClient(client, tokens);
}

export function readAppSdkSessionTokens(): AppSdkSessionTokens {
    const authToken = normalizeAuthToken(readStorage(APP_SDK_AUTH_TOKEN_STORAGE_KEY));
    const accessToken = (
        getAppSdkClientConfig()?.accessToken || resolveAppSdkAccessTokenFromEnv(readAppSdkEnv()) || ''
    ).trim();
    const refreshToken = (readStorage(APP_SDK_REFRESH_TOKEN_STORAGE_KEY) || '').trim();

    return {
        authToken: authToken || undefined,
        accessToken: accessToken || undefined,
        refreshToken: refreshToken || undefined,
    };
}

export function persistAppSdkSessionTokens(tokens: AppSdkSessionTokens): void {
    const authToken = normalizeAuthToken(tokens.authToken);
    const accessToken = (
        tokens.accessToken !== undefined
            ? (tokens.accessToken || '').trim()
            : resolveAppSdkAccessToken()
    ).trim();
    const refreshToken = (tokens.refreshToken || '').trim();

    writeStorage(APP_SDK_AUTH_TOKEN_STORAGE_KEY, authToken || undefined);
    writeStorage(APP_SDK_REFRESH_TOKEN_STORAGE_KEY, refreshToken || undefined);

    applyAppSdkSessionTokens({ authToken, accessToken });
}

export function clearAppSdkSessionTokens(): void {
    removeStorage(APP_SDK_AUTH_TOKEN_STORAGE_KEY);
    removeStorage(APP_SDK_ACCESS_TOKEN_STORAGE_KEY);
    removeStorage(APP_SDK_REFRESH_TOKEN_STORAGE_KEY);

    const configuredAccessToken = resolveAppSdkAccessToken();
    applyAppSdkSessionTokens({
        authToken: '',
        accessToken: configuredAccessToken,
    });
    resetAppSdkClient();
}

export function createScopedAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
    const config = createAppSdkClientConfig(overrides);
    const client = ensureAppSdkClientCompat(createClient(config));
    const session = readAppSdkSessionTokens();

    applySessionTokensToClient(client, {
        authToken: session.authToken || '',
        accessToken: session.accessToken ?? (config.accessToken || '').trim(),
    });

    return client;
}

export function getAppSdkClientWithSession(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
    if (Object.keys(overrides).length > 0) {
        return createScopedAppSdkClient(overrides);
    }

    const client = getAppSdkClient();
    const session = readAppSdkSessionTokens();
    applyAppSdkSessionTokens({
        authToken: session.authToken || '',
        accessToken: session.accessToken ?? resolveAppSdkAccessToken(),
    });
    return client;
}

export function useAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
    const key = JSON.stringify(overrides || {});
    return useMemo(() => getAppSdkClientWithSession(overrides), [key]);
}
