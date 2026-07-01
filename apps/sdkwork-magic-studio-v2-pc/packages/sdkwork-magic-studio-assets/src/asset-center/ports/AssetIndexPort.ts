import type {
  AssetCenterPageRequest,
  AssetCenterStats,
  UnifiedDigitalAsset,
  UnifiedAssetQueryResult
} from '@sdkwork/magic-studio-types/asset-center';

export interface AssetIndexPort {
  initialize(): Promise<void>;
  save(asset: UnifiedDigitalAsset): Promise<void>;
  saveMany(assets: UnifiedDigitalAsset[]): Promise<void>;
  findById(assetId: string): Promise<UnifiedDigitalAsset | null>;
  deleteById(assetId: string): Promise<void>;
  query(input: AssetCenterPageRequest): Promise<UnifiedAssetQueryResult>;
  list(): Promise<UnifiedDigitalAsset[]>;
  count(): Promise<AssetCenterStats>;
}
