import { Page, PageRequest } from '@sdkwork/react-commons';
import { AssetType } from '../../entities';
import { AnyAsset } from '../../entities';
import { createSpringPage } from './springPage';
import {
  assetCenterService,
  mapUnifiedPageToAnyAssetPage,
  normalizeSpringPageRequest,
  readWorkspaceScope
} from '../../asset-center';
import type {
  AssetBusinessDomain,
  AssetCenterPageRequest,
  AssetContentKey
} from '@sdkwork/react-types';

type QueryCategory = AssetType | 'media' | 'effects' | 'transitions';

export class CoreAssetQueryService {
  async query(category: QueryCategory, pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
    const normalized = normalizeSpringPageRequest(pageRequest);
    return this.queryFromAssetCenter(category, normalized);
  }

  private resolveFilterType(category: QueryCategory): AssetType | undefined {
    switch (category) {
      case 'effects':
        return 'effect';
      case 'transitions':
        return 'transition';
      case 'media':
        return undefined;
      default:
        return category;
    }
  }

  private async queryFromAssetCenter(category: QueryCategory, normalized: PageRequest): Promise<Page<AnyAsset>> {
    try {
      await assetCenterService.initialize();
      const domain = this.resolveDomain(category);
      const types = this.resolveContentKeys(category);
      const scope = readWorkspaceScope();

      const query: AssetCenterPageRequest = {
        page: normalized.page,
        size: normalized.size,
        sort: normalized.sort,
        keyword: normalized.keyword,
        scope: {
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          domain
        },
        types
      };

      const result = await assetCenterService.query(query);
      return mapUnifiedPageToAnyAssetPage(result);
    } catch (error) {
      console.warn('[CoreAssetQueryService] Query asset-center failed', error);
      return createSpringPage([], normalized);
    }
  }

  private resolveDomain(category: QueryCategory): AssetBusinessDomain {
    switch (category) {
      case 'video':
        return 'video-studio';
      case 'image':
        return 'image-studio';
      case 'audio':
        return 'audio-studio';
      case 'music':
        return 'music';
      case 'character':
        return 'character';
      case 'sfx':
        return 'sfx';
      case 'effects':
      case 'transitions':
      case 'media':
      default:
        return 'asset-center';
    }
  }

  private resolveContentKeys(category: QueryCategory): AssetContentKey[] | undefined {
    switch (category) {
      case 'effects':
        return ['effect'];
      case 'transitions':
        return ['transition'];
      case 'media':
        return ['video', 'image'];
      default:
        return [this.resolveFilterType(category) as AssetContentKey];
    }
  }
}
