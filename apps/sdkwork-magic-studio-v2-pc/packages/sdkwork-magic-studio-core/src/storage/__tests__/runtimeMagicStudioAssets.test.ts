import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isCanonicalMagicStudioAssetReference,
  isMagicStudioAssetPath,
  isRenderableAssetUrl,
  MAGIC_STUDIO_ASSET_PROTOCOL,
  normalizeMagicStudioAssetReference,
  resolveMagicStudioAssetAbsolutePath,
  resolveMagicStudioAssetReferenceName,
  resolveMagicStudioAssetVirtualPath,
  resolveRuntimeMagicStudioAssetAbsolutePath,
  resolveRuntimeMagicStudioAssetUrl,
  type RuntimeMagicStudioAssetRuntime,
} from '../runtimeMagicStudioAssets';

const createRuntime = (
  kind: 'desktop' | 'server',
  settingsValue: string | null,
  readBlob = vi.fn(async () => new Blob(['managed-asset']))
): RuntimeMagicStudioAssetRuntime =>
  ({
    system: {
      kind: () => kind,
      os: async () => 'unknown',
      deviceId: async () => 'test-device',
      metadata: async () => ({ name: 'Magic Studio Test', version: '0.0.0' }),
      path: async () => '/Users/demo',
      theme: async () => 'light',
      isOnline: async () => true,
      commandExists: async () => false,
    },
    storage: {
      get: async () => settingsValue,
      set: async () => {},
      remove: async () => {},
      clear: async () => {},
      getJson: async <T>(_key: string, fallbackValue: T) => fallbackValue,
      setJson: async <T>(_key: string, _value: T) => {},
    },
    fileSystem: {
      selectFile: async () => [],
      selectDir: async () => null,
      saveText: async () => null,
      readDir: async () => [],
      readText: async () => '',
      writeText: async () => {},
      readBinary: async () => new Uint8Array(),
      writeBinary: async () => {},
      readBlob,
      writeBlob: async () => {},
      readJson: async <T>() => ({}) as T,
      writeJson: async <T>() => {},
      stat: async () => ({ type: 'file', size: 0, lastModified: Date.now() }),
      exists: async () => true,
      createDir: async () => {},
      remove: async () => {},
      rename: async () => {},
      copy: async () => {},
      convertFileSrc: (filePath: string) => `asset://localhost${filePath}`,
    },
  }) as RuntimeMagicStudioAssetRuntime;

