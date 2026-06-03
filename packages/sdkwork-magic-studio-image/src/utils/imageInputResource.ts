import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { Asset } from '@sdkwork/magic-studio-types/assets';
import { isStableInputResourceLocator } from '@sdkwork/magic-studio-types/input-resource';

import {
  createImageInputResourceRef,
  resolveImageInputResourceReference,
  resolveImageInputResourcePath,
  resolveImageInputResourceUrl,
  type ImageInputResourceRef,
} from '../entities';

const normalizeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

export const toImageInputResourceRefFromAsset = (
  asset: Asset | null | undefined
): ImageInputResourceRef | undefined => {
  if (!asset) {
    return undefined;
  }

  const canonicalPath = normalizeOptionalString(asset.path);
  const deliveryUrl =
    normalizeOptionalString(readAssetRecordMetadataValue(asset, 'deliveryUrl')) ||
    normalizeOptionalString(readAssetRecordMetadataValue(asset, 'primaryUrl')) ||
    (canonicalPath && !isStableInputResourceLocator(canonicalPath) ? canonicalPath : undefined);

  return createImageInputResourceRef({
    id: null,
    uuid: resolveAssetRecordClientUuid(asset),
    assetId: resolveAssetRecordId(asset) ?? null,
    assetUuid: resolveAssetRecordAssetUuid(asset) ?? null,
    primaryResourceId: readAssetRecordMetadataValue(asset, 'primaryResourceId') ?? null,
    primaryResourceUuid: readAssetRecordMetadataValue(asset, 'primaryResourceUuid') ?? null,
    resourceViewId: readAssetRecordMetadataValue(asset, 'resourceViewId') ?? null,
    resourceViewUuid: readAssetRecordMetadataValue(asset, 'resourceViewUuid') ?? null,
    path: canonicalPath,
    url: deliveryUrl,
    name: normalizeOptionalString(asset.name),
    metadata: {
      ...(asset.metadata ? { ...asset.metadata } : {}),
      ...(canonicalPath ? { canonicalPath } : {}),
      ...(deliveryUrl ? { deliveryUrl } : {}),
    },
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  });
};

export const toImageInputSelectableAsset = (
  ref: ImageInputResourceRef | null | undefined
): Asset | null => {
  if (!ref) {
    return null;
  }

  const runtimeId =
    normalizeOptionalString(ref.assetId) ||
    normalizeOptionalString(ref.id) ||
    normalizeOptionalString(ref.uuid) ||
    normalizeOptionalString(resolveImageInputResourceReference(ref));
  const path =
    resolveImageInputResourcePath(ref) ||
    resolveImageInputResourceUrl(ref) ||
    resolveImageInputResourceReference(ref) ||
    '';

  if (!runtimeId) {
    return null;
  }

  return {
    id: runtimeId,
    uuid:
      ref.assetUuid ||
      ref.resourceViewUuid ||
      ref.primaryResourceUuid ||
      ref.uuid,
    createdAt: ref.createdAt,
    updatedAt: ref.updatedAt,
    name: ref.name || ref.resource?.name || runtimeId,
    type: 'image',
    path,
    size: 0,
    origin: 'upload',
    metadata: {
      ...(ref.metadata || {}),
      assetId: ref.assetId ?? undefined,
      assetUuid: ref.assetUuid ?? undefined,
      primaryResourceId: ref.primaryResourceId ?? undefined,
      primaryResourceUuid: ref.primaryResourceUuid ?? undefined,
      resourceViewId: ref.resourceViewId ?? undefined,
      resourceViewUuid: ref.resourceViewUuid ?? undefined,
    },
    isFavorite: false,
  };
};
