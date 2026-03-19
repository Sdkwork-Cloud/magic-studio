import { describe, expect, it, vi } from 'vitest';

import { AssetCenterService } from '../src/asset-center/application/AssetCenterService';
import type { AssetIndexPort } from '../src/asset-center/ports/AssetIndexPort';
import type { AssetMediaAnalyzerPort } from '../src/asset-center/ports/AssetMediaAnalyzerPort';
import type { AssetUrlResolverPort } from '../src/asset-center/ports/AssetUrlResolverPort';
import type { AssetVfsPort } from '../src/asset-center/ports/AssetVfsPort';

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

    const vfsPort: AssetVfsPort = {
      getMode: () => 'tauri-fs',
      getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
      getMagicStudioStorageConfig: vi.fn(async () => ({
        rootDir: '/Users/demo/.sdkwork/magicstudio',
      })),
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
      toVirtualPath: vi.fn(async (absolutePath: string) =>
        `assets://${absolutePath.replace('/Users/demo/.sdkwork/magicstudio/', '')}`
      ),
      toAbsolutePath: vi.fn(async (virtualPath: string) =>
        `/Users/demo/.sdkwork/magicstudio/${virtualPath.replace('assets://', '')}`
      ),
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
    expect(result.asset.storage.mode).toBe('tauri-fs');
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

    const vfsPort: AssetVfsPort = {
      getMode: () => 'tauri-fs',
      getLibraryRoot: vi.fn(async () => '/Users/demo/.sdkwork/magicstudio'),
      getMagicStudioStorageConfig: vi.fn(async () => ({
        rootDir: '/Users/demo/.sdkwork/magicstudio',
        workspacesRootDir: '/Volumes/Media/MagicStudioWorkspaces',
      })),
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
      toVirtualPath: vi.fn(async (absolutePath: string) =>
        `assets://${absolutePath.replace('/Users/demo/.sdkwork/magicstudio/', '')}`
      ),
      toAbsolutePath: vi.fn(async (virtualPath: string) =>
        `/Users/demo/.sdkwork/magicstudio/${virtualPath.replace('assets://', '')}`
      ),
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
});
