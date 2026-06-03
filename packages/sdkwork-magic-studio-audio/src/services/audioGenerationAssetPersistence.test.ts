import { beforeEach, describe, expect, it, vi } from 'vitest';

const { persistGenerationOutcomeAsset } = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset,
}));

import { persistAudioGenerationResult } from './audioGenerationAssetPersistence';

describe('persistAudioGenerationResult', () => {
  beforeEach(() => {
    persistGenerationOutcomeAsset.mockReset();
  });

  it('maps persisted generation outcome asset into canonical audio task result', async () => {
    const outcome = {
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
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'audio-asset-1',
      assetUuid: 'audio-asset-uuid-1',
      url: 'https://storage.example.com/generated-audio.wav',
      duration: 12,
      recipeUuid: 'audio-recipe-uuid-1',
      executionUuid: 'audio-execution-uuid-1',
      artifactSetUuid: 'audio-artifact-set-uuid-1',
      artifactUuid: 'audio-artifact-uuid-1',
      executionId: null,
      primaryResourceId: 'audio-resource-id-1',
      primaryResourceUuid: 'audio-resource-uuid-1',
      resourceViewId: 'audio-resource-view-id-1',
      resourceViewUuid: 'audio-resource-view-uuid-1',
    });

    const result = await persistAudioGenerationResult({
      outcome: outcome as any,
      name: 'generated-audio.wav',
      fallbackDuration: 10,
    });

    expect(persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'audio',
      domain: 'audio-studio',
      name: 'generated-audio.wav',
    });
    expect(result).toMatchObject({
      uuid: 'audio-artifact-uuid-1',
      assetId: 'audio-asset-1',
      assetUuid: 'audio-asset-uuid-1',
      primaryResourceId: 'audio-resource-id-1',
      primaryResourceUuid: 'audio-resource-uuid-1',
      resourceViewId: 'audio-resource-view-id-1',
      resourceViewUuid: 'audio-resource-view-uuid-1',
      recipeUuid: 'audio-recipe-uuid-1',
      executionUuid: 'audio-execution-uuid-1',
      artifactSetUuid: 'audio-artifact-set-uuid-1',
      artifactUuid: 'audio-artifact-uuid-1',
      duration: 12,
      resource: {
        uuid: 'audio-resource-view-uuid-1',
        assetId: 'audio-asset-1',
        assetUuid: 'audio-asset-uuid-1',
        url: 'https://storage.example.com/generated-audio.wav',
        duration: 12,
        name: 'generated-audio.wav',
      },
    });
  });
});
