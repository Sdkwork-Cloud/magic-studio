import {
  USER_CENTER_SESSION_HEADER_NAME,
  USER_CENTER_SOURCE_PACKAGE_NAME,
  createUserCenterBridgeConfig,
  createUserCenterDeploymentEnvArtifact,
  createUserCenterHandshakeSigningMessage,
  createUserCenterHandshakeVerificationContext,
  createUserCenterLocalApiRoutes,
  createUserCenterPluginDefinition,
  createUserCenterServerPluginDefinition,
  createUserCenterSessionStore,
  createUserCenterSignedHandshakeHeaders,
  createUserCenterStoragePlan,
  createUserCenterTokenStore,
  mapUserCenterDeploymentVariablesToEnvironmentVariables,
  mergeUserCenterDeploymentVariables,
  selectUserCenterDeploymentVariables,
  USER_CENTER_STANDARD_ENTITY_NAMES,
} from '@sdkwork/user-center-core-pc-react';
import type {
  UserCenterBridgeConfig,
  UserCenterBridgeConfigInput,
  UserCenterDeploymentArtifact,
  UserCenterDeploymentEnvironmentVariable,
  UserCenterDeploymentProfile,
  UserCenterDeploymentProfileSet,
  UserCenterDeploymentVariable,
  UserCenterHandshakeSignature,
  UserCenterHandshakeVerificationContext,
  UserCenterHandshakeVerificationContextInput,
  UserCenterIntegrationKind,
  UserCenterIntegrationProfileSet,
  UserCenterLocalApiRoutes,
  UserCenterServerValidationPluginDefinition,
  UserCenterMode,
  UserCenterPluginCapabilityName,
  UserCenterPluginDefinition,
  UserCenterPluginDefinitionOptions,
  UserCenterProviderConfig,
  UserCenterProviderKind,
  UserCenterRoutes,
  UserCenterServerPluginDefinition,
  UserCenterServerPluginDefinitionOptions,
  UserCenterSessionStore,
  UserCenterStandardEntityName,
  UserCenterStorageEntityBinding,
  UserCenterStorageEntityBindingInput,
  UserCenterStoragePlan,
  UserCenterStorageTopology,
  UserCenterStorageTopologyInput,
  UserCenterTokenStore,
} from '@sdkwork/user-center-core-pc-react';
import {
  createUserCenterServerValidationPluginDefinition,
} from '@sdkwork/user-center-validation-pc-react';
import {
  MAGIC_STUDIO_SERVER_APP_USER_CENTER_LOCAL_API_BASE_PATH,
} from '@sdkwork/magic-studio-server';

export type MagicStudioUserCenterMode = UserCenterMode;
export type MagicStudioUserCenterProviderKind = UserCenterProviderKind;
export type MagicStudioUserCenterIntegrationKind = UserCenterIntegrationKind;
export type MagicStudioUserCenterStandardEntityName = UserCenterStandardEntityName;

export type MagicStudioUserCenterProviderConfig = UserCenterProviderConfig;
export type MagicStudioUserCenterRoutes = UserCenterRoutes;
export type MagicStudioUserCenterStoragePlan = UserCenterStoragePlan;
export type MagicStudioUserCenterLocalApiRoutes = UserCenterLocalApiRoutes;
export type MagicStudioUserCenterStorageEntityBindingInput = UserCenterStorageEntityBindingInput;
export type MagicStudioUserCenterStorageEntityBinding = UserCenterStorageEntityBinding;
export type MagicStudioUserCenterStorageTopologyInput = UserCenterStorageTopologyInput;
export type MagicStudioUserCenterStorageTopology = UserCenterStorageTopology;
export type MagicStudioUserCenterIntegrationProfileSet = UserCenterIntegrationProfileSet;
export type MagicStudioUserCenterHandshakeSignature = UserCenterHandshakeSignature;
export type MagicStudioUserCenterHandshakeVerificationContext =
  UserCenterHandshakeVerificationContext;
