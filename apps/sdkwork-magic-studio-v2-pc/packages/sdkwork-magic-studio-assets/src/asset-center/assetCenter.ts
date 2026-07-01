import { createDefaultAssetCenter } from './infrastructure/createDefaultAssetCenter';
import { AssetBusinessFacade } from './application/AssetBusinessFacade';

export const assetCenterService = createDefaultAssetCenter();
export const assetBusinessFacade = new AssetBusinessFacade(assetCenterService);
