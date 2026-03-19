import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPath = vi.fn();
const mockLoadResolvedMagicStudioStorageConfig = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  platform: {
    getPath: mockGetPath,
    getPlatform: () => 'desktop',
    convertFileSrc: (value: string) => value,
  },
  mediaAnalysisService: {
    analyze: vi.fn(async () => ({ metadata: {} })),
  },
}));

vi.mock('@sdkwork/react-fs', () => ({
  vfs: {},
  storageConfig: {
    library: {
      root: '.sdkwork/magicstudio/library',
    },
    globalCache: {
      thumbnails: 'system/cache/thumbnails',
    },
  },
  LIBRARY_SUBDIRS: {
    DOWNLOADS: 'downloads',
    IMAGES: 'images',
    AUDIO: 'audio',
    VIDEO: 'video',
    MODELS: 'models',
  },
}));

vi.mock('../src/asset-center', () => ({
  assetCenterService: {
    initialize: vi.fn(async () => {}),
    registerExistingAsset: vi.fn(async () => {}),
    deleteById: vi.fn(async () => {}),
  },
  readWorkspaceScope: () => ({
    workspaceId: 'ws-1',
    projectId: 'proj-1',
  }),
}));

vi.mock('../src/asset-center/application/magicStudioStorageConfig', () => ({
  loadResolvedMagicStudioStorageConfig: mockLoadResolvedMagicStudioStorageConfig,
}));

describe('assetService MagicStudio root handling', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetPath.mockReset();
    mockLoadResolvedMagicStudioStorageConfig.mockReset();
    mockGetPath.mockImplementation(async (name: string) => {
      if (name === 'home') {
        return '/Users/demo';
      }
      if (name === 'documents') {
        return '/Users/demo/Documents';
      }
      return '/Users/demo';
    });
    mockLoadResolvedMagicStudioStorageConfig.mockResolvedValue({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });
  });

  it('stores legacy library-style assets under the MagicStudio system library and keeps root-relative locators', async () => {
    const { assetService } = await import('../src/services/assetService');

    expect(await assetService.getLibraryRoot()).toBe('/Users/demo/.sdkwork/magicstudio/system/library');
    expect(
      await assetService.toVirtualPath('/Users/demo/.sdkwork/magicstudio/system/library/video/clip.mp4')
    ).toBe('assets://system/library/video/clip.mp4');
    expect(await assetService.toAbsolutePath('assets://system/library/video/clip.mp4')).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/library/video/clip.mp4'
    );
  });

  it('uses the configured MagicStudio root override for legacy library assets', async () => {
    mockLoadResolvedMagicStudioStorageConfig.mockResolvedValue({
      rootDir: '/Volumes/StudioRoot',
    });

    const { assetService } = await import('../src/services/assetService');

    expect(await assetService.getLibraryRoot()).toBe('/Volumes/StudioRoot/system/library');
    expect(
      await assetService.toVirtualPath('/Volumes/StudioRoot/system/library/image/still.png')
    ).toBe('assets://system/library/image/still.png');
    expect(await assetService.toAbsolutePath('assets://system/library/image/still.png')).toBe(
      '/Volumes/StudioRoot/system/library/image/still.png'
    );
  });
});
