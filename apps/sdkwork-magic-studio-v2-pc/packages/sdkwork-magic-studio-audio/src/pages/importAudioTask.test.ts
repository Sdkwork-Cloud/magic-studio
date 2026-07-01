import { afterEach, describe, expect, it, vi } from 'vitest';

const stubIndexedDb = () => {
  const createRequest = (result: unknown) => {
    const request: {
      result: unknown;
      error: unknown;
      onsuccess?: ((event: { target: typeof request }) => void) | null;
      onerror?: ((event: { target: typeof request }) => void) | null;
    } = {
      result,
      error: null,
      onsuccess: null,
      onerror: null,
    };

    queueMicrotask(() => {
      request.onsuccess?.({ target: request });
    });

    return request;
  };

  vi.stubGlobal('indexedDB', {
    open: () => {
      const database = {
        objectStoreNames: {
          contains: () => false,
        },
        createObjectStore: () => ({
          createIndex: () => undefined,
        }),
        transaction: () => ({
          objectStore: () => ({
            get: () => createRequest(undefined),
            put: () => createRequest(undefined),
            getAll: () => createRequest([]),
          }),
        }),
      };

      const request: {
        result: typeof database;
        error: unknown;
        onsuccess?: ((event: { target: typeof request }) => void) | null;
        onerror?: ((event: { target: typeof request }) => void) | null;
        onupgradeneeded?: ((event: { target: typeof request }) => void) | null;
      } = {
        result: database,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      queueMicrotask(() => {
        request.onupgradeneeded?.({ target: request });
        request.onsuccess?.({ target: request });
      });

      return request;
    },
  });
};

describe('mapImportDataToAudioTask', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('creates a local task with nullable persistence id and stable uuid identity', async () => {
    stubIndexedDb();

    const { mapImportDataToAudioTask } = await import('./importAudioTask');
    const task = mapImportDataToAudioTask({
      id: null,
      uuid: 'audio-import-uuid-1',
      resource: {
        id: null,
        uuid: 'audio-resource-uuid-1',
        assetId: 'audio-asset-db-1',
        assetUuid: 'audio-asset-uuid-1',
        primaryResourceId: 'audio-primary-resource-db-1',
        primaryResourceUuid: 'audio-primary-resource-uuid-1',
        resourceViewId: 'audio-resource-view-db-1',
        resourceViewUuid: 'audio-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/generated/audio.mp3',
        metadata: {
          canonicalPath: 'desktop://imports/generated/audio.mp3',
        },
      },
      type: 'audio',
      createdAt: 789,
      prompt: 'A refined audio import',
      model: 'external-source',
      duration: 120,
      title: 'Imported Track',
      lyrics: 'hello world',
      isInstrumental: false,
    });

    expect(task.id).toBeNull();
    expect(task.uuid).toBe('audio-import-uuid-1');
    expect(task.config).toMatchObject({
      prompt: 'A refined audio import',
      model: 'whisper-1',
      duration: 120,
      mode: 'text-to-speech',
      mediaType: 'speech',
    });
    expect(task.results?.[0]).toMatchObject({
      id: null,
      uuid: 'audio-resource-uuid-1',
      assetId: 'audio-asset-db-1',
      assetUuid: 'audio-asset-uuid-1',
      primaryResourceId: 'audio-primary-resource-db-1',
      primaryResourceUuid: 'audio-primary-resource-uuid-1',
      resourceViewId: 'audio-resource-view-db-1',
      resourceViewUuid: 'audio-resource-view-uuid-1',
      duration: 120,
      resource: {
        uuid: 'audio-resource-uuid-1',
        assetUuid: 'audio-asset-uuid-1',
        primaryResourceUuid: 'audio-primary-resource-uuid-1',
        resourceViewUuid: 'audio-resource-view-uuid-1',
        path: 'desktop://imports/generated/audio.mp3',
        url: 'https://example.com/generated/audio.mp3',
      },
    });
    expect(task.results?.[0]?.url).toBeUndefined();
  }, 15000);
});
