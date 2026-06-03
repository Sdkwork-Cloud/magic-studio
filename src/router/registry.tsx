import { advancedRoutes, generationRoutes, mainRoutes } from './registry/sections';
import type { RouteDefinition } from './registry/types';

export type { LayoutType, RouteDefinition } from './registry/types';

export const APP_ROUTES: RouteDefinition[] = [
  ...mainRoutes,
  ...generationRoutes,
  ...advancedRoutes,
];
