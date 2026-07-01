import { describe, expect, it } from 'vitest';

import {
  toImageInputResourceRefFromAsset,
  toImageInputSelectableAsset,
} from './imageInputResource';

describe('toImageInputResourceRefFromAsset', () => {
  it('uses the selected asset uuid as client identity without pretending it is assetUuid', () => {
    const ref = toImageInputResourceRefFromAsset({
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
    } as any);

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

  it('preserves stable asset locators as canonical image input paths while keeping delivery urls separate', () => {
    const ref = toImageInputResourceRefFromAsset({
      id: 'asset-db-2',
      uuid: 'resource-uuid-2',
      name: 'Workspace Reference Image',
      type: 'image',
      path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-image-2.png',
      size: 0,
      origin: 'upload',
      createdAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:00:00.000Z',
      metadata: {
        deliveryUrl: 'https://cdn.example.com/reference-image-2.png',
      },
    } as any);

    expect(ref).toMatchObject({
      assetId: 'asset-db-2',
      path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-image-2.png',
      url: 'https://cdn.example.com/reference-image-2.png',
      metadata: {
        canonicalPath:
          'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-image-2.png',
        deliveryUrl: 'https://cdn.example.com/reference-image-2.png',
      },
    });

    const asset = toImageInputSelectableAsset(ref);
    expect(asset).toMatchObject({
      id: 'asset-db-2',
      path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/image/reference-image-2.png',
    });
  });

  it('uses client uuid as runtime asset id when no persisted asset id exists yet', () => {
    const asset = toImageInputSelectableAsset({
      id: null,
      uuid: 'resource-view-uuid-10',
      primaryResourceId: 'primary-resource-10',
      resourceViewId: 'resource-view-10',
      name: 'Transient Reference Image',
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

  it('uses canonical image references as runtime ids when no database identity exists yet', () => {
    const asset = toImageInputSelectableAsset({
      id: null,
      uuid: null,
      path: 'assets://workspaces/workspace-2/projects/project-2/media/originals/image/reference-image-11.png',
      name: 'Locator Only Image',
      createdAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:00:00.000Z',
    } as any);

    expect(asset).toMatchObject({
      id: 'assets://workspaces/workspace-2/projects/project-2/media/originals/image/reference-image-11.png',
      path: 'assets://workspaces/workspace-2/projects/project-2/media/originals/image/reference-image-11.png',
      name: 'Locator Only Image',
    });
  });
});
