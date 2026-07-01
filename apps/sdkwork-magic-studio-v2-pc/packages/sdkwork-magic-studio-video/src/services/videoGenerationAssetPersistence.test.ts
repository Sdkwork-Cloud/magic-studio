import { beforeEach, describe, expect, it, vi } from 'vitest';

const { persistGenerationOutcomeAsset } = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGenerationOutcomeAsset,
}));

import { persistVideoGenerationResult } from './videoGenerationAssetPersistence';

describe('persistVideoGenerationResult', () => {
  beforeEach(() => {
    persistGenerationOutcomeAsset.mockReset();
  });

  it('maps persisted generation outcome asset into canonical generated video result', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'video-recipe-uuid-1',
        product: 'video',
        mode: 'text-to-video',
        prompt: 'flying over neon city',
        negativePrompt: '',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'video-execution-uuid-1',
        provider: 'app-video',
        providerModel: 'wan2.2-vace-plus',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'video-artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-video.mp4',
        posterUrl: 'https://example.com/generated-video-poster.png',
        mimeType: 'video/mp4',
        width: 1280,
        height: 720,
        duration: 5,
        artifactUuid: 'video-artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'video-artifact-uuid-1',
        type: 'video',
        resource: {
          id: null,
          uuid: 'video-resource-uuid-1',
          url: 'https://example.com/generated-video.mp4',
        },
      },
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'video-asset-1',
      assetUuid: 'video-asset-uuid-1',
      url: 'https://storage.example.com/generated-video.mp4',
      posterUrl: 'https://storage.example.com/generated-video-poster.png',
      width: 1280,
      height: 720,
      duration: 5,
      providerModel: 'wan2.2-vace-plus',
      recipeUuid: 'video-recipe-uuid-1',
      executionUuid: 'video-execution-uuid-1',
      artifactSetUuid: 'video-artifact-set-uuid-1',
      artifactUuid: 'video-artifact-uuid-1',
      executionId: null,
      primaryResourceId: 'video-resource-id-1',
      primaryResourceUuid: 'video-resource-uuid-1',
      resourceViewId: 'video-resource-view-id-1',
      resourceViewUuid: 'video-resource-view-uuid-1',
    });

    const result = await persistVideoGenerationResult({
      outcome: outcome as any,
      name: 'generated-video.mp4',
    });

    expect(persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'video',
      domain: 'video-studio',
      name: 'generated-video.mp4',
    });
    expect(result).toMatchObject({
      uuid: 'video-artifact-uuid-1',
      assetId: 'video-asset-1',
      assetUuid: 'video-asset-uuid-1',
      primaryResourceId: 'video-resource-id-1',
      primaryResourceUuid: 'video-resource-uuid-1',
      resourceViewId: 'video-resource-view-id-1',
      resourceViewUuid: 'video-resource-view-uuid-1',
      recipeUuid: 'video-recipe-uuid-1',
      executionUuid: 'video-execution-uuid-1',
      artifactSetUuid: 'video-artifact-set-uuid-1',
      artifactUuid: 'video-artifact-uuid-1',
      modelId: 'wan2.2-vace-plus',
      resource: {
        uuid: 'video-resource-view-uuid-1',
        assetId: 'video-asset-1',
        assetUuid: 'video-asset-uuid-1',
        url: 'https://storage.example.com/generated-video.mp4',
        width: 1280,
        height: 720,
        duration: 5,
      },
      coverResource: {
        url: 'https://storage.example.com/generated-video-poster.png',
      },
    });
  });

  it('preserves stable video asset locators on path while keeping delivery urls renderable', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'video-recipe-uuid-2',
        product: 'video',
        mode: 'text-to-video',
        prompt: 'orbiting camera move',
        negativePrompt: '',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'video-execution-uuid-2',
        provider: 'app-video',
        providerModel: 'wan2.2-vace-plus',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'video-artifact-set-uuid-2',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-video-2.mp4',
        posterUrl: 'https://example.com/generated-video-2-poster.png',
        mimeType: 'video/mp4',
        width: 1280,
        height: 720,
        duration: 5,
        artifactUuid: 'video-artifact-uuid-2',
      },
      primaryArtifact: {
        id: null,
        uuid: 'video-artifact-uuid-2',
        type: 'video',
        resource: {
          id: null,
          uuid: 'video-resource-uuid-2',
          url: 'https://example.com/generated-video-2.mp4',
        },
      },
    };

    persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'video-asset-2',
      assetUuid: 'video-asset-uuid-2',
      path: 'assets://workspaces/ws-2/projects/proj-2/media/generated/generated-video-2.mp4',
      url: 'https://cdn.example.com/generated-video-2.mp4',
      posterUrl: 'https://cdn.example.com/generated-video-2-poster.png',
      width: 1280,
      height: 720,
      duration: 5,
      providerModel: 'wan2.2-vace-plus',
      recipeUuid: 'video-recipe-uuid-2',
      executionUuid: 'video-execution-uuid-2',
      artifactSetUuid: 'video-artifact-set-uuid-2',
      artifactUuid: 'video-artifact-uuid-2',
      executionId: null,
      primaryResourceId: 'video-resource-id-2',
      primaryResourceUuid: 'video-resource-uuid-2',
      resourceViewId: 'video-resource-view-id-2',
      resourceViewUuid: 'video-resource-view-uuid-2',
    });

    const result = await persistVideoGenerationResult({
      outcome: outcome as any,
      name: 'generated-video-2.mp4',
    });

    expect(result.resource).toMatchObject({
      path: 'assets://workspaces/ws-2/projects/proj-2/media/generated/generated-video-2.mp4',
      url: 'https://cdn.example.com/generated-video-2.mp4',
    });
  });
});
