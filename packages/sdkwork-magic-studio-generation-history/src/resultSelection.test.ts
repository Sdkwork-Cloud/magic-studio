import { describe, expect, it } from 'vitest';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  resolveGenerationResultDeliveryUrl,
  resolveGenerationResultPreviewThumbnailUrl,
  resolveGenerationResultRenderKind,
  resolveGenerationResultPosterUrl,
  resolveGenerationResultTextContent,
  resolveGenerationTaskKey,
  resolveGenerationResultSelectionKey,
  toGenerationResultSelection,
  type GenerationTaskRecord,
} from './resultSelection';

describe('generation result selection helpers', () => {
  it('prefers canonical uuids over persistence ids and transient urls', () => {
    expect(
      resolveGenerationResultSelectionKey({
        url: 'https://example.com/image.png',
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-1',
        primaryResourceUuid: 'resource-uuid-1',
        resourceViewId: 'view-1',
        resourceViewUuid: 'view-uuid-1',
      })
    ).toBe('view-uuid-1');

    expect(
      resolveGenerationResultSelectionKey({
        url: 'https://example.com/image.png',
        assetId: 'asset-2',
        assetUuid: 'asset-uuid-2',
        primaryResourceId: 'resource-2',
        primaryResourceUuid: 'resource-uuid-2',
      })
    ).toBe('resource-uuid-2');

    expect(
      resolveGenerationResultSelectionKey({
        url: 'https://example.com/image.png',
        assetId: 'asset-3',
        assetUuid: 'asset-uuid-3',
      })
    ).toBe('asset-uuid-3');
  });

  it('rejects url-only results because delivery urls are not canonical identities', () => {
    expect(() =>
      resolveGenerationResultSelectionKey({
        url: 'https://example.com/image.png',
      })
    ).toThrow('Generation result key missing');
  });

  it('builds a typed selection object with stable key and task context', () => {
    const task: GenerationTaskRecord = {
      id: 'task-1',
      uuid: 'task-uuid-1',
      createdAt: 123,
      updatedAt: 456,
      status: 'completed',
      config: {
        prompt: 'cinematic mountain view',
        mediaType: 'image',
        aspectRatio: '16:9',
      },
      results: [
        {
          id: 'result-1',
          uuid: 'result-uuid-1',
          assetId: 'asset-9',
          assetUuid: 'asset-uuid-9',
          url: 'https://example.com/legacy-mountain.png',
          posterUrl: 'https://example.com/legacy-poster.png',
          resource: {
            uuid: 'resource-uuid-9',
            type: MediaResourceType.IMAGE,
            url: 'https://example.com/mountain.png',
          },
          coverResource: {
            uuid: 'cover-resource-uuid-9',
            type: MediaResourceType.IMAGE,
            url: 'https://example.com/mountain-poster.png',
          },
        },
      ],
    };

    const selection = toGenerationResultSelection(task, task.results![0], 0);

    expect(selection).toMatchObject({
      key: 'asset-uuid-9',
      taskKey: 'task-uuid-1',
      taskId: 'task-1',
      taskUuid: 'task-uuid-1',
      type: 'image',
      assetId: 'asset-9',
      resultIndex: 0,
    });
    expect(selection.url).toBeUndefined();
    expect(selection.posterUrl).toBeUndefined();
    expect(resolveGenerationResultDeliveryUrl(selection)).toBe('https://example.com/mountain.png');
    expect(resolveGenerationResultPosterUrl(selection)).toBe('https://example.com/mountain-poster.png');
  });

  it('resolves task keys with uuid first and id fallback', () => {
    expect(
      resolveGenerationTaskKey({
        id: 'task-id-1',
        uuid: 'task-uuid-1',
      })
    ).toBe('task-uuid-1');

    expect(
      resolveGenerationTaskKey({
        id: 'task-id-2',
      })
    ).toBe('task-id-2');
  });

  it('keeps task persistence ids nullable when building selections from local draft tasks', () => {
    const task: GenerationTaskRecord = {
      id: null,
      uuid: 'task-uuid-local-1',
      createdAt: 123,
      updatedAt: 456,
      status: 'completed',
      config: {
        prompt: 'draft task',
        mediaType: 'image',
      },
      results: [
        {
          id: null,
          uuid: 'result-local-1',
          url: 'https://example.com/draft.png',
        },
      ],
    };

    const selection = toGenerationResultSelection(task, task.results![0], 0);

    expect(selection.taskKey).toBe('task-uuid-local-1');
    expect(selection.taskId).toBeNull();
    expect(selection.taskUuid).toBe('task-uuid-local-1');
    expect(selection.url).toBe('https://example.com/draft.png');
  });

  it('prefers canonical resource urls for preview delivery and poster rendering', () => {
    expect(
      resolveGenerationResultDeliveryUrl({
        url: 'https://example.com/flat-video.mp4',
        resource: {
          uuid: 'video-resource-uuid-1',
          url: 'https://example.com/resource-video.mp4',
        },
      })
    ).toBe('https://example.com/resource-video.mp4');

    expect(
      resolveGenerationResultPosterUrl({
        url: '',
        posterUrl: 'https://example.com/flat-cover.png',
        coverResource: {
          uuid: 'cover-resource-uuid-1',
          url: 'https://example.com/resource-cover.png',
        },
      })
    ).toBe('https://example.com/resource-cover.png');
  });

  it('resolves delivery and poster urls from resource-only results without flat url fallbacks', () => {
    const selection = toGenerationResultSelection(
      {
        id: 'task-2',
        uuid: 'task-uuid-2',
        createdAt: 456,
        updatedAt: 456,
        status: 'completed',
        config: {
          prompt: 'resource only',
          mediaType: 'video',
        },
      },
      {
        id: 'result-resource-only-1',
        uuid: 'result-resource-only-uuid-1',
        assetUuid: 'asset-resource-only-uuid-1',
        resource: {
          uuid: 'resource-only-uuid-1',
          type: MediaResourceType.VIDEO,
          url: 'https://example.com/resource-only-video.mp4',
        },
        coverResource: {
          uuid: 'cover-resource-only-uuid-1',
          type: MediaResourceType.IMAGE,
          url: 'https://example.com/resource-only-cover.png',
        },
      },
      0
    );

    expect(selection.url).toBeUndefined();
    expect(selection.posterUrl).toBeUndefined();
    expect(resolveGenerationResultDeliveryUrl(selection)).toBe('https://example.com/resource-only-video.mp4');
    expect(resolveGenerationResultPosterUrl(selection)).toBe('https://example.com/resource-only-cover.png');
  });

  it('falls back to flat delivery urls when resource metadata is not present', () => {
    expect(
      resolveGenerationResultDeliveryUrl({
        url: 'https://example.com/flat-image.png',
      })
    ).toBe('https://example.com/flat-image.png');

    expect(
      resolveGenerationResultPosterUrl({
        url: '',
        posterUrl: 'https://example.com/flat-poster.png',
      })
    ).toBe('https://example.com/flat-poster.png');
  });

  it('prefers canonical resource types over url heuristics when resolving render kind', () => {
    expect(
      resolveGenerationResultRenderKind(
        {
          url: 'https://example.com/generated/video-delivery',
          resource: {
            uuid: 'video-resource-uuid-1',
            type: MediaResourceType.VIDEO,
            url: 'https://example.com/generated/video-delivery',
          },
        },
        'image'
      )
    ).toBe('video');

    expect(
      resolveGenerationResultRenderKind(
        {
          url: 'https://example.com/generated/music-delivery',
          resource: {
            uuid: 'music-resource-uuid-1',
            type: MediaResourceType.MUSIC,
            url: 'https://example.com/generated/music-delivery',
          },
        },
        'image'
      )
    ).toBe('audio');
  });

  it('treats canonical TEXT resources as text render results and resolves transcript content', () => {
    const result = {
      id: 'result-text-1',
      uuid: 'result-text-uuid-1',
      resource: {
        uuid: 'resource-text-uuid-1',
        type: MediaResourceType.TEXT,
        url: 'data:text/plain;charset=utf-8,Hello%20world%20transcription',
        mimeType: 'text/plain',
        metadata: {
          text: 'Hello world transcription',
          language: 'en',
        },
      },
    };

    expect(resolveGenerationResultRenderKind(result, 'speech')).toBe('text');
    expect(resolveGenerationResultTextContent(result)).toBe('Hello world transcription');
  });

  it('treats character tasks and CHARACTER resources as image render results', () => {
    const task: GenerationTaskRecord = {
      id: 'task-character-1',
      uuid: 'task-character-uuid-1',
      createdAt: 123,
      updatedAt: 456,
      status: 'completed',
      config: {
        prompt: 'hero portrait',
        mediaType: 'character',
        aspectRatio: '1:1',
      },
      results: [
        {
          id: 'result-character-1',
          uuid: 'result-character-uuid-1',
          assetUuid: 'asset-character-uuid-1',
          resource: {
            uuid: 'resource-character-uuid-1',
            type: MediaResourceType.CHARACTER,
            path: 'assets://character/avatar/front',
          },
        },
      ],
    };

    const selection = toGenerationResultSelection(task, task.results![0], 0);

    expect(selection.type).toBe('character');
    expect(resolveGenerationResultRenderKind(selection, 'character')).toBe('image');
  });

  it('prefers poster resources for video thumbnails and delivery resources for image thumbnails', () => {
    expect(
      resolveGenerationResultPreviewThumbnailUrl(
        {
          url: 'https://example.com/generated/video-delivery',
          posterUrl: 'https://example.com/generated/video-poster-flat',
          resource: {
            uuid: 'video-resource-uuid-2',
            type: MediaResourceType.VIDEO,
            url: 'https://example.com/generated/video-delivery',
          },
          coverResource: {
            uuid: 'video-cover-uuid-2',
            type: MediaResourceType.IMAGE,
            url: 'https://example.com/generated/video-poster',
          },
        },
        'image'
      )
    ).toBe('https://example.com/generated/video-poster');

    expect(
      resolveGenerationResultPreviewThumbnailUrl(
        {
          url: 'https://example.com/generated/image-delivery',
          posterUrl: 'https://example.com/generated/image-poster',
          resource: {
            uuid: 'image-resource-uuid-1',
            type: MediaResourceType.IMAGE,
            url: 'https://example.com/generated/image-delivery',
          },
        },
        'image'
      )
    ).toBe('https://example.com/generated/image-delivery');
  });
});
