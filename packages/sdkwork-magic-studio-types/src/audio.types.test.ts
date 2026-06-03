import { describe, expect, it } from 'vitest';
import { MediaResourceType } from './common.types';

import {
  createAudioInputResourceRef,
  createAudioTask,
  createAudioTaskResult,
  hasAudioInputResourceReference,
  resolveAudioInputResourceKey,
  resolveAudioInputResourceReference,
  resolveAudioInputResourcePath,
  resolveAudioInputResourceUrl,
  resolveAudioTaskResultUrl,
} from './audio.types';

describe('audio AGI-native editor models', () => {
  it('hydrates audio task results from canonical resource objects', () => {
    const result = createAudioTaskResult({
      id: 'audio-artifact-1',
      uuid: 'audio-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'audio-resource-uuid-1',
        assetId: 'audio-asset-1',
        assetUuid: 'audio-asset-uuid-1',
        primaryResourceId: 'audio-resource-1',
        primaryResourceUuid: 'audio-resource-uuid-1',
        resourceViewId: 'audio-view-1',
        resourceViewUuid: 'audio-view-uuid-1',
        url: 'https://example.com/generated-audio.wav',
        duration: 12,
      },
      duration: 12,
    });

    expect(result).toMatchObject({
      id: 'audio-artifact-1',
      uuid: 'audio-artifact-uuid-1',
      assetId: 'audio-asset-1',
      assetUuid: 'audio-asset-uuid-1',
      primaryResourceId: 'audio-resource-1',
      primaryResourceUuid: 'audio-resource-uuid-1',
      resourceViewId: 'audio-view-1',
      resourceViewUuid: 'audio-view-uuid-1',
      duration: 12,
      resource: {
        uuid: 'audio-resource-uuid-1',
        url: 'https://example.com/generated-audio.wav',
        duration: 12,
      },
    });
    expect(result.url).toBeUndefined();
    expect(resolveAudioTaskResultUrl(result)).toBe('https://example.com/generated-audio.wav');
  });

  it('creates audio tasks with nullable persistence ids and stable uuids', () => {
    const task = createAudioTask({
      config: {
        prompt: 'warm narration voice',
        model: 'gemini-tts',
        duration: 10,
      },
      status: 'pending',
    });

    expect(task).toMatchObject({
      id: null,
      status: 'pending',
      config: {
        prompt: 'warm narration voice',
      },
    });
    expect(task.uuid).toBeTruthy();
  });

  it('hydrates the canonical audio resource url from top-level fallback without flattening it back', () => {
    const result = createAudioTaskResult({
      url: 'https://example.com/canonical-top-level-audio.wav',
      resource: {
        id: null,
        uuid: 'audio-resource-uuid-top-level',
        duration: 6,
      },
    });

    expect(result.url).toBeUndefined();
    expect(result.resource.url).toBe('https://example.com/canonical-top-level-audio.wav');
    expect(resolveAudioTaskResultUrl(result)).toBe('https://example.com/canonical-top-level-audio.wav');
  });

  it('falls back to legacy top-level audio urls when canonical resources are absent', () => {
    expect(
      resolveAudioTaskResultUrl({
        url: 'https://example.com/legacy-audio.wav',
      } as any)
    ).toBe('https://example.com/legacy-audio.wav');
  });

  it('does not fabricate resource view identity when only primary resource identity is known', () => {
    const result = createAudioTaskResult({
      assetId: 'audio-asset-db-2',
      primaryResourceId: 'audio-resource-db-2',
      primaryResourceUuid: 'audio-resource-uuid-2',
      url: 'https://example.com/generated-audio-2.wav',
      resource: {
        id: null,
        uuid: 'audio-resource-entity-uuid-2',
        duration: 6,
      },
    });

    expect(result).toMatchObject({
      assetId: 'audio-asset-db-2',
      assetUuid: null,
      primaryResourceId: 'audio-resource-db-2',
      primaryResourceUuid: 'audio-resource-uuid-2',
      resourceViewId: null,
      resourceViewUuid: null,
      resource: {
        assetId: 'audio-asset-db-2',
        primaryResourceId: 'audio-resource-db-2',
        primaryResourceUuid: 'audio-resource-uuid-2',
        resourceViewId: null,
        resourceViewUuid: null,
      },
    });
  });

  it('hydrates audio input refs with canonical identity and url resolution', () => {
    const input = createAudioInputResourceRef({
      id: 'audio-source-id-1',
      uuid: 'audio-source-uuid-1',
      assetId: 'audio-source-asset-1',
      assetUuid: 'audio-source-asset-uuid-1',
      primaryResourceId: 'audio-source-resource-id-1',
      primaryResourceUuid: 'audio-source-resource-uuid-1',
      resourceViewId: 'audio-source-view-id-1',
      resourceViewUuid: 'audio-source-view-uuid-1',
      type: 'audio',
      name: 'meeting-notes.wav',
      resource: {
        id: 'audio-source-resource-id-1',
        uuid: 'audio-source-resource-uuid-1',
        type: MediaResourceType.AUDIO,
        url: 'https://example.com/source-audio.wav',
        mimeType: 'audio/wav',
        name: 'meeting-notes.wav',
      },
    });

    expect(input).toMatchObject({
      id: 'audio-source-id-1',
      uuid: 'audio-source-uuid-1',
      assetId: 'audio-source-asset-1',
      assetUuid: 'audio-source-asset-uuid-1',
      primaryResourceId: 'audio-source-resource-id-1',
      primaryResourceUuid: 'audio-source-resource-uuid-1',
      resourceViewId: 'audio-source-view-id-1',
      resourceViewUuid: 'audio-source-view-uuid-1',
      type: 'audio',
      url: 'https://example.com/source-audio.wav',
      name: 'meeting-notes.wav',
    });
    expect(resolveAudioInputResourceKey(input)).toBe('audio-source-view-uuid-1');
    expect(resolveAudioInputResourcePath(input)).toBe('https://example.com/source-audio.wav');
    expect(resolveAudioInputResourceUrl(input)).toBe('https://example.com/source-audio.wav');
  });

  it('preserves canonical locator paths separately from delivery urls for audio input refs', () => {
    const input = createAudioInputResourceRef({
      assetId: 'audio-asset-db-3',
      resourceViewUuid: 'audio-view-uuid-3',
      type: 'audio',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/source-audio-3.wav',
      url: 'https://cdn.example.com/source-audio-3.wav',
      metadata: {
        deliveryUrl: 'https://cdn.example.com/source-audio-3.wav',
      },
    });

    expect(input).toMatchObject({
      assetId: 'audio-asset-db-3',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/source-audio-3.wav',
      url: 'https://cdn.example.com/source-audio-3.wav',
    });
    expect(resolveAudioInputResourcePath(input)).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/source-audio-3.wav'
    );
    expect(resolveAudioInputResourceUrl(input)).toBe('https://cdn.example.com/source-audio-3.wav');
    expect(resolveAudioInputResourceReference(input)).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/source-audio-3.wav'
    );
    expect(hasAudioInputResourceReference(input)).toBe(true);
  });

  it('does not backfill the local audio input ref id from asset identity fields', () => {
    const input = createAudioInputResourceRef({
      id: null,
      uuid: 'audio-ref-uuid-2',
      assetId: 'audio-asset-db-2',
      assetUuid: 'audio-asset-uuid-2',
      primaryResourceId: 'audio-primary-db-2',
      primaryResourceUuid: 'audio-primary-uuid-2',
      resourceViewId: 'audio-view-db-2',
      resourceViewUuid: 'audio-view-uuid-2',
      type: 'audio',
      url: 'https://example.com/uploaded-audio.wav',
      name: 'uploaded-audio.wav',
    });

    expect(input).toMatchObject({
      id: null,
      uuid: 'audio-ref-uuid-2',
      assetId: 'audio-asset-db-2',
      assetUuid: 'audio-asset-uuid-2',
      primaryResourceId: 'audio-primary-db-2',
      primaryResourceUuid: 'audio-primary-uuid-2',
      resourceViewId: 'audio-view-db-2',
      resourceViewUuid: 'audio-view-uuid-2',
    });
    expect(resolveAudioInputResourceKey(input)).toBe('audio-view-uuid-2');
  });

  it('creates text transcript task results without downgrading them to audio resources', () => {
    const result = createAudioTaskResult({
      uuid: 'audio-transcription-artifact-uuid-1',
      assetId: 'audio-transcription-asset-1',
      assetUuid: 'audio-transcription-asset-uuid-1',
      primaryResourceId: 'audio-transcription-resource-id-1',
      primaryResourceUuid: 'audio-transcription-resource-uuid-1',
      resourceViewId: 'audio-transcription-view-id-1',
      resourceViewUuid: 'audio-transcription-view-uuid-1',
      text: 'Hello world transcription',
      language: 'en',
      segments: [
        {
          id: 0,
          start: 0,
          end: 1.2,
          text: 'Hello world transcription',
        },
      ],
      resource: {
        id: null,
        uuid: 'audio-transcription-resource-view-uuid-1',
        type: MediaResourceType.TEXT,
        url: 'data:text/plain;charset=utf-8,Hello%20world%20transcription',
        mimeType: 'text/plain',
        name: 'meeting-notes.txt',
        text: 'Hello world transcription',
        language: 'en',
        metadata: {
          text: 'Hello world transcription',
          language: 'en',
          segments: [
            {
              id: 0,
              start: 0,
              end: 1.2,
              text: 'Hello world transcription',
            },
          ],
        },
      },
    });

    expect(result).toMatchObject({
      uuid: 'audio-transcription-artifact-uuid-1',
      assetId: 'audio-transcription-asset-1',
      assetUuid: 'audio-transcription-asset-uuid-1',
      primaryResourceId: 'audio-transcription-resource-id-1',
      primaryResourceUuid: 'audio-transcription-resource-uuid-1',
      resourceViewId: 'audio-transcription-view-id-1',
      resourceViewUuid: 'audio-transcription-view-uuid-1',
      text: 'Hello world transcription',
      language: 'en',
      segments: [
        {
          id: 0,
          start: 0,
          end: 1.2,
          text: 'Hello world transcription',
        },
      ],
      resource: {
        type: MediaResourceType.TEXT,
        mimeType: 'text/plain',
        text: 'Hello world transcription',
        language: 'en',
      },
    });
    expect(resolveAudioTaskResultUrl(result)).toBe(
      'data:text/plain;charset=utf-8,Hello%20world%20transcription'
    );
  });
});
