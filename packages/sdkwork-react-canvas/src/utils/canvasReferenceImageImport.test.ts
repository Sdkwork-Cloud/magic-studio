import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} = vi.hoisted(() => ({
  importAssetBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

vi.mock('@sdkwork/react-assets', () => ({
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

import { importCanvasReferenceImageFile } from './canvasReferenceImageImport';

describe('importCanvasReferenceImageFile', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
  });

  it('uploads local reference images through the asset sdk and returns a persistent url', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'canvas-ref-1',
      path: 'https://storage.example.com/raw-ref.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/canvas-ref.png');

    await expect(
      importCanvasReferenceImageFile({
        name: 'reference.png',
        data: new Uint8Array([9, 8, 7]),
      })
    ).resolves.toBe('https://cdn.example.com/canvas-ref.png');

    expect(importAssetBySdk).toHaveBeenCalledWith(
      {
        name: 'reference.png',
        data: new Uint8Array([9, 8, 7]),
      },
      'image',
      { domain: 'canvas' }
    );
  });
});
