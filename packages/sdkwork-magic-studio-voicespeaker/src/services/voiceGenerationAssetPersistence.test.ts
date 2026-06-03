import { beforeEach, describe, expect, it, vi } from 'vitest';

const { persistGenerationOutcomeAsset } = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset,
}));

import { persistVoiceGenerationResult } from './voiceGenerationAssetPersistence';

describe('persistVoiceGenerationResult', () => {
  beforeEach(() => {
    persistGenerationOutcomeAsset.mockReset();
  });

  it('maps persisted generation outcome asset into canonical generated voice result', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'voice-recipe-uuid-1',
        product: 'speech',
        mode: 'text-to-speech',
        prompt: 'Hello world',
        negativePrompt: '',
        inputRefs: [],
        parameters: {
          speakerId: 'speaker-1',
          voiceId: 'speaker-1',
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
          name: 'generated-voice.wav',
          url: 'https://example.com/generated-voice.wav',
        },
      },
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'voice-asset-1',
      assetUuid: 'voice-asset-uuid-1',
      url: 'https://storage.example.com/generated-voice.wav',
      mimeType: 'audio/wav',
      duration: 8,
      providerModel: 'seed-tts',
      prompt: 'Hello world',
      parameters: {
        speakerId: 'speaker-1',
      },
      recipeUuid: 'voice-recipe-uuid-1',
      executionUuid: 'voice-execution-uuid-1',
      artifactSetUuid: 'voice-artifact-set-uuid-1',
      artifactUuid: 'voice-artifact-uuid-1',
      executionId: null,
      primaryResourceId: 'voice-resource-id-1',
      primaryResourceUuid: 'voice-resource-uuid-1',
      resourceViewId: 'voice-resource-view-id-1',
      resourceViewUuid: 'voice-resource-view-uuid-1',
    });

    const result = await persistVoiceGenerationResult({
      outcome: outcome as any,
      name: 'generated-voice.wav',
      speakerId: 'speaker-1',
      avatarUrl: 'https://example.com/avatar.png',
    });

    expect(persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'voice',
      domain: 'voice-speaker',
      name: 'generated-voice.wav',
    });
    expect(result).toMatchObject({
      uuid: 'voice-artifact-uuid-1',
      assetId: 'voice-asset-1',
      assetUuid: 'voice-asset-uuid-1',
      primaryResourceId: 'voice-resource-id-1',
      primaryResourceUuid: 'voice-resource-uuid-1',
      resourceViewId: 'voice-resource-view-id-1',
      resourceViewUuid: 'voice-resource-view-uuid-1',
      recipeUuid: 'voice-recipe-uuid-1',
      executionUuid: 'voice-execution-uuid-1',
      artifactSetUuid: 'voice-artifact-set-uuid-1',
      artifactUuid: 'voice-artifact-uuid-1',
      duration: 8,
      text: 'Hello world',
      speakerId: 'speaker-1',
      avatarUrl: 'https://example.com/avatar.png',
      modelId: 'seed-tts',
      resource: {
        uuid: 'voice-resource-uuid-1',
        assetId: 'voice-asset-1',
        url: 'https://storage.example.com/generated-voice.wav',
        duration: 8,
      },
    });
  });
});
