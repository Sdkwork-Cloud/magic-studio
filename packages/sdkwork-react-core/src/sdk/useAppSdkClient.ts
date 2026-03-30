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

export type AppSdkSessionRecoveryResult =
    | boolean
    | void
    | {
        recovered?: boolean;
    };

export type AppSdkSessionRecoveryHandler = (
    error: unknown,
    tokens: AppSdkSessionTokens
) => Promise<AppSdkSessionRecoveryResult> | AppSdkSessionRecoveryResult;

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DEV_BASE_URL = 'https://api-dev.sdkwork.com';
const DEFAULT_PROD_BASE_URL = 'https://api.sdkwork.com';
export const APP_SDK_AUTH_TOKEN_STORAGE_KEY = 'sdkwork_token';
export const APP_SDK_ACCESS_TOKEN_STORAGE_KEY = 'sdkwork_access_token';
export const APP_SDK_REFRESH_TOKEN_STORAGE_KEY = 'sdkwork_refresh_token';
const AUTHORIZATION_ERROR_PATTERN = /(unauthorized|forbidden|unauthenticated|not login|not logged in|未登录|无权限|权限不足|未授权|禁止访问)/i;
const AUTHORIZATION_ERROR_CODES = new Set([
    '401',
    '4010',
    '403',
    '4030',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'TOKEN_EXPIRED',
    'TOKEN_INVALID',
    'NO_RIGHT',
]);

const compatClients = new WeakSet<object>();
const proxiedClients = new WeakMap<object, object>();

let appSdkSessionRecoveryHandler: AppSdkSessionRecoveryHandler | null = null;
let appSdkSessionRecoveryPromise: Promise<boolean> | null = null;
let sharedAppSdkTokens: AppSdkSessionTokens = {};

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

const sharedAppSdkTokenManager = {
    getAccessToken(): string | undefined {
        return sharedAppSdkTokens.accessToken;
    },
    getAuthToken(): string | undefined {
        return sharedAppSdkTokens.authToken;
    },
    getRefreshToken(): string | undefined {
        return sharedAppSdkTokens.refreshToken;
    },
    getTokens(): AppSdkSessionTokens {
        return { ...sharedAppSdkTokens };
    },
    setTokens(tokens: AppSdkSessionTokens): void {
        sharedAppSdkTokens = {
            accessToken: (tokens.accessToken || '').trim() || undefined,
            authToken: normalizeAuthToken(tokens.authToken) || undefined,
            refreshToken: (tokens.refreshToken || '').trim() || undefined,
        };
    },
    setAccessToken(token: string): void {
        sharedAppSdkTokens = {
            ...sharedAppSdkTokens,
            accessToken: (token || '').trim() || undefined,
        };
    },
    setAuthToken(token: string): void {
        sharedAppSdkTokens = {
            ...sharedAppSdkTokens,
            authToken: normalizeAuthToken(token) || undefined,
        };
    },
    setRefreshToken(token: string): void {
        sharedAppSdkTokens = {
            ...sharedAppSdkTokens,
            refreshToken: (token || '').trim() || undefined,
        };
    },
    clearTokens(): void {
        sharedAppSdkTokens = {};
    },
    clearAuthToken(): void {
        sharedAppSdkTokens = {
            ...sharedAppSdkTokens,
            authToken: undefined,
        };
    },
    clearAccessToken(): void {
        sharedAppSdkTokens = {
            ...sharedAppSdkTokens,
            accessToken: undefined,
        };
    },
    isExpired(): boolean {
        return false;
    },
    isValid(): boolean {
        return Boolean(sharedAppSdkTokens.accessToken || sharedAppSdkTokens.authToken);
    },
    hasToken(): boolean {
        return Boolean(sharedAppSdkTokens.accessToken || sharedAppSdkTokens.authToken);
    },
    hasAuthToken(): boolean {
        return Boolean(sharedAppSdkTokens.authToken);
    },
    hasAccessToken(): boolean {
        return Boolean(sharedAppSdkTokens.accessToken);
    },
    willExpireIn(_seconds: number): boolean {
        return false;
    },
};

function syncSharedAppSdkTokens(tokens: AppSdkSessionTokens): void {
    sharedAppSdkTokenManager.setTokens(tokens);
}

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

function normalizeText(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
}

