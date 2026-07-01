import { describe, expect, it } from 'vitest';

import {
  createGeneratedMusicResult,
  createMusicTask,
  resolveGeneratedMusicResultCoverUrl,
  resolveGeneratedMusicResultPath,
  resolveGeneratedMusicResultUrl,
} from './music.types';

describe('music AGI-native editor models', () => {
  it('hydrates generated music results from canonical resource objects', () => {
    const result = createGeneratedMusicResult({
      id: 'music-artifact-1',
      uuid: 'music-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'music-resource-uuid-1',
        assetId: 'music-asset-1',
        assetUuid: 'music-asset-uuid-1',
        primaryResourceId: 'music-resource-1',
        primaryResourceUuid: 'music-resource-uuid-1',
        resourceViewId: 'music-view-1',
        resourceViewUuid: 'music-view-uuid-1',
        url: 'https://example.com/generated-music.mp3',
        duration: 180,
      },
      coverResource: {
        id: null,
        uuid: 'music-cover-resource-uuid-1',
        url: 'https://example.com/generated-music-cover.png',
        width: 512,
        height: 512,
      },
      title: 'Night Drive',
      duration: 180,
      style: 'synthwave',
    });

    expect(result).toMatchObject({
      id: 'music-artifact-1',
      uuid: 'music-artifact-uuid-1',
      assetId: 'music-asset-1',
      assetUuid: 'music-asset-uuid-1',
      primaryResourceId: 'music-resource-1',
      primaryResourceUuid: 'music-resource-uuid-1',
      resourceViewId: 'music-view-1',
      resourceViewUuid: 'music-view-uuid-1',
      resource: {
        uuid: 'music-resource-uuid-1',
        url: 'https://example.com/generated-music.mp3',
        duration: 180,
      },
      coverResource: {
        uuid: 'music-cover-resource-uuid-1',
        url: 'https://example.com/generated-music-cover.png',
      },
      title: 'Night Drive',
      duration: 180,
      style: 'synthwave',
    });
    expect(result.url).toBeUndefined();
    expect(result.coverUrl).toBeUndefined();
    expect(resolveGeneratedMusicResultUrl(result)).toBe('https://example.com/generated-music.mp3');
    expect(resolveGeneratedMusicResultCoverUrl(result)).toBe(
      'https://example.com/generated-music-cover.png'
    );
  });

  it('creates music tasks with nullable persistence ids and stable uuids', () => {
    const task = createMusicTask({
      config: {
        customMode: false,
        prompt: 'orchestral uplifting outro',
        lyrics: '',
        style: 'orchestral',
        title: 'Finale',
        instrumental: true,
        model: 'suno-v3',
        mediaType: 'music',
      },
      status: 'pending',
    });

    expect(task).toMatchObject({
      id: null,
      status: 'pending',
      config: {
        prompt: 'orchestral uplifting outro',
        title: 'Finale',
      },
    });
    expect(task.uuid).toBeTruthy();
  });

  it('hydrates the canonical music resource url from top-level fallback without flattening it back', () => {
    const result = createGeneratedMusicResult({
      url: 'https://example.com/canonical-top-level-music.mp3',
      title: 'Canonical Music',
      duration: 144,
      resource: {
        id: null,
        uuid: 'music-resource-uuid-top-level',
        duration: 144,
      },
    });

    expect(result.url).toBeUndefined();
    expect(result.resource.url).toBe('https://example.com/canonical-top-level-music.mp3');
    expect(resolveGeneratedMusicResultUrl(result)).toBe(
      'https://example.com/canonical-top-level-music.mp3'
    );
  });

  it('falls back to legacy top-level music urls when canonical resources are absent', () => {
    expect(
      resolveGeneratedMusicResultUrl({
        url: 'https://example.com/legacy-music.mp3',
      } as any)
    ).toBe('https://example.com/legacy-music.mp3');

    expect(
      resolveGeneratedMusicResultCoverUrl({
        coverUrl: 'https://example.com/legacy-music-cover.png',
      } as any)
    ).toBe('https://example.com/legacy-music-cover.png');
  });

  it('preserves canonical locators on path without fabricating a renderable music url', () => {
    const result = createGeneratedMusicResult({
      title: 'Locator Music',
      duration: 128,
      resource: {
        id: null,
        uuid: 'music-resource-locator-1',
        path: 'assets://workspace/music/locator-track.mp3',
      },
    });

    expect(result.resource.path).toBe('assets://workspace/music/locator-track.mp3');
    expect(result.resource.url).toBeUndefined();
    expect(resolveGeneratedMusicResultPath(result)).toBe('assets://workspace/music/locator-track.mp3');
    expect(resolveGeneratedMusicResultUrl(result)).toBeNull();
  });

  it('does not fabricate resource view identity when only primary resource identity is known', () => {
    const result = createGeneratedMusicResult({
      assetId: 'music-asset-db-2',
      primaryResourceId: 'music-resource-db-2',
      primaryResourceUuid: 'music-resource-uuid-2',
      url: 'https://example.com/generated-music-2.mp3',
      title: 'Second Track',
      duration: 120,
      resource: {
        id: null,
        uuid: 'music-resource-entity-uuid-2',
        duration: 120,
      },
    });

    expect(result).toMatchObject({
      assetId: 'music-asset-db-2',
      assetUuid: null,
      primaryResourceId: 'music-resource-db-2',
      primaryResourceUuid: 'music-resource-uuid-2',
      resourceViewId: null,
      resourceViewUuid: null,
      resource: {
        assetId: 'music-asset-db-2',
        primaryResourceId: 'music-resource-db-2',
        primaryResourceUuid: 'music-resource-uuid-2',
        resourceViewId: null,
        resourceViewUuid: null,
      },
    });
  });
});
