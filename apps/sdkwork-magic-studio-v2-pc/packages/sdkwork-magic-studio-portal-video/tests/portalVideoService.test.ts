import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PortalVideoService } from '../src/services/portalVideoService';

const buildFeed = (overrides = {}) => ({
  id: '101',
  title: 'Hero Clip',
  content: 'Cinematic trailer prompt',
  summary: 'Cinematic trailer',
  coverUrl: 'https://cdn.example.com/hero.mp4',
  contentType: 'video',
  tags: ['16:9', 'model:Runway'],
  categoryId: 8,
  source: 'magic-studio-v2',
  sourceUrl: 'https://example.com/hero',
  author: {
    id: '8',
    name: 'Nova',
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
  isLiked: true,
  isCollected: false,
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
  ...overrides,
});

const buildListEnvelope = (items: unknown[]) => ({
  requestId: 'request-portal-feed-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items,
  meta: {
    page: 1,
    pageSize: 20,
    total: items.length,
    version: '2026-04-25',
  },
});

const buildEnvelope = (data: unknown) => ({
  requestId: 'request-portal-feed',
  timestamp: '2026-04-25T00:00:00.000Z',
  data,
  meta: {
    version: '2026-04-25',
  },
});

describe('portalVideoService', () => {
  const serverClient = {
    createPortalFeed: vi.fn(),
    listPortalFeaturedFeeds: vi.fn(),
    listPortalDiscoverFeeds: vi.fn(),
    readPortalFeed: vi.fn(),
    likePortalFeed: vi.fn(),
    unlikePortalFeed: vi.fn(),
    collectPortalFeed: vi.fn(),
    uncollectPortalFeed: vi.fn(),
    sharePortalFeed: vi.fn(),
    deletePortalFeed: vi.fn(),
  };

  let service: PortalVideoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PortalVideoService({ serverClient });
  });

  it('loads featured feeds from the canonical runtime server and maps them into gallery items', async () => {
    serverClient.listPortalFeaturedFeeds.mockResolvedValue(
      buildListEnvelope([buildFeed()]),
    );

    const items = await service.getFeaturedWorks({
      strategy: 'hot',
      page: 2,
      size: 12,
    });

    expect(serverClient.listPortalFeaturedFeeds).toHaveBeenCalledWith({
      strategy: 'hot',
      keyword: undefined,
      contentType: undefined,
      page: 2,
      pageSize: 12,
      categoryId: undefined,
    });
    expect(items).toEqual([
      expect.objectContaining({
        id: '101',
        type: 'video',
        title: 'Hero Clip',
        prompt: 'Cinematic trailer',
        url: 'https://cdn.example.com/hero.mp4',
        videoUrl: 'https://cdn.example.com/hero.mp4',
        aspectRatio: '16:9',
        model: 'Runway',
        author: expect.objectContaining({
          id: '8',
          name: 'Nova',
          avatar: 'https://cdn.example.com/avatar.png',
          isFollowing: true,
        }),
        stats: expect.objectContaining({
          views: 99,
          likes: 12,
          comments: 3,
          isLiked: true,
        }),
      }),
    ]);
  });

  it('routes latest and following tabs through the discover feed endpoint', async () => {
    serverClient.listPortalDiscoverFeeds.mockResolvedValue(
      buildListEnvelope([buildFeed({ id: 'latest-1', title: 'Latest Clip' })]),
    );

    const items = await service.getFeaturedWorks({
      tab: 'latest',
      contentType: 'video',
      page: 3,
      size: 6,
    });

    expect(serverClient.listPortalFeaturedFeeds).not.toHaveBeenCalled();
    expect(serverClient.listPortalDiscoverFeeds).toHaveBeenCalledWith({
      tab: 'latest',
      keyword: undefined,
      contentType: 'video',
      page: 3,
      pageSize: 6,
      categoryId: undefined,
    });
    expect(items[0]).toEqual(
      expect.objectContaining({
        id: 'latest-1',
        title: 'Latest Clip',
      }),
    );
  });

  it('creates a feed through the canonical runtime server and maps the created gallery item', async () => {
    serverClient.createPortalFeed.mockResolvedValue(
      buildEnvelope(
        buildFeed({
          id: '202',
          title: 'Launch Post',
          content: 'Portal launch',
          summary: 'Portal launch',
          coverUrl: 'https://cdn.example.com/launch.png',
          contentType: 'image',
          tags: ['1:1'],
          author: {
            id: '3',
            name: 'Ava',
            avatarUrl: null,
            isFollowing: false,
          },
        }),
      ),
    );

    const item = await service.createFeed({
      title: 'Launch Post',
      content: 'Portal launch',
      coverImage: 'https://cdn.example.com/launch.png',
      source: 'magic-studio-v2',
      sourceUrl: 'https://example.com/post',
    });

    expect(serverClient.createPortalFeed).toHaveBeenCalledWith({
      title: 'Launch Post',
      content: 'Portal launch',
      summary: undefined,
      coverUrl: 'https://cdn.example.com/launch.png',
      categoryId: undefined,
      source: 'magic-studio-v2',
      sourceUrl: 'https://example.com/post',
      contentType: undefined,
      tags: undefined,
    });
    expect(item).toEqual(
      expect.objectContaining({
        id: '202',
        type: 'image',
        title: 'Launch Post',
        url: 'https://cdn.example.com/launch.png',
      }),
    );
  });

  it('does not import generated SDK types directly from retired generic app SDK', async () => {
    const source = await readFile(
      new URL('../src/services/portalVideoService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`@sdkwork/${'app'}-sdk`)).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });

  it('ships a feed contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('../src/services/portalFeed.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();

    const source = await readFile(
      new URL('../src/services/portalFeed.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });

  it('ships a dedicated portal-video contract tsconfig', async () => {
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
