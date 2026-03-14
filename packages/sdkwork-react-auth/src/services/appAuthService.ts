import type {
    PasswordResetForm,
    PasswordResetRequestForm,
    PhoneLoginForm,
    LoginForm,
    LoginVO,
    QrCodeStatusVO,
    QrCodeVO,
    RegisterForm,
    TokenRefreshForm,
    UserInfoVO,
    UserProfileVO,
    VerifyCodeCheckForm,
    VerifyCodeSendForm,
    VerifyResultVO,
} from '@sdkwork/app-sdk';
import {
    applyAppSdkSessionTokens,
    clearAppSdkSessionTokens,
    getAppSdkClientWithSession,
    persistAppSdkSessionTokens,
    readAppSdkSessionTokens,
    resolveAppSdkAccessToken,
} from './useAppSdkClient';

export type AppAuthVerifyType = 'EMAIL' | 'PHONE';
export type AppAuthScene = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';

export interface AppAuthLoginInput {
    username: string;
    password: string;
    remember?: boolean;
}

export interface AppAuthRegisterInput {
    username: string;
    password: string;
    confirmPassword?: string;
    email?: string;
    phone?: string;
    name?: string;
    verificationCode?: string;
}

export interface AppAuthSendVerifyCodeInput {
    target: string;
    verifyType: AppAuthVerifyType;
    scene: AppAuthScene;
}

export interface AppAuthVerifyCodeInput extends AppAuthSendVerifyCodeInput {
    code: string;
}

export interface AppAuthPhoneLoginInput {
    phone: string;
    code: string;
}

export type AppAuthPasswordResetChannel = 'EMAIL' | 'SMS';

export interface AppAuthPasswordResetRequestInput {
    account: string;
    channel: AppAuthPasswordResetChannel;
}

export interface AppAuthPasswordResetInput {
    account: string;
    code: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface AppAuthQrCodePayload {
    qrKey: string;
    qrUrl?: string;
    qrContent?: string;
    expireTime?: number;
}

export type AppAuthQrCodeStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';

export interface AppAuthQrStatusResult {
    status: AppAuthQrCodeStatus;
    session?: AppAuthSession;
}

export interface AppAuthSession {
    userId: string;
    username: string;
    displayName: string;
    authToken: string;
    accessToken: string;
    refreshToken?: string;
}

export interface IAppAuthService {
    login(input: AppAuthLoginInput): Promise<AppAuthSession>;
    loginWithPhone(input: AppAuthPhoneLoginInput): Promise<AppAuthSession>;
    register(input: AppAuthRegisterInput): Promise<AppAuthSession>;
    logout(): Promise<void>;
    refreshToken(refreshToken?: string): Promise<AppAuthSession>;
    sendVerifyCode(input: AppAuthSendVerifyCodeInput): Promise<void>;
    verifyCode(input: AppAuthVerifyCodeInput): Promise<boolean>;
    requestPasswordReset(input: AppAuthPasswordResetRequestInput): Promise<void>;
    resetPassword(input: AppAuthPasswordResetInput): Promise<void>;
    generateQrCode(): Promise<AppAuthQrCodePayload>;
    checkQrCodeStatus(qrKey: string): Promise<AppAuthQrStatusResult>;
    getCurrentSession(): Promise<AppAuthSession | null>;
}

interface ApiEnvelope<T> {
    code?: string | number;
    data?: T;
    msg?: string;
    message?: string;
}

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
        const envelope = payload as ApiEnvelope<T>;
        if (envelope.data !== undefined) {
            return envelope.data;
        }
    }
    return payload as T;
}

function mapScene(scene: AppAuthScene): VerifyCodeSendForm['type'] {
    if (scene === 'REGISTER') return 'REGISTER';
    if (scene === 'RESET_PASSWORD') return 'RESET_PASSWORD';
    return 'LOGIN';
}

function mapVerifyType(type: AppAuthVerifyType): VerifyCodeSendForm['verifyType'] {
    return type === 'EMAIL' ? 'EMAIL' : 'PHONE';
}

function mapQrStatus(status?: QrCodeStatusVO['status']): AppAuthQrCodeStatus {
    if (status === 'scanned' || status === 'confirmed' || status === 'expired') {
        return status;
    }
    return 'pending';
}

function readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function readId(value: unknown): string {
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'string') {
        return value.trim();
    }
    return '';
}

