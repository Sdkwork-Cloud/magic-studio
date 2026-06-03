import { beforeEach, describe, expect, it, vi } from 'vitest';

const { persistGenerationOutcomeAsset } = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset,
}));

import { persistImageGenerationResult } from './imageGenerationAssetPersistence';

describe('persistImageGenerationResult', () => {
  beforeEach(() => {
    persistGenerationOutcomeAsset.mockReset();
  });

  it('maps persisted generation outcome asset into canonical generated image result', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'recipe-uuid-1',
        product: 'image',
        mode: 'inpaint',
        prompt: 'remove prompt',
        negativePrompt: 'blur',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'execution-uuid-1',
        provider: 'app-image',
        providerModel: 'gemini-2.5-flash-image',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/edited-image.png',
        mimeType: 'image/png',
        width: 1024,
        height: 1024,
        artifactUuid: 'artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'artifact-uuid-1',
        type: 'image',
        resource: {
          id: null,
          uuid: 'resource-uuid-1',
          url: 'https://example.com/edited-image.png',
        },
      },
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      url: 'https://storage.example.com/edited-image.png',
      posterUrl: 'https://storage.example.com/edited-image-poster.png',
      width: 1024,
      height: 1024,
      prompt: 'remove prompt',
      negativePrompt: 'blur',
      providerModel: 'gemini-2.5-flash-image',
      recipeUuid: 'recipe-uuid-1',
      executionUuid: 'execution-uuid-1',
      artifactSetUuid: 'artifact-set-uuid-1',
      artifactUuid: 'artifact-uuid-1',
      executionId: null,
      primaryResourceId: 'resource-db-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'resource-view-1',
      resourceViewUuid: 'resource-view-uuid-1',
    });

    const result = await persistImageGenerationResult({
      outcome: outcome as any,
      name: 'edited-image.png',
    });

    expect(persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'image',
      domain: 'image-studio',
      name: 'edited-image.png',
    });
    expect(result).toMatchObject({
      uuid: 'artifact-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-db-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'resource-view-1',
      resourceViewUuid: 'resource-view-uuid-1',
      recipeUuid: 'recipe-uuid-1',
      executionUuid: 'execution-uuid-1',
      artifactSetUuid: 'artifact-set-uuid-1',
      artifactUuid: 'artifact-uuid-1',
      width: 1024,
      height: 1024,
      prompt: 'remove prompt',
      negativePrompt: 'blur',
      resource: {
        uuid: 'resource-view-uuid-1',
        assetId: 'asset-db-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-db-1',
        primaryResourceUuid: 'resource-uuid-1',
        resourceViewId: 'resource-view-1',
        resourceViewUuid: 'resource-view-uuid-1',
        url: 'https://storage.example.com/edited-image.png',
      },
      coverResource: {
        url: 'https://storage.example.com/edited-image-poster.png',
      },
    });
  });
});
