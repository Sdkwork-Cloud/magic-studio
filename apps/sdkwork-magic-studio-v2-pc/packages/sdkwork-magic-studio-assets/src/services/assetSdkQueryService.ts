import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import { deriveAssetRecordClientUuid } from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { UploadFile } from '@sdkwork/magic-studio-core/services';
import { inlineDataService } from '@sdkwork/magic-studio-core/services';
import { resolveRuntimeMagicStudioRootLayout } from '@sdkwork/magic-studio-core/storage';
import { vfs } from '@sdkwork/magic-studio-fs';
import type {
  AssetBusinessDomain,
  AssetScope,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types/asset-center';
import { createUuid } from '@sdkwork/magic-studio-types/entity';
import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { Asset, AssetOrigin, AssetType } from '../entities';
import { readWorkspaceScope } from '../asset-center/application/assetCenterAdapters';
import { getAssetServerClient, readAssetServerRuntime } from './assetServerClient';
import { createSpringPage } from './impl/springPage';

export type AssetSdkQueryCategory = AssetType | 'media' | 'effects' | 'transitions';

interface AssetSdkQueryOptions {
  category: AssetSdkQueryCategory;
  pageRequest: PageRequest;
  allowedTypes?: AssetType[];
  domain?: AssetBusinessDomain;
}

const TEMP_IMPORT_DIR = 'asset-imports';

let cachedRootLayoutPromise:
  | ReturnType<typeof resolveRuntimeMagicStudioRootLayout>
  | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object');
};

const cloneRecord = (value: unknown): Record<string, unknown> => {
  return isRecord(value) ? { ...value } : {};
};

async function getRootLayout(): ReturnType<typeof resolveRuntimeMagicStudioRootLayout> {
  if (!cachedRootLayoutPromise) {
    cachedRootLayoutPromise = resolveRuntimeMagicStudioRootLayout(readAssetServerRuntime());
  }

  return cachedRootLayoutPromise;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeOptionalId(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeOptionalString(value);
}

function normalizeTimestamp(value: unknown, fallback?: unknown): string {
  return (
    normalizeOptionalString(value) ||
    normalizeOptionalString(fallback) ||
    new Date().toISOString()
  );
}

function pickFirst(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value) {
      return value;
    }
  }

  return undefined;
}

function requirePersistedId(value: unknown, message: string): string {
  const normalized = normalizeOptionalId(value);
  if (normalized) {
    return normalized;
  }

  throw new Error(message);
}

function normalizeAssetType(rawType?: string): AssetType | null {
  const type = String(rawType || '').trim().toUpperCase();
  if (type === 'IMAGE') return 'image';
  if (type === 'VIDEO') return 'video';
  if (type === 'AUDIO') return 'audio';
  if (type === 'MUSIC') return 'music';
  if (type === 'VOICE') return 'voice';
  if (type === 'DOCUMENT' || type === 'TEXT') return 'text';
  if (type === 'CHARACTER') return 'character';
  if (type === 'MODEL_3D' || type === 'MODEL3D') return 'model3d';
  if (type === 'LOTTIE') return 'lottie';
  if (type === 'FILE' || type === 'UNKNOWN') return 'file';
  if (type === 'EFFECT') return 'effect';
  if (type === 'TRANSITION') return 'transition';
  if (type === 'SUBTITLE') return 'subtitle';
  if (type === 'SFX') return 'sfx';
  return null;
}

function resolveAssetTypeFromMime(mimeType?: string): AssetType | null {
  const normalized = String(mimeType || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('video/')) return 'video';
  if (normalized.startsWith('audio/')) return 'audio';
  if (normalized.includes('json')) return 'file';
  if (normalized.includes('text')) return 'text';
  return null;
}

function toContentKey(type: AssetType): AssetContentKey {
  return type;
}

function resolveAssetOrigin(
  primary: Record<string, unknown> | undefined,
  metadata: Record<string, unknown>,
  tags?: string[],
): AssetOrigin {
  const primaryOrigin = normalizeOptionalString(primary?.origin);
  if (
    primaryOrigin === 'upload' ||
    primaryOrigin === 'ai' ||
    primaryOrigin === 'stock' ||
    primaryOrigin === 'system'
  ) {
    return primaryOrigin;
  }

  const metadataOrigin = normalizeOptionalString(metadata.origin);
  if (
    metadataOrigin === 'upload' ||
    metadataOrigin === 'ai' ||
    metadataOrigin === 'stock' ||
    metadataOrigin === 'system'
  ) {
    return metadataOrigin;
  }

  if (!Array.isArray(tags)) {
    return 'stock';
  }

  const lowered = tags.map(tag => String(tag || '').toLowerCase());
  if (lowered.some(tag => tag === 'ai' || tag.includes('origin:ai'))) {
    return 'ai';
  }
  if (lowered.some(tag => tag === 'upload' || tag.includes('origin:upload'))) {
    return 'upload';
  }
  if (lowered.some(tag => tag === 'system' || tag.includes('origin:system'))) {
    return 'system';
  }

  return 'stock';
}