describe('runtimeMagicStudioAssets', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps canonical asset locators into absolute filesystem paths with root overrides', async () => {
    const config = {
      rootDir: '/Volumes/StudioRoot',
      workspacesRootDir: '/Volumes/Workspaces',
      cacheRootDir: '/Volumes/Cache',
      exportsRootDir: '/Volumes/Exports',
    };

    expect(
      resolveMagicStudioAssetAbsolutePath(
        config,
        `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4`
      )
    ).toBe('/Volumes/Workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4');
    expect(
      resolveMagicStudioAssetAbsolutePath(
        config,
        `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/ws-1/projects/proj-1/cache/temp/video/asset-2.mp4`
      )
    ).toBe('/Volumes/Cache/ws-1/proj-1/cache/temp/video/asset-2.mp4');
    expect(
      resolveMagicStudioAssetAbsolutePath(
        config,
        `${MAGIC_STUDIO_ASSET_PROTOCOL}system/library/image/poster.png`
      )
    ).toBe('/Volumes/StudioRoot/system/library/image/poster.png');
  });

  it('maps absolute managed paths back into canonical assets:// locators', () => {
    const config = {
      rootDir: '/Volumes/StudioRoot',
      workspacesRootDir: '/Volumes/Workspaces',
      cacheRootDir: '/Volumes/Cache',
      exportsRootDir: '/Volumes/Exports',
    };

    expect(
      resolveMagicStudioAssetVirtualPath(
        config,
        '/Volumes/Workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4'
      )
    ).toBe(`${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4`);
    expect(
      resolveMagicStudioAssetVirtualPath(
        config,
        '/Volumes/StudioRoot/system/library/audio/voice.wav'
      )
    ).toBe(`${MAGIC_STUDIO_ASSET_PROTOCOL}system/library/audio/voice.wav`);
    expect(isMagicStudioAssetPath(`${MAGIC_STUDIO_ASSET_PROTOCOL}system/library/text/note.txt`)).toBe(true);
  });

  it('resolves runtime asset paths and renderable urls for desktop hosts', async () => {
    const runtime = createRuntime(
      'desktop',
      JSON.stringify({
        materialStorage: {
          desktop: {
            rootDir: '/Volumes/StudioRoot',
            workspacesRootDir: '/Volumes/Workspaces',
          },
        },
      }),
    );

    await expect(
      resolveRuntimeMagicStudioAssetAbsolutePath(
        runtime,
        `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4`
      )
    ).resolves.toBe('/Volumes/Workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4');

    await expect(
      resolveRuntimeMagicStudioAssetUrl(
        runtime,
        `${MAGIC_STUDIO_ASSET_PROTOCOL}system/library/image/poster.png`
      )
    ).resolves.toBe('asset://localhost/Volumes/StudioRoot/system/library/image/poster.png');
  });

  it('resolves browser-hosted asset urls by reading managed blobs from canonical absolute paths', async () => {
    const readBlob = vi.fn(async () => new Blob(['managed-asset']));
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:magic-studio-managed-asset');
    const runtime = createRuntime(
      'server',
      JSON.stringify({
        materialStorage: {
          desktop: {
            rootDir: '/Volumes/StudioRoot',
          },
        },
      }),
      readBlob
    );

    await expect(
      resolveRuntimeMagicStudioAssetUrl(
        runtime,
        `${MAGIC_STUDIO_ASSET_PROTOCOL}system/library/image/poster.png`
      )
    ).resolves.toBe('blob:magic-studio-managed-asset');

    expect(readBlob).toHaveBeenCalledWith('/Volumes/StudioRoot/system/library/image/poster.png');
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('supports explicit local locators across desktop and browser-hosted server runtimes', async () => {
    const desktopRuntime = createRuntime('desktop', null);
    const serverReadBlob = vi.fn(async () => new Blob(['local-explicit-asset']));
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:magic-studio-explicit-local-asset');
    const serverRuntime = createRuntime('server', null, serverReadBlob);

    await expect(
      resolveRuntimeMagicStudioAssetUrl(
        desktopRuntime,
        'desktop:///Volumes/StudioRoot/system/library/audio/reference.wav',
      ),
    ).resolves.toBe('asset://localhost/Volumes/StudioRoot/system/library/audio/reference.wav');

    await expect(
      resolveRuntimeMagicStudioAssetUrl(
        serverRuntime,
        'file:///Volumes/StudioRoot/system/library/audio/reference.wav',
      ),
    ).resolves.toBe('blob:magic-studio-explicit-local-asset');

    expect(serverReadBlob).toHaveBeenCalledWith(
      '/Volumes/StudioRoot/system/library/audio/reference.wav',
    );
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('normalizes canonical asset references and derives stable filenames from them', () => {
    expect(
      normalizeMagicStudioAssetReference(
        'D:\\magic-studio\\workspace-1\\project-cover.png'
      )
    ).toBe('file://D:\\magic-studio\\workspace-1\\project-cover.png');
    expect(
      isCanonicalMagicStudioAssetReference(
        normalizeMagicStudioAssetReference(
          'D:\\magic-studio\\workspace-1\\project-cover.png'
        )
      )
    ).toBe(true);
    expect(
      resolveMagicStudioAssetReferenceName(
        `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/ws-1/projects/proj-1/media/originals/image/project-cover.png`
      )
    ).toBe('project-cover.png');
    expect(isRenderableAssetUrl('https://cdn.example.com/project-cover.png')).toBe(true);
  });
});
