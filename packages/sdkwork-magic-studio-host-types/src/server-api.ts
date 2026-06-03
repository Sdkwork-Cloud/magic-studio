export type MagicStudioApiSurface = 'core' | 'app' | 'admin';
export type MagicStudioApiAuthMode = 'host' | 'user' | 'admin';

export interface MagicStudioApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  version: string;
}

export interface MagicStudioApiEnvelope<T> {
  requestId: string;
  timestamp: string;
  data: T;
  meta: MagicStudioApiMeta;
}

export interface MagicStudioApiListEnvelope<T> {
  requestId: string;
  timestamp: string;
  items: T[];
  meta: Required<Pick<MagicStudioApiMeta, 'page' | 'pageSize' | 'total' | 'version'>>;
}

export interface MagicStudioApiProblemDetails {
  code: string;
  message: string;
  detail?: string;
  retryable: boolean;
  fieldErrors?: Record<string, string>;
}

export interface MagicStudioApiProblemEnvelope {
  requestId: string;
  timestamp: string;
  error: MagicStudioApiProblemDetails;
}

export interface MagicStudioApiRouteDefinition {
  id: string;
  authMode: MagicStudioApiAuthMode;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  surface: MagicStudioApiSurface;
  summary: string;
}

export interface MagicStudioApiContractRoute extends MagicStudioApiRouteDefinition {
  requestBodySchema?: string;
  successResponseSchema?: string;
}

export interface MagicStudioApiRouteCatalogEntry extends MagicStudioApiRouteDefinition {
  openApiPath: string;
  operationId: string;
}

export interface MagicStudioApiGatewaySurfaceSummary {
  authMode: MagicStudioApiAuthMode;
  basePath: string;
  description: string;
  name: MagicStudioApiSurface;
  routeCount: number;
}

export interface MagicStudioApiGatewaySummary {
  basePath: string;
  docsPath: string;
  liveOpenApiPath: string;
  openApiPath: string;
  routeCatalogPath: string;
  routeCount: number;
  routesBySurface: Record<MagicStudioApiSurface, number>;
  surfaces: readonly MagicStudioApiGatewaySurfaceSummary[];
}

export interface MagicStudioApiContractMeta {
  healthRouteId: string;
  docsPath: string;
  openApiPath: string;
  liveOpenApiPath: string;
  routeCatalogRouteId: string;
  runtimeSummaryRouteId: string;
}

export interface MagicStudioApiContractSurface {
  authMode: MagicStudioApiAuthMode;
  basePath: string;
  description: string;
  name: MagicStudioApiSurface;
}

export interface MagicStudioServerContract {
  apiVersion: string;
  meta: MagicStudioApiContractMeta;
  routes: MagicStudioApiContractRoute[];
  surfaces: MagicStudioApiContractSurface[];
}
