import type { PackageRouteConfig } from './types';
import { lazy } from 'react';

const PromptOptimizerPage = lazy(() => import('../pages/PromptOptimizerPage'));

export const defaultRoutes: PackageRouteConfig = {
    basePath: '/prompt',
    routes: [
        {
            path: '',
            name: 'Prompt Optimizer',
            component: PromptOptimizerPage,
        },
        {
            path: 'optimize',
            name: 'Optimize Prompt',
            component: PromptOptimizerPage,
        },
    ],
    meta: {
        '/prompt': { title: 'Prompt Optimizer', layout: 'sidebar', requiresAuth: false },
        '/prompt/optimize': { title: 'Optimize Prompt', layout: 'sidebar', requiresAuth: false },
    },
};

export default defaultRoutes;

export function createRoutes(overrides?: Partial<PackageRouteConfig>): PackageRouteConfig {
    if (!overrides) return defaultRoutes;
    
    return {
        basePath: overrides.basePath ?? defaultRoutes.basePath,
        routes: overrides.routes ?? defaultRoutes.routes,
        guards: [...(defaultRoutes.guards || []), ...(overrides.guards || [])],
        meta: { ...defaultRoutes.meta, ...overrides.meta },
    };
}

export function getRoutes(basePath?: string): PackageRouteConfig['routes'] {
    const prefix = basePath ?? defaultRoutes.basePath;
    return defaultRoutes.routes.map(route => ({
        ...route,
        path: `${prefix}${route.path}`,
    }));
}
