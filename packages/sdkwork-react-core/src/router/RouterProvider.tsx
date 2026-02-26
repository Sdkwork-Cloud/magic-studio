import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
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

    useEffect(() => {
        const handlePopState = () => {
            if (typeof window !== 'undefined') {
                if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') return;

                const path = window.location.pathname as RoutePath;
                setPreviousPath((_prev) => currentPath);
                setCurrentPath(path);
                setCurrentQuery(window.location.search.substring(1));
                console.log('[Router] popstate: path changed to', path);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [currentPath]);

    const navigate = useCallback((path: RoutePath, query?: string) => {
        console.log('[Router] navigate called:', path, query);

        // Use functional update to get the latest currentPath value
        setPreviousPath((_prev) => {
            // We can't compare path here because we don't have access to currentPath
            // So we always update
            return _prev;
        });

        console.log('[Router] setCurrentPath:', path);
        // Update current path
        setCurrentPath(path);
        setCurrentQuery(query || '');

        if (typeof window !== 'undefined') {
            if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') {
                console.debug('[Router] Skipping history push in restricted environment');
                return;
            }

            const url = query ? `${path}?${query}` : path;
            console.log('[Router] pushState:', url);
            try {
                window.history.pushState({}, '', url);
            } catch (e) {
                console.warn('[Router] History update skipped due to environment restriction:', e);
            }
        }

        onRouteChange?.(path, query || '');
    }, [onRouteChange]);

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
        console.log('[Router] useMemo value created:', currentPath);
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
    console.log('[useRouter] returning context:', context.currentPath);
    return context;
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
