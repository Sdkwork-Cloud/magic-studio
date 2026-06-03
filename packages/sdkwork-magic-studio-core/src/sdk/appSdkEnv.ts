import type { SdkworkAppConfig } from '@sdkwork/app-sdk';
import {
  normalizePublicAppPlatformValue,
  type PublicAppPlatform,
  type WindowPlatformRuntimeKind,
} from '@sdkwork/magic-studio-types/runtime';
import {
  createAppClientConfigFromEnv,
  resolveAppClientAccessTokenFromEnv,
} from '@sdkwork/core-pc-react/app';
import {
  createPcReactEnvConfig,
  readPcReactEnvSource,
} from '@sdkwork/core-pc-react/env';
import { readWindowPlatformRuntime } from '../platform/runtime/windowGlobal';

export type AppRuntimeEnv = 'development' | 'staging' | 'production' | 'test';

export interface AppSdkEnvResolvedConfig extends SdkworkAppConfig {
  env: AppRuntimeEnv;
}

export type AppSdkEnvMap = Partial<Record<string, string | undefined>>;
export type { PublicAppPlatform } from '@sdkwork/magic-studio-types/runtime';

const DEFAULT_TIMEOUT = 30000;

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

function normalizeRuntimeKindValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export function readWindowAppPlatformRuntimeKind(): WindowPlatformRuntimeKind | undefined {
  const runtime = readWindowPlatformRuntime();
  if (!runtime) {
    return undefined;
  }

  try {
    return normalizeRuntimeKindValue(runtime.system.kind());
  } catch {
    return undefined;
  }
}

export function normalizePublicAppPlatform(...values: Array<string | undefined>): PublicAppPlatform {
  for (const value of values) {
    const normalized = normalizePublicAppPlatformValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return 'web';
}

export function readAppSdkEnv(): AppSdkEnvMap {
  const source = readPcReactEnvSource() as AppSdkEnvMap;
  const runtimeProcessEnv = (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process?.env;

  return {
    ...source,
    ...(runtimeProcessEnv ?? {}),
  };
}

export function resolveRuntimeEnv(...values: Array<string | undefined>): AppRuntimeEnv {
  return createPcReactEnvConfig({
    VITE_APP_ENV: values[0],
    MODE: values[1],
    NODE_ENV: values[2],
  }).appEnv;
}

export function parseAppSdkTimeout(
  value?: string,
  fallback: number = DEFAULT_TIMEOUT,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function resolveDefaultBaseUrl(env: AppRuntimeEnv): string {
  return createPcReactEnvConfig({
    VITE_APP_ENV: env,
  }).api.baseUrl;
}

export function normalizeBaseUrl(
  baseUrl?: string,
  env: AppRuntimeEnv = 'development',
): string {
  return createPcReactEnvConfig({
    VITE_APP_ENV: env,
    VITE_API_BASE_URL: firstNonEmptyValue(baseUrl),
  }).api.baseUrl;
}

export function resolveAppSdkAccessTokenFromEnv(env: AppSdkEnvMap): string {
  return resolveAppClientAccessTokenFromEnv(env).trim();
}

export function createAppSdkClientConfigFromEnv(
  env: AppSdkEnvMap,
  overrides: Partial<SdkworkAppConfig> = {},
): AppSdkEnvResolvedConfig {
  const config = createAppClientConfigFromEnv(env, overrides);
  const resolvedEnv = createPcReactEnvConfig(env);
  const runtimePlatformKind = readWindowAppPlatformRuntimeKind();
  const resolvedPlatform = normalizePublicAppPlatform(
    runtimePlatformKind,
    typeof overrides.platform === 'string' ? overrides.platform : undefined,
    env.VITE_PLATFORM,
    env.VITE_APP_PLATFORM,
    env.SDKWORK_PLATFORM,
    resolvedEnv.platform.id,
  );

  return {
    ...config,
    env: resolvedEnv.appEnv,
    platform: resolvedPlatform,
  } as AppSdkEnvResolvedConfig;
}
