import type { AssetBusinessDomain } from '@sdkwork/magic-studio-types/asset-center';

import type { Asset } from '../entities/asset.entity';
import {
  persistChooseAssetProjectReference,
  type ChooseAssetProjectReference,
} from './chooseAssetProjectReference';

export const persistChooseAssetModalSelectionProjectReferences = async (input: {
  assets: Asset[];
  domain: AssetBusinessDomain;
  projectReference?: ChooseAssetProjectReference;
}): Promise<void> => {
  const { assets, domain, projectReference } = input;
  if (!projectReference || assets.length === 0) {
    return;
  }

  for (const asset of assets) {
    await persistChooseAssetProjectReference({
      uploaded: asset,
      resolvedUrl: asset.path || '',
      fallbackType: asset.type,
      domain,
      projectReference,
    });
  }
};
