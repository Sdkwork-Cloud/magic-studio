import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioAssetListQuery,
  MagicStudioAssetUpsertRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type {
  AssetBusinessDomain,
  AssetCenterPageRequest,
  AssetCenterStats,
  AssetDomainReference,
  AssetLifecycleStatus,
  AssetScope,
  AssetStorageDescriptor,
  UnifiedAssetPayload,
  UnifiedDigitalAsset,
  UnifiedAssetQueryResult,
} from '@sdkwork/magic-studio-types/asset-center';
import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';
import type { AssetIndexPort } from '../ports/AssetIndexPort';
import { getAssetServerClient } from '../../services/assetServerClient';
import { createSpringPage } from '../../services/impl/springPage';

type AssetServerClientLike = Partial<
  Pick<
    MagicStudioServerClient,
    'upsertAsset' | 'readAsset' | 'deleteAsset' | 'listAssets' | 'readAssetStats'
  >
>;

export interface RemoteAssetIndexRepositoryOptions {
  getClient?: () => AssetServerClientLike;
}

const ASSET_CONTENT_KEYS: ReadonlySet<AssetContentKey> = new Set([
  'image',
  'video',
  'audio',
  'music',
  'voice',
  'text',
  'character',
  'model3d',
  'lottie',
  'file',
  'effect',
  'transition',
  'subtitle',
  'sfx',
]);
const ASSET_DOMAINS: ReadonlySet<AssetBusinessDomain> = new Set([
  'asset-center',
  'notes',
  'canvas',
  'image-studio',
  'video-studio',
  'audio-studio',
  'music',
  'voice-speaker',
  'magiccut',
  'film',
  'portal-video',
  'character',
  'sfx',
]);
const ASSET_STATUSES: ReadonlySet<AssetLifecycleStatus> = new Set([
  'draft',
  'imported',
  'generated',
  'processing',
  'ready',
  'archived',
  'deleted',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object');
};

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }
  return undefined;
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeTimestamp = (primary: unknown, fallback?: unknown): string => {
  return (
    normalizeText(primary) ||
    normalizeText(fallback) ||
    new Date().toISOString()
  );
};

const normalizeContentKey = (value: unknown): AssetContentKey => {
  const normalized = normalizeText(value)?.toLowerCase() as AssetContentKey | undefined;
  return normalized && ASSET_CONTENT_KEYS.has(normalized) ? normalized : 'file';
};

const normalizeDomain = (value: unknown): AssetBusinessDomain => {
  const normalized = normalizeText(value)?.toLowerCase() as AssetBusinessDomain | undefined;
  return normalized && ASSET_DOMAINS.has(normalized) ? normalized : 'asset-center';
};

const normalizeStatus = (value: unknown): AssetLifecycleStatus => {
  const normalized = normalizeText(value)?.toLowerCase() as AssetLifecycleStatus | undefined;
  return normalized && ASSET_STATUSES.has(normalized) ? normalized : 'ready';
};

const unwrapData = <T>(payload: unknown): T | undefined => {
  if (isRecord(payload) && 'data' in payload) {
    return (payload as unknown as MagicStudioApiEnvelope<T>).data;
  }

  return payload as T | undefined;
};

const normalizeScope = (value: unknown): AssetScope => {
  const record = isRecord(value) ? value : {};
  return {
    workspaceId: normalizeText(record.workspaceId) || 'default-workspace',
    ...(normalizeText(record.projectId) ? { projectId: normalizeText(record.projectId) } : {}),
    ...(normalizeText(record.collectionId) ? { collectionId: normalizeText(record.collectionId) } : {}),
    domain: normalizeDomain(record.domain),
  };
};

