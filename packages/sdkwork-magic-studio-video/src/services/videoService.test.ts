import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-server';
import {
  resolveGenerationExecutionOutcome,
} from '@sdkwork/magic-studio-core/ai';
import { createVideoInputResourceRef } from '../entities';

const {
  serverClient,
  assertRuntimeMagicStudioExecutionOperationReady,
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
  resolveAssetUrlByAssetIdFirst,
} = vi.hoisted(() => {
  const serverClient = {
    createVideoGenerationTask: vi.fn(),
    createImageToVideoTask: vi.fn(),
    createVideoStyleTransferTask: vi.fn(),
    createVideoExtendTask: vi.fn(),
    createVideoLipSyncTask: vi.fn(),
    enhanceVideoGenerationPrompt: vi.fn(),
    readVideoGenerationTask: vi.fn(),
    cancelVideoGenerationTask: vi.fn(),
  };

  return {
    serverClient,
    assertRuntimeMagicStudioExecutionOperationReady: vi.fn(async () => undefined),
    createRuntimeMagicStudioServerClient: vi.fn(() => serverClient),
    readDefaultPlatformRuntime: vi.fn(() => ({ kind: 'test-runtime' })),
    resolveAssetUrlByAssetIdFirst: vi.fn(async (): Promise<string | null> => null),
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  assertRuntimeMagicStudioExecutionOperationReady,
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst,
}));

import { videoService } from './videoService';

const createVideoArtifact = (
  overrides: Partial<MagicStudioGenerationArtifact> = {},
): MagicStudioGenerationArtifact => ({
  id: 'artifact-1',
  uuid: 'artifact-uuid-1',
  type: 'video',
  role: 'primary',
  url: 'https://example.com/generated-video.mp4',
  posterUrl: 'https://example.com/generated-video.jpg',
  mimeType: 'video/mp4',
  name: 'generated-video.mp4',
  width: 1280,
  height: 720,
  duration: 5,
  metadata: {
    source: 'test',
  },
  ...overrides,
});

const createVideoTask = (
  overrides: Partial<MagicStudioGenerationTask> = {},
): MagicStudioGenerationTask => {
  const primaryArtifact =
    overrides.primaryArtifact === undefined
      ? createVideoArtifact()
      : overrides.primaryArtifact;

  return {
    id: 'task-1',
    uuid: 'task-uuid-1',
    taskId: 'video-task-1',
    product: 'video',
    mode: 'text-to-video',
    status: 'succeeded',
    prompt: 'cinematic timelapse over city lights',
    negativePrompt: 'blur',
    provider: 'runtime-video',
    providerModel: 'mock-video-model',
    remoteJobId: 'video-task-1',
    progress: 100,
    inputRefs: [],
    artifacts: primaryArtifact ? [primaryArtifact] : [],
    primaryArtifact,
    parameters: {
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
    },
    providerPayload: {
      source: 'test-runtime',
    },
    createdAt: '2026-04-25T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:01.000Z',
    completedAt: '2026-04-25T00:00:01.000Z',
    ...overrides,
  };
};

