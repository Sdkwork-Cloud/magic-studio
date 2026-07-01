import { describe, expect, it } from 'vitest';

import {
  resolveCanvasMediaResourceKey,
  resolveCanvasMediaResourceUrl,
  resolveOptionalCanvasMediaResourceUrl,
} from './canvas.types';

describe('canvas AGI-native resource models', () => {
  it('resolves canvas media resource keys with uuid-first asset-center identity', () => {
    expect(
      resolveCanvasMediaResourceKey({
        id: 'canvas-asset-db-1',
        uuid: 'canvas-asset-uuid-legacy-1',
        assetId: 'canvas-asset-db-1',
        assetUuid: 'canvas-asset-uuid-1',
        primaryResourceId: 'canvas-resource-db-1',
        primaryResourceUuid: 'canvas-resource-uuid-1',
        resourceViewId: 'canvas-resource-view-db-1',
        resourceViewUuid: 'canvas-resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/canvas-resource.png',
      })
    ).toBe('canvas-resource-view-uuid-1');
  });

  it('resolves canvas media urls from canonical url and path fallback', () => {
    expect(
      resolveCanvasMediaResourceUrl({
        type: 'video',
        url: 'https://example.com/canvas-resource.mp4',
      } as any)
    ).toBe('https://example.com/canvas-resource.mp4');

    expect(
      resolveCanvasMediaResourceUrl({
        type: 'image',
        path: 'assets://canvas-resource-local',
      } as any)
    ).toBe('assets://canvas-resource-local');
  });

  it('normalizes empty canvas media urls to undefined for optional service boundaries', () => {
    expect(resolveOptionalCanvasMediaResourceUrl(undefined)).toBeUndefined();

    expect(
      resolveOptionalCanvasMediaResourceUrl({
        type: 'image',
        url: '   ',
      } as any)
    ).toBeUndefined();

    expect(
      resolveOptionalCanvasMediaResourceUrl({
        type: 'image',
        path: 'assets://canvas-resource-local',
      } as any)
    ).toBe('assets://canvas-resource-local');
  });
});
