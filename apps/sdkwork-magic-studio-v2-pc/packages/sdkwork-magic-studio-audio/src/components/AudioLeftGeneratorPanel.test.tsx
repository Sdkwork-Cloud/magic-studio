/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAudioInputResourceRef, type AudioGenerationParams } from '../entities';

const mocks = vi.hoisted(() => {
  const selectedAsset = {
    id: 'asset-1',
    uuid: 'asset-uuid-1',
    name: 'meeting-notes.wav',
    type: 'audio',
    path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/meeting-notes.wav',
    createdAt: '2026-04-05T00:00:00.000Z',
    updatedAt: '2026-04-05T00:00:00.000Z',
    metadata: {
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-1',
      resourceViewUuid: 'view-uuid-1',
      mimeType: 'audio/wav',
    },
  };

  return {
    selectedAsset,
    store: {
      history: [],
      config: {
        prompt: '',
        mode: 'text-to-speech',
        model: 'gemini-tts',
        duration: 10,
        mediaType: 'speech',
      },
      isGenerating: false,
      setConfig: vi.fn(),
      generate: vi.fn(async () => undefined),
      deleteTask: vi.fn(async () => undefined),
      importTask: vi.fn(),
      toggleFavorite: vi.fn(async () => undefined),
      loadHistory: vi.fn(async () => undefined),
    },
    importAssetBySdk: vi.fn(async () => selectedAsset),
    resolveAssetUrlByAssetIdFirst: vi.fn(async () => 'https://example.com/source-audio.wav'),
    persistChooseAssetProjectReference: vi.fn(async () => undefined),
  };
});

vi.mock('@sdkwork/magic-studio-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  PromptTextInput: ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) =>
    React.createElement('textarea', {
      value,
      placeholder,
      disabled,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    }),
  createPromptTextInputCapabilityProps: () => ({}),
}));

vi.mock('@sdkwork/magic-studio-assets/choose-asset', () => ({
  ChooseAssetModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean;
    onConfirm: (assets: any[]) => void;
  }) =>
    isOpen
      ? React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => onConfirm([mocks.selectedAsset]),
          },
          'confirm-asset'
        )
      : null,
  persistChooseAssetProjectReference: mocks.persistChooseAssetProjectReference,
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk: mocks.importAssetBySdk,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst: mocks.resolveAssetUrlByAssetIdFirst,
}));

vi.mock('../store/audioStore', () => ({
  useAudioStore: () => mocks.store,
}));

vi.mock('./AudioModelSelector', () => ({
  AudioModelSelector: ({ value }: { value: string }) =>
    React.createElement('div', { 'data-testid': 'audio-model-selector' }, value),
}));

import { AudioLeftGeneratorPanel } from './AudioLeftGeneratorPanel';

const resetStore = (overrides?: Partial<AudioGenerationParams>) => {
  mocks.store.config = {
    prompt: '',
    mode: 'text-to-speech',
    model: 'gemini-tts',
    duration: 10,
    mediaType: 'speech',
    ...overrides,
  };
  mocks.store.isGenerating = false;
  mocks.store.setConfig.mockClear();
  mocks.store.generate.mockClear();
  mocks.importAssetBySdk.mockClear();
  mocks.resolveAssetUrlByAssetIdFirst.mockClear();
  mocks.persistChooseAssetProjectReference.mockClear();
};

