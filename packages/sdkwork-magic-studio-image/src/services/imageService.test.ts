import { access, readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGenerationOutcome } from '@sdkwork/magic-studio-core/ai';
import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-server';

const {
  serverClient,
  createImageGenerationTask,
  createImageVariationTask,
  createImageEditTask,
  createImageUpscaleTask,
  readImageGenerationTask,
  enhanceImageGenerationPrompt,
  assertRuntimeMagicStudioExecutionOperationReady,
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
  tryExtractInlineData,
} = vi.hoisted(() => {
  const serverClient = {
    createImageGenerationTask: vi.fn(),
    createImageVariationTask: vi.fn(),
    createImageEditTask: vi.fn(),
    createImageUpscaleTask: vi.fn(),
    readImageGenerationTask: vi.fn(),
    enhanceImageGenerationPrompt: vi.fn(),
  };

  return {
    serverClient,
    createImageGenerationTask: serverClient.createImageGenerationTask,
    createImageVariationTask: serverClient.createImageVariationTask,
    createImageEditTask: serverClient.createImageEditTask,
    createImageUpscaleTask: serverClient.createImageUpscaleTask,
    readImageGenerationTask: serverClient.readImageGenerationTask,
    enhanceImageGenerationPrompt: serverClient.enhanceImageGenerationPrompt,
    assertRuntimeMagicStudioExecutionOperationReady: vi.fn(async () => undefined),
    readDefaultPlatformRuntime: vi.fn(() => ({
      system: {
        kind: () => 'server',
      },
    })),
    createRuntimeMagicStudioServerClient: vi.fn(() => serverClient),
    tryExtractInlineData: vi.fn(async () => null),
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  assertRuntimeMagicStudioExecutionOperationReady,
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
}));

vi.mock('@sdkwork/magic-studio-core/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-core/services')>();

  return {
    ...actual,
    inlineDataService: {
      ...actual.inlineDataService,
      tryExtractInlineData,
    },
  };
});

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {},
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst: vi.fn(),
}));

