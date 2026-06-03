import { describe, expect, it } from 'vitest';

import {
  toVideoInputResourceRefFromAsset,
  toVideoInputSelectableAsset,
} from './videoInputResource';

describe('toVideoInputResourceRefFromAsset', () => {
  it('uses the selected asset uuid as client identity without pretending it is assetUuid', () => {
    const ref = toVideoInputResourceRefFromAsset(
      {
        id: 'asset-db-1',
        uuid: 'resource-uuid-1',
        name: 'Reference Image',
        type: 'image',
        path: 'https://cdn.example.com/reference-image.png',
        size: 0,
        origin: 'upload',
        createdAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T00:00:00.000Z',
        metadata: {
          assetId: 'asset-db-1',
          primaryResourceId: '101',
          primaryResourceUuid: 'resource-uuid-1',
        },
      } as any,
      'image'
    );

    expect(ref).toMatchObject({
      id: null,
      uuid: 'resource-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: null,
      primaryResourceId: '101',
      primaryResourceUuid: 'resource-uuid-1',
      path: 'https://cdn.example.com/reference-image.png',
      url: 'https://cdn.example.com/reference-image.png',
      name: 'Reference Image',
    });
  });

  it('keeps selectable asset runtime id separate from explicit resource and asset ids', () => {
    const asset = toVideoInputSelectableAsset({
      id: null,
      uuid: 'resource-view-uuid-9',
      type: 'image',
      assetId: 'asset-db-9',
      primaryResourceId: 'primary-resource-9',
      resourceViewId: 'resource-view-9',
      url: 'https://cdn.example.com/reference-frame-9.png',
      name: 'Reference Frame',
      createdAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:00:00.000Z',
    } as any);

    expect(asset).toMatchObject({
      id: 'asset-db-9',
      uuid: 'resource-view-uuid-9',
      path: 'https://cdn.example.com/reference-frame-9.png',
      metadata: {
        assetId: 'asset-db-9',
        primaryResourceId: 'primary-resource-9',
        resourceViewId: 'resource-view-9',
      },
    });
  });

  it('uses client uuid as runtime asset id when no persisted asset id exists yet', () => {
    const asset = toVideoInputSelectableAsset({
      id: null,
      uuid: 'resource-view-uuid-10',
      type: 'image',
      primaryResourceId: 'primary-resource-10',
      resourceViewId: 'resource-view-10',
      name: 'Transient Reference Frame',
      createdAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:00:00.000Z',
    } as any);

    expect(asset).toMatchObject({
      id: 'resource-view-uuid-10',
      uuid: 'resource-view-uuid-10',
      path: '',
      metadata: {
        primaryResourceId: 'primary-resource-10',
        resourceViewId: 'resource-view-10',
      },
    });
    expect(asset?.metadata.assetId).toBeUndefined();
  });

  it('uses canonical video references as runtime ids when no database identity exists yet', () => {
    const asset = toVideoInputSelectableAsset({
      id: null,
      uuid: null,
      type: 'video',
      path: 'assets://workspaces/workspace-2/projects/project-2/media/originals/video/reference-video-12.mp4',
      name: 'Locator Only Video',
      createdAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:00:00.000Z',
    } as any);

    expect(asset).toMatchObject({
      id: 'assets://workspaces/workspace-2/projects/project-2/media/originals/video/reference-video-12.mp4',
      path: 'assets://workspaces/workspace-2/projects/project-2/media/originals/video/reference-video-12.mp4',
      name: 'Locator Only Video',
    });
  });

  it('preserves stable asset locators for uploaded video references', () => {
    const ref = toVideoInputResourceRefFromAsset(
      {
        id: 'asset-db-11',
        uuid: 'resource-view-uuid-11',
        name: 'Workspace Reference Frame',
        type: 'image',
        path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-frame-11.png',
        size: 0,
        origin: 'upload',
        createdAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T00:00:00.000Z',
        metadata: {
          assetId: 'asset-db-11',
        },
      } as any,
      'image'
    );

    expect(ref).toMatchObject({
      assetId: 'asset-db-11',
      path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-frame-11.png',
      url: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-frame-11.png',
    });

    const asset = toVideoInputSelectableAsset(ref);
    expect(asset).toMatchObject({
      id: 'asset-db-11',
      path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-frame-11.png',
    });
  });
});
