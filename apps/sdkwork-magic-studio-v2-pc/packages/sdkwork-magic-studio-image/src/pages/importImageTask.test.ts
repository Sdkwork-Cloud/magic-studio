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

describe('mapImportDataToImageTask', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('uses the import uuid as the task key and keeps imported task/result persistence ids nullable', async () => {
    stubIndexedDb();

    const { mapImportDataToImageTask } = await import('./importImageTask');
    const task = mapImportDataToImageTask({
      id: null,
      uuid: 'image-import-uuid-1',
      resource: {
        id: null,
        uuid: 'image-resource-uuid-1',
        assetId: 'image-asset-db-1',
        assetUuid: 'image-asset-uuid-1',
        primaryResourceId: 'image-primary-resource-db-1',
        primaryResourceUuid: 'image-primary-resource-uuid-1',
        resourceViewId: 'image-resource-view-db-1',
        resourceViewUuid: 'image-resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/generated/image.png',
        metadata: {
          canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/image.png',
        },
      },
      type: 'image',
      createdAt: 123,
      prompt: 'A refined image import',
      model: 'external-source',
      aspectRatio: '3:2',
      negativePrompt: 'blurry',
      style: 'photorealistic',
      coverResource: {
        id: null,
        uuid: 'image-cover-resource-uuid-1',
        assetId: 'image-cover-asset-db-1',
        assetUuid: 'image-cover-asset-uuid-1',
        primaryResourceId: 'image-cover-primary-resource-db-1',
        primaryResourceUuid: 'image-cover-primary-resource-uuid-1',
        resourceViewId: 'image-cover-resource-view-db-1',
        resourceViewUuid: 'image-cover-resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/generated/image-cover.png',
        metadata: {
          sourcePath: 'D:/generated/image-cover.png',
        },
      },
    });

    expect(task.id).toBeNull();
    expect(task.uuid).toBe('image-import-uuid-1');
    expect(task.results?.[0]).toMatchObject({
      id: null,
      uuid: 'image-resource-uuid-1',
      assetId: 'image-asset-db-1',
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: 'image-primary-resource-db-1',
      primaryResourceUuid: 'image-primary-resource-uuid-1',
      resourceViewId: 'image-resource-view-db-1',
      resourceViewUuid: 'image-resource-view-uuid-1',
      resource: {
        uuid: 'image-resource-uuid-1',
        assetUuid: 'image-asset-uuid-1',
        primaryResourceUuid: 'image-primary-resource-uuid-1',
        resourceViewUuid: 'image-resource-view-uuid-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/image.png',
        url: 'https://example.com/generated/image.png',
      },
      coverResource: {
        uuid: 'image-cover-resource-uuid-1',
        assetUuid: 'image-cover-asset-uuid-1',
        primaryResourceUuid: 'image-cover-primary-resource-uuid-1',
        resourceViewUuid: 'image-cover-resource-view-uuid-1',
        path: 'D:/generated/image-cover.png',
        url: 'https://example.com/generated/image-cover.png',
      },
    });
    expect(task.results?.[0]?.url).toBeUndefined();
    expect(task.results?.[0]?.thumbnailUrl).toBeUndefined();
  }, 15000);
});