function mapUserSessionFields(
    profile: UserInfoVO | UserProfileVO | undefined,
    usernameHint: string
): Pick<AppAuthSession, 'userId' | 'username' | 'displayName'> {
    const raw = (profile || {}) as Record<string, unknown>;
    const userId = readId(raw.id);
    const username = readString(raw.username) || usernameHint || readString(raw.email) || userId;
    const displayName = readString(raw.nickname) || username || userId;
    return {
        userId: userId || username,
        username,
        displayName: displayName || username,
    };
}

async function resolveProfileOrFallback(
    usernameHint: string,
    loginUserInfo?: UserInfoVO
): Promise<Pick<AppAuthSession, 'userId' | 'username' | 'displayName'>> {
    if (loginUserInfo) {
        return mapUserSessionFields(loginUserInfo, usernameHint);
    }
    try {
        const client = getAppSdkClientWithSession();
        const profileResponse = await client.user.getUserProfile();
        const profile = unwrapApiData<UserProfileVO>(profileResponse);
        return mapUserSessionFields(profile, usernameHint);
    } catch {
        return mapUserSessionFields(undefined, usernameHint);
    }
}

function mapSessionFromLoginVO(
    loginData: LoginVO,
    userFields: Pick<AppAuthSession, 'userId' | 'username' | 'displayName'>
): AppAuthSession {
    const authToken = (((loginData as LoginVO & { authToken?: string })?.authToken) || '').trim();
    if (!authToken) {
        throw new Error('Auth token is missing');
    }
    return {
        ...userFields,
        authToken,
        accessToken: resolveAppSdkAccessToken(),
        refreshToken: (loginData.refreshToken || '').trim() || undefined,
    };
}

function persistAndBindSession(session: AppAuthSession): void {
    persistAppSdkSessionTokens({
        authToken: session.authToken,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
    });
    applyAppSdkSessionTokens({
        authToken: session.authToken,
        accessToken: session.accessToken,
    });
}

