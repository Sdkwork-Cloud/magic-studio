import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { RoutePath, RouterContextValue } from './types';

interface RouterProviderProps {
    children: ReactNode;
    defaultPath?: RoutePath;
    onRouteChange?: (path: RoutePath, query: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export const RouterProvider: React.FC<RouterProviderProps> = ({
    children,
    defaultPath = '/',
    onRouteChange
}) => {
    const [currentPath, setCurrentPath] = useState<RoutePath>(() => {
        if (typeof window !== 'undefined') {
            if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') {
                return defaultPath;
            }
            return window.location.pathname as RoutePath;
        }
        return defaultPath;
    });

    const [currentQuery, setCurrentQuery] = useState<string>(() => {
        if (typeof window !== 'undefined' &&
            window.location.protocol !== 'blob:' &&
            window.location.protocol !== 'data:') {
            return window.location.search.substring(1);
        }
        return '';
    });

    const [previousPath, setPreviousPath] = useState<RoutePath | undefined>();
    const currentPathRef = useRef<RoutePath>(currentPath);
    const currentQueryRef = useRef<string>(currentQuery);

    useEffect(() => {
        currentPathRef.current = currentPath;
    }, [currentPath]);

    useEffect(() => {
        currentQueryRef.current = currentQuery;
    }, [currentQuery]);

    useEffect(() => {
        const handlePopState = () => {
            if (typeof window !== 'undefined') {
                if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return;

                const path = window.location.pathname as RoutePath;
                const query = window.location.search.substring(1);
                if (path === currentPathRef.current && query === currentQueryRef.current) {
                    return;
                }

                setPreviousPath(currentPathRef.current);
                setCurrentPath(path);
                setCurrentQuery(query);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = useCallback((path: RoutePath, query?: string) => {
        const normalizedQuery = query || '';
        if (path === currentPath && normalizedQuery === currentQuery) {
            return;
        }

        setPreviousPath(currentPath);
        setCurrentPath(path);
        setCurrentQuery(normalizedQuery);

        if (typeof window !== 'undefined') {
            if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') {
                console.debug('[Router] Skipping history push in restricted environment');
                return;
            }

            const url = normalizedQuery ? `${path}?${normalizedQuery}` : path;
            try {
                window.history.pushState({}, '', url);
            } catch (e) {
                console.warn('[Router] History update skipped due to environment restriction:', e);
            }
        }

        onRouteChange?.(path, normalizedQuery);
    }, [currentPath, currentQuery, onRouteChange]);

    const goBack = useCallback(() => {
        if (previousPath) {
            navigate(previousPath);
        } else if (typeof window !== 'undefined') {
            window.history.back();
        }
    }, [previousPath, navigate]);

    const getRouteParams = useCallback(<T extends Record<string, string>>(): T => {
        const params: Record<string, string> = {};
        const searchParams = new URLSearchParams(currentQuery);
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params as T;
    }, [currentQuery]);

    const value = useMemo(() => {
        return ({ currentPath, currentQuery, navigate, goBack, getRouteParams });
    }, [
        currentPath,
        currentQuery,
        navigate,
        goBack,
        getRouteParams
    ]);

    return (
        <RouterContext.Provider value={value}>
            {children}
        </RouterContext.Provider>
    );
};

export const useRouter = (): RouterContextValue => {
    const context = useContext(RouterContext);
    if (!context) {
        // Return a default router context instead of throwing
        // This prevents errors during SSR or when components render outside RouterProvider
        console.warn('[useRouter] Router context not found, using default values. Make sure your component is wrapped with RouterProvider.');
        return {
            currentPath: '/' as RoutePath,
            currentQuery: '',
            navigate: () => {
                console.warn('[useRouter] navigate called without RouterProvider');
            },
            goBack: () => {
                console.warn('[useRouter] goBack called without RouterProvider');
            },
            getRouteParams: <T extends Record<string, string>>(): T => ({} as T)
        };
    }
    return context;
};

export const useOptionalRouter = (): RouterContextValue | null => {
    return useContext(RouterContext) ?? null;
};

export const useCurrentPath = (): RoutePath => {
    const { currentPath } = useRouter();
    return currentPath;
};

export const useNavigate = () => {
    const { navigate } = useRouter();
    return navigate;
};

export const useRouteParams = <T extends Record<string, string>>(): T => {
    const { getRouteParams } = useRouter();
    return getRouteParams<T>();
};
