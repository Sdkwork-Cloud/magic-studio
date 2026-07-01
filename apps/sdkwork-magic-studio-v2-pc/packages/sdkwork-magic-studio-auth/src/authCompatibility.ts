export interface SharedAuthUserLike {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  id?: string;
  username?: string;
}

export interface CompatAuthUser {
  avatar?: string;
  avatarUrl?: string;
  createdAt: number;
  deletedAt?: string | null;
  email: string;
  id: string;
  isVip?: boolean;
  lastLoginAt?: number;
  name: string;
  phone?: string;
  updatedAt: number;
  username?: string;
  uuid: string;
}

export interface NavigationTarget {
  pathname: string;
  search: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value || '').trim();
}

export function parseNavigationTarget(to: string, fallbackPathname = '/'): NavigationTarget {
  const trimmedTarget = to.trim();
  if (!trimmedTarget) {
    return {
      pathname: fallbackPathname,
      search: '',
    };
  }

  if (trimmedTarget.startsWith('?')) {
    return {
      pathname: fallbackPathname,
      search: trimmedTarget,
    };
  }

  const [pathname, rawSearch = ''] = trimmedTarget.split('?');
  return {
    pathname: pathname || fallbackPathname,
    search: rawSearch ? `?${rawSearch}` : '',
  };
}

export function isAuthFlowRoute(pathname: string): boolean {
  const normalizedPath = normalizeText(pathname);
  if (!normalizedPath) {
    return false;
  }

  return normalizedPath === '/auth'
    || normalizedPath === '/login'
    || normalizedPath === '/auth/login'
    || normalizedPath.startsWith('/auth/register')
    || normalizedPath.startsWith('/auth/forgot-password')
    || normalizedPath.startsWith('/auth/oauth/callback');
}

export function shouldInvokeLoginSuccess(pathname: string): boolean {
  return !isAuthFlowRoute(pathname);
}

export function resolveCompatAuthUser(
  user: SharedAuthUserLike | null | undefined,
  timestamp = Date.now(),
): CompatAuthUser | null {
  if (!user) {
    return null;
  }

  const email = normalizeText(user.email);
  const username = normalizeText(user.username) || undefined;
  const avatarUrl = normalizeText(user.avatarUrl) || undefined;
  const identifier = normalizeText(user.id) || username || email || 'current-user';
  const displayName = normalizeText(user.displayName) || username || email || identifier;

  return {
    avatar: avatarUrl,
    avatarUrl,
    createdAt: timestamp,
    email,
    id: identifier,
    name: displayName,
    updatedAt: timestamp,
    username,
    uuid: identifier,
  };
}
