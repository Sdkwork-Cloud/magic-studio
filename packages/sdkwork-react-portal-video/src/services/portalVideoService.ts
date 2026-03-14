import type { FeedItemVO, PlusApiResultFeedItemVO, PlusApiResultListFeedItemVO } from '@sdkwork/app-sdk';
import type { GalleryItem, GalleryItemType } from '@sdkwork/react-commons';
import { getAppSdkClientWithSession } from '@sdkwork/react-core';

export type PortalDiscoverTab = 'trending' | 'latest' | 'following';

export interface PortalFeedQuery {
  tab?: PortalDiscoverTab;
  keyword?: string;
  contentType?: 'all' | 'image' | 'video' | 'audio' | 'music';
  page?: number;
  size?: number;
}

export interface PortalFeedCreateInput {
  title?: string;
  content: string;
  coverImage?: string;
  categoryId?: number;
  source?: string;
  sourceUrl?: string;
}

const SUCCESS_CODE = '2000';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function resolveType(contentType?: string): GalleryItemType {
  const normalized = normalizeText(contentType).toLowerCase();
  if (normalized.includes('image')) {
    return 'image';
  }
  if (normalized.includes('short')) {
    return 'short';
  }
  if (normalized.includes('music')) {
    return 'music';
  }
  if (normalized.includes('audio') || normalized.includes('voice') || normalized.includes('speech')) {
    return 'voice';
  }
  if (normalized.includes('character')) {
    return 'character';
  }
  return 'video';
}

function resolveAspectRatio(tags: string[]): string {
  const ratioTag = tags.find((tag) => /^\d+:\d+$/.test(tag));
  return ratioTag || '16:9';
}

function resolveModel(tags: string[]): string {
  const modelTag = tags.find((tag) => tag.toLowerCase().startsWith('model:'));
  if (modelTag) {
    const modelName = modelTag.split(':').slice(1).join(':').trim();
    if (modelName) {
      return modelName;
    }
  }
  return tags.find(Boolean) || 'AI Studio';
}

function buildAuthorColor(seed: string): string {
  const palette = ['bg-blue-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-purple-600', 'bg-pink-600'];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }
  return palette[Math.abs(hash) % palette.length];
}

function mapFeedItemToGalleryItem(item: FeedItemVO, index: number): GalleryItem {
  const itemId = normalizeNumber(item.id, index + 1);
  const itemIdText = String(itemId);
  const tags = Array.isArray(item.tags)
    ? item.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
    : [];
  const authorName = normalizeText(item.author?.name) || 'Creator';
  const authorId = normalizeNumber(item.author?.id, itemId);
  const createdAt = normalizeText(item.createdAt) || new Date().toISOString();
  const type = resolveType(item.contentType);
  const cover = normalizeText(item.coverImage);

  return {
    id: itemIdText,
    type,
    title: normalizeText(item.title) || `Creation #${itemIdText}`,
    prompt: normalizeText(item.summary) || normalizeText(item.content) || normalizeText(item.title) || '',
    url: cover,
    videoUrl: type === 'video' && cover ? cover : undefined,
    aspectRatio: resolveAspectRatio(tags),
    author: {
      id: String(authorId),
      name: authorName,
      avatar: normalizeText(item.author?.avatar) || undefined,
      initial: authorName[0]?.toUpperCase() || 'C',
      color: buildAuthorColor(String(authorId)),
      isFollowing: Boolean(item.author?.isFollowing),
    },
    stats: {
      views: normalizeNumber(item.viewCount, 0),
      likes: normalizeNumber(item.likeCount, 0),
      comments: normalizeNumber(item.commentCount, 0),
      isLiked: Boolean(item.isLiked),
    },
    model: resolveModel(tags),
    tags,
    createdAt,
  };
}

function unwrapFeedListResult(response: PlusApiResultListFeedItemVO, fallbackMessage: string): FeedItemVO[] {
  const code = normalizeText(response?.code);
  if (code && code !== SUCCESS_CODE) {
    throw new Error(normalizeText(response?.msg) || fallbackMessage);
  }
  return Array.isArray(response?.data) ? response.data : [];
}

