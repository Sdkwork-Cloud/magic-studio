import { Page, PageRequest } from '@sdkwork/react-commons';
import type { AssetType, AnyAsset, Asset } from '../../entities';
import { createSpringPage } from './springPage';
import { mapContentKeyToMediaType, normalizeSpringPageRequest } from '../../asset-center';
import { assetBusinessService } from '../assetBusinessService';

type QueryCategory = AssetType | 'media' | 'effects' | 'transitions';

const toAnyAsset = (asset: Asset): AnyAsset => ({
  id: asset.id,
  uuid: asset.uuid,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt,
  name: asset.name,
  type: mapContentKeyToMediaType(asset.type),
  path: asset.path,
  url: typeof asset.metadata?.primaryUrl === 'string' ? asset.metadata.primaryUrl : asset.path,
  mimeType: typeof asset.metadata?.mimeType === 'string' ? asset.metadata.mimeType : undefined,
  size: asset.size,
  origin: asset.origin,
  metadata: asset.metadata,
  isFavorite: asset.isFavorite
});

export class CoreAssetQueryService {
  async query(category: QueryCategory, pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
    const normalized = normalizeSpringPageRequest(pageRequest);
    return this.queryFromSdk(category, normalized);
  }

  private resolveAllowedTypes(category: QueryCategory): AssetType[] | undefined {
    switch (category) {
      case 'effects':
        return ['effect'];
      case 'transitions':
        return ['transition'];
      case 'media':
        return ['video', 'image'];
      default:
        return [category];
    }
  }

  private async queryFromSdk(category: QueryCategory, normalized: PageRequest): Promise<Page<AnyAsset>> {
    try {
      const result = await assetBusinessService.queryAssetsBySdk({
        category,
        pageRequest: normalized,
        allowedTypes: this.resolveAllowedTypes(category)
      });

      const content = result.content.map((item) => toAnyAsset(item));
      return {
        ...result,
        content,
        numberOfElements: content.length,
        empty: content.length === 0
      };
    } catch (error) {
      console.warn('[CoreAssetQueryService] Query sdk assets failed', error);
      return createSpringPage([], normalized);
    }
  }
}
