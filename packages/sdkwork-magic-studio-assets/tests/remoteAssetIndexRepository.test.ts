import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import type {
  AssetCenterStats,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types/asset-center';
import { RemoteAssetIndexRepository } from '../src/asset-center/infrastructure/RemoteAssetIndexRepository';

type ApiEnvelope<T> = {
  requestId: string;
  timestamp: string;
  data: T;
  meta: {
    version: string;
  };
};

type ApiListEnvelope<T> = {
  requestId: string;
  timestamp: string;
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    version: string;
  };
};

const ok = <T>(data: T): ApiEnvelope<T> => ({
  requestId: 'req-1',
  timestamp: '2026-04-05T00:00:00.000Z',
  data,
  meta: {
    version: 'v1',
  },
});

const okList = <T>(
  items: T[],
  meta: Partial<ApiListEnvelope<T>['meta']> = {},
): ApiListEnvelope<T> => ({
  requestId: 'req-1',
  timestamp: '2026-04-05T00:00:00.000Z',
  items,
  meta: {
    page: 0,
    pageSize: 20,
    total: items.length,
    version: 'v1',
    ...meta,
  },
});

const createAsset = (overrides: Partial<UnifiedDigitalAsset> = {}): UnifiedDigitalAsset =>
  ({
    id: 'asset-1',
    uuid: 'asset-uuid-1',
    assetId: 'asset-1',
    key: 'workspace-1/image-studio/asset-1',
    title: 'Hero Image',
    primaryType: 'image',
    payload: {
      assets: [],
    },
    scope: {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      domain: 'image-studio',
    },
    storage: {
      mode: 'remote-url',
      primary: {
        protocol: 'https',
        uri: 'https://cdn.example.com/assets/hero-image.png',
        url: 'https://cdn.example.com/assets/hero-image.png',
      },
      cacheable: true,
    },
    status: 'ready',
    versionInfo: {
      version: 1,
    },
    createdAt: '2026-04-05T00:00:00.000Z',
    updatedAt: '2026-04-05T00:00:00.000Z',
    ...overrides,
  }) as UnifiedDigitalAsset;

const createStats = (overrides: Partial<AssetCenterStats> = {}): AssetCenterStats => ({
  totalAssets: 2,
  totalReady: 2,
  totalProcessing: 0,
  totalArchived: 0,
  totalDeleted: 0,
  totalFavorites: 1,
  byType: {
    image: 2,
    video: 0,
    audio: 0,
    music: 0,
    voice: 0,
    text: 0,
    character: 0,
    model3d: 0,
    lottie: 0,
    file: 0,
    effect: 0,
    transition: 0,
    subtitle: 0,
    sfx: 0,
  },
  byDomain: {
    'asset-center': 0,
    notes: 0,
    canvas: 0,
    'image-studio': 2,
    'video-studio': 0,
    'audio-studio': 0,
    music: 0,
    'voice-speaker': 0,
    magiccut: 0,
    film: 0,
    'portal-video': 0,
    character: 0,
    sfx: 0,
  },
  ...overrides,
});

