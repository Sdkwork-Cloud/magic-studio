/** @vitest-environment jsdom */

import React, { useEffect } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryAssetsBySdk: vi.fn(),
  importAssetBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
  deleteAssetBySdk: vi.fn(),
  renameAssetBySdk: vi.fn(),
  readFilters: vi.fn(),
  writeFilters: vi.fn(),
  pickFiles: vi.fn(),
  normalizeSpringPageRequest: vi.fn(),
  resolveDomainAssetTypes: vi.fn(),
  resolveAcceptExtensionsByTypes: vi.fn(),
  detectAssetTypeByFilename: vi.fn(),
  persistChooseAssetProjectReference: vi.fn(async () => undefined),
}));

vi.mock('@sdkwork/magic-studio-core/utils', () => ({
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

vi.mock('../src/services/assetBusinessService', () => ({
  assetBusinessService: {
    queryAssetsBySdk: mocks.queryAssetsBySdk,
    importAssetBySdk: mocks.importAssetBySdk,
    resolveAssetPrimaryUrlBySdk: mocks.resolveAssetPrimaryUrlBySdk,
    deleteAssetBySdk: mocks.deleteAssetBySdk,
    renameAssetBySdk: mocks.renameAssetBySdk,
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

vi.mock('../src/components/chooseAssetProjectReference', () => ({
  persistChooseAssetProjectReference: mocks.persistChooseAssetProjectReference,
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

describe('AssetStore project reference persistence', () => {
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
    mocks.importAssetBySdk.mockReset();
    mocks.resolveAssetPrimaryUrlBySdk.mockReset();
    mocks.deleteAssetBySdk.mockReset();
    mocks.renameAssetBySdk.mockReset();
    mocks.readFilters.mockReset();
    mocks.writeFilters.mockReset();
    mocks.pickFiles.mockReset();
    mocks.normalizeSpringPageRequest.mockReset();
    mocks.resolveDomainAssetTypes.mockReset();
    mocks.resolveAcceptExtensionsByTypes.mockReset();
    mocks.detectAssetTypeByFilename.mockReset();
    mocks.persistChooseAssetProjectReference.mockReset();

    mocks.queryAssetsBySdk.mockResolvedValue(createPage([]));
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'asset-db-voice-1',
      uuid: 'asset-uuid-voice-1',
      name: 'reference.wav',
      type: 'audio',
      path: 'assets://uploads/reference.wav',
      origin: 'upload',
      size: 10,
      metadata: {},
    });
    mocks.resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/reference.wav');
    mocks.readFilters.mockReturnValue(null);
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'reference.wav',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.normalizeSpringPageRequest.mockImplementation((value: Record<string, unknown>) => ({
      page: value.page ?? 0,
      size: value.size ?? 60,
      keyword: value.keyword ?? '',
      sort: value.sort ?? ['updatedAt,desc'],
    }));
    mocks.resolveDomainAssetTypes.mockReturnValue(['audio']);
    mocks.resolveAcceptExtensionsByTypes.mockReturnValue(['.wav']);
    mocks.detectAssetTypeByFilename.mockReturnValue('audio');
    mocks.persistChooseAssetProjectReference.mockResolvedValue(undefined);
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
        <AssetStoreProvider
          domain="voice-speaker"
          initialAllowedTypes={['audio']}
          projectReference={{
            slot: 'voice-left-reference-audio',
            metadata: {
              source: 'voice-left-generator-panel',
            },
          }}
        >
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

  it('persists a project-level reference after modal upload imports an asset', async () => {
    const store = await mountStore();

    await act(async () => {
      await store.importAssets();
    });

    expect(mocks.importAssetBySdk).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'reference.wav',
      }),
      'audio',
      {
        domain: 'voice-speaker',
      }
    );
    expect(mocks.persistChooseAssetProjectReference).toHaveBeenCalledWith({
      uploaded: expect.objectContaining({
        id: 'asset-db-voice-1',
        path: 'assets://uploads/reference.wav',
      }),
      resolvedUrl: 'https://cdn.example.com/reference.wav',
      fallbackType: 'audio',
      domain: 'voice-speaker',
      projectReference: {
        slot: 'voice-left-reference-audio',
        metadata: {
          source: 'voice-left-generator-panel',
        },
      },
    });
  });
});
