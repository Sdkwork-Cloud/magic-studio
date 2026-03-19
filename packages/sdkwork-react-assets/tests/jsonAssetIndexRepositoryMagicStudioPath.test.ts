import { describe, expect, it, vi } from 'vitest';

import { JsonAssetIndexRepository } from '../src/asset-center/infrastructure/JsonAssetIndexRepository';
import type { AssetVfsPort } from '../src/asset-center/ports/AssetVfsPort';
import type { UnifiedDigitalAsset } from '@sdkwork/react-types';

const createStoredAsset = (assetId: string): UnifiedDigitalAsset =>
  ({
    id: assetId,
    uuid: assetId,
    assetId,
    key: `workspace-1/magiccut/${assetId}`,
    title: `${assetId}.mp4`,
    primaryType: 'video',
    payload: {
      video: {
        id: `${assetId}-resource`,
        uuid: `${assetId}-resource`,
        name: `${assetId}.mp4`,
        type: 'video',
        path: `assets://workspaces/workspace-1/projects/project-1/media/originals/video/${assetId}.mp4`,
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      },
      assets: [],
    },
    scope: {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      domain: 'magiccut',
    },
    storage: {
      mode: 'tauri-fs',
      primary: {
        protocol: 'assets',
        uri: `assets://workspaces/workspace-1/projects/project-1/media/originals/video/${assetId}.mp4`,
      },
      cacheable: true,
    },
    status: 'ready',
    tags: [],
    labels: [],
    isFavorite: false,
    versionInfo: {
      version: 1,
    },
    createdAt: '2026-03-19T00:00:00.000Z',
    updatedAt: '2026-03-19T00:00:00.000Z',
    metadata: {},
  }) as UnifiedDigitalAsset;

describe('JsonAssetIndexRepository MagicStudio layout', () => {
  it('stores the local asset index under the MagicStudio system indexes directory', async () => {
    const ensureDir = vi.fn(async () => {});
    const writeText = vi.fn(async () => {});
    const getLibraryRoot = vi.fn(async () => '/Users/demo/.sdkwork/magicstudio');
    const getMagicStudioStorageConfig = vi.fn(async () => ({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    }));

    const vfsPort: AssetVfsPort = {
      getMode: () => 'tauri-fs',
      getLibraryRoot,
      getMagicStudioStorageConfig,
      ensureDir,
      exists: vi.fn(async () => false),
      list: vi.fn(async () => []),
      stat: vi.fn(async () => ({ isDirectory: false, size: 0 })),
      writeText,
      readText: vi.fn(async () => '[]'),
      writeBinary: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBlob: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      copyFile: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
      toVirtualPath: vi.fn(async (absolutePath: string) => absolutePath),
      toAbsolutePath: vi.fn(async (virtualPath: string) => virtualPath),
    };

    const repository = new JsonAssetIndexRepository(vfsPort);

    await repository.initialize();

    expect(getMagicStudioStorageConfig).toHaveBeenCalledTimes(1);
    expect(getLibraryRoot).not.toHaveBeenCalled();
    expect(ensureDir).toHaveBeenCalledWith('/Users/demo/.sdkwork/magicstudio/system/indexes');
    expect(writeText).toHaveBeenCalledWith(
      '/Users/demo/.sdkwork/magicstudio/system/indexes/assets-index.json',
      JSON.stringify([], null, 2)
    );
  });

  it('reinitializes against the active MagicStudio root when storage settings change at runtime', async () => {
    const rootA = '/Users/demo/.sdkwork/magicstudio';
    const rootB = '/Volumes/StudioRoot';
    const rootAIndexDir = `${rootA}/system/indexes`;
    const rootBIndexDir = `${rootB}/system/indexes`;
    const rootAIndexPath = `${rootAIndexDir}/assets-index.json`;
    const rootBIndexPath = `${rootBIndexDir}/assets-index.json`;
    const storedAsset = createStoredAsset('asset-root-a');
    const ensuredDirectories = new Set<string>();
    const files = new Map<string, string>([[rootAIndexPath, JSON.stringify([storedAsset], null, 2)]]);
    const getMagicStudioStorageConfig = vi
      .fn<AssetVfsPort['getMagicStudioStorageConfig']>()
      .mockResolvedValueOnce({ rootDir: rootA })
      .mockResolvedValueOnce({ rootDir: rootA })
      .mockResolvedValue({ rootDir: rootB });

    const ensureDir = vi.fn(async (dir: string) => {
      ensuredDirectories.add(dir);
    });
    const exists = vi.fn(async (path: string) => files.has(path));
    const readText = vi.fn(async (path: string) => {
      const value = files.get(path);
      if (!value) {
        throw new Error(`Unexpected read: ${path}`);
      }
      return value;
    });
    const writeText = vi.fn(async (path: string, content: string) => {
      const parentDir = path.slice(0, path.lastIndexOf('/'));
      if (!ensuredDirectories.has(parentDir)) {
        throw new Error(`Directory was not prepared: ${parentDir}`);
      }
      files.set(path, content);
    });

    const vfsPort: AssetVfsPort = {
      getMode: () => 'tauri-fs',
      getLibraryRoot: vi.fn(async () => rootA),
      getMagicStudioStorageConfig,
      ensureDir,
      exists,
      list: vi.fn(async () => []),
      stat: vi.fn(async () => ({ isDirectory: false, size: 0 })),
      writeText,
      readText,
      writeBinary: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBlob: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      copyFile: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
      toVirtualPath: vi.fn(async (absolutePath: string) => absolutePath),
      toAbsolutePath: vi.fn(async (virtualPath: string) => virtualPath),
    };

    const repository = new JsonAssetIndexRepository(vfsPort);

    await repository.initialize();
    expect(await repository.findById('asset-root-a')).toMatchObject({ assetId: 'asset-root-a' });

    const switchedAssets = await repository.list();

    expect(switchedAssets).toEqual([]);
    expect(ensureDir).toHaveBeenCalledWith(rootBIndexDir);
    expect(writeText).toHaveBeenCalledWith(rootBIndexPath, JSON.stringify([], null, 2));
  });
});
