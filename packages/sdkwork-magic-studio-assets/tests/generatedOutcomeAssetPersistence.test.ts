import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} = vi.hoisted(() => ({
  importAssetBySdk: vi.fn(),
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

const { tryExtractInlineData } = vi.hoisted(() => ({
  tryExtractInlineData: vi.fn(),
}));

vi.mock('../src/services/assetSdkQueryService', () => ({
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  inlineDataService: {
    tryExtractInlineData,
  },
  resolveGenerationOutcomePrimaryUrl: (outcome: any) =>
    outcome?.primaryArtifact?.resource?.url || outcome?.delivery?.url || null,
}));

import { persistGenerationOutcomeAsset } from '../src/services/generatedOutcomeAssetPersistence';

describe('persistGenerationOutcomeAsset', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
  });

  it('prefers a canonical asset id already carried by the generation outcome', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-image.png');

    await expect(
      persistGenerationOutcomeAsset({
        outcome: {
          recipe: {
            id: 'recipe-db-1',
            uuid: 'recipe-uuid-1',
            product: 'image',
            mode: 'text-to-image',
            prompt: 'cinematic skyline',
            negativePrompt: 'low quality',
            parameters: {
              aspectRatio: '16:9',
            },
          },
          execution: {
            id: 'execution-db-1',
            uuid: 'execution-uuid-1',
            provider: 'openai',
            providerModel: 'gpt-image-1',
          },
          artifactSet: {
            id: 'artifact-set-db-1',
            uuid: 'artifact-set-uuid-1',
          },
          delivery: {
            assetId: 'asset-1',
            artifactId: 'artifact-db-1',
            artifactUuid: 'artifact-uuid-1',
            primaryResourceId: 'resource-db-1',
            resourceViewId: 'resource-view-1',
            url: 'https://tmp.example.com/generated-image.png',
            posterUrl: 'https://tmp.example.com/generated-image-poster.png',
          },
          primaryArtifact: {
            assetId: 'asset-1',
            id: 'artifact-db-1',
            uuid: 'artifact-uuid-1',
            primaryResourceId: 'resource-db-1',
            resourceViewId: 'resource-view-1',
            type: 'image',
            resource: {
              id: 'resource-db-1',
              uuid: 'resource-uuid-1',
              url: 'https://tmp.example.com/generated-image.png',
            },
          },
        } as any,
        type: 'image',
        domain: 'image-studio',
        name: 'generated-image.png',
      })
    ).resolves.toMatchObject({
      assetId: 'asset-1',
      assetUuid: null,
      path: 'https://tmp.example.com/generated-image.png',
      url: 'https://cdn.example.com/generated-image.png',
      sourceUrl: 'https://tmp.example.com/generated-image.png',
      deliveryUrl: 'https://tmp.example.com/generated-image.png',
      posterUrl: 'https://tmp.example.com/generated-image-poster.png',
      product: 'image',
      mode: 'text-to-image',
      provider: 'openai',
      providerModel: 'gpt-image-1',
      prompt: 'cinematic skyline',
      negativePrompt: 'low quality',
      parameters: {
        aspectRatio: '16:9',
      },
      recipeId: 'recipe-db-1',
      recipeUuid: 'recipe-uuid-1',
      executionId: 'execution-db-1',
      executionUuid: 'execution-uuid-1',
      artifactSetId: 'artifact-set-db-1',
      artifactSetUuid: 'artifact-set-uuid-1',
      artifactId: 'artifact-db-1',
      artifactUuid: 'artifact-uuid-1',
      primaryResourceId: 'resource-db-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'resource-view-1',
      resourceViewUuid: null,
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('imports the generation delivery url when no canonical asset exists yet', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-2',
      uuid: 'asset-uuid-2',
      path: 'https://storage.example.com/generated-image.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      persistGenerationOutcomeAsset({
        outcome: {
          recipe: {
            id: null,
            uuid: 'recipe-uuid-2',
            product: 'image',
            mode: 'text-to-image',
            prompt: 'crystal river',
            negativePrompt: '',
            parameters: {
              seed: 42,
            },
          },
          execution: {
            id: null,
            uuid: 'execution-uuid-2',
            provider: 'google',
            providerModel: 'gemini-image',
          },
          artifactSet: {
            id: null,
            uuid: 'artifact-set-uuid-2',
          },
          delivery: {
            artifactId: null,
            artifactUuid: 'artifact-uuid-2',
            primaryResourceId: 'resource-db-2',
            resourceViewId: 'resource-view-2',
            url: 'https://tmp.example.com/generated-image.png',
            posterUrl: 'https://tmp.example.com/generated-image-poster.png',
          },
          primaryArtifact: {
            id: null,
            uuid: 'artifact-uuid-2',
            primaryResourceId: 'resource-db-2',
            resourceViewId: 'resource-view-2',
            type: 'image',
            resource: {
              id: 'resource-db-2',
              uuid: 'resource-uuid-2',
              url: 'https://tmp.example.com/generated-image.png',
            },
          },
        } as any,
        type: 'image',
        domain: 'image-studio',
        name: 'generated-image.png',
      })
    ).resolves.toMatchObject({
      assetId: 'asset-2',
      assetUuid: 'asset-uuid-2',
      path: 'https://storage.example.com/generated-image.png',
      url: 'https://storage.example.com/generated-image.png',
      sourceUrl: 'https://tmp.example.com/generated-image.png',
      deliveryUrl: 'https://tmp.example.com/generated-image.png',
      posterUrl: 'https://tmp.example.com/generated-image-poster.png',
      product: 'image',
      mode: 'text-to-image',
      provider: 'google',
      providerModel: 'gemini-image',
      prompt: 'crystal river',
      negativePrompt: '',
      parameters: {
        seed: 42,
      },
      recipeId: null,
      recipeUuid: 'recipe-uuid-2',
      executionId: null,
      executionUuid: 'execution-uuid-2',
      artifactSetId: null,
      artifactSetUuid: 'artifact-set-uuid-2',
      artifactId: null,
      artifactUuid: 'artifact-uuid-2',
      primaryResourceId: 'resource-db-2',
      primaryResourceUuid: 'resource-uuid-2',
      resourceViewId: 'resource-view-2',
      resourceViewUuid: null,
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://tmp.example.com/generated-image.png',
      'image',
      {
        name: 'generated-image.png',
        domain: 'image-studio',
      }
    );
  });

  it('does not fabricate assetUuid when uploaded outcome asset omits uuid', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-3',
      path: 'https://storage.example.com/generated-audio.wav',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    const persisted = await persistGenerationOutcomeAsset({
      outcome: {
        recipe: {
          id: null,
          uuid: 'recipe-uuid-3',
          product: 'audio',
          mode: 'text-to-audio',
          prompt: 'gentle rain ambience',
          negativePrompt: '',
          parameters: {},
        },
        execution: {
          id: null,
          uuid: 'execution-uuid-3',
          provider: 'volcano',
          providerModel: 'seed-audio',
        },
        artifactSet: {
          id: null,
          uuid: 'artifact-set-uuid-3',
        },
        delivery: {
          artifactId: null,
          artifactUuid: 'artifact-uuid-3',
          url: 'https://tmp.example.com/generated-audio.wav',
        },
        primaryArtifact: {
          id: null,
          uuid: 'artifact-uuid-3',
          type: 'audio',
          resource: {
            id: 'resource-db-3',
            uuid: 'resource-uuid-3',
            url: 'https://tmp.example.com/generated-audio.wav',
          },
        },
      } as any,
      type: 'audio',
      domain: 'audio-studio',
      name: 'generated-audio.wav',
    });

    expect(persisted).toMatchObject({
      assetId: 'asset-3',
      path: 'https://storage.example.com/generated-audio.wav',
      url: 'https://storage.example.com/generated-audio.wav',
      sourceUrl: 'https://tmp.example.com/generated-audio.wav',
      deliveryUrl: 'https://tmp.example.com/generated-audio.wav',
      artifactUuid: 'artifact-uuid-3',
      primaryResourceId: null,
      primaryResourceUuid: 'resource-uuid-3',
      resourceViewId: null,
      resourceViewUuid: null,
    });
    expect(persisted.assetUuid).toBeNull();
  });

  it('preserves canonical generated outcome paths while keeping delivery urls separate', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-video-path.mp4');

    await expect(
      persistGenerationOutcomeAsset({
        outcome: {
          recipe: {
            id: 'recipe-db-path-4',
            uuid: 'recipe-uuid-path-4',
            product: 'video',
            mode: 'text-to-video',
            prompt: 'city traffic timelapse',
            negativePrompt: '',
            parameters: {},
          },
          execution: {
            id: 'execution-db-path-4',
            uuid: 'execution-uuid-path-4',
            provider: 'openai',
            providerModel: 'sora-lite',
          },
          artifactSet: {
            id: 'artifact-set-db-path-4',
            uuid: 'artifact-set-uuid-path-4',
          },
          delivery: {
            assetId: 'asset-path-4',
            artifactId: 'artifact-db-path-4',
            artifactUuid: 'artifact-uuid-path-4',
            primaryResourceId: 'resource-db-path-4',
            resourceViewId: 'resource-view-path-4',
            url: 'https://tmp.example.com/generated-video-path.mp4',
          },
          primaryArtifact: {
            assetId: 'asset-path-4',
            id: 'artifact-db-path-4',
            uuid: 'artifact-uuid-path-4',
            primaryResourceId: 'resource-db-path-4',
            resourceViewId: 'resource-view-path-4',
            type: 'video',
            resource: {
              id: 'resource-db-path-4',
              uuid: 'resource-uuid-path-4',
              path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/video-path-4.mp4',
              url: 'https://tmp.example.com/generated-video-path.mp4',
            },
          },
        } as any,
        type: 'video',
        domain: 'video-studio',
        name: 'generated-video-path.mp4',
      })
    ).resolves.toMatchObject({
      assetId: 'asset-path-4',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/video-path-4.mp4',
      url: 'https://cdn.example.com/generated-video-path.mp4',
      sourceUrl: 'https://tmp.example.com/generated-video-path.mp4',
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
    expect(importAssetBySdk).not.toHaveBeenCalled();
  });
});
