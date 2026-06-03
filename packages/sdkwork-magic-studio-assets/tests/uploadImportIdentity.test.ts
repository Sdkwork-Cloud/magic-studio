import { describe, expect, it } from 'vitest';

import {
  createImportData,
  createImportDataResource,
  resolveImportDataKey,
} from '../src/components/generate/upload/types';

describe('upload import identity', () => {
  it('creates canonical import resources from upload selections instead of flattening them to raw url strings', () => {
    const resource = createImportDataResource({
      type: 'image',
      url: 'https://example.com/generated/image.png',
      name: 'generated-image.png',
      metadata: {
        sourcePath: 'D:/generated/image.png',
      },
    });

    expect(resource).toMatchObject({
      id: null,
      uuid: expect.any(String),
      type: 'image',
      url: 'https://example.com/generated/image.png',
      name: 'generated-image.png',
      metadata: {
        sourcePath: 'D:/generated/image.png',
      },
    });
  });

  it('creates import payloads with nullable persisted id and canonical resources', () => {
    const data = createImportData({
      resource: createImportDataResource({
        type: 'image',
        url: 'https://example.com/generated/image.png',
        name: 'generated-image.png',
      }),
      type: 'image',
      createdAt: 123,
      prompt: 'A polished product hero shot',
      model: 'external-source',
      aspectRatio: '1:1',
    });

    expect(data.id).toBeNull();
    expect(data.uuid).toEqual(expect.any(String));
    expect(data.resource).toMatchObject({
      id: null,
      uuid: expect.any(String),
      type: 'image',
      url: 'https://example.com/generated/image.png',
    });
  });

  it('prefers uuid for client lookup and falls back to id', () => {
    expect(resolveImportDataKey({ id: 'asset-db-1', uuid: 'asset-uuid-1' })).toBe('asset-uuid-1');
    expect(resolveImportDataKey({ id: 'asset-db-2', uuid: '' })).toBe('asset-db-2');
  });

  it('creates a dedicated cover resource instead of flattening coverUrl into top-level state', () => {
    const data = createImportData({
      resource: createImportDataResource({
        type: 'video',
        url: 'https://example.com/generated/video.mp4',
        name: 'generated-video.mp4',
      }),
      coverResource: createImportDataResource({
        type: 'image',
        url: 'https://example.com/generated/video-cover.png',
        name: 'generated-video-cover.png',
      }),
      type: 'video',
      createdAt: 456,
      prompt: 'A refined imported video',
      model: 'external-source',
    });

    expect(data.coverResource).toMatchObject({
      id: null,
      uuid: expect.any(String),
      type: 'image',
      url: 'https://example.com/generated/video-cover.png',
    });
  });

  it('supports canonical audio and character import types with the correct fallback resource kinds', () => {
    const audioData = createImportData({
      resource: {
        url: 'https://example.com/generated/audio.wav',
      },
      type: 'audio',
      createdAt: 789,
      prompt: 'Imported speech result',
      model: 'whisper-1',
    });

    const characterData = createImportData({
      resource: {
        url: 'https://example.com/generated/character.png',
      },
      type: 'character',
      createdAt: 790,
      prompt: 'Imported character result',
      model: 'gemini-2.5-flash-image',
    });

    expect(audioData.resource.type).toBe('audio');
    expect(characterData.resource.type).toBe('image');
  });
});