export const appAuthService: IAppAuthService = {
    async login(input: AppAuthLoginInput): Promise<AppAuthSession> {
        const client = getAppSdkClientWithSession();
        const request: LoginForm = {
            username: input.username,
            password: input.password,
        };
        const response = await client.auth.login(request);
        const loginData = unwrapApiData<LoginVO>(response);
        const userFields = await resolveProfileOrFallback(input.username, loginData.userInfo);
        const session = mapSessionFromLoginVO(loginData, userFields);
        persistAndBindSession(session);
        return session;
    },

    async loginWithPhone(input: AppAuthPhoneLoginInput): Promise<AppAuthSession> {
        const client = getAppSdkClientWithSession();
        const request: PhoneLoginForm = {
            phone: input.phone,
            code: input.code,
        };
        const response = await client.auth.phoneLogin(request);
        const loginData = unwrapApiData<LoginVO>(response);
        const userFields = await resolveProfileOrFallback(input.phone, loginData.userInfo);
        const session = mapSessionFromLoginVO(loginData, userFields);
        persistAndBindSession(session);
        return session;
    },

    async register(input: AppAuthRegisterInput): Promise<AppAuthSession> {
        if (input.verificationCode && (input.phone || input.email)) {
            const verifyResult = await this.verifyCode({
                target: (input.phone || input.email || '').trim(),
                verifyType: input.phone ? 'PHONE' : 'EMAIL',
                scene: 'REGISTER',
                code: input.verificationCode,
            });
            if (!verifyResult) {
                throw new Error('Verification code is invalid');
            }
        }

        const client = getAppSdkClientWithSession();
        const request: RegisterForm = {
            username: input.username,
            password: input.password,
            confirmPassword: input.confirmPassword || input.password,
            email: input.email,
            phone: input.phone,
        };
        await client.auth.register(request);

        return this.login({
            username: input.username,
            password: input.password,
        });
    },

    async logout(): Promise<void> {
        const client = getAppSdkClientWithSession();
        try {
            await client.auth.logout();
        } finally {
            clearAppSdkSessionTokens();
        }
    },

    async refreshToken(refreshToken?: string): Promise<AppAuthSession> {
        const client = getAppSdkClientWithSession();
        const currentTokens = readAppSdkSessionTokens();
        const nextRefreshToken = (refreshToken || currentTokens.refreshToken || '').trim();
        if (!nextRefreshToken) {
            throw new Error('Refresh token is required');
        }

        const request: TokenRefreshForm = { refreshToken: nextRefreshToken };
        const response = await client.auth.refreshToken(request);
        const loginData = unwrapApiData<LoginVO>(response);
        const currentSession = await this.getCurrentSession();
        const userFields = currentSession
            ? {
                userId: currentSession.userId,
                username: currentSession.username,
                displayName: currentSession.displayName,
            }
            : await resolveProfileOrFallback('');
        const session = mapSessionFromLoginVO(loginData, userFields);
        persistAndBindSession({
            ...session,
            refreshToken: session.refreshToken || nextRefreshToken,
        });
        return {
            ...session,
            refreshToken: session.refreshToken || nextRefreshToken,
        };
    },

    async sendVerifyCode(input: AppAuthSendVerifyCodeInput): Promise<void> {
        const client = getAppSdkClientWithSession();
        const request: VerifyCodeSendForm = {
            target: input.target,
            type: mapScene(input.scene),
            verifyType: mapVerifyType(input.verifyType),
        };
        await client.auth.sendSmsCode(request);
    },

    async verifyCode(input: AppAuthVerifyCodeInput): Promise<boolean> {
        const client = getAppSdkClientWithSession();
        const request: VerifyCodeCheckForm = {
            target: input.target,
            type: mapScene(input.scene),
            verifyType: mapVerifyType(input.verifyType),
            code: input.code,
        };
        const response = await client.auth.verifySmsCode(request);
        const data = unwrapApiData<VerifyResultVO>(response);
        return Boolean(data?.valid);
    },

    async requestPasswordReset(input: AppAuthPasswordResetRequestInput): Promise<void> {
        const client = getAppSdkClientWithSession();
        const request: PasswordResetRequestForm = {
            account: input.account,
            channel: input.channel,
        };
        await client.auth.requestPasswordResetChallenge(request);
    },

    async resetPassword(input: AppAuthPasswordResetInput): Promise<void> {
        const client = getAppSdkClientWithSession();
        const request: PasswordResetForm = {
            account: input.account,
            code: input.code,
            newPassword: input.newPassword,
            confirmPassword: input.confirmPassword || input.newPassword,
        };
        await client.auth.resetPassword(request);
    },

    async generateQrCode(): Promise<AppAuthQrCodePayload> {
        const client = getAppSdkClientWithSession();
        const response = await client.auth.generateQrCode();
        const qrData = unwrapApiData<QrCodeVO>(response);
        const qrKey = readString(qrData?.qrKey);
        if (!qrKey) {
            throw new Error('QR code key is missing');
        }

        return {
            qrKey,
            qrUrl: readString(qrData?.qrUrl) || undefined,
            qrContent: readString(qrData?.qrContent) || undefined,
            expireTime: typeof qrData?.expireTime === 'number' ? qrData.expireTime : undefined,
        };
    },

    async checkQrCodeStatus(qrKey: string): Promise<AppAuthQrStatusResult> {
        const client = getAppSdkClientWithSession();
        const response = await client.auth.checkQrCodeStatus(qrKey);
        const qrStatus = unwrapApiData<QrCodeStatusVO>(response);
        const status = mapQrStatus(qrStatus?.status);

        if (status !== 'confirmed' || !qrStatus?.token) {
            return { status };
        }

        const loginData = qrStatus.token;
        const userFields = await resolveProfileOrFallback('', qrStatus.userInfo || loginData.userInfo);
        const session = mapSessionFromLoginVO(loginData, userFields);
        persistAndBindSession(session);
        return {
            status,
            session,
        };
    },

    async getCurrentSession(): Promise<AppAuthSession | null> {
        const tokens = readAppSdkSessionTokens();
        const authToken = (tokens.authToken || '').trim();
        if (!authToken) {
            return null;
        }

        try {
            const client = getAppSdkClientWithSession();
            const profileResponse = await client.user.getUserProfile();
            const profile = unwrapApiData<UserProfileVO>(profileResponse);
            const userFields = mapUserSessionFields(profile, '');
            return {
                ...userFields,
                authToken,
                accessToken: resolveAppSdkAccessToken(),
                refreshToken: tokens.refreshToken,
            };
        } catch {
            return null;
        }
    },
};
