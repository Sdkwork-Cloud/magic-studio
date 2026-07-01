import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioOperationOkResult,
  MagicStudioPortalDiscoverFeedQuery,
  MagicStudioPortalFeaturedFeedQuery,
  MagicStudioPortalFeed,
  MagicStudioPortalFeedCreateRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeCreateFeedRequest =
  Parameters<MagicStudioServerClient['createPortalFeed']>[0];
type RuntimeCreateFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createPortalFeed']>
>;
type RuntimeFeaturedQuery = NonNullable<
  Parameters<MagicStudioServerClient['listPortalFeaturedFeeds']>[0]
>;
type RuntimeFeaturedList = Awaited<
  ReturnType<MagicStudioServerClient['listPortalFeaturedFeeds']>
>;
type RuntimeDiscoverQuery = NonNullable<
  Parameters<MagicStudioServerClient['listPortalDiscoverFeeds']>[0]
>;
type RuntimeDiscoverList = Awaited<
  ReturnType<MagicStudioServerClient['listPortalDiscoverFeeds']>
>;
type RuntimeReadFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readPortalFeed']>
>;
type RuntimeLikeFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['likePortalFeed']>
>;
type RuntimeUnlikeFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['unlikePortalFeed']>
>;
type RuntimeCollectFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['collectPortalFeed']>
>;
type RuntimeUncollectFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['uncollectPortalFeed']>
>;
type RuntimeShareFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['sharePortalFeed']>
>;
type RuntimeDeleteFeedEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deletePortalFeed']>
>;

const runtimeCreateFeedRequestMatchesServerType: AssertAssignable<
  RuntimeCreateFeedRequest,
  MagicStudioPortalFeedCreateRequest
> = true;
const serverCreateFeedRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioPortalFeedCreateRequest,
  RuntimeCreateFeedRequest
> = true;
const runtimeCreateFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeFeaturedQueryMatchesServerType: AssertAssignable<
  RuntimeFeaturedQuery,
  MagicStudioPortalFeaturedFeedQuery
> = true;
const runtimeFeaturedListMatchesServerType: AssertAssignable<
  RuntimeFeaturedList,
  MagicStudioApiListEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeDiscoverQueryMatchesServerType: AssertAssignable<
  RuntimeDiscoverQuery,
  MagicStudioPortalDiscoverFeedQuery
> = true;
const runtimeDiscoverListMatchesServerType: AssertAssignable<
  RuntimeDiscoverList,
  MagicStudioApiListEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeReadFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeLikeFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeLikeFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeUnlikeFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUnlikeFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeCollectFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCollectFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeUncollectFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUncollectFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeShareFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeShareFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioPortalFeed>
> = true;
const runtimeDeleteFeedEnvelopeMatchesServerType: AssertAssignable<
  RuntimeDeleteFeedEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;

const validPortalFeed = {
  id: 'feed-1',
  title: 'Launch Post',
  content: 'Portal launch',
  summary: 'Portal launch',
  coverUrl: 'https://cdn.example.com/launch.png',
  contentType: 'image',
  categoryId: 8,
  tags: ['1:1', 'model:Runway'],
  author: {
    id: 'author-1',
    name: 'Ava',
    avatarUrl: 'https://cdn.example.com/avatar.png',
    isFollowing: true,
  },
  stats: {
    views: 99,
    likes: 12,
    comments: 3,
    shares: 1,
    collects: 2,
  },
  source: 'magic-studio-v2',
  sourceUrl: 'https://example.com/post',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:01:00.000Z',
  isLiked: true,
  isCollected: false,
} satisfies MagicStudioPortalFeed;

const validCreateFeedRequest = {
  title: validPortalFeed.title,
  content: validPortalFeed.content,
  summary: validPortalFeed.summary,
  coverUrl: validPortalFeed.coverUrl,
  categoryId: validPortalFeed.categoryId,
  source: validPortalFeed.source,
  sourceUrl: validPortalFeed.sourceUrl,
  contentType: validPortalFeed.contentType,
  tags: validPortalFeed.tags,
} satisfies RuntimeCreateFeedRequest;

const validFeaturedQuery = {
  strategy: 'hot',
  contentType: 'video',
  keyword: 'hero',
  page: 1,
  pageSize: 20,
  categoryId: 8,
} satisfies RuntimeFeaturedQuery;

const validDiscoverQuery = {
  tab: 'latest',
  contentType: 'all',
  keyword: 'launch',
  page: 2,
  pageSize: 12,
  categoryId: 8,
} satisfies RuntimeDiscoverQuery;

const validFeedResponse = {
  requestId: 'request-portal-feed',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validPortalFeed,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCreateFeedEnvelope;

const validFeedListResponse = {
  requestId: 'request-portal-feed-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validPortalFeed],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeFeaturedList;

const validDeleteFeedResponse = {
  requestId: 'request-portal-feed-delete',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeDeleteFeedEnvelope;

void runtimeCreateFeedRequestMatchesServerType;
void serverCreateFeedRequestMatchesRuntimeType;
void runtimeCreateFeedEnvelopeMatchesServerType;
void runtimeFeaturedQueryMatchesServerType;
void runtimeFeaturedListMatchesServerType;
void runtimeDiscoverQueryMatchesServerType;
void runtimeDiscoverListMatchesServerType;
void runtimeReadFeedEnvelopeMatchesServerType;
void runtimeLikeFeedEnvelopeMatchesServerType;
void runtimeUnlikeFeedEnvelopeMatchesServerType;
void runtimeCollectFeedEnvelopeMatchesServerType;
void runtimeUncollectFeedEnvelopeMatchesServerType;
void runtimeShareFeedEnvelopeMatchesServerType;
void runtimeDeleteFeedEnvelopeMatchesServerType;
void validCreateFeedRequest;
void validFeaturedQuery;
void validDiscoverQuery;
void validFeedResponse;
void validFeedListResponse;
void validDeleteFeedResponse;
