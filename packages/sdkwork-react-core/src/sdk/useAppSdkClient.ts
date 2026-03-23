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

export type AppRuntimeEnv = 'development' | 'staging' | 'production' | 'test';

export interface AppSdkClientConfig extends SdkworkAppConfig {
    env: AppRuntimeEnv;
}

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

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DEV_BASE_URL = 'https://api-dev.sdkwork.com';
const DEFAULT_PROD_BASE_URL = 'https://api.sdkwork.com';
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

function readEnv(name: string): string | undefined {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.[name];
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return undefined;
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

function resolveRuntimeEnv(value?: string): AppRuntimeEnv {
    const normalized = (value || '').trim().toLowerCase();
    if (normalized === 'production' || normalized === 'prod') return 'production';
    if (normalized === 'staging' || normalized === 'stage') return 'staging';
    if (normalized === 'test') return 'test';
    return 'development';
}

function parseTimeout(value?: string, fallback: number = DEFAULT_TIMEOUT): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

function resolveDefaultBaseUrl(env: AppRuntimeEnv): string {
    return env === 'production' ? DEFAULT_PROD_BASE_URL : DEFAULT_DEV_BASE_URL;
}

function normalizeBaseUrl(baseUrl?: string, env?: AppRuntimeEnv): string {
    const safe = (baseUrl || resolveDefaultBaseUrl(env || 'development')).trim();
    return safe.replace(/\/+$/g, '');
}

export function createAppSdkClientConfig(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClientConfig {
    const env = resolveRuntimeEnv(readEnv('VITE_APP_ENV') || readEnv('MODE') || readEnv('NODE_ENV'));
    return {
        env,
        baseUrl: normalizeBaseUrl(
            firstDefined(
                overrides.baseUrl,
                readEnv('VITE_API_BASE_URL'),
                readEnv('VITE_APP_API_BASE_URL'),
                readEnv('SDKWORK_API_BASE_URL'),
                readEnv('VITE_APP_BASE_URL'),
                resolveDefaultBaseUrl(env)
            ),
            env
        ),
        timeout: overrides.timeout ?? parseTimeout(firstDefined(readEnv('VITE_TIMEOUT'), readEnv('SDKWORK_TIMEOUT'))),
        apiKey: overrides.apiKey ?? firstDefined(readEnv('VITE_API_KEY'), readEnv('SDKWORK_API_KEY')),
        authToken: overrides.authToken,
        accessToken: overrides.accessToken ?? firstDefined(
            readEnv('VITE_ACCESS_TOKEN'),
            readEnv('SDKWORK_ACCESS_TOKEN')
        ),
        tenantId: overrides.tenantId ?? firstDefined(readEnv('VITE_TENANT_ID'), readEnv('SDKWORK_TENANT_ID')),
        organizationId: overrides.organizationId ?? firstDefined(
            readEnv('VITE_ORGANIZATION_ID'),
            readEnv('SDKWORK_ORGANIZATION_ID')
        ),
        platform: overrides.platform ?? firstDefined(readEnv('VITE_PLATFORM'), readEnv('SDKWORK_PLATFORM')) ?? 'web',
        tokenManager: overrides.tokenManager,
        authMode: overrides.authMode,
        headers: overrides.headers,
    };
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

    const fromEnv = (firstDefined(
        readEnv('VITE_ACCESS_TOKEN'),
        readEnv('SDKWORK_ACCESS_TOKEN')
    ) || '').trim();
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
        firstDefined(
            getAppSdkClientConfig()?.accessToken,
            readEnv('VITE_ACCESS_TOKEN'),
            readEnv('SDKWORK_ACCESS_TOKEN')
        ) || ''
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