function readPrimaryRecord(
  asset: UnifiedDigitalAsset,
  primaryType: AssetType | null,
): Record<string, unknown> | undefined {
  const payload = cloneRecord(asset.payload);

  if (primaryType) {
    const primaryValue = payload[primaryType];
    if (isRecord(primaryValue)) {
      return cloneRecord(primaryValue);
    }
  }

  const assets = Array.isArray(payload.assets) ? payload.assets : [];
  const firstRecord = assets.find(item => isRecord(item));
  return isRecord(firstRecord) ? cloneRecord(firstRecord) : undefined;
}

function resolveUnifiedAssetType(asset: UnifiedDigitalAsset): AssetType {
  const byPrimaryType = normalizeAssetType(asset.primaryType);
  if (byPrimaryType) {
    return byPrimaryType;
  }

  const primary = readPrimaryRecord(asset, null);
  const byResourceType = normalizeAssetType(normalizeOptionalString(primary?.type));
  if (byResourceType) {
    return byResourceType;
  }

  const primaryMetadata = cloneRecord(primary?.metadata);
  const metadata = cloneRecord(asset.metadata);
  const mimeType = pickFirst(
    normalizeOptionalString(primary?.mimeType),
    normalizeOptionalString(primaryMetadata.mimeType),
    normalizeOptionalString(metadata.mimeType),
    normalizeOptionalString(metadata.contentType),
  );

  return resolveAssetTypeFromMime(mimeType) || 'file';
}

function resolveUnifiedAssetPath(
  asset: UnifiedDigitalAsset,
  primary: Record<string, unknown> | undefined,
  assetId: string,
): string {
  const storage = cloneRecord(asset.storage);
  const storagePrimary = cloneRecord(storage.primary);

  return (
    normalizeOptionalString(storagePrimary.url) ||
    normalizeOptionalString(primary?.url) ||
    normalizeOptionalString(primary?.path) ||
    normalizeOptionalString(storagePrimary.uri) ||
    `assets://${assetId}`
  );
}

function mapUnifiedAssetToAsset(asset: UnifiedDigitalAsset): Asset {
  const assetId = requirePersistedId(
    asset.assetId ?? asset.id,
    'Asset item is missing persisted assetId.',
  );
  const type = resolveUnifiedAssetType(asset);
  const primary = readPrimaryRecord(asset, type);
  const primaryMetadata = cloneRecord(primary?.metadata);
  const metadata = cloneRecord(asset.metadata);
  const storage = cloneRecord(asset.storage);
  const storagePrimary = cloneRecord(storage.primary);

  const assetUuid = pickFirst(
    normalizeOptionalString(asset.uuid),
    normalizeOptionalString(metadata.assetUuid),
    normalizeOptionalString(primaryMetadata.assetUuid),
  );
  const primaryResourceId = pickFirst(
    normalizeOptionalId(primaryMetadata.primaryResourceId),
    normalizeOptionalId(primary?.primaryResourceId),
    normalizeOptionalId(primary?.id),
    normalizeOptionalId(metadata.primaryResourceId),
  );
  const primaryResourceUuid = pickFirst(
    normalizeOptionalString(primaryMetadata.primaryResourceUuid),
    normalizeOptionalString(primary?.uuid),
    normalizeOptionalString(metadata.primaryResourceUuid),
  );
  const resourceViewId = pickFirst(
    normalizeOptionalId(primaryMetadata.resourceViewId),
    normalizeOptionalId(primary?.resourceViewId),
    normalizeOptionalId(metadata.resourceViewId),
  );
  const resourceViewUuid = pickFirst(
    normalizeOptionalString(primaryMetadata.resourceViewUuid),
    normalizeOptionalString(metadata.resourceViewUuid),
  );
  const clientUuid =
    pickFirst(assetUuid, resourceViewUuid, primaryResourceUuid) ||
    deriveAssetRecordClientUuid(assetId);

  const mimeType = pickFirst(
    normalizeOptionalString(primary?.mimeType),
    normalizeOptionalString(primaryMetadata.mimeType),
    normalizeOptionalString(metadata.mimeType),
    normalizeOptionalString(metadata.contentType),
  );
  const createdAt = normalizeTimestamp(asset.createdAt, asset.updatedAt);
  const updatedAt = normalizeTimestamp(asset.updatedAt, createdAt);

  return {
    id: assetId,
    uuid: clientUuid,
    name:
      normalizeOptionalString(asset.title) ||
      normalizeOptionalString(primary?.name) ||
      `Asset ${assetId}`,
    type,
    path: resolveUnifiedAssetPath(asset, primary, assetId),
    size: Number(primary?.size || 0),
    origin: resolveAssetOrigin(primary, metadata, asset.tags),
    isFavorite: Boolean(asset.isFavorite),
    createdAt,
    updatedAt,
    metadata: {
      ...metadata,
      ...primaryMetadata,
      assetId,
      ...(assetUuid ? { assetUuid } : {}),
      ...(primaryResourceId ? { primaryResourceId } : {}),
      ...(primaryResourceUuid ? { primaryResourceUuid } : {}),
      ...(resourceViewId ? { resourceViewId } : {}),
      ...(resourceViewUuid ? { resourceViewUuid } : {}),
      ...(mimeType ? { mimeType } : {}),
      ...(normalizeOptionalString(storagePrimary.url)
        ? { primaryUrl: normalizeOptionalString(storagePrimary.url) }
        : {}),
    },
  };
}

