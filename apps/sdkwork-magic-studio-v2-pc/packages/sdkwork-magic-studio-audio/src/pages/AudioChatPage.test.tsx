import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationProps: null as Record<string, unknown> | null,
  importAssetBySdk: vi.fn(),
  pickFiles: vi.fn(),
  setConfig: vi.fn(),
  navigate: vi.fn(),
  deleteTask: vi.fn(),
  generate: vi.fn(),
  config: {
    prompt: '',
    mode: 'text-to-speech',
    model: 'gemini-tts',
    duration: 10,
    mediaType: 'speech',
  } as Record<string, unknown>,
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  GenerationChatWindow: (props: Record<string, unknown>) => {
    mocks.generationProps = props;
    return null;
  },
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk: mocks.importAssetBySdk,
}));

vi.mock('../store', () => ({
  AudioStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useAudioStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    generate: mocks.generate,
    isGenerating: false,
    config: mocks.config,
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    AUDIO: '/audio',
  },
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

import AudioChatPage from './AudioChatPage';

describe('AudioChatPage upload handling', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.importAssetBySdk.mockReset();
    mocks.pickFiles.mockReset();
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
    mocks.config = {
      prompt: '',
      mode: 'text-to-speech',
      model: 'gemini-tts',
      duration: 10,
      mediaType: 'speech',
    };
  });

  it('imports uploaded audio into sourceAudio and switches text-to-speech chat into transcription mode', async () => {
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'meeting-notes.wav',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'audio-asset-db-1',
      uuid: 'audio-resource-view-uuid-1',
      name: 'meeting-notes.wav',
      path: 'https://storage.example.com/meeting-notes.wav',
      metadata: {},
    });

    renderToStaticMarkup(<AudioChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    expect(mocks.importAssetBySdk).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'meeting-notes.wav',
        data: expect.any(Uint8Array),
      }),
      'audio',
      { domain: 'audio-studio' }
    );
    expect(mocks.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'transcription',
        model: 'whisper-1',
        format: 'text',
        sourceAudio: expect.objectContaining({
          id: null,
          uuid: 'audio-resource-view-uuid-1',
          type: 'audio',
          assetId: 'audio-asset-db-1',
          assetUuid: null,
          url: 'https://storage.example.com/meeting-notes.wav',
          name: 'meeting-notes.wav',
        }),
      })
    );
  });

  it('keeps translation mode when uploading source audio for translation chat', async () => {
    mocks.config = {
      prompt: '',
      mode: 'translation',
      model: 'whisper-1',
      format: 'json',
      duration: 10,
      mediaType: 'speech',
      targetLanguage: 'ja',
    };
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'speech-source.wav',
        data: new Uint8Array([4, 5, 6]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'audio-asset-db-2',
      uuid: 'audio-resource-view-uuid-2',
      name: 'speech-source.wav',
      path: 'https://storage.example.com/speech-source.wav',
      metadata: {},
    });

    renderToStaticMarkup(<AudioChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    expect(mocks.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'translation',
        model: 'whisper-1',
        format: 'json',
        sourceAudio: expect.objectContaining({
          uuid: 'audio-resource-view-uuid-2',
          assetId: 'audio-asset-db-2',
          url: 'https://storage.example.com/speech-source.wav',
        }),
      })
    );
  });
});
