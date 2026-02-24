import type { RouteObject } from 'react-router-dom';

export interface PackageRouteConfig {
    basePath: string;
    routes: RouteObject[];
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
