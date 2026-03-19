import { describe, expect, it, vi } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';

import {
  collectLocalAssetsForCategory,
  filterAssetCollectionByQuery,
  mergeRemoteAssetRefresh,
  mergeAssetCollections,
  queryResourcePanelAssets,
} from '../src/domain/assets/resourcePanelAssets';

const createResource = (id: string, type: MediaResourceType, origin: 'upload' | 'ai' | 'stock' = 'upload') => ({
  id,
  uuid: `${id}-uuid`,
  name: `${id}-name`,
  type,
  origin,
  metadata: {},
  createdAt: 0,
  updatedAt: 0,
});

describe('collectLocalAssetsForCategory', () => {
  it('collects only resources that belong to the active browser category', () => {
    const resources = {
      video: createResource('video', MediaResourceType.VIDEO),
      image: createResource('image', MediaResourceType.IMAGE),
      music: createResource('music', MediaResourceType.MUSIC),
      voice: createResource('voice', MediaResourceType.VOICE),
      subtitle: createResource('subtitle', MediaResourceType.SUBTITLE),
    };

    expect(collectLocalAssetsForCategory(resources, 'video').map((item) => item.id)).toEqual(['video']);
    expect(collectLocalAssetsForCategory(resources, 'music').map((item) => item.id)).toEqual(['music']);
    expect(collectLocalAssetsForCategory(resources, 'voice').map((item) => item.id)).toEqual(['voice']);
    expect(collectLocalAssetsForCategory(resources, 'text').map((item) => item.id)).toEqual(['subtitle']);
  });
});

describe('mergeAssetCollections', () => {
  it('keeps local assets first and removes duplicate ids from the remote list', () => {
    const localAssets = [
      { ...createResource('local-video', MediaResourceType.VIDEO), name: 'Local video' },
      { ...createResource('shared', MediaResourceType.VIDEO), name: 'Shared local' },
    ];
    const remoteAssets = [
      { ...createResource('shared', MediaResourceType.VIDEO), name: 'Shared remote' },
      { ...createResource('remote-video', MediaResourceType.VIDEO), name: 'Remote video' },
    ];

    const merged = mergeAssetCollections(localAssets as any, remoteAssets as any);

    expect(merged.map((item) => item.id)).toEqual([
      'local-video',
      'shared',
      'remote-video',
    ]);
    expect(merged.find((item) => item.id === 'shared')?.name).toBe('Shared local');
  });
});

describe('mergeRemoteAssetRefresh', () => {
  it('preserves freshly imported local uploads when a remote refresh does not include them yet', () => {
    const currentAssets = [
      {
        ...createResource('local-upload', MediaResourceType.VIDEO),
        path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/video/local-upload.mp4',
        metadata: {
          origin: 'upload',
          storageMode: 'tauri-fs',
        },
      },
      {
        ...createResource('stale-remote', MediaResourceType.VIDEO, 'stock'),
        path: 'https://cdn.example.com/stale.mp4',
        metadata: {
          origin: 'stock',
        },
      },
    ];
    const fetchedAssets = [
      {
        ...createResource('fresh-remote', MediaResourceType.VIDEO, 'stock'),
        path: 'https://cdn.example.com/fresh.mp4',
        metadata: {
          origin: 'stock',
        },
      },
    ];

    expect(mergeRemoteAssetRefresh(currentAssets as any, fetchedAssets as any).map((item) => item.id)).toEqual([
      'local-upload',
      'fresh-remote',
    ]);
  });

  it('preserves browser-vfs uploads even before a local locator is resolved', () => {
    const currentAssets = [
      {
        ...createResource('browser-upload', MediaResourceType.IMAGE),
        metadata: {
          origin: 'upload',
          storageMode: 'browser-vfs',
        },
      },
    ];
    const fetchedAssets = [
      {
        ...createResource('fresh-remote', MediaResourceType.IMAGE, 'stock'),
        path: 'https://cdn.example.com/fresh.png',
        metadata: {
          origin: 'stock',
        },
      },
    ];

    expect(mergeRemoteAssetRefresh(currentAssets as any, fetchedAssets as any).map((item) => item.id)).toEqual([
      'browser-upload',
      'fresh-remote',
    ]);
  });
});

