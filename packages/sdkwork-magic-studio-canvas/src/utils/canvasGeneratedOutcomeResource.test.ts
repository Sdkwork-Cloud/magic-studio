import { describe, expect, it } from 'vitest';

import { createGenerationOutcome } from '@sdkwork/magic-studio-core/ai';

import { toCanvasGeneratedResource } from './canvasGeneratedOutcomeResource';

describe('toCanvasGeneratedResource', () => {
  it('maps a persisted generation outcome into a canvas media resource', () => {
    const outcome = createGenerationOutcome({
      product: 'image',
      mode: 'text-to-image',
      provider: 'test-provider',
      providerModel: 'test-image-model',
      prompt: 'cinematic skyline',
      artifact: {
        type: 'image',
        url: 'data:image/png;base64,abc123',
        mimeType: 'image/png',
        width: 1280,
        height: 720,
        name: 'skyline.png',
      },
    });

    const resource = toCanvasGeneratedResource({
      outcome,
      persisted: {
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/skyline.png',
        url: 'https://cdn.example.com/skyline.png',
        sourceUrl: 'data:image/png;base64,abc123',
        deliveryUrl: 'data:image/png;base64,abc123',
        posterUrl: 'https://cdn.example.com/skyline-poster.png',
        product: 'image',
        mode: 'text-to-image',
        provider: 'test-provider',
        providerModel: 'persisted-image-model',
        prompt: 'persisted skyline prompt',
        negativePrompt: '',
        parameters: {
          aspectRatio: '16:9',
        },
        recipeId: 'recipe-db-persisted',
        recipeUuid: 'recipe-uuid-persisted',
        executionId: 'execution-db-persisted',
        executionUuid: 'execution-uuid-persisted',
        artifactSetId: 'artifact-set-db-persisted',
        artifactSetUuid: 'artifact-set-uuid-persisted',
        artifactId: 'artifact-db-persisted',
        artifactUuid: 'artifact-uuid-persisted',
        primaryResourceId: 'resource-db-persisted',
        primaryResourceUuid: 'resource-uuid-persisted',
        resourceViewId: 'resource-view-persisted',
        resourceViewUuid: 'resource-view-uuid-persisted',
      },
      fallbackType: 'image',
    });

    expect(resource).toMatchObject({
      id: 'asset-1',
      uuid: 'resource-view-uuid-persisted',
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-db-persisted',
      primaryResourceUuid: 'resource-uuid-persisted',
      resourceViewId: 'resource-view-persisted',
      resourceViewUuid: 'resource-view-uuid-persisted',
      type: 'image',
      url: 'https://cdn.example.com/skyline.png',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/skyline.png',
      width: 1280,
      height: 720,
      metadata: expect.objectContaining({
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/generated/skyline.png',
        sourceUrl: 'data:image/png;base64,abc123',
        primaryResourceId: 'resource-db-persisted',
        primaryResourceUuid: 'resource-uuid-persisted',
        resourceViewId: 'resource-view-persisted',
        resourceViewUuid: 'resource-view-uuid-persisted',
        recipeUuid: 'recipe-uuid-persisted',
        executionUuid: 'execution-uuid-persisted',
        artifactSetUuid: 'artifact-set-uuid-persisted',
        artifactUuid: 'artifact-uuid-persisted',
        providerModel: 'persisted-image-model',
        prompt: 'persisted skyline prompt',
      }),
    });
  });

  it('falls back to explicit resource-view identity when persisted assetUuid is unavailable', () => {
    const outcome = createGenerationOutcome({
      product: 'video',
      mode: 'text-to-video',
      provider: 'test-provider',
      providerModel: 'test-video-model',
      prompt: 'city flythrough',
      artifact: {
        type: 'video',
        url: 'https://tmp.example.com/city.mp4',
        mimeType: 'video/mp4',
        name: 'city.mp4',
      },
    });

    const resource = toCanvasGeneratedResource({
      outcome,
      persisted: {
        assetId: 'asset-2',
        assetUuid: null,
        path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/city.mp4',
        url: 'https://cdn.example.com/city.mp4',
        sourceUrl: 'https://tmp.example.com/city.mp4',
        deliveryUrl: 'https://cdn.example.com/city.mp4',
        posterUrl: undefined,
        product: 'video',
        mode: 'text-to-video',
        provider: 'test-provider',
        providerModel: 'persisted-video-model',
        prompt: 'persisted city prompt',
        negativePrompt: '',
        parameters: {},
        recipeId: null,
        recipeUuid: 'recipe-uuid-video',
        executionId: null,
        executionUuid: 'execution-uuid-video',
        artifactSetId: null,
        artifactSetUuid: 'artifact-set-uuid-video',
        artifactId: null,
        artifactUuid: 'artifact-uuid-video',
        primaryResourceId: 'resource-db-video',
        primaryResourceUuid: 'resource-uuid-video',
        resourceViewId: 'resource-view-video',
        resourceViewUuid: 'resource-view-uuid-video',
      },
      fallbackType: 'video',
    });

    expect(resource).toMatchObject({
      id: 'asset-2',
      uuid: 'resource-view-uuid-video',
      assetId: 'asset-2',
      assetUuid: null,
      primaryResourceId: 'resource-db-video',
      primaryResourceUuid: 'resource-uuid-video',
      resourceViewId: 'resource-view-video',
      resourceViewUuid: 'resource-view-uuid-video',
      type: 'video',
      url: 'https://cdn.example.com/city.mp4',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/city.mp4',
      metadata: expect.objectContaining({
        assetId: 'asset-2',
        assetUuid: null,
        canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/generated/city.mp4',
        primaryResourceUuid: 'resource-uuid-video',
        resourceViewUuid: 'resource-view-uuid-video',
      }),
    });
  });
});
