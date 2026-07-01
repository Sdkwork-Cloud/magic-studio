import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPath = vi.fn();
const mockLoadResolvedMagicStudioStorageConfig = vi.fn();
const mockDelete = vi.fn();
const mockAssetCenterDeleteById = vi.fn();

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  platform: {
    getPath: mockGetPath,
    getPlatform: () => 'desktop',
    convertFileSrc: (value: string) => value,
  },
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  mediaAnalysisService: {
    analyze: vi.fn(async () => ({ metadata: {} })),
  },
}));

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {
    delete: mockDelete,
  },
}));

vi.mock('../src/asset-center', () => ({
  assetCenterService: {
    initialize: vi.fn(async () => {}),
    registerExistingAsset: vi.fn(async () => {}),
    deleteById: mockAssetCenterDeleteById,
  },
  readWorkspaceScope: () => ({
    workspaceId: 'ws-1',
    projectId: 'proj-1',
  }),
}));

vi.mock('../src/asset-center/application/magicStudioStorageConfig', () => ({
  loadResolvedMagicStudioStorageConfig: mockLoadResolvedMagicStudioStorageConfig,
}));

describe('assetService identity handling', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetPath.mockReset();
    mockLoadResolvedMagicStudioStorageConfig.mockReset();
    mockDelete.mockReset();
    mockAssetCenterDeleteById.mockReset();

    mockGetPath.mockImplementation(async (name: string) => {
      if (name === 'home') {
        return '/Users/demo';
      }
      return '/Users/demo';
    });
    mockLoadResolvedMagicStudioStorageConfig.mockResolvedValue({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });
    mockDelete.mockResolvedValue(undefined);
    mockAssetCenterDeleteById.mockResolvedValue(undefined);
  });

  it('findById resolves a cached asset by uuid before persisted id fallback', async () => {
    const { assetService } = await import('../src/services/assetService');

    const cachedAsset = {
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      name: 'Identity Asset',
      type: 'image',
      path: 'assets://system/library/image/identity.png',
      size: 1,
      origin: 'upload',
      createdAt: 1,
      updatedAt: 1,
      metadata: {},
    };

    const service = assetService as any;
    service._initialized = true;
    service._cache = [cachedAsset];

    const result = await assetService.findById('asset-uuid-1');

    expect(result.data).toEqual(cachedAsset);
  });

  it('delete(entity) resolves transient entities by uuid but deletes the cached asset by its actual persisted identifier', async () => {
    const { assetService } = await import('../src/services/assetService');

    const cachedAsset = {
      id: 'assets://system/library/image/transient.png',
      uuid: 'asset-uuid-transient-1',
      name: 'Transient Asset',
      type: 'image',
      path: 'assets://system/library/image/transient.png',
      size: 1,
      origin: 'ai',
      createdAt: 1,
      updatedAt: 1,
      metadata: {},
    };

    const service = assetService as any;
    service._initialized = true;
    service._cache = [cachedAsset];
    service._urlCache = new Map();
    service._resolveRequests = new Map();

    await assetService.delete({
      id: null,
      uuid: 'asset-uuid-transient-1',
    } as any);

    expect(service._cache).toEqual([]);
    expect(mockDelete).toHaveBeenCalledWith('/Users/demo/.sdkwork/magicstudio/system/library/image/transient.png');
    expect(mockAssetCenterDeleteById).toHaveBeenCalledWith('assets://system/library/image/transient.png');
  });
});
