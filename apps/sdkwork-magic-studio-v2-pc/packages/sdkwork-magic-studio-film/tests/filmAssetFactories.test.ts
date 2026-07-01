import { describe, expect, it } from 'vitest';

import {
  createFilmAssetMediaResource,
  createFilmImageMediaResource,
} from '../src/utils/filmAssetFactories';

describe('filmAssetFactories', () => {
  it('uses assetUuid as the canonical immutable uuid for generated film assets', () => {
    const resource = createFilmAssetMediaResource({
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      type: 'video',
      url: 'https://cdn.example.com/generated-film.mp4',
      fileName: 'generated-film.mp4',
    } as any);

    expect(resource).toMatchObject({
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      assetId: 'asset-db-1',
      fileId: 'asset-db-1',
      url: 'https://cdn.example.com/generated-film.mp4',
    });
  });

  it('accepts a separate client uuid for generated film assets when assetUuid is not available', () => {
    const resource = createFilmAssetMediaResource({
      assetId: 'asset-db-3',
      uuid: 'resource-view-uuid-3',
      type: 'video',
      url: 'https://cdn.example.com/generated-film-3.mp4',
      fileName: 'generated-film-3.mp4',
    } as any);

    expect(resource).toMatchObject({
      id: 'asset-db-3',
      uuid: 'resource-view-uuid-3',
      assetId: 'asset-db-3',
      fileId: 'asset-db-3',
      url: 'https://cdn.example.com/generated-film-3.mp4',
    });
  });

  it('keeps assetId and fileId explicit when only a client uuid exists', () => {
    const resource = createFilmAssetMediaResource({
      uuid: 'resource-view-uuid-5',
      type: 'video',
      url: 'https://cdn.example.com/generated-film-5.mp4',
      fileName: 'generated-film-5.mp4',
    } as any);

    expect(resource).toMatchObject({
      id: 'resource-view-uuid-5',
      uuid: 'resource-view-uuid-5',
      url: 'https://cdn.example.com/generated-film-5.mp4',
    });
    expect(resource.assetId).toBeUndefined();
    expect(resource.fileId).toBeUndefined();
  });

  it('uses assetUuid as the canonical immutable uuid for film image resources', () => {
    const resource = createFilmImageMediaResource({
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      url: 'https://cdn.example.com/generated-frame.png',
      fileName: 'generated-frame.png',
    } as any);

    expect(resource).toMatchObject({
      id: 'asset-db-2',
      uuid: 'asset-uuid-2',
      fileId: 'asset-db-2',
      url: 'https://cdn.example.com/generated-frame.png',
    });
  });

  it('accepts a separate client uuid for film image resources when assetUuid is not available', () => {
    const resource = createFilmImageMediaResource({
      assetId: 'asset-db-4',
      uuid: 'resource-view-uuid-4',
      url: 'https://cdn.example.com/generated-frame-4.png',
      fileName: 'generated-frame-4.png',
    } as any);

    expect(resource).toMatchObject({
      id: 'asset-db-4',
      uuid: 'resource-view-uuid-4',
      fileId: 'asset-db-4',
      url: 'https://cdn.example.com/generated-frame-4.png',
    });
  });

  it('keeps fileId explicit when only a client uuid exists for a film image resource', () => {
    const resource = createFilmImageMediaResource({
      uuid: 'resource-view-uuid-6',
      url: 'https://cdn.example.com/generated-frame-6.png',
      fileName: 'generated-frame-6.png',
    } as any);

    expect(resource).toMatchObject({
      id: 'resource-view-uuid-6',
      uuid: 'resource-view-uuid-6',
      url: 'https://cdn.example.com/generated-frame-6.png',
    });
    expect(resource.fileId).toBeUndefined();
  });
});
