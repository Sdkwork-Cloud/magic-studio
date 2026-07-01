import { describe, expect, it } from 'vitest';

import type { CanvasMediaResource } from '@sdkwork/magic-studio-types';

import { removeCanvasReferenceImageByAttachmentId } from './canvasReferenceImageAttachment';

describe('removeCanvasReferenceImageByAttachmentId', () => {
  it('removes uploaded reference images by their stable resource key', () => {
    const references: CanvasMediaResource[] = [
      {
        id: 'canvas-ref-1',
        uuid: 'canvas-ref-runtime-1',
        assetId: 'canvas-ref-1',
        assetUuid: 'canvas-ref-asset-uuid-1',
        primaryResourceId: 'canvas-ref-resource-id-1',
        primaryResourceUuid: 'canvas-ref-resource-uuid-1',
        resourceViewId: 'canvas-ref-view-id-1',
        resourceViewUuid: 'canvas-ref-view-uuid-1',
        type: 'image',
        url: 'https://cdn.example.com/reference-1.png',
      },
      {
        id: 'canvas-ref-2',
        uuid: 'canvas-ref-runtime-2',
        assetId: 'canvas-ref-2',
        assetUuid: 'canvas-ref-asset-uuid-2',
        primaryResourceId: 'canvas-ref-resource-id-2',
        primaryResourceUuid: 'canvas-ref-resource-uuid-2',
        resourceViewId: 'canvas-ref-view-id-2',
        resourceViewUuid: 'canvas-ref-view-uuid-2',
        type: 'image',
        url: 'https://cdn.example.com/reference-2.png',
      },
    ];

    expect(
      removeCanvasReferenceImageByAttachmentId(references, 'canvas-ref-view-uuid-1')
    ).toEqual([references[1]]);
  });

  it('uses the runtime uuid when a resource has no asset-level identity', () => {
    const references: CanvasMediaResource[] = [
      {
        id: null,
        uuid: 'canvas-ref-runtime-1',
        type: 'image',
        url: 'https://cdn.example.com/reference-1.png',
      },
      {
        id: null,
        uuid: 'canvas-ref-runtime-2',
        type: 'image',
        url: 'https://cdn.example.com/reference-2.png',
      },
    ];

    expect(
      removeCanvasReferenceImageByAttachmentId(references, 'canvas-ref-runtime-2')
    ).toEqual([references[0]]);
  });
});
