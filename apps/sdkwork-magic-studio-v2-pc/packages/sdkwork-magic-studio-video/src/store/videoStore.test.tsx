/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGeneratedVideoResult, createVideoInputResourceRef, createVideoTask } from '../entities';

const mocks = vi.hoisted(() => ({
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
  enhancePrompt: vi.fn(async (input: { prompt: string }) => input.prompt),
  createLipSyncTask: vi.fn(async () => {
    throw new Error('provider unavailable');
  }),
  queryLipSyncTask: vi.fn(),
  generateVideo: vi.fn(),
  buildUnifiedVideoGenerationRequest: vi.fn(() => ({
    generationType: 'lip-sync',
    assets: [],
    prompt: '',
    negativePrompt: '',
    duration: '5s',
    resolution: '720p',
    aspectRatio: '16:9',
    model: 'wan2.2-vace-plus',
    videoStyle: {
      id: 'none',
      prompt: '',
    },
    options: {},
  })),
  resolveGenerationExecutionOutcome: vi.fn(() => null),
  normalVideoOutcome: {
    recipe: {
      id: null,
      uuid: 'video-recipe-uuid-1',
      product: 'video',
      mode: 'text-to-video',
      prompt: 'flying over neon city',
      negativePrompt: '',
      inputRefs: [],
      parameters: {},
    },
    execution: {
      id: null,
      uuid: 'video-execution-uuid-1',
      provider: 'app-video',
      providerModel: 'wan2.2-vace-plus',
      status: 'succeeded',
      remoteJobId: 'video-task-1',
    },
    artifactSet: {
      id: null,
      uuid: 'video-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/generated-video.mp4',
      mimeType: 'video/mp4',
      width: 1280,
      height: 720,
      duration: 5,
      posterUrl: 'https://example.com/generated-video-poster.png',
      artifactUuid: 'video-artifact-uuid-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'video-artifact-uuid-1',
      type: 'video',
      resource: {
        id: null,
        uuid: 'video-resource-uuid-1',
        url: 'https://example.com/generated-video.mp4',
      },
    },
  },
  persistVideoGenerationResult: vi.fn(async () =>
    createGeneratedVideoResult({
      uuid: 'persisted-video-uuid-1',
      assetId: 'persisted-video-asset-1',
      assetUuid: 'persisted-video-asset-uuid-1',
      resource: {
        id: null,
        uuid: 'persisted-video-resource-uuid-1',
        assetId: 'persisted-video-asset-1',
        assetUuid: 'persisted-video-asset-uuid-1',
        url: 'https://storage.example.com/generated-video.mp4',
        width: 1280,
        height: 720,
        duration: 5,
      },
      coverResource: {
        id: null,
        url: 'https://storage.example.com/generated-video-poster.png',
      },
      modelId: 'wan2.2-vace-plus',
    })
  ),
}));

vi.mock('../services', () => ({
  buildUnifiedVideoGenerationRequest: mocks.buildUnifiedVideoGenerationRequest,
  persistVideoGenerationResult: mocks.persistVideoGenerationResult,
  videoBusinessService: {
    videoService: {
      enhancePrompt: mocks.enhancePrompt,
      createLipSyncTask: mocks.createLipSyncTask,
      queryLipSyncTask: mocks.queryLipSyncTask,
      generateVideo: mocks.generateVideo,
    },
    videoHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      clear: mocks.clear,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
}));

vi.mock('../constants', () => ({
  VIDEO_MODELS: [
    {
      id: 'wan2.2-vace-plus',
      name: 'Wan 2.2 Vace Plus',
    },
  ],
  VIDEO_STYLES: [],
  getNearestSupportedDurationByModelMode: (_model: string, _mode: string, duration: string) => duration,
  getSupportedModesByModel: () => ['lip-sync', 'text', 'image', 'smart_reference', 'image-to-video', 'video-to-video', 'extend'],
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  resolveGenerationExecutionOutcome: mocks.resolveGenerationExecutionOutcome,
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  generateUUID: vi.fn(() => 'video-task-uuid-1'),
}));

import { VideoStoreProvider, useVideoStore } from './videoStore';

interface VideoStoreTestHandle {
  history: Array<Record<string, unknown>>;
  setConfig: (config: Record<string, unknown>) => void;
  generate: () => Promise<void>;
  importTask: (task: unknown) => Promise<void>;
}

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: VideoStoreTestHandle) => void;
}) => {
  const store = useVideoStore();
  onStore(store as unknown as VideoStoreTestHandle);
  return null;
};

