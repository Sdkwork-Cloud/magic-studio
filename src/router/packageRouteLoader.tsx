import {
  APP_ROUTES,
  type LayoutType,
  type RouteDefinition,
} from './registry';

// Legacy compatibility facade. The canonical route registry lives in registry.tsx.
export type { LayoutType, RouteDefinition };
export const PACKAGE_BASED_ROUTES: RouteDefinition[] = [...APP_ROUTES];
export const FALLBACK_ROUTES: RouteDefinition[] = [];
export const COMPLETE_ROUTE_REGISTRY: RouteDefinition[] = [...APP_ROUTES];
