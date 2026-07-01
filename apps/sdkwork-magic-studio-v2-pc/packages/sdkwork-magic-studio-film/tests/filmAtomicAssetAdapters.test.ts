import { describe, expect, it } from 'vitest';

import { MediaResourceType, MediaScene, type AssetAtomicMediaResource } from '@sdkwork/magic-studio-types';

import { buildAtomicAssetResource, toFilmShotAssetResource } from '../src/utils/filmAtomicAssetAdapters';
import { applyImportedAssetToShotSlot } from '../src/utils/filmShotAssetBinding';

describe('buildAtomicAssetResource', () => {
  it('uses assetUuid as immutable client identity while retaining assetId as persisted id', () => {
    const resource = buildAtomicAssetResource({
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      type: MediaResourceType.IMAGE,
      url: 'https://cdn.example.com/frame.png',
      name: 'frame.png',
      scene: MediaScene.REFERENCE,
    });

    expect(resource).toMatchObject({
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      assetId: 'asset-db-1',
      url: 'https://cdn.example.com/frame.png',
    });
    expect(resource.metadata).toMatchObject({
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
    });
  });

  it('preserves a separate client uuid without fabricating metadata assetUuid from it', () => {
    const resource = buildAtomicAssetResource({
      assetId: 'asset-db-9',
      uuid: 'resource-view-uuid-9',
      type: MediaResourceType.IMAGE,
      url: 'https://cdn.example.com/frame-9.png',
      name: 'frame-9.png',
      scene: MediaScene.REFERENCE,
    } as any);

    expect(resource).toMatchObject({
      id: 'asset-db-9',
      uuid: 'resource-view-uuid-9',
      assetId: 'asset-db-9',
      url: 'https://cdn.example.com/frame-9.png',
    });
    expect(resource.metadata).toMatchObject({
      assetId: 'asset-db-9',
    });
    expect(resource.metadata?.assetUuid).toBeUndefined();
  });

  it('does not invent assetId semantics from a client uuid when no persisted asset exists yet', () => {
    const resource = buildAtomicAssetResource({
      uuid: 'resource-view-uuid-10',
      type: MediaResourceType.IMAGE,
      url: 'https://cdn.example.com/frame-10.png',
      name: 'frame-10.png',
      scene: MediaScene.REFERENCE,
    } as any);

    expect(resource).toMatchObject({
      id: 'resource-view-uuid-10',
      uuid: 'resource-view-uuid-10',
      url: 'https://cdn.example.com/frame-10.png',
    });
    expect(resource.assetId).toBeUndefined();
    expect(resource.metadata?.assetId).toBeUndefined();
    expect(resource.metadata?.assetUuid).toBeUndefined();
  });
});

describe('applyImportedAssetToShotSlot', () => {
  it('rebinds the shot asset to canonical imported asset identity while preserving slot semantics', () => {
    const current: AssetAtomicMediaResource = {
      id: 'slot-1',
      uuid: 'slot-1',
      url: '',
      name: 'placeholder',
      type: MediaResourceType.IMAGE,
      scene: MediaScene.END_FRAME,
      primary: 'image',
      metadata: {
        source: 'existing-slot',
      },
      createdAt: 1,
      updatedAt: 1,
    };

    const result = applyImportedAssetToShotSlot(
      current,
      {
        id: null,
        assetId: 'asset-7',
        uuid: 'asset-uuid-7',
        assetUuid: 'asset-uuid-7',
        resource: {
          id: null,
          uuid: 'asset-uuid-7',
          assetId: 'asset-7',
          assetUuid: 'asset-uuid-7',
          type: 'video',
          url: 'https://cdn.example.com/cover.png',
        },
      },
      {
        name: 'cover.png',
        type: MediaResourceType.VIDEO,
        metadata: {
          origin: 'upload',
        },
      }
    );

    expect(result.id).toBe('asset-7');
    expect(result.uuid).toBe('asset-uuid-7');
    expect(result.assetId).toBe('asset-7');
    expect(result.scene).toBe(MediaScene.END_FRAME);
    expect(result.url).toBe('https://cdn.example.com/cover.png');
    expect(result.name).toBe('cover.png');
    expect(result.type).toBe(MediaResourceType.VIDEO);
    expect(result.primary).toBe('video');
    expect(result.metadata).toMatchObject({
      source: 'existing-slot',
      origin: 'upload',
      assetId: 'asset-7',
      assetUuid: 'asset-uuid-7',
    });
  });

  it('uses imported client uuid for local slot identity without inventing an assetUuid', () => {
    const current: AssetAtomicMediaResource = {
      id: 'slot-2',
      uuid: 'slot-2',
      url: '',
      name: 'placeholder',
      type: MediaResourceType.IMAGE,
      scene: MediaScene.REFERENCE,
      primary: 'image',
      metadata: {
        source: 'existing-slot',
        assetUuid: 'stale-asset-uuid',
      },
      createdAt: 1,
      updatedAt: 1,
    };

    const result = applyImportedAssetToShotSlot(
      current,
      {
        id: null,
        assetId: 'asset-8',
        uuid: 'resource-view-uuid-8',
        resource: {
          id: null,
          uuid: 'resource-view-uuid-8',
          assetId: 'asset-8',
          type: 'image',
          url: 'https://cdn.example.com/reference.png',
        },
      } as any,
      {
        name: 'reference.png',
      }
    );

    expect(result.id).toBe('asset-8');
    expect(result.uuid).toBe('resource-view-uuid-8');
    expect(result.assetId).toBe('asset-8');
    expect(result.metadata).toMatchObject({
      source: 'existing-slot',
      assetId: 'asset-8',
    });
    expect(result.metadata?.assetUuid).toBeUndefined();
  });
});

describe('toFilmShotAssetResource', () => {
  it('keeps assetId explicit and maps primary resource ids to fileId', () => {
    const result = toFilmShotAssetResource({
      id: 'primary-resource-1',
      uuid: 'resource-view-uuid-1',
      assetId: 'asset-db-1',
      url: 'https://cdn.example.com/frame.png',
      name: 'frame.png',
      type: MediaResourceType.IMAGE,
      scene: MediaScene.REFERENCE,
      primary: 'image',
      metadata: {},
      createdAt: 1,
      updatedAt: 1,
    } as AssetAtomicMediaResource);

    expect(result).toMatchObject({
      id: 'primary-resource-1',
      uuid: 'resource-view-uuid-1',
      assetId: 'asset-db-1',
      fileId: 'primary-resource-1',
      fileName: 'frame.png',
    });
  });
});