const normalizeStorage = (value: unknown, assetId: string): AssetStorageDescriptor => {
  const record = isRecord(value) ? value : {};
  const primaryRecord = isRecord(record.primary) ? record.primary : {};
  const protocol =
    normalizeText(primaryRecord.protocol) ||
    (normalizeText(primaryRecord.url)?.startsWith('https://') ? 'https' : 'assets');
  const uri =
    normalizeText(primaryRecord.uri) ||
    normalizeText(primaryRecord.url) ||
    `assets://${assetId}`;

  return {
    mode:
      (normalizeText(record.mode) as AssetStorageDescriptor['mode'] | undefined) ||
      'remote-url',
    primary: {
      protocol: protocol as AssetStorageDescriptor['primary']['protocol'],
      uri,
      ...(normalizeText(primaryRecord.path) ? { path: normalizeText(primaryRecord.path) } : {}),
      ...(normalizeText(primaryRecord.url) ? { url: normalizeText(primaryRecord.url) } : {}),
      ...(normalizeText(primaryRecord.checksum)
        ? { checksum: normalizeText(primaryRecord.checksum) }
        : {}),
    },
    ...(Array.isArray(record.replicas)
      ? {
          replicas: record.replicas.filter(isRecord).map((replica) => ({
            protocol:
              (normalizeText(replica.protocol) as AssetStorageDescriptor['primary']['protocol'] | undefined) ||
              'https',
            uri: normalizeText(replica.uri) || normalizeText(replica.url) || uri,
            ...(normalizeText(replica.path) ? { path: normalizeText(replica.path) } : {}),
            ...(normalizeText(replica.url) ? { url: normalizeText(replica.url) } : {}),
            ...(normalizeText(replica.checksum)
              ? { checksum: normalizeText(replica.checksum) }
              : {}),
          })),
        }
      : {}),
    cacheable: normalizeBoolean(record.cacheable) ?? true,
    ...(normalizeBoolean(record.encrypted) !== undefined
      ? { encrypted: normalizeBoolean(record.encrypted) }
      : {}),
  };
};

const normalizeReferences = (value: unknown): AssetDomainReference[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const references = value
    .filter(isRecord)
    .map((item) => ({
      domain: normalizeDomain(item.domain),
      entityType: normalizeText(item.entityType) || '',
      entityId: normalizeText(item.entityId) || '',
      relation:
        (normalizeText(item.relation) as AssetDomainReference['relation'] | undefined) ||
        'reference',
      ...(normalizeText(item.slot) ? { slot: normalizeText(item.slot) } : {}),
      ...(typeof item.order === 'number' && Number.isFinite(item.order)
        ? { order: item.order }
        : {}),
      ...(isRecord(item.metadata) ? { metadata: item.metadata } : {}),
    }))
    .filter((item) => item.entityType && item.entityId);

  return references.length > 0 ? references : undefined;
};

const normalizePayload = (value: unknown): UnifiedAssetPayload => {
  if (!isRecord(value)) {
    return {
      assets: [],
    };
  }
  return {
    assets: Array.isArray(value.assets) ? (value.assets as UnifiedAssetPayload['assets']) : [],
    ...(isRecord(value.video) ? { video: value.video as unknown as UnifiedAssetPayload['video'] } : {}),
    ...(isRecord(value.image) ? { image: value.image as unknown as UnifiedAssetPayload['image'] } : {}),
    ...(isRecord(value.audio) ? { audio: value.audio as unknown as UnifiedAssetPayload['audio'] } : {}),
    ...(isRecord(value.music) ? { music: value.music as unknown as UnifiedAssetPayload['music'] } : {}),
    ...(isRecord(value.voice) ? { voice: value.voice as unknown as UnifiedAssetPayload['voice'] } : {}),
    ...(isRecord(value.text) ? { text: value.text as unknown as UnifiedAssetPayload['text'] } : {}),
    ...(isRecord(value.character)
      ? { character: value.character as unknown as UnifiedAssetPayload['character'] }
      : {}),
    ...(isRecord(value.model3d)
      ? { model3d: value.model3d as unknown as UnifiedAssetPayload['model3d'] }
      : {}),
    ...(isRecord(value.lottie) ? { lottie: value.lottie as unknown as UnifiedAssetPayload['lottie'] } : {}),
    ...(isRecord(value.file) ? { file: value.file as unknown as UnifiedAssetPayload['file'] } : {}),
    ...(isRecord(value.effect) ? { effect: value.effect as unknown as UnifiedAssetPayload['effect'] } : {}),
    ...(isRecord(value.transition)
      ? { transition: value.transition as unknown as UnifiedAssetPayload['transition'] }
      : {}),
    ...(isRecord(value.subtitle)
      ? { subtitle: value.subtitle as unknown as UnifiedAssetPayload['subtitle'] }
      : {}),
    ...(isRecord(value.sfx) ? { sfx: value.sfx as unknown as UnifiedAssetPayload['sfx'] } : {}),
  };
};

