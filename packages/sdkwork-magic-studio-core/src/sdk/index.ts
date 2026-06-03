export * from './hooks';
export * from './appSdkEnv';
export * from './pointsAccountBalance';
export * from './promptLibraryService';
export * from './uploadViaPresignedUrl';
export {
    createRuntimeMagicStudioServerClient,
    isMagicStudioServerRuntimeSupported,
    readDefaultPlatformRuntime,
    resolveRuntimeMagicStudioServerHostDescriptor,
} from '../platform/toolkit/magicStudioServerRuntime';
export {
    assertRuntimeMagicStudioExecutionOperationReady,
} from '../platform/toolkit/magicStudioServerCapabilities';

import {
    type SdkworkAppConfig,
} from '@sdkwork/app-sdk';
import {
    type AppSdkClient,
    createAppSdkClientConfig,
    getAppSdkClientConfig,
    getAppSdkClientWithSession,
    initAppSdkClient,
    resetAppSdkClient,
    type AppRuntimeEnv,
} from './useAppSdkClient';

export type SdkworkConfig = SdkworkAppConfig;
export type SdkworkClient = AppSdkClient;
export type SdkworkClientInstance = SdkworkClient;
export type AuthModule = SdkworkClient['auth'];

export type GenerationModule = SdkworkClient['generation'];
export type UserModule = SdkworkClient['user'];
export type AssetsModule = SdkworkClient['assets'];
export type ChatModule = SdkworkClient['chat'];
export type ProjectModule = SdkworkClient['projects'];
export type HistoryModule = SdkworkClient['history'];
export type UploadModule = SdkworkClient['upload'];
export type PaymentModule = SdkworkClient['payments'];
export type VipModule = SdkworkClient['vip'];
export type OrderModule = SdkworkClient['orders'];
export type CartModule = SdkworkClient['cart'];
export type CouponModule = SdkworkClient['coupons'];
export type FavoriteModule = SdkworkClient['favorite'];
export type SocialModule = SdkworkClient['social'];
export type NotificationModule = SdkworkClient['notification'];
export type SettingsModule = SdkworkClient['settings'];
export type SearchModule = SdkworkClient['search'];
export type ModelModule = SdkworkClient['model'];
export type PromptModule = SdkworkClient['prompt'];
export type FeedbackModule = SdkworkClient['feedback'];
export type WorkspaceModule = SdkworkClient['workspaces'];
export type AnalyticsModule = SdkworkClient['analytics'];
export type CategoryModule = SdkworkClient['category'];

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

export function isDevelopment(env: Environment | EnvironmentConfig = createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'development';
}

export function isProduction(env: Environment | EnvironmentConfig = createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'production';
}

export function isStaging(env: Environment | EnvironmentConfig = createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'staging';
}

export function isTest(env: Environment | EnvironmentConfig = createEnvConfig()): boolean {
    const value = typeof env === 'string' ? env : env.env;
    return value === 'test';
}

function toSdkworkConfig(config: SdkworkConfig | EnvironmentConfig): SdkworkConfig {
    return {
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
}

export function initSdkworkClient(config: SdkworkConfig | EnvironmentConfig): SdkworkClient {
    const sdkConfig = toSdkworkConfig(config);

    if (!validateConfig(sdkConfig)) {
        throw new Error('[SDK] Invalid config: baseUrl is required.');
    }

    return initAppSdkClient(sdkConfig);
}

export function initSdkworkFromEnv(overrides?: Partial<EnvironmentConfig>): SdkworkClient {
    const config = loadEnvironmentConfig(overrides);
    return initSdkworkClient(config);
}

export function getSdkworkClient(): SdkworkClient {
    return getAppSdkClientWithSession();
}

export function hasSdkworkClient(): boolean {
    return getAppSdkClientConfig() !== null;
}

export function getEnvironmentConfig(): EnvironmentConfig | null {
    const config = getAppSdkClientConfig();
    if (!config) {
        return null;
    }

    return createEnvConfig(config as Partial<EnvironmentConfig>);
}

export function resetSdkworkClient(): void {
    resetAppSdkClient();
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
        return getSdkworkClient().prompt;
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
    createAppSdkClientConfig,
    createScopedAppSdkClient,
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
    AppSdkClient,
    AppRuntimeEnv,
    AppSdkClientConfig,
    AppSdkSessionTokens,
    AppSdkCoverPromptSuggestionsRequest,
    AppSdkCoverPromptSuggestionsResponse,
    AppSdkGenerationModule,
} from './useAppSdkClient';
