/** @vitest-environment jsdom */

import React, { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const mocks = vi.hoisted(() => ({
  queryAssetsBySdk: vi.fn(),
  deleteAssetBySdk: vi.fn(),
  renameAssetBySdk: vi.fn(),
  readFilters: vi.fn(),
  writeFilters: vi.fn(),
  pickFiles: vi.fn(),
  normalizeSpringPageRequest: vi.fn(),
  resolveDomainAssetTypes: vi.fn(),
  resolveAcceptExtensionsByTypes: vi.fn(),
  detectAssetTypeByFilename: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-core/utils', () => ({
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

vi.mock('../src/services/assetBusinessService', () => ({
  assetBusinessService: {
    queryAssetsBySdk: mocks.queryAssetsBySdk,
    deleteAssetBySdk: mocks.deleteAssetBySdk,
    renameAssetBySdk: mocks.renameAssetBySdk,
    importAssetBySdk: vi.fn(),
  },
}));

vi.mock('../src/services/assetUiStateService', () => ({
  assetUiStateService: {
    readFilters: mocks.readFilters,
    writeFilters: mocks.writeFilters,
  },
}));

vi.mock('../src/asset-center/application/assetCenterAdapters', () => ({
  normalizeSpringPageRequest: mocks.normalizeSpringPageRequest,
}));

vi.mock('../src/asset-center/domain/assetCategory.domain', () => ({
  resolveDomainAssetTypes: mocks.resolveDomainAssetTypes,
  resolveAcceptExtensionsByTypes: mocks.resolveAcceptExtensionsByTypes,
  detectAssetTypeByFilename: mocks.detectAssetTypeByFilename,
}));

import { AssetStoreProvider, useAssetStore } from '../src/store/assetStore';

type ObservedStore = ReturnType<typeof useAssetStore>;

const createPage = (content: unknown[]) => ({
  content,
  last: true,
  totalPages: 1,
  totalElements: content.length,
  size: content.length,
  number: 0,
  sort: { sorted: true, unsorted: false, empty: false },
  pageable: {
    pageNumber: 0,
    pageSize: content.length,
    offset: 0,
    paged: true,
    unpaged: false,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  first: true,
  numberOfElements: content.length,
  empty: content.length === 0,
});

const createTransientAsset = () => ({
  id: null,
  uuid: 'asset-uuid-transient-1',
  name: 'Transient Asset',
  type: 'image',
  path: 'assets://system/library/image/transient.png',
  size: 1,
  origin: 'ai',
  createdAt: 1,
  updatedAt: 1,
  metadata: {},
});

describe('AssetStore identity handling', () => {
  let container: HTMLDivElement;
  let root: Root | null;
  let latestStore: ObservedStore | null;

  const Observer = () => {
    const store = useAssetStore();

    useEffect(() => {
      latestStore = store;
    }, [store]);

    return null;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    latestStore = null;

    mocks.queryAssetsBySdk.mockReset();
    mocks.deleteAssetBySdk.mockReset();
    mocks.renameAssetBySdk.mockReset();
    mocks.readFilters.mockReset();
    mocks.writeFilters.mockReset();
    mocks.pickFiles.mockReset();
    mocks.normalizeSpringPageRequest.mockReset();
    mocks.resolveDomainAssetTypes.mockReset();
    mocks.resolveAcceptExtensionsByTypes.mockReset();
    mocks.detectAssetTypeByFilename.mockReset();

    mocks.queryAssetsBySdk.mockResolvedValue(createPage([createTransientAsset()]));
    mocks.readFilters.mockReturnValue(null);
    mocks.pickFiles.mockResolvedValue([]);
    mocks.normalizeSpringPageRequest.mockImplementation((value: Record<string, unknown>) => ({
      page: value.page ?? 0,
      size: value.size ?? 60,
      keyword: value.keyword ?? '',
      sort: value.sort ?? ['updatedAt,desc'],
    }));
    mocks.resolveDomainAssetTypes.mockReturnValue(['image']);
    mocks.resolveAcceptExtensionsByTypes.mockReturnValue(['.png']);
    mocks.detectAssetTypeByFilename.mockReturnValue('image');
  });

  afterEach(async () => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  const mountStore = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <AssetStoreProvider>
          <Observer />
        </AssetStoreProvider>
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    if (!latestStore) {
      throw new Error('Asset store failed to mount.');
    }

    return latestStore;
  };

  it('removes transient assets locally without calling delete-by-id sdk APIs', async () => {
    const store = await mountStore();
    const transientAsset = store.assets[0] as typeof createTransientAsset extends () => infer T ? T : never;

    expect(transientAsset.id).toBeNull();

    await act(async () => {
      await store.deleteAsset(transientAsset as never);
    });

    expect(mocks.deleteAssetBySdk).not.toHaveBeenCalled();
    expect(latestStore?.assets).toEqual([]);
  });

  it('renames transient assets locally without calling rename-by-id sdk APIs', async () => {
    const store = await mountStore();
    const transientAsset = store.assets[0] as typeof createTransientAsset extends () => infer T ? T : never;

    await act(async () => {
      store.setSelectedAsset(transientAsset as never);
    });

    await act(async () => {
      await store.renameAsset(transientAsset as never, 'Renamed Transient Asset');
    });

    expect(mocks.renameAssetBySdk).not.toHaveBeenCalled();
    expect(latestStore?.assets[0]?.name).toBe('Renamed Transient Asset');
    expect(latestStore?.selectedAsset?.name).toBe('Renamed Transient Asset');
  });
});
