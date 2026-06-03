import { describe, expect, it, vi } from 'vitest';
import {
  resolveMagicStudioAssetAbsolutePath,
  resolveMagicStudioAssetVirtualPath,
} from '@sdkwork/magic-studio-core/storage';

import type {
  AssetAtomicMediaResource,
  AssetDomainReference,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types';

import { AssetCenterService } from '../src/asset-center/application/AssetCenterService';
import type { AssetIndexPort } from '../src/asset-center/ports/AssetIndexPort';
import type { AssetMediaAnalyzerPort } from '../src/asset-center/ports/AssetMediaAnalyzerPort';
import type { AssetUrlResolverPort } from '../src/asset-center/ports/AssetUrlResolverPort';
import type { AssetVfsPort } from '../src/asset-center/ports/AssetVfsPort';

type MagicStudioStorageConfig = Awaited<
  ReturnType<AssetVfsPort['getMagicStudioStorageConfig']>
>;

const createManagedAssetPathResolvers = (storageConfig: MagicStudioStorageConfig) => ({
  toVirtualPath: vi.fn(async (absolutePath: string) =>
    resolveMagicStudioAssetVirtualPath(storageConfig, absolutePath)
  ),
  toAbsolutePath: vi.fn(async (virtualPath: string) =>
    resolveMagicStudioAssetAbsolutePath(storageConfig, virtualPath)
  ),
});

const createIndexPort = (
  assets: UnifiedDigitalAsset[]
): {
  indexPort: AssetIndexPort;
  deleteById: ReturnType<typeof vi.fn>;
} => {
  const store = new Map(assets.map((asset) => [asset.id, asset]));
  const deleteById = vi.fn(async (assetId: string) => {
    store.delete(assetId);
  });

  return {
    deleteById,
    indexPort: {
      initialize: vi.fn(async () => {}),
      save: vi.fn(async (asset) => {
        store.set(asset.id, asset);
      }),
      saveMany: vi.fn(async (items) => {
        for (const item of items) {
          store.set(item.id, item);
        }
      }),
      findById: vi.fn(async (assetId: string) => store.get(assetId) || null),
      deleteById,
      query: vi.fn(async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true,
        numberOfElements: 0,
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: { sorted: false, unsorted: true, empty: true },
          offset: 0,
          paged: true,
          unpaged: false,
        },
        sort: { sorted: false, unsorted: true, empty: true },
      })),
      count: vi.fn(async () => ({
        totalAssets: store.size,
        totalReady: store.size,
        totalProcessing: 0,
        totalArchived: 0,
        totalDeleted: 0,
        totalFavorites: 0,
        byType: {
          image: 0,
          video: store.size,
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
          'image-studio': 0,
          'video-studio': 0,
          'audio-studio': 0,
          music: 0,
          'voice-speaker': 0,
          magiccut: store.size,
          film: 0,
          'portal-video': 0,
          character: 0,
          sfx: 0,
        },
      })),
    },
  };
};

const createVfsPort = (
  deleteFile: ReturnType<typeof vi.fn>,
  configOverrides?: Partial<Awaited<ReturnType<AssetVfsPort['getMagicStudioStorageConfig']>>>
): AssetVfsPort => {
  const storageConfig = {
    rootDir: '/Users/demo/.sdkwork/magicstudio',
    ...configOverrides,
  } satisfies MagicStudioStorageConfig;

  return {
    getMode: () => 'desktop-fs',
    getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
    getMagicStudioStorageConfig: vi.fn(async () => storageConfig),
    ensureDir: vi.fn(async () => {}),
    exists: vi.fn(async () => true),
    list: vi.fn(async () => []),
    stat: vi.fn(async () => ({ isDirectory: false, size: 1024 })),
    writeText: vi.fn(async () => {}),
    readText: vi.fn(async () => '[]'),
    writeBinary: vi.fn(async () => {}),
    readBinary: vi.fn(async () => new Uint8Array()),
    writeBlob: vi.fn(async () => {}),
    readBlob: vi.fn(async () => new Blob()),
    copyFile: vi.fn(async () => {}),
    delete: deleteFile,
    ...createManagedAssetPathResolvers(storageConfig),
  };
};

