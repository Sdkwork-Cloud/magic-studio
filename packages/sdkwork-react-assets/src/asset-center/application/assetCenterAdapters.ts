import type { Page, PageRequest } from '@sdkwork/react-commons';
import type { AssetContentKey, AssetScope, UnifiedDigitalAsset } from '@sdkwork/react-types';
import type { Asset, AssetOrigin, AssetType, AnyAsset } from '../../entities';
import { mapContentKeyToMediaType, readUnifiedPayloadPrimary } from '../domain/assetCenter.domain';
import { assetUiStateService } from '../../services/assetUiStateService';

const toAssetType = (type: AssetContentKey): AssetType => {
  return type;
};

const toAssetOrigin = (value: unknown): AssetOrigin => {
  if (value === 'upload' || value === 'ai' || value === 'stock' || value === 'system') {
    return value;
  }
  return 'stock';
};

const pickPrimary = (item: UnifiedDigitalAsset): AnyAsset | null => {
  return (readUnifiedPayloadPrimary(item.payload, item.primaryType) as AnyAsset | undefined) || null;
};

export interface WorkspaceScopeOptions {
  workspaceKey?: string;
  projectKey?: string;
  defaultWorkspaceId?: string;
  collectionId?: string;
}

export const readWorkspaceScope = (
  options: WorkspaceScopeOptions = {}
): Omit<AssetScope, 'domain'> => {
  const workspaceKey = options.workspaceKey || 'sdkwork_workspace_id';
  const projectKey = options.projectKey || 'sdkwork_project_id';
  const defaultWorkspaceId = options.defaultWorkspaceId || 'default-workspace';
  const readStorage = (key: string): string | null => {
    return assetUiStateService.readStorageValue(key);
  };

  return {
    workspaceId: readStorage(workspaceKey) || defaultWorkspaceId,
    projectId: readStorage(projectKey) || undefined,
    collectionId: options.collectionId
  };
};

export const normalizeSpringPageRequest = (request: PageRequest): PageRequest => ({
  page: Math.max(0, request.page ?? 0),
  size: Math.max(1, request.size ?? 20),
  sort: request.sort
    ?.map((item) => item.trim())
    .filter((item): item is string => item.length > 0),
  keyword: request.keyword?.trim() || undefined
});

export const mapUnifiedAssetToAnyAsset = (item: UnifiedDigitalAsset): AnyAsset | null => {
  const primary = pickPrimary(item);
  if (!primary) {
    return null;
  }
  return {
    ...primary,
    id: item.assetId,
    uuid: item.uuid,
    name: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    type: mapContentKeyToMediaType(item.primaryType),
    path: primary.path || item.storage.primary.uri,
    url: primary.url || item.storage.primary.url,
    origin: toAssetOrigin(primary.origin ?? item.metadata?.origin),
    isFavorite: !!item.isFavorite,
    metadata: {
      ...(primary.metadata || {}),
      ...(item.metadata || {})
    }
  } as AnyAsset;
};

export const mapUnifiedAssetToAsset = (item: UnifiedDigitalAsset): Asset | null => {
  const primary = pickPrimary(item);
  if (!primary) {
    return null;
  }
  const metadata: Record<string, unknown> = {
    ...(primary.metadata || {}),
    ...(item.metadata || {})
  };
  return {
    id: item.assetId,
    uuid: item.uuid,
    name: item.title,
    type: toAssetType(item.primaryType),
    path: primary.path || item.storage.primary.uri || '',
    size: Number(primary.size || 0),
    origin: toAssetOrigin(primary.origin ?? metadata.origin),
    metadata,
    isFavorite: !!item.isFavorite,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  } as Asset;
};

export const mapUnifiedPageToAnyAssetPage = (
  page: Page<UnifiedDigitalAsset>
): Page<AnyAsset> => {
  const content = page.content
    .map((item) => mapUnifiedAssetToAnyAsset(item))
    .filter((item): item is AnyAsset => item !== null);

  return {
    ...page,
    content,
    numberOfElements: content.length,
    empty: content.length === 0
  };
};

export const mapUnifiedPageToAssetPage = (
  page: Page<UnifiedDigitalAsset>
): Page<Asset> => {
  const content = page.content
    .map((item) => mapUnifiedAssetToAsset(item))
    .filter((item): item is Asset => item !== null);

  return {
    ...page,
    content,
    numberOfElements: content.length,
    empty: content.length === 0
  };
};
