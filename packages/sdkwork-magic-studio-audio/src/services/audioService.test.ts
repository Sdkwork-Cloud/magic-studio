import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import { createAudioInputResourceRef } from '../entities';

const {
  textToSpeech,
  audioTranscription,
  audioTranslation,
  getTaskStatusAudio,
  getTranscriptionResult,
  getAppSdkClientWithSession,
  resolveAssetUrlByAssetIdFirst,
} = vi.hoisted(() => ({
  textToSpeech: vi.fn(async () => ({
    data: {
      taskId: 'audio-task-1',
      model: 'gemini-tts',
      channel: 'app-audio',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'https://example.com/generated-audio.wav',
        resources: [
          {
            url: 'https://example.com/generated-audio.wav',
            mimeType: 'audio/wav',
            name: 'generated-audio.wav',
          },
        ],
      },
    },
  })),
  audioTranscription: vi.fn(async () => ({
    data: {
      taskId: 'audio-transcription-task-1',
      model: 'whisper-1',
      channel: 'app-audio',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'generated_audio_text_transcribe_1',
        metadata: {
          task: 'transcribe',
          text: 'Hello world transcription',
          language: 'en',
          duration: 12.5,
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
    },
  })),
  audioTranslation: vi.fn(async () => ({
    data: {
      taskId: 'audio-translation-task-1',
      model: 'whisper-1',
      channel: 'app-audio',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'generated_audio_text_translate_1',
        metadata: {
          task: 'translate',
          text: 'Hello world translated to Japanese',
          language: 'ja',
          duration: 12.5,
          segments: [
            {
              id: 0,
              start: 0,
              end: 1.2,
              text: 'Hello world translated to Japanese',
            },
          ],
        },
      },
    },
  })),
  getTaskStatusAudio: vi.fn(async () => ({
    data: {
      taskId: 'audio-task-2',
      model: 'gemini-tts',
      channel: 'app-audio',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'https://example.com/polled-audio.wav',
        resources: [
          {
            url: 'https://example.com/polled-audio.wav',
            mimeType: 'audio/wav',
            name: 'polled-audio.wav',
          },
        ],
      },
    },
  })),
  getTranscriptionResult: vi.fn(async () => ({
    data: {
      taskId: 'audio-transcription-task-2',
      model: 'whisper-1',
      channel: 'app-audio',
      status: 'SUCCESS',
      progress: 100,
      outputResult: {
        primaryUrl: 'generated_audio_text_transcribe_2',
        metadata: {
          task: 'transcribe',
          text: 'Polled transcription result',
          language: 'zh',
          duration: 8.2,
          segments: [
            {
              id: 0,
              start: 0,
              end: 1.1,
              text: 'Polled transcription result',
            },
          ],
        },
      },
    },
  })),
  getAppSdkClientWithSession: vi.fn(() => ({
    generation: {
      textToSpeech,
      audioTranscription,
      audioTranslation,
      getTaskStatusAudio,
      getTranscriptionResult,
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

import { audioService } from './audioService';

const createTestSourceAudio = (overrides: Record<string, unknown> = {}) =>
  createAudioInputResourceRef({
    id: 'audio-source-id-default',
    uuid: 'audio-source-uuid-default',
    assetId: 'audio-source-asset-default',
    assetUuid: 'audio-source-asset-uuid-default',
    primaryResourceId: 'audio-source-resource-id-default',
    primaryResourceUuid: 'audio-source-resource-uuid-default',
    resourceViewId: 'audio-source-resource-view-id-default',
    resourceViewUuid: 'audio-source-resource-view-uuid-default',
    type: 'audio',
    url: 'https://example.com/source-audio.wav',
    name: 'source-audio.wav',
    mimeType: 'audio/wav',
    ...overrides,
  });

describe('audioService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes audio generation through client.generation.textToSpeech', async () => {
    const outcome = await audioService.generateAudio({
      prompt: 'narrate a calm ocean sunset',
      negativePrompt: 'static, clipping',
      model: 'gemini-tts',
      voice: 'Kore',
      duration: 8,
      seed: 42,
    });

    expect(getAppSdkClientWithSession).toHaveBeenCalledTimes(1);
    expect(textToSpeech).toHaveBeenCalledWith({
      prompt: 'narrate a calm ocean sunset',
      negativePrompt: 'static, clipping',
      model: 'gemini-tts',
      seed: 42,
      text: 'narrate a calm ocean sunset',
      voice: 'Kore',
      format: 'wav',
      async: true,
      type: 'SPEECH',
      bizScene: 'audio-studio',
      extraParams: {
        audioStudio: {
          requestedDuration: 8,
        },
      },
    });
    expect(outcome.delivery.url).toBe('https://example.com/generated-audio.wav');
    expect(outcome.delivery.duration).toBe(8);
    expect(outcome.recipe.prompt).toBe('narrate a calm ocean sunset');
    expect(outcome.recipe.negativePrompt).toBe('static, clipping');
    expect(outcome.recipe.parameters).toMatchObject({
      voice: 'Kore',
      requestedModel: 'gemini-2.5-flash-tts',
      requestedDuration: 8,
      seed: 42,
    });
    expect(outcome.execution.provider).toBe('app-audio');
    expect(outcome.execution.providerPayload).toMatchObject({
      requestedModel: 'gemini-2.5-flash-tts',
      voice: 'Kore',
      requestedDuration: 8,
      seed: 42,
    });
    expect(outcome.artifactSet.primaryArtifactUuid).toBeTruthy();
    expect(outcome.primaryArtifact).toMatchObject({
      executionUuid: outcome.execution.uuid,
      recipeUuid: outcome.recipe.uuid,
    });
  });

  it('polls client.generation.getTaskStatusAudio when the create call is async-only', async () => {
    textToSpeech.mockResolvedValueOnce({
      data: {
        taskId: 'audio-task-2',
        model: 'gemini-tts',
        channel: 'app-audio',
        status: 'PROCESSING',
        progress: 20,
      },
    } as any);

    const outcome = await audioService.generateAudio({
      prompt: 'narrate a forest dawn',
      model: 'gemini-tts',
      voice: 'Nova',
      duration: 6,
    });

    expect(getTaskStatusAudio).toHaveBeenCalledWith('audio-task-2');
    expect(outcome.delivery.url).toBe('https://example.com/polled-audio.wav');
    expect(outcome.execution.remoteJobId).toBe('audio-task-2');
    expect(outcome.execution.providerModel).toBe('gemini-2.5-flash-tts');
  });

  it('preserves the generation api method binding when polling task status', async () => {
    const boundGetTaskStatusAudio = vi.fn(function (this: unknown, taskId: string | number) {
      expect(taskId).toBe('audio-task-3');
      expect(this).toBe(generationApi);
      return Promise.resolve({
        data: {
          taskId: 'audio-task-3',
          model: 'gemini-2.5-flash-tts',
          channel: 'app-audio',
          status: 'SUCCESS',
          progress: 100,
          outputResult: {
            primaryUrl: 'https://example.com/bound-audio.wav',
            resources: [
              {
                url: 'https://example.com/bound-audio.wav',
                mimeType: 'audio/wav',
                name: 'bound-audio.wav',
              },
            ],
          },
        },
      });
    });
    const generationApi = {
      textToSpeech: vi.fn(async () => ({
        data: {
          taskId: 'audio-task-3',
          model: 'gemini-2.5-flash-tts',
          channel: 'app-audio',
          status: 'PROCESSING',
          progress: 10,
        },
      })),
      getTaskStatusAudio: boundGetTaskStatusAudio,
    };

    getAppSdkClientWithSession.mockReturnValueOnce({
      generation: generationApi,
    } as any);

    const outcome = await audioService.generateAudio({
      prompt: 'narrate a bound polling request',
      model: 'gemini-tts',
      voice: 'Nova',
      duration: 6,
    });

    expect(boundGetTaskStatusAudio).toHaveBeenCalledWith('audio-task-3');
    expect(outcome.delivery.url).toBe('https://example.com/bound-audio.wav');
  });

  it('throws the business failure message when client.generation.textToSpeech returns a failure code', async () => {
    textToSpeech.mockResolvedValueOnce({
      code: '5000',
      msg: 'audio create failed',
    } as any);

    await expect(
      audioService.generateAudio({
        prompt: 'broken request',
        model: 'gemini-tts',
        voice: 'Nova',
      })
    ).rejects.toThrow('audio create failed');
  });

  it('throws the business failure message when client.generation.getTaskStatusAudio returns a failure code', async () => {
    textToSpeech.mockResolvedValueOnce({
      data: {
        taskId: 'audio-task-4',
        model: 'gemini-tts',
        channel: 'app-audio',
        status: 'PROCESSING',
        progress: 15,
      },
    } as any);
    getTaskStatusAudio.mockResolvedValueOnce({
      code: '5000',
      msg: 'audio poll failed',
    } as any);

    await expect(
      audioService.generateAudio({
        prompt: 'broken polling',
        model: 'gemini-tts',
        voice: 'Nova',
      })
    ).rejects.toThrow('audio poll failed');
  });

  it('routes transcription through client.generation.audioTranscription and returns a text artifact outcome', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce('https://example.com/source-audio.wav');

    const outcome = await audioService.generateAudio({
      mode: 'transcription',
      prompt: '',
      model: 'whisper-1',
      language: 'en',
      format: 'text',
      sourceAudio: createTestSourceAudio({
        id: 'audio-source-id-1',
        uuid: 'audio-source-uuid-1',
        assetId: 'audio-source-asset-1',
        assetUuid: 'audio-source-asset-uuid-1',
        primaryResourceId: 'audio-source-resource-id-1',
        primaryResourceUuid: 'audio-source-resource-uuid-1',
        resourceViewId: 'audio-source-resource-view-id-1',
        resourceViewUuid: 'audio-source-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/source-audio.wav',
        name: 'source-audio.wav',
        mimeType: 'audio/wav',
        resource: {
          id: 'audio-source-resource-id-1',
          uuid: 'audio-source-resource-uuid-1',
          type: MediaResourceType.AUDIO,
          url: 'https://example.com/source-audio.wav',
          name: 'source-audio.wav',
          mimeType: 'audio/wav',
        },
      }),
    });

    expect(audioTranscription).toHaveBeenCalledWith({
      audioUrl: 'https://example.com/source-audio.wav',
      model: 'whisper-1',
      language: 'en',
      format: 'text',
    });
    expect(outcome.recipe.mode).toBe('speech-to-text');
    expect(outcome.delivery.mimeType).toBe('text/plain');
    expect(outcome.delivery.url).toContain('data:text/plain');
    expect(outcome.delivery.metadata).toMatchObject({
      text: 'Hello world transcription',
      language: 'en',
      sourceAudioUrl: 'https://example.com/source-audio.wav',
    });
    expect(outcome.primaryArtifact.type).toBe('text');
  });

  it('rejects transcription when the source audio only has a canonical locator and no renderable url can be resolved', async () => {
    resolveAssetUrlByAssetIdFirst.mockReset();
    resolveAssetUrlByAssetIdFirst.mockImplementation(async (): Promise<string | null> => null);

    await expect(
      audioService.generateAudio({
        mode: 'transcription',
        prompt: '',
        model: 'whisper-1',
        sourceAudio: createTestSourceAudio({
          id: 'audio-source-id-locator-only',
          uuid: 'audio-source-uuid-locator-only',
          assetId: null,
          assetUuid: null,
          primaryResourceId: null,
          primaryResourceUuid: null,
          resourceViewId: null,
          resourceViewUuid: null,
          path: 'assets://workspace/audio/source-audio.wav',
          url: 'assets://workspace/audio/source-audio.wav',
          name: 'source-audio.wav',
        }),
      })
    ).rejects.toThrow('Audio transcription requires a resolvable source audio url');

    expect(audioTranscription).not.toHaveBeenCalled();
  });

  it('polls client.generation.getTranscriptionResult when transcription create call returns no text payload yet', async () => {
    audioTranscription.mockResolvedValueOnce({
      data: {
        taskId: 'audio-transcription-task-2',
        model: 'whisper-1',
        channel: 'app-audio',
        status: 'PROCESSING',
        progress: 30,
      },
    } as any);
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce('https://example.com/source-audio-2.wav');

    const outcome = await audioService.generateAudio({
      mode: 'transcription',
      prompt: '',
      model: 'whisper-1',
      sourceAudio: createTestSourceAudio({
        id: 'audio-source-id-2',
        uuid: 'audio-source-uuid-2',
        type: 'audio',
        url: 'https://example.com/source-audio-2.wav',
        name: 'source-audio-2.wav',
      }),
    });

    expect(getTranscriptionResult).toHaveBeenCalledWith('audio-transcription-task-2');
    expect(outcome.delivery.metadata).toMatchObject({
      text: 'Polled transcription result',
      language: 'zh',
      sourceAudioUrl: 'https://example.com/source-audio-2.wav',
    });
  });

  it('routes translation through client.generation.audioTranslation and returns a translated text artifact outcome', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce('https://example.com/source-audio-3.wav');

    const outcome = await audioService.generateAudio({
      mode: 'translation',
      prompt: '',
      model: 'whisper-1',
      sourceLanguage: 'en',
      targetLanguage: 'ja',
      format: 'text',
      idempotencyKey: 'audio-translation-idempotency-1',
      sourceAudio: createTestSourceAudio({
        id: 'audio-source-id-3',
        uuid: 'audio-source-uuid-3',
        assetId: 'audio-source-asset-3',
        assetUuid: 'audio-source-asset-uuid-3',
        primaryResourceId: 'audio-source-resource-id-3',
        primaryResourceUuid: 'audio-source-resource-uuid-3',
        resourceViewId: 'audio-source-resource-view-id-3',
        resourceViewUuid: 'audio-source-resource-view-uuid-3',
        type: 'audio',
        url: 'https://example.com/source-audio-3.wav',
        name: 'source-audio-3.wav',
        mimeType: 'audio/wav',
      }),
    });

    expect(audioTranslation).toHaveBeenCalledWith({
      audioUrl: 'https://example.com/source-audio-3.wav',
      model: 'whisper-1',
      sourceLanguage: 'en',
      targetLanguage: 'ja',
      format: 'text',
      idempotencyKey: 'audio-translation-idempotency-1',
    });
    expect(outcome.recipe.mode).toBe('speech-to-text');
    expect(outcome.delivery.mimeType).toBe('text/plain');
    expect(outcome.delivery.metadata).toMatchObject({
      task: 'translate',
      text: 'Hello world translated to Japanese',
      language: 'ja',
      sourceAudioUrl: 'https://example.com/source-audio-3.wav',
      targetLanguage: 'ja',
    });
    expect(outcome.primaryArtifact.type).toBe('text');
  });

  it('polls client.generation.getTranscriptionResult when translation create call returns no translated text yet', async () => {
    audioTranslation.mockResolvedValueOnce({
      data: {
        taskId: 'audio-transcription-task-2',
        model: 'whisper-1',
        channel: 'app-audio',
        status: 'PROCESSING',
        progress: 25,
      },
    } as any);
    getTranscriptionResult.mockResolvedValueOnce({
      data: {
        taskId: 'audio-translation-task-2',
        model: 'whisper-1',
        channel: 'app-audio',
        status: 'SUCCESS',
        progress: 100,
        outputResult: {
          primaryUrl: 'generated_audio_text_translate_2',
          metadata: {
            task: 'translate',
            text: 'Polled translated transcript',
            language: 'fr',
            duration: 9.1,
            segments: [
              {
                id: 0,
                start: 0,
                end: 1.1,
                text: 'Polled translated transcript',
              },
            ],
          },
        },
      },
    } as any);
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce('https://example.com/source-audio-4.wav');

    const outcome = await audioService.generateAudio({
      mode: 'translation',
      prompt: '',
      model: 'whisper-1',
      targetLanguage: 'fr',
      sourceAudio: createTestSourceAudio({
        id: 'audio-source-id-4',
        uuid: 'audio-source-uuid-4',
        type: 'audio',
        url: 'https://example.com/source-audio-4.wav',
        name: 'source-audio-4.wav',
      }),
    });

    expect(getTranscriptionResult).toHaveBeenCalledWith('audio-transcription-task-2');
    expect(outcome.delivery.metadata).toMatchObject({
      task: 'translate',
      text: 'Polled translated transcript',
      language: 'fr',
      sourceAudioUrl: 'https://example.com/source-audio-4.wav',
      targetLanguage: 'fr',
    });
  });

  it('does not import generated SDK types directly from retired generic app SDK', async () => {
    const source = await readFile(
      new URL('./audioService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`from '@sdkwork/${'app'}-sdk'`)).toBe(false);
  });

  it('ships an audio service contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./audioService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
