/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationHistoryListPane: vi.fn((props: any) => props),
  consumePortalLaunchSession: vi.fn(() => null),
  resolvePortalLaunchAttachmentRef: vi.fn(),
  resolveImportDataKey: vi.fn((data: { id?: string | null; uuid: string }) => data.id || data.uuid),
  toPortalLaunchAttachmentAssetUrlSource: vi.fn(),
  resolveAssetUrlByAssetIdFirst: vi.fn(),
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
  resolvePortalLaunchAttachmentRef: mocks.resolvePortalLaunchAttachmentRef,
  toPortalLaunchAttachmentAssetUrlSource: mocks.toPortalLaunchAttachmentAssetUrlSource,
  resolveAssetUrlByAssetIdFirst: mocks.resolveAssetUrlByAssetIdFirst,
}));

vi.mock('../store/characterStore', () => ({
  useCharacterStore: () => ({
    history: mocks.history,
    deleteTask: mocks.deleteTask,
    setConfig: mocks.setConfig,
    importTask: mocks.importTask,
  }),
}));

vi.mock('@sdkwork/magic-studio-core/router', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    CHARACTER_CHAT: '/character-chat',
  },
}));

import CharacterPage from './CharacterPage';

describe('CharacterPage', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.generationHistoryListPane.mockReset();
    mocks.consumePortalLaunchSession.mockReset();
    mocks.resolvePortalLaunchAttachmentRef.mockReset();
    mocks.resolveImportDataKey.mockReset();
    mocks.toPortalLaunchAttachmentAssetUrlSource.mockReset();
    mocks.resolveAssetUrlByAssetIdFirst.mockReset();
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

  it('filters down to favorite character tasks when favorites mode is enabled', async () => {
    mocks.history = [
      { uuid: 'character-task-1', isFavorite: true, config: {} },
      { uuid: 'character-task-2', isFavorite: false, config: {} },
    ];

    await act(async () => {
      root = createRoot(container!);
      root.render(<CharacterPage />);
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
      expect.objectContaining({ uuid: 'character-task-1', isFavorite: true }),
    ]);
  });

  it('imports uploaded generation data into character history', async () => {
    const importData = {
      id: null,
      uuid: 'import-character-uuid-1',
      type: 'character',
      createdAt: 1712300000000,
      prompt: 'A fantasy sentinel',
      model: 'gemini-2.5-flash-image',
      aspectRatio: '9:16',
      resource: {
        id: 'resource-id-1',
        uuid: 'resource-uuid-1',
        assetId: 'asset-id-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'primary-resource-id-1',
        primaryResourceUuid: 'primary-resource-uuid-1',
        resourceViewId: 'resource-view-id-1',
        resourceViewUuid: 'resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/fantasy-sentinel.png',
        name: 'fantasy-sentinel.png',
        mimeType: 'image/png',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<CharacterPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onImport(importData);
    });

    expect(mocks.importTask).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'import-character-uuid-1',
        status: 'completed',
        config: expect.objectContaining({
          prompt: 'A fantasy sentinel',
          mediaType: 'character',
        }),
        results: [
          expect.objectContaining({
            avatarUrl: 'https://example.com/fantasy-sentinel.png',
          }),
        ],
      })
    );
  });

  it('declares character-only import capability on the shared history pane', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<CharacterPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps.importTypes).toEqual(['character']);
  });
});