const normalizeAsset = (value: unknown): UnifiedDigitalAsset | null => {
  if (!isRecord(value)) {
    return null;
  }

  const assetId = normalizeText(value.assetId) || normalizeText(value.id);
  if (!assetId) {
    return null;
  }

  const createdAt = normalizeTimestamp(value.createdAt, value.updatedAt);
  const updatedAt = normalizeTimestamp(value.updatedAt, createdAt);
  const scope = normalizeScope(value.scope);

  return {
    ...(value as Partial<UnifiedDigitalAsset>),
    id: normalizeText(value.id) || assetId,
    uuid: normalizeText(value.uuid) || `client-asset:${assetId}`,
    assetId,
    key: normalizeText(value.key) || assetId,
    title: normalizeText(value.title) || assetId,
    ...(normalizeText(value.description) ? { description: normalizeText(value.description) } : {}),
    primaryType: normalizeContentKey(value.primaryType),
    payload: normalizePayload(value.payload),
    scope,
    storage: normalizeStorage(value.storage, assetId),
    status: normalizeStatus(value.status),
    ...(normalizeStringArray(value.tags) ? { tags: normalizeStringArray(value.tags) } : {}),
    ...(normalizeStringArray(value.labels) ? { labels: normalizeStringArray(value.labels) } : {}),
    ...(normalizeBoolean(value.isFavorite) !== undefined
      ? { isFavorite: normalizeBoolean(value.isFavorite) }
      : {}),
    versionInfo:
      isRecord(value.versionInfo) && typeof value.versionInfo.version === 'number'
        ? (value.versionInfo as unknown as UnifiedDigitalAsset['versionInfo'])
        : { version: 1 },
    ...(normalizeReferences(value.references) ? { references: normalizeReferences(value.references) } : {}),
    ...(isRecord(value.metadata) ? { metadata: value.metadata } : {}),
    createdAt,
    updatedAt,
    ...(normalizeText(value.deletedAt) ? { deletedAt: normalizeText(value.deletedAt) } : {}),
  };
};

const toStats = (payload: unknown): AssetCenterStats => {
  const zero = createZeroStats();
  const record: Record<string, unknown> = isRecord(payload) ? payload : {};
  return {
    totalAssets: Number(record.totalAssets ?? zero.totalAssets),
    totalReady: Number(record.totalReady ?? zero.totalReady),
    totalProcessing: Number(record.totalProcessing ?? zero.totalProcessing),
    totalArchived: Number(record.totalArchived ?? zero.totalArchived),
    totalDeleted: Number(record.totalDeleted ?? zero.totalDeleted),
    totalFavorites: Number(record.totalFavorites ?? zero.totalFavorites),
    byType: mapCountRecord<AssetContentKey>(record.byType, zero.byType),
    byDomain: mapCountRecord<AssetBusinessDomain>(record.byDomain, zero.byDomain),
  };
};

const mapCountRecord = <T extends string>(
  input: unknown,
  fallback: Record<T, number>
): Record<T, number> => {
  const result = { ...fallback };
  if (!isRecord(input)) {
    return result;
  }
  for (const key of Object.keys(result) as T[]) {
    result[key] = Number(input[key] ?? result[key]);
  }
  return result;
};

const createZeroStats = (): AssetCenterStats => ({
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
    sfx: 0,
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
    sfx: 0,
  },
});

