export const createRoute = (path: string, name: string, options?: Partial<import('./types').RouteConfig>): import('./types').RouteConfig => ({
    path,
    name,
    ...options
});

export const createRoutes = (routes: import('./types').RouteConfig[]): import('./types').RouteConfig[] => {
    return routes;
};

export const matchRoute = (path: string, routes: import('./types').RouteConfig[]): import('./types').RouteConfig | undefined => {
    for (const route of routes) {
        if (route.path === path) {
            return route;
        }
        if (route.children) {
            const matched = matchRoute(path, route.children);
            if (matched) return matched;
        }
    }
    return undefined;
};

export const isRouteActive = (currentPath: string, routePath: string): boolean => {
    return currentPath === routePath || currentPath.startsWith(routePath + '/');
};
