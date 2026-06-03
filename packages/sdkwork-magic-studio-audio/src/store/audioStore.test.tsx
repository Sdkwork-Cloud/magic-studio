/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAudioInputResourceRef,
  createAudioTask,
  createAudioTaskResult,
} from '../entities';

interface AudioStoreTestHandle {
  history: Array<Record<string, unknown>>;
  setConfig: (config: Record<string, unknown>) => void;
  generate: () => Promise<void>;
  importTask: (task: unknown) => void;
}

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
  toggleFavorite: vi.fn(async () => undefined),
  generateAudio: vi.fn(async () => mocks.audioOutcome),
  audioOutcome: {
    recipe: {
      id: null,
      uuid: 'audio-recipe-uuid-1',
      product: 'audio',
      mode: 'text-to-audio',
      prompt: 'gentle rain ambience',
      negativePrompt: '',
      inputRefs: [],
      parameters: {},
    },
    execution: {
      id: null,
      uuid: 'audio-execution-uuid-1',
      provider: 'app-audio',
      providerModel: 'gemini-2.5-flash-tts',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'audio-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/generated-audio.wav',
      mimeType: 'audio/wav',
      duration: 12,
      artifactUuid: 'audio-artifact-uuid-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'audio-artifact-uuid-1',
      type: 'audio',
      resource: {
        id: null,
        uuid: 'audio-resource-uuid-1',
        url: 'https://example.com/generated-audio.wav',
      },
    },
  },
  persistAudioGenerationResult: vi.fn(async () =>
    createAudioTaskResult({
      uuid: 'persisted-audio-uuid-1',
      assetId: 'persisted-audio-asset-1',
      assetUuid: 'persisted-audio-asset-uuid-1',
      primaryResourceId: 'persisted-audio-resource-id-1',
      primaryResourceUuid: 'persisted-audio-resource-uuid-1',
      resourceViewId: 'persisted-audio-resource-view-id-1',
      resourceViewUuid: 'persisted-audio-resource-view-uuid-1',
      recipeUuid: 'audio-recipe-uuid-1',
      executionUuid: 'audio-execution-uuid-1',
      artifactSetUuid: 'audio-artifact-set-uuid-1',
      artifactUuid: 'audio-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'persisted-audio-resource-view-uuid-1',
        assetId: 'persisted-audio-asset-1',
        assetUuid: 'persisted-audio-asset-uuid-1',
        primaryResourceId: 'persisted-audio-resource-id-1',
        primaryResourceUuid: 'persisted-audio-resource-uuid-1',
        resourceViewId: 'persisted-audio-resource-view-id-1',
        resourceViewUuid: 'persisted-audio-resource-view-uuid-1',
        url: 'https://storage.example.com/generated-audio.wav',
        duration: 12,
        name: 'audio_gen_audio-task-uuid-1.wav',
      },
      duration: 12,
    })
  ),
  audioTranscriptionOutcome: {
    recipe: {
      id: null,
      uuid: 'audio-transcription-recipe-uuid-1',
      product: 'text',
      mode: 'speech-to-text',
      prompt: 'meeting-notes.wav',
      inputRefs: [],
      parameters: {
        sourceAudioUrl: 'https://example.com/meeting-notes.wav',
        sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
      },
    },
    execution: {
      id: null,
      uuid: 'audio-transcription-execution-uuid-1',
      provider: 'app-audio',
      providerModel: 'whisper-1',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'audio-transcription-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'data:text/plain;charset=utf-8,Hello%20world%20transcription',
      mimeType: 'text/plain',
      artifactUuid: 'audio-transcription-artifact-uuid-1',
      metadata: {
        text: 'Hello world transcription',
        language: 'en',
        sourceAudioUrl: 'https://example.com/meeting-notes.wav',
        sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
      },
    },
    primaryArtifact: {
      id: null,
      uuid: 'audio-transcription-artifact-uuid-1',
      type: 'text',
      resource: {
        id: null,
        uuid: 'audio-transcription-resource-uuid-1',
        type: 'TEXT',
        url: 'data:text/plain;charset=utf-8,Hello%20world%20transcription',
        mimeType: 'text/plain',
        name: 'meeting-notes.transcript.txt',
        metadata: {
          text: 'Hello world transcription',
          language: 'en',
          sourceAudioUrl: 'https://example.com/meeting-notes.wav',
          sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
        },
      },
    },
  },
  audioTranslationOutcome: {
    recipe: {
      id: null,
      uuid: 'audio-translation-recipe-uuid-1',
      product: 'text',
      mode: 'speech-to-text',
      prompt: 'meeting-notes.wav',
      inputRefs: [],
      parameters: {
        sourceAudioUrl: 'https://example.com/meeting-notes.wav',
        sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
        targetLanguage: 'ja',
        task: 'translate',
      },
    },
    execution: {
      id: null,
      uuid: 'audio-translation-execution-uuid-1',
      provider: 'app-audio',
      providerModel: 'whisper-1',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'audio-translation-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'data:text/plain;charset=utf-8,Hello%20world%20translated',
      mimeType: 'text/plain',
      artifactUuid: 'audio-translation-artifact-uuid-1',
      metadata: {
        task: 'translate',
        text: 'Hello world translated',
        language: 'ja',
        targetLanguage: 'ja',
        sourceAudioUrl: 'https://example.com/meeting-notes.wav',
        sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
      },
    },
    primaryArtifact: {
      id: null,
      uuid: 'audio-translation-artifact-uuid-1',
      type: 'text',
      resource: {
        id: null,
        uuid: 'audio-translation-resource-uuid-1',
        type: 'TEXT',
        url: 'data:text/plain;charset=utf-8,Hello%20world%20translated',
        mimeType: 'text/plain',
        name: 'meeting-notes.translation.txt',
        metadata: {
          task: 'translate',
          text: 'Hello world translated',
          language: 'ja',
          targetLanguage: 'ja',
          sourceAudioUrl: 'https://example.com/meeting-notes.wav',
          sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
        },
      },
    },
  },
}));

