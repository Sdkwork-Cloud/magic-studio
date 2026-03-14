export * from './hooks';
export * from './uploadViaPresignedUrl';

import {
    SdkworkAppClient,
    type SdkworkAppConfig,
    type GenerationApi,
    type AssetsApi,
    type ChatApi,
    type HistoryApi,
    type UploadApi,
    type VipApi,
    type CartApi,
    type FavoriteApi,
    type SocialApi,
    type NotificationApi,
    type SettingsApi,
    type SearchApi,
    type FeedbackApi,
    type AnalyticsApi,
    type CategoryApi,
    type UserApi,
    type ProjectsApi,
    type PaymentsApi,
    type OrdersApi,
    type CouponsApi,
    type ModelApi,
    type WorkspacesApi,
    type AuthApi,
} from '@sdkwork/app-sdk';
import {
    createAppSdkClientConfig,
    getAppSdkClientConfig,
    getAppSdkClientWithSession,
    initAppSdkClient,
    resetAppSdkClient,
    type AppRuntimeEnv,
} from './useAppSdkClient';

export type SdkworkConfig = SdkworkAppConfig;
export type SdkworkClient = SdkworkAppClient;
export type SdkworkClientInstance = SdkworkClient;
export type AuthModule = AuthApi;

export type GenerationModule = GenerationApi;
export type UserModule = UserApi;
export type AssetsModule = AssetsApi;
export type ChatModule = ChatApi;
export type ProjectModule = ProjectsApi;
export type HistoryModule = HistoryApi;
export type UploadModule = UploadApi;
export type PaymentModule = PaymentsApi;
export type VipModule = VipApi;
export type OrderModule = OrdersApi;
export type CartModule = CartApi;
export type CouponModule = CouponsApi;
export type FavoriteModule = FavoriteApi;
export type SocialModule = SocialApi;
export type NotificationModule = NotificationApi;
export type SettingsModule = SettingsApi;
export type SearchModule = SearchApi;
export type ModelModule = ModelApi;
export type PromptModule = GenerationApi;
export type FeedbackModule = FeedbackApi;
export type WorkspaceModule = WorkspacesApi;
export type AnalyticsModule = AnalyticsApi;
export type CategoryModule = CategoryApi;

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig extends SdkworkConfig {
    env: Environment;
}

export function createEnvConfig(overrides: Partial<EnvironmentConfig> = {}): EnvironmentConfig {
    const { env, ...sdkOverrides } = overrides;
    const appConfig = createAppSdkClientConfig(sdkOverrides as Partial<SdkworkAppConfig>);
    const resolvedEnv = (env || appConfig.env) as AppRuntimeEnv;
    return {
        ...appConfig,
        env: resolvedEnv as Environment,
    };
}

export function loadEnvironmentConfig(overrides?: Partial<EnvironmentConfig>): EnvironmentConfig {
    return createEnvConfig(overrides);
}

export function validateConfig(config: Partial<SdkworkConfig>): config is SdkworkConfig {
    return Boolean(config.baseUrl && String(config.baseUrl).trim().length > 0);
}

export function isDevelopment(env: Environment | EnvironmentConfig = _envConfig || createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'development';
}

export function isProduction(env: Environment | EnvironmentConfig = _envConfig || createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'production';
}

export function isStaging(env: Environment | EnvironmentConfig = _envConfig || createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'staging';
}

export function isTest(env: Environment | EnvironmentConfig = _envConfig || createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'test';
}

let _client: SdkworkClient | null = null;
let _envConfig: EnvironmentConfig | null = null;

export function initSdkworkClient(config: SdkworkConfig | EnvironmentConfig): SdkworkClient {
    const sdkConfig: SdkworkConfig = {
        baseUrl: config.baseUrl,
        timeout: config.timeout,
        apiKey: config.apiKey,
        authToken: config.authToken,
        accessToken: config.accessToken,
        tenantId: config.tenantId,
        organizationId: config.organizationId,
        platform: config.platform,
        tokenManager: config.tokenManager,
        authMode: config.authMode,
        headers: config.headers,
    };

    if (!validateConfig(sdkConfig)) {
        throw new Error('[SDK] Invalid config: baseUrl is required.');
    }

    _client = initAppSdkClient(sdkConfig);
    _envConfig = createEnvConfig(config as Partial<EnvironmentConfig>);
    return getSdkworkClient();
}

