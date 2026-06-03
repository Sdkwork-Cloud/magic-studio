/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGeneratedImageResult, createImageInputResourceRef, createImageTask } from '../entities';

const mocks = vi.hoisted(() => ({
  generatedOutcome: {
    recipe: {
      id: null,
      uuid: 'recipe-uuid-generate-1',
      product: 'image',
      mode: 'text-to-image',
      prompt: 'floating glass city',
      negativePrompt: 'rain',
      inputRefs: [],
      parameters: {
        aspectRatio: '16:9',
      },
    },
    execution: {
      id: null,
      uuid: 'execution-uuid-generate-1',
      provider: 'app-image',
      providerModel: 'gemini-3-flash-image',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'artifact-set-uuid-generate-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/generated-image.png',
      mimeType: 'image/png',
      width: 1280,
      height: 720,
      artifactUuid: 'artifact-uuid-generate-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'artifact-uuid-generate-1',
      type: 'image',
      resource: {
        id: null,
        uuid: 'resource-uuid-generate-1',
        url: 'https://example.com/generated-image.png',
      },
    },
  },
  upscaleOutcome: {
    recipe: {
      id: null,
      uuid: 'recipe-uuid-upscale-1',
      product: 'image',
      mode: 'upscale',
      prompt: 'upscale prompt',
      negativePrompt: undefined,
      inputRefs: [],
      parameters: {
        scale: 4,
      },
    },
    execution: {
      id: null,
      uuid: 'execution-uuid-upscale-1',
      provider: 'app-image',
      providerModel: 'upscaler-pro',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'artifact-set-uuid-upscale-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/upscaled-image.png',
      mimeType: 'image/png',
      width: 2048,
      height: 2048,
      artifactUuid: 'artifact-uuid-upscale-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'artifact-uuid-upscale-1',
      type: 'image',
      resource: {
        id: null,
        uuid: 'resource-uuid-upscale-1',
        url: 'https://example.com/upscaled-image.png',
      },
    },
  },
  persistGenerationOutcomeAsset: vi.fn(),
  findAll: vi.fn(async () => ({
    success: true,
    data: {
      content: [],
    },
  })),
  save: vi.fn(async () => undefined),
  deleteById: vi.fn(async () => undefined),
  clear: vi.fn(async () => undefined),
  toggleFavorite: vi.fn(async () => undefined),
  generateImage: vi.fn(async () => mocks.generatedOutcome),
  enhancePrompt: vi.fn(async (text: string) => text),
  upscaleImage: vi.fn(async () => mocks.upscaleOutcome),
  persistImageGenerationResult: vi.fn(async ({ outcome }: { outcome: unknown }) =>
    outcome === mocks.generatedOutcome
      ? createGeneratedImageResult({
          uuid: 'persisted-generated-image-uuid-1',
          assetId: 'persisted-generated-asset-1',
          assetUuid: 'persisted-generated-asset-uuid-1',
          resource: {
            id: null,
            uuid: 'persisted-generated-resource-uuid-1',
            assetId: 'persisted-generated-asset-1',
            assetUuid: 'persisted-generated-asset-uuid-1',
            url: 'https://storage.example.com/persisted-generated-image.png',
            width: 1280,
            height: 720,
            name: 'persisted-generated-image.png',
          },
          prompt: 'floating glass city',
          negativePrompt: 'rain',
          width: 1280,
          height: 720,
        })
      : createGeneratedImageResult({
          uuid: 'persisted-upscale-image-uuid-1',
          assetId: 'persisted-upscale-asset-1',
          assetUuid: 'persisted-upscale-asset-uuid-1',
          resource: {
            id: null,
            uuid: 'persisted-upscale-resource-uuid-1',
            assetId: 'persisted-upscale-asset-1',
            assetUuid: 'persisted-upscale-asset-uuid-1',
            url: 'https://storage.example.com/persisted-upscale-image.png',
            width: 2048,
            height: 2048,
            name: 'persisted-upscale-image.png',
          },
          width: 2048,
          height: 2048,
        })
  ),
}));

