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

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  inlineDataService: {
    tryExtractInlineData,
  },
}));

import { createGeneratedImageResult } from '../entities';
import { persistImageEditorResult } from './imageEditorAssetPersistence';

describe('persistImageEditorResult', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
  });

  it('uses uploaded client uuid as result identity without inventing assetUuid from it', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-db-1',
      uuid: 'resource-view-uuid-1',
      path: 'https://storage.example.com/edited-image.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    const result = await persistImageEditorResult({
      source: createGeneratedImageResult({
        uuid: 'source-artifact-uuid-1',
        url: 'https://tmp.example.com/edited-image.png',
        prompt: 'cinematic portrait',
        negativePrompt: 'blurry',
        width: 1024,
        height: 1024,
      }),
      name: 'edited-image.png',
    });

    expect(result).toMatchObject({
      id: null,
      uuid: 'resource-view-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: null,
      prompt: 'cinematic portrait',
      negativePrompt: 'blurry',
      width: 1024,
      height: 1024,
      resource: {
        uuid: 'resource-view-uuid-1',
        assetId: 'asset-db-1',
        assetUuid: null,
        path: 'https://storage.example.com/edited-image.png',
        url: 'https://storage.example.com/edited-image.png',
      },
    });
    expect(result.url).toBeUndefined();
  });

  it('preserves explicit canonical assetUuid from upload metadata', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-db-2',
      uuid: 'resource-view-uuid-2',
      path: 'https://storage.example.com/edited-image-2.png',
      metadata: {
        assetUuid: 'asset-uuid-2',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    const result = await persistImageEditorResult({
      source: createGeneratedImageResult({
        uuid: 'source-artifact-uuid-2',
        url: 'https://tmp.example.com/edited-image-2.png',
      }),
      name: 'edited-image-2.png',
    });

    expect(result).toMatchObject({
      uuid: 'asset-uuid-2',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      resource: {
        uuid: 'asset-uuid-2',
        assetId: 'asset-db-2',
        assetUuid: 'asset-uuid-2',
        path: 'https://storage.example.com/edited-image-2.png',
      },
    });
    expect(result.url).toBeUndefined();
  });

  it('preserves stable asset locators for edited image resources while keeping delivery urls renderable', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-db-3',
      uuid: 'resource-view-uuid-3',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/edited-image-3.png',
      metadata: {
        assetUuid: 'asset-uuid-3',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/edited-image-3.png' as any);

    const result = await persistImageEditorResult({
      source: createGeneratedImageResult({
        uuid: 'source-artifact-uuid-3',
        url: 'https://tmp.example.com/edited-image-3.png',
      }),
      name: 'edited-image-3.png',
    });

    expect(result).toMatchObject({
      uuid: 'asset-uuid-3',
      assetId: 'asset-db-3',
      assetUuid: 'asset-uuid-3',
      resource: {
        uuid: 'asset-uuid-3',
        assetId: 'asset-db-3',
        assetUuid: 'asset-uuid-3',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/edited-image-3.png',
        url: 'https://cdn.example.com/edited-image-3.png',
      },
    });
  });
});
