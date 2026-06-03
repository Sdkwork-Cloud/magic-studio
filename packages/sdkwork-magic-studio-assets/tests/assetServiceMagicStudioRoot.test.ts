import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPath = vi.fn();
const mockLoadResolvedMagicStudioStorageConfig = vi.fn();
const mockRuntimeKind = vi.fn();
const mockRuntimeReadBlob = vi.fn();
const mockResolveLocatorUrl = vi.fn();

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  getPlatformRuntime: () => ({
    system: {
      path: mockGetPath,
      kind: () => mockRuntimeKind(),
    },
    fileSystem: {
      convertFileSrc: (value: string) => value,
      readBlob: mockRuntimeReadBlob,
    },
  }),
  isDesktopShellRuntimeKind: (value: string) => value === 'desktop',
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
  vfs: {},
}));

vi.mock('../src/asset-center', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/asset-center')>();
  return {
    ...actual,
    assetCenterService: {
      initialize: vi.fn(async () => {}),
      registerExistingAsset: vi.fn(async () => {}),
      deleteById: vi.fn(async () => {}),
      resolveLocatorUrl: mockResolveLocatorUrl,
    },
    readWorkspaceScope: () => ({
      workspaceId: 'ws-1',
      projectId: 'proj-1',
    }),
  };
});

vi.mock('../src/asset-center/application/magicStudioStorageConfig', () => ({
  loadResolvedMagicStudioStorageConfig: mockLoadResolvedMagicStudioStorageConfig,
}));

describe('assetService MagicStudio root handling', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetPath.mockReset();
    mockLoadResolvedMagicStudioStorageConfig.mockReset();
    mockRuntimeKind.mockReset();
    mockRuntimeReadBlob.mockReset();
    mockResolveLocatorUrl.mockReset();
    mockGetPath.mockImplementation(async (name: string) => {
      if (name === 'home') {
        return '/Users/demo';
      }
      if (name === 'documents') {
        return '/Users/demo/Documents';
      }
      return '/Users/demo';
    });
    mockRuntimeKind.mockReturnValue('desktop');
    mockRuntimeReadBlob.mockImplementation(async () => new Blob(['asset'], { type: 'audio/wav' }));
    mockResolveLocatorUrl.mockResolvedValue('');
    mockLoadResolvedMagicStudioStorageConfig.mockResolvedValue({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });
  });

  it('stores managed assets under the canonical MagicStudio system library and keeps root-relative locators', async () => {
    const { assetService } = await import('../src/services/assetService');

    expect(await assetService.getLibraryRoot()).toBe('/Users/demo/.sdkwork/magicstudio/system/library');
    expect(
      await assetService.toVirtualPath('/Users/demo/.sdkwork/magicstudio/system/library/video/clip.mp4')
    ).toBe('assets://system/library/video/clip.mp4');
    expect(await assetService.toAbsolutePath('assets://system/library/video/clip.mp4')).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/library/video/clip.mp4'
    );
  });

  it('uses the configured MagicStudio root override for canonical system-library assets', async () => {
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

  it('resolves project-scoped asset locators through configured workspace root overrides', async () => {
    mockLoadResolvedMagicStudioStorageConfig.mockResolvedValue({
      rootDir: '/Volumes/StudioRoot',
      workspacesRootDir: '/Volumes/MagicStudioWorkspaces',
    });

    const { assetService } = await import('../src/services/assetService');

    expect(
      await assetService.toAbsolutePath(
        'assets://workspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4'
      )
    ).toBe('/Volumes/MagicStudioWorkspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4');
    expect(
      await assetService.toVirtualPath(
        '/Volumes/MagicStudioWorkspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4'
      )
    ).toBe('assets://workspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4');
  });

  it('does not treat a persisted asset id as a file path when resolving asset urls', async () => {
    const { assetService } = await import('../src/services/assetService');

    await expect(assetService.resolveAssetUrl({ id: 'asset-db-raw-1' })).resolves.toBe('');
  });

  it('hydrates explicit local locators through the server-backed runtime file system outside desktop mode', async () => {
    mockRuntimeKind.mockReturnValue('server');
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:server-local-audio');

    const { assetService } = await import('../src/services/assetService');

    await expect(
      assetService.resolveAssetUrl({
        path: 'file:///Users/demo/.sdkwork/magicstudio/system/library/audio/reference.wav',
      }),
    ).resolves.toBe('blob:server-local-audio');

    expect(mockRuntimeReadBlob).toHaveBeenCalledWith(
      '/Users/demo/.sdkwork/magicstudio/system/library/audio/reference.wav',
    );
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
  });
});
