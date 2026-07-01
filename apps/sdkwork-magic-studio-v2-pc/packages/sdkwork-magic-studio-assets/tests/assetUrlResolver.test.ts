import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  resolveAssetPrimaryUrlBySdk,
  resolveLocatorUrl,
} = vi.hoisted(() => ({
  resolveAssetPrimaryUrlBySdk: vi.fn(),
  resolveLocatorUrl: vi.fn(),
}));

vi.mock('../src/services/assetBusinessService', () => ({
  assetBusinessService: {
    resolveAssetPrimaryUrlBySdk,
  },
}));

vi.mock('../src/asset-center/assetCenter', () => ({
  assetCenterService: {
    resolveLocatorUrl,
  },
}));

import { resolveAssetUrlByAssetIdFirst } from '../src/asset-center/application/assetUrlResolver';

describe('assetUrlResolver', () => {
  beforeEach(() => {
    resolveAssetPrimaryUrlBySdk.mockReset();
    resolveLocatorUrl.mockReset();
  });

  it('prefers canonical asset urls when asset identity only exists under nested resource payloads', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(
      'https://cdn.example.com/final/nested-resource.png'
    );

    await expect(
      resolveAssetUrlByAssetIdFirst({
        resource: {
          assetId: 'asset-db-1',
          url: 'https://tmp.example.com/resource-view.png',
        },
      } as any)
    ).resolves.toBe('https://cdn.example.com/final/nested-resource.png');

    expect(resolveAssetPrimaryUrlBySdk).toHaveBeenCalledWith('asset-db-1');
  });

  it('resolves managed locators nested under payload slots after exhausting canonical asset lookup', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);
    resolveLocatorUrl.mockResolvedValue(
      'asset://localhost/workspaces/ws-1/projects/proj-1/media/originals/image/cover.png'
    );

    await expect(
      resolveAssetUrlByAssetIdFirst({
        payload: {
          image: {
            metadata: {
              assetId: 'asset-db-2',
            },
            path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/cover.png',
          },
        },
      } as any)
    ).resolves.toBe(
      'asset://localhost/workspaces/ws-1/projects/proj-1/media/originals/image/cover.png'
    );

    expect(resolveAssetPrimaryUrlBySdk).toHaveBeenCalledWith('asset-db-2');
    expect(resolveLocatorUrl).toHaveBeenCalledWith(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/image/cover.png'
    );
  });
});
