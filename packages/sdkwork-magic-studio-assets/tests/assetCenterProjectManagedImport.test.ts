import { describe, expect, it, vi } from 'vitest';
import {
  resolveMagicStudioAssetAbsolutePath,
  resolveMagicStudioAssetVirtualPath,
} from '@sdkwork/magic-studio-core/storage';

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

const createIndexPort = (): AssetIndexPort => ({
  initialize: vi.fn(async () => {}),
  save: vi.fn(async () => {}),
  saveMany: vi.fn(async () => {}),
  findById: vi.fn(async () => null),
  deleteById: vi.fn(async () => {}),
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
    totalAssets: 0,
    totalReady: 0,
    totalProcessing: 0,
    totalArchived: 0,
    totalDeleted: 0,
    totalFavorites: 0,
    byType: {
      image: 0,
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
      'image-studio': 0,
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
  })),
});

describe('AssetCenterService project managed import', () => {
  it('copies desktop source files into the active project originals directory', async () => {
    const ensureDir = vi.fn(async () => {});
    const copyFile = vi.fn(async () => {});
    const stat = vi.fn(async () => ({ isDirectory: false, size: 4096 }));
    const storageConfig = {
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    } satisfies MagicStudioStorageConfig;

    const vfsPort: AssetVfsPort = {
      getMode: () => 'desktop-fs',
      getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
      getMagicStudioStorageConfig: vi.fn(async () => storageConfig),
      ensureDir,
      exists: vi.fn(async () => false),
      list: vi.fn(async () => []),
      stat,
      writeText: vi.fn(async () => {}),
      readText: vi.fn(async () => '[]'),
      writeBinary: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBlob: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      copyFile,
      delete: vi.fn(async () => {}),
      ...createManagedAssetPathResolvers(storageConfig),
    };

    const urlResolver: AssetUrlResolverPort = {
      resolve: vi.fn(async (locator) => locator.uri),
    };

    const analyzer: AssetMediaAnalyzerPort = {
      analyze: vi.fn(async () => ({
        metadata: {
          duration: 12.4,
        },
      })),
    };

    let nextId = 0;
    const ids = ['asset-1', 'resource-1'];
    const service = new AssetCenterService({
      vfsPort,
      indexPort: createIndexPort(),
      urlResolver,
      analyzer,
      options: {
        now: () => '2026-03-18T12:00:00.000Z',
        idGenerator: () => ids[nextId++] || `generated-${nextId}`,
      },
    });

    const result = await service.importAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'magiccut',
      },
      type: 'video',
      name: 'clip.mp4',
      sourcePath: '/incoming/clip.mp4',
      metadata: {
        origin: 'upload',
      },
    });

    expect(ensureDir).toHaveBeenCalledWith(
      '/Users/demo/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1/media/originals/video'
    );
    expect(copyFile).toHaveBeenCalledWith(
      '/incoming/clip.mp4',
      '/Users/demo/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1/media/originals/video/resource-1.mp4'
    );
    expect(result.primaryLocator.uri).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/video/resource-1.mp4'
    );
    expect(result.asset.storage.mode).toBe('desktop-fs');
    expect(result.asset.metadata).toMatchObject({
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      storageClass: 'original',
      originalName: 'clip.mp4',
      managedFileName: 'resource-1.mp4',
      managedRootVersion: 1,
      duration: 12.4,
    });
  });

  it('respects the configured workspace root override when importing project assets', async () => {
    const ensureDir = vi.fn(async () => {});
    const copyFile = vi.fn(async () => {});
    const stat = vi.fn(async () => ({ isDirectory: false, size: 2048 }));
    const storageConfig = {
      rootDir: '/Users/demo/.sdkwork/magicstudio',
      workspacesRootDir: '/Volumes/Media/MagicStudioWorkspaces',
    } satisfies MagicStudioStorageConfig;

    const vfsPort: AssetVfsPort = {
      getMode: () => 'desktop-fs',
      getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
      getMagicStudioStorageConfig: vi.fn(async () => storageConfig),
      ensureDir,
      exists: vi.fn(async () => false),
      list: vi.fn(async () => []),
      stat,
      writeText: vi.fn(async () => {}),
      readText: vi.fn(async () => '[]'),
      writeBinary: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBlob: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      copyFile,
      delete: vi.fn(async () => {}),
      ...createManagedAssetPathResolvers(storageConfig),
    };

    const service = new AssetCenterService({
      vfsPort,
      indexPort: createIndexPort(),
      urlResolver: {
        resolve: vi.fn(async (locator) => locator.uri),
      },
      analyzer: {
        analyze: vi.fn(async () => ({ metadata: {} })),
      },
      options: {
        now: () => '2026-03-18T12:00:00.000Z',
        idGenerator: (() => {
          const ids = ['asset-2', 'resource-2'];
          let index = 0;
          return () => ids[index++] || `generated-${index}`;
        })(),
      },
    });

    const result = await service.importAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'magiccut',
      },
      type: 'video',
      name: 'override.mp4',
      sourcePath: '/incoming/override.mp4',
      metadata: {
        origin: 'upload',
      },
    });

    expect(ensureDir).toHaveBeenCalledWith(
      '/Volumes/Media/MagicStudioWorkspaces/ws-1/projects/proj-1/media/originals/video'
    );
    expect(copyFile).toHaveBeenCalledWith(
      '/incoming/override.mp4',
      '/Volumes/Media/MagicStudioWorkspaces/ws-1/projects/proj-1/media/originals/video/resource-2.mp4'
    );
    expect(result.primaryLocator.uri).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/video/resource-2.mp4'
    );
  });

  it('preserves explicit assetUuid on imported assets instead of fabricating client identity from assetId', async () => {
    const ensureDir = vi.fn(async () => {});
    const copyFile = vi.fn(async () => {});
    const stat = vi.fn(async () => ({ isDirectory: false, size: 1024 }));
    const storageConfig = {
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    } satisfies MagicStudioStorageConfig;

    const vfsPort: AssetVfsPort = {
      getMode: () => 'desktop-fs',
      getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
      getMagicStudioStorageConfig: vi.fn(async () => storageConfig),
      ensureDir,
      exists: vi.fn(async () => false),
      list: vi.fn(async () => []),
      stat,
      writeText: vi.fn(async () => {}),
      readText: vi.fn(async () => '[]'),
      writeBinary: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBlob: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      copyFile,
      delete: vi.fn(async () => {}),
      ...createManagedAssetPathResolvers(storageConfig),
    };

    let nextId = 0;
    const ids = ['asset-3', 'resource-3', 'resource-uuid-3'];
    const service = new AssetCenterService({
      vfsPort,
      indexPort: createIndexPort(),
      urlResolver: {
        resolve: vi.fn(async (locator) => locator.uri),
      },
      analyzer: {
        analyze: vi.fn(async () => ({ metadata: {} })),
      },
      options: {
        now: () => '2026-03-18T12:00:00.000Z',
        idGenerator: () => ids[nextId++] || `generated-${nextId}`,
      },
    });

    const result = await service.importAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'magiccut',
      },
      type: 'image',
      name: 'cover.png',
      sourcePath: '/incoming/cover.png',
      metadata: {
        assetUuid: 'asset-uuid-3',
        origin: 'ai',
      },
    });

    expect(result.asset).toMatchObject({
      id: 'asset-3',
      uuid: 'asset-uuid-3',
      assetId: 'asset-3',
      metadata: {
        assetUuid: 'asset-uuid-3',
      },
      payload: {
        image: {
          id: 'resource-3',
          uuid: 'resource-uuid-3',
          metadata: {
            assetUuid: 'asset-uuid-3',
            primaryResourceId: 'resource-3',
            primaryResourceUuid: 'resource-uuid-3',
          },
        },
      },
    });
  });

  it('generates independent asset and resource uuids when metadata omits them during import', async () => {
    const ensureDir = vi.fn(async () => {});
    const copyFile = vi.fn(async () => {});
    const stat = vi.fn(async () => ({ isDirectory: false, size: 512 }));
    const storageConfig = {
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    } satisfies MagicStudioStorageConfig;

    const vfsPort: AssetVfsPort = {
      getMode: () => 'desktop-fs',
      getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
      getMagicStudioStorageConfig: vi.fn(async () => storageConfig),
      ensureDir,
      exists: vi.fn(async () => false),
      list: vi.fn(async () => []),
      stat,
      writeText: vi.fn(async () => {}),
      readText: vi.fn(async () => '[]'),
      writeBinary: vi.fn(async () => {}),
      readBinary: vi.fn(async () => new Uint8Array()),
      writeBlob: vi.fn(async () => {}),
      readBlob: vi.fn(async () => new Blob()),
      copyFile,
      delete: vi.fn(async () => {}),
      ...createManagedAssetPathResolvers(storageConfig),
    };

    let nextId = 0;
    const ids = ['asset-4', 'resource-4', 'asset-uuid-4', 'resource-uuid-4'];
    const service = new AssetCenterService({
      vfsPort,
      indexPort: createIndexPort(),
      urlResolver: {
        resolve: vi.fn(async (locator) => locator.uri),
      },
      analyzer: {
        analyze: vi.fn(async () => ({ metadata: {} })),
      },
      options: {
        now: () => '2026-03-18T12:00:00.000Z',
        idGenerator: () => ids[nextId++] || `generated-${nextId}`,
      },
    });

    const result = await service.importAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'magiccut',
      },
      type: 'image',
      name: 'generated-cover.png',
      sourcePath: '/incoming/generated-cover.png',
      metadata: {
        origin: 'ai',
      },
    });

    expect(result.asset.uuid).toBe('asset-uuid-4');
    expect(result.asset.uuid).not.toBe(result.asset.id);
    expect(result.asset.metadata).toMatchObject({
      assetUuid: 'asset-uuid-4',
      primaryResourceId: 'resource-4',
      primaryResourceUuid: 'resource-uuid-4',
    });
    expect(result.asset.payload.image).toMatchObject({
      id: 'resource-4',
      uuid: 'resource-uuid-4',
      metadata: {
        assetUuid: 'asset-uuid-4',
        primaryResourceId: 'resource-4',
        primaryResourceUuid: 'resource-uuid-4',
      },
    });
  });

  it('registers existing assets with explicit asset and resource identities intact', async () => {
    const service = new AssetCenterService({
      vfsPort: {
        getMode: () => 'desktop-fs',
        getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
        getMagicStudioStorageConfig: vi.fn(async () => ({
          rootDir: '/Users/demo/.sdkwork/magicstudio',
        })),
        ensureDir: vi.fn(async () => {}),
        exists: vi.fn(async () => false),
        list: vi.fn(async () => []),
        stat: vi.fn(async () => ({ isDirectory: false, size: 0 })),
        writeText: vi.fn(async () => {}),
        readText: vi.fn(async () => '[]'),
        writeBinary: vi.fn(async () => {}),
        readBinary: vi.fn(async () => new Uint8Array()),
        writeBlob: vi.fn(async () => {}),
        readBlob: vi.fn(async () => new Blob()),
        copyFile: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
        toVirtualPath: vi.fn(async (absolutePath: string) => absolutePath),
        toAbsolutePath: vi.fn(async (virtualPath: string) => virtualPath),
      },
      indexPort: createIndexPort(),
      urlResolver: {
        resolve: vi.fn(async (locator) => locator.uri),
      },
      analyzer: {
        analyze: vi.fn(async () => ({ metadata: {} })),
      },
      options: {
        now: () => '2026-03-18T12:00:00.000Z',
        idGenerator: (() => {
          const ids = ['generated-fallback-asset', 'generated-fallback-resource'];
          let index = 0;
          return () => ids[index++] || `generated-${index}`;
        })(),
      },
    });

    const asset = await service.registerExistingAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'magiccut',
      },
      type: 'video',
      name: 'hero.mp4',
      assetId: 'asset-db-4',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
      },
      metadata: {
        assetUuid: 'asset-uuid-4',
        primaryResourceId: 'resource-db-4',
        primaryResourceUuid: 'resource-uuid-4',
        resourceViewId: 'resource-view-4',
        resourceViewUuid: 'resource-view-uuid-4',
      },
      size: 8192,
      createdAt: '2026-03-18T12:00:00.000Z',
      updatedAt: '2026-03-18T12:00:00.000Z',
    });

    expect(asset).toMatchObject({
      id: 'asset-db-4',
      uuid: 'asset-uuid-4',
      assetId: 'asset-db-4',
      payload: {
        video: {
          id: 'resource-db-4',
          uuid: 'resource-uuid-4',
          assetId: 'asset-db-4',
          primaryResourceId: 'resource-db-4',
          resourceViewId: 'resource-view-4',
          metadata: {
            assetUuid: 'asset-uuid-4',
            primaryResourceId: 'resource-db-4',
            primaryResourceUuid: 'resource-uuid-4',
            resourceViewId: 'resource-view-4',
            resourceViewUuid: 'resource-view-uuid-4',
          },
        },
      },
    });
  });

  it('generates independent uuids when registering an existing asset without explicit uuid metadata', async () => {
    const service = new AssetCenterService({
      vfsPort: {
        getMode: () => 'desktop-fs',
        getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
        getMagicStudioStorageConfig: vi.fn(async () => ({
          rootDir: '/Users/demo/.sdkwork/magicstudio',
        })),
        ensureDir: vi.fn(async () => {}),
        exists: vi.fn(async () => false),
        list: vi.fn(async () => []),
        stat: vi.fn(async () => ({ isDirectory: false, size: 0 })),
        writeText: vi.fn(async () => {}),
        readText: vi.fn(async () => '[]'),
        writeBinary: vi.fn(async () => {}),
        readBinary: vi.fn(async () => new Uint8Array()),
        writeBlob: vi.fn(async () => {}),
        readBlob: vi.fn(async () => new Blob()),
        copyFile: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
        toVirtualPath: vi.fn(async (absolutePath: string) => absolutePath),
        toAbsolutePath: vi.fn(async (virtualPath: string) => virtualPath),
      },
      indexPort: createIndexPort(),
      urlResolver: {
        resolve: vi.fn(async (locator) => locator.uri),
      },
      analyzer: {
        analyze: vi.fn(async () => ({ metadata: {} })),
      },
      options: {
        now: () => '2026-03-18T12:00:00.000Z',
        idGenerator: (() => {
          const ids = ['resource-db-5', 'asset-uuid-5', 'resource-uuid-5'];
          let index = 0;
          return () => ids[index++] || `generated-${index}`;
        })(),
      },
    });

    const asset = await service.registerExistingAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'magiccut',
      },
      type: 'video',
      name: 'hero-raw.mp4',
      assetId: 'asset-db-5',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/hero-raw.mp4',
        url: 'https://cdn.example.com/hero-raw.mp4',
      },
      metadata: {},
      size: 4096,
      createdAt: '2026-03-18T12:00:00.000Z',
      updatedAt: '2026-03-18T12:00:00.000Z',
    });

    expect(asset.uuid).toBe('asset-uuid-5');
    expect(asset.uuid).not.toBe(asset.id);
    expect(asset.metadata).toMatchObject({
      assetUuid: 'asset-uuid-5',
      primaryResourceId: 'resource-db-5',
      primaryResourceUuid: 'resource-uuid-5',
    });
    expect(asset.payload.video).toMatchObject({
      id: 'resource-db-5',
      uuid: 'resource-uuid-5',
      metadata: {
        assetUuid: 'asset-uuid-5',
        primaryResourceId: 'resource-db-5',
        primaryResourceUuid: 'resource-uuid-5',
      },
    });
  });

  it('refreshes persisted project reference metadata when rebinding the same asset context key', async () => {
    let storedAsset: Awaited<ReturnType<AssetCenterService['registerExistingAsset']>> | null = null;
    const indexPort = createIndexPort();
    indexPort.save = vi.fn(async (asset) => {
      storedAsset = asset;
    });
    indexPort.findById = vi.fn(async (assetId) => {
      if (!storedAsset || storedAsset.id !== assetId) {
        return null;
      }
      return storedAsset;
    });

    const service = new AssetCenterService({
      vfsPort: {
        getMode: () => 'desktop-fs',
        getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
        getMagicStudioStorageConfig: vi.fn(async () => ({
          rootDir: '/Users/demo/.sdkwork/magicstudio',
        })),
        ensureDir: vi.fn(async () => {}),
        exists: vi.fn(async () => false),
        list: vi.fn(async () => []),
        stat: vi.fn(async () => ({ isDirectory: false, size: 0 })),
        writeText: vi.fn(async () => {}),
        readText: vi.fn(async () => '[]'),
        writeBinary: vi.fn(async () => {}),
        readBinary: vi.fn(async () => new Uint8Array()),
        writeBlob: vi.fn(async () => {}),
        readBlob: vi.fn(async () => new Blob()),
        copyFile: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
        toVirtualPath: vi.fn(async (absolutePath: string) => absolutePath),
        toAbsolutePath: vi.fn(async (virtualPath: string) => virtualPath),
      },
      indexPort,
      urlResolver: {
        resolve: vi.fn(async (locator) => locator.uri),
      },
      analyzer: {
        analyze: vi.fn(async () => ({ metadata: {} })),
      },
      options: {
        now: () => '2026-04-07T12:00:00.000Z',
        idGenerator: (() => {
          const ids = ['resource-db-6', 'asset-uuid-6', 'resource-uuid-6'];
          let index = 0;
          return () => ids[index++] || `generated-${index}`;
        })(),
      },
    });

    await service.registerExistingAsset({
      scope: {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        domain: 'canvas',
      },
      type: 'image',
      name: 'reference.png',
      assetId: 'asset-db-6',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/reference.png',
        url: 'https://cdn.example.com/reference.png',
      },
      references: [
        {
          domain: 'canvas',
          entityType: 'project',
          entityId: 'proj-1',
          relation: 'reference',
          slot: 'canvas-reference-image',
          metadata: {
            boardId: 'board-old',
            boardUuid: 'board-uuid-old',
            elementId: 'element-old',
            source: 'canvas-node',
          },
        },
      ],
      metadata: {
        assetUuid: 'asset-uuid-6',
        primaryResourceId: 'resource-db-6',
        primaryResourceUuid: 'resource-uuid-6',
      },
      size: 2048,
      createdAt: '2026-04-07T12:00:00.000Z',
      updatedAt: '2026-04-07T12:00:00.000Z',
    });

    const rebound = await service.bindReference('asset-db-6', {
      domain: 'canvas',
      entityType: 'project',
      entityId: 'proj-1',
      relation: 'reference',
      slot: 'canvas-reference-image',
      metadata: {
        boardId: 'board-new',
        boardUuid: 'board-uuid-new',
        elementId: 'element-new',
        source: 'choose-asset-dialog',
      },
    });

    expect(rebound?.references).toHaveLength(1);
    expect(rebound?.references?.[0]).toMatchObject({
      domain: 'canvas',
      entityType: 'project',
      entityId: 'proj-1',
      relation: 'reference',
      slot: 'canvas-reference-image',
      metadata: {
        boardId: 'board-new',
        boardUuid: 'board-uuid-new',
        elementId: 'element-new',
        source: 'choose-asset-dialog',
      },
    });
    expect(indexPort.save).toHaveBeenCalledTimes(2);
  });
});