function normalizeErrorCode(value: unknown): string {
    return normalizeText(value).toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object';
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

export function isAppSdkAuthorizationError(error: unknown, depth: number = 0): boolean {
    if (depth > 2 || error == null) {
        return false;
    }

    if (typeof error === 'string') {
        return AUTHORIZATION_ERROR_PATTERN.test(error);
    }

    if (error instanceof Error && AUTHORIZATION_ERROR_PATTERN.test(error.message)) {
        return true;
    }

    if (!isRecord(error)) {
        return false;
    }

    const httpStatus = normalizeErrorCode(error.httpStatus);
    if (httpStatus === '401' || httpStatus === '403') {
        return true;
    }

    const errorCodes = [
        normalizeErrorCode(error.code),
        normalizeErrorCode(error.businessCode),
        normalizeErrorCode(error.errorCode),
    ];
    if (errorCodes.some((code) => AUTHORIZATION_ERROR_CODES.has(code))) {
        return true;
    }

    const errorMessage =
        normalizeText(error.message) ||
        normalizeText(error.msg) ||
        normalizeText(error.error);
    if (AUTHORIZATION_ERROR_PATTERN.test(errorMessage)) {
        return true;
    }

    return isAppSdkAuthorizationError(error.cause, depth + 1);
}

function normalizeRecoveryResult(result: AppSdkSessionRecoveryResult): boolean {
    if (typeof result === 'boolean') {
        return result;
    }
    if (result && typeof result === 'object' && 'recovered' in result) {
        return Boolean(result.recovered);
    }
    return false;
}

async function recoverAppSdkSession(error: unknown): Promise<boolean> {
    if (!appSdkSessionRecoveryHandler) {
        return false;
    }

    if (!appSdkSessionRecoveryPromise) {
        const currentTokens = readAppSdkSessionTokens();
        appSdkSessionRecoveryPromise = Promise.resolve()
            .then(() => appSdkSessionRecoveryHandler?.(error, currentTokens))
            .then((result) => normalizeRecoveryResult(result ?? false))
            .catch(() => false)
            .finally(() => {
                appSdkSessionRecoveryPromise = null;
            });
    }

    return appSdkSessionRecoveryPromise;
}

export function registerAppSdkSessionRecoveryHandler(
    handler: AppSdkSessionRecoveryHandler
): () => void {
    appSdkSessionRecoveryHandler = handler;
    return () => {
        if (appSdkSessionRecoveryHandler === handler) {
            appSdkSessionRecoveryHandler = null;
        }
    };
}

export async function runWithAppSdkAuthRecovery<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (!isAppSdkAuthorizationError(error)) {
            throw error;
        }

        const recovered = await recoverAppSdkSession(error);
        if (!recovered) {
            throw error;
        }

        return operation();
    }
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
    const sessionTokens = readAppSdkSessionTokens();
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
        authToken: normalizeAuthToken(overrides.authToken ?? sessionTokens.authToken),
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
        tokenManager: overrides.tokenManager ?? sharedAppSdkTokenManager,
        authMode: overrides.authMode,
        headers: overrides.headers,
    };
}

export function initAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
    appSdkConfig = createAppSdkClientConfig(overrides);
    syncSharedAppSdkTokens({
        authToken: appSdkConfig.authToken,
        accessToken: appSdkConfig.accessToken,
        refreshToken: readAppSdkSessionTokens().refreshToken,
    });
    appSdkClient = createAppSdkClientProxy(
        ensureAppSdkClientCompat(createClient(appSdkConfig))
    );
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

export function hasAppSdkAuthSession(): boolean {
    return Boolean(readAppSdkSessionTokens().authToken);
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
    syncSharedAppSdkTokens({
        authToken,
        accessToken,
        refreshToken,
    });

    applyAppSdkSessionTokens({ authToken, accessToken });
}

export function clearAppSdkSessionTokens(): void {
    removeStorage(APP_SDK_AUTH_TOKEN_STORAGE_KEY);
    removeStorage(APP_SDK_ACCESS_TOKEN_STORAGE_KEY);
    removeStorage(APP_SDK_REFRESH_TOKEN_STORAGE_KEY);

    const configuredAccessToken = resolveAppSdkAccessToken();
    syncSharedAppSdkTokens({
        authToken: '',
        accessToken: configuredAccessToken,
        refreshToken: '',
    });
    applyAppSdkSessionTokens({
        authToken: '',
        accessToken: configuredAccessToken,
    });
    resetAppSdkClient();
}

export function createScopedAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}): AppSdkClient {
    const config = createAppSdkClientConfig(overrides);
    syncSharedAppSdkTokens({
        authToken: config.authToken,
        accessToken: config.accessToken,
        refreshToken: readAppSdkSessionTokens().refreshToken,
    });
    const client = createAppSdkClientProxy(ensureAppSdkClientCompat(createClient(config)));
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

function shouldWrapAppSdkMethod(path: string[], methodName: string): boolean {
    if (path.length === 0) {
        return false;
    }

    if (path[0] === 'auth') {
        return false;
    }

    return ![
        'setApiKey',
        'setAuthToken',
        'setAccessToken',
        'setTokenManager',
        'setAuthMode',
        'clearAuthToken',
        'addRequestInterceptor',
        'addResponseInterceptor',
        'addErrorInterceptor',
        'clearCache',
        'getConfig',
    ].includes(methodName);
}

function createAppSdkClientProxy<T extends object>(target: T, path: string[] = []): T {
    if (proxiedClients.has(target)) {
        return proxiedClients.get(target) as T;
    }

    const proxy = new Proxy(target, {
        get(obj, prop, receiver) {
            const value = Reflect.get(obj, prop, receiver);

            if (typeof value === 'function') {
                const bound = value.bind(obj);
                if (!shouldWrapAppSdkMethod(path, String(prop))) {
                    return bound;
                }
                return (...args: unknown[]) => runWithAppSdkAuthRecovery(
                    () => Promise.resolve(bound(...args))
                );
            }

            if (value && typeof value === 'object') {
                return createAppSdkClientProxy(value as object, [...path, String(prop)]);
            }

            return value;
        },
    });

    proxiedClients.set(target, proxy);
    return proxy as T;
}
