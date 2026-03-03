import { createServiceAdapterController } from '@sdkwork/react-commons';
import { ASSET_CATEGORIES, assetService, setMediaAnalysisAdapter } from './assetService';
import { assetServiceRegistry } from './AssetServiceRegistry';
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
}

const localAssetAdapter: AssetBusinessAdapter = {
  assetService,
  ASSET_CATEGORIES,
  setMediaAnalysisAdapter,
  assetServiceRegistry,
  initializeAssetServices,
  getAssetService,
  hasAssetService,
  getRegisteredCategories
};

const controller = createServiceAdapterController<AssetBusinessAdapter>(localAssetAdapter);

export const assetBusinessService: AssetBusinessAdapter = controller.service;
export const setAssetBusinessAdapter = controller.setAdapter;
export const getAssetBusinessAdapter = controller.getAdapter;
export const resetAssetBusinessAdapter = controller.resetAdapter;
