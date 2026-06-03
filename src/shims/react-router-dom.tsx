import React, {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useOptionalRouter } from '@sdkwork/magic-studio-core/router';

interface LocationLike {
  hash: string;
  key: string;
  pathname: string;
  search: string;
  state: null;
}

interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

type NavigateFunction = (to: string, options?: NavigateOptions) => void;

interface RouterContextValue {
  location: LocationLike;
  navigate: NavigateFunction;
}

interface RouterShimOverrideContextValue {
  location?: Partial<LocationLike>;
  navigate?: NavigateFunction;
  params?: Record<string, string>;
}

interface RouteProps {
  element: ReactNode;
  path: string;
}

interface MemoryRouterProps {
  children: ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}

interface RoutesProps {
  children: ReactNode;
}

interface HashRouterProps {
  children: ReactNode;
}

interface NavigateProps {
  replace?: boolean;
  to: string;
}

interface RouterShimProviderProps {
  children: ReactNode;
  navigate?: NavigateFunction;
  params?: Record<string, string>;
  pathname?: string;
  search?: string;
}

type SearchParamsInit =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams;

const RouterContext = createContext<RouterContextValue | null>(null);
const RouterShimOverrideContext = createContext<RouterShimOverrideContextValue | null>(null);
const RouteParamsContext = createContext<Record<string, string>>({});

function normalizeSearch(search: string): string {
  if (!search) {
    return '';
  }

  return search.startsWith('?') ? search : `?${search}`;
}

function createLocation(pathname: string, search = ''): LocationLike {
  const normalizedPathname = pathname.trim() || '/';
  const normalizedSearch = normalizeSearch(search.trim());
  return {
    hash: '',
    key: `${normalizedPathname}${normalizedSearch}`,
    pathname: normalizedPathname,
    search: normalizedSearch,
    state: null,
  };
}

function splitTarget(to: string, fallbackPathname: string): {
  pathname: string;
  search: string;
} {
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

function matchRoutePattern(pattern: string, pathname: string): {
  matched: boolean;
  params: Record<string, string>;
} {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return {
      matched: false,
      params: {},
    };
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return {
        matched: false,
        params: {},
      };
    }
  }

  return {
    matched: true,
    params,
  };
}

function toSearchParamsValue(next: SearchParamsInit): string {
  if (typeof next === 'string') {
    return next.startsWith('?') ? next.slice(1) : next;
  }

  if (next instanceof URLSearchParams) {
    return next.toString();
  }

  if (Array.isArray(next)) {
    return new URLSearchParams(next).toString();
  }

  return new URLSearchParams(next).toString();
}

function toInitialRouterEntry(initialEntries: string[], initialIndex?: number): string {
  if (initialEntries.length === 0) {
    return '/';
  }

  const resolvedIndex = Math.max(
    0,
    Math.min(initialIndex ?? initialEntries.length - 1, initialEntries.length - 1),
  );
  return initialEntries[resolvedIndex] ?? '/';
}

function readHashRouterEntry(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const hash = window.location.hash.trim();
  if (!hash || hash === '#') {
    return '/';
  }

  const rawEntry = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!rawEntry) {
    return '/';
  }

  if (rawEntry.startsWith('/') || rawEntry.startsWith('?')) {
    return rawEntry;
  }

  return `/${rawEntry}`;
}

function useResolvedRouterState(): {
  location: LocationLike;
  navigate: NavigateFunction;
  params: Record<string, string>;
} {
  const shimRouter = useContext(RouterContext);
  const override = useContext(RouterShimOverrideContext);
  const routeParams = useContext(RouteParamsContext);
  const router = useOptionalRouter();
  const routerPath = router?.currentPath ?? '/';
  const routerQuery = router?.currentQuery ?? '';
  const routerNavigate = router?.navigate;
  const overrideNavigate = override?.navigate;
  const currentPath = override?.location?.pathname ?? routerPath;
  const currentSearch = override?.location?.search
    ?? (routerQuery ? `?${routerQuery}` : '');

  const location = useMemo<LocationLike>(
    () => shimRouter?.location ?? createLocation(currentPath, currentSearch),
    [currentPath, currentSearch, shimRouter?.location]
  );

  const navigate = useCallback<NavigateFunction>(
    (to, _options) => {
      if (shimRouter) {
        shimRouter.navigate(to, _options);
        return;
      }

      const nextTarget = splitTarget(to, currentPath);
      const nextQuery = nextTarget.search.startsWith('?')
        ? nextTarget.search.slice(1)
        : nextTarget.search;
      const normalizedCurrentSearch = normalizeSearch(currentSearch);

      if (
        nextTarget.pathname === currentPath
        && nextTarget.search === normalizedCurrentSearch
      ) {
        return;
      }

      if (overrideNavigate) {
        overrideNavigate(to, _options);
        return;
      }

      routerNavigate?.(nextTarget.pathname, nextQuery);
    },
    [currentPath, currentSearch, shimRouter, overrideNavigate, routerNavigate]
  );

  const params = useMemo<Record<string, string>>(
    () => (Object.keys(routeParams).length > 0 ? routeParams : override?.params ?? {}),
    [override?.params, routeParams]
  );

  return useMemo(
    () => ({
      location,
      navigate,
      params,
    }),
    [location, navigate, params]
  );
}

