import { describe, expect, it, vi } from 'vitest';

import * as useAssetUrlModule from '../src/hooks/useAssetUrl';
import { resolveAssetUrlByAssetIdFirst } from '../src/asset-center/application/assetUrlResolver';

vi.mock('../src/asset-center/application/assetUrlResolver', () => ({
  resolveAssetUrlByAssetIdFirst: vi.fn(async (source: unknown) => {
    if (source === 'assets://workspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4') {
      return 'asset://localhost/managed/clip.mp4';
    }
    if (
      typeof source === 'object' &&
      source !== null &&
      'path' in source &&
      (source as { path?: unknown }).path ===
        'assets://workspaces/ws-1/projects/proj-1/media/thumbnails/thumb.png'
    ) {
      return 'asset://localhost/managed/thumb.png';
    }
    return null;
  }),
}));

const getResolveAssetSourceUrl = () =>
  (
    useAssetUrlModule as typeof useAssetUrlModule & {
      resolveAssetSourceUrl?: (source: unknown) => Promise<string | null>;
    }
  ).resolveAssetSourceUrl;

describe('useAssetUrl default resolver', () => {
  it('resolves internal assets locators even without a custom resolver', async () => {
    const resolveAssetSourceUrl = getResolveAssetSourceUrl();

    await expect(
      resolveAssetSourceUrl?.(
        'assets://workspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4'
      )
    ).resolves.toBe('asset://localhost/managed/clip.mp4');

    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4'
    );
  });

  it('resolves asset objects whose path points at the MagicStudio local asset store', async () => {
    const resolveAssetSourceUrl = getResolveAssetSourceUrl();

    await expect(
      resolveAssetSourceUrl?.({
        id: 'thumb',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/thumbnails/thumb.png',
      })
    ).resolves.toBe('asset://localhost/managed/thumb.png');

    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith({
      id: 'thumb',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/thumbnails/thumb.png',
    });
  });

  it('falls back to the default asset resolver when a custom resolver throws', async () => {
    const resolveAssetSourceUrl = getResolveAssetSourceUrl();

    await expect(
      resolveAssetSourceUrl?.(
        'assets://workspaces/ws-1/projects/proj-1/media/originals/video/clip.mp4',
        async () => {
          throw new Error('custom resolver failed');
        }
      )
    ).resolves.toBe('asset://localhost/managed/clip.mp4');
  });
});
