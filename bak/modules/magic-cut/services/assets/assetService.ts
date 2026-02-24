
import { Asset, AssetType, AssetCategory } from '../../../assets/entities/asset.entity';
import { assetService as coreAssetService } from '../../../assets/services/assetService';
import { MediaResource } from '../../../../types';

// Use Core Categories
import { ASSET_CATEGORIES as CORE_CATEGORIES } from '../../../assets/services/assetService';
export const ASSET_CATEGORIES = CORE_CATEGORIES;

/**
 * Magic Cut Asset Service (Wrapper)
 * Delegates all heavy lifting to the Core Asset Service to ensure consistency.
 */
class AssetService {
  
  async initialize(): Promise<void> {
      await coreAssetService.refreshIndex();
  }

  async scanAssets(): Promise<Asset[]> {
    const result = await coreAssetService.findAll({ page: 0, size: 10000 });
    return result.data?.content || [];
  }

  /**
   * Import asset via Core Service.
   * This ensures "Single Source of Truth".
   */
  async importAsset(fileData: Uint8Array, fileName: string, categoryId: AssetType): Promise<MediaResource> {
      const asset = await coreAssetService.importAsset(fileData, fileName, categoryId, 'upload');
      return coreAssetService.toMediaResource(asset);
  }

  async deleteAsset(path: string): Promise<void> {
      await coreAssetService.deleteById(path);
  }
}

export const assetService = new AssetService();
