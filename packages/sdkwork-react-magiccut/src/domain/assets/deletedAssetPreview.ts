export interface DeletedAssetPreviewCleanupInput {
  assetId: string;
  skimmingResourceId?: string | null;
  isCoordinatorPreviewingAsset: boolean;
}

export interface DeletedAssetPreviewCleanup {
  clearStorePreview: boolean;
  clearCoordinatorPreview: boolean;
  shouldClearAnyPreview: boolean;
}

export const resolveDeletedAssetPreviewCleanup = (
  input: DeletedAssetPreviewCleanupInput
): DeletedAssetPreviewCleanup => {
  const clearStorePreview =
    !!input.assetId && !!input.skimmingResourceId && input.skimmingResourceId === input.assetId;
  const clearCoordinatorPreview = !!input.assetId && input.isCoordinatorPreviewingAsset;

  return {
    clearStorePreview,
    clearCoordinatorPreview,
    shouldClearAnyPreview: clearStorePreview || clearCoordinatorPreview,
  };
};