export function initSdkworkFromEnv(overrides?: Partial<EnvironmentConfig>): SdkworkClient {
    const config = loadEnvironmentConfig(overrides);
    return initSdkworkClient(config);
}

export function getSdkworkClient(): SdkworkClient {
    if (!_client && !getAppSdkClientConfig()) {
        const envConfig = createEnvConfig();
        _client = initAppSdkClient(envConfig);
        _envConfig = envConfig;
    }
    _client = getAppSdkClientWithSession();
    return _client;
}

export function hasSdkworkClient(): boolean {
    return _client !== null || getAppSdkClientConfig() !== null;
}

export function getEnvironmentConfig(): EnvironmentConfig | null {
    return _envConfig;
}

export function resetSdkworkClient(): void {
    resetAppSdkClient();
    _client = null;
    _envConfig = null;
}

export const sdk = {
    get client(): SdkworkClient {
        return getSdkworkClient();
    },
    get generation(): GenerationModule {
        return getSdkworkClient().generation;
    },
    get auth(): AuthModule {
        return getSdkworkClient().auth;
    },
    get user(): UserModule {
        return getSdkworkClient().user;
    },
    get assets(): AssetsModule {
        return getSdkworkClient().assets;
    },
    get chat(): ChatModule {
        return getSdkworkClient().chat;
    },
    get project(): ProjectModule {
        return getSdkworkClient().projects;
    },
    get history(): HistoryModule {
        return getSdkworkClient().history;
    },
    get upload(): UploadModule {
        return getSdkworkClient().upload;
    },
    get payment(): PaymentModule {
        return getSdkworkClient().payments;
    },
    get vip(): VipModule {
        return getSdkworkClient().vip;
    },
    get order(): OrderModule {
        return getSdkworkClient().orders;
    },
    get cart(): CartModule {
        return getSdkworkClient().cart;
    },
    get coupon(): CouponModule {
        return getSdkworkClient().coupons;
    },
    get favorite(): FavoriteModule {
        return getSdkworkClient().favorite;
    },
    get social(): SocialModule {
        return getSdkworkClient().social;
    },
    get notification(): NotificationModule {
        return getSdkworkClient().notification;
    },
    get settings(): SettingsModule {
        return getSdkworkClient().settings;
    },
    get search(): SearchModule {
        return getSdkworkClient().search;
    },
    get model(): ModelModule {
        return getSdkworkClient().model;
    },
    get prompt(): PromptModule {
        return getSdkworkClient().generation;
    },
    get feedback(): FeedbackModule {
        return getSdkworkClient().feedback;
    },
    get workspace(): WorkspaceModule {
        return getSdkworkClient().workspaces;
    },
    get analytics(): AnalyticsModule {
        return getSdkworkClient().analytics;
    },
    get category(): CategoryModule {
        return getSdkworkClient().category;
    },
};

export {
    APP_SDK_AUTH_TOKEN_STORAGE_KEY,
    APP_SDK_ACCESS_TOKEN_STORAGE_KEY,
    APP_SDK_REFRESH_TOKEN_STORAGE_KEY,
    createAppSdkClientConfig,
    initAppSdkClient,
    getAppSdkClient,
    getAppSdkClientConfig,
    resolveAppSdkAccessToken,
    resetAppSdkClient,
    applyAppSdkSessionTokens,
    readAppSdkSessionTokens,
    persistAppSdkSessionTokens,
    clearAppSdkSessionTokens,
    getAppSdkClientWithSession,
} from './useAppSdkClient';
export type {
    AppRuntimeEnv,
    AppSdkClientConfig,
    AppSdkSessionTokens,
} from './useAppSdkClient';
