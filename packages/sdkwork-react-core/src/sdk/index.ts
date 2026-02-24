export * from './hooks';

import { 
    SdkworkClient,
    createClient,
    type SdkworkConfig,
    type HttpClient,
    type GenerationModule,
    type AuthModule,
    type UserModule,
    type AssetModule,
    type ChatModule,
    type ProjectModule,
    type HistoryModule,
    type UploadModule,
    type PaymentModule,
    type VipModule,
    type OrderModule,
    type CartModule,
    type CouponModule,
    type FavoriteModule,
    type SocialModule,
    type NotificationModule,
    type SettingsModule,
    type SearchModule,
    type ModelModule,
    type PromptModule,
    type FeedbackModule,
    type WorkspaceModule,
    type AnalyticsModule,
    type CategoryModule,
    type AddressModule,
    loadEnvironmentConfig,
    createEnvConfig,
    validateConfig,
    isDevelopment,
    isProduction,
    isStaging,
    isTest,
    type Environment,
    type EnvironmentConfig,
} from '@sdkwork/app-sdk';

export type {
    SdkworkConfig,
    HttpClient,
    GenerationModule,
    AuthModule,
    UserModule,
    AssetModule,
    ChatModule,
    ProjectModule,
    HistoryModule,
    UploadModule,
    PaymentModule,
    VipModule,
    OrderModule,
    CartModule,
    CouponModule,
    FavoriteModule,
    SocialModule,
    NotificationModule,
    SettingsModule,
    SearchModule,
    ModelModule,
    PromptModule,
    FeedbackModule,
    WorkspaceModule,
    AnalyticsModule,
    CategoryModule,
    AddressModule,
    Environment,
    EnvironmentConfig,
};

export { 
    SdkworkClient, 
    createClient,
    loadEnvironmentConfig,
    createEnvConfig,
    validateConfig,
    isDevelopment,
    isProduction,
    isStaging,
    isTest,
};

export type SdkworkClientInstance = SdkworkClient;

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
    };
    
    _client = createClient(sdkConfig);
    _envConfig = config as EnvironmentConfig;
    return _client;
}

export function initSdkworkFromEnv(overrides?: Partial<EnvironmentConfig>): SdkworkClient {
    const config = loadEnvironmentConfig(overrides);
    return initSdkworkClient(config);
}

export function getSdkworkClient(): SdkworkClient {
    if (!_client) {
        throw new Error('[SDK] Client not initialized. Call initSdkworkClient() or initSdkworkFromEnv() first.');
    }
    return _client;
}

export function hasSdkworkClient(): boolean {
    return _client !== null;
}

export function getEnvironmentConfig(): EnvironmentConfig | null {
    return _envConfig;
}

export function resetSdkworkClient(): void {
    _client = null;
    _envConfig = null;
}

export const sdk = {
    get client() {
        return getSdkworkClient();
    },
    get generation() {
        return getSdkworkClient().generation;
    },
    get auth() {
        return getSdkworkClient().auth;
    },
    get user() {
        return getSdkworkClient().user;
    },
    get assets() {
        return getSdkworkClient().assets;
    },
    get chat() {
        return getSdkworkClient().chat;
    },
    get project() {
        return getSdkworkClient().project;
    },
    get history() {
        return getSdkworkClient().history;
    },
    get upload() {
        return getSdkworkClient().upload;
    },
    get payment() {
        return getSdkworkClient().payment;
    },
    get vip() {
        return getSdkworkClient().vip;
    },
    get order() {
        return getSdkworkClient().order;
    },
    get cart() {
        return getSdkworkClient().cart;
    },
    get coupon() {
        return getSdkworkClient().coupon;
    },
    get favorite() {
        return getSdkworkClient().favorite;
    },
    get social() {
        return getSdkworkClient().social;
    },
    get notification() {
        return getSdkworkClient().notification;
    },
    get settings() {
        return getSdkworkClient().settings;
    },
    get search() {
        return getSdkworkClient().search;
    },
    get model() {
        return getSdkworkClient().model;
    },
    get prompt() {
        return getSdkworkClient().prompt;
    },
    get feedback() {
        return getSdkworkClient().feedback;
    },
    get workspace() {
        return getSdkworkClient().workspace;
    },
    get analytics() {
        return getSdkworkClient().analytics;
    },
    get category() {
        return getSdkworkClient().category;
    },
    get address() {
        return getSdkworkClient().address;
    },
};
