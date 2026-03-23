import type { AssetAtomicMediaResource } from '@sdkwork/react-types';
import { MediaResourceType } from '@sdkwork/react-types';

export interface ImportedFilmAssetBinding {
  assetId: string;
  url: string;
}

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
  return {
    ...asset,
    url: imported.url,
    name: overrides?.name || asset.name,
    type: resolvedType,
    primary: toPrimaryKey(resolvedType),
    metadata: {
      ...(asset.metadata || {}),
      ...(overrides?.metadata || {}),
      assetId: imported.assetId,
    },
    updatedAt: Date.now(),
  };
};