const toUpsertRequest = (asset: UnifiedDigitalAsset): MagicStudioAssetUpsertRequest => ({
  id: asset.id || asset.assetId,
  uuid: asset.uuid,
  assetId: asset.assetId,
  key: asset.key,
  title: asset.title,
  ...(asset.description ? { description: asset.description } : {}),
  primaryType: asset.primaryType,
  payload: asset.payload,
  scope: asset.scope,
  storage: asset.storage,
  status: asset.status,
  ...(asset.tags ? { tags: asset.tags } : {}),
  ...(asset.labels ? { labels: asset.labels } : {}),
  ...(asset.isFavorite !== undefined ? { isFavorite: asset.isFavorite } : {}),
  versionInfo: asset.versionInfo,
  ...(asset.references ? { references: asset.references } : {}),
  ...(asset.metadata ? { metadata: asset.metadata } : {}),
  createdAt: normalizeTimestamp(asset.createdAt, asset.updatedAt),
  updatedAt: normalizeTimestamp(asset.updatedAt, asset.createdAt),
  ...(asset.deletedAt ? { deletedAt: asset.deletedAt } : {}),
});

const toServerAssetListQuery = (request: AssetCenterPageRequest): MagicStudioAssetListQuery => {
  const query: MagicStudioAssetListQuery = {
    page: Math.max(0, request.page),
    size: Math.max(1, request.size),
  };

  if (request.keyword) {
    query.keyword = request.keyword;
  }
  if (request.sort && request.sort.length > 0) {
    query.sort = request.sort;
  }
  if (request.types && request.types.length > 0) {
    query.types = request.types;
  }
  if (request.origins && request.origins.length > 0) {
    query.origins = request.origins;
  }
  if (request.tags && request.tags.length > 0) {
    query.tags = request.tags;
  }
  if (request.status && request.status.length > 0) {
    query.status = request.status;
  }
  if (request.includeDeleted !== undefined) {
    query.includeDeleted = request.includeDeleted;
  }
  if (request.scope) {
    if (request.scope.workspaceId) query.workspaceId = request.scope.workspaceId;
    if (request.scope.projectId) query.projectId = request.scope.projectId;
    if (request.scope.collectionId) query.collectionId = request.scope.collectionId;
    if (request.scope.domain) query.domain = request.scope.domain;
  }
  if (request.reference) {
    if (request.reference.entityType) query.referenceEntityType = request.reference.entityType;
    if (request.reference.entityId) query.referenceEntityId = request.reference.entityId;
    if (request.reference.relation) query.referenceRelation = request.reference.relation;
  }

  return query;
};