const createResource = (path: string): AssetAtomicMediaResource => ({
  id: 'resource-1',
  uuid: 'resource-uuid-1',
  assetId: 'asset-1',
  primaryResourceId: 'resource-1',
  name: 'clip.mp4',
  type: 'video',
  url: path,
  path,
  extension: '.mp4',
  createdAt: '2026-04-07T10:00:00.000Z',
  updatedAt: '2026-04-07T10:00:00.000Z',
  metadata: {
    assetUuid: 'asset-uuid-1',
    primaryResourceId: 'resource-1',
    primaryResourceUuid: 'resource-uuid-1',
  },
});

const createAsset = (
  path: string,
  references?: AssetDomainReference[]
): UnifiedDigitalAsset => {
  const resource = createResource(path);
  return {
    id: 'asset-1',
    uuid: 'asset-uuid-1',
    assetId: 'asset-1',
    key: 'ws-1/magiccut/asset-1',
    title: 'Managed Clip',
    primaryType: 'video',
    payload: {
      video: resource,
      assets: [resource],
    },
    scope: {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      domain: 'magiccut',
    },
    storage: {
      mode: 'desktop-fs',
      primary: {
        protocol: 'file',
        uri: path,
        path,
      },
      cacheable: true,
    },
    status: 'ready',
    versionInfo: {
      version: 1,
    },
    metadata: {
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
    },
    references,
    createdAt: '2026-04-07T10:00:00.000Z',
    updatedAt: '2026-04-07T10:00:00.000Z',
  };
};

const createService = (
  asset: UnifiedDigitalAsset,
  configOverrides?: Partial<Awaited<ReturnType<AssetVfsPort['getMagicStudioStorageConfig']>>>
) => {
  const deleteFile = vi.fn(async () => {});
  const { indexPort, deleteById } = createIndexPort([asset]);

  const service = new AssetCenterService({
    vfsPort: createVfsPort(deleteFile, configOverrides),
    indexPort,
    urlResolver: {
      resolve: vi.fn(async (locator) => locator.uri),
    } satisfies AssetUrlResolverPort,
    analyzer: {
      analyze: vi.fn(async () => ({ metadata: {} })),
    } satisfies AssetMediaAnalyzerPort,
  });

  return {
    service,
    deleteFile,
    deleteById,
  };
};

describe('AssetCenterService delete safety', () => {
  it('deletes files that stay inside managed project storage roots', async () => {
    const managedPath =
      '/Users/demo/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1/media/originals/video/resource-1.mp4';
    const { service, deleteFile, deleteById } = createService(createAsset(managedPath));

    await service.deleteById('asset-1');

    expect(deleteFile).toHaveBeenCalledWith(managedPath);
    expect(deleteById).toHaveBeenCalledWith('asset-1');
  });

  it('removes the index record but refuses to delete external files outside managed storage', async () => {
    const externalPath = '/Users/demo/Desktop/imports/raw-resource-1.mp4';
    const { service, deleteFile, deleteById } = createService(createAsset(externalPath));

    await service.deleteById('asset-1');

    expect(deleteFile).not.toHaveBeenCalled();
    expect(deleteById).toHaveBeenCalledWith('asset-1');
  });

  it('refuses to delete assets that still have persisted domain references', async () => {
    const managedPath =
      '/Users/demo/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1/media/originals/video/resource-1.mp4';
    const { service, deleteFile, deleteById } = createService(
      createAsset(managedPath, [
        {
          domain: 'magiccut',
          entityType: 'clip',
          entityId: 'clip-1',
          relation: 'reference',
          slot: 'timeline',
        },
      ])
    );

    await expect(service.deleteById('asset-1')).rejects.toThrow(/reference/i);
    expect(deleteFile).not.toHaveBeenCalled();
    expect(deleteById).not.toHaveBeenCalled();
  });
});