const resetServerClient = (): void => {
  vi.clearAllMocks();

  createRuntimeMagicStudioServerClient.mockReturnValue(serverClient);
  readDefaultPlatformRuntime.mockReturnValue({ kind: 'test-runtime' });
  assertRuntimeMagicStudioExecutionOperationReady.mockResolvedValue(undefined);
  resolveAssetUrlByAssetIdFirst.mockResolvedValue(null);

  serverClient.createVideoGenerationTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'video-task-1',
      remoteJobId: 'video-task-1',
      primaryArtifact: createVideoArtifact({
        url: 'https://example.com/generated-video.mp4',
        name: 'generated-video.mp4',
      }),
    }),
  });
  serverClient.createImageToVideoTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'video-image-task-1',
      remoteJobId: 'video-image-task-1',
      mode: 'image-to-video',
      primaryArtifact: createVideoArtifact({
        url: 'https://example.com/generated-image-video.mp4',
        name: 'generated-image-video.mp4',
        width: 1920,
        height: 1080,
      }),
    }),
  });
  serverClient.createVideoStyleTransferTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'video-style-task-1',
      remoteJobId: 'video-style-task-1',
      mode: 'style-transfer',
      providerModel: 'mock-style-model',
      primaryArtifact: createVideoArtifact({
        url: 'https://example.com/styled-video.mp4',
        name: 'styled-video.mp4',
        width: 1920,
        height: 1080,
      }),
    }),
  });
  serverClient.createVideoExtendTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'video-extend-task-1',
      remoteJobId: 'video-extend-task-1',
      mode: 'extend',
      providerModel: 'mock-extend-model',
      primaryArtifact: createVideoArtifact({
        url: 'https://example.com/extended-video.mp4',
        name: 'extended-video.mp4',
        duration: 10,
      }),
    }),
  });
  serverClient.createVideoLipSyncTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'lip-task-1',
      remoteJobId: 'lip-task-1',
      mode: 'lip-sync',
      status: 'queued',
      providerModel: 'mock-lipsync-model',
      progress: 10,
      artifacts: [],
      primaryArtifact: null,
      completedAt: null,
    }),
  });
  serverClient.enhanceVideoGenerationPrompt.mockResolvedValue({
    data: {
      prompt: 'enhanced cinematic prompt',
    },
  });
  serverClient.readVideoGenerationTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'video-task-2',
      remoteJobId: 'video-task-2',
      primaryArtifact: createVideoArtifact({
        url: 'https://example.com/polled-video.mp4',
        name: 'polled-video.mp4',
      }),
    }),
  });
  serverClient.cancelVideoGenerationTask.mockResolvedValue({
    data: createVideoTask({
      taskId: 'lip-task-1',
      remoteJobId: 'lip-task-1',
      mode: 'lip-sync',
      status: 'cancelled',
      progress: 30,
      artifacts: [],
      primaryArtifact: null,
      errorCode: 'LIPSYNC_CANCELED',
      errorMessage: 'Lip Sync task canceled by user.',
      completedAt: null,
      cancelledAt: '2026-04-25T00:00:02.000Z',
    }),
  });
};

