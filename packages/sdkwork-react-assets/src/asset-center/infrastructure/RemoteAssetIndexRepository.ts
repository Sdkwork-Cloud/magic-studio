import type {
  AssetBusinessDomain,
  AssetCenterPageRequest,
  AssetCenterStats,
  AssetContentKey,
  UnifiedDigitalAsset,
  UnifiedAssetQueryResult
} from '@sdkwork/react-types';
import type { AssetIndexPort } from '../ports/AssetIndexPort';
import { createSpringPage } from '../../services/impl/springPage';

type FetchLike = typeof fetch;
export type RemoteAssetQueryMode = 'post-json' | 'get-query';

export interface RemoteAssetIndexRepositoryEndpoints {
  save?: string;
  saveMany?: string;
  query?: string;
  list?: string;
  stats?: string;
  findById?: (assetId: string) => string;
  deleteById?: (assetId: string) => string;
}

export interface RemoteAssetIndexRepositoryOptions {
  baseUrl: string;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  fetcher?: FetchLike;
  endpoints?: RemoteAssetIndexRepositoryEndpoints;
  queryMode?: RemoteAssetQueryMode;
}

export const REMOTE_ASSET_INDEX_DEFAULT_ENDPOINTS: Required<RemoteAssetIndexRepositoryEndpoints> = {
  save: '/assets',
  saveMany: '/assets/batch',
  query: '/assets/query',
  list: '/assets',
  stats: '/assets/stats',
  findById: (assetId: string) => `/assets/${encodeURIComponent(assetId)}`,
  deleteById: (assetId: string) => `/assets/${encodeURIComponent(assetId)}`
};

export const createSpringBootAssetCenterEndpoints = (
  basePath = '/api/asset-center'
): Required<RemoteAssetIndexRepositoryEndpoints> => {
  const normalizedBasePath = (() => {
    const trimmed = basePath.trim();
    if (!trimmed) {
      return '/api/asset-center';
    }
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withSlash.replace(/\/+$/, '');
  })();

  return {
    save: `${normalizedBasePath}/assets`,
    saveMany: `${normalizedBasePath}/assets/batch`,
    query: `${normalizedBasePath}/assets/page`,
    list: `${normalizedBasePath}/assets`,
    stats: `${normalizedBasePath}/assets/stats`,
    findById: (assetId: string) => `${normalizedBasePath}/assets/${encodeURIComponent(assetId)}`,
    deleteById: (assetId: string) => `${normalizedBasePath}/assets/${encodeURIComponent(assetId)}`
  };
};

export const SPRING_BOOT_ASSET_CENTER_ENDPOINTS = createSpringBootAssetCenterEndpoints();
export const SPRING_BOOT_ASSET_CENTER_QUERY_MODE: RemoteAssetQueryMode = 'get-query';

export const createSpringBootAssetCenterRemoteOptions = (
  baseUrl: string,
  basePath = '/api/asset-center'
): RemoteAssetIndexRepositoryOptions => ({
  baseUrl,
  endpoints: createSpringBootAssetCenterEndpoints(basePath),
  queryMode: SPRING_BOOT_ASSET_CENTER_QUERY_MODE
});

const sanitizeBaseUrl = (value: string): string => {
  return value.replace(/\/+$/, '');
};