function unwrapFeedItemResult(response: PlusApiResultFeedItemVO, fallbackMessage: string): FeedItemVO {
  const code = normalizeText(response?.code);
  if (code && code !== SUCCESS_CODE) {
    throw new Error(normalizeText(response?.msg) || fallbackMessage);
  }
  if (!response?.data) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

function buildFeedQuery(options: PortalFeedQuery): Record<string, string | number> {
  const page = clampPositive(normalizeNumber(options.page, DEFAULT_PAGE), DEFAULT_PAGE);
  const size = clampPositive(normalizeNumber(options.size, DEFAULT_PAGE_SIZE), DEFAULT_PAGE_SIZE);
  const params: Record<string, string | number> = {
    page,
    size,
    pageNum: page,
    pageSize: size,
    limit: size,
  };

  const keyword = normalizeText(options.keyword);
  if (keyword) {
    params.keyword = keyword;
  }

  const contentType = normalizeText(options.contentType);
  if (contentType && contentType !== 'all') {
    params.contentType = contentType;
  }

  return params;
}

async function fetchFeedItems(options: PortalFeedQuery): Promise<FeedItemVO[]> {
  const client = getAppSdkClientWithSession();
  const params = buildFeedQuery(options);

  if (normalizeText(options.keyword)) {
    const response = await client.feed.searchFeeds(params);
    return unwrapFeedListResult(response as PlusApiResultListFeedItemVO, 'Failed to search feeds');
  }

  const tab = options.tab || 'trending';
  if (tab === 'latest') {
    const response = await client.feed.getFeedList({
      ...params,
      sortField: 'createdAt',
      sortDirection: 'desc',
    });
    return unwrapFeedListResult(response as PlusApiResultListFeedItemVO, 'Failed to load latest feeds');
  }

  if (tab === 'following') {
    const response = await client.feed.getFeedList({
      ...params,
      type: 'following',
    });
    return unwrapFeedListResult(response as PlusApiResultListFeedItemVO, 'Failed to load following feeds');
  }

  const hotResponse = await client.feed.getHotFeeds(params);
  const hotItems = unwrapFeedListResult(
    hotResponse as PlusApiResultListFeedItemVO,
    'Failed to load hot feeds',
  );
  if (hotItems.length > 0) {
    return hotItems;
  }

  const recommendResponse = await client.feed.getRecommendedFeeds(params);
  return unwrapFeedListResult(
    recommendResponse as PlusApiResultListFeedItemVO,
    'Failed to load recommended feeds',
  );
}

async function fetchAndMapFeedItems(options: PortalFeedQuery): Promise<GalleryItem[]> {
  const items = await fetchFeedItems(options);
  return items
    .map((item, index) => mapFeedItemToGalleryItem(item, index))
    .filter((item) => normalizeText(item.url).length > 0);
}

export const portalVideoService = {
  async createFeed(input: PortalFeedCreateInput): Promise<GalleryItem> {
    const content = normalizeText(input.content);
    if (!content) {
      throw new Error('Content is required to publish feed.');
    }

    const coverImage = normalizeText(input.coverImage);
    const response = await getAppSdkClientWithSession().feed.create({
      title: normalizeText(input.title) || undefined,
      content,
      categoryId: input.categoryId,
      images: coverImage ? [coverImage] : undefined,
      source: normalizeText(input.source) || 'magic-studio-v2',
      sourceUrl: normalizeText(input.sourceUrl) || undefined,
    });
    const created = unwrapFeedItemResult(
      response as PlusApiResultFeedItemVO,
      'Failed to publish feed',
    );
    return mapFeedItemToGalleryItem(created, 0);
  },

  async getFeaturedWorks(query: PortalFeedQuery = {}): Promise<GalleryItem[]> {
    return fetchAndMapFeedItems({
      tab: query.tab || 'trending',
      page: query.page,
      size: query.size,
      contentType: query.contentType,
      keyword: query.keyword,
    });
  },

  async getDiscoverWorks(query: PortalFeedQuery = {}): Promise<GalleryItem[]> {
    return fetchAndMapFeedItems({
      tab: query.tab || 'trending',
      page: query.page,
      size: query.size,
      contentType: query.contentType,
      keyword: query.keyword,
    });
  },
};
