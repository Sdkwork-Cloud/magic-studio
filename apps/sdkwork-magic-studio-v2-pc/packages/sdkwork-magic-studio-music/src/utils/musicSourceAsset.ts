import type { Asset } from '@sdkwork/magic-studio-assets/entities';
import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';

import {
  createGeneratedMusicResult,
  type GeneratedMusicResult,
} from '../entities';

const normalizeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const normalizeOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

export const toGeneratedMusicResultFromAsset = (
  asset: Asset | null | undefined,
  resolvedUrl?: string
): GeneratedMusicResult | undefined => {
  if (!asset) {
    return undefined;
  }

  const canonicalPath = normalizeOptionalString(asset.path);
  const deliveryUrl = normalizeOptionalString(resolvedUrl);
  if (!canonicalPath && !deliveryUrl) {
    return undefined;
  }

  const duration =
    normalizeOptionalNumber(asset.metadata?.duration) ||
    normalizeOptionalNumber(readAssetRecordMetadataValue(asset, 'duration')) ||
    0;
  const coverUrl =
    normalizeOptionalString(asset.metadata?.thumbnailUrl) ||
    normalizeOptionalString(asset.metadata?.coverUrl);

  return createGeneratedMusicResult({
    id: normalizeOptionalString(asset.id) ?? null,
    uuid: resolveAssetRecordClientUuid(asset),
    assetId: resolveAssetRecordId(asset) ?? null,
    assetUuid: resolveAssetRecordAssetUuid(asset) ?? null,
    primaryResourceId: readAssetRecordMetadataValue(asset, 'primaryResourceId') ?? null,
    primaryResourceUuid: readAssetRecordMetadataValue(asset, 'primaryResourceUuid') ?? null,
    resourceViewId: readAssetRecordMetadataValue(asset, 'resourceViewId') ?? null,
    resourceViewUuid: readAssetRecordMetadataValue(asset, 'resourceViewUuid') ?? null,
    resource: {
      id: normalizeOptionalString(readAssetRecordMetadataValue(asset, 'primaryResourceId')) ?? null,
      uuid:
        normalizeOptionalString(readAssetRecordMetadataValue(asset, 'resourceViewUuid')) ||
        normalizeOptionalString(readAssetRecordMetadataValue(asset, 'primaryResourceUuid')) ||
        resolveAssetRecordClientUuid(asset),
      assetId: resolveAssetRecordId(asset) ?? null,
      assetUuid: resolveAssetRecordAssetUuid(asset) ?? null,
      primaryResourceId: readAssetRecordMetadataValue(asset, 'primaryResourceId') ?? null,
      primaryResourceUuid: readAssetRecordMetadataValue(asset, 'primaryResourceUuid') ?? null,
      resourceViewId: readAssetRecordMetadataValue(asset, 'resourceViewId') ?? null,
      resourceViewUuid: readAssetRecordMetadataValue(asset, 'resourceViewUuid') ?? null,
      url: isRenderableInputResourceUrl(deliveryUrl) ? deliveryUrl : undefined,
      path: canonicalPath || deliveryUrl || undefined,
      name: normalizeOptionalString(asset.name) || 'Source Music',
      mimeType:
        normalizeOptionalString(asset.metadata?.mimeType) ||
        readAssetRecordMetadataValue(asset, 'mimeType') ||
        'audio/mpeg',
      duration,
    },
    ...(coverUrl
      ? {
          coverResource: {
            id: null,
            uuid: `${resolveAssetRecordClientUuid(asset) || 'music'}:cover`,
            url: coverUrl,
            name: `${normalizeOptionalString(asset.name) || 'source-music'}-cover`,
          },
        }
      : {}),
    title: normalizeOptionalString(asset.name) || 'Source Music',
    duration,
    style: normalizeOptionalString(asset.metadata?.style),
  });
};
