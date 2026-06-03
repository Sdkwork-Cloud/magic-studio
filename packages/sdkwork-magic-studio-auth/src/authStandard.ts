import {
  createAuthRouteCatalog,
  createAuthRouteIntent,
  createAuthWorkspaceManifest,
  type CreateAuthRouteIntentOptions,
  type CreateAuthWorkspaceManifestOptions,
  type SdkworkAuthRouteDefinition,
  type SdkworkAuthRouteId,
  type SdkworkAuthRouteIntent,
  type SdkworkAuthWorkspaceManifest,
} from '@sdkwork/auth-pc-react';

export type MagicStudioAuthRouteId = SdkworkAuthRouteId;
export type MagicStudioAuthRouteDefinition = SdkworkAuthRouteDefinition;
export type MagicStudioAuthRouteIntent = SdkworkAuthRouteIntent;
export type MagicStudioAuthWorkspaceManifest = SdkworkAuthWorkspaceManifest;

export interface CreateMagicStudioAuthWorkspaceManifestOptions
  extends Omit<CreateAuthWorkspaceManifestOptions, 'packageNames'> {
  basePath?: string;
  packageNames?: readonly string[];
}

export interface CreateMagicStudioAuthRouteIntentOptions
  extends Omit<CreateAuthRouteIntentOptions, 'routes'> {
  basePath?: string;
  routes?: readonly MagicStudioAuthRouteDefinition[];
}

export const MAGIC_STUDIO_AUTH_SOURCE_PACKAGE = '@sdkwork/auth-pc-react';
export const MAGIC_STUDIO_AUTH_BRIDGE_PACKAGE = '@sdkwork/magic-studio-auth';
export const MAGIC_STUDIO_AUTH_BASE_PATH = '/auth';
export const MAGIC_STUDIO_AUTH_WORKSPACE_ID = 'sdkwork-magic-studio-auth';

function toUniquePackageNames(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function resolveMagicStudioAuthRoutePath(
  routeId: MagicStudioAuthRouteId,
  routes: readonly MagicStudioAuthRouteDefinition[],
): string {
  const route = routes.find((candidate) => candidate.id === routeId);
  if (!route) {
    throw new Error(`Unknown Magic Studio auth route id: ${routeId}`);
  }

  return route.path;
}

export function createMagicStudioAuthRouteCatalog(
  basePath = MAGIC_STUDIO_AUTH_BASE_PATH,
): MagicStudioAuthRouteDefinition[] {
  return createAuthRouteCatalog(basePath);
}

export function createMagicStudioAuthWorkspaceManifest(
  options: CreateMagicStudioAuthWorkspaceManifestOptions = {},
): MagicStudioAuthWorkspaceManifest {
  const routes = createMagicStudioAuthRouteCatalog(
    options.loginRoutePath?.replace(/\/login$/u, '')
    || options.basePath
    || MAGIC_STUDIO_AUTH_BASE_PATH,
  );

  return createAuthWorkspaceManifest({
    description:
      options.description
      ?? 'Magic Studio auth workspace aligned to sdkwork-appbase login, recovery, OAuth callback, and QR-entry standards.',
    forgotPasswordRoutePath:
      options.forgotPasswordRoutePath
      ?? resolveMagicStudioAuthRoutePath('forgot-password', routes),
    host: options.host,
    id: options.id ?? MAGIC_STUDIO_AUTH_WORKSPACE_ID,
    loginRoutePath:
      options.loginRoutePath
      ?? resolveMagicStudioAuthRoutePath('login', routes),
    oauthCallbackRoutePattern:
      options.oauthCallbackRoutePattern
      ?? resolveMagicStudioAuthRoutePath('oauth-callback', routes),
    packageNames: toUniquePackageNames(
      options.packageNames ?? [MAGIC_STUDIO_AUTH_BRIDGE_PACKAGE],
    ),
    qrRoutePath:
      options.qrRoutePath
      ?? resolveMagicStudioAuthRoutePath('qr-login', routes),
    registerRoutePath:
      options.registerRoutePath
      ?? resolveMagicStudioAuthRoutePath('register', routes),
    theme: options.theme,
    title: options.title ?? 'Magic Studio Auth',
  });
}

export function createMagicStudioAuthRouteIntent(
  routeId: MagicStudioAuthRouteId,
  options: CreateMagicStudioAuthRouteIntentOptions = {},
): MagicStudioAuthRouteIntent {
  return createAuthRouteIntent(routeId, {
    focusWindow: options.focusWindow,
    provider: options.provider,
    redirectTo: options.redirectTo,
    routes: options.routes ?? createMagicStudioAuthRouteCatalog(
      options.basePath ?? MAGIC_STUDIO_AUTH_BASE_PATH,
    ),
  });
}

export const magicStudioAuthPackageMeta = {
  bridgePackage: MAGIC_STUDIO_AUTH_BRIDGE_PACKAGE,
  domain: 'user_center',
  package: MAGIC_STUDIO_AUTH_SOURCE_PACKAGE,
  status: 'ready',
} as const;

export type MagicStudioAuthPackageMeta = typeof magicStudioAuthPackageMeta;
