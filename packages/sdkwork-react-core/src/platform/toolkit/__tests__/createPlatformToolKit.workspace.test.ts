import { describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '../../runtime';
import { createPlatformToolKit } from '../createPlatformToolKit';
import { MAGICSTUDIO_SETTINGS_STORAGE_KEY } from '../../../storage';

const createMockRuntime = (settingsValue: string | null = null) => {
  const createDir = vi.fn(async () => {});
  const storageGet = vi.fn(async (key: string) =>
    key === MAGICSTUDIO_SETTINGS_STORAGE_KEY ? settingsValue : null
  );

  const runtime = {
    raw: {} as never,
    bridge: {
      available: () => false,
      invoke: vi.fn(async () => {
        throw new Error('bridge unavailable');
      }),
      listen: vi.fn(async () => () => {}),
    },
    system: {
      kind: () => 'desktop' as const,
      os: async () => 'macos' as const,
      deviceId: async () => 'mock-device',
      metadata: async () => ({ name: 'MagicStudio', version: '1.0.0' }),
      path: async (name: string) => (name === 'home' ? '/Users/demo' : `/tmp/${name}`),
      theme: async () => 'dark' as const,
      isOnline: async () => true,
      commandExists: async () => false,
    },
    storage: {
      get: storageGet,
      set: vi.fn(async () => {}),
      remove: vi.fn(async () => {}),
      clear: vi.fn(async () => {}),
      getJson: vi.fn(async (_key: string, fallbackValue: unknown) => fallbackValue),
      setJson: vi.fn(async () => {}),
    },
    fileSystem: {
      selectFile: vi.fn(async () => []),
      selectDir: vi.fn(async () => null),
      saveText: vi.fn(async () => null),
      readDir: vi.fn(async () => []),
      readText: vi.fn(async () => ''),
      writeText: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBinary: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      writeBlob: vi.fn(async () => {}),
      readJson: vi.fn(async () => ({})),
      writeJson: vi.fn(async () => {}),
      stat: vi.fn(async () => ({
        type: 'directory',
        size: 0,
        lastModified: Date.now(),
      })),
      exists: vi.fn(async () => false),
      createDir,
      remove: vi.fn(async () => {}),
      rename: vi.fn(async () => {}),
      copy: vi.fn(async () => {}),
      convertFileSrc: (filePath: string) => filePath,
    },
    network: {
      request: vi.fn(async () => new Response('')),
      requestJson: vi.fn(async () => ({})),
      requestText: vi.fn(async () => ''),
      requestBinary: vi.fn(async () => new Uint8Array()),
      downloadToFile: vi.fn(async () => {}),
    },
    app: {
      restart: vi.fn(async () => {}),
      quit: vi.fn(async () => {}),
      toggleDevTools: vi.fn(async () => {}),
      checkForUpdates: vi.fn(async () => null),
      installUpdate: vi.fn(async () => {}),
    },
    window: {
      startDragging: vi.fn(async () => {}),
      minimize: vi.fn(async () => {}),
      maximize: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
      setFullscreen: vi.fn(async () => {}),
      setTitle: vi.fn(async () => {}),
      setAppBadge: vi.fn(async () => {}),
    },
    dialog: {
      confirm: vi.fn(async () => true),
      notify: vi.fn(async () => {}),
    },
    clipboard: {
      copy: vi.fn(async () => {}),
      paste: vi.fn(async () => ''),
    },
    shell: {
      openExternal: vi.fn(async () => {}),
      showItemInFolder: vi.fn(async () => {}),
    },
    terminal: {
      create: vi.fn(async () => 'terminal-1'),
      start: vi.fn(async () => {}),
      resize: vi.fn(async () => {}),
      write: vi.fn(async () => {}),
      onData: vi.fn(() => () => {}),
      kill: vi.fn(async () => {}),
      syncSessions: vi.fn(async () => {}),
    },
    browser: {
      supported: () => false,
      create: vi.fn(async () => {
        throw new Error('browser unsupported');
      }),
    },
  } as unknown as PlatformRuntime;

  return {
    runtime,
    createDir,
    storageGet,
  };
};

describe('createPlatformToolKit workspace dirs', () => {
  it('resolves MagicStudio local workspace directories from persisted storage overrides', async () => {
    const { runtime } = createMockRuntime(
      JSON.stringify({
        materialStorage: {
          desktop: {
            rootDir: '~/.sdkwork/magicstudio',
            workspacesRootDir: '/Volumes/MagicStudioWorkspaces',
            cacheRootDir: '/Volumes/MagicStudioCache',
            exportsRootDir: '/Volumes/MagicStudioExports',
          },
        },
      })
    );

    const toolkit = createPlatformToolKit(runtime);
    const dirs = await toolkit.workspace.resolveLocalDirs('magiccut');

    expect(dirs.root).toBe('/Users/demo/.sdkwork/magicstudio');
    expect(dirs.projects).toBe('/Volumes/MagicStudioWorkspaces/magiccut/projects');
    expect(dirs.media).toBe('/Volumes/MagicStudioWorkspaces/magiccut');
    expect(dirs.imports).toBe('/Users/demo/.sdkwork/magicstudio/system/temp/workspaces/magiccut/imports');
    expect(dirs.exports).toBe('/Volumes/MagicStudioExports/magiccut/toolkit/exports');
    expect(dirs.cache).toBe('/Volumes/MagicStudioCache/magiccut/toolkit/cache');
    expect(dirs.temp).toBe('/Users/demo/.sdkwork/magicstudio/system/temp/workspaces/magiccut/temp');
    expect(dirs.recordings).toBe('/Users/demo/.sdkwork/magicstudio/system/temp/workspaces/magiccut/recordings');
    expect(dirs.database).toBe('/Users/demo/.sdkwork/magicstudio/system/indexes');
    expect(dirs.logs).toBe('/Users/demo/.sdkwork/magicstudio/system/logs');
  });

  it('creates override-aware directories when ensuring local workspace dirs', async () => {
    const { runtime, createDir } = createMockRuntime(
      JSON.stringify({
        materialStorage: {
          desktop: {
            rootDir: '~/.sdkwork/magicstudio',
            workspacesRootDir: '/Volumes/MagicStudioWorkspaces',
            cacheRootDir: '/Volumes/MagicStudioCache',
            exportsRootDir: '/Volumes/MagicStudioExports',
          },
        },
      })
    );

    const toolkit = createPlatformToolKit(runtime);
    await toolkit.workspace.ensureLocalDirs('magiccut');

    expect(createDir).toHaveBeenCalledWith('/Users/demo/.sdkwork/magicstudio');
    expect(createDir).toHaveBeenCalledWith('/Volumes/MagicStudioWorkspaces/magiccut/projects');
    expect(createDir).toHaveBeenCalledWith('/Volumes/MagicStudioCache/magiccut/toolkit/cache');
    expect(createDir).toHaveBeenCalledWith('/Volumes/MagicStudioExports/magiccut/toolkit/exports');
    expect(createDir).toHaveBeenCalledWith('/Users/demo/.sdkwork/magicstudio/system/indexes');
  });
});