export type MagicStudioUserCenterRuntimeConfig = UserCenterBridgeConfig;
export type MagicStudioUserCenterSessionStore = UserCenterSessionStore;
export type MagicStudioUserCenterTokenStore = UserCenterTokenStore;
export type MagicStudioUserCenterServerPluginDefinition = UserCenterServerPluginDefinition;
export type MagicStudioUserCenterServerValidationPluginDefinition =
  UserCenterServerValidationPluginDefinition;
export type MagicStudioUserCenterPluginCapability = Extract<
  UserCenterPluginCapabilityName,
  'user'
>;

export type CreateMagicStudioUserCenterConfigOptions =
  Omit<UserCenterBridgeConfigInput, 'namespace' | 'routes'> & {
    routes?: Partial<MagicStudioUserCenterRoutes>;
  };
export type CreateMagicStudioUserCenterHandshakeVerificationContextOptions =
  Omit<UserCenterHandshakeVerificationContextInput, 'config'> & {
    config?: MagicStudioUserCenterRuntimeConfig;
  };
export type CreateMagicStudioUserCenterPluginDefinitionOptions =
  Omit<UserCenterPluginDefinitionOptions, 'capabilities' | 'namespace' | 'routes'> & {
    capabilities?: readonly MagicStudioUserCenterPluginCapability[];
    routes?: Partial<MagicStudioUserCenterRoutes>;
  };
export type CreateMagicStudioUserCenterServerPluginDefinitionOptions =
  Omit<UserCenterServerPluginDefinitionOptions, 'namespace' | 'routes'> & {
    routes?: Partial<MagicStudioUserCenterRoutes>;
  };

export type MagicStudioUserCenterEnvironmentVariable = UserCenterDeploymentEnvironmentVariable;
export type MagicStudioUserCenterDeploymentArtifact = UserCenterDeploymentArtifact;

export interface MagicStudioUserCenterClientDeploymentProfile {
  artifacts: readonly MagicStudioUserCenterDeploymentArtifact[];
  gatewayEnvArtifact: MagicStudioUserCenterDeploymentArtifact;
  handshakeEnabled: boolean;
  kind: UserCenterDeploymentProfile['kind'];
  providerKey: string;
  runtimeEnvArtifact: MagicStudioUserCenterDeploymentArtifact;
  standard: UserCenterDeploymentProfile;
}

export interface MagicStudioUserCenterClientDeploymentProfileSet {
  activeKind: UserCenterDeploymentProfileSet['activeKind'];
  builtinLocal: MagicStudioUserCenterClientDeploymentProfile;
  externalAppApi: MagicStudioUserCenterClientDeploymentProfile;
  externalUserCenter?: MagicStudioUserCenterClientDeploymentProfile;
}

export interface MagicStudioUserCenterPluginDefinition extends UserCenterPluginDefinition {
  clientDeployment: MagicStudioUserCenterClientDeploymentProfileSet;
}

export const MAGIC_STUDIO_USER_CENTER_SOURCE_PACKAGE = USER_CENTER_SOURCE_PACKAGE_NAME;
export const MAGIC_STUDIO_USER_CENTER_NAMESPACE = 'magic-studio';
export const MAGIC_STUDIO_USER_CENTER_SESSION_HEADER_NAME = USER_CENTER_SESSION_HEADER_NAME;
export const MAGIC_STUDIO_USER_CENTER_STANDARD_ENTITIES = USER_CENTER_STANDARD_ENTITY_NAMES;
export const MAGIC_STUDIO_USER_CENTER_PLUGIN_PACKAGES = [
  '@sdkwork/magic-studio-user',
  '@sdkwork/user-pc-react',
] as const;
export const MAGIC_STUDIO_USER_CENTER_STORAGE_PLAN = createUserCenterStoragePlan(
  MAGIC_STUDIO_USER_CENTER_NAMESPACE,
);
export const MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH =
  MAGIC_STUDIO_SERVER_APP_USER_CENTER_LOCAL_API_BASE_PATH;
