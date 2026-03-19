import { describe, expect, it } from 'vitest';

import * as deletedAssetPreviewModule from '../src/domain/assets/deletedAssetPreview';

describe('deletedAssetPreview', () => {
  it('clears the store-backed visual preview when the deleted asset is the current skimming resource', () => {
    const resolveDeletedAssetPreviewCleanup = (deletedAssetPreviewModule as any)
      .resolveDeletedAssetPreviewCleanup;

    expect(
      resolveDeletedAssetPreviewCleanup({
        assetId: 'asset-1',
        skimmingResourceId: 'asset-1',
        isCoordinatorPreviewingAsset: false,
      })
    ).toEqual({
      clearStorePreview: true,
      clearCoordinatorPreview: false,
      shouldClearAnyPreview: true,
    });
  });

  it('clears the coordinator-backed audio preview when the deleted asset is playing in preview', () => {
    const resolveDeletedAssetPreviewCleanup = (deletedAssetPreviewModule as any)
      .resolveDeletedAssetPreviewCleanup;

    expect(
      resolveDeletedAssetPreviewCleanup({
        assetId: 'asset-1',
        skimmingResourceId: 'asset-2',
        isCoordinatorPreviewingAsset: true,
      })
    ).toEqual({
      clearStorePreview: false,
      clearCoordinatorPreview: true,
      shouldClearAnyPreview: true,
    });
  });

  it('leaves preview state untouched when deleting an unrelated asset', () => {
    const resolveDeletedAssetPreviewCleanup = (deletedAssetPreviewModule as any)
      .resolveDeletedAssetPreviewCleanup;

    expect(
      resolveDeletedAssetPreviewCleanup({
        assetId: 'asset-1',
        skimmingResourceId: 'asset-2',
        isCoordinatorPreviewingAsset: false,
      })
    ).toEqual({
      clearStorePreview: false,
      clearCoordinatorPreview: false,
      shouldClearAnyPreview: false,
    });
  });
});