export function MemoryRouter({
  children,
  initialEntries = ['/'],
  initialIndex,
}: MemoryRouterProps) {
  const initialTarget = splitTarget(
    toInitialRouterEntry(initialEntries, initialIndex),
    '/',
  );
  const [location, setLocation] = useState<LocationLike>(() =>
    createLocation(initialTarget.pathname, initialTarget.search)
  );

  const navigate = useMemo<NavigateFunction>(
    () => (to) => {
      const nextTarget = splitTarget(to, location.pathname);
      setLocation(createLocation(nextTarget.pathname, nextTarget.search));
    },
    [location.pathname]
  );

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function HashRouter({ children }: HashRouterProps) {
  const [location, setLocation] = useState<LocationLike>(() => {
    const initialTarget = splitTarget(readHashRouterEntry(), '/');
    return createLocation(initialTarget.pathname, initialTarget.search);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncFromHash = () => {
      const nextTarget = splitTarget(readHashRouterEntry(), '/');
      setLocation((currentLocation) => {
        const nextLocation = createLocation(nextTarget.pathname, nextTarget.search);
        return currentLocation.key === nextLocation.key ? currentLocation : nextLocation;
      });
    };

    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigate = useMemo<NavigateFunction>(
    () => (to, options) => {
      const nextTarget = splitTarget(to, location.pathname);
      const nextLocation = createLocation(nextTarget.pathname, nextTarget.search);

      if (nextLocation.key === location.key) {
        return;
      }

      setLocation(nextLocation);

      if (typeof window !== 'undefined') {
        const nextHash = `#${nextLocation.pathname}${nextLocation.search}`;
        if (options?.replace) {
          window.history.replaceState(window.history.state, '', nextHash);
        } else {
          window.location.hash = nextHash;
        }
      }
    },
    [location.key, location.pathname]
  );

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children }: RoutesProps) {
  const { location } = useResolvedRouterState();
  const childElements = Children.toArray(children).filter((child): child is React.ReactElement<RouteProps> => {
    return isValidElement<RouteProps>(child);
  });

  for (const child of childElements) {
    const match = matchRoutePattern(child.props.path, location.pathname);
    if (!match.matched) {
      continue;
    }

    return (
      <RouteParamsContext.Provider value={match.params}>
        {child.props.element}
      </RouteParamsContext.Provider>
    );
  }

  return null;
}

export function Navigate({ replace, to }: NavigateProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const target = splitTarget(to, location.pathname);
    if (
      target.pathname === location.pathname
      && target.search === normalizeSearch(location.search)
    ) {
      return;
    }

    navigate(to, { replace });
  }, [location.pathname, location.search, navigate, replace, to]);

  return null;
}

export function useLocation(): LocationLike {
  return useResolvedRouterState().location;
}

export function useNavigate(): NavigateFunction {
  return useResolvedRouterState().navigate;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInit, options?: NavigateOptions) => void,
] {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search.startsWith('?') ? location.search.slice(1) : location.search),
    [location.search]
  );

  const setSearchParams = useCallback(
    (next: SearchParamsInit, options?: NavigateOptions) => {
      const nextSearch = toSearchParamsValue(next);
      navigate(
        nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname,
        options
      );
    },
    [location.pathname, navigate]
  );

  return [searchParams, setSearchParams];
}

export function useParams<T extends Record<string, string>>() {
  return useResolvedRouterState().params as T;
}

export function useInRouterContext(): boolean {
  return useContext(RouterContext) !== null || useContext(RouterShimOverrideContext) !== null;
}

export function RouterShimProvider({
  children,
  navigate,
  params,
  pathname,
  search,
}: RouterShimProviderProps) {
  const value = useMemo<RouterShimOverrideContextValue>(
    () => ({
      ...(navigate ? { navigate } : {}),
      ...(params ? { params } : {}),
      ...(pathname !== undefined || search !== undefined
        ? {
            location: {
              ...(pathname !== undefined ? { pathname } : {}),
              ...(search !== undefined ? { search } : {}),
            },
          }
        : {}),
    }),
    [navigate, params, pathname, search]
  );

  return (
    <RouterShimOverrideContext.Provider value={value}>
      {children}
    </RouterShimOverrideContext.Provider>
  );
}

export { RouterShimProvider as SdkworkRouterShimProvider };
