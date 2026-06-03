import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  createGenerationMusic,
  generateSimilar,
  remixMusic,
  extendMusic,
  getTaskStatusMusic,
  getAppSdkClientWithSession,
  resolveAssetUrlByAssetIdFirst,
} = vi.hoisted(() => ({
  createGenerationMusic: vi.fn(async () => ({
    data: {
      taskId: 'music-task-1',
      model: 'suno-v3',
      channel: 'app-music',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'https://example.com/generated-music.mp3',
        resources: [
          {
            url: 'https://example.com/generated-music.mp3',
            mimeType: 'audio/mpeg',
            name: 'generated-music.mp3',
            type: 'MUSIC',
            music: {
              duration: 120,
            },
            metadata: {
              posterUrl: 'https://example.com/generated-music-cover.png',
            },
          },
        ],
        durationMs: 120000,
      },
    },
  })),
  generateSimilar: vi.fn(async () => ({
    data: {
      taskId: 'music-similar-task-1',
      model: 'suno-v3.5',
      channel: 'app-music',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'https://example.com/generated-similar-music.mp3',
        resources: [
          {
            url: 'https://example.com/generated-similar-music.mp3',
            mimeType: 'audio/mpeg',
            name: 'generated-similar-music.mp3',
            type: 'MUSIC',
            music: {
              duration: 60,
            },
          },
        ],
        durationMs: 60000,
      },
    },
  })),
  remixMusic: vi.fn(async () => ({
    data: {
      taskId: 'music-remix-task-1',
      model: 'suno-v3.5',
      channel: 'app-music',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'https://example.com/generated-remix-music.mp3',
        resources: [
          {
            url: 'https://example.com/generated-remix-music.mp3',
            mimeType: 'audio/mpeg',
            name: 'generated-remix-music.mp3',
            type: 'MUSIC',
            music: {
              duration: 90,
            },
          },
        ],
        durationMs: 90000,
      },
    },
  })),
  extendMusic: vi.fn(async () => ({
    data: {
      taskId: 'music-extend-task-1',
      model: 'udio-v1',
      channel: 'app-music',
      status: 'PROCESSING',
      progress: 30,
    },
  })),
  getTaskStatusMusic: vi.fn(async () => ({
    data: {
      taskId: 'music-task-2',
      model: 'udio-v1',
      channel: 'app-music',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'https://example.com/polled-music.mp3',
        resources: [
          {
            url: 'https://example.com/polled-music.mp3',
            mimeType: 'audio/mpeg',
            name: 'polled-music.mp3',
            type: 'MUSIC',
            music: {
              duration: 90,
            },
          },
        ],
        durationMs: 90000,
      },
    },
  })),
  getAppSdkClientWithSession: vi.fn(() => ({
    generation: {
      createGenerationMusic,
      generateSimilar,
      remixMusic,
      extendMusic,
      getTaskStatusMusic,
    },
  })),
  resolveAssetUrlByAssetIdFirst: vi.fn(async (): Promise<string | null> => null),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  getAppSdkClientWithSession,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst,
}));

import { musicService } from './musicService';

