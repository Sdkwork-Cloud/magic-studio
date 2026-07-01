import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateImage: vi.fn(),
  generateVideo: vi.fn(),
  persistGenerationOutcomeAsset: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', async () => {
  return {
    persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
  };
});

vi.mock('@sdkwork/magic-studio-image/services', () => {
  return {
    imageService: {
      generateImage: mocks.generateImage,
    },
  };
});

vi.mock('@sdkwork/magic-studio-video/services', async () => {
  const actual = await import('../../../sdkwork-magic-studio-video/src/services/videoRequestBuilder');
  return {
    buildUnifiedVideoGenerationRequest: actual.buildUnifiedVideoGenerationRequest,
    videoService: {
      generateVideo: mocks.generateVideo,
    },
  };
});

import {
  generateCanvasNodeMedia,
  normalizeCanvasVideoMode,
} from './canvasGenerationService';

describe('canvasGenerationService', () => {
  beforeEach(() => {
    mocks.generateImage.mockReset();
    mocks.generateVideo.mockReset();
    mocks.persistGenerationOutcomeAsset.mockReset();
  });

  it('routes canvas image generation through imageService and returns a persisted canvas resource', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'canvas-image-recipe-uuid-1',
        product: 'image',
        mode: 'text-to-image',
        prompt: 'floating glass city',
        negativePrompt: 'rain',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'canvas-image-execution-uuid-1',
        provider: 'app-image',
        providerModel: 'gemini-3-flash-image',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'canvas-image-artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-image.png',
        mimeType: 'image/png',
        width: 1280,
        height: 720,
        artifactUuid: 'canvas-image-artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'canvas-image-artifact-uuid-1',
        type: 'image',
        resource: {
          id: null,
          uuid: 'canvas-image-resource-uuid-1',
          url: 'https://example.com/generated-image.png',
          name: 'generated-image.png',
        },
      },
    };
    mocks.generateImage.mockResolvedValue(outcome);
    mocks.persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'canvas-image-asset-1',
      assetUuid: 'canvas-image-asset-uuid-1',
      primaryResourceId: 'canvas-image-resource-id-1',
      primaryResourceUuid: 'canvas-image-resource-uuid-1',
      resourceViewId: 'canvas-image-resource-view-id-1',
      resourceViewUuid: 'canvas-image-resource-view-uuid-1',
      recipeUuid: 'canvas-image-recipe-uuid-1',
      executionUuid: 'canvas-image-execution-uuid-1',
      artifactSetUuid: 'canvas-image-artifact-set-uuid-1',
      artifactUuid: 'canvas-image-artifact-uuid-1',
      url: 'https://storage.example.com/canvas-image.png',
      width: 1280,
      height: 720,
      mimeType: 'image/png',
      prompt: 'floating glass city',
      product: 'image',
      mode: 'text-to-image',
      provider: 'app-image',
      providerModel: 'gemini-3-flash-image',
    });

    const result = await generateCanvasNodeMedia({
      type: 'image',
      prompt: 'floating glass city',
      negativePrompt: 'rain',
      model: 'gemini-3-flash-image',
      aspectRatio: '16:9',
      referenceImages: [
        {
          id: 'canvas-ref-1',
          uuid: 'canvas-ref-uuid-1',
          assetId: 'canvas-ref-asset-1',
          assetUuid: 'canvas-ref-asset-uuid-1',
          primaryResourceId: 'canvas-ref-resource-1',
          primaryResourceUuid: 'canvas-ref-resource-uuid-1',
          resourceViewId: 'canvas-ref-view-1',
          resourceViewUuid: 'canvas-ref-view-uuid-1',
          name: 'reference-image.png',
          type: 'image',
          url: 'https://example.com/reference-image.png',
          width: 512,
          height: 512,
        },
      ],
    });

    expect(mocks.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'floating glass city',
        negativePrompt: 'rain',
        model: 'gemini-3-flash-image',
        aspectRatio: '16:9',
        referenceImage: expect.objectContaining({
          assetId: 'canvas-ref-asset-1',
          assetUuid: 'canvas-ref-asset-uuid-1',
          primaryResourceId: 'canvas-ref-resource-1',
          primaryResourceUuid: 'canvas-ref-resource-uuid-1',
          resourceViewId: 'canvas-ref-view-1',
          resourceViewUuid: 'canvas-ref-view-uuid-1',
          url: 'https://example.com/reference-image.png',
          type: 'image',
        }),
        referenceImages: [
          expect.objectContaining({
            assetId: 'canvas-ref-asset-1',
            resourceViewUuid: 'canvas-ref-view-uuid-1',
          }),
        ],
      })
    );
    expect(mocks.persistGenerationOutcomeAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome,
        type: 'image',
        domain: 'canvas',
        name: expect.stringMatching(/^canvas_gen_image_/),
      })
    );
    expect(result).toMatchObject({
      assetId: 'canvas-image-asset-1',
      assetUuid: 'canvas-image-asset-uuid-1',
      primaryResourceId: 'canvas-image-resource-id-1',
      primaryResourceUuid: 'canvas-image-resource-uuid-1',
      resourceViewId: 'canvas-image-resource-view-id-1',
      resourceViewUuid: 'canvas-image-resource-view-uuid-1',
      url: 'https://storage.example.com/canvas-image.png',
      path: 'https://storage.example.com/canvas-image.png',
      width: 1280,
      height: 720,
      type: 'image',
      metadata: expect.objectContaining({
        recipeUuid: 'canvas-image-recipe-uuid-1',
        executionUuid: 'canvas-image-execution-uuid-1',
        scopeDomain: 'canvas',
      }),
    });
  });

  it('falls back to metadata canonical identity when canvas image references have no top-level asset fields', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'canvas-image-recipe-uuid-meta-1',
        product: 'image',
        mode: 'image-to-image',
        prompt: 'restyle the reference',
        negativePrompt: '',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'canvas-image-execution-uuid-meta-1',
        provider: 'app-image',
        providerModel: 'gemini-3-flash-image',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'canvas-image-artifact-set-uuid-meta-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-image-meta.png',
        mimeType: 'image/png',
        width: 1024,
        height: 1024,
        artifactUuid: 'canvas-image-artifact-uuid-meta-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'canvas-image-artifact-uuid-meta-1',
        type: 'image',
        resource: {
          id: null,
          uuid: 'canvas-image-resource-uuid-meta-1',
          url: 'https://example.com/generated-image-meta.png',
          name: 'generated-image-meta.png',
        },
      },
    };
    mocks.generateImage.mockResolvedValue(outcome);
    mocks.persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'canvas-image-asset-meta-1',
      assetUuid: 'canvas-image-asset-uuid-meta-1',
      primaryResourceId: 'canvas-image-resource-id-meta-1',
      primaryResourceUuid: 'canvas-image-resource-uuid-meta-1',
      resourceViewId: 'canvas-image-resource-view-id-meta-1',
      resourceViewUuid: 'canvas-image-resource-view-uuid-meta-1',
      recipeUuid: 'canvas-image-recipe-uuid-meta-1',
      executionUuid: 'canvas-image-execution-uuid-meta-1',
      artifactSetUuid: 'canvas-image-artifact-set-uuid-meta-1',
      artifactUuid: 'canvas-image-artifact-uuid-meta-1',
      url: 'https://storage.example.com/canvas-image-meta.png',
      width: 1024,
      height: 1024,
      mimeType: 'image/png',
      prompt: 'restyle the reference',
      product: 'image',
      mode: 'image-to-image',
      provider: 'app-image',
      providerModel: 'gemini-3-flash-image',
    });

    await generateCanvasNodeMedia({
      type: 'image',
      prompt: 'restyle the reference',
      model: 'gemini-3-flash-image',
      referenceImages: [
        {
          id: 'canvas-ref-local-1',
          uuid: 'canvas-ref-local-uuid-1',
          name: 'reference-image.png',
          type: 'image',
          url: 'https://example.com/reference-image-meta.png',
          metadata: {
            assetId: 'canvas-ref-asset-meta-1',
            assetUuid: 'canvas-ref-asset-uuid-meta-1',
            primaryResourceId: 'canvas-ref-resource-meta-1',
            primaryResourceUuid: 'canvas-ref-resource-uuid-meta-1',
            resourceViewId: 'canvas-ref-view-meta-1',
            resourceViewUuid: 'canvas-ref-view-uuid-meta-1',
          },
        },
      ],
    });

    expect(mocks.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceImage: expect.objectContaining({
          uuid: 'canvas-ref-view-uuid-meta-1',
          assetId: 'canvas-ref-asset-meta-1',
          assetUuid: 'canvas-ref-asset-uuid-meta-1',
          primaryResourceId: 'canvas-ref-resource-meta-1',
          primaryResourceUuid: 'canvas-ref-resource-uuid-meta-1',
          resourceViewId: 'canvas-ref-view-meta-1',
          resourceViewUuid: 'canvas-ref-view-uuid-meta-1',
        }),
        referenceImages: [
          expect.objectContaining({
            uuid: 'canvas-ref-view-uuid-meta-1',
            assetId: 'canvas-ref-asset-meta-1',
            assetUuid: 'canvas-ref-asset-uuid-meta-1',
            primaryResourceId: 'canvas-ref-resource-meta-1',
            primaryResourceUuid: 'canvas-ref-resource-uuid-meta-1',
            resourceViewId: 'canvas-ref-view-meta-1',
            resourceViewUuid: 'canvas-ref-view-uuid-meta-1',
          }),
        ],
      })
    );
  });

  it('normalizes all_round canvas mode to smart_reference', () => {
    expect(normalizeCanvasVideoMode('all_round')).toBe('smart_reference');
    expect(normalizeCanvasVideoMode('start_end')).toBe('start_end');
    expect(normalizeCanvasVideoMode('unknown-mode')).toBe('smart_reference');
  });

  it('routes canvas video generation through videoService with a standard start/end request', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'canvas-video-recipe-uuid-1',
        product: 'video',
        mode: 'image-to-video',
        prompt: 'animate the scene',
        negativePrompt: 'blur',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'canvas-video-execution-uuid-1',
        provider: 'app-video',
        providerModel: 'seedance-v1',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'canvas-video-artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-video.mp4',
        posterUrl: 'https://example.com/generated-video-cover.png',
        mimeType: 'video/mp4',
        width: 1280,
        height: 720,
        duration: 5,
        artifactUuid: 'canvas-video-artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'canvas-video-artifact-uuid-1',
        type: 'video',
        resource: {
          id: null,
          uuid: 'canvas-video-resource-uuid-1',
          url: 'https://example.com/generated-video.mp4',
          name: 'generated-video.mp4',
        },
      },
    };
    mocks.generateVideo.mockResolvedValue(outcome);
    mocks.persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'canvas-video-asset-1',
      assetUuid: 'canvas-video-asset-uuid-1',
      primaryResourceId: 'canvas-video-resource-id-1',
      primaryResourceUuid: 'canvas-video-resource-uuid-1',
      resourceViewId: 'canvas-video-resource-view-id-1',
      resourceViewUuid: 'canvas-video-resource-view-uuid-1',
      recipeUuid: 'canvas-video-recipe-uuid-1',
      executionUuid: 'canvas-video-execution-uuid-1',
      artifactSetUuid: 'canvas-video-artifact-set-uuid-1',
      artifactUuid: 'canvas-video-artifact-uuid-1',
      url: 'https://storage.example.com/canvas-video.mp4',
      posterUrl: 'https://storage.example.com/canvas-video-cover.png',
      width: 1280,
      height: 720,
      duration: 5,
      mimeType: 'video/mp4',
      prompt: 'animate the scene',
      product: 'video',
      mode: 'image-to-video',
      provider: 'app-video',
      providerModel: 'seedance-v1',
    });

    const result = await generateCanvasNodeMedia({
      type: 'video',
      prompt: 'animate the scene',
      negativePrompt: 'blur',
      model: 'seedance-v1',
      aspectRatio: '16:9',
      resolution: '1080p',
      duration: '5s',
      videoMode: 'start_end',
      referenceImages: [
        {
          id: 'canvas-start-1',
          uuid: 'canvas-start-uuid-1',
          assetId: 'canvas-start-asset-1',
          assetUuid: 'canvas-start-asset-uuid-1',
          primaryResourceId: 'canvas-start-resource-1',
          primaryResourceUuid: 'canvas-start-resource-uuid-1',
          resourceViewId: 'canvas-start-view-1',
          resourceViewUuid: 'canvas-start-view-uuid-1',
          name: 'start-frame.png',
          type: 'image',
          url: 'https://example.com/start-frame.png',
        },
        {
          id: 'canvas-end-1',
          uuid: 'canvas-end-uuid-1',
          assetId: 'canvas-end-asset-1',
          assetUuid: 'canvas-end-asset-uuid-1',
          primaryResourceId: 'canvas-end-resource-1',
          primaryResourceUuid: 'canvas-end-resource-uuid-1',
          resourceViewId: 'canvas-end-view-1',
          resourceViewUuid: 'canvas-end-view-uuid-1',
          name: 'end-frame.png',
          type: 'image',
          url: 'https://example.com/end-frame.png',
        },
      ],
    });

    expect(mocks.generateVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        generationType: 'start_end',
        prompt: 'animate the scene',
        negativePrompt: 'blur',
        model: 'seedance-v1',
        resolution: '1080p',
        aspectRatio: '16:9',
        duration: '5s',
        assets: [
          expect.objectContaining({
            role: 'start_frame',
            type: 'image',
            assetId: 'canvas-start-asset-1',
            assetUuid: 'canvas-start-asset-uuid-1',
          }),
          expect.objectContaining({
            role: 'end_frame',
            type: 'image',
            assetId: 'canvas-end-asset-1',
            assetUuid: 'canvas-end-asset-uuid-1',
          }),
        ],
      })
    );
    expect(mocks.persistGenerationOutcomeAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome,
        type: 'video',
        domain: 'canvas',
        name: expect.stringMatching(/^canvas_gen_video_/),
      })
    );
    expect(result).toMatchObject({
      assetId: 'canvas-video-asset-1',
      assetUuid: 'canvas-video-asset-uuid-1',
      resourceViewUuid: 'canvas-video-resource-view-uuid-1',
      url: 'https://storage.example.com/canvas-video.mp4',
      thumbnailUrl: 'https://storage.example.com/canvas-video-cover.png',
      width: 1280,
      height: 720,
      duration: 5,
      type: 'video',
      metadata: expect.objectContaining({
        recipeUuid: 'canvas-video-recipe-uuid-1',
        executionUuid: 'canvas-video-execution-uuid-1',
        scopeDomain: 'canvas',
      }),
    });
  });

  it('falls back to metadata canonical identity when canvas video references have no top-level asset fields', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'canvas-video-recipe-uuid-meta-1',
        product: 'video',
        mode: 'image-to-video',
        prompt: 'animate the reference',
        negativePrompt: '',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'canvas-video-execution-uuid-meta-1',
        provider: 'app-video',
        providerModel: 'seedance-v1',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'canvas-video-artifact-set-uuid-meta-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-video-meta.mp4',
        posterUrl: 'https://example.com/generated-video-meta-cover.png',
        mimeType: 'video/mp4',
        width: 720,
        height: 1280,
        duration: 5,
        artifactUuid: 'canvas-video-artifact-uuid-meta-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'canvas-video-artifact-uuid-meta-1',
        type: 'video',
        resource: {
          id: null,
          uuid: 'canvas-video-resource-uuid-meta-1',
          url: 'https://example.com/generated-video-meta.mp4',
          name: 'generated-video-meta.mp4',
        },
      },
    };
    mocks.generateVideo.mockResolvedValue(outcome);
    mocks.persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'canvas-video-asset-meta-1',
      assetUuid: 'canvas-video-asset-uuid-meta-1',
      primaryResourceId: 'canvas-video-resource-id-meta-1',
      primaryResourceUuid: 'canvas-video-resource-uuid-meta-1',
      resourceViewId: 'canvas-video-resource-view-id-meta-1',
      resourceViewUuid: 'canvas-video-resource-view-uuid-meta-1',
      recipeUuid: 'canvas-video-recipe-uuid-meta-1',
      executionUuid: 'canvas-video-execution-uuid-meta-1',
      artifactSetUuid: 'canvas-video-artifact-set-uuid-meta-1',
      artifactUuid: 'canvas-video-artifact-uuid-meta-1',
      url: 'https://storage.example.com/canvas-video-meta.mp4',
      posterUrl: 'https://storage.example.com/canvas-video-meta-cover.png',
      width: 720,
      height: 1280,
      duration: 5,
      mimeType: 'video/mp4',
      prompt: 'animate the reference',
      product: 'video',
      mode: 'image-to-video',
      provider: 'app-video',
      providerModel: 'seedance-v1',
    });

    await generateCanvasNodeMedia({
      type: 'video',
      prompt: 'animate the reference',
      model: 'seedance-v1',
      videoMode: 'start_end',
      referenceImages: [
        {
          id: 'canvas-video-start-local-1',
          uuid: 'canvas-video-start-local-uuid-1',
          name: 'start-frame.png',
          type: 'image',
          url: 'https://example.com/start-frame-meta.png',
          metadata: {
            assetId: 'canvas-video-start-asset-meta-1',
            assetUuid: 'canvas-video-start-asset-uuid-meta-1',
            primaryResourceId: 'canvas-video-start-resource-meta-1',
            primaryResourceUuid: 'canvas-video-start-resource-uuid-meta-1',
            resourceViewId: 'canvas-video-start-view-meta-1',
            resourceViewUuid: 'canvas-video-start-view-uuid-meta-1',
          },
        },
        {
          id: 'canvas-video-end-local-1',
          uuid: 'canvas-video-end-local-uuid-1',
          name: 'end-frame.png',
          type: 'image',
          url: 'https://example.com/end-frame-meta.png',
          metadata: {
            assetId: 'canvas-video-end-asset-meta-1',
            assetUuid: 'canvas-video-end-asset-uuid-meta-1',
            primaryResourceId: 'canvas-video-end-resource-meta-1',
            primaryResourceUuid: 'canvas-video-end-resource-uuid-meta-1',
            resourceViewId: 'canvas-video-end-view-meta-1',
            resourceViewUuid: 'canvas-video-end-view-uuid-meta-1',
          },
        },
      ],
    });

    expect(mocks.generateVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: [
          expect.objectContaining({
            role: 'start_frame',
            value: 'canvas-video-start-view-uuid-meta-1',
            assetId: 'canvas-video-start-asset-meta-1',
            assetUuid: 'canvas-video-start-asset-uuid-meta-1',
            primaryResourceId: 'canvas-video-start-resource-meta-1',
            primaryResourceUuid: 'canvas-video-start-resource-uuid-meta-1',
            resourceViewId: 'canvas-video-start-view-meta-1',
            resourceViewUuid: 'canvas-video-start-view-uuid-meta-1',
            ref: expect.objectContaining({
              uuid: 'canvas-video-start-view-uuid-meta-1',
            }),
          }),
          expect.objectContaining({
            role: 'end_frame',
            value: 'canvas-video-end-view-uuid-meta-1',
            assetId: 'canvas-video-end-asset-meta-1',
            assetUuid: 'canvas-video-end-asset-uuid-meta-1',
            primaryResourceId: 'canvas-video-end-resource-meta-1',
            primaryResourceUuid: 'canvas-video-end-resource-uuid-meta-1',
            resourceViewId: 'canvas-video-end-view-meta-1',
            resourceViewUuid: 'canvas-video-end-view-uuid-meta-1',
            ref: expect.objectContaining({
              uuid: 'canvas-video-end-view-uuid-meta-1',
            }),
          }),
        ],
      })
    );
  });
});
