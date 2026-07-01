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

vi.mock('../store/voiceStore', () => ({
  useVoiceStore: () => ({
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
    VOICE_CHAT: '/voice-chat',
  },
}));

import VoicePage from './VoicePage';

describe('VoicePage', () => {
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

  it('reuses task config back into the voice generator panel', async () => {
    const reusedTask = {
      uuid: 'voice-task-uuid-1',
      config: {
        text: 'Hello world',
        voiceId: 'speaker-kore',
        model: 'seed-tts',
        mediaType: 'voice',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<VoicePage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps).toBeTruthy();

    await act(async () => {
      paneProps.onReuse(reusedTask);
    });

    expect(mocks.setConfig).toHaveBeenCalledWith(reusedTask.config);
  });

  it('imports uploaded audio generation data into voice history', async () => {
    const importData = {
      id: null,
      uuid: 'import-voice-uuid-1',
      type: 'audio',
      createdAt: 1712300000000,
      prompt: 'Imported voice content',
      model: 'external-voice-source',
      duration: 9,
      resource: {
        id: 'voice-resource-id-1',
        uuid: 'voice-resource-uuid-1',
        assetId: 'voice-asset-id-1',
        assetUuid: 'voice-asset-uuid-1',
        primaryResourceId: 'voice-primary-resource-id-1',
        primaryResourceUuid: 'voice-primary-resource-uuid-1',
        resourceViewId: 'voice-resource-view-id-1',
        resourceViewUuid: 'voice-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/imported-voice.wav',
        name: 'imported-voice.wav',
        mimeType: 'audio/wav',
      },
    };

    await act(async () => {
      root = createRoot(container!);
      root.render(<VoicePage />);
      await Promise.resolve();
    });

    const paneProps = mocks.generationHistoryListPane.mock.calls.at(-1)?.[0] as any;
    expect(paneProps.importTypes).toEqual(['audio']);

    await act(async () => {
      paneProps.onImport(importData);
    });

    expect(mocks.importTask).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: 'import-voice-uuid-1',
        status: 'completed',
        config: expect.objectContaining({
          text: 'Imported voice content',
          model: 'external-voice-source',
          mediaType: 'voice',
        }),
        results: [
          expect.objectContaining({
            resource: expect.objectContaining({
              url: 'https://example.com/imported-voice.wav',
            }),
          }),
        ],
      })
    );
  });
});
