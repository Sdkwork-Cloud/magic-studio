/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationHistoryListPane: vi.fn((props: any) => props),
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

vi.mock('../store/sfxStore', () => ({
  useSfxStore: () => ({
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
    SFX_CHAT: '/sfx-chat',
  },
}));

import SfxPage from './SfxPage';

describe('SfxPage', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.generationHistoryListPane.mockReset();
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

  it('reuses task config back into the sfx generator panel', async () => {
    const reusedTask = {
      uuid: 'sfx-task-uuid-1',
      config: {
        prompt: 'cinematic boom',
        duration: 6,
        model: 'audioldm-2',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<SfxPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onReuse(reusedTask);
    });

    expect(mocks.setConfig).toHaveBeenCalledWith(reusedTask.config);
  });

  it('filters down to favorite sfx tasks when favorites mode is enabled', async () => {
    mocks.history = [
      { uuid: 'sfx-task-1', isFavorite: true, config: {} },
      { uuid: 'sfx-task-2', isFavorite: false, config: {} },
    ];

    await act(async () => {
      root = createRoot(container!);
      root.render(<SfxPage />);
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
      expect.objectContaining({ uuid: 'sfx-task-1', isFavorite: true }),
    ]);
  });

  it('imports uploaded audio generation data into sfx history', async () => {
    const importData = {
      id: null,
      uuid: 'import-sfx-uuid-1',
      type: 'audio',
      createdAt: 1712300000000,
      prompt: 'Synthetic impact',
      model: 'external-sfx-source',
      duration: 3,
      resource: {
        id: 'sfx-resource-id-1',
        uuid: 'sfx-resource-uuid-1',
        assetId: 'sfx-asset-id-1',
        assetUuid: 'sfx-asset-uuid-1',
        primaryResourceId: 'sfx-primary-resource-id-1',
        primaryResourceUuid: 'sfx-primary-resource-uuid-1',
        resourceViewId: 'sfx-resource-view-id-1',
        resourceViewUuid: 'sfx-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/imported-sfx.mp3',
        name: 'imported-sfx.mp3',
        mimeType: 'audio/mpeg',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<SfxPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps.importTypes).toEqual(['audio']);

    await act(async () => {
      paneProps.onImport(importData);
    });

    expect(mocks.importTask).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'import-sfx-uuid-1',
        status: 'completed',
        config: expect.objectContaining({
          prompt: 'Synthetic impact',
          model: 'external-sfx-source',
          duration: 3,
          mediaType: 'audio',
        }),
      })
    );
  });
});