describe('musicService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes music generation through client.generation.createGenerationMusic', async () => {
    const outcome = await musicService.generateMusic({
      customMode: true,
      prompt: 'uplifting synthwave anthem',
      lyrics: 'neon lights keep calling us home',
      style: 'electronic',
      title: 'Night Drive',
      instrumental: false,
      model: 'suno-v3',
      duration: 120,
      mediaType: 'music',
    });

    expect(getAppSdkClientWithSession).toHaveBeenCalledTimes(1);
    expect(createGenerationMusic).toHaveBeenCalledWith({
      title: 'Night Drive',
      prompt: 'uplifting synthwave anthem',
      model: 'suno-v3',
      lyrics: 'neon lights keep calling us home',
      style: 'electronic',
      duration: 120,
      format: 'mp3',
      async: true,
      type: 'MUSIC',
      bizScene: 'music-studio',
      referenceAssetCount: 0,
      extraParams: {
        musicStudio: {
          customMode: true,
          instrumental: false,
        },
      },
    });
    expect(outcome.recipe.product).toBe('music');
    expect(outcome.recipe.mode).toBe('text-to-music');
    expect(outcome.recipe.prompt).toBe('uplifting synthwave anthem');
    expect(outcome.recipe.instructions).toBe('neon lights keep calling us home');
    expect(outcome.recipe.parameters).toMatchObject({
      title: 'Night Drive',
      style: 'electronic',
      instrumental: false,
      duration: 120,
      customMode: true,
      lyricsProvided: true,
      requestedModel: 'suno-v3',
    });
    expect(outcome.execution.provider).toBe('app-music');
    expect(outcome.execution.providerModel).toBe('suno-v3');
    expect(outcome.execution.remoteJobId).toBe('music-task-1');
    expect(outcome.delivery.url).toBe('https://example.com/generated-music.mp3');
    expect(outcome.delivery.posterUrl).toBe('https://example.com/generated-music-cover.png');
    expect(outcome.delivery.duration).toBe(120);
  });

  it('polls client.generation.getTaskStatusMusic when createGenerationMusic returns async-only task data', async () => {
    createGenerationMusic.mockResolvedValueOnce({
      data: {
        taskId: 'music-task-2',
        model: 'udio-v1',
        channel: 'app-music',
        status: 'PROCESSING',
        progress: 20,
      },
    } as never);

    const outcome = await musicService.generateMusic({
      customMode: false,
      prompt: 'lofi piano for a rainy late night',
      lyrics: '',
      style: 'ambient',
      title: '',
      instrumental: true,
      model: 'udio-v1',
      duration: 90,
      mediaType: 'music',
    });

    expect(getTaskStatusMusic).toHaveBeenCalledWith('music-task-2');
    expect(outcome.delivery.url).toBe('https://example.com/polled-music.mp3');
    expect(outcome.execution.remoteJobId).toBe('music-task-2');
    expect(outcome.execution.providerModel).toBe('udio-v1');
    expect(outcome.recipe.parameters).toMatchObject({
      instrumental: true,
      lyricsProvided: false,
      duration: 90,
    });
  });

  it('preserves the generation api method binding when polling music task status', async () => {
    const boundGetTaskStatusMusic = vi.fn(function (this: unknown, taskId: string | number) {
      expect(taskId).toBe('music-task-3');
      expect(this).toBe(generationApi);
      return Promise.resolve({
        data: {
          taskId: 'music-task-3',
          model: 'udio-v1',
          channel: 'app-music',
          status: 'SUCCESS',
          progress: 100,
          outputResult: {
            primaryUrl: 'https://example.com/bound-music.mp3',
            resources: [
              {
                url: 'https://example.com/bound-music.mp3',
                mimeType: 'audio/mpeg',
                name: 'bound-music.mp3',
                type: 'MUSIC',
                music: {
                  duration: 75,
                },
              },
            ],
            durationMs: 75000,
          },
        },
      });
    });
    const generationApi = {
      createGenerationMusic: vi.fn(async () => ({
        data: {
          taskId: 'music-task-3',
          model: 'udio-v1',
          channel: 'app-music',
          status: 'PROCESSING',
          progress: 10,
        },
      })),
      getTaskStatusMusic: boundGetTaskStatusMusic,
    };

    getAppSdkClientWithSession.mockReturnValueOnce({
      generation: generationApi,
    } as any);

    const outcome = await musicService.generateMusic({
      customMode: false,
      prompt: 'bound music polling',
      lyrics: '',
      style: 'ambient',
      title: '',
      instrumental: true,
      model: 'udio-v1',
      duration: 75,
      mediaType: 'music',
    });

    expect(boundGetTaskStatusMusic).toHaveBeenCalledWith('music-task-3');
    expect(outcome.delivery.url).toBe('https://example.com/bound-music.mp3');
  });

  it('throws the business failure message when client.generation.createGenerationMusic returns a failure code', async () => {
    createGenerationMusic.mockResolvedValueOnce({
      code: '5000',
      msg: 'music create failed',
    } as any);

    await expect(
      musicService.generateMusic({
        customMode: false,
        prompt: 'broken request',
        lyrics: '',
        style: 'ambient',
        title: '',
        instrumental: true,
        model: 'udio-v1',
        duration: 90,
        mediaType: 'music',
      })
    ).rejects.toThrow('music create failed');
  });

  it('throws the business failure message when client.generation.getTaskStatusMusic returns a failure code', async () => {
    createGenerationMusic.mockResolvedValueOnce({
      data: {
        taskId: 'music-task-4',
        model: 'udio-v1',
        channel: 'app-music',
        status: 'PROCESSING',
        progress: 25,
      },
    } as any);
    getTaskStatusMusic.mockResolvedValueOnce({
      code: '5000',
      msg: 'music poll failed',
    } as any);

    await expect(
      musicService.generateMusic({
        customMode: false,
        prompt: 'broken polling',
        lyrics: '',
        style: 'ambient',
        title: '',
        instrumental: true,
        model: 'udio-v1',
        duration: 90,
        mediaType: 'music',
      })
    ).rejects.toThrow('music poll failed');
  });

  it('routes similar music generation through client.generation.generateSimilar', async () => {
    const source = {
      id: 'music-source-1',
      uuid: 'music-source-1',
      title: 'Original Theme',
      duration: 48,
      resource: {
        id: 'music-source-resource-1',
        uuid: 'music-source-resource-1',
        type: 'music',
        url: 'https://example.com/source-music.mp3',
        name: 'source-music.mp3',
        mimeType: 'audio/mpeg',
        duration: 48,
      },
    } as any;

    const outcome = await musicService.generateSimilar({
      source,
      duration: 60,
      model: 'suno-v3.5',
      idempotencyKey: 'music-similar-1',
    });

    expect(generateSimilar).toHaveBeenCalledWith({
      referenceUrl: 'https://example.com/source-music.mp3',
      duration: 60,
      model: 'suno-v3.5',
      idempotencyKey: 'music-similar-1',
    });
    expect(outcome.recipe.mode).toBe('variation');
    expect(outcome.recipe.inputRefs).toHaveLength(1);
    expect(outcome.recipe.inputRefs[0]).toMatchObject({
      type: 'music',
      role: 'reference',
      url: 'https://example.com/source-music.mp3',
      name: 'source-music.mp3',
      mimeType: 'audio/mpeg',
    });
    expect(outcome.recipe.parameters).toMatchObject({
      operation: 'similar',
      requestedModel: 'suno-v3.5',
      sourceMusicUrl: 'https://example.com/source-music.mp3',
    });
    expect(outcome.delivery.url).toBe('https://example.com/generated-similar-music.mp3');
  });

  it('resolves canonical source music references before calling generateSimilar', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce('https://cdn.example.com/source-music.mp3');

    const source = {
      id: 'music-source-1b',
      uuid: 'music-source-1b',
      title: 'Workspace Theme',
      duration: 48,
      resource: {
        id: 'music-source-resource-1b',
        uuid: 'music-source-resource-1b',
        assetId: 'music-asset-1b',
        type: 'music',
        path: 'assets://workspace/music/source-track.mp3',
        url: 'assets://workspace/music/source-track.mp3',
        name: 'source-track.mp3',
        mimeType: 'audio/mpeg',
        duration: 48,
      },
    } as any;

    const outcome = await musicService.generateSimilar({
      source,
      duration: 60,
      model: 'suno-v3.5',
      idempotencyKey: 'music-similar-asset-1',
    });

    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith({
      assetId: 'music-asset-1b',
    });
    expect(generateSimilar).toHaveBeenCalledWith({
      referenceUrl: 'https://cdn.example.com/source-music.mp3',
      duration: 60,
      model: 'suno-v3.5',
      idempotencyKey: 'music-similar-asset-1',
    });
    expect(outcome.recipe.inputRefs).toHaveLength(1);
    expect(outcome.recipe.inputRefs[0].path).toBe('assets://workspace/music/source-track.mp3');
    expect(outcome.recipe.inputRefs[0].url).toBeUndefined();
    expect(outcome.recipe.inputRefs[0].resource?.path).toBe('assets://workspace/music/source-track.mp3');
    expect(outcome.recipe.inputRefs[0].resource?.url).toBeUndefined();
  });

  it('rejects similar generation when the source music only has a canonical locator and no renderable url can be resolved', async () => {
    const source = {
      id: 'music-source-1c',
      uuid: 'music-source-1c',
      title: 'Locator Only Theme',
      duration: 48,
      resource: {
        id: 'music-source-resource-1c',
        uuid: 'music-source-resource-1c',
        type: 'music',
        path: 'assets://workspace/music/locator-only-track.mp3',
        url: 'assets://workspace/music/locator-only-track.mp3',
        name: 'locator-only-track.mp3',
        mimeType: 'audio/mpeg',
        duration: 48,
      },
    } as any;

    await expect(
      musicService.generateSimilar({
        source,
        duration: 60,
        model: 'suno-v3.5',
      })
    ).rejects.toThrow('Music operation requires a resolvable source music url');

    expect(generateSimilar).not.toHaveBeenCalled();
  });

  it('routes music remix through client.generation.remixMusic', async () => {
    const source = {
      id: 'music-source-2',
      uuid: 'music-source-2',
      title: 'Original Theme',
      duration: 90,
      resource: {
        id: 'music-source-resource-2',
        uuid: 'music-source-resource-2',
        type: 'music',
        url: 'https://example.com/remix-source-music.mp3',
        name: 'remix-source-music.mp3',
        mimeType: 'audio/mpeg',
        duration: 90,
      },
    } as any;

    const outcome = await musicService.remixMusic({
      source,
      style: 'jazz-funk',
      model: 'suno-v3.5',
      idempotencyKey: 'music-remix-1',
    });

    expect(remixMusic).toHaveBeenCalledWith({
      musicUrl: 'https://example.com/remix-source-music.mp3',
      style: 'jazz-funk',
      model: 'suno-v3.5',
      idempotencyKey: 'music-remix-1',
    });
    expect(outcome.recipe.mode).toBe('restyle');
    expect(outcome.recipe.parameters).toMatchObject({
      operation: 'remix',
      style: 'jazz-funk',
      sourceMusicUrl: 'https://example.com/remix-source-music.mp3',
    });
    expect(outcome.delivery.url).toBe('https://example.com/generated-remix-music.mp3');
  });

  it('polls client.generation.getTaskStatusMusic when extendMusic returns async-only task data', async () => {
    getTaskStatusMusic.mockResolvedValueOnce({
      data: {
        taskId: 'music-extend-task-1',
        model: 'udio-v1',
        channel: 'app-music',
        status: 'SUCCESS',
        progress: 100,
        outputResult: {
          primaryUrl: 'https://example.com/generated-extended-music.mp3',
          resources: [
            {
              url: 'https://example.com/generated-extended-music.mp3',
              mimeType: 'audio/mpeg',
              name: 'generated-extended-music.mp3',
              type: 'MUSIC',
              music: {
                duration: 135,
              },
            },
          ],
          durationMs: 135000,
        },
      },
    } as any);

    const source = {
      id: 'music-source-3',
      uuid: 'music-source-3',
      title: 'Original Theme',
      duration: 90,
      resource: {
        id: 'music-source-resource-3',
        uuid: 'music-source-resource-3',
        type: 'music',
        url: 'https://example.com/extend-source-music.mp3',
        name: 'extend-source-music.mp3',
        mimeType: 'audio/mpeg',
        duration: 90,
      },
    } as any;

    const outcome = await musicService.extendMusic({
      source,
      extendDuration: 45,
      style: 'cinematic',
      model: 'udio-v1',
      idempotencyKey: 'music-extend-1',
    });

    expect(extendMusic).toHaveBeenCalledWith({
      musicUrl: 'https://example.com/extend-source-music.mp3',
      extendDuration: 45,
      style: 'cinematic',
      model: 'udio-v1',
      idempotencyKey: 'music-extend-1',
    });
    expect(getTaskStatusMusic).toHaveBeenCalledWith('music-extend-task-1');
    expect(outcome.recipe.mode).toBe('extend');
    expect(outcome.recipe.parameters).toMatchObject({
      operation: 'extend',
      extendDuration: 45,
      style: 'cinematic',
      sourceMusicUrl: 'https://example.com/extend-source-music.mp3',
    });
    expect(outcome.delivery.url).toBe('https://example.com/generated-extended-music.mp3');
  });

  it('throws the business failure message when client.generation.generateSimilar returns a failure code', async () => {
    generateSimilar.mockResolvedValueOnce({
      code: '5000',
      msg: 'music similar failed',
    } as any);

    await expect(
      musicService.generateSimilar({
        source: {
          id: 'music-source-4',
          uuid: 'music-source-4',
          title: 'Original Theme',
          duration: 48,
          resource: {
            id: 'music-source-resource-4',
            uuid: 'music-source-resource-4',
            type: 'music',
            url: 'https://example.com/failing-source-music.mp3',
            name: 'failing-source-music.mp3',
            mimeType: 'audio/mpeg',
            duration: 48,
          },
        } as any,
        duration: 60,
        model: 'suno-v3.5',
      })
    ).rejects.toThrow('music similar failed');
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./musicService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('ships a music service contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./musicService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