const toSpringPage = (
  payload: unknown,
  request: AssetCenterPageRequest
): UnifiedAssetQueryResult => {
  if (isRecord(payload) && Array.isArray(payload.items)) {
    const envelope = payload as unknown as MagicStudioApiListEnvelope<UnifiedDigitalAsset>;
    const content = envelope.items.map((item) => normalizeAsset(item)).filter(Boolean) as UnifiedDigitalAsset[];
    const page = Number(envelope.meta?.page ?? request.page);
    const size = Number(envelope.meta?.pageSize ?? request.size);
    const totalElements = Number(envelope.meta?.total ?? content.length);
    const totalPages =
      size <= 0 ? 0 : totalElements === 0 ? 0 : Math.ceil(totalElements / size);

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        offset: page * size,
        paged: true,
        unpaged: false,
        sort: {
          sorted: Boolean(request.sort && request.sort.length > 0),
          unsorted: !request.sort || request.sort.length === 0,
          empty: !request.sort || request.sort.length === 0,
        },
      },
      last: totalPages === 0 ? true : page >= totalPages - 1,
      totalElements,
      totalPages,
      size,
      number: page,
      sort: {
        sorted: Boolean(request.sort && request.sort.length > 0),
        unsorted: !request.sort || request.sort.length === 0,
        empty: !request.sort || request.sort.length === 0,
      },
      first: page === 0,
      numberOfElements: content.length,
      empty: content.length === 0,
    };
  }

  const page = unwrapData<{
    content?: unknown[];
    totalElements?: number;
    size?: number;
    number?: number;
    totalPages?: number;
    numberOfElements?: number;
    pageable?: UnifiedAssetQueryResult['pageable'];
    sort?: UnifiedAssetQueryResult['sort'];
    first?: boolean;
    last?: boolean;
    empty?: boolean;
  } | UnifiedDigitalAsset[]>(payload);

  if (isRecord(page) && Array.isArray(page.content)) {
    const content = page.content.map((item) => normalizeAsset(item)).filter(Boolean) as UnifiedDigitalAsset[];
    const totalElements = Number(page.totalElements ?? content.length);
    const size = Number(page.size ?? request.size);
    const number = Number(page.number ?? request.page);
    const totalPages = Number(
      page.totalPages ??
        (size <= 0 ? 0 : totalElements === 0 ? 0 : Math.ceil(totalElements / size))
    );
    const numberOfElements = Number(page.numberOfElements ?? content.length);

    return {
      content,
      pageable: page.pageable,
      last: Boolean(page.last ?? (totalPages === 0 ? true : number >= totalPages - 1)),
      totalElements,
      totalPages,
      size,
      number,
      sort: page.sort,
      first: Boolean(page.first ?? number === 0),
      numberOfElements,
      empty: Boolean(page.empty ?? numberOfElements === 0),
    };
  }

  if (Array.isArray(page)) {
    const content = page.map((item) => normalizeAsset(item)).filter(Boolean) as UnifiedDigitalAsset[];
    return createSpringPage(content, request);
  }

  return createSpringPage([], request);
};

export class RemoteAssetIndexRepository implements AssetIndexPort {
  private readonly getClient: () => AssetServerClientLike;
  private initialized = false;

  constructor(options: RemoteAssetIndexRepositoryOptions = {}) {
    this.getClient = options.getClient || getAssetServerClient;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async save(asset: UnifiedDigitalAsset): Promise<void> {
    await this.ensureInitialized();
    const client = this.requireClient('upsertAsset');
    await client.upsertAsset?.(asset.assetId, toUpsertRequest(asset));
  }

  async saveMany(assets: UnifiedDigitalAsset[]): Promise<void> {
    await this.ensureInitialized();
    const client = this.requireClient('upsertAsset');
    for (const asset of assets) {
      await client.upsertAsset?.(asset.assetId, toUpsertRequest(asset));
    }
  }

  async findById(assetId: string): Promise<UnifiedDigitalAsset | null> {
    await this.ensureInitialized();
    const client = this.requireClient('readAsset');
    const payload = await client.readAsset?.(assetId);
    return normalizeAsset(unwrapData<UnifiedDigitalAsset>(payload));
  }

  async deleteById(assetId: string): Promise<void> {
    await this.ensureInitialized();
    const client = this.requireClient('deleteAsset');
    await client.deleteAsset?.(assetId);
  }

  async query(input: AssetCenterPageRequest): Promise<UnifiedAssetQueryResult> {
    await this.ensureInitialized();
    const normalized: AssetCenterPageRequest = {
      ...input,
      page: Math.max(0, input.page),
      size: Math.max(1, input.size),
    };
    const client = this.requireClient('listAssets');
    const payload = await client.listAssets?.(toServerAssetListQuery(normalized));
    return toSpringPage(payload, normalized);
  }

  async list(): Promise<UnifiedDigitalAsset[]> {
    await this.ensureInitialized();
    const records: UnifiedDigitalAsset[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.query({
        page,
        size: 200,
        includeDeleted: true,
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
    const client = this.requireClient('readAssetStats');
    const payload = await client.readAssetStats?.(undefined);
    return toStats(unwrapData<AssetCenterStats>(payload));
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private requireClient(methodName: keyof AssetServerClientLike): AssetServerClientLike {
    const client = this.getClient();
    if (!client || typeof client[methodName] !== 'function') {
      throw new Error(
        `Magic Studio asset server client is unavailable: ${String(methodName)} is required.`,
      );
    }
    return client;
  }
}
