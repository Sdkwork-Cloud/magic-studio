import type { RouteConfig } from '@sdkwork/magic-studio-core/router';

export interface PackageRouteConfig {
    basePath: string;
    routes: RouteConfig[];
    guards?: RouteGuard[];
    meta?: Record<string, RouteMeta>;
}

export interface RouteGuard {
    name: string;
    beforeEnter?: (to: any, from: any) => boolean | Promise<boolean>;
    afterEnter?: (to: any, from: any) => void;
}

export interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    layout?: 'full' | 'sidebar' | 'none';
    keepAlive?: boolean;
}
