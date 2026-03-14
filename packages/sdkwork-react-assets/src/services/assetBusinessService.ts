import { ASSET_CATEGORIES, assetService, setMediaAnalysisAdapter } from './assetService';
import { assetServiceRegistry } from './AssetServiceRegistry';
import {
  deleteAssetBySdk,
  importAssetBySdk,
  importAssetFromUrlBySdk,
  queryAssetsBySdk,
  renameAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
  type AssetSdkQueryCategory
} from './assetSdkQueryService';
import {
  getAssetService,
  getRegisteredCategories,
  hasAssetService,
  initializeAssetServices
} from './assetServiceInitializer';

export interface AssetBusinessAdapter {
  assetService: typeof assetService;
  ASSET_CATEGORIES: typeof ASSET_CATEGORIES;
  setMediaAnalysisAdapter: typeof setMediaAnalysisAdapter;
  assetServiceRegistry: typeof assetServiceRegistry;
  initializeAssetServices: typeof initializeAssetServices;
  getAssetService: typeof getAssetService;
  hasAssetService: typeof hasAssetService;
  getRegisteredCategories: typeof getRegisteredCategories;
  queryAssetsBySdk: typeof queryAssetsBySdk;
  importAssetBySdk: typeof importAssetBySdk;
  importAssetFromUrlBySdk: typeof importAssetFromUrlBySdk;
  renameAssetBySdk: typeof renameAssetBySdk;
  deleteAssetBySdk: typeof deleteAssetBySdk;
  resolveAssetPrimaryUrlBySdk: typeof resolveAssetPrimaryUrlBySdk;
}

const localAssetAdapter: AssetBusinessAdapter = {
  assetService,
  ASSET_CATEGORIES,
  setMediaAnalysisAdapter,
  assetServiceRegistry,
  initializeAssetServices,
  getAssetService,
  hasAssetService,
  getRegisteredCategories,
  queryAssetsBySdk,
  importAssetBySdk,
  importAssetFromUrlBySdk,
  renameAssetBySdk,
  deleteAssetBySdk,
  resolveAssetPrimaryUrlBySdk
};

export const assetBusinessService: AssetBusinessAdapter = localAssetAdapter;

export type { AssetSdkQueryCategory };
