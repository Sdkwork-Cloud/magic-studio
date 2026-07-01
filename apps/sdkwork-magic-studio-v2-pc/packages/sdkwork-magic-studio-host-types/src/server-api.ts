/**
 * Standard SDKWork API response envelope (`API_SPEC.md` §4.5, §15.1).
 *
 * Success: `{ "code": 0, "data": <payload>, "traceId": "<uuid>" }`.
 */
export interface SdkWorkApiResponse<T> {
  code: number;
  data: T;
  traceId: string;
}

/**
 * Standard single-resource payload inside `SdkWorkApiResponse.data`.
 */
export interface SdkWorkResourceData<T> {
  item: T;
}

/**
 * Standard command payload inside `SdkWorkApiResponse.data`.
 */
export interface SdkWorkCommandData {
  accepted: boolean;
  resourceId?: string;
  status?: string;
}

/**
 * Standard pagination mode (`API_SPEC.md` §16).
 */
export type SdkWorkPageMode = 'offset' | 'cursor';

/**
 * Standard pagination metadata (`API_SPEC.md` §16).
 */
export interface SdkWorkPageInfo {
  mode: SdkWorkPageMode;
  page?: number;
  pageSize?: number;
  totalItems?: string;
  totalPages?: number;
  nextCursor?: string;
  hasMore?: boolean;
}

/**
 * Standard list payload inside `SdkWorkApiResponse.data`.
 */
export interface SdkWorkPageData<T> {
  items: T[];
  pageInfo: SdkWorkPageInfo;
}

/**
 * RFC 9457 `application/problem+json` body (`API_SPEC.md` §15.2).
 */
export interface SdkWorkProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: number;
  traceId: string;
  operationId?: string;
}

// ── Backward-compatible type aliases ──────────────────────────────────────────
// These aliases allow existing consumers to transition gradually.
// New code SHOULD use the standard SdkWork* types directly.

/**
 * @deprecated Use `SdkWorkPageInfo` instead.
 */
export type MagicStudioApiMeta = SdkWorkPageInfo;

/**
 * @deprecated Use `SdkWorkApiResponse<SdkWorkResourceData<T>>` instead.
 */
export type MagicStudioApiEnvelope<T> = SdkWorkApiResponse<SdkWorkResourceData<T>>;

/**
 * @deprecated Use `SdkWorkApiResponse<SdkWorkPageData<T>>` instead.
 */
export type MagicStudioApiListEnvelope<T> = SdkWorkApiResponse<SdkWorkPageData<T>>;

/**
 * @deprecated Use `SdkWorkProblemDetail` instead.
 */
export type MagicStudioApiProblemDetails = SdkWorkProblemDetail;

/**
 * @deprecated Use `SdkWorkProblemDetail` instead.
 */
export type MagicStudioApiProblemEnvelope = SdkWorkProblemDetail;

// ── Route / contract types (unchanged) ────────────────────────────────────────

export type MagicStudioApiSurface = 'core' | 'app' | 'admin';
export type MagicStudioApiAuthMode = 'host' | 'user' | 'admin';

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