export const MAGIC_STUDIO_USER_CENTER_ROUTES: MagicStudioUserCenterRoutes = {
  authBasePath: '/auth',
  userRoutePath: '/user',
  vipRoutePath: '/vip',
};
export const MAGIC_STUDIO_USER_CENTER_LOCAL_API = createUserCenterLocalApiRoutes(
  MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH,
);
export const MAGIC_STUDIO_USER_CENTER_RUNTIME_ENV_PREFIX = 'VITE_MAGIC_STUDIO_USER_CENTER_';
export const MAGIC_STUDIO_USER_CENTER_GATEWAY_ENV_PREFIX = 'MAGIC_STUDIO_USER_CENTER_';
export const MAGIC_STUDIO_USER_CENTER_RUNTIME_ENV_ARTIFACT_BASENAME = 'runtime.env.example';
export const MAGIC_STUDIO_USER_CENTER_GATEWAY_ENV_ARTIFACT_BASENAME = 'gateway.env.example';

function createMagicStudioUserCenterBasePluginArtifacts(
  options: CreateMagicStudioUserCenterPluginDefinitionOptions = {},
): {
  bridgeConfig: MagicStudioUserCenterRuntimeConfig;
  plugin: UserCenterPluginDefinition;
} {
  const bridgeConfig = createMagicStudioUserCenterConfig({
    auth: options.auth,
    localApiBasePath: options.localApiBasePath,
    mode: options.mode,
    provider: options.provider,
    routes: options.routes,
    storageTopology: options.storageTopology,
  });

  const plugin = createUserCenterPluginDefinition({
    auth: options.auth,
    capabilities: options.capabilities ?? ['user'],
    host: options.host,
    localApiBasePath: options.localApiBasePath ?? MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH,
    mode: options.mode,
    namespace: MAGIC_STUDIO_USER_CENTER_NAMESPACE,
    packageNames: options.packageNames ?? [...MAGIC_STUDIO_USER_CENTER_PLUGIN_PACKAGES],
    provider: options.provider,
    routes: {
      authBasePath: '',
      userRoutePath:
        options.routes?.userRoutePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.userRoutePath,
      vipRoutePath:
        options.routes?.vipRoutePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.vipRoutePath,
    },
    storageTopology: options.storageTopology,
    theme: options.theme,
    title: options.title ?? 'Magic Studio User Center',
  });

  return {
    bridgeConfig,
    plugin,
  };
}

function mapMagicStudioUserCenterEnvironmentVariables(
  variables: readonly UserCenterDeploymentVariable[],
  prefix: string,
): MagicStudioUserCenterEnvironmentVariable[] {
  return mapUserCenterDeploymentVariablesToEnvironmentVariables(
    variables,
    prefix,
  ) as MagicStudioUserCenterEnvironmentVariable[];
}

function createMagicStudioDeploymentArtifactFileName(
  kind: UserCenterDeploymentProfile['kind'],
  basename: string,
): string {
  return `magic-studio.${kind}.${basename}`;
}

