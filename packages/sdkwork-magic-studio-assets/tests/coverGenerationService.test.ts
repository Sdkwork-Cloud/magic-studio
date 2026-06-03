import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateImage: vi.fn(),
  persistGenerationOutcomeAsset: vi.fn(),
  getCoverPromptSuggestions: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', async () => {
  const actual = await vi.importActual<typeof import('@sdkwork/magic-studio-core/sdk')>('@sdkwork/magic-studio-core/sdk');
  return {
    ...actual,
    getAppSdkClientWithSession: () => ({
      generation: {
        getCoverPromptSuggestions: mocks.getCoverPromptSuggestions,
      },
    }),
  };
});

vi.mock('../src/services/generatedOutcomeAssetPersistence', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

import {
  generateAssetCoverImage,
  suggestAssetCoverPrompts,
} from '../src/services/coverGenerationService';
import {
  resetAssetCoverGenerationAdapter,
  setAssetCoverGenerationAdapter,
} from '../src/services/coverGenerationAdapter';

describe('coverGenerationService', () => {
  beforeEach(() => {
    mocks.generateImage.mockReset();
    mocks.persistGenerationOutcomeAsset.mockReset();
    mocks.getCoverPromptSuggestions.mockReset();
    resetAssetCoverGenerationAdapter();
    setAssetCoverGenerationAdapter({
      generateImage: mocks.generateImage,
    });
  });

  it('routes asset cover generation through imageService and persists the result as an asset-center image', async () => {
    const outcome = {
      recipe: {
        id: null,
        uuid: 'asset-cover-recipe-uuid-1',
        product: 'image',
        mode: 'text-to-image',
        prompt: 'cinematic startup workspace cover',
        negativePrompt: 'blur',
        inputRefs: [],
        parameters: {},
      },
      execution: {
        id: null,
        uuid: 'asset-cover-execution-uuid-1',
        provider: 'app-image',
        providerModel: 'gemini-3-flash-image',
        status: 'succeeded',
      },
      artifactSet: {
        id: null,
        uuid: 'asset-cover-artifact-set-uuid-1',
        artifacts: [],
      },
      delivery: {
        url: 'https://example.com/generated-cover.png',
        mimeType: 'image/png',
        width: 1536,
        height: 1024,
        artifactUuid: 'asset-cover-artifact-uuid-1',
      },
      primaryArtifact: {
        id: null,
        uuid: 'asset-cover-artifact-uuid-1',
        type: 'image',
        resource: {
          id: null,
          uuid: 'asset-cover-resource-uuid-1',
          url: 'https://example.com/generated-cover.png',
          name: 'generated-cover.png',
        },
      },
    };
    const persisted = {
      assetId: 'asset-cover-asset-1',
      assetUuid: 'asset-cover-asset-uuid-1',
      path: 'https://storage.example.com/generated-cover.png',
      url: 'https://storage.example.com/generated-cover.png',
      sourceUrl: 'https://example.com/generated-cover.png',
      deliveryUrl: 'https://example.com/generated-cover.png',
      width: 1536,
      height: 1024,
      mimeType: 'image/png',
      product: 'image',
      mode: 'text-to-image',
      provider: 'app-image',
      providerModel: 'gemini-3-flash-image',
      prompt: 'cinematic startup workspace cover',
      negativePrompt: 'blur',
      parameters: {},
      recipeId: null,
      recipeUuid: 'asset-cover-recipe-uuid-1',
      executionId: null,
      executionUuid: 'asset-cover-execution-uuid-1',
      artifactSetId: null,
      artifactSetUuid: 'asset-cover-artifact-set-uuid-1',
      artifactId: null,
      artifactUuid: 'asset-cover-artifact-uuid-1',
      primaryResourceId: 'asset-cover-resource-id-1',
      primaryResourceUuid: 'asset-cover-resource-uuid-1',
      resourceViewId: 'asset-cover-resource-view-id-1',
      resourceViewUuid: 'asset-cover-resource-view-uuid-1',
    };
    mocks.generateImage.mockResolvedValue(outcome);
    mocks.persistGenerationOutcomeAsset.mockResolvedValue(persisted);

    const result = await generateAssetCoverImage({
      prompt: 'cinematic startup workspace cover',
      negativePrompt: 'blur',
      aspectRatio: '3:2',
      model: 'gemini-3-flash-image',
    });

    expect(mocks.generateImage).toHaveBeenCalledWith({
      prompt: 'cinematic startup workspace cover',
      negativePrompt: 'blur',
      aspectRatio: '3:2',
      model: 'gemini-3-flash-image',
    });
    expect(mocks.persistGenerationOutcomeAsset).toHaveBeenCalledWith({
      outcome,
      type: 'image',
      domain: 'asset-center',
      name: expect.stringMatching(/^asset_cover_/),
    });
    expect(result).toBe(persisted);
  });

  it('routes cover prompt suggestions through client.generation.getCoverPromptSuggestions', async () => {
    mocks.getCoverPromptSuggestions.mockResolvedValue({
      code: 2000,
      message: 'ok',
      data: {
        prompts: [
          'Minimalist poster prompt',
          'Cinematic editorial prompt',
          'Futuristic 3D illustration prompt',
        ],
      },
    });

    const result = await suggestAssetCoverPrompts({
      context: 'AI workspace for startup founders',
      count: 3,
      language: 'en-US',
    });

    expect(mocks.getCoverPromptSuggestions).toHaveBeenCalledWith({
      context: 'AI workspace for startup founders',
      count: 3,
      language: 'en-US',
    });
    expect(result).toEqual([
      'Minimalist poster prompt',
      'Cinematic editorial prompt',
      'Futuristic 3D illustration prompt',
    ]);
  });

  it('throws the business failure message when client.generation.getCoverPromptSuggestions returns a failure code', async () => {
    mocks.getCoverPromptSuggestions.mockResolvedValue({
      code: 5000,
      message: 'cover prompt suggestion failed',
    });

    await expect(
      suggestAssetCoverPrompts({
        context: 'AI workspace for startup founders',
        count: 3,
      })
    ).rejects.toThrow('cover prompt suggestion failed');
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('../src/services/coverGenerationService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('does not import magic-studio-image directly, and instead relies on the cover generation adapter boundary', async () => {
    const source = await readFile(
      new URL('../src/services/coverGenerationService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/magic-studio-image'")).toBe(false);
  });

  it('ships a cover prompt contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('../src/services/coverPromptSuggestions.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated assets contract tsconfig', async () => {
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
