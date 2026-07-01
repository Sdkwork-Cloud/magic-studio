import {
  entityKeysEqual,
  matchesEntityKey,
  resolveEntityKey,
} from '@sdkwork/magic-studio-types/entity';

import type { Asset } from '../entities/asset.entity';

export const resolveAssetSelectionKey = (
  asset: Pick<Asset, 'id' | 'uuid'>
): string => {
  return resolveEntityKey(asset);
};

export const assetMatchesSelectionKey = (
  asset: Pick<Asset, 'id' | 'uuid'>,
  key: string
): boolean => {
  return matchesEntityKey(asset, key);
};

export const toggleSelectedAssets = (
  selectedAssets: Asset[],
  asset: Asset
): Asset[] => {
  if (selectedAssets.some((item) => entityKeysEqual(item, asset))) {
    return selectedAssets.filter((item) => !entityKeysEqual(item, asset));
  }

  return [...selectedAssets, asset];
};