vi.mock('../services', () => ({
  imageBusinessService: {
    imageService: {
      generateImage: mocks.generateImage,
      enhancePrompt: mocks.enhancePrompt,
      upscaleImage: mocks.upscaleImage,
    },
    imageHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      clear: mocks.clear,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
  persistImageGenerationResult: mocks.persistImageGenerationResult,
}));

vi.mock('../constants', () => ({
  IMAGE_STYLES: [],
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  generateUUID: vi.fn(() => 'task-uuid-1'),
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

import { ImageStoreProvider, useImageStore } from './imageStore';

interface ImageStoreTestHandle {
  history: Array<Record<string, unknown>>;
  setConfig: (config: Record<string, unknown>) => void;
  generate: () => Promise<void>;
  importTask: (task: unknown) => Promise<void>;
  upscaleImage: (source: unknown) => Promise<void>;
}

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: ImageStoreTestHandle) => void;
}) => {
  const store = useImageStore();
  onStore(store as unknown as ImageStoreTestHandle);
  return null;
};

describe('ImageStoreProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.persistGenerationOutcomeAsset.mockClear();
    mocks.findAll.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.clear.mockClear();
    mocks.toggleFavorite.mockClear();
    mocks.generateImage.mockClear();
    mocks.enhancePrompt.mockClear();
    mocks.upscaleImage.mockClear();
    mocks.persistImageGenerationResult.mockClear();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    root = null;
    container?.remove();
    container = null;
    document.body.innerHTML = '';
  });

  it('routes store upscale requests through image service and persists the canonical result', async () => {
    let latestStore: ImageStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <ImageStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </ImageStoreProvider>
      );
      await Promise.resolve();
    });

    const sourceImage = createGeneratedImageResult({
      uuid: 'source-image-uuid-1',
      assetId: 'source-asset-1',
      assetUuid: 'source-asset-uuid-1',
      resource: {
        id: null,
        uuid: 'source-resource-uuid-1',
        assetId: 'source-asset-1',
        assetUuid: 'source-asset-uuid-1',
        url: 'https://storage.example.com/source-image.png',
        width: 1024,
        height: 1024,
        name: 'source-image.png',
      },
      width: 1024,
      height: 1024,
    });

    await act(async () => {
      await latestStore?.upscaleImage(sourceImage);
    });

    expect(mocks.upscaleImage).toHaveBeenCalledWith({
      source: sourceImage,
      model: 'upscaler-pro',
      scale: 4,
      format: 'png',
      n: 1,
    });
    expect(mocks.persistImageGenerationResult).toHaveBeenCalledWith({
      outcome: expect.objectContaining({
        delivery: expect.objectContaining({
          url: 'https://example.com/upscaled-image.png',
        }),
      }),
      name: 'upscaled_task-uuid-1.png',
    });
    expect(mocks.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        uuid: 'task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            uuid: 'persisted-upscale-image-uuid-1',
            assetId: 'persisted-upscale-asset-1',
          }),
        ],
      })
    );
  });

  it('routes store image generation through persistImageGenerationResult instead of hand-written asset mapping', async () => {
    let latestStore: ImageStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <ImageStoreProvider
          initialConfig={{
            prompt: 'floating glass city',
            aspectRatio: '16:9',
            batchSize: 1,
            model: 'gemini-3-flash-image',
          }}
        >
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </ImageStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'floating glass city',
        model: 'gemini-3-flash-image',
      })
    );
    expect(mocks.persistImageGenerationResult).toHaveBeenCalledWith({
      outcome: mocks.generatedOutcome,
      name: 'gen_image_task-uuid-1_0.png',
    });
    expect(mocks.persistGenerationOutcomeAsset).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        uuid: 'task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            uuid: 'persisted-generated-image-uuid-1',
            assetId: 'persisted-generated-asset-1',
          }),
        ],
      })
    );
  });

  it('allows reference-only image variation requests without prompt', async () => {
    let latestStore: ImageStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <ImageStoreProvider
          initialConfig={{
            prompt: '',
            aspectRatio: '1:1',
            batchSize: 1,
            model: 'gemini-3-flash-image',
            referenceImages: [
              createImageInputResourceRef({
                path: 'assets://workspaces/ws-3/projects/proj-3/media/originals/image/variation-ref.png',
                name: 'Variation Ref',
              }),
            ],
          }}
        >
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </ImageStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: '',
        referenceImages: [
          expect.objectContaining({
            path: 'assets://workspaces/ws-3/projects/proj-3/media/originals/image/variation-ref.png',
          }),
        ],
      })
    );
  });

  it('imports image tasks at the top of history and replaces the previous copy with the same key', async () => {
    let latestStore: ImageStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <ImageStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </ImageStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Image store was not captured');
    }
    const getStore = (): ImageStoreTestHandle => latestStore as unknown as ImageStoreTestHandle;

    const firstImportedTask = createImageTask({
      id: 'imported-image-db-id-1',
      uuid: 'imported-image-task-uuid-1',
      status: 'completed',
      config: {
        prompt: 'first imported image',
        aspectRatio: '1:1',
        styleId: 'none',
        batchSize: 1,
        mediaType: 'image',
      },
      results: [
        createGeneratedImageResult({
          uuid: 'imported-image-result-uuid-1',
          resource: {
            id: null,
            uuid: 'imported-image-resource-uuid-1',
            url: 'https://example.com/imported-image-1.png',
            name: 'imported-image-1.png',
          },
        }),
      ],
    });

    const updatedImportedTask = createImageTask({
      id: 'imported-image-db-id-2',
      uuid: 'imported-image-task-uuid-1',
      status: 'completed',
      config: {
        prompt: 'updated imported image',
        aspectRatio: '16:9',
        styleId: 'none',
        batchSize: 1,
        mediaType: 'image',
      },
      results: [
        createGeneratedImageResult({
          uuid: 'imported-image-result-uuid-2',
          resource: {
            id: null,
            uuid: 'imported-image-resource-uuid-2',
            url: 'https://example.com/imported-image-2.png',
            name: 'imported-image-2.png',
          },
        }),
      ],
    });

    await act(async () => {
      await getStore().importTask(firstImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-image-db-id-1',
      uuid: 'imported-image-task-uuid-1',
      config: expect.objectContaining({
        prompt: 'first imported image',
      }),
    });

    await act(async () => {
      await getStore().importTask(updatedImportedTask);
    });

    expect(mocks.save).toHaveBeenCalledWith(firstImportedTask);
    expect(mocks.save).toHaveBeenCalledWith(updatedImportedTask);
    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      uuid: 'imported-image-task-uuid-1',
      config: expect.objectContaining({
        prompt: 'updated imported image',
        aspectRatio: '16:9',
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-image-result-uuid-2',
        }),
      ],
    });
  });
});
