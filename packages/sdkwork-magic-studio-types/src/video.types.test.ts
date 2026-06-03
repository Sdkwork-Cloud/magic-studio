import { describe, expect, it } from 'vitest';

import {
  createVideoInputResourceRef,
  createGeneratedVideoResult,
  createVideoTask,
  hasVideoInputResourceReference,
  resolveGeneratedVideoResultPath,
  resolveGeneratedVideoResultPosterUrl,
  resolveGeneratedVideoResultUrl,
  resolveVideoInputResourceKey,
  resolveVideoInputResourcePath,
  resolveVideoInputResourceReference,
  resolveVideoInputResourceUrl,
} from './video.types';

describe('video AGI-native editor models', () => {
  it('creates canonical video input refs with uuid-first identity and delivery fallback', () => {
    const ref = createVideoInputResourceRef({
      type: 'image',
      assetId: 'image-asset-1',
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: 'image-resource-1',
      primaryResourceUuid: 'image-resource-uuid-1',
      resourceViewId: 'image-view-1',
      resourceViewUuid: 'image-view-uuid-1',
      resource: {
        id: 'image-resource-entity-1',
        uuid: 'image-resource-entity-uuid-1',
        type: 'IMAGE' as any,
        name: 'Reference frame',
        url: 'https://example.com/reference-frame.png',
        width: 1024,
        height: 576,
      },
    });

    expect(ref).toMatchObject({
      id: null,
      uuid: 'image-view-uuid-1',
      assetId: 'image-asset-1',
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: 'image-resource-1',
      primaryResourceUuid: 'image-resource-uuid-1',
      resourceViewId: 'image-view-1',
      resourceViewUuid: 'image-view-uuid-1',
      type: 'image',
    });
    expect(resolveVideoInputResourceKey(ref)).toBe('image-view-uuid-1');
    expect(resolveVideoInputResourcePath(ref)).toBe('https://example.com/reference-frame.png');
    expect(resolveVideoInputResourceUrl(ref)).toBe('https://example.com/reference-frame.png');
  });

  it('preserves canonical locator paths separately from delivery urls for video input refs', () => {
    const ref = createVideoInputResourceRef({
      type: 'image',
      assetId: 'image-asset-2',
      resourceViewUuid: 'image-view-uuid-2',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/reference-frame-2.png',
      url: 'https://cdn.example.com/reference-frame-2.png',
      metadata: {
        deliveryUrl: 'https://cdn.example.com/reference-frame-2.png',
      },
    });

    expect(ref).toMatchObject({
      assetId: 'image-asset-2',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/reference-frame-2.png',
      url: 'https://cdn.example.com/reference-frame-2.png',
    });
    expect(resolveVideoInputResourcePath(ref)).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/image/reference-frame-2.png'
    );
    expect(resolveVideoInputResourceUrl(ref)).toBe('https://cdn.example.com/reference-frame-2.png');
  });

  it('treats locator-only video refs as valid business references even without identity fields', () => {
    const ref = createVideoInputResourceRef({
      type: 'video',
      path: 'assets://workspaces/ws-2/projects/proj-2/media/originals/video/reference-video-3.mp4',
      name: 'Reference Video 3',
    });

    expect(resolveVideoInputResourceKey(ref)).toBe(ref.uuid);
    expect(resolveVideoInputResourceReference(ref)).toBe(
      'assets://workspaces/ws-2/projects/proj-2/media/originals/video/reference-video-3.mp4'
    );
    expect(hasVideoInputResourceReference(ref)).toBe(true);
  });

  it('hydrates generated video results from canonical resource objects', () => {
    const result = createGeneratedVideoResult({
      id: 'video-artifact-1',
      uuid: 'video-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'video-resource-uuid-1',
        assetId: 'video-asset-1',
        assetUuid: 'video-asset-uuid-1',
        primaryResourceId: 'video-resource-1',
        primaryResourceUuid: 'video-resource-uuid-1',
        resourceViewId: 'video-view-1',
        resourceViewUuid: 'video-view-uuid-1',
        url: 'https://example.com/generated-video.mp4',
        duration: 8,
        width: 1920,
        height: 1080,
        resolution: '1080p',
      },
      coverResource: {
        id: null,
        uuid: 'video-cover-resource-uuid-1',
        url: 'https://example.com/generated-video-cover.png',
        width: 960,
        height: 540,
      },
      modelId: 'veo-3',
    });

    expect(result).toMatchObject({
      id: 'video-artifact-1',
      uuid: 'video-artifact-uuid-1',
      assetId: 'video-asset-1',
      assetUuid: 'video-asset-uuid-1',
      primaryResourceId: 'video-resource-1',
      primaryResourceUuid: 'video-resource-uuid-1',
      resourceViewId: 'video-view-1',
      resourceViewUuid: 'video-view-uuid-1',
      resource: {
        uuid: 'video-resource-uuid-1',
        url: 'https://example.com/generated-video.mp4',
        duration: 8,
      },
      coverResource: {
        uuid: 'video-cover-resource-uuid-1',
        url: 'https://example.com/generated-video-cover.png',
      },
      modelId: 'veo-3',
    });
    expect(result.url).toBeUndefined();
    expect(result.mp4Url).toBeUndefined();
    expect(result.posterUrl).toBeUndefined();
    expect(resolveGeneratedVideoResultUrl(result)).toBe('https://example.com/generated-video.mp4');
    expect(resolveGeneratedVideoResultPosterUrl(result)).toBe(
      'https://example.com/generated-video-cover.png'
    );
  });

  it('creates video tasks with nullable persistence ids and stable uuids', () => {
    const task = createVideoTask({
      config: {
        mode: 'text',
        prompt: 'cinematic drone pass',
        styleId: 'none',
        aspectRatio: '16:9',
        resolution: '1080p',
        duration: '8s',
        fps: 30,
        model: 'veo-3',
      },
      status: 'pending',
    });

    expect(task).toMatchObject({
      id: null,
      status: 'pending',
      config: {
        prompt: 'cinematic drone pass',
        model: 'veo-3',
      },
    });
    expect(task.uuid).toBeTruthy();
  });

  it('hydrates the canonical video resource url from top-level fallback without flattening it back', () => {
    const result = createGeneratedVideoResult({
      url: 'https://example.com/canonical-top-level-video.mp4',
      resource: {
        id: null,
        uuid: 'video-resource-uuid-top-level',
      },
    });

    expect(result.url).toBeUndefined();
    expect(result.mp4Url).toBeUndefined();
    expect(result.resource.url).toBe('https://example.com/canonical-top-level-video.mp4');
    expect(resolveGeneratedVideoResultUrl(result)).toBe(
      'https://example.com/canonical-top-level-video.mp4'
    );
  });

  it('falls back to legacy top-level video urls when canonical resources are absent', () => {
    expect(
      resolveGeneratedVideoResultUrl({
        mp4Url: 'https://example.com/legacy-video.mp4',
      } as any)
    ).toBe('https://example.com/legacy-video.mp4');

    expect(
      resolveGeneratedVideoResultPosterUrl({
        posterUrl: 'https://example.com/legacy-video-cover.png',
      } as any)
    ).toBe('https://example.com/legacy-video-cover.png');
  });

  it('preserves canonical locators on path without fabricating a renderable video url', () => {
    const result = createGeneratedVideoResult({
      resource: {
        id: null,
        uuid: 'video-resource-locator-1',
        path: 'assets://workspace/video/locator-video.mp4',
        duration: 4,
      },
    });

    expect(result.resource.path).toBe('assets://workspace/video/locator-video.mp4');
    expect(result.resource.url).toBeUndefined();
    expect(resolveGeneratedVideoResultPath(result)).toBe('assets://workspace/video/locator-video.mp4');
    expect(resolveGeneratedVideoResultUrl(result)).toBeNull();
  });

  it('does not fabricate resource view identity when only primary resource identity is known', () => {
    const result = createGeneratedVideoResult({
      assetId: 'video-asset-db-2',
      primaryResourceId: 'video-resource-db-2',
      primaryResourceUuid: 'video-resource-uuid-2',
      url: 'https://example.com/generated-video-2.mp4',
      resource: {
        id: null,
        uuid: 'video-resource-entity-uuid-2',
        duration: 4,
      },
    });

    expect(result).toMatchObject({
      assetId: 'video-asset-db-2',
      assetUuid: null,
      primaryResourceId: 'video-resource-db-2',
      primaryResourceUuid: 'video-resource-uuid-2',
      resourceViewId: null,
      resourceViewUuid: null,
      resource: {
        assetId: 'video-asset-db-2',
        primaryResourceId: 'video-resource-db-2',
        primaryResourceUuid: 'video-resource-uuid-2',
        resourceViewId: null,
        resourceViewUuid: null,
      },
    });
  });
});
