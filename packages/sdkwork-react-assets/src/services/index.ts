export { assetService, ASSET_CATEGORIES, setMediaAnalysisAdapter } from './assetService';
export type { MediaAnalysisAdapter, MediaAnalysisResult } from './assetService';

// Enhanced asset types and services
export { assetServiceRegistry } from './AssetServiceRegistry';
export type { IAssetService } from './IAssetService';
export { initializeAssetServices, getAssetService, hasAssetService, getRegisteredCategories } from './assetServiceInitializer';

// Implementation services
export * from './impl';
