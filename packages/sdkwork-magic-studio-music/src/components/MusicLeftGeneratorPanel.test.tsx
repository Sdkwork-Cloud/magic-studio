/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const selectedAsset = {
    id: 'asset-1',
    uuid: 'asset-uuid-1',
    name: 'reference-track.mp3',
    type: 'music',
    path: 'https://example.com/reference-track.mp3',
    size: 123456,
    origin: 'upload',
    metadata: {
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-1',
      resourceViewUuid: 'view-uuid-1',
      mimeType: 'audio/mpeg',
      duration: 95,
      thumbnailUrl: 'https://example.com/reference-track-cover.png',
    },
  };

  return {
    selectedAsset,
    store: {
      history: [],
      config: {
        mode: 'generate',
        customMode: false,
        prompt: '',
        lyrics: '',
        style: 'pop',
        title: '',
        instrumental: false,
        model: 'suno-v3',
        duration: 180,
        extendDuration: 30,
        mediaType: 'music',
      },
      isGenerating: false,
      setConfig: vi.fn(),
      generate: vi.fn(async () => undefined),
      deleteTask: vi.fn(async () => undefined),
      clearHistory: vi.fn(async () => undefined),
      toggleFavorite: vi.fn(async () => undefined),
    },
    resolveAssetUrlByAssetIdFirst: vi.fn(async () => 'https://example.com/reference-track.mp3'),
  };
});

vi.mock('@sdkwork/magic-studio-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (_key: string, fallbackOrOptions?: string | Record<string, unknown>) =>
        typeof fallbackOrOptions === 'string' ? fallbackOrOptions : _key,
    }),
  };
});

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  PromptTextInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) =>
    React.createElement('textarea', {
      value,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    }),
  createPromptTextInputCapabilityProps: () => ({}),
  ChooseAsset: ({
    onChange,
  }: {
    onChange: (asset: any) => void;
  }) =>
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => onChange(mocks.selectedAsset),
      },
      'select-source-music'
    ),
}));

vi.mock('@sdkwork/magic-studio-assets/choose-asset', () => ({
  ChooseAsset: ({
    onChange,
  }: {
    onChange: (asset: any) => void;
  }) =>
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => onChange(mocks.selectedAsset),
      },
      'select-source-music'
    ),
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst: mocks.resolveAssetUrlByAssetIdFirst,
}));

vi.mock('../store/musicStore', () => ({
  useMusicStore: () => mocks.store,
}));

vi.mock('./MusicModelSelector', () => ({
  MusicModelSelector: ({ value }: { value: string }) =>
    React.createElement('div', { 'data-testid': 'music-model-selector' }, value),
}));

import { MusicLeftGeneratorPanel } from './MusicLeftGeneratorPanel';

const resetStore = (overrides?: Partial<typeof mocks.store.config>) => {
  mocks.store.config = {
    mode: 'generate',
    customMode: false,
    prompt: '',
    lyrics: '',
    style: 'pop',
    title: '',
    instrumental: false,
    model: 'suno-v3',
    duration: 180,
    extendDuration: 30,
    mediaType: 'music',
    ...overrides,
  };
  mocks.store.isGenerating = false;
  mocks.store.setConfig.mockClear();
  mocks.store.generate.mockClear();
  mocks.resolveAssetUrlByAssetIdFirst.mockClear();
};

describe('MusicLeftGeneratorPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
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

  it('switches to similar mode', async () => {
    resetStore();

    await act(async () => {
      root = createRoot(container!);
      root.render(<MusicLeftGeneratorPanel />);
    });

    const similarButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Similar')
    );

    expect(similarButton).toBeTruthy();

    await act(async () => {
      similarButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'similar',
      })
    );
  });

  it('maps selected asset-center music into sourceMusic config for music operations', async () => {
    resetStore({
      mode: 'similar',
    });

    await act(async () => {
      root = createRoot(container!);
      root.render(<MusicLeftGeneratorPanel />);
    });

    const selectSourceButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent === 'select-source-music'
    );

    expect(selectSourceButton).toBeTruthy();

    await act(async () => {
      selectSourceButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMusic: expect.objectContaining({
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          title: 'reference-track.mp3',
          duration: 95,
          resource: expect.objectContaining({
            url: 'https://example.com/reference-track.mp3',
            primaryResourceId: 'resource-1',
            resourceViewId: 'view-1',
          }),
        }),
      })
    );
  });

  it('disables create when remix mode has no source track selected', async () => {
    resetStore({
      mode: 'remix',
      style: 'jazz-funk',
      sourceMusic: null,
    } as any);

    await act(async () => {
      root = createRoot(container!);
      root.render(<MusicLeftGeneratorPanel />);
    });

    const createButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Create')
    ) as HTMLButtonElement | undefined;

    expect(createButton).toBeTruthy();
    expect(createButton?.disabled).toBe(true);
  });
});
