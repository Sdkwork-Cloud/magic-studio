import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationProps: null as Record<string, unknown> | null,
  importReferenceAudioFromUpload: vi.fn(),
  pickFiles: vi.fn(),
  setConfig: vi.fn(),
  navigate: vi.fn(),
  deleteTask: vi.fn(),
  generate: vi.fn(),
  config: {
    text: '',
    previewText: 'Hello, this is a preview of my new voice. How do I sound?',
    mode: 'design',
    inputMethod: 'upload',
    voiceId: 'speaker-kore',
    model: 'gpt-4o-mini-tts',
    speed: 1,
    pitch: 1,
    mediaType: 'voice',
  } as Record<string, unknown>,
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  GenerationChatWindow: (props: Record<string, unknown>) => {
    mocks.generationProps = props;
    return null;
  },
}));

vi.mock('../store/voiceStore', () => ({
  VoiceStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useVoiceStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    generate: mocks.generate,
    isGenerating: false,
    config: mocks.config,
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('../services', () => ({
  voiceBusinessService: {
    voiceSpeakerService: {
      importReferenceAudioFromUpload: mocks.importReferenceAudioFromUpload,
    },
  },
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    VOICE: '/voice',
  },
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

import VoiceChatPage from './VoiceChatPage';

describe('VoiceChatPage upload handling', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.importReferenceAudioFromUpload.mockReset();
    mocks.pickFiles.mockReset();
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
    mocks.config = {
      text: '',
      previewText: 'Hello, this is a preview of my new voice. How do I sound?',
      mode: 'design',
      inputMethod: 'upload',
      voiceId: 'speaker-kore',
      model: 'gpt-4o-mini-tts',
      speed: 1,
      pitch: 1,
      mediaType: 'voice',
    };
  });

  it('uses voice chat mode instead of generic agent mode', () => {
    renderToStaticMarkup(<VoiceChatPage />);

    expect(mocks.generationProps?.mode).toBe('voice');
  });

  it('imports uploaded reference audio and switches chat config into clone mode', async () => {
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'reference-voice.wav',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.importReferenceAudioFromUpload.mockResolvedValue({
      id: 'voice-asset-db-1',
      uuid: 'voice-resource-view-uuid-1',
      name: 'reference-voice.wav',
      path: 'https://storage.example.com/reference-voice.wav',
      metadata: {
        assetUuid: 'voice-asset-uuid-1',
        primaryResourceId: 'voice-primary-resource-id-1',
        primaryResourceUuid: 'voice-primary-resource-uuid-1',
        resourceViewId: 'voice-resource-view-id-1',
        resourceViewUuid: 'voice-resource-view-uuid-1',
      },
    });

    renderToStaticMarkup(<VoiceChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    expect(mocks.importReferenceAudioFromUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'reference-voice.wav',
        data: expect.any(Uint8Array),
      }),
      'voice-chat-upload'
    );
    expect(mocks.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'clone',
        inputMethod: 'upload',
        referenceAudio: expect.objectContaining({
          id: 'voice-asset-db-1',
          uuid: 'voice-asset-uuid-1',
          type: 'audio',
          assetId: 'voice-asset-db-1',
          assetUuid: 'voice-asset-uuid-1',
          primaryResourceId: 'voice-primary-resource-id-1',
          primaryResourceUuid: 'voice-primary-resource-uuid-1',
          resourceViewId: 'voice-resource-view-id-1',
          resourceViewUuid: 'voice-resource-view-uuid-1',
          url: 'https://storage.example.com/reference-voice.wav',
          name: 'reference-voice.wav',
        }),
      })
    );
  });
});