describe('filterAssetCollectionByQuery', () => {
  it('filters local assets by name, text metadata and tags', () => {
    const assets = [
      {
        ...createResource('scene-cut', MediaResourceType.VIDEO),
        name: 'Scene Cut',
        tags: ['timeline', 'rough-cut'],
      },
      {
        ...createResource('subtitle-intro', MediaResourceType.SUBTITLE),
        name: 'Opening Subtitle',
        metadata: { text: 'Hello AI editor' },
      },
      {
        ...createResource('music-bed', MediaResourceType.MUSIC),
        name: 'Ambient Bed',
        metadata: {},
      },
    ];

    expect(filterAssetCollectionByQuery(assets as any, 'scene').map((item) => item.id)).toEqual(['scene-cut']);
    expect(filterAssetCollectionByQuery(assets as any, 'hello ai').map((item) => item.id)).toEqual(['subtitle-intro']);
    expect(filterAssetCollectionByQuery(assets as any, 'rough-cut').map((item) => item.id)).toEqual(['scene-cut']);
  });

  it('returns the original collection when the query is empty', () => {
    const assets = [
      createResource('video', MediaResourceType.VIDEO),
      createResource('subtitle', MediaResourceType.SUBTITLE),
    ];

    expect(filterAssetCollectionByQuery(assets as any, '  ')).toEqual(assets);
  });
});

describe('queryResourcePanelAssets', () => {
  it('prefers the local asset-center source for local-first media categories', async () => {
    const queryLocal = vi.fn(async () => ({ source: 'local' }));
    const queryRemote = vi.fn(async () => ({ source: 'remote' }));

    await expect(
      queryResourcePanelAssets({
        category: 'video',
        storageMode: 'local-first-sync',
        queryLocal,
        queryRemote,
      })
    ).resolves.toEqual({ source: 'local' });

    expect(queryLocal).toHaveBeenCalledTimes(1);
    expect(queryRemote).not.toHaveBeenCalled();
  });

  it('keeps effects on the remote source even in local-first mode', async () => {
    const queryLocal = vi.fn(async () => ({ source: 'local' }));
    const queryRemote = vi.fn(async () => ({ source: 'remote' }));

    await expect(
      queryResourcePanelAssets({
        category: 'effects',
        storageMode: 'local-first-sync',
        queryLocal,
        queryRemote,
      })
    ).resolves.toEqual({ source: 'remote' });

    expect(queryLocal).not.toHaveBeenCalled();
    expect(queryRemote).toHaveBeenCalledTimes(1);
  });

  it('uses the remote source when storage mode is server-only', async () => {
    const queryLocal = vi.fn(async () => ({ source: 'local' }));
    const queryRemote = vi.fn(async () => ({ source: 'remote' }));

    await expect(
      queryResourcePanelAssets({
        category: 'video',
        storageMode: 'server-only',
        queryLocal,
        queryRemote,
      })
    ).resolves.toEqual({ source: 'remote' });

    expect(queryLocal).not.toHaveBeenCalled();
    expect(queryRemote).toHaveBeenCalledTimes(1);
  });

  it('falls back to the local asset-center source when the remote media query fails', async () => {
    const queryLocal = vi.fn(async () => ({ source: 'local' }));
    const queryRemote = vi.fn(async () => {
      throw new Error('cors');
    });

    await expect(
      queryResourcePanelAssets({
        category: 'video',
        storageMode: 'server-only',
        queryLocal,
        queryRemote,
      })
    ).resolves.toEqual({ source: 'local' });

    expect(queryRemote).toHaveBeenCalledTimes(1);
    expect(queryLocal).toHaveBeenCalledTimes(1);
  });
});
