import { describe, expect, it } from 'vitest';

import {
  createNoteAssetReferenceAttrs,
  createNoteFileAttachmentAttrs,
  createNoteMediaAttrs,
  toNoteAssetUrlSource,
} from '../src/components/editor/mediaAssetAttrs';

describe('note media asset attrs', () => {
  it('preserves explicit asset identity without fabricating assetUuid from assetId', () => {
    const attrs = createNoteAssetReferenceAttrs({
      src: 'https://cdn.example.com/generated-image.png',
      assetId: 'asset-db-1',
    });

    expect(attrs).toMatchObject({
      src: 'https://cdn.example.com/generated-image.png',
      assetId: 'asset-db-1',
    });
    expect(attrs.assetUuid).toBeUndefined();
    expect(attrs.primaryResourceId).toBeUndefined();
    expect(attrs.resourceViewId).toBeUndefined();
  });

  it('builds an asset-aware resolver source for note media nodes', () => {
    const source = toNoteAssetUrlSource(createNoteMediaAttrs({
      src: 'https://cdn.example.com/generated-video.mp4',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      controls: true,
    }));

    expect(source).toEqual({
      id: 'asset-db-2',
      assetId: 'asset-db-2',
      url: 'https://cdn.example.com/generated-video.mp4',
      path: 'https://cdn.example.com/generated-video.mp4',
    });
  });

  it('keeps file attachment metadata alongside explicit asset identity', () => {
    const attrs = createNoteFileAttachmentAttrs({
      src: 'https://cdn.example.com/file.pdf',
      assetId: 'asset-db-3',
      assetUuid: 'asset-uuid-3',
      name: 'spec.pdf',
      size: 1024,
      mime: 'application/pdf',
    });

    expect(attrs).toMatchObject({
      src: 'https://cdn.example.com/file.pdf',
      assetId: 'asset-db-3',
      assetUuid: 'asset-uuid-3',
      name: 'spec.pdf',
      size: 1024,
      mime: 'application/pdf',
    });
  });
});
