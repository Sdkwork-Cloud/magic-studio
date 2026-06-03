import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioAssetImportFileRequest,
  MagicStudioAssetImportUrlRequest,
  MagicStudioAssetListQuery,
  MagicStudioAssetUpdateRequest,
  MagicStudioAssetUpsertRequest,
} from '@sdkwork/magic-studio-server';
import type {
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types/asset-center';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

const validAssetQueryParams = {
  page: 0,
  size: 20,
  sort: ['updatedAt,desc'],
  workspaceId: 'default-workspace',
  domain: 'image-studio',
  types: ['image'],
  includeDeleted: false,
} satisfies MagicStudioAssetListQuery;

const validImportFileRequest = {
  scope: {
    workspaceId: 'default-workspace',
    domain: 'image-studio',
  },
  type: 'image',
  sourcePath: 'C:/tmp/hero.png',
  name: 'Hero Frame',
  metadata: {
    source: 'asset-import',
  },
} satisfies MagicStudioAssetImportFileRequest;

const validImportUrlRequest = {
  scope: validImportFileRequest.scope,
  type: 'image',
  url: 'https://cdn.example.com/hero.png',
  name: 'Hero Frame',
  metadata: {
    source: 'asset-url-import',
  },
} satisfies MagicStudioAssetImportUrlRequest;

const validAssetUpdateRequest = {
  title: 'Hero Frame Final',
  tags: ['origin:upload'],
  isFavorite: false,
  metadata: {
    origin: 'upload',
  },
} satisfies MagicStudioAssetUpdateRequest;

const validUnifiedAsset = {
  assetId: 'asset-db-1',
  id: 'asset-db-1',
  uuid: 'asset-uuid-1',
  key: 'default-workspace/image-studio/asset-db-1',
  title: 'Hero Frame',
  primaryType: 'image',
  payload: {
    image: {
      id: 'resource-db-1',
      uuid: 'resource-uuid-1',
      name: 'Hero Frame',
      type: MediaResourceType.IMAGE,
      url: 'https://cdn.example.com/hero.png',
      path: 'https://cdn.example.com/hero.png',
      size: 3,
      origin: 'upload',
      metadata: {
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-db-1',
        primaryResourceUuid: 'resource-uuid-1',
      },
      createdAt: '2026-04-05T12:00:00.000Z',
      updatedAt: '2026-04-05T12:00:00.000Z',
    },
    assets: [],
  },
  scope: validImportFileRequest.scope,
  storage: {
    mode: 'remote-url',
    primary: {
      protocol: 'https',
      uri: 'https://cdn.example.com/hero.png',
      url: 'https://cdn.example.com/hero.png',
    },
    cacheable: false,
  },
  status: 'ready',
  tags: ['origin:upload'],
  isFavorite: false,
  versionInfo: {
    version: 1,
  },
  metadata: {
    origin: 'upload',
    assetUuid: 'asset-uuid-1',
    primaryResourceId: 'resource-db-1',
    primaryResourceUuid: 'resource-uuid-1',
  },
  createdAt: '2026-04-05T12:00:00.000Z',
  updatedAt: '2026-04-05T12:00:00.000Z',
} satisfies MagicStudioAssetUpsertRequest;

const validAssetEnvelope = {
  requestId: 'req-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  data: validUnifiedAsset,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<UnifiedDigitalAsset>;

const validAssetPage = {
  requestId: 'req-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  items: [validUnifiedAsset],
  meta: {
    page: 0,
    pageSize: 20,
    total: 1,
    version: 'v1',
  },
} satisfies MagicStudioApiListEnvelope<UnifiedDigitalAsset>;

void validAssetQueryParams;
void validImportFileRequest;
void validImportUrlRequest;
void validAssetUpdateRequest;
void validUnifiedAsset;
void validAssetEnvelope;
void validAssetPage;
