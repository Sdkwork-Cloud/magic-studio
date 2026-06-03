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

describe('mapImportDataToVideoTask', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('creates a local task with nullable persistence id and stable uuid identity', async () => {
    stubIndexedDb();

    const { mapImportDataToVideoTask } = await import('./importVideoTask');
    const task = mapImportDataToVideoTask({
      id: null,
      uuid: 'video-import-uuid-1',
      resource: {
        id: null,
        uuid: 'video-resource-uuid-1',
        assetId: 'video-asset-db-1',
        assetUuid: 'video-asset-uuid-1',
        primaryResourceId: 'video-primary-resource-db-1',
        primaryResourceUuid: 'video-primary-resource-uuid-1',
        resourceViewId: 'video-resource-view-db-1',
        resourceViewUuid: 'video-resource-view-uuid-1',
        type: 'video',
        url: 'https://example.com/generated/video.mp4',
        metadata: {
          sourcePath: 'assets://workspaces/ws-1/projects/proj-1/media/video.mp4',
        },
      },
      coverResource: {
        id: null,
        uuid: 'video-cover-resource-uuid-1',
        assetId: 'video-cover-asset-db-1',
        assetUuid: 'video-cover-asset-uuid-1',
        primaryResourceId: 'video-cover-primary-resource-db-1',
        primaryResourceUuid: 'video-cover-primary-resource-uuid-1',
        resourceViewId: 'video-cover-resource-view-db-1',
        resourceViewUuid: 'video-cover-resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/generated/video-cover.png',
        metadata: {
          canonicalPath: 'file:///workspace/generated/video-cover.png',
        },
      },
      type: 'video',
      createdAt: 456,
      prompt: 'A refined video import',
      model: 'external-source',
      aspectRatio: '16:9',
      duration: 8,
      resolution: '1080p',
      fps: 30,
    });

    expect(task.id).toBeNull();
    expect(task.uuid).toBe('video-import-uuid-1');
    expect(task.results?.[0]).toMatchObject({
      id: null,
      uuid: 'video-resource-uuid-1',
      assetId: 'video-asset-db-1',
      assetUuid: 'video-asset-uuid-1',
      primaryResourceId: 'video-primary-resource-db-1',
      primaryResourceUuid: 'video-primary-resource-uuid-1',
      resourceViewId: 'video-resource-view-db-1',
      resourceViewUuid: 'video-resource-view-uuid-1',
      resource: {
        uuid: 'video-resource-uuid-1',
        assetUuid: 'video-asset-uuid-1',
        primaryResourceUuid: 'video-primary-resource-uuid-1',
        resourceViewUuid: 'video-resource-view-uuid-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/video.mp4',
        url: 'https://example.com/generated/video.mp4',
      },
      coverResource: {
        uuid: 'video-cover-resource-uuid-1',
        assetUuid: 'video-cover-asset-uuid-1',
        primaryResourceUuid: 'video-cover-primary-resource-uuid-1',
        resourceViewUuid: 'video-cover-resource-view-uuid-1',
        path: 'file:///workspace/generated/video-cover.png',
        url: 'https://example.com/generated/video-cover.png',
      },
    });
    expect(task.results?.[0]?.url).toBeUndefined();
    expect(task.results?.[0]?.posterUrl).toBeUndefined();
  }, 15000);
});
