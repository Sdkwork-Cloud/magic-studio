import type {
  MagicStudioPortalFeed,
  MagicStudioPortalFeedContentType,
} from '@sdkwork/magic-studio-server';
import type {
  GalleryItem,
  GalleryItemType,
} from '@sdkwork/magic-studio-types/content';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveType(contentType: MagicStudioPortalFeedContentType): GalleryItemType {
  if (contentType === 'image') {
    return 'image';
  }
  if (contentType === 'short') {
    return 'short';
  }
  if (contentType === 'music') {
    return 'music';
  }
  if (contentType === 'audio' || contentType === 'voice') {
    return 'voice';
  }
  if (contentType === 'character') {
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
  return tags.find(Boolean) || 'Magic Studio';
}

function buildAuthorColor(seed: string): string {
  const palette = ['bg-blue-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-purple-600', 'bg-pink-600'];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function mapPortalFeedToGalleryItem(feed: MagicStudioPortalFeed): GalleryItem {
  const tags = Array.isArray(feed.tags)
    ? feed.tags.map((tag) => normalizeText(tag)).filter(Boolean)
    : [];
  const authorName = normalizeText(feed.author?.name) || 'Creator';
  const authorId = normalizeText(feed.author?.id) || feed.id;
  const type = resolveType(feed.contentType);
  const cover = normalizeText(feed.coverUrl);

  return {
    id: normalizeText(feed.id),
    type,
    title: normalizeText(feed.title) || `Creation #${feed.id}`,
    prompt:
      normalizeText(feed.summary)
      || normalizeText(feed.content)
      || normalizeText(feed.title)
      || '',
    url: cover,
    videoUrl: type === 'video' && cover ? cover : undefined,
    aspectRatio: resolveAspectRatio(tags),
    author: {
      id: authorId,
      name: authorName,
      avatar: normalizeText(feed.author?.avatarUrl) || undefined,
      initial: authorName[0]?.toUpperCase() || 'C',
      color: buildAuthorColor(authorId),
      isFollowing: Boolean(feed.author?.isFollowing),
    },
    stats: {
      views: normalizeNumber(feed.stats?.views, 0),
      likes: normalizeNumber(feed.stats?.likes, 0),
      comments: normalizeNumber(feed.stats?.comments, 0),
      isLiked: Boolean(feed.isLiked),
    },
    model: resolveModel(tags),
    tags,
    createdAt: normalizeText(feed.createdAt) || new Date().toISOString(),
  };
}

export function mapPortalFeedsToGalleryItems(
  feeds: MagicStudioPortalFeed[],
): GalleryItem[] {
  return feeds
    .map(mapPortalFeedToGalleryItem)
    .filter((item) => normalizeText(item.url).length > 0);
}
