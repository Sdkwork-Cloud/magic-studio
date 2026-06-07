import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAssetServerClient,
  readAssetServerRuntime,
  tryExtractInlineData,
  resolveRuntimeMagicStudioRootLayout,
  createDir,
  writeFileBinary,
  deletePath,
  createUuid,
  readWorkspaceScope,
} = vi.hoisted(() => ({
  getAssetServerClient: vi.fn(),
  readAssetServerRuntime: vi.fn(),
  tryExtractInlineData: vi.fn(),
  resolveRuntimeMagicStudioRootLayout: vi.fn(),
  createDir: vi.fn(),
  writeFileBinary: vi.fn(),
  deletePath: vi.fn(),
  createUuid: vi.fn(),
  readWorkspaceScope: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  inlineDataService: {
    tryExtractInlineData,
  },
}));

vi.mock('@sdkwork/magic-studio-core/storage', () => ({
  resolveRuntimeMagicStudioRootLayout,
}));

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {
    createDir,
    writeFileBinary,
    delete: deletePath,
  },
}));

vi.mock('@sdkwork/magic-studio-types/entity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-types/entity')>();
  return {
    ...actual,
    createUuid,
  };
});

vi.mock('../src/services/assetServerClient', () => ({
  getAssetServerClient,
  readAssetServerRuntime,
}));

vi.mock('../src/asset-center/application/assetCenterAdapters', () => ({
  readWorkspaceScope,
}));

import {
  deleteAssetBySdk,
  importAssetBySdk,
  importAssetFromUrlBySdk,
  queryAssetsBySdk,
  renameAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '../src/services/assetSdkQueryService';

const envelope = <T>(data: T) => ({
  requestId: 'test-request',
  timestamp: '2026-04-25T00:00:00.000Z',
  data,
  meta: {
    version: 'v1',
  },
});

const listEnvelope = <T>(items: T[], meta: { page?: number; pageSize?: number; total?: number } = {}) => ({
  requestId: 'test-request',
  timestamp: '2026-04-25T00:00:00.000Z',
  items,
  meta: {
    page: meta.page ?? 0,
    pageSize: meta.pageSize ?? items.length,
    total: meta.total ?? items.length,
    version: 'v1',
  },
});

const createUnifiedAsset = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  const base = {
    assetId: 'asset-db-1',
    id: 'asset-db-1',
    uuid: 'asset-uuid-1',
    key: 'default-workspace/image-studio/asset-db-1',
    title: 'Hero Frame',
    primaryType: 'image',
    payload: {
      image: {
        id: 'resource-db-1',
        uuid: 'resource-uuid-1',
        assetId: 'asset-db-1',
        primaryResourceId: 'resource-db-1',
        name: 'Hero Frame',
        type: 'IMAGE',
        url: 'https://cdn.example.com/hero-frame.png',
        path: 'https://cdn.example.com/hero-frame.png',
        size: 2048,
        origin: 'upload',
        metadata: {
          assetUuid: 'asset-uuid-1',
          primaryResourceId: 'resource-db-1',
          primaryResourceUuid: 'resource-uuid-1',
        },
      },
      assets: [],
    },
    scope: {
      workspaceId: 'default-workspace',
      domain: 'image-studio',
    },
    storage: {
      mode: 'remote-url',
      primary: {
        protocol: 'https',
        uri: 'https://cdn.example.com/hero-frame.png',
        url: 'https://cdn.example.com/hero-frame.png',
      },
      cacheable: false,
    },
    status: 'ready',
    metadata: {
      origin: 'upload',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-db-1',
      primaryResourceUuid: 'resource-uuid-1',
    },
    createdAt: '2026-04-04T00:00:00.000Z',
    updatedAt: '2026-04-04T00:00:00.000Z',
  };

  return {
    ...base,
    ...overrides,
  };
};