vi.mock('../services', () => ({
  audioBusinessService: {
    audioService: {
      generateAudio: mocks.generateAudio,
    },
    audioHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
  persistAudioGenerationResult: mocks.persistAudioGenerationResult,
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  generateUUID: vi.fn(() => 'audio-task-uuid-1'),
}));

import { AudioStoreProvider, useAudioStore } from './audioStore';

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: AudioStoreTestHandle) => void;
}) => {
  const store = useAudioStore();
  onStore(store as unknown as AudioStoreTestHandle);
  return null;
};

describe('AudioStoreProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.persistGenerationOutcomeAsset.mockClear();
    mocks.findAll.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.toggleFavorite.mockClear();
    mocks.generateAudio.mockClear();
    mocks.persistAudioGenerationResult.mockClear();
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

  it('uses persistAudioGenerationResult for generated audio results', async () => {
    let latestStore: AudioStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AudioStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </AudioStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        prompt: 'gentle rain ambience',
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'gentle rain ambience',
      })
    );
    expect(mocks.persistAudioGenerationResult).toHaveBeenCalledWith({
      outcome: mocks.audioOutcome,
      name: 'audio_gen_audio-task-uuid-1.wav',
      fallbackDuration: 10,
    });
    expect(mocks.persistGenerationOutcomeAsset).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'audio-task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            uuid: 'persisted-audio-uuid-1',
            assetId: 'persisted-audio-asset-1',
          }),
        ],
      })
    );
  });

  it('stores transcription results as text records without calling audio asset persistence', async () => {
    let latestStore: AudioStoreTestHandle | null = null;

    mocks.generateAudio.mockResolvedValueOnce(mocks.audioTranscriptionOutcome as any);

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AudioStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </AudioStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Audio store was not captured');
    }
    const getStore = (): AudioStoreTestHandle => latestStore as unknown as AudioStoreTestHandle;

    await act(async () => {
      getStore().setConfig({
        mode: 'transcription',
        prompt: '',
        sourceAudio: createAudioInputResourceRef({
          id: 'audio-source-id-1',
          uuid: 'audio-source-uuid-1',
          type: 'audio',
          path: 'assets://workspace/audio/meeting-notes.wav',
          url: 'https://example.com/meeting-notes.wav',
          name: 'meeting-notes.wav',
        }),
      });
    });

    await act(async () => {
      await getStore().generate();
    });

    expect(mocks.generateAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'transcription',
        sourceAudio: expect.objectContaining({
          url: 'https://example.com/meeting-notes.wav',
        }),
      })
    );
    expect(mocks.persistAudioGenerationResult).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'audio-task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            resource: expect.objectContaining({
              type: 'TEXT',
              mimeType: 'text/plain',
              metadata: expect.objectContaining({
                sourceAudioUrl: 'https://example.com/meeting-notes.wav',
                sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
              }),
            }),
            text: 'Hello world transcription',
            language: 'en',
          }),
        ],
      })
    );
  });

  it('does not backfill sourceAudioUrl from a locator-only source when storing transcription results', async () => {
    let latestStore: AudioStoreTestHandle | null = null;

    mocks.generateAudio.mockResolvedValueOnce({
      ...mocks.audioTranscriptionOutcome,
      delivery: {
        ...mocks.audioTranscriptionOutcome.delivery,
        metadata: {
          text: 'Hello world transcription',
          language: 'en',
          sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
        },
      },
      primaryArtifact: {
        ...mocks.audioTranscriptionOutcome.primaryArtifact,
        resource: {
          ...mocks.audioTranscriptionOutcome.primaryArtifact.resource,
          metadata: {
            text: 'Hello world transcription',
            language: 'en',
            sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
          },
        },
      },
    } as any);

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AudioStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </AudioStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Audio store was not captured');
    }
    const getStore = (): AudioStoreTestHandle => latestStore as unknown as AudioStoreTestHandle;

    await act(async () => {
      getStore().setConfig({
        mode: 'transcription',
        prompt: '',
        sourceAudio: createAudioInputResourceRef({
          id: 'audio-source-id-locator-only',
          uuid: 'audio-source-uuid-locator-only',
          type: 'audio',
          path: 'assets://workspace/audio/meeting-notes.wav',
          url: 'assets://workspace/audio/meeting-notes.wav',
          name: 'meeting-notes.wav',
        }),
      });
    });

    await act(async () => {
      await getStore().generate();
    });

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'audio-task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            resource: expect.objectContaining({
              type: 'TEXT',
              mimeType: 'text/plain',
              metadata: expect.objectContaining({
                sourceAudioUrl: null,
                sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
              }),
            }),
          }),
        ],
      })
    );
  });

  it('stores translation results as text records and requires a target language', async () => {
    let latestStore: AudioStoreTestHandle | null = null;

    mocks.generateAudio.mockResolvedValueOnce(mocks.audioTranslationOutcome as any);

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AudioStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </AudioStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Audio store was not captured');
    }
    const getStore = (): AudioStoreTestHandle => latestStore as unknown as AudioStoreTestHandle;

    await act(async () => {
      getStore().setConfig({
        mode: 'translation',
        prompt: '',
        targetLanguage: 'ja',
        sourceAudio: createAudioInputResourceRef({
          id: 'audio-source-id-2',
          uuid: 'audio-source-uuid-2',
          type: 'audio',
          path: 'assets://workspace/audio/meeting-notes.wav',
          url: 'https://example.com/meeting-notes.wav',
          name: 'meeting-notes.wav',
        }),
      });
    });

    await act(async () => {
      await getStore().generate();
    });

    expect(mocks.generateAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'translation',
        targetLanguage: 'ja',
        sourceAudio: expect.objectContaining({
          url: 'https://example.com/meeting-notes.wav',
        }),
      })
    );
    expect(mocks.persistAudioGenerationResult).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'audio-task-uuid-1',
        status: 'completed',
        config: expect.objectContaining({
          mode: 'translation',
          targetLanguage: 'ja',
        }),
        results: [
          expect.objectContaining({
            resource: expect.objectContaining({
              type: 'TEXT',
              mimeType: 'text/plain',
              metadata: expect.objectContaining({
                sourceAudioUrl: 'https://example.com/meeting-notes.wav',
                sourceAudioPath: 'assets://workspace/audio/meeting-notes.wav',
              }),
            }),
            text: 'Hello world translated',
            language: 'ja',
          }),
        ],
      })
    );
  });

  it('imports audio tasks at the top of history and replaces the previous copy with the same key', async () => {
    let latestStore: AudioStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AudioStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </AudioStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Audio store was not captured');
    }
    const getStore = (): AudioStoreTestHandle => latestStore as unknown as AudioStoreTestHandle;

    const firstImportedTask = createAudioTask({
      id: 'imported-audio-db-id-1',
      uuid: 'imported-audio-task-uuid-1',
      status: 'completed',
      prompt: 'first imported audio',
      config: {
        prompt: 'first imported audio',
        mode: 'text-to-speech',
        model: 'gemini-tts',
        voice: 'Kore',
        duration: 10,
        mediaType: 'speech',
      },
      results: [
        createAudioTaskResult({
          uuid: 'imported-audio-result-uuid-1',
          resource: {
            id: null,
            uuid: 'imported-audio-resource-uuid-1',
            url: 'https://example.com/imported-audio-1.wav',
            name: 'imported-audio-1.wav',
          },
          duration: 10,
        }),
      ],
    });

    const updatedImportedTask = createAudioTask({
      id: 'imported-audio-db-id-2',
      uuid: 'imported-audio-task-uuid-1',
      status: 'completed',
      prompt: 'updated imported audio',
      config: {
        prompt: 'updated imported audio',
        mode: 'text-to-speech',
        model: 'gemini-tts',
        voice: 'Charon',
        duration: 15,
        mediaType: 'speech',
      },
      results: [
        createAudioTaskResult({
          uuid: 'imported-audio-result-uuid-2',
          resource: {
            id: null,
            uuid: 'imported-audio-resource-uuid-2',
            url: 'https://example.com/imported-audio-2.wav',
            name: 'imported-audio-2.wav',
          },
          duration: 15,
        }),
      ],
    });

    await act(async () => {
      getStore().importTask(firstImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      uuid: 'imported-audio-task-uuid-1',
      prompt: 'first imported audio',
      config: expect.objectContaining({
        voice: 'Kore',
      }),
    });

    await act(async () => {
      getStore().importTask(updatedImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-audio-db-id-2',
      uuid: 'imported-audio-task-uuid-1',
      prompt: 'updated imported audio',
      config: expect.objectContaining({
        voice: 'Charon',
        duration: 15,
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-audio-result-uuid-2',
          duration: 15,
        }),
      ],
    });
  });
});
