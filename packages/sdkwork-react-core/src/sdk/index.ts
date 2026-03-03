export * from './hooks';

import {
    SdkworkAppClient,
    createClient,
    type SdkworkAppConfig,
    type HttpClient,
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
    type AddressApi,
    type ProfileApi,
    type ProjectsApi,
    type PaymentsApi,
    type OrdersApi,
    type CouponsApi,
    type ModelsApi,
    type WorkspacesApi,
    type LoginVO,
    type UserInfoVO,
    type LoginForm,
    type RegisterForm,
    type TokenRefreshForm,
    type VerifyCodeSendForm,
    type VerifyCodeCheckForm,
    type PasswordResetForm,
    type PasswordResetRequestForm,
    type PhoneLoginForm,
    type VerifyResultVO,
} from '@sdkwork/app-sdk';

type ApiEnvelope<T> = {
    data?: T;
    code?: string | number;
    msg?: string;
    message?: string;
};

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
        const envelope = payload as ApiEnvelope<T>;
        if (envelope.data !== undefined) {
            return envelope.data;
        }
    }
    return payload as T;
}

function mapLegacySmsType(type?: 'login' | 'register' | 'reset'): VerifyCodeSendForm['type'] {
    if (type === 'register') {
        return 'REGISTER';
    }
    if (type === 'reset') {
        return 'RESET_PASSWORD';
    }
    return 'LOGIN';
}

export type SdkworkConfig = SdkworkAppConfig;
export type SdkworkClient = SdkworkAppClient;
export type SdkworkClientInstance = SdkworkClient;

export type LoginRequest = LoginForm;
export type RegisterRequest = RegisterForm;
export type UserInfo = UserInfoVO;

export interface AuthModule {
    login: (body: LoginRequest) => Promise<LoginVO>;
    logout: () => Promise<void>;
    register: (body: RegisterRequest) => Promise<UserInfo>;
    refreshToken: (body: TokenRefreshForm) => Promise<LoginVO>;
    sendSmsCode: (body: { phone: string; type?: 'login' | 'register' | 'reset' }) => Promise<void>;
    verifySmsCode: (body: { phone: string; code: string }) => Promise<boolean>;
    resetPassword: (body: { email: string } | PasswordResetForm) => Promise<void>;
    phoneLogin?: (body: PhoneLoginForm) => Promise<LoginVO>;
    requestPasswordResetChallenge?: (body: PasswordResetRequestForm) => Promise<void>;
}

export type GenerationModule = GenerationApi;
export type UserModule = ProfileApi;
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
export type ModelModule = ModelsApi;
export type PromptModule = GenerationApi;
export type FeedbackModule = FeedbackApi;
export type WorkspaceModule = WorkspacesApi;
export type AnalyticsModule = AnalyticsApi;
export type CategoryModule = CategoryApi;
export type AddressModule = AddressApi;

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig extends SdkworkConfig {
    env: Environment;
}

const DEFAULT_BASE_URL = 'http://localhost:8080';
const DEFAULT_TIMEOUT = 30000;

function readEnvVar(name: string): string | undefined {
    const importMetaEnv = (import.meta as ImportMeta & {
        env?: Record<string, string | undefined>;
    }).env;
    if (importMetaEnv && name in importMetaEnv) {
        return importMetaEnv[name];
    }
    return undefined;
}

function resolveEnvironment(value?: string): Environment {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'production' || normalized === 'prod') {
        return 'production';
    }
    if (normalized === 'staging' || normalized === 'stage') {
        return 'staging';
    }
    if (normalized === 'test') {
        return 'test';
    }
    return 'development';
}

function parseTimeout(value: string | undefined): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_TIMEOUT;
    }
    return parsed;
}

