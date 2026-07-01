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
  loadHistory: vi.fn(async () => undefined),
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

vi.mock('../store/audioStore', () => ({
  useAudioStore: () => ({
    history: mocks.history,
    deleteTask: mocks.deleteTask,
    setConfig: mocks.setConfig,
    importTask: mocks.importTask,
    loadHistory: mocks.loadHistory,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    AUDIO_CHAT: '/audio-chat',
  },
}));

import AudioPage from './AudioPage';

describe('AudioPage', () => {
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
    mocks.loadHistory.mockReset();
    mocks.navigate.mockReset();
    mocks.resolveImportDataKey.mockImplementation((data: { id?: string | null; uuid: string }) => data.id || data.uuid);
    mocks.loadHistory.mockResolvedValue(undefined);

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

  it('loads audio history on mount', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioPage />);
      await Promise.resolve();
    });

    expect(mocks.loadHistory).toHaveBeenCalledTimes(1);
  });

  it('reuses task config back into the audio generator panel', async () => {
    const reusedTask = {
      uuid: 'audio-task-uuid-1',
      config: {
        prompt: 'Narrate this text',
        mode: 'text-to-speech',
        voice: 'Kore',
        duration: 15,
        mediaType: 'speech',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls[0]?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onReuse(reusedTask);
    });

    expect(mocks.setConfig).toHaveBeenCalledWith(reusedTask.config);
  });

  it('filters down to favorite audio tasks when favorites mode is enabled', async () => {
    mocks.history = [
      { uuid: 'audio-task-1', isFavorite: true, config: {} },
      { uuid: 'audio-task-2', isFavorite: false, config: {} },
    ];

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioPage />);
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
      expect.objectContaining({ uuid: 'audio-task-1', isFavorite: true }),
    ]);
  });

  it('imports uploaded generation data into audio history with canonical speech config', async () => {
    const importData = {
      id: null,
      uuid: 'import-audio-uuid-1',
      type: 'audio',
      createdAt: 1712300000000,
      prompt: 'A refined audio import',
      model: 'whisper-1',
      duration: 120,
      resource: {
        id: 'audio-resource-id-1',
        uuid: 'audio-resource-uuid-1',
        assetId: 'audio-asset-id-1',
        assetUuid: 'audio-asset-uuid-1',
        primaryResourceId: 'audio-primary-resource-id-1',
        primaryResourceUuid: 'audio-primary-resource-uuid-1',
        resourceViewId: 'audio-resource-view-id-1',
        resourceViewUuid: 'audio-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/generated/audio.mp3',
        name: 'audio-import.mp3',
        mimeType: 'audio/mpeg',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onImport(importData);
    });

    expect(mocks.importTask).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'import-audio-uuid-1',
        status: 'completed',
        config: expect.objectContaining({
          prompt: 'A refined audio import',
          model: 'whisper-1',
          duration: 120,
          mode: 'text-to-speech',
          mediaType: 'speech',
        }),
        results: [
          expect.objectContaining({
            resource: expect.objectContaining({
              url: 'https://example.com/generated/audio.mp3',
            }),
          }),
        ],
      })
    );
  });

  it('declares audio-only import capability on the shared history pane', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioPage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps.importTypes).toEqual(['audio']);
  });
});
