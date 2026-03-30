import type { SdkworkAppConfig } from '@sdkwork/app-sdk';

export type AppRuntimeEnv = 'development' | 'staging' | 'production' | 'test';

export interface AppSdkEnvResolvedConfig extends SdkworkAppConfig {
  env: AppRuntimeEnv;
}

export type AppSdkEnvMap = Partial<Record<string, string | undefined>>;

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_BASE_URLS: Record<AppRuntimeEnv, string> = {
  development: 'https://api-dev.sdkwork.com',
  staging: 'https://staging-api.sdkwork.com',
  production: 'https://api.sdkwork.com',
  test: 'https://api-test.sdkwork.com',
};

function firstNonEmptyValue(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (normalized) {
        return normalized;
      }
    }
  }
  return undefined;
}

export function readAppSdkEnv(): AppSdkEnvMap {
  return ((import.meta as unknown as { env?: AppSdkEnvMap }).env ?? {}) as AppSdkEnvMap;
}

export function resolveRuntimeEnv(...values: Array<string | undefined>): AppRuntimeEnv {
  const normalized = firstNonEmptyValue(...values)?.toLowerCase();

  if (normalized === 'production' || normalized === 'prod') return 'production';
  if (normalized === 'staging' || normalized === 'stage') return 'staging';
  if (normalized === 'test') return 'test';
  return 'development';
}

export function parseAppSdkTimeout(
  value?: string,
  fallback: number = DEFAULT_TIMEOUT
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function resolveDefaultBaseUrl(env: AppRuntimeEnv): string {
  return DEFAULT_BASE_URLS[env];
}

export function normalizeBaseUrl(baseUrl?: string, env: AppRuntimeEnv = 'development'): string {
  const resolved = firstNonEmptyValue(baseUrl) ?? resolveDefaultBaseUrl(env);
  return resolved.replace(/\/+$/g, '');
}

export function resolveAppSdkAccessTokenFromEnv(env: AppSdkEnvMap): string {
  return (
    firstNonEmptyValue(env.VITE_ACCESS_TOKEN, env.SDKWORK_ACCESS_TOKEN) ?? ''
  ).trim();
}

export function createAppSdkClientConfigFromEnv(
  env: AppSdkEnvMap,
  overrides: Partial<SdkworkAppConfig> = {}
): AppSdkEnvResolvedConfig {
  const runtimeEnv = resolveRuntimeEnv(env.VITE_APP_ENV, env.MODE, env.NODE_ENV);

  return {
    env: runtimeEnv,
    baseUrl: normalizeBaseUrl(
      firstNonEmptyValue(
        overrides.baseUrl,
        env.VITE_API_BASE_URL,
        env.VITE_APP_API_BASE_URL,
        env.SDKWORK_API_BASE_URL,
        env.VITE_APP_BASE_URL
      ),
      runtimeEnv
    ),
    timeout:
      overrides.timeout ??
      parseAppSdkTimeout(firstNonEmptyValue(env.VITE_TIMEOUT, env.SDKWORK_TIMEOUT)),
    apiKey: overrides.apiKey ?? firstNonEmptyValue(env.VITE_API_KEY, env.SDKWORK_API_KEY),
    authToken: overrides.authToken,
    accessToken: overrides.accessToken ?? resolveAppSdkAccessTokenFromEnv(env),
    tenantId: overrides.tenantId ?? firstNonEmptyValue(env.VITE_TENANT_ID, env.SDKWORK_TENANT_ID),
    organizationId:
      overrides.organizationId ??
      firstNonEmptyValue(env.VITE_ORGANIZATION_ID, env.SDKWORK_ORGANIZATION_ID),
    platform:
      overrides.platform ?? firstNonEmptyValue(env.VITE_PLATFORM, env.SDKWORK_PLATFORM) ?? 'web',
    tokenManager: overrides.tokenManager,
    authMode: overrides.authMode,
    headers: overrides.headers,
  };
}
