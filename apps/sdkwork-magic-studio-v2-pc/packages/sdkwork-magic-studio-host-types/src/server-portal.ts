export type MagicStudioPortalFeedContentType =
  | 'image'
  | 'video'
  | 'audio'
  | 'music'
  | 'voice'
  | 'short'
  | 'character';

export type MagicStudioPortalFeedQueryContentType =
  | 'all'
  | MagicStudioPortalFeedContentType;

export type MagicStudioPortalDiscoverTab =
  | 'trending'
  | 'latest'
  | 'following';

export type MagicStudioPortalFeaturedStrategy =
  | 'hot'
  | 'top'
  | 'recommended'
  | 'most-viewed'
  | 'most-liked';

export interface MagicStudioPortalFeedAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isFollowing: boolean;
}

export interface MagicStudioPortalFeedStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  collects: number;
}

export interface MagicStudioPortalFeed {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  coverUrl?: string | null;
  contentType: MagicStudioPortalFeedContentType;
  tags: string[];
  author: MagicStudioPortalFeedAuthor;
  stats: MagicStudioPortalFeedStats;
  categoryId?: number | null;
  source?: string | null;
  sourceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  isCollected: boolean;
}

export interface MagicStudioPortalFeedListQuery {
  keyword?: string;
  contentType?: MagicStudioPortalFeedQueryContentType;
  page?: number;
  pageSize?: number;
  categoryId?: number;
}

export interface MagicStudioPortalFeaturedFeedQuery
  extends MagicStudioPortalFeedListQuery {
  strategy?: MagicStudioPortalFeaturedStrategy;
}

export interface MagicStudioPortalDiscoverFeedQuery
  extends MagicStudioPortalFeedListQuery {
  tab?: MagicStudioPortalDiscoverTab;
}

export interface MagicStudioPortalFeedCreateRequest {
  title?: string | null;
  content: string;
  summary?: string | null;
  coverUrl?: string | null;
  categoryId?: number | null;
  source?: string | null;
  sourceUrl?: string | null;
  contentType?: MagicStudioPortalFeedContentType | null;
  tags?: string[] | null;
}