import {
  imageService,
  resolveImageGenerationSource,
  setGenAIAdapter,
} from './imageService';
import { createImageInputResourceRef } from '../entities';
import { buildImageInputRefs } from './imageService';
import {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import { createGeneratedImageResult } from '../entities';

const createImageArtifact = (
  overrides: Partial<MagicStudioGenerationArtifact> = {},
): MagicStudioGenerationArtifact => ({
  id: 'artifact-1',
  uuid: 'artifact-uuid-1',
  type: 'image',
  role: 'primary',
  url: 'https://example.com/generated-image.png',
  mimeType: 'image/png',
  name: 'generated-image.png',
  width: 1280,
  height: 720,
  metadata: {
    aspectRatio: '16:9',
    source: 'test-runtime',
  },
  ...overrides,
});

const createImageTask = (
  overrides: Partial<MagicStudioGenerationTask> = {},
): MagicStudioGenerationTask => {
  const primaryArtifact =
    overrides.primaryArtifact === undefined
      ? createImageArtifact()
      : overrides.primaryArtifact;

  return {
    id: 'task-1',
    uuid: 'task-uuid-1',
    taskId: 'image-task-1',
    product: 'image',
    mode: 'text-to-image',
    status: 'succeeded',
    prompt: 'floating glass city',
    negativePrompt: 'rain, blur',
    provider: 'runtime-image',
    providerModel: 'gemini-2.5-flash-image',
    remoteJobId: 'image-task-1',
    progress: 100,
    inputRefs: [],
    artifacts: primaryArtifact ? [primaryArtifact] : [],
    primaryArtifact,
    parameters: {
      width: 1280,
      height: 720,
      aspectRatio: '16:9',
      steps: 30,
      guidance: 7,
      seed: 42,
      style: 'realistic',
      quality: 'hd',
    },
    providerPayload: {
      source: 'test-runtime',
    },
    createdAt: '2026-04-25T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:01.000Z',
    completedAt: '2026-04-25T00:00:01.000Z',
    ...overrides,
  };
};

const resetServerClient = (): void => {
  vi.clearAllMocks();

  createRuntimeMagicStudioServerClient.mockReturnValue(serverClient);
  readDefaultPlatformRuntime.mockReturnValue({
    system: {
      kind: () => 'server',
    },
  });
  assertRuntimeMagicStudioExecutionOperationReady.mockResolvedValue(undefined);
  vi.mocked(resolveAssetUrlByAssetIdFirst).mockResolvedValue(null);
  vi.mocked(importAssetBySdk).mockReset();
  vi.mocked(resolveAssetPrimaryUrlBySdk).mockReset();
  tryExtractInlineData.mockResolvedValue(null);

  createImageGenerationTask.mockResolvedValue({
    data: createImageTask({
      taskId: 'image-task-1',
      remoteJobId: 'image-task-1',
      primaryArtifact: createImageArtifact({
        url: 'https://example.com/generated-image.png',
        name: 'generated-image.png',
        width: 1280,
        height: 720,
        metadata: {
          aspectRatio: '16:9',
        },
      }),
    }),
  });
  createImageVariationTask.mockResolvedValue({
    data: createImageTask({
      taskId: 'image-variation-task-1',
      remoteJobId: 'image-variation-task-1',
      mode: 'variation',
      prompt: '',
      primaryArtifact: createImageArtifact({
        url: 'https://example.com/variation-image.png',
        name: 'variation-image.png',
        width: 1024,
        height: 1024,
        metadata: {
          aspectRatio: '1:1',
        },
      }),
    }),
  });
  createImageEditTask.mockResolvedValue({
    data: createImageTask({
      taskId: 'image-edit-task-1',
      remoteJobId: 'image-edit-task-1',
      mode: 'inpaint',
      primaryArtifact: createImageArtifact({
        url: 'https://example.com/edited-image.png',
        name: 'edited-image.png',
        width: 1024,
        height: 1024,
        metadata: {
          aspectRatio: '1:1',
        },
      }),
    }),
  });
  createImageUpscaleTask.mockResolvedValue({
    data: createImageTask({
      taskId: 'image-upscale-task-1',
      remoteJobId: 'image-upscale-task-1',
      mode: 'upscale',
      providerModel: 'upscaler-pro',
      primaryArtifact: createImageArtifact({
        url: 'https://example.com/upscaled-image.png',
        name: 'upscaled-image.png',
        width: 2048,
        height: 2048,
        metadata: {
          aspectRatio: '1:1',
        },
      }),
    }),
  });
  readImageGenerationTask.mockResolvedValue({
    data: createImageTask({
      taskId: 'image-task-2',
      remoteJobId: 'image-task-2',
      primaryArtifact: createImageArtifact({
        url: 'https://example.com/polled-image.png',
        name: 'polled-image.png',
        width: 1024,
        height: 1024,
        metadata: {
          aspectRatio: '1:1',
        },
      }),
    }),
  });
  enhanceImageGenerationPrompt.mockResolvedValue({
    data: {
      prompt: 'cinematic floating glass city at sunset, volumetric light, ultra detailed',
    },
  });
};

describe('imageService', () => {
  beforeEach(() => {
    resetServerClient();
  });

  afterEach(() => {
    setGenAIAdapter(null as any);
  });

  it('resolves non-url references through canonical asset identity instead of resource view ids', async () => {
    vi.mocked(resolveAssetUrlByAssetIdFirst).mockResolvedValue('https://cdn.example.com/asset-image.png');

    const result = await resolveImageGenerationSource(createImageInputResourceRef({
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'primary-resource-1',
      primaryResourceUuid: 'primary-resource-uuid-1',
      resourceViewId: 'resource-view-1',
      resourceViewUuid: 'resource-view-uuid-1',
    }));

    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith({
      assetId: 'asset-db-1',
    });
    expect(result).toBe('https://cdn.example.com/asset-image.png');
  });

  it('does not treat resource identifiers as file paths when no url or asset id exists', async () => {
    vi.mocked(resolveAssetUrlByAssetIdFirst).mockReset();

    const result = await resolveImageGenerationSource(createImageInputResourceRef({
      primaryResourceId: 'primary-resource-2',
      primaryResourceUuid: 'primary-resource-uuid-2',
      resourceViewId: 'resource-view-2',
      resourceViewUuid: 'resource-view-uuid-2',
    }));

    expect(resolveAssetUrlByAssetIdFirst).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('does not return canonical locators as transport urls when image delivery resolution misses', async () => {
    vi.mocked(resolveAssetUrlByAssetIdFirst).mockResolvedValue(null);

    const result = await resolveImageGenerationSource(createImageInputResourceRef({
      assetUuid: 'locator-image-asset-uuid-1',
      path: 'assets://workspaces/ws-8/projects/proj-8/media/originals/image/reference-locator.png',
      name: 'Locator Reference',
    }));

    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith(
      'assets://workspaces/ws-8/projects/proj-8/media/originals/image/reference-locator.png'
    );
    expect(result).toBeNull();
  });

  it('builds canonical media input refs from image resource refs', () => {
    const firstRef = createImageInputResourceRef({
      assetId: 'image-asset-1',
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: 'image-resource-1',
      primaryResourceUuid: 'image-resource-uuid-1',
      resourceViewId: 'image-view-1',
      resourceViewUuid: 'image-view-uuid-1',
      url: 'https://example.com/reference-1.png',
      name: 'Reference 1',
    });
    const secondRef = createImageInputResourceRef({
      assetId: 'image-asset-2',
      assetUuid: 'image-asset-uuid-2',
      primaryResourceId: 'image-resource-2',
      primaryResourceUuid: 'image-resource-uuid-2',
      resourceViewId: 'image-view-2',
      resourceViewUuid: 'image-view-uuid-2',
      url: 'https://example.com/reference-2.png',
      name: 'Reference 2',
    });

    expect(
      buildImageInputRefs({
        prompt: 'floating glass city',
        referenceImage: firstRef,
        referenceImages: [firstRef, secondRef],
      })
    ).toEqual([
      expect.objectContaining({
        uuid: 'image-view-uuid-1',
        role: 'reference',
        assetId: 'image-asset-1',
        assetUuid: 'image-asset-uuid-1',
      }),
      expect.objectContaining({
        uuid: 'image-view-uuid-2',
        role: 'reference',
        assetId: 'image-asset-2',
        assetUuid: 'image-asset-uuid-2',
      }),
    ]);
  });

  it('returns an execution-aware outcome from adapter overrides', async () => {
    setGenAIAdapter({
      generateImage: async (config) => createGenerationOutcome({
        product: 'image',
        mode: 'text-to-image',
        provider: 'test-provider',
        providerModel: 'test-image-model',
        prompt: config.prompt,
        parameters: {
          aspectRatio: config.aspectRatio || '1:1',
        },
        artifact: {
          type: 'image',
          url: 'https://example.com/generated.png',
          mimeType: 'image/png',
          name: 'generated.png',
        },
      }),
      enhancePrompt: async (prompt) => prompt,
    });

    const result = await imageService.generateImage({
      prompt: 'floating glass city',
      aspectRatio: '16:9',
    });

    expect(result.delivery.url).toBe('https://example.com/generated.png');
    expect(result.execution.provider).toBe('test-provider');
    expect(result.execution.providerModel).toBe('test-image-model');
    expect(result.recipe.parameters).toMatchObject({
      aspectRatio: '16:9',
    });
  });

  it('routes image generation through the canonical runtime server client', async () => {
    const reference = createImageInputResourceRef({
      assetUuid: 'image-asset-uuid-1',
      resourceViewUuid: 'image-view-uuid-1',
      url: 'https://example.com/reference-1.png',
      name: 'Reference 1',
      mimeType: 'image/png',
    });

    const outcome = await imageService.generateImage({
      prompt: 'floating glass city',
      negativePrompt: 'rain, blur',
      model: 'gemini-2.5-flash-image',
      width: 1280,
      height: 720,
      quality: 'hd',
      style: 'realistic',
      steps: 30,
      guidance: 7,
      aspectRatio: '16:9',
      seed: 42,
      referenceImage: reference,
    });

    expect(readDefaultPlatformRuntime).toHaveBeenCalledWith('ImageService');
    expect(createRuntimeMagicStudioServerClient).toHaveBeenCalledTimes(1);
    expect(assertRuntimeMagicStudioExecutionOperationReady).toHaveBeenCalledWith(
      'image-generation',
      'create',
      { feature: 'ImageService' },
    );
    expect(createImageGenerationTask).toHaveBeenCalledWith({
      prompt: 'floating glass city',
      negativePrompt: 'rain, blur',
      model: 'gemini-2.5-flash-image',
      width: 1280,
      height: 720,
      quality: 'hd',
      style: 'realistic',
      steps: 30,
      guidance: 7,
      aspectRatio: '16:9',
      seed: 42,
      referenceImages: [
        expect.objectContaining({
          assetUuid: 'image-asset-uuid-1',
          resourceViewUuid: 'image-view-uuid-1',
          url: 'https://example.com/reference-1.png',
          type: 'image',
          role: 'reference',
          name: 'Reference 1',
          mimeType: 'image/png',
        }),
      ],
    });
    expect(outcome.delivery.url).toBe('https://example.com/generated-image.png');
    expect(outcome.delivery.mimeType).toBe('image/png');
    expect(outcome.delivery.width).toBe(1280);
    expect(outcome.delivery.height).toBe(720);
    expect(outcome.execution.provider).toBe('runtime-image');
    expect(outcome.execution.providerModel).toBe('gemini-2.5-flash-image');
    expect(outcome.execution.remoteJobId).toBe('image-task-1');
    expect(outcome.recipe.prompt).toBe('floating glass city');
    expect(outcome.recipe.negativePrompt).toBe('rain, blur');
    expect(outcome.recipe.parameters).toMatchObject({
      aspectRatio: '16:9',
      width: 1280,
      height: 720,
      steps: 30,
      guidance: 7,
      seed: 42,
      style: 'realistic',
      model: 'gemini-2.5-flash-image',
      quality: 'hd',
      referenceCount: 1,
    });
  });

  it('routes reference-only image variation through the runtime server variation endpoint', async () => {
    const reference = createImageInputResourceRef({
      assetUuid: 'variation-image-asset-uuid-1',
      resourceViewUuid: 'variation-image-view-uuid-1',
      url: 'https://example.com/variation-reference.png',
      name: 'Variation Reference',
      mimeType: 'image/png',
    });

    const outcome = await imageService.generateImage({
      prompt: '',
      model: 'gemini-2.5-flash-image',
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
      referenceImage: reference,
    });

    expect(assertRuntimeMagicStudioExecutionOperationReady).toHaveBeenCalledWith(
      'image-generation',
      'variation',
      { feature: 'ImageService' },
    );
    expect(createImageVariationTask).toHaveBeenCalledWith({
      prompt: '',
      model: 'gemini-2.5-flash-image',
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
      referenceImages: [
        expect.objectContaining({
          assetUuid: 'variation-image-asset-uuid-1',
          resourceViewUuid: 'variation-image-view-uuid-1',
          url: 'https://example.com/variation-reference.png',
          type: 'image',
          role: 'reference',
          name: 'Variation Reference',
          mimeType: 'image/png',
        }),
      ],
    });
    expect(createImageGenerationTask).not.toHaveBeenCalled();
    expect(outcome.delivery.url).toBe('https://example.com/variation-image.png');
    expect(outcome.recipe.mode).toBe('variation');
    expect(outcome.recipe.parameters).toMatchObject({
      referenceCount: 1,
      model: 'gemini-2.5-flash-image',
    });
  });

  it('keeps canonical locator references out of image request transport urls', async () => {
    const reference = createImageInputResourceRef({
      assetUuid: 'locator-image-asset-uuid-2',
      path: 'assets://workspaces/ws-9/projects/proj-9/media/originals/image/reference-locator-2.png',
      name: 'Locator Variation Reference',
      mimeType: 'image/png',
    });

    await imageService.generateImage({
      prompt: '',
      model: 'gemini-2.5-flash-image',
      referenceImage: reference,
    });

    const requestCalls = createImageVariationTask.mock.calls as unknown as Array<[Record<string, any>]>;
    const requestBody = requestCalls[0]?.[0];
    expect(requestBody).toBeTruthy();
    expect(requestBody.referenceImages[0]).toMatchObject({
      assetUuid: 'locator-image-asset-uuid-2',
      type: 'image',
      role: 'reference',
      path: 'assets://workspaces/ws-9/projects/proj-9/media/originals/image/reference-locator-2.png',
      name: 'Locator Variation Reference',
      mimeType: 'image/png',
    });
    expect(requestBody.referenceImages[0]).not.toHaveProperty('url');
  });

  it('polls readImageGenerationTask through the runtime server client when create is async-only', async () => {
    createImageGenerationTask.mockResolvedValueOnce({
      data: createImageTask({
        taskId: 'image-task-2',
        remoteJobId: 'image-task-2',
        status: 'processing',
        progress: 20,
        artifacts: [],
        primaryArtifact: null,
        completedAt: null,
      }),
    });

    const outcome = await imageService.generateImage({
      prompt: 'misty forest dawn',
      model: 'gemini-2.5-flash-image',
    });

    expect(readImageGenerationTask).toHaveBeenCalledWith('image-task-2');
    expect(outcome.delivery.url).toBe('https://example.com/polled-image.png');
    expect(outcome.execution.remoteJobId).toBe('image-task-2');
    expect(outcome.execution.providerModel).toBe('gemini-2.5-flash-image');
  });

  it('uses the same runtime server client instance for image create and polling', async () => {
    const customServerClient = {
      ...serverClient,
      createImageGenerationTask: vi.fn(async () => ({
        data: createImageTask({
          taskId: 'image-task-3',
          remoteJobId: 'image-task-3',
          status: 'processing',
          progress: 10,
          artifacts: [],
          primaryArtifact: null,
          completedAt: null,
        }),
      })),
      readImageGenerationTask: vi.fn(async (taskId: string) => ({
        data: createImageTask({
          taskId,
          remoteJobId: taskId,
          primaryArtifact: createImageArtifact({
            url: 'https://example.com/bound-image.png',
            name: 'bound-image.png',
            width: 1024,
            height: 1024,
          }),
        }),
      })),
    };
    createRuntimeMagicStudioServerClient.mockReturnValueOnce(customServerClient);

    const outcome = await imageService.generateImage({
      prompt: 'bound image polling',
      model: 'gemini-2.5-flash-image',
    });

    expect(customServerClient.createImageGenerationTask).toHaveBeenCalledTimes(1);
    expect(customServerClient.readImageGenerationTask).toHaveBeenCalledWith('image-task-3');
    expect(outcome.delivery.url).toBe('https://example.com/bound-image.png');
  });

  it('throws the business failure message when createImageGenerationTask returns a failure code', async () => {
    createImageGenerationTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'image create failed',
    } as any);

    await expect(
      imageService.generateImage({
        prompt: 'broken image request',
        model: 'gemini-2.5-flash-image',
      })
    ).rejects.toThrow('image create failed');
  });

  it('throws the business failure message when readImageGenerationTask returns a failure code', async () => {
    createImageGenerationTask.mockResolvedValueOnce({
      data: createImageTask({
        taskId: 'image-task-4',
        remoteJobId: 'image-task-4',
        status: 'processing',
        progress: 20,
        artifacts: [],
        primaryArtifact: null,
        completedAt: null,
      }),
    });
    readImageGenerationTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'image poll failed',
    } as any);

    await expect(
      imageService.generateImage({
        prompt: 'broken image polling',
        model: 'gemini-2.5-flash-image',
      })
    ).rejects.toThrow('image poll failed');
  });

  it('routes prompt enhancement through the canonical runtime server client', async () => {
    const enhanced = await imageService.enhancePrompt('floating glass city');

    expect(createImageGenerationTask).not.toHaveBeenCalled();
    expect(createImageVariationTask).not.toHaveBeenCalled();
    expect(createImageEditTask).not.toHaveBeenCalled();
    expect(createImageUpscaleTask).not.toHaveBeenCalled();
    expect(readDefaultPlatformRuntime).toHaveBeenCalledWith('ImageService');
    expect(createRuntimeMagicStudioServerClient).toHaveBeenCalledTimes(1);
    expect(enhanceImageGenerationPrompt).toHaveBeenCalledWith({
      prompt: 'floating glass city',
      scene: 'image-generation',
      maxWords: 100,
    });
    expect(enhanced).toBe(
      'cinematic floating glass city at sunset, volumetric light, ultra detailed'
    );
  });

  it('throws the server failure message when runtime prompt enhancement fails', async () => {
    enhanceImageGenerationPrompt.mockRejectedValueOnce(new Error('image prompt enhance failed'));

    await expect(imageService.enhancePrompt('broken prompt')).rejects.toThrow(
      'image prompt enhance failed'
    );
  });

  it('throws when runtime prompt enhancement returns an empty prompt', async () => {
    enhanceImageGenerationPrompt.mockResolvedValueOnce({
      data: {
        prompt: '   ',
      },
    });

    await expect(imageService.enhancePrompt('keep me honest')).rejects.toThrow(
      'Image prompt enhancement returned an empty prompt',
    );
  });

  it('routes image edit through the runtime server edit endpoint with canonical source and mask refs', async () => {
    const inlineMaskBytes = new Uint8Array([77, 65, 83, 75]);
    tryExtractInlineData.mockResolvedValueOnce(inlineMaskBytes as any);
    vi.mocked(importAssetBySdk).mockResolvedValueOnce({
      id: 'mask-asset-1',
      uuid: 'mask-resource-view-uuid-1',
      name: 'mask.png',
      path: 'https://storage.example.com/mask.png',
      metadata: {
        assetUuid: 'mask-asset-uuid-1',
      },
    } as any);
    vi.mocked(resolveAssetPrimaryUrlBySdk).mockResolvedValueOnce('https://cdn.example.com/mask.png');

    const outcome = await imageService.editImage({
      source: createGeneratedImageResult({
        uuid: 'source-image-uuid-1',
        assetId: 'source-asset-1',
        assetUuid: 'source-asset-uuid-1',
        resourceViewUuid: 'source-resource-view-uuid-1',
        prompt: 'cinematic portrait',
        negativePrompt: 'blurry',
        width: 1024,
        height: 1024,
        resource: {
          id: null,
          uuid: 'source-resource-view-uuid-1',
          assetId: 'source-asset-1',
          assetUuid: 'source-asset-uuid-1',
          url: 'https://storage.example.com/source.png',
          mimeType: 'image/png',
          name: 'source.png',
          width: 1024,
          height: 1024,
        },
      }),
      mode: 'remove',
      mask: 'data:image/png;base64,MASK_BASE64',
    });

    expect(importAssetBySdk).toHaveBeenCalledWith(
      {
        name: expect.stringMatching(/^image-edit-mask-/),
        data: inlineMaskBytes,
      },
      'image',
      { domain: 'image-studio' }
    );
    expect(createImageEditTask).toHaveBeenCalledWith(expect.objectContaining({
      prompt: 'Remove the masked content and reconstruct the area naturally while preserving the original style. Source style: cinematic portrait',
      negativePrompt: 'blurry',
      model: undefined,
      strength: 1,
      format: 'png',
      n: 1,
      source: expect.objectContaining({
          assetId: 'source-asset-1',
          assetUuid: 'source-asset-uuid-1',
          resourceViewUuid: 'source-resource-view-uuid-1',
          url: 'https://storage.example.com/source.png',
          type: 'image',
          role: 'source-image',
          name: 'source.png',
          mimeType: 'image/png',
          resource: expect.objectContaining({
            width: 1024,
            height: 1024,
          }),
      }),
      mask: expect.objectContaining({
        assetUuid: 'mask-asset-uuid-1',
        url: 'https://cdn.example.com/mask.png',
        type: 'image',
        role: 'mask',
        name: 'mask.png',
      }),
    }));
    expect(outcome.delivery.url).toBe('https://example.com/edited-image.png');
    expect(outcome.recipe.mode).toBe('inpaint');
    expect(outcome.recipe.parameters).toMatchObject({
      editorAction: 'remove',
      strength: 1,
      format: 'png',
      referenceCount: 1,
      maskAssetCount: 1,
    });
  });

  it('throws the business failure message when createImageEditTask returns a failure code', async () => {
    createImageEditTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'image edit failed',
    } as any);

    await expect(
      imageService.editImage({
        mode: 'inpaint',
        mask: null,
        source: createGeneratedImageResult({
          uuid: 'source-image-edit-error',
          assetId: 'source-asset-edit-error',
          assetUuid: 'source-asset-edit-error-uuid',
          resource: {
            id: null,
            uuid: 'source-resource-edit-error',
            assetId: 'source-asset-edit-error',
            assetUuid: 'source-asset-edit-error-uuid',
            url: 'https://storage.example.com/source-edit-error.png',
            mimeType: 'image/png',
            name: 'source-edit-error.png',
            width: 1024,
            height: 1024,
          },
        }),
      })
    ).rejects.toThrow('image edit failed');
  });

  it('routes image upscale through the runtime server upscale endpoint', async () => {
    const outcome = await imageService.upscaleImage({
      source: createGeneratedImageResult({
        uuid: 'source-image-uuid-2',
        assetId: 'source-asset-2',
        assetUuid: 'source-asset-uuid-2',
        width: 1024,
        height: 1024,
        resource: {
          id: null,
          uuid: 'source-resource-view-uuid-2',
          assetId: 'source-asset-2',
          assetUuid: 'source-asset-uuid-2',
          url: 'https://storage.example.com/source-2.png',
          mimeType: 'image/png',
          name: 'source-2.png',
          width: 1024,
          height: 1024,
        },
      }),
      scale: 4,
      model: 'upscaler-pro',
      targetWidth: 2048,
      targetHeight: 2048,
      format: 'png',
      n: 1,
    });

    expect(createImageUpscaleTask).toHaveBeenCalledWith({
      prompt: 'Upscale the source image while preserving details and overall composition.',
      negativePrompt: undefined,
      model: 'upscaler-pro',
      scale: 4,
      targetWidth: 2048,
      targetHeight: 2048,
      format: 'png',
      n: 1,
      source: expect.objectContaining({
          assetId: 'source-asset-2',
          assetUuid: 'source-asset-uuid-2',
          url: 'https://storage.example.com/source-2.png',
          type: 'image',
          role: 'source-image',
          name: 'source-2.png',
          mimeType: 'image/png',
      }),
    });
    expect(outcome.delivery.url).toBe('https://example.com/upscaled-image.png');
    expect(outcome.recipe.mode).toBe('upscale');
    expect(outcome.recipe.parameters).toMatchObject({
      scale: 4,
      targetWidth: 2048,
      targetHeight: 2048,
      format: 'png',
      referenceCount: 1,
    });
  });

  it('throws the business failure message when createImageUpscaleTask returns a failure code', async () => {
    createImageUpscaleTask.mockResolvedValueOnce({
      code: '5000',
      msg: 'image upscale failed',
    } as any);

    await expect(
      imageService.upscaleImage({
        source: createGeneratedImageResult({
          uuid: 'source-image-upscale-error',
          assetId: 'source-asset-upscale-error',
          assetUuid: 'source-asset-upscale-error-uuid',
          resource: {
            id: null,
            uuid: 'source-resource-upscale-error',
            assetId: 'source-asset-upscale-error',
            assetUuid: 'source-asset-upscale-error-uuid',
            url: 'https://storage.example.com/source-upscale-error.png',
            mimeType: 'image/png',
            name: 'source-upscale-error.png',
            width: 1024,
            height: 1024,
          },
        }),
        scale: 2,
      })
    ).rejects.toThrow('image upscale failed');
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./imageService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('does not import or call legacy app SDK generation boundaries', async () => {
    const source = await readFile(
      new URL('./imageService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('getAppSdkClientWithSession')).toBe(false);
    expect(source.includes('@sdkwork/app-sdk')).toBe(false);
    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(source.includes('App SDK generation')).toBe(false);
  });

  it('ships an image service contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./imageService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('keeps image contract guards on runtime server boundaries', async () => {
    const contractFiles = [
      './imageService.contract-typecheck.ts',
      './imageGeneration.contract-typecheck.ts',
      './imageVariation.contract-typecheck.ts',
      './imageEdit.contract-typecheck.ts',
      './imageUpscale.contract-typecheck.ts',
      './imagePromptEnhance.contract-typecheck.ts',
    ];

    const sources = await Promise.all(
      contractFiles.map((file) => readFile(new URL(file, import.meta.url), 'utf8')),
    );
    const combined = sources.join('\n');

    expect(combined.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(combined.includes('@sdkwork/app-sdk')).toBe(false);
    expect(combined.includes('AppSdkClient')).toBe(false);
    expect(combined.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });
});