describe('videoService', () => {
  beforeEach(() => {
    resetServerClient();
  });

  it('routes text video generation through the canonical runtime server client', async () => {
    const outcome = await videoService.generateVideo({
      generationType: 'text',
      assets: [],
      prompt: 'cinematic timelapse over city lights',
      negativePrompt: 'blur',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'mock-video-model',
      videoStyle: {
        id: 'cinematic',
        prompt: 'warm cinematic lighting',
      },
      options: {
        promptExtend: true,
      },
    });

    expect(readDefaultPlatformRuntime).toHaveBeenCalledWith('VideoService');
    expect(createRuntimeMagicStudioServerClient).toHaveBeenCalledWith({ kind: 'test-runtime' });
    expect(serverClient.createVideoGenerationTask).toHaveBeenCalledWith(expect.objectContaining({
      generationType: 'text',
      assets: [],
      prompt: 'cinematic timelapse over city lights',
      negativePrompt: 'blur',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'mock-video-model',
      videoStyle: {
        id: 'cinematic',
        prompt: 'warm cinematic lighting',
      },
      options: {
        promptExtend: true,
      },
    }));
    expect(serverClient.createImageToVideoTask).not.toHaveBeenCalled();
    expect(outcome.recipe.mode).toBe('text-to-video');
    expect(outcome.recipe.prompt).toBe('cinematic timelapse over city lights');
    expect(outcome.execution.provider).toBe('runtime-video');
    expect(outcome.execution.remoteJobId).toBe('video-task-1');
    expect(outcome.delivery.url).toBe('https://example.com/generated-video.mp4');
  });

  it('routes prompt enhancement through enhanceVideoGenerationPrompt', async () => {
    const enhanced = await videoService.enhancePrompt({
      prompt: 'make the motion more cinematic',
      style: 'warm cinematic lighting',
      language: 'en',
      maxWords: 140,
    });

    expect(serverClient.enhanceVideoGenerationPrompt).toHaveBeenCalledWith({
      prompt: 'make the motion more cinematic',
      scene: 'video-generation',
      style: 'warm cinematic lighting',
      language: 'en',
      maxWords: 140,
    });
    expect(enhanced).toBe('enhanced cinematic prompt');
  });

  it('fails closed when prompt enhancement returns an empty optimized prompt', async () => {
    serverClient.enhanceVideoGenerationPrompt.mockResolvedValueOnce({
      data: {
        prompt: '   ',
      },
    });

    await expect(
      videoService.enhancePrompt({
        prompt: 'make the motion more cinematic',
      }),
    ).rejects.toThrow('Video prompt enhancement returned an empty prompt');
  });

  it('routes image-based requests through createImageToVideoTask with canonical assets', async () => {
    const outcome = await videoService.generateVideo({
      generationType: 'smart_reference',
      assets: [
        {
          role: 'reference_1',
          type: 'image',
          value: 'https://example.com/reference-1.png',
        },
      ],
      prompt: 'animate the portrait with subtle motion',
      negativePrompt: 'flicker',
      duration: '5s',
      resolution: '1080p',
      aspectRatio: '16:9',
      model: 'mock-video-model',
      videoStyle: {
        id: 'portrait',
        prompt: 'soft portrait motion',
      },
      options: {
        cameraFixed: true,
      },
    });

    expect(serverClient.createImageToVideoTask).toHaveBeenCalledWith(expect.objectContaining({
      generationType: 'smart_reference',
      prompt: 'animate the portrait with subtle motion',
      assets: [
        expect.objectContaining({
          role: 'reference_1',
          type: 'image',
          value: 'https://example.com/reference-1.png',
        }),
      ],
    }));
    expect(serverClient.createVideoGenerationTask).not.toHaveBeenCalled();
    expect(outcome.recipe.mode).toBe('image-to-video');
    expect(outcome.delivery.url).toBe('https://example.com/generated-image-video.mp4');
  });

  it('preserves canonical input refs instead of converting them to legacy transport DTOs', async () => {
    const referenceRef = createVideoInputResourceRef({
      type: 'image',
      path: 'file://workspace/reference-standalone.png',
      url: 'https://example.com/reference-standalone.png',
      name: 'Standalone Reference',
      mimeType: 'image/png',
    });

    await videoService.generateVideo({
      generationType: 'smart_reference',
      assets: [
        {
          role: 'reference_1',
          type: 'image',
          value: 'file://workspace/reference-standalone.png',
          ref: {
            ...referenceRef,
            role: 'reference',
          } as any,
        },
      ],
      prompt: 'animate the standalone reference',
      negativePrompt: '',
      duration: '5s',
      resolution: '1080p',
      aspectRatio: '16:9',
      model: 'mock-video-model',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
    });

    expect(resolveAssetUrlByAssetIdFirst).not.toHaveBeenCalled();
    const requestBody = serverClient.createImageToVideoTask.mock.calls[0]?.[0];
    expect(requestBody.assets[0]).toMatchObject({
      role: 'reference_1',
      type: 'image',
      value: 'file://workspace/reference-standalone.png',
      ref: expect.objectContaining({
        url: 'https://example.com/reference-standalone.png',
        path: 'file://workspace/reference-standalone.png',
        name: 'Standalone Reference',
        mimeType: 'image/png',
      }),
    });
    expect(requestBody.assets[0]).not.toHaveProperty('referenceAssets');
  });

  it('keeps smart multi requests with reference videos classified as image-to-video while using the generic video endpoint', async () => {
    const outcome = await videoService.generateVideo({
      generationType: 'smart_multi',
      assets: [
        {
          role: 'keyframe_1',
          type: 'image',
          value: 'https://example.com/keyframe-1.png',
        },
        {
          role: 'reference_video_1',
          type: 'video',
          value: 'https://example.com/reference-video-1.mp4',
        },
      ],
      prompt: 'blend the keyframe with the reference motion',
      negativePrompt: '',
      duration: '5s',
      resolution: '1080p',
      aspectRatio: '16:9',
      model: 'mock-video-model',
      videoStyle: {
        id: 'cinematic',
        prompt: 'cinematic motion blend',
      },
    });

    expect(serverClient.createVideoGenerationTask).toHaveBeenCalledWith(expect.objectContaining({
      generationType: 'smart_multi',
    }));
    expect(serverClient.createImageToVideoTask).not.toHaveBeenCalled();
    expect(outcome.recipe.mode).toBe('image-to-video');
  });

  it('routes style-transfer requests through createVideoStyleTransferTask', async () => {
    const outcome = await videoService.generateVideo({
      generationType: 'style-transfer',
      assets: [
        {
          role: 'source_video',
          type: 'video',
          value: 'https://example.com/source-video.mp4',
        },
      ],
      prompt: 'anime cel shading',
      negativePrompt: '',
      duration: '5s',
      resolution: '1080p',
      aspectRatio: '16:9',
      model: 'mock-style-model',
      videoStyle: {
        id: 'anime',
        prompt: 'anime cel shading',
      },
      options: {
        promptExtend: true,
      },
    });

    expect(serverClient.createVideoStyleTransferTask).toHaveBeenCalledWith(expect.objectContaining({
      generationType: 'style-transfer',
      prompt: 'anime cel shading',
      assets: [
        expect.objectContaining({
          role: 'source_video',
          type: 'video',
          value: 'https://example.com/source-video.mp4',
        }),
      ],
    }));
    expect(serverClient.createVideoGenerationTask).not.toHaveBeenCalled();
    expect(serverClient.createImageToVideoTask).not.toHaveBeenCalled();
    expect(outcome.recipe.mode).toBe('style-transfer');
    expect(outcome.delivery.url).toBe('https://example.com/styled-video.mp4');
  });

  it('routes extend requests through createVideoExtendTask', async () => {
    const outcome = await videoService.generateVideo({
      generationType: 'extend',
      assets: [
        {
          role: 'source_video',
          type: 'video',
          value: 'https://example.com/source-extend-video.mp4',
        },
      ],
      prompt: '',
      negativePrompt: '',
      duration: '10s',
      resolution: '1080p',
      aspectRatio: '16:9',
      model: 'mock-extend-model',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
    });

    expect(serverClient.createVideoExtendTask).toHaveBeenCalledWith(expect.objectContaining({
      generationType: 'extend',
      duration: '10s',
      assets: [
        expect.objectContaining({
          role: 'source_video',
          type: 'video',
          value: 'https://example.com/source-extend-video.mp4',
        }),
      ],
    }));
    expect(serverClient.createVideoGenerationTask).not.toHaveBeenCalled();
    expect(serverClient.createImageToVideoTask).not.toHaveBeenCalled();
    expect(serverClient.createVideoStyleTransferTask).not.toHaveBeenCalled();
    expect(outcome.recipe.mode).toBe('extend');
    expect(outcome.delivery.url).toBe('https://example.com/extended-video.mp4');
  });

  it('throws the business failure message when the runtime server returns a failure code', async () => {
    serverClient.createVideoStyleTransferTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'video style transfer failed',
    });

    await expect(
      videoService.generateVideo({
        generationType: 'style-transfer',
        assets: [
          {
            role: 'source_video',
            type: 'video',
            value: 'https://example.com/source-video.mp4',
          },
        ],
        prompt: 'anime cel shading',
        negativePrompt: '',
        duration: '5s',
        resolution: '1080p',
        aspectRatio: '16:9',
        model: 'mock-style-model',
        videoStyle: {
          id: 'anime',
          prompt: 'anime cel shading',
        },
      }),
    ).rejects.toThrow('video style transfer failed');
  });

  it('polls readVideoGenerationTask when the runtime server create call is async-only', async () => {
    serverClient.createVideoGenerationTask.mockResolvedValueOnce({
      data: createVideoTask({
        taskId: 'video-task-2',
        remoteJobId: 'video-task-2',
        status: 'processing',
        progress: 20,
        artifacts: [],
        primaryArtifact: null,
        completedAt: null,
      }),
    });

    const outcome = await videoService.generateVideo({
      generationType: 'text',
      assets: [],
      prompt: 'misty skyline reveal',
      negativePrompt: '',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'mock-video-model',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
    });

    expect(serverClient.readVideoGenerationTask).toHaveBeenCalledWith('video-task-2');
    expect(outcome.delivery.url).toBe('https://example.com/polled-video.mp4');
    expect(outcome.execution.remoteJobId).toBe('video-task-2');
    expect(outcome.execution.providerModel).toBe('mock-video-model');
  });

  it('throws the business failure message when readVideoGenerationTask fails during polling', async () => {
    serverClient.createVideoGenerationTask.mockResolvedValueOnce({
      data: createVideoTask({
        taskId: 'video-task-4',
        remoteJobId: 'video-task-4',
        status: 'processing',
        progress: 20,
        artifacts: [],
        primaryArtifact: null,
        completedAt: null,
      }),
    });
    serverClient.readVideoGenerationTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'video poll failed',
    });

    await expect(
      videoService.generateVideo({
        generationType: 'text',
        assets: [],
        prompt: 'broken video polling',
        negativePrompt: '',
        duration: '5s',
        resolution: '720p',
        aspectRatio: '16:9',
        model: 'mock-video-model',
        videoStyle: {
          id: 'none',
          prompt: '',
        },
      }),
    ).rejects.toThrow('video poll failed');
  });

  it('routes lip-sync creation through createVideoLipSyncTask', async () => {
    const execution = await videoService.createLipSyncTask({
      generationType: 'lip-sync',
      assets: [
        { role: 'source_video', type: 'video', value: 'https://example.com/source.mp4' },
        { role: 'driver_audio', type: 'audio', value: 'https://example.com/driver.wav' },
      ],
      prompt: '',
      negativePrompt: '',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'mock-lipsync-model',
      videoStyle: {
        id: 'dialogue',
        prompt: 'natural interview lighting',
      },
      options: {
        lipSyncSourceType: 'video',
        lipSyncDriverType: 'audio',
      },
    });

    expect(serverClient.createVideoLipSyncTask).toHaveBeenCalledWith(expect.objectContaining({
      generationType: 'lip-sync',
      resolution: '720p',
      videoStyle: {
        id: 'dialogue',
        prompt: 'natural interview lighting',
      },
      assets: [
        expect.objectContaining({
          role: 'source_video',
          type: 'video',
          value: 'https://example.com/source.mp4',
        }),
        expect.objectContaining({
          role: 'driver_audio',
          type: 'audio',
          value: 'https://example.com/driver.wav',
        }),
      ],
      options: expect.objectContaining({
        lipSyncSourceType: 'video',
        lipSyncDriverType: 'audio',
      }),
    }));
    expect(execution.recipe.mode).toBe('lip-sync');
    expect(execution.status).toBe('queued');
    expect(execution.remoteJobId).toBe('lip-task-1');
    expect(execution.provider).toBe('runtime-video');
  });

  it('throws the business failure message when createVideoLipSyncTask fails', async () => {
    serverClient.createVideoLipSyncTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'lip sync create failed',
    });

    await expect(
      videoService.createLipSyncTask({
        generationType: 'lip-sync',
        assets: [
          { role: 'source_video', type: 'video', value: 'https://example.com/source.mp4' },
          { role: 'driver_audio', type: 'audio', value: 'https://example.com/driver.wav' },
        ],
        prompt: '',
        negativePrompt: '',
        duration: '5s',
        resolution: '720p',
        aspectRatio: '16:9',
        model: 'mock-lipsync-model',
        videoStyle: {
          id: 'none',
          prompt: '',
        },
        options: {
          lipSyncSourceType: 'video',
          lipSyncDriverType: 'audio',
        },
      }),
    ).rejects.toThrow('lip sync create failed');
  });

  it('queries lip-sync tasks through readVideoGenerationTask and resolves an outcome', async () => {
    await videoService.createLipSyncTask({
      generationType: 'lip-sync',
      assets: [
        { role: 'source_video', type: 'video', value: 'https://example.com/source.mp4' },
        { role: 'driver_audio', type: 'audio', value: 'https://example.com/driver.wav' },
      ],
      prompt: '',
      negativePrompt: '',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'mock-lipsync-model',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
      options: {
        lipSyncSourceType: 'video',
        lipSyncDriverType: 'audio',
      },
    });

    serverClient.readVideoGenerationTask.mockResolvedValueOnce({
      data: createVideoTask({
        taskId: 'lip-task-1',
        remoteJobId: 'lip-task-1',
        mode: 'lip-sync',
        status: 'succeeded',
        providerModel: 'mock-lipsync-model',
        primaryArtifact: createVideoArtifact({
          url: 'https://example.com/lipsync-video.mp4',
          name: 'lipsync-video.mp4',
        }),
      }),
    });

    const execution = await videoService.queryLipSyncTask('lip-task-1');
    const outcome = resolveGenerationExecutionOutcome(execution);

    expect(serverClient.readVideoGenerationTask).toHaveBeenCalledWith('lip-task-1');
    expect(execution.status).toBe('succeeded');
    expect(outcome?.recipe.mode).toBe('lip-sync');
    expect(outcome?.delivery.url).toBe('https://example.com/lipsync-video.mp4');
  });

  it('throws the business failure message when readVideoGenerationTask fails for lip-sync query', async () => {
    serverClient.readVideoGenerationTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'lip sync query failed',
    });

    await expect(videoService.queryLipSyncTask('lip-task-query-error')).rejects.toThrow(
      'lip sync query failed',
    );
  });

  it('cancels lip-sync tasks through cancelVideoGenerationTask', async () => {
    await videoService.createLipSyncTask({
      generationType: 'lip-sync',
      assets: [
        { role: 'source_video', type: 'video', value: 'https://example.com/source.mp4' },
        { role: 'driver_audio', type: 'audio', value: 'https://example.com/driver.wav' },
      ],
      prompt: '',
      negativePrompt: '',
      duration: '5s',
      resolution: '720p',
      aspectRatio: '16:9',
      model: 'mock-lipsync-model',
      videoStyle: {
        id: 'none',
        prompt: '',
      },
      options: {
        lipSyncSourceType: 'video',
        lipSyncDriverType: 'audio',
      },
    });

    const execution = await videoService.cancelLipSyncTask('lip-task-1');

    expect(serverClient.cancelVideoGenerationTask).toHaveBeenCalledWith('lip-task-1');
    expect(serverClient.readVideoGenerationTask).not.toHaveBeenCalled();
    expect(execution.status).toBe('cancelled');
    expect(execution.error).toBe('Lip Sync task canceled by user.');
  });

  it('throws the business failure message when cancelVideoGenerationTask fails', async () => {
    serverClient.cancelVideoGenerationTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'lip sync cancel failed',
    });

    await expect(videoService.cancelLipSyncTask('lip-task-cancel-error')).rejects.toThrow(
      'lip sync cancel failed',
    );
  });

  it('throws the business failure message when enhanceVideoGenerationPrompt fails', async () => {
    serverClient.enhanceVideoGenerationPrompt.mockResolvedValueOnce({
      code: '5000',
      msg: 'video prompt enhance failed',
    });

    await expect(
      videoService.enhancePrompt({
        prompt: 'broken video prompt',
      }),
    ).rejects.toThrow('video prompt enhance failed');
  });

  it('resolves canonical asset references before decoding media sources', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce('data:video/mp4;base64,AAAA');

    await expect(videoService.resolveMediaSource('asset-video-1')).resolves.toEqual({
      data: 'AAAA',
      mimeType: 'video/mp4',
    });
    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith('asset-video-1');
  });

  it('does not import or call legacy app SDK generation boundaries', async () => {
    const source = await readFile(
      new URL('./videoService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('getAppSdkClientWithSession')).toBe(false);
    expect(source.includes('@sdkwork/app-sdk')).toBe(false);
    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(source.includes('App SDK generation')).toBe(false);
  });

  it('ships a video service contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./videoService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
