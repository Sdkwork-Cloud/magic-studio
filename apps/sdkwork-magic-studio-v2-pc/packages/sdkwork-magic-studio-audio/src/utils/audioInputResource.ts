import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import {
  type Asset,
} from '@sdkwork/magic-studio-types/assets';
import { isStableInputResourceLocator } from '@sdkwork/magic-studio-types/input-resource';

import {
  createAudioInputResourceRef,
  type AudioInputResourceRef,
  type AudioInputResourceType,
} from '../entities';

const normalizeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

export const toAudioInputResourceRefFromAsset = (
  asset: Asset | null | undefined,
  explicitType: AudioInputResourceType = 'audio',
  resolvedUrl?: string
): AudioInputResourceRef | undefined => {
  if (!asset) {
    return undefined;
  }

  const canonicalPath = normalizeOptionalString(asset.path);
  const deliveryUrl =
    normalizeOptionalString(resolvedUrl) ||
    normalizeOptionalString(readAssetRecordMetadataValue(asset, 'deliveryUrl')) ||
    normalizeOptionalString(readAssetRecordMetadataValue(asset, 'primaryUrl')) ||
    (canonicalPath && !isStableInputResourceLocator(canonicalPath) ? canonicalPath : undefined);

  return createAudioInputResourceRef({
    id: null,
    uuid: resolveAssetRecordClientUuid(asset),
    type: explicitType,
    assetId: resolveAssetRecordId(asset) ?? null,
    assetUuid: resolveAssetRecordAssetUuid(asset) ?? null,
    primaryResourceId: readAssetRecordMetadataValue(asset, 'primaryResourceId') ?? null,
    primaryResourceUuid: readAssetRecordMetadataValue(asset, 'primaryResourceUuid') ?? null,
    resourceViewId: readAssetRecordMetadataValue(asset, 'resourceViewId') ?? null,
    resourceViewUuid: readAssetRecordMetadataValue(asset, 'resourceViewUuid') ?? null,
    path: canonicalPath,
    url: deliveryUrl,
    name: normalizeOptionalString(asset.name),
    mimeType: readAssetRecordMetadataValue(asset, 'mimeType') ?? undefined,
    metadata: {
      ...(asset.metadata ? { ...asset.metadata } : {}),
      ...(canonicalPath ? { canonicalPath } : {}),
      ...(deliveryUrl ? { deliveryUrl } : {}),
    },
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  });
};
