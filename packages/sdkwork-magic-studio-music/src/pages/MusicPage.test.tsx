/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationHistoryListPane: vi.fn((props: any) => props),
  consumePortalLaunchSession: vi.fn(() => null),
  resolveImportDataKey: vi.fn((data: { id?: string | null; uuid: string }) => data.id || data.uuid),
  history: [] as any[],
  setConfig: vi.fn(),
  deleteTask: vi.fn(),
  importTask: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  GENERATION_TABS: [],
  GenerationHistoryListPane: (props: any) => {
    mocks.generationHistoryListPane(props);
    return null;
  },
  resolveImportDataKey: mocks.resolveImportDataKey,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  consumePortalLaunchSession: mocks.consumePortalLaunchSession,
}));

vi.mock('../store/musicStore', () => ({
  useMusicStore: () => ({
    history: mocks.history,
    deleteTask: mocks.deleteTask,
    setConfig: mocks.setConfig,
    importTask: mocks.importTask,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    MUSIC_CHAT: '/music-chat',
  },
}));

import MusicPage from './MusicPage';

describe('MusicPage', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.generationHistoryListPane.mockReset();
    mocks.consumePortalLaunchSession.mockReset();
    mocks.resolveImportDataKey.mockReset();
    mocks.history = [];
    mocks.setConfig.mockReset();
    mocks.deleteTask.mockReset();
    mocks.importTask.mockReset();
    mocks.navigate.mockReset();
    mocks.resolveImportDataKey.mockImplementation((data: { id?: string | null; uuid: string }) => data.id || data.uuid);

    container = document.createElement('div');
    document.body.appendChild(container);
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    root = null;
    container?.remove();
    container = null;
    document.body.innerHTML = '';
  });

  it('reuses task config back into the music generator panel', async () => {
    const reusedTask = {
      uuid: 'music-task-uuid-1',
      config: {
        mode: 'remix',
        style: 'jazz-funk',
        title: 'Night Drive Remix',
        sourceMusic: {
          uuid: 'source-music-uuid-1',
          title: 'Night Drive',
        },
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<MusicPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls[0]?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onReuse(reusedTask);
    });

    expect(mocks.setConfig).toHaveBeenCalledWith(reusedTask.config);
  });

  it('filters down to favorite music tasks when favorites mode is enabled', async () => {
    mocks.history = [
      { uuid: 'music-task-1', isFavorite: true, config: {} },
      { uuid: 'music-task-2', isFavorite: false, config: {} },
    ];

    await act(async () => {
      root = createRoot(container!);
      root.render(<MusicPage />);
      await Promise.resolve();
    });

    const initialPaneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(initialPaneProps.tasks).toHaveLength(2);
    expect(initialPaneProps.showFavorites).toBe(false);

    await act(async () => {
      initialPaneProps.onToggleFavorites(true);
    });

    const filteredPaneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(filteredPaneProps.showFavorites).toBe(true);
    expect(filteredPaneProps.tasks).toEqual([
      expect.objectContaining({ uuid: 'music-task-1', isFavorite: true }),
    ]);
  });

  it('imports uploaded generation data into music history', async () => {
    const importData = {
      id: null,
      uuid: 'import-music-uuid-1',
      type: 'music',
      createdAt: 1712300000000,
      prompt: 'Dreamy synthwave track',
      model: 'External Source',
      duration: 142,
      title: 'Midnight Drive',
      lyrics: 'We ride through neon skies',
      style: 'synthwave',
      isInstrumental: false,
      resource: {
        id: 'music-resource-id-1',
        uuid: 'music-resource-uuid-1',
        assetId: 'music-asset-id-1',
        assetUuid: 'music-asset-uuid-1',
        primaryResourceId: 'music-primary-resource-id-1',
        primaryResourceUuid: 'music-primary-resource-uuid-1',
        resourceViewId: 'music-resource-view-id-1',
        resourceViewUuid: 'music-resource-view-uuid-1',
        type: 'music',
        url: 'https://example.com/music-import.mp3',
        name: 'music-import.mp3',
        mimeType: 'audio/mpeg',
      },
      coverResource: {
        id: 'music-cover-id-1',
        uuid: 'music-cover-uuid-1',
        assetId: 'music-cover-asset-id-1',
        assetUuid: 'music-cover-asset-uuid-1',
        primaryResourceId: 'music-cover-primary-resource-id-1',
        primaryResourceUuid: 'music-cover-primary-resource-uuid-1',
        resourceViewId: 'music-cover-resource-view-id-1',
        resourceViewUuid: 'music-cover-resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/music-cover.png',
        name: 'music-cover.png',
        mimeType: 'image/png',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<MusicPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onImport(importData);
    });

    expect(mocks.importTask).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'import-music-uuid-1',
        status: 'completed',
        config: expect.objectContaining({
          prompt: 'Dreamy synthwave track',
          mediaType: 'music',
        }),
        results: [
          expect.objectContaining({
            title: 'Midnight Drive',
            resource: expect.objectContaining({
              url: 'https://example.com/music-import.mp3',
            }),
          }),
        ],
      })
    );
  });
});