describe('VideoStoreProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.findAll.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.clear.mockClear();
    mocks.toggleFavorite.mockClear();
    mocks.enhancePrompt.mockClear();
    mocks.createLipSyncTask.mockClear();
    mocks.queryLipSyncTask.mockClear();
    mocks.generateVideo.mockClear();
    mocks.buildUnifiedVideoGenerationRequest.mockClear();
    mocks.resolveGenerationExecutionOutcome.mockClear();
    mocks.persistVideoGenerationResult.mockClear();
    mocks.persistGenerationOutcomeAsset.mockClear();
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

  it('does not fabricate a mock provider on pending lip-sync tasks before real execution exists', async () => {
    let latestStore: VideoStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VideoStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VideoStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'lip-sync',
        targetVideo: createVideoInputResourceRef({
          assetId: 'video-asset-1',
          assetUuid: 'video-asset-uuid-1',
          type: 'video',
          url: 'https://example.com/source-video.mp4',
        }),
        driverAudio: createVideoInputResourceRef({
          assetId: 'audio-asset-1',
          assetUuid: 'audio-asset-uuid-1',
          type: 'audio',
          url: 'https://example.com/driver-audio.wav',
        }),
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.save).toHaveBeenCalled();
    const firstSavedTask = (mocks.save.mock.calls as unknown as Array<[unknown]>)[0]?.[0];

    expect(firstSavedTask).toEqual(
      expect.objectContaining({
        uuid: 'video-task-uuid-1',
        taskType: 'lip_sync',
        status: 'pending',
        stage: 'validating',
        provider: undefined,
      })
    );
  });

  it('uses persistVideoGenerationResult for standard video generation results', async () => {
    let latestStore: VideoStoreTestHandle | null = null;
    mocks.buildUnifiedVideoGenerationRequest.mockImplementation(() => ({
      generationType: 'text',
      assets: [],
      prompt: 'flying over neon city',
      negativePrompt: '',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'wan2.2-vace-plus',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
      options: {},
    }));
    mocks.generateVideo.mockResolvedValueOnce(mocks.normalVideoOutcome);

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VideoStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VideoStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'text',
        prompt: 'flying over neon city',
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        generationType: 'text',
        prompt: 'flying over neon city',
      })
    );
    expect(mocks.persistVideoGenerationResult).toHaveBeenCalledWith({
      outcome: mocks.normalVideoOutcome,
      name: 'video_gen_video-task-uuid-1.mp4',
    });
    expect(mocks.persistGenerationOutcomeAsset).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        uuid: 'video-task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            uuid: 'persisted-video-uuid-1',
            assetId: 'persisted-video-asset-1',
          }),
        ],
      })
    );
  });

  it('does not start image-to-video generation without a source image', async () => {
    let latestStore: VideoStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VideoStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VideoStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'image-to-video',
        prompt: 'animate the portrait',
        image: undefined,
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.buildUnifiedVideoGenerationRequest).not.toHaveBeenCalled();
    expect(mocks.generateVideo).not.toHaveBeenCalled();
  });

  it('does not start video-to-video generation without a source video', async () => {
    let latestStore: VideoStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VideoStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VideoStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'video-to-video',
        prompt: 'anime cel shading',
        targetVideo: undefined,
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.buildUnifiedVideoGenerationRequest).not.toHaveBeenCalled();
    expect(mocks.generateVideo).not.toHaveBeenCalled();
  });

  it('starts extend generation with a source video even when prompt is empty', async () => {
    let latestStore: VideoStoreTestHandle | null = null;
    mocks.buildUnifiedVideoGenerationRequest.mockImplementation(() => ({
      generationType: 'extend',
      assets: [
        {
          role: 'input_video',
          type: 'video',
          value: 'video-view-uuid-extend-source',
        },
      ],
      prompt: '',
      negativePrompt: '',
      duration: '10s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'wan2.2-vace-plus',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
      options: {},
    }) as any);
    mocks.generateVideo.mockResolvedValueOnce(mocks.normalVideoOutcome);

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VideoStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VideoStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'extend',
        prompt: '',
        targetVideo: createVideoInputResourceRef({
          assetId: 'extend-video-asset-1',
          assetUuid: 'extend-video-asset-uuid-1',
          type: 'video',
          url: 'https://example.com/extend-source-video.mp4',
        }),
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.buildUnifiedVideoGenerationRequest).toHaveBeenCalled();
    expect(mocks.generateVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        generationType: 'extend',
      })
    );
  });

  it('imports video tasks at the top of history and replaces the previous copy with the same key', async () => {
    let latestStore: VideoStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VideoStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VideoStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Video store was not captured');
    }
    const getStore = (): VideoStoreTestHandle => latestStore as unknown as VideoStoreTestHandle;

    const firstImportedTask = createVideoTask({
      id: 'imported-video-db-id-1',
      uuid: 'imported-video-task-uuid-1',
      status: 'completed',
      taskType: 'generation',
      config: {
        mode: 'text',
        prompt: 'first imported video',
        aspectRatio: '16:9',
        resolution: '720p',
        duration: '5s',
        fps: 30,
        model: 'wan2.2-vace-plus',
        styleId: 'none',
        mediaType: 'video',
      },
      results: [
        createGeneratedVideoResult({
          uuid: 'imported-video-result-uuid-1',
          resource: {
            id: null,
            uuid: 'imported-video-resource-uuid-1',
            url: 'https://example.com/imported-video-1.mp4',
          },
        }),
      ],
    });

    const updatedImportedTask = createVideoTask({
      id: 'imported-video-db-id-2',
      uuid: 'imported-video-task-uuid-1',
      status: 'completed',
      taskType: 'generation',
      config: {
        mode: 'text',
        prompt: 'updated imported video',
        aspectRatio: '9:16',
        resolution: '1080p',
        duration: '10s',
        fps: 24,
        model: 'wan2.2-vace-plus',
        styleId: 'none',
        mediaType: 'video',
      },
      results: [
        createGeneratedVideoResult({
          uuid: 'imported-video-result-uuid-2',
          resource: {
            id: null,
            uuid: 'imported-video-resource-uuid-2',
            url: 'https://example.com/imported-video-2.mp4',
          },
        }),
      ],
    });

    await act(async () => {
      await getStore().importTask(firstImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-video-db-id-1',
      uuid: 'imported-video-task-uuid-1',
      config: expect.objectContaining({
        prompt: 'first imported video',
      }),
    });

    await act(async () => {
      await getStore().importTask(updatedImportedTask);
    });

    expect(mocks.save).toHaveBeenCalledWith(firstImportedTask);
    expect(mocks.save).toHaveBeenCalledWith(updatedImportedTask);
    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      uuid: 'imported-video-task-uuid-1',
      config: expect.objectContaining({
        prompt: 'updated imported video',
        duration: '10s',
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-video-result-uuid-2',
        }),
      ],
    });
  });
});
