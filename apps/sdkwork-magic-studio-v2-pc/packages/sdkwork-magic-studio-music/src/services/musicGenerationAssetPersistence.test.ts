import { beforeEach, describe, expect, it, vi } from 'vitest';

const { persistGenerationOutcomeAsset } = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset,
}));

import { persistMusicGenerationResult } from './musicGenerationAssetPersistence';

describe('persistMusicGenerationResult', () => {
  beforeEach(() => {
    persistGenerationOutcomeAsset.mockReset();
  });

  it('maps persisted generation outcome asset into canonical generated music result', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'music-recipe-uuid-1',
        product: 'music',
        mode: 'text-to-music',
        prompt: 'uplifting synthwave anthem',
        instructions: 'neon lights keep calling us home',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'music-execution-uuid-1',
        provider: 'app-music',
        providerModel: 'suno-v3',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'music-artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-music.mp3',
        posterUrl: 'https://example.com/generated-music-cover.png',
        mimeType: 'audio/mpeg',
        duration: 120,
        artifactUuid: 'music-artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'music-artifact-uuid-1',
        type: 'music',
        resource: {
          id: null,
          uuid: 'music-resource-uuid-1',
          url: 'https://example.com/generated-music.mp3',
        },
      },
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'music-asset-1',
      assetUuid: 'music-asset-uuid-1',
      url: 'https://storage.example.com/generated-music.mp3',
      posterUrl: 'https://storage.example.com/generated-music-cover.png',
      duration: 120,
      recipeUuid: 'music-recipe-uuid-1',
      executionUuid: 'music-execution-uuid-1',
      artifactSetUuid: 'music-artifact-set-uuid-1',
      artifactUuid: 'music-artifact-uuid-1',
      executionId: null,
      primaryResourceId: 'music-resource-id-1',
      primaryResourceUuid: 'music-resource-uuid-1',
      resourceViewId: 'music-resource-view-id-1',
      resourceViewUuid: 'music-resource-view-uuid-1',
    });

    const result = await persistMusicGenerationResult({
      outcome: outcome as any,
      name: 'generated-music.mp3',
      title: 'Night Drive',
      lyrics: 'neon lights keep calling us home',
      style: 'electronic',
      fallbackDuration: 120,
    });

    expect(persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'music',
      domain: 'music',
      name: 'generated-music.mp3',
    });
    expect(result).toMatchObject({
      uuid: 'music-artifact-uuid-1',
      assetId: 'music-asset-1',
      assetUuid: 'music-asset-uuid-1',
      primaryResourceId: 'music-resource-id-1',
      primaryResourceUuid: 'music-resource-uuid-1',
      resourceViewId: 'music-resource-view-id-1',
      resourceViewUuid: 'music-resource-view-uuid-1',
      recipeUuid: 'music-recipe-uuid-1',
      executionUuid: 'music-execution-uuid-1',
      artifactSetUuid: 'music-artifact-set-uuid-1',
      artifactUuid: 'music-artifact-uuid-1',
      title: 'Night Drive',
      lyrics: 'neon lights keep calling us home',
      style: 'electronic',
      duration: 120,
      resource: {
        uuid: 'music-resource-view-uuid-1',
        assetId: 'music-asset-1',
        assetUuid: 'music-asset-uuid-1',
        url: 'https://storage.example.com/generated-music.mp3',
        duration: 120,
        name: 'generated-music.mp3',
      },
      coverResource: {
        url: 'https://storage.example.com/generated-music-cover.png',
      },
    });
  });
});
