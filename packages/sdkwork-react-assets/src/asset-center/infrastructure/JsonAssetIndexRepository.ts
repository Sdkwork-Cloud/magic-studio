import { pathUtils } from '@sdkwork/react-commons';
import type {
  AssetBusinessDomain,
  AssetCenterPageRequest,
  AssetCenterStats,
  AssetContentKey,
  UnifiedDigitalAsset,
  UnifiedAssetQueryResult
} from '@sdkwork/react-types';
import type { AssetIndexPort } from '../ports/AssetIndexPort';
import type { AssetVfsPort } from '../ports/AssetVfsPort';
import { createSpringPage } from '../../services/impl/springPage';

const INDEX_RELATIVE_PATH = 'asset-center/index.json';
type SortOrder = { field: string; direction: 'asc' | 'desc' };
const DEFAULT_SORT_ORDERS: SortOrder[] = [{ field: 'updatedAt', direction: 'desc' }];

export class JsonAssetIndexRepository implements AssetIndexPort {
  private initialized = false;
  private cache = new Map<string, UnifiedDigitalAsset>();

  constructor(private readonly vfsPort: AssetVfsPort) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    const indexPath = await this.getIndexPath();
    const indexDir = pathUtils.dirname(indexPath);
    await this.vfsPort.ensureDir(indexDir);

    const exists = await this.vfsPort.exists(indexPath);
    if (!exists) {
      await this.vfsPort.writeText(indexPath, JSON.stringify([], null, 2));
      this.initialized = true;
      return;
    }

