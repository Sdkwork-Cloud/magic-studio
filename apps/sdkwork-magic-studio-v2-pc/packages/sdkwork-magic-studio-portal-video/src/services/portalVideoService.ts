import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import type {
  MagicStudioPortalDiscoverFeedQuery,
  MagicStudioPortalDiscoverTab,
  MagicStudioPortalFeedContentType,
  MagicStudioPortalFeedCreateRequest,
  MagicStudioPortalFeaturedFeedQuery,
  MagicStudioPortalFeaturedStrategy,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type { GalleryItem } from '@sdkwork/magic-studio-types/content';

import {
  mapPortalFeedToGalleryItem,
  mapPortalFeedsToGalleryItems,
} from './portalServerMapper';

export type PortalDiscoverTab = MagicStudioPortalDiscoverTab;
export type PortalFeaturedStrategy = MagicStudioPortalFeaturedStrategy;

export interface PortalFeedQuery {
  tab?: PortalDiscoverTab;
  keyword?: string;
  contentType?: 'all' | 'image' | 'video' | 'audio' | 'music';
  page?: number;
  size?: number;
  categoryId?: number;
  strategy?: PortalFeaturedStrategy;
}

export interface PortalFeedCreateInput {
  title?: string;
  content: string;
  summary?: string;
  coverImage?: string;
  categoryId?: number;
  source?: string;
  sourceUrl?: string;
  contentType?: MagicStudioPortalFeedContentType;
  tags?: string[];
}

type PortalVideoServerClient = Pick<
  MagicStudioServerClient,
  | 'createPortalFeed'
  | 'listPortalFeaturedFeeds'
  | 'listPortalDiscoverFeeds'
  | 'readPortalFeed'
  | 'likePortalFeed'
  | 'unlikePortalFeed'
  | 'collectPortalFeed'
  | 'uncollectPortalFeed'
  | 'sharePortalFeed'
  | 'deletePortalFeed'
>;

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePositive(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

function mapQueryContentType(
  contentType?: PortalFeedQuery['contentType'],
): MagicStudioPortalFeaturedFeedQuery['contentType'] {
  if (!contentType) {
    return undefined;
  }
  return contentType;
}

function toFeaturedQuery(query: PortalFeedQuery = {}): MagicStudioPortalFeaturedFeedQuery {
  return {
    strategy: query.strategy,
    keyword: normalizeText(query.keyword) || undefined,
    contentType: mapQueryContentType(query.contentType),
    page: normalizePositive(query.page, 1),
    pageSize: normalizePositive(query.size, 20),
    categoryId: query.categoryId,
  };
}

function toDiscoverQuery(query: PortalFeedQuery = {}): MagicStudioPortalDiscoverFeedQuery {
  return {
    tab: query.tab || 'trending',
    keyword: normalizeText(query.keyword) || undefined,
    contentType: mapQueryContentType(query.contentType),
    page: normalizePositive(query.page, 1),
    pageSize: normalizePositive(query.size, 20),
    categoryId: query.categoryId,
  };
}

function toCreatePayload(input: PortalFeedCreateInput): MagicStudioPortalFeedCreateRequest {
  return {
    title: normalizeText(input.title) || undefined,
    content: normalizeText(input.content),
    summary: normalizeText(input.summary) || undefined,
    coverUrl: normalizeText(input.coverImage) || undefined,
    categoryId: input.categoryId,
    source: normalizeText(input.source) || 'magic-studio-v2',
    sourceUrl: normalizeText(input.sourceUrl) || undefined,
    contentType: input.contentType,
    tags:
      Array.isArray(input.tags) && input.tags.length > 0
        ? input.tags.map((tag) => normalizeText(tag)).filter(Boolean)
        : undefined,
  };
}

export interface PortalVideoServiceOptions {
  serverClient?: PortalVideoServerClient;
}

export interface PortalVideoServiceContract {
  createFeed(input: PortalFeedCreateInput): Promise<GalleryItem>;
  getFeaturedWorks(query?: PortalFeedQuery): Promise<GalleryItem[]>;
  getDiscoverWorks(query?: PortalFeedQuery): Promise<GalleryItem[]>;
  getFeedDetail(feedId: string): Promise<GalleryItem>;
  likeFeed(feedId: string): Promise<GalleryItem>;
  unlikeFeed(feedId: string): Promise<GalleryItem>;
  collectFeed(feedId: string): Promise<GalleryItem>;
  uncollectFeed(feedId: string): Promise<GalleryItem>;
  shareFeed(feedId: string): Promise<GalleryItem>;
  deleteFeed(feedId: string): Promise<void>;
}

export class PortalVideoService implements PortalVideoServiceContract {
  private readonly serverClient?: PortalVideoServerClient;
  private cachedServerClient?: PortalVideoServerClient;

  constructor(options: PortalVideoServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): PortalVideoServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('PortalVideoService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[PortalVideoService] Portal feed capabilities require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  async createFeed(input: PortalFeedCreateInput): Promise<GalleryItem> {
    if (!normalizeText(input.content)) {
      throw new Error('Content is required to publish feed.');
    }

    const response = await this.getServerClient().createPortalFeed(toCreatePayload(input));
    return mapPortalFeedToGalleryItem(response.data);
  }

  async getFeaturedWorks(query: PortalFeedQuery = {}): Promise<GalleryItem[]> {
    if (query.tab === 'latest' || query.tab === 'following') {
      const response = await this.getServerClient().listPortalDiscoverFeeds(
        toDiscoverQuery(query),
      );
      return mapPortalFeedsToGalleryItems(response.items);
    }

    const response = await this.getServerClient().listPortalFeaturedFeeds(
      toFeaturedQuery(query),
    );
    return mapPortalFeedsToGalleryItems(response.items);
  }

  async getDiscoverWorks(query: PortalFeedQuery = {}): Promise<GalleryItem[]> {
    const response = await this.getServerClient().listPortalDiscoverFeeds(
      toDiscoverQuery(query),
    );
    return mapPortalFeedsToGalleryItems(response.items);
  }

  async getFeedDetail(feedId: string): Promise<GalleryItem> {
    const response = await this.getServerClient().readPortalFeed(feedId);
    return mapPortalFeedToGalleryItem(response.data);
  }

  async likeFeed(feedId: string): Promise<GalleryItem> {
    const response = await this.getServerClient().likePortalFeed(feedId);
    return mapPortalFeedToGalleryItem(response.data);
  }

  async unlikeFeed(feedId: string): Promise<GalleryItem> {
    const response = await this.getServerClient().unlikePortalFeed(feedId);
    return mapPortalFeedToGalleryItem(response.data);
  }

  async collectFeed(feedId: string): Promise<GalleryItem> {
    const response = await this.getServerClient().collectPortalFeed(feedId);
    return mapPortalFeedToGalleryItem(response.data);
  }

  async uncollectFeed(feedId: string): Promise<GalleryItem> {
    const response = await this.getServerClient().uncollectPortalFeed(feedId);
    return mapPortalFeedToGalleryItem(response.data);
  }

  async shareFeed(feedId: string): Promise<GalleryItem> {
    const response = await this.getServerClient().sharePortalFeed(feedId);
    return mapPortalFeedToGalleryItem(response.data);
  }

  async deleteFeed(feedId: string): Promise<void> {
    await this.getServerClient().deletePortalFeed(feedId);
  }
}

export const portalVideoService = new PortalVideoService();
