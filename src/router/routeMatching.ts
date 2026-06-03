export interface RouteMatchResult {
  matched: boolean;
  params: Record<string, string>;
}

export const normalizeRoutePath = (path: string): string => {
  const trimmed = (path || '').trim();
  if (!trimmed) {
    return '/';
  }
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
};

const splitRoutePath = (path: string): string[] => {
  const normalized = normalizeRoutePath(path);
  if (normalized === '/') {
    return [];
  }
  return normalized.slice(1).split('/');
};

export const matchRoutePath = (routePath: string, currentPath: string): RouteMatchResult => {
  const routeParts = splitRoutePath(routePath);
  const currentParts = splitRoutePath(currentPath);

  if (routeParts.length !== currentParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    const currentPart = currentParts[index];

    if (routePart.startsWith(':')) {
      params[routePart.slice(1)] = currentPart;
      continue;
    }

    if (routePart !== currentPart) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
};

export const matchRoutePrefix = (routePrefix: string, currentPath: string): boolean => {
  const normalizedPrefix = normalizeRoutePath(routePrefix);
  const normalizedCurrent = normalizeRoutePath(currentPath);

  return (
    normalizedCurrent === normalizedPrefix ||
    normalizedCurrent.startsWith(`${normalizedPrefix}/`)
  );
};
