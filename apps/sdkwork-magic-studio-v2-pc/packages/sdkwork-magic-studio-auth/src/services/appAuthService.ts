import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  clearAppSdkSessionTokens,
  persistAppSdkSessionTokens,
  readAppSdkSessionTokens,
} from '@sdkwork/magic-studio-core/sdk';
import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import {
  resolveAuthDeviceType,
  type AuthDeviceType,
} from '../runtime/authDeviceType.ts';

export type AppAuthVerifyType = 'EMAIL' | 'PHONE';
export type AppAuthScene = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD' | 'BIND_EMAIL' | 'BIND_PHONE';
export type AppAuthPasswordResetChannel = 'EMAIL' | 'SMS';
export type AppAuthQrCodeStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';

export interface AppAuthLoginInput {
  deviceType?: AuthDeviceType;
  password: string;
  remember?: boolean;
  username: string;
}

export interface AppAuthRegisterInput {
  confirmPassword?: string;
  email?: string;
  name?: string;
  password: string;
  phone?: string;
  username: string;
  verificationCode?: string;
}

export interface AppAuthSendVerifyCodeInput {
  scene: AppAuthScene;
  target: string;
  verifyType: AppAuthVerifyType;
}

export interface AppAuthVerifyCodeInput extends AppAuthSendVerifyCodeInput {
  code: string;
}

export interface AppAuthPhoneLoginInput {
  code: string;
  deviceType?: AuthDeviceType;
  phone: string;
}

export interface AppAuthPasswordResetRequestInput {
  account: string;
  channel: AppAuthPasswordResetChannel;
}

export interface AppAuthPasswordResetInput {
  account: string;
  code: string;
  confirmPassword?: string;
  newPassword: string;
}

export interface AppAuthQrCodePayload {
  expireTime?: number;
  qrContent?: string;
  qrKey: string;
  qrUrl?: string;
}

export interface AppAuthSession {
  accessToken: string;
  authToken: string;
  avatar?: string;
  avatarUrl?: string;
  displayName: string;
  email?: string;
  phone?: string;
  refreshToken?: string;
  userId: string;
  username: string;
}

export interface AppAuthQrStatusResult {
  session?: AppAuthSession;
  status: AppAuthQrCodeStatus;
}

export interface IAppAuthService {
  checkQrCodeStatus(qrKey: string): Promise<AppAuthQrStatusResult>;
  generateQrCode(): Promise<AppAuthQrCodePayload>;
  getCurrentSession(): Promise<AppAuthSession | null>;
  login(input: AppAuthLoginInput): Promise<AppAuthSession>;
  loginWithPhone(input: AppAuthPhoneLoginInput): Promise<AppAuthSession>;
  logout(): Promise<void>;
  refreshToken(refreshToken?: string): Promise<AppAuthSession>;
  register(input: AppAuthRegisterInput): Promise<AppAuthSession>;
  requestPasswordReset(input: AppAuthPasswordResetRequestInput): Promise<void>;
  resetPassword(input: AppAuthPasswordResetInput): Promise<void>;
  sendVerifyCode(input: AppAuthSendVerifyCodeInput): Promise<void>;
  verifyCode(input: AppAuthVerifyCodeInput): Promise<boolean>;
}

type AppAuthServerClient = ReturnType<typeof createRuntimeMagicStudioServerClient>;
type ServerAuthSession = Awaited<ReturnType<AppAuthServerClient['login']>>['data'];
type ServerAuthSessionState = Awaited<ReturnType<AppAuthServerClient['readAuthSession']>>['data'];
type ServerAuthQrCode = Awaited<ReturnType<AppAuthServerClient['createLoginQrCode']>>['data'];
type ServerAuthQrStatus = Awaited<ReturnType<AppAuthServerClient['readLoginQrCodeStatus']>>['data'];

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(value: unknown): string | undefined {
  const text = readText(value);
  return text || undefined;
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  const nextEntries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(nextEntries) as T;
}

function getAppAuthServerClient(): AppAuthServerClient {
  const runtime = readDefaultPlatformRuntime('AppAuthService');
  return createRuntimeMagicStudioServerClient(runtime);
}

function resolveLoginDeviceType(deviceType?: AuthDeviceType): AuthDeviceType {
  return deviceType ?? resolveAuthDeviceType();
}

function mapServerAuthSession(session: ServerAuthSession): AppAuthSession {
  const username =
    readText(session.user.username)
    || readText(session.user.email)
    || readText(session.user.phone)
    || readText(session.user.userId)
    || 'current-user';
  const userId = readText(session.user.userId) || username;
  const displayName = readText(session.user.displayName) || username;

  return stripUndefinedFields({
    accessToken: readText(session.accessToken),
    authToken: readText(session.authToken),
    avatar: readOptionalText(session.user.avatar),
    avatarUrl: readOptionalText(session.user.avatarUrl),
    displayName,
    email: readOptionalText(session.user.email),
    phone: readOptionalText(session.user.phone),
    refreshToken: readOptionalText(session.refreshToken),
    userId,
    username,
  }) as AppAuthSession;
}

function persistMappedSession(session: AppAuthSession): void {
  persistAppSdkSessionTokens({
    accessToken: session.accessToken,
    authToken: session.authToken,
    refreshToken: session.refreshToken,
  });
}

function clearPersistedSession(): void {
  clearAppSdkSessionTokens();
}

