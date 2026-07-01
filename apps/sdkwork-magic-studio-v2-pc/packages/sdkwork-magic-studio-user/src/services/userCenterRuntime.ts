import {
  createDefaultUserCenterConfig,
  createUserCenterRuntimeClient,
  createUserCenterSessionStore,
  createUserCenterTokenStore,
  resolveUserCenterRuntimeConfigInput,
  type UserCenterRuntimeClient,
  type UserCenterRuntimeClientOptions,
  type UserCenterRuntimeConfig,
} from '@sdkwork/user-center-core-pc-react';
import {
  MAGIC_STUDIO_USER_CENTER_GATEWAY_ENV_PREFIX,
  MAGIC_STUDIO_USER_CENTER_RUNTIME_ENV_PREFIX,
  createMagicStudioUserCenterConfig,
  type CreateMagicStudioUserCenterConfigOptions,
} from './userCenterStandard.ts';
import {
  createMagicStudioUserCenterValidationInteropContract,
} from './validation.ts';

export {
  createUserCenterRuntimeClient,
  createUserCenterSessionStore,
  createUserCenterTokenStore,
};

export type CreateMagicStudioCanonicalUserCenterConfigOptions =
  CreateMagicStudioUserCenterConfigOptions;
export type CreateMagicStudioUserCenterRuntimeClientOptions =
  UserCenterRuntimeClientOptions;
export type MagicStudioCanonicalUserCenterRuntimeConfig = UserCenterRuntimeConfig;
export type MagicStudioUserCenterRuntimeClient = UserCenterRuntimeClient;

export const MAGIC_STUDIO_CANONICAL_USER_CENTER_SQLITE_PATH =
  'app://magic-studio/user-center.db';
export const MAGIC_STUDIO_CANONICAL_USER_CENTER_DATABASE_KEY =
  'magic-studio-user-center';
export const MAGIC_STUDIO_CANONICAL_USER_CENTER_MIGRATION_NAMESPACE =
  'magic-studio.user-center';
export const MAGIC_STUDIO_CANONICAL_USER_CENTER_TABLE_PREFIX = 'ms_uc_';

function resolveMagicStudioRuntimeWindow():
  | Record<string, unknown>
  | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window as unknown as Record<string, unknown>;
}

function resolveMagicStudioRuntimeEnv():
  | Record<string, unknown>
  | undefined {
  return (
    (import.meta as ImportMeta & { env?: Record<string, unknown> }).env
    ?? undefined
  );
}

function resolveMagicStudioRuntimeConfigOptions(
  options: CreateMagicStudioCanonicalUserCenterConfigOptions,
): CreateMagicStudioCanonicalUserCenterConfigOptions {
  return resolveUserCenterRuntimeConfigInput(options, {
    env: resolveMagicStudioRuntimeEnv(),
    envPrefix: MAGIC_STUDIO_USER_CENTER_RUNTIME_ENV_PREFIX,
    window: resolveMagicStudioRuntimeWindow(),
    windowPrefix: MAGIC_STUDIO_USER_CENTER_GATEWAY_ENV_PREFIX,
  });
}

function createMagicStudioCanonicalStorageTopology(
  runtimeConfig: Pick<UserCenterRuntimeConfig, 'storageTopology'>,
) {
  return {
    ...runtimeConfig.storageTopology,
    databaseKey: MAGIC_STUDIO_CANONICAL_USER_CENTER_DATABASE_KEY,
    migrationNamespace: MAGIC_STUDIO_CANONICAL_USER_CENTER_MIGRATION_NAMESPACE,
    tablePrefix: MAGIC_STUDIO_CANONICAL_USER_CENTER_TABLE_PREFIX,
  };
}

function createDefaultMagicStudioValidationInteropContract(
  runtimeConfig: UserCenterRuntimeConfig,
) {
  return createMagicStudioUserCenterValidationInteropContract({
    auth: runtimeConfig.auth,
    localApiBasePath: runtimeConfig.integration.builtinLocal.localApiBasePath,
    mode: runtimeConfig.mode,
    provider: runtimeConfig.provider,
    routes: runtimeConfig.routes,
    storageTopology: runtimeConfig.storageTopology,
  });
}

export function createMagicStudioCanonicalUserCenterConfig(
  options: CreateMagicStudioCanonicalUserCenterConfigOptions = {},
): MagicStudioCanonicalUserCenterRuntimeConfig {
  const resolvedOptions = resolveMagicStudioRuntimeConfigOptions(options);
  const bridgeConfig = createMagicStudioUserCenterConfig(resolvedOptions);

  return createDefaultUserCenterConfig({
    auth: bridgeConfig.auth,
    localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
    mode: bridgeConfig.mode,
    namespace: bridgeConfig.namespace,
    provider: bridgeConfig.provider,
    routes: bridgeConfig.routes,
    storage: {
      dialect: 'sqlite',
      sqlitePath: MAGIC_STUDIO_CANONICAL_USER_CENTER_SQLITE_PATH,
    },
    storageTopology: createMagicStudioCanonicalStorageTopology(bridgeConfig),
  });
}

export function createMagicStudioUserCenterRuntimeClient(
  configOptions: CreateMagicStudioCanonicalUserCenterConfigOptions = {},
  options: CreateMagicStudioUserCenterRuntimeClientOptions = {},
): MagicStudioUserCenterRuntimeClient {
  const runtimeConfig = createMagicStudioCanonicalUserCenterConfig(configOptions);

  return createUserCenterRuntimeClient(runtimeConfig, {
    ...options,
    ...(options.validationInteropContract || options.resolveValidationInteropContract
      ? {}
      : {
          validationInteropContract:
            createDefaultMagicStudioValidationInteropContract(runtimeConfig),
        }),
  });
}
