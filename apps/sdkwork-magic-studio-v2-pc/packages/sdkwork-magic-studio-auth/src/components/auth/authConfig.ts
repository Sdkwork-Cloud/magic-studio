import { ROUTES } from '@sdkwork/magic-studio-core/router';

export type AuthMode = 'forgot' | 'login' | 'register';
export type AuthLoginMethod = 'emailCode' | 'password' | 'phoneCode';
export type AuthRegisterMethod = 'email' | 'phone';
export type AuthRecoveryMethod = 'email' | 'phone';
export type QrPanelState =
  | 'confirmed'
  | 'error'
  | 'expired'
  | 'idle'
  | 'loading'
  | 'pending'
  | 'scanned';

export interface AuthRuntimeConfig {
  loginMethods?: AuthLoginMethod[];
  oauthLoginEnabled?: boolean;
  oauthProviders?: string[];
  qrLoginEnabled?: boolean;
  recoveryMethods?: AuthRecoveryMethod[];
  registerMethods?: AuthRegisterMethod[];
}

type AuthRuntimeGlobal = typeof globalThis & {
  __SDKWORK_AUTH__?: AuthRuntimeConfig;
  __SDKWORK_AUTH_CONFIG__?: AuthRuntimeConfig;
};

export const DEFAULT_AUTH_LOGIN_METHODS: AuthLoginMethod[] = [
  'password',
  'phoneCode',
];

export const DEFAULT_AUTH_REGISTER_METHODS: AuthRegisterMethod[] = [
  'email',
  'phone',
];

export const DEFAULT_AUTH_RECOVERY_METHODS: AuthRecoveryMethod[] = [
  'email',
  'phone',
];

export const DEFAULT_AUTH_OAUTH_PROVIDERS: string[] = [
  'wechat',
  'douyin',
  'github',
  'google',
];

function readEnvValue(...keys: string[]): string | undefined {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  for (const key of keys) {
    const value = meta.env?.[key];
    if ((value || '').trim()) {
      return value;
    }
  }

  return undefined;
}

function normalizeProvider(provider: string | undefined | null): string | null {
  const normalized = (provider || '').trim().toLowerCase();
  return normalized || null;
}

