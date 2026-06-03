import type { AppRuntimeEnv } from '@sdkwork/magic-studio-core/sdk';

export type EnvLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StableEnvFeatureFlags {
  analytics: boolean;
  notifications: boolean;
  websocket: boolean;
  cache: boolean;
}

export interface StableEnvDefaults {
  debug: boolean;
  logLevel: EnvLogLevel;
  features: StableEnvFeatureFlags;
}

export const STABLE_ENV_DEFAULTS: StableEnvDefaults = Object.freeze({
  debug: false,
  logLevel: 'warn',
  features: Object.freeze({
    analytics: false,
    notifications: true,
    websocket: true,
    cache: false,
  }),
});

export function getStableEnvDefaults(_appEnv: AppRuntimeEnv): StableEnvDefaults {
  return {
    debug: STABLE_ENV_DEFAULTS.debug,
    logLevel: STABLE_ENV_DEFAULTS.logLevel,
    features: {
      ...STABLE_ENV_DEFAULTS.features,
    },
  };
}