function createMagicStudioUserCenterClientDeploymentProfile(
  profile: UserCenterDeploymentProfile,
): MagicStudioUserCenterClientDeploymentProfile {
  const runtimeEnv = Object.freeze(mapMagicStudioUserCenterEnvironmentVariables(
    selectUserCenterDeploymentVariables(profile, 'application-runtime'),
    MAGIC_STUDIO_USER_CENTER_RUNTIME_ENV_PREFIX,
  ));
  const gatewayEnv = Object.freeze(mapMagicStudioUserCenterEnvironmentVariables(
    mergeUserCenterDeploymentVariables(
      selectUserCenterDeploymentVariables(profile, 'upstream-bridge'),
      selectUserCenterDeploymentVariables(profile, 'external-authority-bridge'),
      selectUserCenterDeploymentVariables(profile, 'local-authority'),
    ),
    MAGIC_STUDIO_USER_CENTER_GATEWAY_ENV_PREFIX,
  ));
  const runtimeEnvArtifact = Object.freeze(createUserCenterDeploymentEnvArtifact({
    audience: 'application-runtime',
    fileName: createMagicStudioDeploymentArtifactFileName(
      profile.kind,
      MAGIC_STUDIO_USER_CENTER_RUNTIME_ENV_ARTIFACT_BASENAME,
    ),
    headerComment: `Magic Studio ${profile.kind} runtime env`,
    purpose: `Public runtime env artifact for the Magic Studio ${profile.kind} user-center deployment.`,
    variables: runtimeEnv,
  }));
  const gatewayEnvArtifact = Object.freeze(createUserCenterDeploymentEnvArtifact({
    audience: 'gateway-runtime',
    fileName: createMagicStudioDeploymentArtifactFileName(
      profile.kind,
      MAGIC_STUDIO_USER_CENTER_GATEWAY_ENV_ARTIFACT_BASENAME,
    ),
    headerComment: `Magic Studio ${profile.kind} gateway env`,
    purpose: `Private gateway env artifact for the Magic Studio ${profile.kind} user-center deployment.`,
    variables: gatewayEnv,
  }));

  return Object.freeze({
    artifacts: Object.freeze([runtimeEnvArtifact, gatewayEnvArtifact]),
    gatewayEnvArtifact,
    handshakeEnabled: profile.handshake.enabled,
    kind: profile.kind,
    providerKey: profile.providerKey,
    runtimeEnvArtifact,
    standard: profile,
  });
}

function createMagicStudioUserCenterClientDeploymentProfileSet(
  plugin: UserCenterPluginDefinition,
): MagicStudioUserCenterClientDeploymentProfileSet {
  return Object.freeze({
    activeKind: plugin.deployment.activeKind,
    builtinLocal: createMagicStudioUserCenterClientDeploymentProfile(
      plugin.deployment.builtinLocal,
    ),
    externalAppApi: createMagicStudioUserCenterClientDeploymentProfile(
      plugin.deployment.externalAppApi,
    ),
    ...(plugin.deployment.externalUserCenter
      ? {
          externalUserCenter: createMagicStudioUserCenterClientDeploymentProfile(
            plugin.deployment.externalUserCenter,
          ),
        }
      : {}),
  });
}

export function createMagicStudioUserCenterSessionStore(
  storagePlan: MagicStudioUserCenterStoragePlan = MAGIC_STUDIO_USER_CENTER_STORAGE_PLAN,
): MagicStudioUserCenterSessionStore {
  return createUserCenterSessionStore(storagePlan);
}

export function createMagicStudioUserCenterTokenStore(
  storagePlan: MagicStudioUserCenterStoragePlan = MAGIC_STUDIO_USER_CENTER_STORAGE_PLAN,
): MagicStudioUserCenterTokenStore {
  return createUserCenterTokenStore(storagePlan);
}

export function createMagicStudioUserCenterHandshakeSigningMessage(options: {
  config?: MagicStudioUserCenterRuntimeConfig;
  method: 'GET' | 'PATCH' | 'POST';
  path: string;
  signedAt: string;
}): string {
  return createUserCenterHandshakeSigningMessage({
    config: options.config ?? MAGIC_STUDIO_USER_CENTER_RUNTIME_CONFIG,
    method: options.method,
    path: options.path,
    signedAt: options.signedAt,
  });
}

export function createMagicStudioUserCenterSignedHandshakeHeaders(
  signature: MagicStudioUserCenterHandshakeSignature,
  config: MagicStudioUserCenterRuntimeConfig = MAGIC_STUDIO_USER_CENTER_RUNTIME_CONFIG,
) {
  return createUserCenterSignedHandshakeHeaders(config, signature);
}

export function createMagicStudioUserCenterHandshakeVerificationContext(
  options: CreateMagicStudioUserCenterHandshakeVerificationContextOptions,
): MagicStudioUserCenterHandshakeVerificationContext {
  return createUserCenterHandshakeVerificationContext({
    ...options,
    config: options.config ?? MAGIC_STUDIO_USER_CENTER_RUNTIME_CONFIG,
  });
}

