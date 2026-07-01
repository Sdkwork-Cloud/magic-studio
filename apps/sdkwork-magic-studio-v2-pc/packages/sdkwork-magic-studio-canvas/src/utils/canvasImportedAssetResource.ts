import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { CanvasMediaResource } from '@sdkwork/magic-studio-types/canvas';

interface CanvasImportedAssetLike {
  id?: unknown;
  uuid?: unknown;
  name?: unknown;
  type?: unknown;
  path?: unknown;
  size?: unknown;
  metadata?: Record<string, unknown>;
}

const normalizeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

const resolveCanvasImportedAssetType = (
  uploaded: CanvasImportedAssetLike,
  fallbackType: CanvasMediaResource['type']
): CanvasMediaResource['type'] => {
  if (uploaded.type === 'image' || uploaded.type === 'video' || uploaded.type === 'audio') {
    return uploaded.type;
  }

  return fallbackType;
};

export interface ToCanvasImportedAssetResourceInput {
  uploaded: CanvasImportedAssetLike;
  fallbackType: CanvasMediaResource['type'];
  resolvedUrl: string;
  name?: string;
}

export const toCanvasImportedAssetResource = ({
  uploaded,
  fallbackType,
  resolvedUrl,
  name,
}: ToCanvasImportedAssetResourceInput): CanvasMediaResource => {
  const metadata = (uploaded.metadata || {}) as Record<string, unknown>;
  const assetId = resolveAssetRecordId(uploaded) ?? null;
  const assetUuid = resolveAssetRecordAssetUuid(uploaded) ?? null;
  const primaryResourceId = readAssetRecordMetadataValue(uploaded, 'primaryResourceId') ?? null;
  const primaryResourceUuid =
    readAssetRecordMetadataValue(uploaded, 'primaryResourceUuid') ?? null;
  const resourceViewId = readAssetRecordMetadataValue(uploaded, 'resourceViewId') ?? null;
  const resourceViewUuid = readAssetRecordMetadataValue(uploaded, 'resourceViewUuid') ?? null;
  const canonicalUrl =
    normalizeOptionalString(resolvedUrl) ||
    normalizeOptionalString(uploaded.path) ||
    '';

  return {
    id: assetId,
    uuid:
      resourceViewUuid ||
      primaryResourceUuid ||
      resolveAssetRecordClientUuid(uploaded) ||
      assetId ||
      'canvas-imported-asset',
    assetId,
    assetUuid,
    primaryResourceId,
    primaryResourceUuid,
    resourceViewId,
    resourceViewUuid,
    name: normalizeOptionalString(name) || normalizeOptionalString(uploaded.name),
    type: resolveCanvasImportedAssetType(uploaded, fallbackType),
    url: canonicalUrl,
    path: canonicalUrl,
    thumbnailUrl:
      normalizeOptionalString(metadata.thumbnailUrl) ||
      normalizeOptionalString(metadata.thumbnailPath),
    duration: toPositiveNumber(metadata.duration),
    width: toPositiveNumber(metadata.width),
    height: toPositiveNumber(metadata.height),
    size: toPositiveNumber(uploaded.size) ?? toPositiveNumber(metadata.size),
    format: normalizeOptionalString(metadata.mimeType),
    metadata: metadata as Record<string, any> | undefined,
  };
};
