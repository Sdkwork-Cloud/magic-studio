/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const mocks = vi.hoisted(() => ({
  useAssetStore: vi.fn(),
}));

vi.mock('../src/store/assetStore', () => ({
  useAssetStore: mocks.useAssetStore,
}));

vi.mock('../src/hooks/useAssetUrl', () => ({
  useAssetUrl: () => ({
    url: null,
    loading: false,
    error: null,
  }),
}));

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}));

import { AssetGrid } from '../src/components/AssetGrid';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('AssetGrid identity handling', () => {
  it('does not emit duplicate React key warnings when different assets share a persisted id but not a uuid', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    mocks.useAssetStore.mockReturnValue({
      assets: [
        {
          id: 'asset-db-1',
          uuid: 'asset-uuid-1',
          name: 'Asset One',
          type: 'image',
          path: 'https://cdn.example.com/one.png',
          size: 1,
          origin: 'upload',
          metadata: {},
        },
        {
          id: 'asset-db-1',
          uuid: 'asset-uuid-2',
          name: 'Asset Two',
          type: 'image',
          path: 'https://cdn.example.com/two.png',
          size: 1,
          origin: 'upload',
          metadata: {},
        },
      ],
      isLoading: false,
      pageData: {
        last: true,
        number: 0,
      },
      loadPage: vi.fn(),
      filterType: 'all',
      filterOrigin: 'all',
      searchQuery: '',
      clearFilters: vi.fn(),
      setSearchQuery: vi.fn(),
      importAssets: vi.fn(),
    });

    await act(async () => {
      root = createRoot(container);
      root.render(
        <AssetGrid
          onPreview={() => {}}
          onDelete={() => {}}
        />
      );
      await Promise.resolve();
    });

    const duplicateKeyWarnings = errorSpy.mock.calls.filter((call) =>
      call.join(' ').includes('same key')
    );

    expect(duplicateKeyWarnings).toEqual([]);

    await act(async () => {
      root?.unmount();
    });
  });
});
