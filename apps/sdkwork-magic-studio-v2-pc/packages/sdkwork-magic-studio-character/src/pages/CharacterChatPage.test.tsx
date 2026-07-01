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
    model: 'gemini-2.5-flash-image',
    prompt: '',
    description: '',
    gender: 'male',
    archetype: 'hero',
    age: 30,
    outfit: '',
    hairstyle: '',
    hairColor: '',
    eyeColor: '',
    skinTone: '',
    accessories: '',
    aspectRatio: '9:16',
    mediaType: 'character',
    voiceId: 'Puck',
    avatarMode: 'full-body',
    avatar: undefined,
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

vi.mock('../store/characterStore', () => ({
  useCharacterStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    generate: mocks.generate,
    isGenerating: false,
    config: mocks.config,
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('@sdkwork/magic-studio-core/router', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    CHARACTER: '/character',
  },
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

import CharacterChatPage from './CharacterChatPage';

describe('CharacterChatPage upload handling', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.importAssetBySdk.mockReset();
    mocks.pickFiles.mockReset();
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
    mocks.config = {
      model: 'gemini-2.5-flash-image',
      prompt: '',
      description: '',
      gender: 'male',
      archetype: 'hero',
      age: 30,
      outfit: '',
      hairstyle: '',
      hairColor: '',
      eyeColor: '',
      skinTone: '',
      accessories: '',
      aspectRatio: '9:16',
      mediaType: 'character',
      voiceId: 'Puck',
      avatarMode: 'full-body',
      avatar: undefined,
    };
  });

  it('imports uploaded character image into avatar reference asset fields', async () => {
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'hero-reference.png',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'character-asset-db-1',
      uuid: 'character-resource-view-uuid-1',
      name: 'hero-reference.png',
      path: 'https://storage.example.com/hero-reference.png',
      metadata: {
        assetUuid: 'character-asset-uuid-1',
        primaryResourceId: 'character-primary-resource-id-1',
        primaryResourceUuid: 'character-primary-resource-uuid-1',
        resourceViewId: 'character-resource-view-id-1',
        resourceViewUuid: 'character-resource-view-uuid-1',
      },
    });

    renderToStaticMarkup(<CharacterChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    expect(mocks.importAssetBySdk).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'hero-reference.png',
        data: expect.any(Uint8Array),
      }),
      'image',
      { domain: 'character' }
    );
    expect(mocks.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar: expect.objectContaining({
          assetId: 'character-asset-db-1',
          assetUuid: 'character-asset-uuid-1',
          primaryResourceId: 'character-primary-resource-id-1',
          primaryResourceUuid: 'character-primary-resource-uuid-1',
          resourceViewId: 'character-resource-view-id-1',
          resourceViewUuid: 'character-resource-view-uuid-1',
          path: 'https://storage.example.com/hero-reference.png',
          url: 'https://storage.example.com/hero-reference.png',
          type: 'image',
        }),
      })
    );
  });
});