function toPageResult(
  items: UnifiedDigitalAsset[],
  meta: { page?: number; pageSize?: number; total?: number },
  request: PageRequest,
): Page<Asset> {
  const normalizedItems = items.map(item => mapUnifiedAssetToAsset(item));
  const requestedPageSize = request.size ?? normalizedItems.length;
  const fallbackPageSize = requestedPageSize > 0 ? requestedPageSize : 20;
  const pageNumber = Number.isFinite(Number(meta.page))
    ? Number(meta.page)
    : request.page ?? 0;
  const pageSize = Number.isFinite(Number(meta.pageSize))
    ? Number(meta.pageSize)
    : fallbackPageSize;
  const totalElements = Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : normalizedItems.length;
  const totalPages =
    totalElements === 0 ? 0 : Math.ceil(totalElements / Math.max(1, pageSize));

  return {
    content: normalizedItems,
    pageable: {
      pageNumber,
      pageSize,
      offset: pageNumber * pageSize,
      paged: true,
      unpaged: false,
      sort: {
        sorted: false,
        unsorted: true,
        empty: true,
      },
    },
    last: totalPages === 0 ? true : pageNumber >= totalPages - 1,
    totalPages,
    totalElements,
    size: pageSize,
    number: pageNumber,
    first: pageNumber === 0,
    numberOfElements: normalizedItems.length,
    empty: normalizedItems.length === 0,
    sort: {
      sorted: false,
      unsorted: true,
      empty: true,
    },
  };
}

function resolveQueryTypes(options: AssetSdkQueryOptions): AssetContentKey[] | undefined {
  const fromAllowed = options.allowedTypes?.map(item => toContentKey(item));
  if (fromAllowed && fromAllowed.length > 0) {
    return Array.from(new Set(fromAllowed));
  }

  if (options.category === 'media') {
    return undefined;
  }
  if (options.category === 'effects') {
    return ['effect'];
  }
  if (options.category === 'transitions') {
    return ['transition'];
  }

  return [toContentKey(options.category)];
}

function createAssetScope(domain?: AssetBusinessDomain): AssetScope {
  const scope = readWorkspaceScope();
  return {
    workspaceId: scope.workspaceId,
    ...(scope.projectId ? { projectId: scope.projectId } : {}),
    ...(scope.collectionId ? { collectionId: scope.collectionId } : {}),
    domain: domain || 'asset-center',
  };
}

function resolvePrimaryAssetUrl(asset: UnifiedDigitalAsset): string | null {
  const type = resolveUnifiedAssetType(asset);
  const primary = readPrimaryRecord(asset, type);
  const storage = cloneRecord(asset.storage);
  const storagePrimary = cloneRecord(storage.primary);

  return (
    normalizeOptionalString(storagePrimary.url) ||
    normalizeOptionalString(primary?.url) ||
    normalizeOptionalString(primary?.path) ||
    normalizeOptionalString(storagePrimary.uri) ||
    null
  );
}

async function ensureImportRoot(): Promise<string> {
  const rootLayout = await getRootLayout();
  const importRoot = pathUtils.join(rootLayout.systemTempRoot, TEMP_IMPORT_DIR);

  try {
    await vfs.createDir(rootLayout.systemTempRoot);
  } catch {
    // Keep running if the temp root already exists.
  }

  try {
    await vfs.createDir(importRoot);
  } catch {
    // Keep running if the import root already exists.
  }

  return importRoot;
}