export function createMagicStudioUserCenterConfig(
  options: CreateMagicStudioUserCenterConfigOptions = {},
): MagicStudioUserCenterRuntimeConfig {
  return createUserCenterBridgeConfig({
    auth: options.auth,
    localApiBasePath: options.localApiBasePath ?? MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH,
    mode: options.mode,
    namespace: MAGIC_STUDIO_USER_CENTER_NAMESPACE,
    provider: options.provider,
    routes: {
      authBasePath:
        options.routes?.authBasePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.authBasePath,
      userRoutePath:
        options.routes?.userRoutePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.userRoutePath,
      vipRoutePath:
        options.routes?.vipRoutePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.vipRoutePath,
    },
    storageTopology: options.storageTopology,
  });
}

export function createMagicStudioUserCenterPluginDefinition(
  options: CreateMagicStudioUserCenterPluginDefinitionOptions = {},
): MagicStudioUserCenterPluginDefinition {
  const { bridgeConfig, plugin } = createMagicStudioUserCenterBasePluginArtifacts(options);

  return {
    ...plugin,
    bridgeConfig,
    clientDeployment: createMagicStudioUserCenterClientDeploymentProfileSet(plugin),
    integration: bridgeConfig.integration,
    manifests: {
      ...(plugin.manifests.user
        ? {
            user: {
              ...plugin.manifests.user,
              routePath: MAGIC_STUDIO_USER_CENTER_ROUTES.userRoutePath,
              sectionRoutePattern: `${MAGIC_STUDIO_USER_CENTER_ROUTES.userRoutePath}/:section`,
            },
          }
        : {}),
    },
    storageTopology: bridgeConfig.storageTopology,
    storagePlan: bridgeConfig.storagePlan,
  };
}

export function createMagicStudioUserCenterServerPluginDefinition(
  options: CreateMagicStudioUserCenterServerPluginDefinitionOptions = {},
): MagicStudioUserCenterServerPluginDefinition {
  return createUserCenterServerPluginDefinition({
    auth: options.auth,
    description: options.description,
    localApiBasePath: options.localApiBasePath ?? MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH,
    mode: options.mode,
    namespace: MAGIC_STUDIO_USER_CENTER_NAMESPACE,
    packageNames: options.packageNames ?? ['@sdkwork/magic-studio-user'],
    provider: options.provider,
    routes: {
      authBasePath:
        options.routes?.authBasePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.authBasePath,
      userRoutePath:
        options.routes?.userRoutePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.userRoutePath,
      vipRoutePath:
        options.routes?.vipRoutePath ?? MAGIC_STUDIO_USER_CENTER_ROUTES.vipRoutePath,
    },
    storageTopology: options.storageTopology,
    title: options.title ?? 'Magic Studio User Center Server',
  });
}

export function createMagicStudioUserCenterServerValidationPluginDefinition(
  options: CreateMagicStudioUserCenterServerPluginDefinitionOptions = {},
): MagicStudioUserCenterServerValidationPluginDefinition {
  return createUserCenterServerValidationPluginDefinition({
    packageNames: options.packageNames ?? ['@sdkwork/magic-studio-user'],
    title: options.title ?? 'Magic Studio User Center Server Validation',
    userCenterServerPlugin: createMagicStudioUserCenterServerPluginDefinition(options),
  });
}

export function createMagicStudioUserCenterClientDeploymentProfiles(
  options: CreateMagicStudioUserCenterPluginDefinitionOptions = {},
): MagicStudioUserCenterClientDeploymentProfileSet {
  const { plugin } = createMagicStudioUserCenterBasePluginArtifacts(options);
  return createMagicStudioUserCenterClientDeploymentProfileSet(plugin);
}

export const MAGIC_STUDIO_USER_CENTER_RUNTIME_CONFIG = createMagicStudioUserCenterConfig();
