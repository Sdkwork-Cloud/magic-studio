import type { AnyAsset, RegisterExistingAssetInput } from '@sdkwork/react-assets';
import { MediaResourceType } from '@sdkwork/react-commons';
import type { AssetContentKey } from '@sdkwork/react-types';

import { buildMagicCutAssetRegistrationInput } from './magicCutAssetState';

type FavoriteSyncTarget = {
  id: string;
  isFavorite?: boolean;
};

export type FavoriteMutationMap = Record<string, number>;

const mapFavoriteAssetTypeToContentKey = (
  type: AnyAsset['type']
): AssetContentKey => {
  switch (type) {
    case MediaResourceType.IMAGE:
      return 'image';
    case MediaResourceType.VIDEO:
      return 'video';
    case MediaResourceType.AUDIO:
      return 'audio';
    case MediaResourceType.MUSIC:
      return 'music';
    case MediaResourceType.VOICE:
      return 'voice';
    case MediaResourceType.TEXT:
      return 'text';
    case MediaResourceType.SUBTITLE:
      return 'subtitle';
    case MediaResourceType.EFFECT:
      return 'effect';
    case MediaResourceType.TRANSITION:
      return 'transition';
    case MediaResourceType.SPEECH:
      return 'audio';
    case MediaResourceType.CHARACTER:
      return 'character';
    case MediaResourceType.MODEL_3D:
      return 'model3d';
    case MediaResourceType.LOTTIE:
      return 'lottie';
    default:
      return 'file';
  }
};

export function resolveNextFavoriteState(current: boolean | null | undefined): boolean {
  return !Boolean(current);
}

export function buildFavoriteRegistrationInput(
  asset: AnyAsset,
  scope: RegisterExistingAssetInput['scope']
): RegisterExistingAssetInput {
  return buildMagicCutAssetRegistrationInput(
    {
      id: asset.id,
      name: asset.name,
      type: mapFavoriteAssetTypeToContentKey(asset.type),
      path: asset.path || asset.url || `assets://${asset.id}`,
      size: Number(asset.size || 0),
      origin: asset.origin,
      metadata: (asset.metadata || {}) as Record<string, unknown>,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    },
    asset.url || asset.path || `assets://${asset.id}`,
    scope
  );
}

export function syncFavoriteInAssetCollection<T extends FavoriteSyncTarget>(
  assets: T[],
  assetId: string,
  isFavorite: boolean
): T[] {
  let changed = false;

  const nextAssets = assets.map((asset) => {
    if (asset.id !== assetId) {
      return asset;
    }

    changed = true;
    return {
      ...asset,
      isFavorite,
    };
  });

  return changed ? nextAssets : assets;
}

export function applyFavoriteStateFromCatalog<T extends FavoriteSyncTarget>(
  assets: T[],
  catalogAssets: Array<FavoriteSyncTarget | null | undefined>
): T[] {
  const favoriteMap = new Map<string, boolean>();

  catalogAssets.forEach((asset) => {
    if (!asset || typeof asset.id !== 'string' || asset.id.length === 0) {
      return;
    }
    if (asset.isFavorite === undefined) {
      return;
    }
    favoriteMap.set(asset.id, !!asset.isFavorite);
  });

  if (favoriteMap.size === 0) {
    return assets;
  }

  let changed = false;

  const nextAssets = assets.map((asset) => {
    if (!favoriteMap.has(asset.id)) {
      return asset;
    }

    const nextFavorite = favoriteMap.get(asset.id);
    if (asset.isFavorite === nextFavorite) {
      return asset;
    }

    changed = true;
    return {
      ...asset,
      isFavorite: nextFavorite,
    };
  });

  return changed ? nextAssets : assets;
}

export function clearFavoriteOverride(
  overrides: Record<string, boolean>,
  assetId: string
): Record<string, boolean> {
  if (!(assetId in overrides)) {
    return overrides;
  }

  const nextOverrides = {
    ...overrides,
  };
  delete nextOverrides[assetId];
  return nextOverrides;
}

export function beginFavoriteMutation(
  activeMutations: FavoriteMutationMap,
  assetId: string
): { activeMutations: FavoriteMutationMap; requestId: number } {
  const requestId = (activeMutations[assetId] || 0) + 1;
  return {
    activeMutations: {
      ...activeMutations,
      [assetId]: requestId,
    },
    requestId,
  };
}

export function isCurrentFavoriteMutation(
  activeMutations: FavoriteMutationMap,
  assetId: string,
  requestId: number
): boolean {
  return activeMutations[assetId] === requestId;
}
