/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateCoverPrompts: vi.fn(),
  generateImage: vi.fn(),
  generateAssetCoverImage: vi.fn(),
  suggestAssetCoverPrompts: vi.fn(),
  persistGenerationOutcomeAsset: vi.fn(),
  onClose: vi.fn(),
  onSuccess: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-commons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-commons')>();
  return {
    ...actual,
    Button: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
  };
});

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params?.model ? `${key}:${params.model}` : key,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  genAIService: {
    generateCoverPrompts: mocks.generateCoverPrompts,
    generateImage: mocks.generateImage,
  },
}));

vi.mock('../src/services', () => ({
  generateAssetCoverImage: mocks.generateAssetCoverImage,
  suggestAssetCoverPrompts: mocks.suggestAssetCoverPrompts,
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('../src/hooks/useAssetUrl', () => ({
  useAssetUrl: (source: string | null) => ({
    url: source,
    loading: false,
    error: null,
  }),
}));

import { AIGenerateCoverModal } from '../src/components/AIGenerateCoverModal';

describe('AIGenerateCoverModal', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;

    mocks.generateCoverPrompts.mockReset();
    mocks.generateCoverPrompts.mockResolvedValue(['editorial workspace cover']);
    mocks.generateImage.mockReset();
    mocks.generateImage.mockResolvedValue({
      delivery: {
        url: 'https://example.com/direct-cover.png',
      },
    });
    mocks.generateAssetCoverImage.mockReset();
    mocks.generateAssetCoverImage.mockResolvedValue({
      assetId: 'asset-cover-asset-1',
      assetUuid: 'asset-cover-asset-uuid-1',
      path: 'https://storage.example.com/generated-cover.png',
      url: 'https://storage.example.com/generated-cover.png',
      sourceUrl: 'https://example.com/generated-cover.png',
      deliveryUrl: 'https://example.com/generated-cover.png',
      product: 'image',
      mode: 'text-to-image',
      provider: 'app-image',
      providerModel: 'gemini-3-flash-image',
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
    });
    mocks.suggestAssetCoverPrompts.mockReset();
    mocks.suggestAssetCoverPrompts.mockResolvedValue(['editorial workspace cover']);
    mocks.persistGenerationOutcomeAsset.mockReset();
    mocks.persistGenerationOutcomeAsset.mockResolvedValue({
      assetId: 'legacy-asset-cover-asset-1',
      assetUuid: 'legacy-asset-cover-asset-uuid-1',
      path: 'https://storage.example.com/legacy-generated-cover.png',
      url: 'https://storage.example.com/legacy-generated-cover.png',
      sourceUrl: 'https://example.com/direct-cover.png',
      deliveryUrl: 'https://example.com/direct-cover.png',
      product: 'image',
      mode: 'text-to-image',
      provider: 'google',
      providerModel: 'gemini',
      parameters: {},
      recipeId: null,
      recipeUuid: 'legacy-asset-cover-recipe-uuid-1',
      executionId: null,
      executionUuid: 'legacy-asset-cover-execution-uuid-1',
      artifactSetId: null,
      artifactSetUuid: 'legacy-asset-cover-artifact-set-uuid-1',
      artifactId: null,
      artifactUuid: 'legacy-asset-cover-artifact-uuid-1',
      primaryResourceId: 'legacy-asset-cover-resource-id-1',
      primaryResourceUuid: 'legacy-asset-cover-resource-uuid-1',
      resourceViewId: 'legacy-asset-cover-resource-view-id-1',
      resourceViewUuid: 'legacy-asset-cover-resource-view-uuid-1',
    });
    mocks.onClose.mockReset();
    mocks.onSuccess.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
  });

  it('uses the asset cover generation helper instead of calling legacy image generation directly', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <AIGenerateCoverModal
          contextText="workspace context"
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const promptButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('editorial workspace cover')
    );

    expect(promptButton).toBeTruthy();

    await act(async () => {
      promptButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.generateAssetCoverImage).toHaveBeenCalledWith({
      prompt: 'editorial workspace cover',
    });
    expect(mocks.generateImage).not.toHaveBeenCalled();

    const previewImage = container.querySelector('img');
    expect(previewImage?.getAttribute('src')).toBe('https://storage.example.com/generated-cover.png');
  });

  it('uses the asset cover prompt suggestion helper instead of the legacy genAI prompt endpoint', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <AIGenerateCoverModal
          contextText="workspace context"
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.suggestAssetCoverPrompts).toHaveBeenCalledWith({
      context: 'workspace context',
      count: 3,
    });
    expect(mocks.generateCoverPrompts).not.toHaveBeenCalled();

    const promptButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('editorial workspace cover')
    );
    expect(promptButton).toBeTruthy();
  });

  it('fails closed when cover prompt suggestions cannot be loaded', async () => {
    mocks.suggestAssetCoverPrompts.mockRejectedValueOnce(new Error('prompt service unavailable'));

    await act(async () => {
      root = createRoot(container);
      root.render(
        <AIGenerateCoverModal
          contextText="workspace context"
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('prompt service unavailable');
    expect(container.textContent).not.toContain('assetCenter.coverGenerator.fallbackPrompts.abstract');
    expect(container.textContent).not.toContain('assetCenter.coverGenerator.fallbackPrompts.futuristic');
    expect(container.textContent).not.toContain('assetCenter.coverGenerator.fallbackPrompts.workspace');
    expect(mocks.generateAssetCoverImage).not.toHaveBeenCalled();
  });
});