    try {
      const raw = await this.vfsPort.readText(indexPath);
      const parsed = JSON.parse(raw) as UnifiedDigitalAsset[];
      parsed.forEach((asset) => this.cache.set(asset.assetId, asset));
    } catch {
      await this.vfsPort.writeText(indexPath, JSON.stringify([], null, 2));
    }
    this.initialized = true;
  }

  async save(asset: UnifiedDigitalAsset): Promise<void> {
    await this.initialize();
    this.cache.set(asset.assetId, asset);
    await this.flush();
  }

  async saveMany(assets: UnifiedDigitalAsset[]): Promise<void> {
    await this.initialize();
    assets.forEach((asset) => this.cache.set(asset.assetId, asset));
    await this.flush();
  }

  async findById(assetId: string): Promise<UnifiedDigitalAsset | null> {
    await this.initialize();
    return this.cache.get(assetId) || null;
  }

  async deleteById(assetId: string): Promise<void> {
    await this.initialize();
    this.cache.delete(assetId);
    await this.flush();
  }

  async query(input: AssetCenterPageRequest): Promise<UnifiedAssetQueryResult> {
    await this.initialize();
    let records = Array.from(this.cache.values());

    if (!input.includeDeleted) {
      records = records.filter((item) => item.status !== 'deleted');
    }

    const scopeFilter = input.scope;
    if (scopeFilter) {
      records = records.filter((item) => {
        const scope = item.scope;
        return (
          (!scopeFilter.workspaceId || scope.workspaceId === scopeFilter.workspaceId) &&
          (!scopeFilter.projectId || scope.projectId === scopeFilter.projectId) &&
          (!scopeFilter.collectionId || scope.collectionId === scopeFilter.collectionId) &&
          (!scopeFilter.domain || scope.domain === scopeFilter.domain)
        );
      });
    }

    if (input.types && input.types.length > 0) {
      records = records.filter((item) => input.types!.includes(item.primaryType));
    }

    if (input.status && input.status.length > 0) {
      records = records.filter((item) => input.status!.includes(item.status));
    }

    if (input.origins && input.origins.length > 0) {
      const originSet = new Set(input.origins);
      records = records.filter((item) => {
        const origin = this.resolveOrigin(item);
        return !!origin && originSet.has(origin);
      });
    }

    if (input.reference) {
      const { entityId, entityType, relation } = input.reference;
      records = records.filter((item) => {
        const refs = item.references || [];
        return refs.some((ref) => {
          const matchEntityType = !entityType || ref.entityType === entityType;
          const matchEntityId = !entityId || ref.entityId === entityId;
          const matchRelation = !relation || ref.relation === relation;
          return matchEntityType && matchEntityId && matchRelation;
        });
      });
    }

    if (input.tags && input.tags.length > 0) {
      records = records.filter((item) => {
        const tags = item.tags || [];
        return input.tags!.every((tag) => tags.includes(tag));
      });
    }

    if (input.keyword && input.keyword.trim().length > 0) {
      const keyword = input.keyword.trim().toLowerCase();
      records = records.filter((item) => {
        const title = item.title.toLowerCase();
        const description = (item.description || '').toLowerCase();
        const tags = (item.tags || []).join(' ').toLowerCase();
        return title.includes(keyword) || description.includes(keyword) || tags.includes(keyword);
      });
    }

    const requestedSortTokens = input.sort
      ?.map((item) => item.trim())
      .filter((item): item is string => item.length > 0);
    const requestedSortOrders = this.parseSortOrders(requestedSortTokens, false);
    const effectiveSortOrders = requestedSortOrders.length > 0 ? requestedSortOrders : DEFAULT_SORT_ORDERS;
    records.sort((a, b) => this.compareBySort(a, b, effectiveSortOrders));

    const page = Math.max(0, input.page);
    const size = Math.max(1, input.size);
    return createSpringPage(records, {
      page,
      size,
      sort: requestedSortOrders.map((order) => `${order.field},${order.direction}`)
    });
  }

  private parseSortOrders(sort?: string[], fallback = true): SortOrder[] {
    if (!sort || sort.length === 0) {
      return fallback ? [...DEFAULT_SORT_ORDERS] : [];
    }

    const orders = sort
      .map((item) => {
        const [rawField, rawDirection] = item.split(',');
        const field = (rawField || '').trim();
        if (!field) {
          return null;
        }
        const direction = rawDirection?.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
        return { field, direction };
      })
      .filter((item): item is SortOrder => item !== null);

    if (orders.length > 0) {
      return orders;
    }

    return fallback ? [...DEFAULT_SORT_ORDERS] : [];
  }

  private compareBySort(
    a: UnifiedDigitalAsset,
    b: UnifiedDigitalAsset,
    sortOrders: SortOrder[]
  ): number {
    const getValue = (item: UnifiedDigitalAsset, field: string): string | number => {
      switch (field) {
        case 'title':
          return item.title.toLowerCase();
        case 'createdAt':
          return Number(item.createdAt) || new Date(String(item.createdAt)).getTime();
        case 'updatedAt':
          return Number(item.updatedAt) || new Date(String(item.updatedAt)).getTime();
        case 'primaryType':
          return item.primaryType;
        case 'status':
          return item.status;
        default:
          return Number(item.updatedAt) || new Date(String(item.updatedAt)).getTime();
      }
    };

    for (const sort of sortOrders) {
      const directionFactor = sort.direction === 'asc' ? 1 : -1;
      const av = getValue(a, sort.field);
      const bv = getValue(b, sort.field);

      if (typeof av === 'number' && typeof bv === 'number') {
        const result = (av - bv) * directionFactor;
        if (result !== 0) {
          return result;
        }
        continue;
      }

      const as = String(av);
      const bs = String(bv);
      const result = as.localeCompare(bs) * directionFactor;
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  }

  private resolveOrigin(
    item: UnifiedDigitalAsset
  ): 'upload' | 'ai' | 'stock' | 'system' | undefined {
    const metadataOrigin = item.metadata && typeof item.metadata.origin === 'string'
      ? item.metadata.origin
      : undefined;
    if (
      metadataOrigin === 'upload' ||
      metadataOrigin === 'ai' ||
      metadataOrigin === 'stock' ||
      metadataOrigin === 'system'
    ) {
      return metadataOrigin;
    }

    const atomicOrigin = item.payload.assets
      .map((resource) => (typeof resource.origin === 'string' ? resource.origin : undefined))
      .find((origin) => origin !== undefined);
    if (
      atomicOrigin === 'upload' ||
      atomicOrigin === 'ai' ||
      atomicOrigin === 'stock' ||
      atomicOrigin === 'system'
    ) {
      return atomicOrigin;
    }

    return undefined;
  }

  async list(): Promise<UnifiedDigitalAsset[]> {
    await this.initialize();
    return Array.from(this.cache.values());
  }

  async count(): Promise<AssetCenterStats> {
    await this.initialize();
    const records = Array.from(this.cache.values());
    const stats: AssetCenterStats = {
      totalAssets: records.length,
      totalReady: 0,
      totalProcessing: 0,
      totalArchived: 0,
      totalDeleted: 0,
      totalFavorites: 0,
      byType: this.createZeroByType(),
      byDomain: this.createZeroByDomain()
    };

    for (const item of records) {
      if (item.status === 'ready') stats.totalReady += 1;
      if (item.status === 'processing') stats.totalProcessing += 1;
      if (item.status === 'archived') stats.totalArchived += 1;
      if (item.status === 'deleted') stats.totalDeleted += 1;
      if (item.isFavorite) stats.totalFavorites += 1;
      stats.byType[item.primaryType] += 1;
      stats.byDomain[item.scope.domain] += 1;
    }

    return stats;
  }

  private async getIndexPath(): Promise<string> {
    const root = await this.vfsPort.getLibraryRoot();
    return pathUtils.join(root, INDEX_RELATIVE_PATH);
  }

  private async flush(): Promise<void> {
    const indexPath = await this.getIndexPath();
    const records = Array.from(this.cache.values());
    await this.vfsPort.writeText(indexPath, JSON.stringify(records, null, 2));
  }

  private createZeroByType(): Record<AssetContentKey, number> {
    return {
      image: 0,
      video: 0,
      audio: 0,
      music: 0,
      voice: 0,
      text: 0,
      character: 0,
      digitalHuman: 0,
      model3d: 0,
      lottie: 0,
      file: 0,
      effect: 0,
      transition: 0,
      subtitle: 0,
      sfx: 0
    };
  }

  private createZeroByDomain(): Record<AssetBusinessDomain, number> {
    return {
      'asset-center': 0,
      notes: 0,
      canvas: 0,
      'image-studio': 0,
      'video-studio': 0,
      'audio-studio': 0,
      music: 0,
      'voice-speaker': 0,
      magiccut: 0,
      film: 0,
      'portal-video': 0,
      character: 0,
      sfx: 0
    };
  }
}
