import type { RegisterExistingAssetInput } from '@sdkwork/magic-studio-assets/asset-center';
import type { AnyAsset } from '@sdkwork/magic-studio-assets/entities';
import {
  matchesEntityKey,
  resolveEntityKey,
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';
import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import { buildMagicCutAssetRegistrationInput } from './magicCutAssetState';

type FavoriteSyncTarget = EntityIdentityLike & {
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
  return !current;
}

export function buildFavoriteRegistrationInput(
  asset: AnyAsset,
  scope: RegisterExistingAssetInput['scope']
): RegisterExistingAssetInput {
  const assetKey = resolveEntityKey(asset);
  const assetLocator = asset.path || asset.url || `assets://${assetKey}`;

  return buildMagicCutAssetRegistrationInput(
    {
      id: asset.id,
      uuid: asset.uuid,
      name: asset.name,
      type: mapFavoriteAssetTypeToContentKey(asset.type),
      path: asset.path || asset.url || `assets://${assetKey}`,
      size: Number(asset.size || 0),
      origin: asset.origin,
      metadata: {
        ...(asset.metadata || {}),
        ...(asset.uuid ? { assetUuid: asset.uuid, resourceViewUuid: asset.uuid } : {}),
      } as Record<string, unknown>,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    },
    asset.url || asset.path || '',
    scope
  );
}

export function syncFavoriteInAssetCollection<T extends FavoriteSyncTarget>(
  assets: T[],
  assetKey: string,
  isFavorite: boolean
): T[] {
  let changed = false;

  const nextAssets = assets.map((asset) => {
    if (!matchesEntityKey(asset, assetKey)) {
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
    if (!asset) {
      return;
    }
    if (asset.isFavorite === undefined) {
      return;
    }

    favoriteMap.set(resolveEntityKey(asset), asset.isFavorite);
  });

  if (favoriteMap.size === 0) {
    return assets;
  }

  let changed = false;

  const nextAssets = assets.map((asset) => {
    const assetKey = resolveEntityKey(asset);
    if (!favoriteMap.has(assetKey)) {
      return asset;
    }

    const nextFavorite = favoriteMap.get(assetKey);
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
