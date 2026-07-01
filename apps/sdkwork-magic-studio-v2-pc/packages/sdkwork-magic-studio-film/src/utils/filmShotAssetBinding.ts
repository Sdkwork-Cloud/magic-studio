import type { AssetAtomicMediaResource } from '@sdkwork/magic-studio-types/media';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import {
  resolveImportedFilmAssetUrl,
  type ImportedFilmAssetRef
} from './filmModalAssetImport';

export type ImportedFilmAssetBinding = ImportedFilmAssetRef;

const toPrimaryKey = (type: MediaResourceType): AssetAtomicMediaResource['primary'] => {
  if (type === MediaResourceType.VIDEO) {
    return 'video';
  }
  if (
    type === MediaResourceType.AUDIO ||
    type === MediaResourceType.MUSIC ||
    type === MediaResourceType.VOICE
  ) {
    return 'audio';
  }
  return 'image';
};

export const applyImportedAssetToShotSlot = (
  asset: AssetAtomicMediaResource,
  imported: ImportedFilmAssetBinding,
  overrides?: {
    type?: MediaResourceType;
    name?: string;
    metadata?: Record<string, unknown>;
  }
): AssetAtomicMediaResource => {
  const resolvedType = overrides?.type || asset.type || MediaResourceType.IMAGE;
  const stableUuid = imported.uuid || imported.assetUuid || imported.assetId;
  const nextMetadata: Record<string, unknown> = {
    ...(asset.metadata || {}),
    ...(overrides?.metadata || {}),
    assetId: imported.assetId,
  };
  if (imported.assetUuid) {
    nextMetadata.assetUuid = imported.assetUuid;
  } else {
    delete nextMetadata.assetUuid;
  }
  return {
    ...asset,
    id: imported.assetId,
    uuid: stableUuid,
    assetId: imported.assetId,
    url: resolveImportedFilmAssetUrl(imported),
    name: overrides?.name || asset.name,
    type: resolvedType,
    primary: toPrimaryKey(resolvedType),
    metadata: nextMetadata,
    updatedAt: Date.now(),
  };
};
