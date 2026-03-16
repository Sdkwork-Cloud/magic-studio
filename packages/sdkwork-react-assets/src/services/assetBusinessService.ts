import { createServiceAdapterController } from '@sdkwork/react-commons';
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

const controller = createServiceAdapterController<AssetBusinessAdapter>(localAssetAdapter);

export const assetBusinessService: AssetBusinessAdapter = controller.service;
export const setAssetBusinessAdapter = (adapter: AssetBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getAssetBusinessAdapter = (): AssetBusinessAdapter => {
  return controller.getAdapter();
};

export const resetAssetBusinessAdapter = (): void => {
  controller.resetAdapter();
};

export type { AssetSdkQueryCategory };