function mapServerQrCode(payload: ServerAuthQrCode): AppAuthQrCodePayload {
  return {
    expireTime: typeof payload.expireTime === 'number' ? payload.expireTime : undefined,
    qrContent: readOptionalText(payload.qrContent),
    qrKey: readText(payload.qrKey),
    qrUrl: readOptionalText(payload.qrUrl),
  };
}

function mapServerQrStatus(result: ServerAuthQrStatus): AppAuthQrStatusResult {
  return {
    ...(result.session ? { session: mapServerAuthSession(result.session) } : {}),
    status: result.status,
  };
}

async function readSessionFromServer(
  client: AppAuthServerClient,
): Promise<ServerAuthSessionState> {
  const response = await client.readAuthSession();
  return response.data;
}

async function resolveRefreshToken(
  client: AppAuthServerClient,
  refreshToken?: string,
): Promise<string> {
  const explicitRefreshToken = readText(refreshToken);
  if (explicitRefreshToken) {
    return explicitRefreshToken;
  }

  const storedRefreshToken = readText(readAppSdkSessionTokens().refreshToken);
  if (storedRefreshToken) {
    return storedRefreshToken;
  }

  const sessionState = await readSessionFromServer(client);
  const sessionRefreshToken = readText(sessionState.session?.refreshToken);
  if (sessionRefreshToken) {
    return sessionRefreshToken;
  }

  throw new Error('Refresh token is missing.');
}

const localAppAuthService: IAppAuthService = {
  async checkQrCodeStatus(qrKey: string): Promise<AppAuthQrStatusResult> {
    const client = getAppAuthServerClient();
    const response = await client.readLoginQrCodeStatus(qrKey);
    const result = mapServerQrStatus(response.data);

    if (result.status === 'confirmed' && result.session) {
      persistMappedSession(result.session);
    }

    return result;
  },

  async generateQrCode(): Promise<AppAuthQrCodePayload> {
    const client = getAppAuthServerClient();
    const response = await client.createLoginQrCode();
    return mapServerQrCode(response.data);
  },

  async getCurrentSession(): Promise<AppAuthSession | null> {
    const client = getAppAuthServerClient();
    const sessionState = await readSessionFromServer(client);

    if (!sessionState.isAuthenticated || !sessionState.session) {
      clearPersistedSession();
      return null;
    }

    const session = mapServerAuthSession(sessionState.session);
    persistMappedSession(session);
    return session;
  },

  async login(input: AppAuthLoginInput): Promise<AppAuthSession> {
    const client = getAppAuthServerClient();
    const response = await client.login({
      deviceType: resolveLoginDeviceType(input.deviceType),
      password: input.password,
      username: input.username,
    });
    const session = mapServerAuthSession(response.data);
    persistMappedSession(session);
    return session;
  },

  async loginWithPhone(input: AppAuthPhoneLoginInput): Promise<AppAuthSession> {
    const client = getAppAuthServerClient();
    const response = await client.loginWithPhone({
      code: input.code,
      deviceType: resolveLoginDeviceType(input.deviceType),
      phone: input.phone,
    });
    const session = mapServerAuthSession(response.data);
    persistMappedSession(session);
    return session;
  },

  async logout(): Promise<void> {
    const client = getAppAuthServerClient();
    await client.logout();
    clearPersistedSession();
  },

  async refreshToken(refreshToken?: string): Promise<AppAuthSession> {
    const client = getAppAuthServerClient();
    const nextRefreshToken = await resolveRefreshToken(client, refreshToken);
    const response = await client.refreshSession({
      refreshToken: nextRefreshToken,
    });
    const session = mapServerAuthSession(response.data);
    persistMappedSession(session);
    return session;
  },

  async register(input: AppAuthRegisterInput): Promise<AppAuthSession> {
    const client = getAppAuthServerClient();
    const response = await client.register({
      confirmPassword: input.confirmPassword,
      email: input.email,
      password: input.password,
      phone: input.phone,
      username: input.username,
      verificationCode: input.verificationCode,
    });
    const session = mapServerAuthSession(response.data);
    persistMappedSession(session);
    return session;
  },

  async requestPasswordReset(input: AppAuthPasswordResetRequestInput): Promise<void> {
    const client = getAppAuthServerClient();
    await client.requestPasswordReset(input);
  },

  async resetPassword(input: AppAuthPasswordResetInput): Promise<void> {
    const client = getAppAuthServerClient();
    await client.resetPassword({
      account: input.account,
      code: input.code,
      confirmPassword: input.confirmPassword,
      newPassword: input.newPassword,
    });
  },

  async sendVerifyCode(input: AppAuthSendVerifyCodeInput): Promise<void> {
    const client = getAppAuthServerClient();
    await client.sendVerifyCode({
      scene: input.scene,
      target: input.target,
      verifyType: input.verifyType,
    });
  },

  async verifyCode(input: AppAuthVerifyCodeInput): Promise<boolean> {
    const client = getAppAuthServerClient();
    const response = await client.checkVerifyCode({
      code: input.code,
      scene: input.scene,
      target: input.target,
      verifyType: input.verifyType,
    });
    return Boolean(response.data.valid);
  },
};

const controller = createServiceAdapterController<IAppAuthService>(localAppAuthService);

export const appAuthService: IAppAuthService = controller.service;
export const setAppAuthServiceAdapter = controller.setAdapter;
export const getAppAuthServiceAdapter = controller.getAdapter;
export const resetAppAuthServiceAdapter = controller.resetAdapter;