async function createTempImportFile(file: UploadFile): Promise<string> {
  const importRoot = await ensureImportRoot();
  const originalName = normalizeOptionalString(file.name) || `asset-${Date.now()}`;
  const extension = pathUtils.extname(originalName) || '.bin';
  const tempPath = pathUtils.join(importRoot, `${createUuid()}${extension}`);
  const bytes = new Uint8Array(file.data.byteLength);
  bytes.set(file.data);
  await vfs.writeFileBinary(tempPath, bytes);
  return tempPath;
}

async function resolveUploadBytesFromSourceUrl(sourceUrl: string): Promise<Uint8Array> {
  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  if (inlineData && inlineData.length > 0) {
    return inlineData;
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download source asset: HTTP ${response.status}.`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error('Downloaded source asset is empty.');
  }

  return bytes;
}

export async function queryAssetsBySdk(
  options: AssetSdkQueryOptions,
): Promise<Page<Asset>> {
  const normalizedRequest: PageRequest = {
    page: Math.max(0, options.pageRequest.page ?? 0),
    size: Math.max(1, options.pageRequest.size ?? 20),
    sort: options.pageRequest.sort,
    keyword: normalizeOptionalString(options.pageRequest.keyword),
  };
  const queryTypes = resolveQueryTypes(options);

  const response = await getAssetServerClient().listAssets({
    page: normalizedRequest.page,
    size: normalizedRequest.size,
    ...(normalizedRequest.keyword ? { keyword: normalizedRequest.keyword } : {}),
    ...(normalizedRequest.sort && normalizedRequest.sort.length > 0
      ? { sort: normalizedRequest.sort }
      : {}),
    ...createAssetScope(options.domain),
    ...(queryTypes && queryTypes.length > 0 ? { types: queryTypes } : {}),
  });

  const mappedPage = toPageResult(response.items || [], response.meta || {}, normalizedRequest);
  if (!options.allowedTypes || options.allowedTypes.length === 0) {
    return mappedPage;
  }

  const allowSet = new Set(options.allowedTypes);
  const filtered = mappedPage.content.filter(item => allowSet.has(item.type));
  return {
    ...mappedPage,
    content: filtered,
    numberOfElements: filtered.length,
    empty: filtered.length === 0,
  };
}

export async function importAssetBySdk(
  file: UploadFile,
  type: AssetType,
  options?: { domain?: AssetBusinessDomain },
): Promise<Asset> {
  if (!file || !file.name || !(file.data instanceof Uint8Array) || file.data.length === 0) {
    throw new Error('File data is empty, unable to import asset.');
  }

  const tempPath = await createTempImportFile(file);

  try {
    const response = await getAssetServerClient().importAssetFile({
      scope: createAssetScope(options?.domain),
      type: toContentKey(type),
      sourcePath: tempPath,
      name: file.name,
      metadata: {
        source: 'asset-import',
      },
    });

    return mapUnifiedAssetToAsset(response.data);
  } finally {
    try {
      await vfs.delete(tempPath);
    } catch {
      // Best-effort cleanup for temporary import files.
    }
  }
}

export async function importAssetFromUrlBySdk(
  sourceUrl: string,
  type: AssetType,
  options: { name: string; domain?: AssetBusinessDomain },
): Promise<Asset> {
  const normalizedSource = String(sourceUrl || '').trim();
  if (!normalizedSource) {
    throw new Error('Source url is required.');
  }

  if (/^https?:\/\//i.test(normalizedSource)) {
    const response = await getAssetServerClient().importAssetUrl({
      scope: createAssetScope(options.domain),
      type: toContentKey(type),
      url: normalizedSource,
      name: options.name,
      metadata: {
        source: 'asset-url-import',
      },
    });

    return mapUnifiedAssetToAsset(response.data);
  }

  const bytes = await resolveUploadBytesFromSourceUrl(normalizedSource);
  return importAssetBySdk(
    {
      name: options.name,
      data: bytes,
    },
    type,
    { domain: options.domain },
  );
}

export async function renameAssetBySdk(assetId: string, newName: string): Promise<void> {
  const normalizedName = newName.trim();
  if (!normalizedName) {
    throw new Error('Asset name is required.');
  }

  const detail = await getAssetServerClient().readAsset(assetId);
  await getAssetServerClient().updateAsset(assetId, {
    title: normalizedName,
    metadata: {
      ...(detail.data.metadata || {}),
      originalName: detail.data.title,
    },
  });
}

export async function deleteAssetBySdk(assetId: string): Promise<void> {
  await getAssetServerClient().deleteAsset(assetId);
}

export async function resolveAssetPrimaryUrlBySdk(assetId: string): Promise<string | null> {
  const normalizedAssetId = String(assetId || '').trim();
  if (!normalizedAssetId) {
    return null;
  }

  try {
    const detail = await getAssetServerClient().readAsset(normalizedAssetId);
    return resolvePrimaryAssetUrl(detail.data);
  } catch {
    return null;
  }
}