const joinUrl = (baseUrl: string, path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const prefix = path.startsWith('/') ? '' : '/';
  return `${baseUrl}${prefix}${path}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object';
};

const unwrapPayload = <T>(value: unknown): T => {
  if (isRecord(value) && 'success' in value && 'data' in value) {
    return (value.data as T) || ({} as T);
  }
  return value as T;
};

export class RemoteAssetIndexRepository implements AssetIndexPort {
  private readonly baseUrl: string;
  private readonly fetcher: FetchLike;
  private readonly endpoints: Required<RemoteAssetIndexRepositoryEndpoints>;
  private readonly headersResolver?: RemoteAssetIndexRepositoryOptions['headers'];
  private readonly queryMode: RemoteAssetQueryMode;
  private initialized = false;

  constructor(options: RemoteAssetIndexRepositoryOptions) {
    if (!options.baseUrl || !options.baseUrl.trim()) {
      throw new Error('RemoteAssetIndexRepository requires a non-empty baseUrl');
    }
    this.baseUrl = sanitizeBaseUrl(options.baseUrl.trim());
    this.fetcher = options.fetcher || fetch;
    this.headersResolver = options.headers;
    this.queryMode = options.queryMode || 'post-json';
    this.endpoints = {
      ...REMOTE_ASSET_INDEX_DEFAULT_ENDPOINTS,
      ...(options.endpoints || {})
    };
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async save(asset: UnifiedDigitalAsset): Promise<void> {
    await this.ensureInitialized();
    await this.requestJson<void>('POST', this.endpoints.save, asset);
  }

  async saveMany(assets: UnifiedDigitalAsset[]): Promise<void> {
    await this.ensureInitialized();
    await this.requestJson<void>('POST', this.endpoints.saveMany, assets);
  }

  async findById(assetId: string): Promise<UnifiedDigitalAsset | null> {
    await this.ensureInitialized();
    const result = await this.requestJson<UnifiedDigitalAsset | null>(
      'GET',
      this.endpoints.findById(assetId)
    );
    return result || null;
  }

  async deleteById(assetId: string): Promise<void> {
    await this.ensureInitialized();
    await this.requestJson<void>('DELETE', this.endpoints.deleteById(assetId));
  }

  async query(input: AssetCenterPageRequest): Promise<UnifiedAssetQueryResult> {
    await this.ensureInitialized();
    const normalized: AssetCenterPageRequest = {
      ...input,
      page: Math.max(0, input.page),
      size: Math.max(1, input.size)
    };
    const payload = this.queryMode === 'get-query'
      ? await this.requestJson<unknown>('GET', this.buildQueryPath(this.endpoints.query, normalized))
      : await this.requestJson<unknown>('POST', this.endpoints.query, normalized);
    return this.toSpringPage(payload, normalized);
  }

  async list(): Promise<UnifiedDigitalAsset[]> {
    await this.ensureInitialized();
    try {
      const payload = await this.requestJson<unknown>('GET', this.endpoints.list);
      if (Array.isArray(payload)) {
        return payload as UnifiedDigitalAsset[];
      }
      if (isRecord(payload) && Array.isArray(payload.content)) {
        return payload.content as UnifiedDigitalAsset[];
      }
    } catch {
      // Fallback to paging query when list endpoint is not provided by server.
    }

    const records: UnifiedDigitalAsset[] = [];
    let page = 0;
    let hasMore = true;
    while (hasMore) {
      const result = await this.query({
        page,
        size: 200,
        includeDeleted: true
      });
      records.push(...result.content);
      hasMore = !result.last;
      page += 1;
      if (page > 1000) {
        throw new Error('RemoteAssetIndexRepository list aborted: page overflow');
      }
    }
    return records;
  }

  async count(): Promise<AssetCenterStats> {
    await this.ensureInitialized();
    try {
      const payload = await this.requestJson<unknown>('GET', this.endpoints.stats);
      if (isRecord(payload)) {
        return this.toStats(payload);
      }
    } catch {
      // Fallback to local aggregation when stats endpoint is unavailable.
    }

    const records = await this.list();
    return this.aggregateStats(records);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private buildQueryPath(basePath: string, request: AssetCenterPageRequest): string {
    const params = new URLSearchParams();
    params.set('page', String(request.page));
    params.set('size', String(request.size));

    if (request.keyword) {
      params.set('keyword', request.keyword);
    }
    if (request.includeDeleted !== undefined) {
      params.set('includeDeleted', String(request.includeDeleted));
    }

    for (const sortItem of request.sort || []) {
      params.append('sort', sortItem);
    }
    for (const type of request.types || []) {
      params.append('types', type);
    }
    for (const origin of request.origins || []) {
      params.append('origins', origin);
    }
    for (const tag of request.tags || []) {
      params.append('tags', tag);
    }
    for (const status of request.status || []) {
      params.append('status', status);
    }

    if (request.scope) {
      if (request.scope.workspaceId) params.set('scope.workspaceId', request.scope.workspaceId);
      if (request.scope.projectId) params.set('scope.projectId', request.scope.projectId);
      if (request.scope.collectionId) params.set('scope.collectionId', request.scope.collectionId);
      if (request.scope.domain) params.set('scope.domain', request.scope.domain);
    }
    if (request.reference) {
      if (request.reference.entityType) params.set('reference.entityType', request.reference.entityType);
      if (request.reference.entityId) params.set('reference.entityId', request.reference.entityId);
      if (request.reference.relation) params.set('reference.relation', request.reference.relation);
    }

    const queryString = params.toString();
    if (!queryString) {
      return basePath;
    }
    return basePath.includes('?') ? `${basePath}&${queryString}` : `${basePath}?${queryString}`;
  }

  private async resolveHeaders(): Promise<Record<string, string>> {
    const baseHeaders: Record<string, string> = {
      Accept: 'application/json'
    };
    if (!this.headersResolver) {
      return baseHeaders;
    }
    const resolved =
      typeof this.headersResolver === 'function'
        ? await this.headersResolver()
        : this.headersResolver;
    return {
      ...baseHeaders,
      ...(resolved || {})
    };
  }

  private async requestJson<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const headers = await this.resolveHeaders();
    const hasBody = body !== undefined && method !== 'GET';
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await this.fetcher(joinUrl(this.baseUrl, path), {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Remote asset-center request failed [${response.status}] ${text || response.statusText}`);
    }

    const raw = await response.text();
    if (!raw) {
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    return unwrapPayload<T>(parsed);
  }

  private toSpringPage(payload: unknown, request: AssetCenterPageRequest): UnifiedAssetQueryResult {
    if (isRecord(payload) && Array.isArray(payload.content)) {
      const content = payload.content as UnifiedDigitalAsset[];
      const totalElements = Number(payload.totalElements ?? content.length);
      const size = Number(payload.size ?? request.size);
      const number = Number(payload.number ?? request.page);
      const totalPages = Number(
        payload.totalPages ??
          (size <= 0 ? 0 : totalElements === 0 ? 0 : Math.ceil(totalElements / size))
      );
      const numberOfElements = Number(payload.numberOfElements ?? content.length);
      return {
        content,
        pageable: payload.pageable as UnifiedAssetQueryResult['pageable'],
        last: Boolean(payload.last ?? (totalPages === 0 ? true : number >= totalPages - 1)),
        totalElements,
        totalPages,
        size,
        number,
        sort: payload.sort as UnifiedAssetQueryResult['sort'],
        first: Boolean(payload.first ?? number === 0),
        numberOfElements,
        empty: Boolean(payload.empty ?? numberOfElements === 0)
      };
    }
    if (Array.isArray(payload)) {
      return createSpringPage(payload as UnifiedDigitalAsset[], request);
    }
    return createSpringPage([], request);
  }

  private toStats(payload: Record<string, unknown>): AssetCenterStats {
    const zero = this.createZeroStats();
    return {
      totalAssets: Number(payload.totalAssets ?? zero.totalAssets),
      totalReady: Number(payload.totalReady ?? zero.totalReady),
      totalProcessing: Number(payload.totalProcessing ?? zero.totalProcessing),
      totalArchived: Number(payload.totalArchived ?? zero.totalArchived),
      totalDeleted: Number(payload.totalDeleted ?? zero.totalDeleted),
      totalFavorites: Number(payload.totalFavorites ?? zero.totalFavorites),
      byType: this.mapCountRecord<AssetContentKey>(payload.byType, zero.byType),
      byDomain: this.mapCountRecord<AssetBusinessDomain>(payload.byDomain, zero.byDomain)
    };
  }

  private aggregateStats(records: UnifiedDigitalAsset[]): AssetCenterStats {
    const stats = this.createZeroStats();
    stats.totalAssets = records.length;
    for (const item of records) {
      if (item.status === 'ready') stats.totalReady += 1;
      if (item.status === 'processing') stats.totalProcessing += 1;
      if (item.status === 'archived') stats.totalArchived += 1;
      if (item.status === 'deleted') stats.totalDeleted += 1;
      if (item.isFavorite) stats.totalFavorites += 1;
      stats.byType[item.primaryType] += 1;
      stats.byDomain[item.scope.domain] += 1;
    }
    return stats;
  }

  private mapCountRecord<T extends string>(
    input: unknown,
    fallback: Record<T, number>
  ): Record<T, number> {
    const result = { ...fallback };
    if (!isRecord(input)) {
      return result;
    }
    for (const key of Object.keys(result) as T[]) {
      result[key] = Number(input[key] ?? result[key]);
    }
    return result;
  }

  private createZeroStats(): AssetCenterStats {
    return {
      totalAssets: 0,
      totalReady: 0,
      totalProcessing: 0,
      totalArchived: 0,
      totalDeleted: 0,
      totalFavorites: 0,
      byType: {
        image: 0,
        video: 0,
        audio: 0,
        music: 0,
        voice: 0,
        text: 0,
        character: 0,
        model3d: 0,
        lottie: 0,
        file: 0,
        effect: 0,
        transition: 0,
        subtitle: 0,
        sfx: 0
      },
      byDomain: {
        'asset-center': 0,
        notes: 0,
        canvas: 0,
        'image-studio': 0,
        'video-studio': 0,
        'audio-studio': 0,
        music: 0,
        'voice-speaker': 0,
        magiccut: 0,
        film: 0,
        'portal-video': 0,
        character: 0,
        sfx: 0
      }
    };
  }
}
