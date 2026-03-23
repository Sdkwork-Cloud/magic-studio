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

vi.mock('@sdkwork/react-assets', () => ({
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

import {
  importMagicCutTrackCoverFile,
  importMagicCutTrackCoverFromUrl,
} from '../src/utils/magicCutTrackCoverImport';

describe('magicCutTrackCoverImport', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
  });

  it('uploads local files through the asset sdk and returns the resolved asset url', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'asset-file-1',
      path: 'https://storage.example.com/raw-cover.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-cover.png');

    await expect(
      importMagicCutTrackCoverFile({
        name: 'cover.png',
        data: new Uint8Array([1, 2, 3]),
      })
    ).resolves.toEqual({
      assetId: 'asset-file-1',
      url: 'https://cdn.example.com/final-cover.png',
    });

    expect(importAssetBySdk).toHaveBeenCalledWith(
      {
        name: 'cover.png',
        data: new Uint8Array([1, 2, 3]),
      },
      'image',
      { domain: 'magiccut' }
    );
  });

  it('re-imports url sources through the asset sdk so generated frames become persistent cover assets', async () => {
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-url-1',
      path: 'https://storage.example.com/reimported-cover.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      importMagicCutTrackCoverFromUrl('blob:track-cover', 'track-cover.png')
    ).resolves.toEqual({
      assetId: 'asset-url-1',
      url: 'https://storage.example.com/reimported-cover.png',
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'blob:track-cover',
      'image',
      {
        name: 'track-cover.png',
        domain: 'magiccut',
      }
    );
  });
});
