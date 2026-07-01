import type {
  AssetBusinessDomain,
  AssetDomainReference,
  AssetLifecycleStatus,
  AssetScope,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types/asset-center';
import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';

export type MagicStudioAssetOrigin = 'upload' | 'ai' | 'stock' | 'system';

export interface MagicStudioAssetListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string[];
  workspaceId?: string;
  projectId?: string;
  collectionId?: string;
  domain?: AssetBusinessDomain;
  types?: AssetContentKey[];
  origins?: MagicStudioAssetOrigin[];
  tags?: string[];
  status?: AssetLifecycleStatus[];
  includeDeleted?: boolean;
  isFavorite?: boolean;
  referenceEntityType?: string;
  referenceEntityId?: string;
  referenceRelation?: string;
}

export interface MagicStudioAssetStatsQuery {
  workspaceId?: string;
  projectId?: string;
  collectionId?: string;
  domain?: AssetBusinessDomain;
}

export interface MagicStudioAssetImportFileRequest {
  scope: AssetScope;
  type: AssetContentKey;
  sourcePath: string;
  name?: string;
  description?: string;
  tags?: string[];
  labels?: string[];
  status?: AssetLifecycleStatus;
  references?: AssetDomainReference[];
  metadata?: Record<string, unknown>;
}

export interface MagicStudioAssetImportUrlRequest {
  scope: AssetScope;
  type: AssetContentKey;
  url: string;
  name: string;
  description?: string;
  tags?: string[];
  labels?: string[];
  status?: AssetLifecycleStatus;
  references?: AssetDomainReference[];
  metadata?: Record<string, unknown>;
}

export interface MagicStudioAssetUpdateRequest {
  title?: string;
  description?: string;
  tags?: string[];
  labels?: string[];
  status?: AssetLifecycleStatus;
  isFavorite?: boolean;
  references?: AssetDomainReference[];
  metadata?: Record<string, unknown>;
}

export type MagicStudioAssetUpsertRequest = UnifiedDigitalAsset;
