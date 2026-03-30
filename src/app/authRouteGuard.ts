export type AuthRouteAccess = 'allow' | 'pending' | 'redirect';

export interface ResolveAuthRouteAccessInput {
  requiresAuth?: boolean;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
}

export function resolveAuthRouteAccess(
  input: ResolveAuthRouteAccessInput
): AuthRouteAccess {
  if (!input.requiresAuth) {
    return 'allow';
  }
  if (!input.isAuthResolved) {
    return 'pending';
  }
  return input.isAuthenticated ? 'allow' : 'redirect';
}

export function buildLoginRedirectQuery(path: string, query: string = ''): string {
  const normalizedPath = String(path || '').trim() || '/';
  const normalizedQuery = String(query || '').trim();
  const redirectTarget = normalizedQuery
    ? `${normalizedPath}?${normalizedQuery}`
    : normalizedPath;
  return `redirect=${encodeURIComponent(redirectTarget)}`;
}

export function resolvePostLoginTarget(
  currentQuery: string,
  fallbackPath: string
): { path: string; query: string } {
  const params = new URLSearchParams(currentQuery || '');
  const redirectTarget = String(params.get('redirect') || '').trim();
  if (!redirectTarget) {
    return {
      path: fallbackPath,
      query: '',
    };
  }

  const [pathPart, ...queryParts] = redirectTarget.split('?');
  const path = pathPart.trim() || fallbackPath;
  const isSafeInternalPath = path.startsWith('/') && !path.startsWith('//');

  if (!isSafeInternalPath) {
    return {
      path: fallbackPath,
      query: '',
    };
  }

  return {
    path,
    query: queryParts.join('?').trim(),
  };
}
