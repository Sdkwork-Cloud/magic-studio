import { beforeEach, describe, expect, it, vi } from 'vitest';

const { persistGenerationOutcomeAsset } = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset,
}));

import { persistSfxGenerationResult } from './sfxGenerationAssetPersistence';

describe('persistSfxGenerationResult', () => {
  beforeEach(() => {
    persistGenerationOutcomeAsset.mockReset();
  });

  it('maps persisted generation outcome asset into canonical generated sfx result', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'sfx-recipe-uuid-1',
        product: 'sfx',
        mode: 'text-to-audio',
        prompt: 'short cinematic whoosh',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'sfx-execution-uuid-1',
        provider: 'app-sfx',
        providerModel: 'audioldm-2',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'sfx-artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-sfx.mp3',
        mimeType: 'audio/mpeg',
        duration: 3,
        artifactUuid: 'sfx-artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'sfx-artifact-uuid-1',
        type: 'audio',
        resource: {
          id: null,
          uuid: 'sfx-resource-uuid-1',
          url: 'https://example.com/generated-sfx.mp3',
        },
      },
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'sfx-asset-1',
      assetUuid: 'sfx-asset-uuid-1',
      url: 'https://storage.example.com/generated-sfx.mp3',
      duration: 3,
      recipeUuid: 'sfx-recipe-uuid-1',
      executionUuid: 'sfx-execution-uuid-1',
      artifactSetUuid: 'sfx-artifact-set-uuid-1',
      artifactUuid: 'sfx-artifact-uuid-1',
      executionId: null,
      primaryResourceId: 'sfx-resource-id-1',
      primaryResourceUuid: 'sfx-resource-uuid-1',
      resourceViewId: 'sfx-resource-view-id-1',
      resourceViewUuid: 'sfx-resource-view-uuid-1',
    });

    const result = await persistSfxGenerationResult({
      outcome: outcome as any,
      name: 'generated-sfx.mp3',
      fallbackDuration: 3,
    });

    expect(persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'sfx',
      domain: 'audio-studio',
      name: 'generated-sfx.mp3',
    });
    expect(result).toMatchObject({
      uuid: 'sfx-artifact-uuid-1',
      assetId: 'sfx-asset-1',
      assetUuid: 'sfx-asset-uuid-1',
      primaryResourceId: 'sfx-resource-id-1',
      primaryResourceUuid: 'sfx-resource-uuid-1',
      resourceViewId: 'sfx-resource-view-id-1',
      resourceViewUuid: 'sfx-resource-view-uuid-1',
      recipeUuid: 'sfx-recipe-uuid-1',
      executionUuid: 'sfx-execution-uuid-1',
      artifactSetUuid: 'sfx-artifact-set-uuid-1',
      artifactUuid: 'sfx-artifact-uuid-1',
      duration: 3,
      resource: {
        uuid: 'sfx-resource-view-uuid-1',
        assetId: 'sfx-asset-1',
        assetUuid: 'sfx-asset-uuid-1',
        url: 'https://storage.example.com/generated-sfx.mp3',
        duration: 3,
        name: 'generated-sfx.mp3',
      },
    });
  });
});
