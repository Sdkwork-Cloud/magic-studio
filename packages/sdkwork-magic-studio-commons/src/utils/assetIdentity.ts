export interface AssetIdentityMetadataCarrier {
  id?: unknown;
  uuid?: unknown;
  metadata?: Record<string, unknown>;
}

const normalizeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const pickFirst = (...values: Array<string | undefined>): string | undefined => {
  for (const value of values) {
    if (value) {
      return value;
    }
  }

  return undefined;
};

export const readAssetRecordMetadataValue = (
  asset: AssetIdentityMetadataCarrier,
  key: string
): string | undefined => {
  return normalizeOptionalString(asset.metadata?.[key]);
};

export const resolveAssetRecordId = (
  asset: AssetIdentityMetadataCarrier
): string | undefined => {
  return pickFirst(
    readAssetRecordMetadataValue(asset, 'assetId'),
    normalizeOptionalString(asset.id)
  );
};

export const deriveAssetRecordClientUuid = (
  assetId: string
): string => `client-asset:${assetId}`;

export const resolveAssetRecordClientUuid = (
  asset: AssetIdentityMetadataCarrier
): string | undefined => {
  const assetId = resolveAssetRecordId(asset);
  const explicitUuid = normalizeOptionalString(asset.uuid);

  return pickFirst(
    readAssetRecordMetadataValue(asset, 'assetUuid'),
    readAssetRecordMetadataValue(asset, 'resourceViewUuid'),
    readAssetRecordMetadataValue(asset, 'primaryResourceUuid'),
    explicitUuid && explicitUuid !== assetId ? explicitUuid : undefined,
    assetId ? deriveAssetRecordClientUuid(assetId) : undefined
  );
};

export const resolveAssetRecordAssetUuid = (
  asset: AssetIdentityMetadataCarrier
): string | undefined => {
  return readAssetRecordMetadataValue(asset, 'assetUuid');
};
