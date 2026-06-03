import { describe, expect, it } from 'vitest';

import { toCanvasImportedAssetResource } from './canvasImportedAssetResource';

describe('toCanvasImportedAssetResource', () => {
  it('promotes canonical asset identity from uploaded metadata into top-level canvas fields', () => {
    const resource = toCanvasImportedAssetResource({
      uploaded: {
        id: 'canvas-upload-asset-1',
        uuid: 'canvas-upload-asset-uuid-1',
        name: 'uploaded-video.mp4',
        type: 'video',
        path: 'https://storage.example.com/raw-video.mp4',
        size: '2048',
        metadata: {
          assetUuid: 'canvas-upload-asset-uuid-1',
          primaryResourceId: 'canvas-upload-primary-id-1',
          primaryResourceUuid: 'canvas-upload-primary-uuid-1',
          resourceViewId: 'canvas-upload-view-id-1',
          resourceViewUuid: 'canvas-upload-view-uuid-1',
          width: 1920,
          height: 1080,
          duration: 8,
          thumbnailUrl: 'https://cdn.example.com/uploaded-video-cover.png',
        },
      } as any,
      fallbackType: 'video',
      resolvedUrl: 'https://cdn.example.com/uploaded-video.mp4',
    });

    expect(resource).toMatchObject({
      id: 'canvas-upload-asset-1',
      uuid: 'canvas-upload-view-uuid-1',
      assetId: 'canvas-upload-asset-1',
      assetUuid: 'canvas-upload-asset-uuid-1',
      primaryResourceId: 'canvas-upload-primary-id-1',
      primaryResourceUuid: 'canvas-upload-primary-uuid-1',
      resourceViewId: 'canvas-upload-view-id-1',
      resourceViewUuid: 'canvas-upload-view-uuid-1',
      name: 'uploaded-video.mp4',
      type: 'video',
      url: 'https://cdn.example.com/uploaded-video.mp4',
      path: 'https://cdn.example.com/uploaded-video.mp4',
      size: 2048,
      duration: 8,
      width: 1920,
      height: 1080,
      thumbnailUrl: 'https://cdn.example.com/uploaded-video-cover.png',
      metadata: expect.objectContaining({
        assetUuid: 'canvas-upload-asset-uuid-1',
        primaryResourceId: 'canvas-upload-primary-id-1',
        resourceViewId: 'canvas-upload-view-id-1',
      }),
    });
  });

  it('falls back to runtime asset identity when resource-view metadata is unavailable', () => {
    const resource = toCanvasImportedAssetResource({
      uploaded: {
        id: 'canvas-upload-asset-2',
        uuid: 'canvas-upload-runtime-uuid-2',
        name: 'uploaded-image.png',
        type: 'file',
        path: 'https://storage.example.com/raw-image.png',
        size: 512,
        metadata: {},
      } as any,
      fallbackType: 'image',
      resolvedUrl: 'https://cdn.example.com/uploaded-image.png',
    });

    expect(resource).toMatchObject({
      id: 'canvas-upload-asset-2',
      uuid: 'canvas-upload-runtime-uuid-2',
      assetId: 'canvas-upload-asset-2',
      assetUuid: null,
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: null,
      name: 'uploaded-image.png',
      type: 'image',
      url: 'https://cdn.example.com/uploaded-image.png',
      path: 'https://cdn.example.com/uploaded-image.png',
      size: 512,
    });
  });
});
