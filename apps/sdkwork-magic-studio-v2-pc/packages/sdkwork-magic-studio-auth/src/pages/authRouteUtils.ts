import { ROUTES } from '@sdkwork/magic-studio-core/router';

function normalizeRedirectTarget(path: string): string {
  return path.split(/[?#]/, 1)[0] ?? path;
}

export function resolveRedirectTarget(
  rawTarget: string | null | undefined,
  homePath: string = ROUTES.HOME,
): string {
  const normalizedTarget = rawTarget?.trim();
  if (!normalizedTarget || !normalizedTarget.startsWith('/')) {
    return homePath;
  }

  const redirectPath = normalizeRedirectTarget(normalizedTarget);
  const blockedExactRoutes = new Set<string>([
    ROUTES.LOGIN,
    ROUTES.AUTH_LOGIN,
    ROUTES.AUTH_REGISTER,
    ROUTES.AUTH_FORGOT_PASSWORD,
  ]);

  if (
    blockedExactRoutes.has(redirectPath)
    || redirectPath.startsWith('/auth/oauth/callback')
  ) {
    return homePath;
  }

  return normalizedTarget;
}

export function buildLoginPath(
  redirectTarget: string,
  homePath: string = ROUTES.HOME,
): string {
  if (redirectTarget === homePath) {
    return ROUTES.LOGIN;
  }

  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectTarget)}`;
}

export function buildAuthPath(
  pathname: string,
  redirectTarget: string,
  homePath: string = ROUTES.HOME,
): string {
  if (redirectTarget === homePath) {
    return pathname;
  }

  return `${pathname}?redirect=${encodeURIComponent(redirectTarget)}`;
}

export function buildOAuthCallbackUri(
  provider: string,
  redirectTarget: string,
  homePath: string = ROUTES.HOME,
): string {
  if (typeof window === 'undefined' || !window.location?.origin) {
    throw new Error('OAuth callback URL is unavailable in the current runtime.');
  }

  const callbackUrl = new URL(
    ROUTES.AUTH_OAUTH_CALLBACK.replace(':provider', provider.trim()),
    window.location.origin,
  );

  if (redirectTarget !== homePath) {
    callbackUrl.searchParams.set('redirect', redirectTarget);
  }

  return callbackUrl.toString();
}