describe('AudioLeftGeneratorPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;
  let originalAudio: typeof Audio | undefined;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    originalAudio = globalThis.Audio;
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
    if (originalAudio) {
      globalThis.Audio = originalAudio;
    }
    document.body.innerHTML = '';
  });

  it('switches to transcription mode with the canonical default transcription model', async () => {
    resetStore();

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioLeftGeneratorPanel />);
    });

    const transcriptionButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Transcription')
    );

    expect(transcriptionButton).toBeTruthy();

    await act(async () => {
      transcriptionButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'transcription',
        model: 'whisper-1',
      })
    );
  });

  it('switches to translation mode with the canonical default translation model and text output format', async () => {
    resetStore();

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioLeftGeneratorPanel />);
    });

    const translationButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Translation')
    );

    expect(translationButton).toBeTruthy();

    await act(async () => {
      translationButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'translation',
        model: 'whisper-1',
        format: 'text',
      })
    );
  });

  it('maps selected asset-center audio into sourceAudio refs for transcription', async () => {
    resetStore({
      mode: 'transcription',
      model: 'whisper-1',
    });

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioLeftGeneratorPanel />);
    });

    const selectAssetsButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Select from Assets')
    );

    expect(selectAssetsButton).toBeTruthy();

    await act(async () => {
      selectAssetsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const confirmAssetButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent === 'confirm-asset'
    );

    expect(confirmAssetButton).toBeTruthy();

    await act(async () => {
      confirmAssetButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceAudio: expect.objectContaining({
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          primaryResourceId: 'resource-1',
          primaryResourceUuid: 'resource-uuid-1',
          resourceViewId: 'view-1',
          resourceViewUuid: 'view-uuid-1',
          type: 'audio',
          url: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/meeting-notes.wav',
          name: 'meeting-notes.wav',
        }),
      })
    );
  });

  it('uploads local transcription audio through importAssetBySdk and stores a canonical sourceAudio ref', async () => {
    resetStore({
      mode: 'transcription',
      model: 'whisper-1',
    });

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioLeftGeneratorPanel />);
    });

    const fileInput = container!.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'meeting-notes.wav', {
      type: 'audio/wav',
    });

    Object.defineProperty(fileInput!, 'files', {
      configurable: true,
      value: [file],
    });

    await act(async () => {
      fileInput?.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.importAssetBySdk).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'meeting-notes.wav',
        data: expect.any(Uint8Array),
      }),
      'audio',
      { domain: 'audio-studio' }
    );
    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceAudio: expect.objectContaining({
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          url: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/meeting-notes.wav',
          name: 'meeting-notes.wav',
        }),
      })
    );
  });

  it('updates target language from the translation panel', async () => {
    resetStore({
      mode: 'translation',
      model: 'whisper-1',
      format: 'text',
    });

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioLeftGeneratorPanel />);
    });

    const targetLanguageInput = Array.from(container!.querySelectorAll('input')).find((input) =>
      input.getAttribute('placeholder') === 'Target language'
    ) as HTMLInputElement | undefined;

    expect(targetLanguageInput).toBeTruthy();

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      valueSetter?.call(targetLanguageInput, 'ja');
      targetLanguageInput!.dispatchEvent(new Event('input', { bubbles: true }));
      targetLanguageInput!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        targetLanguage: 'ja',
      })
    );
  });

  it('does not try to play canonical locators when no renderable audio url is available', async () => {
    const audioPlay = vi.fn(async () => undefined);
    const audioPause = vi.fn();
    const audioConstructor = vi.fn(() => ({
      play: audioPlay,
      pause: audioPause,
      currentTime: 0,
      onended: null,
      onerror: null,
    }));
    globalThis.Audio = audioConstructor as unknown as typeof Audio;

    mocks.resolveAssetUrlByAssetIdFirst.mockImplementationOnce(async () => null as any);
    resetStore({
      mode: 'transcription',
      model: 'whisper-1',
      sourceAudio: createAudioInputResourceRef({
        type: 'audio',
        path: 'assets://workspace/audio/meeting-notes.wav',
        name: 'meeting-notes.wav',
      }),
    });

    await act(async () => {
      root = createRoot(container!);
      root.render(<AudioLeftGeneratorPanel />);
    });

    const playButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.getAttribute('title') === 'Play Source Audio'
    );

    expect(playButton).toBeTruthy();

    await act(async () => {
      playButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(audioConstructor).not.toHaveBeenCalled();
    expect(audioPlay).not.toHaveBeenCalled();
  });
});
