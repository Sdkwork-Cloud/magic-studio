import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioAssetListQuery,
  MagicStudioAssetUpsertRequest,
} from '@sdkwork/magic-studio-server';
import type {
  AssetCenterStats,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types/asset-center';

const validRepositoryQueryParams = {
  page: 0,
  size: 20,
  keyword: 'hero',
  sort: ['updatedAt,desc'],
  types: ['image'],
  origins: ['upload'],
  tags: ['cover'],
  status: ['ready'],
  includeDeleted: false,
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  domain: 'image-studio',
  referenceEntityType: 'shot',
  referenceEntityId: 'shot-1',
  referenceRelation: 'reference',
} satisfies MagicStudioAssetListQuery;

const validRepositoryAsset = {
  assetId: 'asset-1',
  id: 'asset-1',
  uuid: 'asset-uuid-1',
  key: 'workspace-1/image-studio/asset-1',
  title: 'Hero Image',
  primaryType: 'image',
  payload: {
    assets: [],
  },
  scope: {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    domain: 'image-studio',
  },
  storage: {
    mode: 'remote-url',
    primary: {
      protocol: 'https',
      uri: 'https://cdn.example.com/assets/hero-image.png',
      url: 'https://cdn.example.com/assets/hero-image.png',
    },
    cacheable: true,
  },
  status: 'ready',
  versionInfo: {
    version: 1,
  },
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
} satisfies MagicStudioAssetUpsertRequest;

const validRepositoryAssetEnvelope = {
  requestId: 'req-1',
  timestamp: '2026-04-05T00:00:00.000Z',
  data: validRepositoryAsset,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<UnifiedDigitalAsset>;

const validRepositoryPage = {
  requestId: 'req-1',
  timestamp: '2026-04-05T00:00:00.000Z',
  items: [validRepositoryAsset],
  meta: {
    page: 0,
    pageSize: 20,
    total: 1,
    version: 'v1',
  },
} satisfies MagicStudioApiListEnvelope<UnifiedDigitalAsset>;

const validRepositoryStats = {
  totalAssets: 1,
  totalReady: 1,
  totalProcessing: 0,
  totalArchived: 0,
  totalDeleted: 0,
  totalFavorites: 0,
  byType: {
    image: 1,
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
    'image-studio': 1,
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
} satisfies AssetCenterStats;

void validRepositoryQueryParams;
void validRepositoryAsset;
void validRepositoryAssetEnvelope;
void validRepositoryPage;
void validRepositoryStats;
