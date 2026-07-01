import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateDir = vi.fn(async () => {});
const mockExists = vi.fn(async () => false);
const mockSettingsGetSettings = vi.fn();
const mockRuntime = {
  system: {
    kind: () => 'desktop' as const,
    path: vi.fn(async (_scope: string) => '/Users/demo'),
  },
};

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {
    createDir: mockCreateDir,
    exists: mockExists,
    readdir: vi.fn(async () => []),
    stat: vi.fn(async () => ({ isDirectory: false, size: 0 })),
    writeFile: vi.fn(async () => {}),
    readFile: vi.fn(async () => ''),
    writeFileBinary: vi.fn(async () => {}),
    readFileBinary: vi.fn(async () => new Uint8Array()),
    writeFileBlob: vi.fn(async () => {}),
    readFileBlob: vi.fn(async () => new Blob()),
    copyFile: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  },
}));

vi.mock('@sdkwork/magic-studio-settings/services', () => ({
  settingsBusinessService: {
    getSettings: mockSettingsGetSettings,
  },
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  getPlatformRuntime: () => mockRuntime,
  isDesktopShellRuntimeKind: (kind: string) => kind === 'desktop',
}));

describe('RuntimeAssetVfs MagicStudio config', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateDir.mockClear();
    mockExists.mockClear();
    mockRuntime.system.path.mockClear();
    mockRuntime.system.path.mockResolvedValue('/Users/demo');
    mockSettingsGetSettings.mockReset();
    mockSettingsGetSettings.mockResolvedValue({
      success: true,
      data: {
        materialStorage: {
          desktop: {
            rootDir: '/Volumes/StudioRoot',
            workspacesRootDir: '/Volumes/Workspaces',
            cacheRootDir: '/Volumes/Cache',
            exportsRootDir: '/Volumes/Exports',
          },
        },
      },
    });
  });

  it('resolves project asset locators through the configured workspace root', async () => {
    const { RuntimeAssetVfs } = await import('../src/asset-center/infrastructure/RuntimeAssetVfs');
    const vfsPort = new RuntimeAssetVfs();

    await expect(vfsPort.getMagicStudioStorageConfig()).resolves.toEqual({
      rootDir: '/Volumes/StudioRoot',
      workspacesRootDir: '/Volumes/Workspaces',
      cacheRootDir: '/Volumes/Cache',
      exportsRootDir: '/Volumes/Exports',
    });
    expect(await vfsPort.getLibraryRoot()).toBe('/Volumes/StudioRoot');
    expect(mockCreateDir).toHaveBeenCalledWith('/Volumes/StudioRoot');
    expect(
      await vfsPort.toAbsolutePath(
        'assets://workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4'
      )
    ).toBe('/Volumes/Workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4');
    expect(
      await vfsPort.toAbsolutePath(
        'assets://system/library/image/poster.png'
      )
    ).toBe('/Volumes/StudioRoot/system/library/image/poster.png');
    expect(
      await vfsPort.toVirtualPath(
        '/Volumes/Workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4'
      )
    ).toBe('assets://workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4');
    expect(
      await vfsPort.toVirtualPath(
        '/Volumes/StudioRoot/system/library/image/poster.png'
      )
    ).toBe('assets://system/library/image/poster.png');
  });

  it('creates nested MagicStudio directories segment-by-segment on Windows paths', async () => {
    mockRuntime.system.path.mockResolvedValue('C:\\Users\\admin');
    mockSettingsGetSettings.mockResolvedValue({
      success: true,
      data: {
        materialStorage: {
          desktop: {
            rootDir: 'C:\\Users\\admin\\.sdkwork\\magicstudio',
          },
        },
      },
    });
    mockExists.mockResolvedValue(false);

    const { RuntimeAssetVfs } = await import('../src/asset-center/infrastructure/RuntimeAssetVfs');
    const vfsPort = new RuntimeAssetVfs();

    await vfsPort.ensureDir('C:\\Users\\admin\\.sdkwork\\magicstudio\\system\\indexes');

    expect(mockCreateDir.mock.calls.map((call) => call[0])).toEqual([
      'C:\\Users',
      'C:\\Users\\admin',
      'C:\\Users\\admin\\.sdkwork',
      'C:\\Users\\admin\\.sdkwork\\magicstudio',
      'C:\\Users\\admin\\.sdkwork\\magicstudio\\system',
      'C:\\Users\\admin\\.sdkwork\\magicstudio\\system\\indexes',
    ]);
  });
});
