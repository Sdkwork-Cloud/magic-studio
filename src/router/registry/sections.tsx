import {
  advancedRouteSpecs,
  generationRouteSpecs,
  mainRouteSpecs,
} from './specs';
import { routeComponents, routeLeftPanes, routeProviders } from './runtime';
import type { RouteDefinition, RouteSpec } from './types';

const materializeRouteDefinition = (spec: RouteSpec): RouteDefinition => {
  const routeDefinition: RouteDefinition = {
    path: spec.path,
    component: routeComponents[spec.componentKey],
    layout: spec.layout,
  };

  if (spec.leftPaneKey) {
    routeDefinition.leftPane = routeLeftPanes[spec.leftPaneKey];
  }

  if (spec.providerKey) {
    routeDefinition.provider = routeProviders[spec.providerKey];
  }

  return routeDefinition;
};

export const mainRoutes: RouteDefinition[] = mainRouteSpecs.map(materializeRouteDefinition);
export const generationRoutes: RouteDefinition[] =
  generationRouteSpecs.map(materializeRouteDefinition);
export const advancedRoutes: RouteDefinition[] =
  advancedRouteSpecs.map(materializeRouteDefinition);