export function createEnvConfig(overrides: Partial<EnvironmentConfig> = {}): EnvironmentConfig {
    const env = resolveEnvironment(
        overrides.env ||
        readEnvVar('VITE_APP_ENV') ||
        readEnvVar('NODE_ENV')
    );

    const baseUrl =
        overrides.baseUrl ||
        readEnvVar('VITE_API_BASE_URL') ||
        readEnvVar('VITE_APP_BASE_URL') ||
        DEFAULT_BASE_URL;

    const timeout = overrides.timeout ?? parseTimeout(readEnvVar('VITE_TIMEOUT'));

    return {
        env,
        baseUrl,
        timeout,
        apiKey: overrides.apiKey ?? readEnvVar('VITE_API_KEY'),
        authToken: overrides.authToken ?? readEnvVar('VITE_AUTH_TOKEN'),
        accessToken: overrides.accessToken ?? readEnvVar('VITE_ACCESS_TOKEN'),
        tenantId: overrides.tenantId ?? readEnvVar('VITE_TENANT_ID'),
        organizationId: overrides.organizationId ?? readEnvVar('VITE_ORGANIZATION_ID'),
        platform: overrides.platform ?? readEnvVar('VITE_PLATFORM'),
        tokenManager: overrides.tokenManager,
        authMode: overrides.authMode,
        headers: overrides.headers,
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

function createAuthCompatModule(client: SdkworkClient): AuthModule {
    return {
        async login(body: LoginRequest): Promise<LoginVO> {
            const response = await client.login.login(body);
            return unwrapApiData<LoginVO>(response);
        },

        async logout(): Promise<void> {
            await client.logout.logout();
        },

        async register(body: RegisterRequest): Promise<UserInfo> {
            const response = await client.register.register({
                ...body,
                confirmPassword: body.confirmPassword || body.password,
            });
            return unwrapApiData<UserInfo>(response);
        },

        async refreshToken(body: TokenRefreshForm): Promise<LoginVO> {
            const response = await client.refresh.token(body);
            return unwrapApiData<LoginVO>(response);
        },

        async sendSmsCode(body: { phone: string; type?: 'login' | 'register' | 'reset' }): Promise<void> {
            const request: VerifyCodeSendForm = {
                target: body.phone,
                type: mapLegacySmsType(body.type),
                verifyType: 'PHONE',
            };
            await client.sms.sendSmsCode(request);
        },

        async verifySmsCode(body: { phone: string; code: string }): Promise<boolean> {
            const request: VerifyCodeCheckForm = {
                target: body.phone,
                type: 'LOGIN',
                verifyType: 'PHONE',
                code: body.code,
            };
            const response = await client.sms.verifySmsCode(request);
            const result = unwrapApiData<VerifyResultVO>(response);
            return Boolean(result?.valid);
        },

        async resetPassword(body: { email: string } | PasswordResetForm): Promise<void> {
            if ('email' in body) {
                await client.auth.requestPasswordResetChallenge({
                    account: body.email,
                    channel: 'EMAIL',
                });
                return;
            }
            await client.password.reset(body);
        },

        async phoneLogin(body: PhoneLoginForm): Promise<LoginVO> {
            const response = await client.phone.login(body);
            return unwrapApiData<LoginVO>(response);
        },

        async requestPasswordResetChallenge(body: PasswordResetRequestForm): Promise<void> {
            await client.auth.requestPasswordResetChallenge(body);
        },
    };
}

let _client: SdkworkClient | null = null;
let _envConfig: EnvironmentConfig | null = null;
let _authCompatModule: AuthModule | null = null;

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

    _client = createClient(sdkConfig);
    _authCompatModule = null;
    _envConfig = (config as EnvironmentConfig).env
        ? (config as EnvironmentConfig)
        : null;
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
    _authCompatModule = null;
}

export const sdk = {
    get client(): SdkworkClient {
        return getSdkworkClient();
    },
    get generation(): GenerationModule {
        return getSdkworkClient().generation;
    },
    get auth(): AuthModule {
        if (!_authCompatModule) {
            _authCompatModule = createAuthCompatModule(getSdkworkClient());
        }
        return _authCompatModule;
    },
    get user(): UserModule {
        return getSdkworkClient().profile;
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
        return getSdkworkClient().models;
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
    get address(): AddressModule {
        return getSdkworkClient().address;
    },
};

export type { HttpClient };
