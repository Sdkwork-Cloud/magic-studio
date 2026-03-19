import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';
import type { UnifiedDigitalAsset } from '@sdkwork/react-types';

import {
  buildMagicCutAssetRef,
  buildMagicCutResourceView,
  normalizeMagicCutAssetState,
} from '../src/domain/assets/magicCutAssetState';
import { collectLocalAssetsForCategory } from '../src/domain/assets/resourcePanelAssets';

const createManagedAsset = (): UnifiedDigitalAsset =>
  ({
    id: 'asset-managed-1',
    uuid: 'asset-managed-1',
    assetId: 'asset-managed-1',
    key: 'workspace-1/magiccut/asset-managed-1',
    title: 'uploaded-clip.mp4',
    primaryType: 'video',
    payload: {
      video: {
        id: 'resource-managed-1',
        uuid: 'resource-managed-1',
        name: 'uploaded-clip.mp4',
        type: MediaResourceType.VIDEO,
        path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/video/resource-managed-1.mp4',
        duration: 9,
        width: 1920,
        height: 1080,
        metadata: {
          origin: 'upload',
          duration: 9,
          width: 1920,
          height: 1080,
        },
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      },
      assets: [
        {
          id: 'resource-managed-1',
          uuid: 'resource-managed-1',
          name: 'uploaded-clip.mp4',
          type: MediaResourceType.VIDEO,
          path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/video/resource-managed-1.mp4',
          duration: 9,
          width: 1920,
          height: 1080,
          metadata: {
            origin: 'upload',
            duration: 9,
            width: 1920,
            height: 1080,
          },
          createdAt: '2026-03-19T00:00:00.000Z',
          updatedAt: '2026-03-19T00:00:00.000Z',
        },
      ],
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
        uri: 'assets://workspaces/workspace-1/projects/project-1/media/originals/video/resource-managed-1.mp4',
        path: 'C:/Users/demo/.sdkwork/magicstudio/workspaces/workspace-1/projects/project-1/media/originals/video/resource-managed-1.mp4',
      },
      cacheable: true,
    },
    status: 'imported',
    isFavorite: false,
    versionInfo: {
      version: 1,
    },
    metadata: {
      origin: 'upload',
      storageMode: 'local-first-sync',
      syncQueued: true,
    },
    createdAt: '2026-03-19T00:00:00.000Z',
    updatedAt: '2026-03-19T00:00:00.000Z',
  }) as UnifiedDigitalAsset;

describe('managed-local imported resource views', () => {
  it('stay visible in the video panel and preserve timeline-ready upload metadata', () => {
    const resourceView = buildMagicCutResourceView(createManagedAsset());

    expect(resourceView).toMatchObject({
      id: 'asset-managed-1',
      type: MediaResourceType.VIDEO,
      origin: 'upload',
      isFavorite: false,
      duration: 9,
      width: 1920,
      height: 1080,
      metadata: {
        assetId: 'asset-managed-1',
        primaryResourceId: 'resource-managed-1',
        primaryType: 'video',
        origin: 'upload',
        storageMode: 'tauri-fs',
      },
    });

    const normalizedState = normalizeMagicCutAssetState({
      assets: {},
      resourceViews: {},
      resources: {
        [resourceView.id]: resourceView,
      },
      timelines: {},
      tracks: {},
      clips: {},
      layers: {},
    });

    expect(collectLocalAssetsForCategory(normalizedState.resources, 'video').map((item) => item.id)).toEqual([
      'asset-managed-1',
    ]);
    expect(normalizedState.resources['asset-managed-1']).toMatchObject({
      id: 'asset-managed-1',
      origin: 'upload',
      type: MediaResourceType.VIDEO,
    });
    expect(buildMagicCutAssetRef(normalizedState.resources['asset-managed-1'])).toMatchObject({
      id: 'asset-managed-1',
      assetId: 'asset-managed-1',
      resourceViewId: 'asset-managed-1',
      primaryType: 'video',
      storageMode: 'tauri-fs',
    });
  });
});
