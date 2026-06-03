
/**
 * Environment Configuration Manager
 *
 * Supports multiple environment files:
 * - .env.development - Development environment
 * - .env.test - Test environment
 * - .env.staging - Staging environment
 * - .env.production - Production environment
 * - .env.local - Local overrides (gitignored)
 * - .env.example - Template for new developers
 */
import {
  createPcReactEnvConfig,
  readPcReactEnvSource,
} from '@sdkwork/core-pc-react/env';
import {
  normalizePublicAppPlatform,
  readWindowAppPlatformRuntimeKind,
  type AppRuntimeEnv,
  type PublicAppPlatform,
} from '@sdkwork/magic-studio-core/sdk';
import { getStableEnvDefaults, type EnvLogLevel } from './envDefaults';

// Environment type definition
export type AppEnv = AppRuntimeEnv;

// Feature flags interface
export interface FeatureFlags {
  analytics: boolean;
  notifications: boolean;
  websocket: boolean;
  cache: boolean;
}

// API Configuration interface
export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  imBaseUrl: string;
  timeout: number;
}

// Complete environment configuration interface
export interface EnvConfig {
  // Application
  appEnv: AppEnv;
  isDev: boolean;
  isTest: boolean;
  isStaging: boolean;
  isProduction: boolean;

  // API Configuration
  api: ApiConfig;

  // Authentication
  accessToken: string;

  // Debug Settings
  debug: boolean;
  logLevel: EnvLogLevel;

  // Feature Flags
  features: FeatureFlags;

  // Platform
  platform: PublicAppPlatform;
  isDesktopShell: boolean;
}

export type AppEnvSource = Record<string, string | boolean | undefined>;

function getEnvVar(source: AppEnvSource, key: string, defaultValue?: string): string {
  const value = source[key];
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  return defaultValue ?? '';
}

function getEnvVarBoolean(source: AppEnvSource, key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(source, key, String(defaultValue));
  return value === 'true' || value === '1';
}

function resolveAppPlatform(
  source: AppEnvSource,
  isDesktopShell: boolean,
  platformId: string,
): EnvConfig['platform'] {
  if (isDesktopShell) {
    return 'desktop';
  }

  return normalizePublicAppPlatform(
    readWindowAppPlatformRuntimeKind(),
    getEnvVar(source, 'VITE_PLATFORM'),
    getEnvVar(source, 'VITE_APP_PLATFORM'),
    platformId,
  );
}

function deriveWsUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return 'ws://localhost:8080/ws';
  }
}

export function buildEnvConfig(source: AppEnvSource = readPcReactEnvSource()): EnvConfig {
  const resolvedEnv = createPcReactEnvConfig(source);
  const stableDefaults = getStableEnvDefaults(resolvedEnv.appEnv);
  const isDesktopShell = resolvedEnv.platform.isDesktop;

  return {
    // Application
    appEnv: resolvedEnv.appEnv,
    isDev: resolvedEnv.isDev,
    isTest: resolvedEnv.isTest,
    isStaging: resolvedEnv.isStaging,
    isProduction: resolvedEnv.isProduction,

    // API Configuration
    api: {
      baseUrl: resolvedEnv.api.baseUrl,
      wsUrl: getEnvVar(source, 'VITE_WS_URL', deriveWsUrl(resolvedEnv.api.baseUrl)),
      imBaseUrl: getEnvVar(source, 'VITE_IM_API_BASE_URL', resolvedEnv.api.baseUrl),
      timeout: resolvedEnv.api.timeout,
    },

    // Authentication
    accessToken: resolvedEnv.auth.accessToken,

    // Debug Settings
    debug: getEnvVarBoolean(source, 'VITE_DEBUG', stableDefaults.debug),
    logLevel: (getEnvVar(source, 'VITE_LOG_LEVEL', stableDefaults.logLevel) as EnvLogLevel),

    // Feature Flags
    features: {
      analytics: getEnvVarBoolean(source, 'VITE_FEATURE_ANALYTICS', stableDefaults.features.analytics),
      notifications: getEnvVarBoolean(
        source,
        'VITE_FEATURE_NOTIFICATIONS',
        stableDefaults.features.notifications
      ),
      websocket: getEnvVarBoolean(source, 'VITE_FEATURE_WEBSOCKET', stableDefaults.features.websocket),
      cache: getEnvVarBoolean(source, 'VITE_FEATURE_CACHE', stableDefaults.features.cache),
    },

    // Platform
    platform: resolveAppPlatform(source, isDesktopShell, resolvedEnv.platform.id),
    isDesktopShell,
  };
}

export function readEnvConfig(source: AppEnvSource = readPcReactEnvSource()): EnvConfig {
  return buildEnvConfig(source);
}

export const createEnvConfig = buildEnvConfig;

function createEnvConfigProxy(): EnvConfig {
  return new Proxy({} as EnvConfig, {
    get(_target, property) {
      return Reflect.get(readEnvConfig(), property);
    },
    has(_target, property) {
      return Reflect.has(readEnvConfig(), property);
    },
    ownKeys() {
      return Reflect.ownKeys(readEnvConfig());
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(readEnvConfig(), property);
      if (!descriptor) {
        return undefined;
      }

      return {
        ...descriptor,
        configurable: true,
      };
    },
  });
}

// Export runtime-aware environment configuration facade.
export const ENV = createEnvConfigProxy();

// Export environment-specific utilities
export const EnvUtils = {
  /**
   * Check if current environment matches target
   */
  is(env: AppEnv): boolean {
    return readEnvConfig().appEnv === env;
  },
  
  /**
   * Check if any feature is enabled
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return readEnvConfig().features[feature];
  },
  
  /**
   * Get API URL with optional path
   */
  getApiUrl(path: string = ''): string {
    const base = readEnvConfig().api.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${base}/${cleanPath}` : base;
  },

  /**
   * Get IM API URL with optional path
   */
  getImApiUrl(path: string = ''): string {
    const base = readEnvConfig().api.imBaseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${base}/${cleanPath}` : base;
  },
  
  /**
   * Log message only in development
   */
  devLog(...args: any[]): void {
    const env = readEnvConfig();
    if (env.isDev && env.debug) {
      console.log('[Dev]', ...args);
    }
  },
  
  /**
   * Get full WebSocket URL with optional path
   */
  getWsUrl(path: string = ''): string {
    const base = readEnvConfig().api.wsUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${base}/${cleanPath}` : base;
  },

  /**
   * Get SDK initialization configuration
   */
  getSdkConfig(): { baseUrl: string; accessToken: string; timeout: number } {
    const env = readEnvConfig();
    return {
      baseUrl: env.api.baseUrl,
      accessToken: env.accessToken,
      timeout: env.api.timeout,
    };
  },
};

// Default export for convenience
export default ENV;
