import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryAssetsBySdk } = vi.hoisted(() => ({
  queryAssetsBySdk: vi.fn(),
}));

vi.mock('../src/services/assetBusinessService', () => ({
  assetBusinessService: {
    queryAssetsBySdk,
  },
}));

import type { Page } from '@sdkwork/magic-studio-commons';
import type { Asset } from '../src/entities';
import {
  AudioAssetService,
  CharacterAssetService,
  CoreAssetQueryService,
  ImageAssetService,
  MediaAssetService,
  MusicAssetService,
  SfxAssetService,
  VideoAssetService,
} from '../src/services/impl';

const createAssetPage = (asset: Partial<Asset> = {}): Page<Asset> => ({
  content: [
    {
      id: 'asset-1',
      uuid: 'asset-uuid-1',
      name: 'Asset One',
      type: 'image',
      path: 'https://cdn.example.com/asset-1.png',
      size: 1024,
      origin: 'upload',
      createdAt: '2026-04-05T00:00:00.000Z',
      updatedAt: '2026-04-05T00:00:00.000Z',
      metadata: {
        primaryUrl: 'https://cdn.example.com/asset-1.png',
        mimeType: 'image/png',
      },
      ...asset,
    },
  ],
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    offset: 0,
    paged: true,
    unpaged: false,
    sort: {
      sorted: true,
      unsorted: false,
      empty: false,
    },
  },
  totalPages: 1,
  totalElements: 1,
  last: true,
  size: 20,
  number: 0,
  sort: {
    sorted: true,
    unsorted: false,
    empty: false,
  },
  first: true,
  numberOfElements: 1,
  empty: false,
});

describe('CoreAssetQueryService', () => {
  beforeEach(() => {
    queryAssetsBySdk.mockReset();
  });

  it('passes an explicit domain through to queryAssetsBySdk', async () => {
    queryAssetsBySdk.mockResolvedValue(createAssetPage());
    const service = new CoreAssetQueryService({ domain: 'image-studio' });

    await service.query('image', {
      page: 1,
      size: 10,
      keyword: 'hero',
      sort: ['updatedAt,desc'],
    });

    expect(queryAssetsBySdk).toHaveBeenCalledWith({
      category: 'image',
      pageRequest: {
        page: 1,
        size: 10,
        keyword: 'hero',
        sort: ['updatedAt,desc'],
      },
      allowedTypes: ['image'],
      domain: 'image-studio',
    });
  });

  it('keeps asset-center as the default domain for generic media queries', async () => {
    queryAssetsBySdk.mockResolvedValue(createAssetPage({ type: 'video' }));
    const service = new CoreAssetQueryService();

    await service.query('media');

    expect(queryAssetsBySdk).toHaveBeenCalledWith({
      category: 'media',
      pageRequest: {
        page: 0,
        size: 20,
      },
      allowedTypes: ['video', 'image'],
      domain: 'asset-center',
    });
  });

  it('does not expose canonical asset locators as render urls when no delivery url exists', async () => {
    queryAssetsBySdk.mockResolvedValue(
      createAssetPage({
        path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/asset-1.png',
        metadata: {
          mimeType: 'image/png',
        },
      })
    );
    const service = new CoreAssetQueryService({ domain: 'image-studio' });

    const result = await service.query('image');

    expect(result.content[0]).toMatchObject({
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/asset-1.png',
      mimeType: 'image/png',
    });
    expect((result.content[0] as { url?: string }).url).toBeUndefined();
  });
});

describe('category asset services', () => {
  beforeEach(() => {
    queryAssetsBySdk.mockReset();
    queryAssetsBySdk.mockResolvedValue(createAssetPage());
  });

  it('ImageAssetService defaults to image-studio', async () => {
    await new ImageAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'image',
      domain: 'image-studio',
    }));
  });

  it('VideoAssetService defaults to video-studio', async () => {
    await new VideoAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'video',
      domain: 'video-studio',
    }));
  });

  it('AudioAssetService defaults to audio-studio', async () => {
    await new AudioAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'audio',
      domain: 'audio-studio',
    }));
  });

  it('MusicAssetService defaults to music', async () => {
    await new MusicAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'music',
      domain: 'music',
    }));
  });

  it('SfxAssetService defaults to sfx', async () => {
    await new SfxAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'sfx',
      domain: 'sfx',
    }));
  });

  it('CharacterAssetService defaults to character', async () => {
    await new CharacterAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'character',
      domain: 'character',
    }));
  });

  it('MediaAssetService keeps asset-center as the aggregate default', async () => {
    await new MediaAssetService().findAll();
    expect(queryAssetsBySdk).toHaveBeenCalledWith(expect.objectContaining({
      category: 'media',
      domain: 'asset-center',
    }));
  });
});