describe('assetSdkQueryService', () => {
  const listAssets = vi.fn();
  const importAssetFile = vi.fn();
  const importAssetUrl = vi.fn();
  const readAsset = vi.fn();
  const updateAsset = vi.fn();
  const deleteAsset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    listAssets.mockResolvedValue(listEnvelope([]));
    importAssetFile.mockResolvedValue(envelope(createUnifiedAsset()));
    importAssetUrl.mockResolvedValue(envelope(createUnifiedAsset()));
    readAsset.mockResolvedValue(envelope(createUnifiedAsset()));
    updateAsset.mockResolvedValue(envelope(createUnifiedAsset()));
    deleteAsset.mockResolvedValue(envelope({ ok: true }));
    getAssetServerClient.mockReturnValue({
      listAssets,
      importAssetFile,
      importAssetUrl,
      readAsset,
      updateAsset,
      deleteAsset,
    });
    readAssetServerRuntime.mockReturnValue('web');
    resolveRuntimeMagicStudioRootLayout.mockResolvedValue({
      systemTempRoot: '/tmp/magic-studio',
    });
    createUuid.mockReturnValue('temp-uuid-1');
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'default-workspace',
      projectId: 'project-1',
      collectionId: undefined,
    });
    tryExtractInlineData.mockResolvedValue(undefined);
  });

  it('queries the canonical asset server client with scope, sort, and typed filters', async () => {
    listAssets.mockResolvedValue(listEnvelope([createUnifiedAsset()], {
      page: 0,
      pageSize: 20,
      total: 1,
    }));

    const page = await queryAssetsBySdk({
      category: 'image',
      pageRequest: {
        page: 0,
        size: 20,
        sort: ['updatedAt,desc'],
        keyword: 'hero',
      },
      allowedTypes: ['image'],
      domain: 'image-studio',
    });

    expect(listAssets).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      keyword: 'hero',
      sort: ['updatedAt,desc'],
      workspaceId: 'default-workspace',
      projectId: 'project-1',
      domain: 'image-studio',
      types: ['image'],
    });
    expect(page.content[0]).toMatchObject({
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      name: 'Hero Frame',
      type: 'image',
      path: 'https://cdn.example.com/hero-frame.png',
      metadata: {
        assetId: 'asset-db-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-db-1',
        primaryResourceUuid: 'resource-uuid-1',
      },
    });
  });

  it('fails fast when a queried asset is missing its persisted assetId', async () => {
    listAssets.mockResolvedValue(listEnvelope([
      createUnifiedAsset({
        assetId: undefined,
        id: undefined,
      }),
    ]));

    await expect(
      queryAssetsBySdk({
        category: 'image',
        pageRequest: {
          page: 0,
          size: 20,
        },
      }),
    ).rejects.toThrow('Asset item is missing persisted assetId.');
  });

  it('imports local upload bytes through the server import file route and cleans up the temp file', async () => {
    importAssetFile.mockResolvedValue(envelope(createUnifiedAsset({
      assetId: 'file-db-1',
      id: 'file-db-1',
      title: 'hero.png',
      storage: {
        mode: 'remote-url',
        primary: {
          protocol: 'https',
          uri: 'https://cdn.example.com/hero.png',
          url: 'https://cdn.example.com/hero.png',
        },
      },
      payload: {
        image: {
          id: 'file-db-1',
          uuid: 'file-uuid-1',
          assetId: 'file-db-1',
          name: 'hero.png',
          type: 'IMAGE',
          url: 'https://cdn.example.com/hero.png',
          path: 'https://cdn.example.com/hero.png',
          size: 3,
        },
        assets: [],
      },
    })));

    const asset = await importAssetBySdk(
      {
        name: 'hero.png',
        data: new Uint8Array([1, 2, 3]),
      },
      'image',
      {
        domain: 'image-studio',
      },
    );

    expect(createDir).toHaveBeenCalledWith('/tmp/magic-studio');
    expect(createDir).toHaveBeenCalledWith('/tmp/magic-studio/asset-imports');
    expect(writeFileBinary).toHaveBeenCalledWith(
      '/tmp/magic-studio/asset-imports/temp-uuid-1.png',
      new Uint8Array([1, 2, 3]),
    );
    expect(importAssetFile).toHaveBeenCalledWith({
      scope: {
        workspaceId: 'default-workspace',
        projectId: 'project-1',
        domain: 'image-studio',
      },
      type: 'image',
      sourcePath: '/tmp/magic-studio/asset-imports/temp-uuid-1.png',
      name: 'hero.png',
      metadata: {
        source: 'asset-import',
      },
    });
    expect(deletePath).toHaveBeenCalledWith('/tmp/magic-studio/asset-imports/temp-uuid-1.png');
    expect(asset).toMatchObject({
      id: 'file-db-1',
      name: 'hero.png',
      path: 'https://cdn.example.com/hero.png',
    });
  });

  it('imports http urls through the server import url route without downloading bytes in the client', async () => {
    await importAssetFromUrlBySdk(
      'https://cdn.example.com/from-url.png',
      'image',
      {
        name: 'from-url.png',
        domain: 'image-studio',
      },
    );

    expect(importAssetUrl).toHaveBeenCalledWith({
      scope: {
        workspaceId: 'default-workspace',
        projectId: 'project-1',
        domain: 'image-studio',
      },
      type: 'image',
      url: 'https://cdn.example.com/from-url.png',
      name: 'from-url.png',
      metadata: {
        source: 'asset-url-import',
      },
    });
    expect(tryExtractInlineData).not.toHaveBeenCalled();
    expect(importAssetFile).not.toHaveBeenCalled();
  });

  it('imports data urls by extracting inline bytes then using the server import file route', async () => {
    tryExtractInlineData.mockResolvedValue(new Uint8Array([9, 8, 7]));

    await importAssetFromUrlBySdk(
      'data:image/png;base64,CQgH',
      'image',
      {
        name: 'inline.png',
        domain: 'image-studio',
      },
    );

    expect(tryExtractInlineData).toHaveBeenCalledWith('data:image/png;base64,CQgH');
    expect(writeFileBinary).toHaveBeenCalledWith(
      '/tmp/magic-studio/asset-imports/temp-uuid-1.png',
      new Uint8Array([9, 8, 7]),
    );
    expect(importAssetFile).toHaveBeenCalledWith(expect.objectContaining({
      type: 'image',
      sourcePath: '/tmp/magic-studio/asset-imports/temp-uuid-1.png',
      name: 'inline.png',
    }));
  });

  it('renames by reading the current asset then patching title metadata through the server client', async () => {
    await renameAssetBySdk('asset-db-1', 'Renamed Hero');

    expect(readAsset).toHaveBeenCalledWith('asset-db-1');
    expect(updateAsset).toHaveBeenCalledWith('asset-db-1', {
      title: 'Renamed Hero',
      metadata: {
        origin: 'upload',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-db-1',
        primaryResourceUuid: 'resource-uuid-1',
        originalName: 'Hero Frame',
      },
    });
  });

  it('deletes assets through the canonical server client', async () => {
    await deleteAssetBySdk('asset-db-1');

    expect(deleteAsset).toHaveBeenCalledWith('asset-db-1');
  });

  it('resolves the primary url from canonical asset detail', async () => {
    await expect(resolveAssetPrimaryUrlBySdk('asset-db-1')).resolves.toBe(
      'https://cdn.example.com/hero-frame.png',
    );

    expect(readAsset).toHaveBeenCalledWith('asset-db-1');
  });

  it('keeps the implementation free from retired app-sdk asset-center helpers', async () => {
    const source = await readFile(
      new URL('../src/services/assetSdkQueryService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`from '@sdkwork/${'app'}-sdk'`)).toBe(false);
    expect(source.includes('getAssetCenterSdkClientWithSession')).toBe(false);
    expect(source.includes('uploadViaPresignedUrl')).toBe(false);
    expect(source.includes('client.assetCenter')).toBe(false);
  });
});
