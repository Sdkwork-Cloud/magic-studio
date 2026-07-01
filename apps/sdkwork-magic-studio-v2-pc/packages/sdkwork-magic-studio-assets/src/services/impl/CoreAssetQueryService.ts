import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { AssetType, AnyAsset, Asset } from '../../entities';
import type { AssetBusinessDomain } from '@sdkwork/magic-studio-types/asset-center';
import { createSpringPage } from './springPage';
import {
  isRenderableAssetUrl,
  mapContentKeyToMediaType,
  normalizeSpringPageRequest,
} from '../../asset-center';
import { assetBusinessService } from '../assetBusinessService';

type QueryCategory = AssetType | 'media' | 'effects' | 'transitions';

export interface CoreAssetQueryServiceOptions {
  domain?: AssetBusinessDomain;
}

const toAnyAsset = (asset: Asset): AnyAsset => ({
  id: asset.id,
  uuid: asset.uuid,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt,
  name: asset.name,
  type: mapContentKeyToMediaType(asset.type),
  path: asset.path,
  ...(isRenderableAssetUrl(asset.metadata?.primaryUrl)
    ? { url: asset.metadata.primaryUrl }
    : isRenderableAssetUrl(asset.path)
      ? { url: asset.path }
      : {}),
  mimeType: typeof asset.metadata?.mimeType === 'string' ? asset.metadata.mimeType : undefined,
  size: asset.size,
  origin: asset.origin,
  metadata: asset.metadata,
  isFavorite: asset.isFavorite
});

export class CoreAssetQueryService {
  constructor(private readonly options: CoreAssetQueryServiceOptions = {}) {}

  async query(category: QueryCategory, pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
    const normalizedRequest = normalizeSpringPageRequest(pageRequest);
    const normalized: PageRequest = {
      page: normalizedRequest.page,
      size: normalizedRequest.size,
      ...(normalizedRequest.keyword ? { keyword: normalizedRequest.keyword } : {}),
      ...(normalizedRequest.sort && normalizedRequest.sort.length > 0
        ? { sort: normalizedRequest.sort }
        : {}),
    };
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
        allowedTypes: this.resolveAllowedTypes(category),
        domain: this.options.domain || 'asset-center',
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