function parseBoolean(value: string | undefined | null): boolean | undefined {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (['1', 'on', 'true', 'yes'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseProviderList(value: string | undefined | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((item) => normalizeProvider(item))
    .filter((item): item is string => Boolean(item));
}

function parseMethodList<T extends string>(
  value: string | undefined | null,
  isAllowed: (input: string | undefined) => input is T,
): T[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((item) => (item || '').trim())
    .filter((item): item is T => isAllowed(item));
}

function dedupeValues<T extends string>(values: Array<T | null | undefined>): T[] {
  const seen = new Set<T>();
  const resolved: T[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    resolved.push(value);
  }

  return resolved;
}

function isAuthLoginMethod(value: string | undefined): value is AuthLoginMethod {
  return value === 'password' || value === 'phoneCode' || value === 'emailCode';
}

function isAuthRegisterMethod(value: string | undefined): value is AuthRegisterMethod {
  return value === 'email' || value === 'phone';
}

function isAuthRecoveryMethod(value: string | undefined): value is AuthRecoveryMethod {
  return value === 'email' || value === 'phone';
}

export function getAuthRuntimeConfig(): AuthRuntimeConfig | undefined {
  const runtime = globalThis as AuthRuntimeGlobal;
  return runtime.__SDKWORK_AUTH_CONFIG__ || runtime.__SDKWORK_AUTH__;
}

export function resolveAuthMode(pathname: string): AuthMode {
  if (pathname.startsWith(ROUTES.AUTH_REGISTER)) {
    return 'register';
  }

  if (pathname.startsWith(ROUTES.AUTH_FORGOT_PASSWORD)) {
    return 'forgot';
  }

  return 'login';
}

export function resolveAuthOAuthProviders(explicitProviders?: string[]): string[] {
  const runtimeProviders = getAuthRuntimeConfig()?.oauthProviders || [];
  const envProviders = parseProviderList(
    readEnvValue('VITE_SDKWORK_AUTH_OAUTH_PROVIDERS', 'VITE_AUTH_OAUTH_PROVIDERS'),
  );
  const configuredProviders = explicitProviders?.length
    ? explicitProviders
    : runtimeProviders.length
      ? runtimeProviders
      : envProviders.length
        ? envProviders
        : DEFAULT_AUTH_OAUTH_PROVIDERS;

  return dedupeValues(configuredProviders.map((provider) => normalizeProvider(provider)));
}

export function resolveAuthLoginMethods(explicitMethods?: AuthLoginMethod[]): AuthLoginMethod[] {
  const runtimeMethods = getAuthRuntimeConfig()?.loginMethods || [];
  const envMethods = parseMethodList(
    readEnvValue('VITE_SDKWORK_AUTH_LOGIN_METHODS', 'VITE_AUTH_LOGIN_METHODS'),
    isAuthLoginMethod,
  );
  const configuredMethods = explicitMethods?.length
    ? explicitMethods
    : runtimeMethods.length
      ? runtimeMethods
      : envMethods.length
        ? envMethods
        : DEFAULT_AUTH_LOGIN_METHODS;

  return dedupeValues(configuredMethods);
}

export function resolveNextAuthLoginMethod(input: {
  currentMethod: AuthLoginMethod;
  loginMethods: AuthLoginMethod[];
  requestedMethod?: string | null;
}): AuthLoginMethod {
  const requestedMethod = (input.requestedMethod || '').trim();

  if (requestedMethod === 'email' || requestedMethod === 'emailCode') {
    return input.loginMethods.includes('emailCode')
      ? 'emailCode'
      : input.loginMethods[0] || DEFAULT_AUTH_LOGIN_METHODS[0];
  }

  if (requestedMethod === 'phone' || requestedMethod === 'phoneCode') {
    return input.loginMethods.includes('phoneCode')
      ? 'phoneCode'
      : input.loginMethods[0] || DEFAULT_AUTH_LOGIN_METHODS[0];
  }

  if (input.loginMethods.includes(input.currentMethod)) {
    return input.currentMethod;
  }

  return input.loginMethods[0] || DEFAULT_AUTH_LOGIN_METHODS[0];
}

export function resolveAuthRegisterMethods(
  explicitMethods?: AuthRegisterMethod[],
): AuthRegisterMethod[] {
  const runtimeMethods = getAuthRuntimeConfig()?.registerMethods || [];
  const envMethods = parseMethodList(
    readEnvValue('VITE_SDKWORK_AUTH_REGISTER_METHODS', 'VITE_AUTH_REGISTER_METHODS'),
    isAuthRegisterMethod,
  );
  const configuredMethods = explicitMethods?.length
    ? explicitMethods
    : runtimeMethods.length
      ? runtimeMethods
      : envMethods.length
        ? envMethods
        : DEFAULT_AUTH_REGISTER_METHODS;

  return dedupeValues(configuredMethods);
}

export function resolveAuthRecoveryMethods(
  explicitMethods?: AuthRecoveryMethod[],
): AuthRecoveryMethod[] {
  const runtimeMethods = getAuthRuntimeConfig()?.recoveryMethods || [];
  const envMethods = parseMethodList(
    readEnvValue('VITE_SDKWORK_AUTH_RECOVERY_METHODS', 'VITE_AUTH_RECOVERY_METHODS'),
    isAuthRecoveryMethod,
  );
  const configuredMethods = explicitMethods?.length
    ? explicitMethods
    : runtimeMethods.length
      ? runtimeMethods
      : envMethods.length
        ? envMethods
        : DEFAULT_AUTH_RECOVERY_METHODS;

  return dedupeValues(configuredMethods);
}

export function isAuthQrLoginEnabled(explicitValue?: boolean): boolean {
  if (typeof explicitValue === 'boolean') {
    return explicitValue;
  }

  const runtimeValue = getAuthRuntimeConfig()?.qrLoginEnabled;
  if (typeof runtimeValue === 'boolean') {
    return runtimeValue;
  }

  return parseBoolean(
    readEnvValue('VITE_SDKWORK_AUTH_QR_LOGIN_ENABLED', 'VITE_AUTH_QR_LOGIN_ENABLED'),
  ) ?? true;
}

export function isAuthOAuthLoginEnabled(explicitValue?: boolean): boolean {
  if (typeof explicitValue === 'boolean') {
    return explicitValue;
  }

  const runtimeValue = getAuthRuntimeConfig()?.oauthLoginEnabled;
  if (typeof runtimeValue === 'boolean') {
    return runtimeValue;
  }

  return parseBoolean(
    readEnvValue('VITE_SDKWORK_AUTH_OAUTH_LOGIN_ENABLED', 'VITE_AUTH_OAUTH_LOGIN_ENABLED'),
  ) ?? false;
}

export function normalizeAuthOAuthProvider(provider: string | undefined): string | null {
  return normalizeProvider(provider);
}

export function isConfiguredAuthOAuthProvider(
  provider: string | undefined,
  configuredProviders = resolveAuthOAuthProviders(),
): boolean {
  const normalized = normalizeProvider(provider);
  return Boolean(normalized && configuredProviders.includes(normalized));
}

export function resolveAuthProviderTranslationKey(provider: string): string {
  return `auth.providers.${normalizeProvider(provider) || 'fallback'}`;
}

export function humanizeAuthProvider(provider: string): string {
  return provider
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

export function resolveRecoveryChannel(method: AuthRecoveryMethod): 'EMAIL' | 'SMS' {
  return method === 'phone' ? 'SMS' : 'EMAIL';
}

export function looksLikeEmailAddress(value: string | undefined | null): boolean {
  const normalized = (value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function looksLikePhoneNumber(value: string | undefined | null): boolean {
  const normalized = (value || '').trim().replace(/[\s()-]+/g, '');
  return /^\+?\d{6,20}$/.test(normalized);
}

export function resolveAuthQrTypeHintKey(type: string | undefined | null): string {
  const normalized = (type || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized === 'wechat_official_account'
    ? 'auth.qrTypeHints.wechatOfficialAccount'
    : 'auth.qrTypeHints.default';
}

export function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