describe('RemoteAssetIndexRepository', () => {
  it('routes save through the canonical Magic Studio server upsertAsset method', async () => {
    const asset = createAsset();
    const upsertAsset = vi.fn().mockResolvedValue(ok(asset));
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        upsertAsset,
      }),
    } as never);

    await repository.save(asset);

    expect(upsertAsset).toHaveBeenCalledTimes(1);
    expect(upsertAsset).toHaveBeenCalledWith(
      asset.assetId,
      expect.objectContaining({
        assetId: asset.assetId,
        id: asset.id,
        uuid: asset.uuid,
        key: asset.key,
        title: asset.title,
        primaryType: asset.primaryType,
        scope: asset.scope,
        payload: asset.payload,
        storage: asset.storage,
        versionInfo: asset.versionInfo,
      })
    );
  });

  it('throws a focused server-client boundary error when upsertAsset is unavailable', async () => {
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({}),
    } as never);

    await expect(repository.save(createAsset())).rejects.toThrow(
      'Magic Studio asset server client is unavailable: upsertAsset is required.',
    );
  });

  it('routes saveMany through one canonical upsert per asset', async () => {
    const first = createAsset();
    const second = createAsset({
      id: 'asset-2',
      uuid: 'asset-uuid-2',
      assetId: 'asset-2',
      key: 'workspace-1/image-studio/asset-2',
      title: 'Detail Image',
    });
    const upsertAsset = vi
      .fn()
      .mockResolvedValueOnce(ok(first))
      .mockResolvedValueOnce(ok(second));
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        upsertAsset,
      }),
    } as never);

    await repository.saveMany([first, second]);

    expect(upsertAsset).toHaveBeenCalledTimes(2);
    expect(upsertAsset).toHaveBeenNthCalledWith(
      1,
      first.assetId,
      expect.objectContaining({
        assetId: first.assetId,
        id: first.id,
        uuid: first.uuid,
        key: first.key,
        title: first.title,
        primaryType: first.primaryType,
        scope: first.scope,
      }),
    );
    expect(upsertAsset).toHaveBeenNthCalledWith(
      2,
      second.assetId,
      expect.objectContaining({
        assetId: second.assetId,
        id: second.id,
        uuid: second.uuid,
        key: second.key,
        title: second.title,
        primaryType: second.primaryType,
        scope: second.scope,
      }),
    );
  });

  it('loads a single asset through the canonical readAsset method', async () => {
    const asset = createAsset();
    const readAsset = vi.fn().mockResolvedValue(ok(asset));
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        readAsset,
      }),
    } as never);

    await expect(repository.findById(asset.assetId)).resolves.toEqual(asset);
    expect(readAsset).toHaveBeenCalledWith(asset.assetId);
  });

  it('deletes an asset through the canonical deleteAsset method', async () => {
    const deleteAsset = vi.fn().mockResolvedValue(ok({ ok: true }));
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        deleteAsset,
      }),
    } as never);

    await repository.deleteById('asset-1');

    expect(deleteAsset).toHaveBeenCalledTimes(1);
    expect(deleteAsset).toHaveBeenCalledWith('asset-1');
  });

  it('queries assets through listAssets with the full canonical asset-center filter set', async () => {
    const asset = createAsset();
    const listAssets = vi.fn().mockResolvedValue(
      okList([asset], {
        page: 0,
        pageSize: 1,
        total: 1,
      })
    );
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        listAssets,
      }),
    } as never);

    const result = await repository.query({
      page: -1,
      size: 0,
      keyword: 'hero',
      sort: ['updatedAt,desc', 'createdAt,asc'],
      types: ['image', 'video'],
      origins: ['upload', 'ai'],
      tags: ['cover', 'favorite'],
      status: ['ready', 'processing'],
      includeDeleted: true,
      scope: {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'image-studio',
      },
      reference: {
        entityType: 'shot',
        entityId: 'shot-1',
        relation: 'reference',
      },
    });

    expect(listAssets).toHaveBeenCalledTimes(1);
    expect(listAssets).toHaveBeenCalledWith({
      page: 0,
      size: 1,
      keyword: 'hero',
      sort: ['updatedAt,desc', 'createdAt,asc'],
      types: ['image', 'video'],
      origins: ['upload', 'ai'],
      tags: ['cover', 'favorite'],
      status: ['ready', 'processing'],
      includeDeleted: true,
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      domain: 'image-studio',
      referenceEntityType: 'shot',
      referenceEntityId: 'shot-1',
      referenceRelation: 'reference',
    });
    expect(result.content).toEqual([asset]);
    expect(result.totalElements).toBe(1);
    expect(result.number).toBe(0);
    expect(result.last).toBe(true);
  });

  it('lists assets by aggregating paged listAssets responses', async () => {
    const first = createAsset();
    const second = createAsset({
      id: 'asset-2',
      uuid: 'asset-uuid-2',
      assetId: 'asset-2',
      key: 'workspace-1/video-studio/asset-2',
      title: 'Hero Video',
      primaryType: 'video',
      scope: {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'video-studio',
      },
    });
    const listAssets = vi
      .fn()
      .mockResolvedValueOnce(
        okList([first], {
          page: 0,
          pageSize: 200,
          total: 201,
        })
      )
      .mockResolvedValueOnce(
        okList([second], {
          page: 1,
          pageSize: 200,
          total: 201,
        })
      );
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        listAssets,
      }),
    } as never);

    const result = await repository.list();

    expect(listAssets).toHaveBeenCalledTimes(2);
    expect(listAssets).toHaveBeenNthCalledWith(1, {
      page: 0,
      size: 200,
      includeDeleted: true,
    });
    expect(listAssets).toHaveBeenNthCalledWith(2, {
      page: 1,
      size: 200,
      includeDeleted: true,
    });
    expect(result).toEqual([first, second]);
  });

  it('loads aggregate stats through readAssetStats', async () => {
    const stats = createStats();
    const readAssetStats = vi.fn().mockResolvedValue(ok(stats));
    const repository = new RemoteAssetIndexRepository({
      getClient: () => ({
        readAssetStats,
      }),
    } as never);

    await expect(repository.count()).resolves.toEqual(stats);
    expect(readAssetStats).toHaveBeenCalledTimes(1);
    expect(readAssetStats).toHaveBeenCalledWith(undefined);
  });

  it('keeps repository implementation free from direct or focused @sdkwork/app-sdk asset-center imports', async () => {
    const source = await readFile(
      new URL('../src/asset-center/infrastructure/RemoteAssetIndexRepository.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
    expect(source.includes('getAssetCenterSdkClientWithSession')).toBe(false);
    expect(source.includes('AssetCenterApi')).toBe(false);
  });
});
