/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGeneratedVoiceResult } from '../entities';

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
  voiceOutcome: {
    recipe: {
      id: null,
      uuid: 'voice-recipe-uuid-1',
      product: 'speech',
      mode: 'text-to-speech',
      prompt: 'Hello world',
      negativePrompt: '',
      inputRefs: [],
      parameters: {
        speakerId: 'speaker-kore',
        voiceId: 'speaker-kore',
      },
    },
    execution: {
      id: null,
      uuid: 'voice-execution-uuid-1',
      provider: 'app-voice',
      providerModel: 'seed-tts',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'voice-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/generated-voice.wav',
      mimeType: 'audio/wav',
      duration: 8,
      artifactUuid: 'voice-artifact-uuid-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'voice-artifact-uuid-1',
      type: 'audio',
      resource: {
        id: null,
        uuid: 'voice-resource-uuid-1',
        url: 'https://example.com/generated-voice.wav',
      },
    },
  },
  generateSpeech: vi.fn(async () => [mocks.voiceOutcome]),
  persistVoiceGenerationResult: vi.fn(async () =>
    createGeneratedVoiceResult({
      uuid: 'persisted-voice-uuid-1',
      assetId: 'persisted-voice-asset-1',
      assetUuid: 'persisted-voice-asset-uuid-1',
      primaryResourceId: 'persisted-voice-resource-id-1',
      primaryResourceUuid: 'persisted-voice-resource-uuid-1',
      resourceViewId: 'persisted-voice-resource-view-id-1',
      resourceViewUuid: 'persisted-voice-resource-view-uuid-1',
      recipeUuid: 'voice-recipe-uuid-1',
      executionUuid: 'voice-execution-uuid-1',
      artifactSetUuid: 'voice-artifact-set-uuid-1',
      artifactUuid: 'voice-artifact-uuid-1',
      executionId: null,
      resource: {
        id: null,
        uuid: 'persisted-voice-resource-uuid-1',
        assetId: 'persisted-voice-asset-1',
        primaryResourceId: 'persisted-voice-resource-id-1',
        resourceViewId: 'persisted-voice-resource-view-id-1',
        url: 'https://storage.example.com/generated-voice.wav',
        mimeType: 'audio/wav',
        duration: 8,
        name: 'voice_gen_voice-task-uuid-1_1.wav',
      },
      duration: 8,
      text: 'Hello world',
      speakerId: 'speaker-kore',
      modelId: 'seed-tts',
    })
  ),
}));

vi.mock('../services', () => ({
  voiceBusinessService: {
    voiceService: {
      generateSpeech: mocks.generateSpeech,
    },
    voiceHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      clear: mocks.clear,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
  persistVoiceGenerationResult: mocks.persistVoiceGenerationResult,
}));

vi.mock('../constants', () => ({
  VOICE_MODELS: [
    { id: 'seed-tts', name: 'Seed TTS' },
  ],
  PRESET_VOICES: [
    { id: 'speaker-kore', name: 'Kore' },
  ],
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  generateUUID: vi.fn(() => 'voice-task-uuid-1'),
}));

import { VoiceStoreProvider, useVoiceStore } from './voiceStore';

interface VoiceStoreTestHandle {
  history: Array<Record<string, unknown>>;
  setConfig: (config: Record<string, unknown>) => void;
  generate: () => Promise<void>;
  importTask: (task: unknown) => void;
}

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: VoiceStoreTestHandle) => void;
}) => {
  const store = useVoiceStore();
  onStore(store as unknown as VoiceStoreTestHandle);
  return null;
};

describe('VoiceStoreProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.persistGenerationOutcomeAsset.mockClear();
    mocks.findAll.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.clear.mockClear();
    mocks.toggleFavorite.mockClear();
    mocks.generateSpeech.mockClear();
    mocks.persistVoiceGenerationResult.mockClear();
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

  it('uses persistVoiceGenerationResult for generated voice outputs', async () => {
    let latestStore: VoiceStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VoiceStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VoiceStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        text: 'Hello world',
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Hello world',
        voiceId: 'speaker-kore',
      })
    );
    expect(mocks.persistVoiceGenerationResult).toHaveBeenCalledWith({
      outcome: mocks.voiceOutcome,
      name: 'voice_gen_voice-task-uuid-1_1.wav',
      speakerId: 'speaker-kore',
      avatarUrl: undefined,
    });
    expect(mocks.persistGenerationOutcomeAsset).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        uuid: 'voice-task-uuid-1',
        status: 'completed',
        result: expect.objectContaining({
          uuid: 'persisted-voice-uuid-1',
          assetId: 'persisted-voice-asset-1',
        }),
        results: [
          expect.objectContaining({
            uuid: 'persisted-voice-uuid-1',
            assetId: 'persisted-voice-asset-1',
          }),
        ],
      })
    );
  });

  it('replaces existing imported voice tasks by uuid when importing a refreshed record', async () => {
    let latestStore: VoiceStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <VoiceStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </VoiceStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Voice store was not captured');
    }
    const getStore = (): VoiceStoreTestHandle => latestStore as unknown as VoiceStoreTestHandle;

    const firstImportedTask = {
      id: 'imported-voice-db-id-1',
      uuid: 'imported-voice-task-uuid-1',
      text: 'first imported voice',
      speakerId: '',
      status: 'completed',
      config: {
        text: 'first imported voice',
        previewText: 'first imported voice',
        voiceId: 'speaker-kore',
        model: 'seed-tts',
        speed: 1,
        pitch: 1,
        mediaType: 'voice',
      },
      results: [
        {
          uuid: 'imported-voice-result-uuid-1',
          assetId: 'imported-voice-asset-1',
        },
      ],
    } as any;

    const updatedImportedTask = {
      id: 'imported-voice-db-id-2',
      uuid: 'imported-voice-task-uuid-1',
      text: 'updated imported voice',
      speakerId: '',
      status: 'completed',
      config: {
        text: 'updated imported voice',
        previewText: 'updated imported voice',
        voiceId: 'speaker-kore',
        model: 'seed-tts-v2',
        speed: 1,
        pitch: 1,
        mediaType: 'voice',
      },
      results: [
        {
          uuid: 'imported-voice-result-uuid-2',
          assetId: 'imported-voice-asset-2',
        },
      ],
    } as any;

    await act(async () => {
      getStore().importTask(firstImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-voice-db-id-1',
      uuid: 'imported-voice-task-uuid-1',
    });

    await act(async () => {
      getStore().importTask(updatedImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-voice-db-id-2',
      uuid: 'imported-voice-task-uuid-1',
      config: expect.objectContaining({
        text: 'updated imported voice',
        model: 'seed-tts-v2',
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-voice-result-uuid-2',
        }),
      ],
    });
  });
});
