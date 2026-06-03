import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generationProps: null as Record<string, unknown> | null,
  importAssetBySdk: vi.fn(),
  resolveAssetUrlByAssetIdFirst: vi.fn(),
  pickFiles: vi.fn(),
  setConfig: vi.fn(),
  navigate: vi.fn(),
  deleteTask: vi.fn(),
  generate: vi.fn(),
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
    sourceMusic: null,
    mediaType: 'music',
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

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst: mocks.resolveAssetUrlByAssetIdFirst,
}));

vi.mock('../index', () => ({
  MusicStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useMusicStore: () => ({
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
    MUSIC: '/music',
  },
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

import MusicChatPage from './MusicChatPage';

describe('MusicChatPage upload handling', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.importAssetBySdk.mockReset();
    mocks.resolveAssetUrlByAssetIdFirst.mockReset();
    mocks.pickFiles.mockReset();
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
    mocks.config = {
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
      sourceMusic: null,
      mediaType: 'music',
    };
    mocks.resolveAssetUrlByAssetIdFirst.mockImplementation(async (asset: { path?: string }) => asset.path || '');
  });

  it('imports uploaded music and switches generate mode into similar mode', async () => {
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'source-track.mp3',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'music-asset-db-1',
      uuid: 'music-resource-view-uuid-1',
      name: 'source-track.mp3',
      path: 'https://storage.example.com/source-track.mp3',
      metadata: {
        duration: 95,
      },
    });

    renderToStaticMarkup(<MusicChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    expect(mocks.importAssetBySdk).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'source-track.mp3',
        data: expect.any(Uint8Array),
      }),
      'music',
      { domain: 'music' }
    );
    expect(mocks.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'similar',
        sourceMusic: expect.objectContaining({
          assetId: 'music-asset-db-1',
          title: 'source-track.mp3',
          duration: 95,
          resource: expect.objectContaining({
            url: 'https://storage.example.com/source-track.mp3',
            name: 'source-track.mp3',
          }),
        }),
      })
    );
  });

  it('keeps remix mode when uploading a replacement source track', async () => {
    mocks.config = {
      mode: 'remix',
      customMode: false,
      prompt: '',
      lyrics: '',
      style: 'jazz-funk',
      title: '',
      instrumental: false,
      model: 'suno-v3',
      duration: 180,
      extendDuration: 30,
      sourceMusic: null,
      mediaType: 'music',
    };
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'remix-source.mp3',
        data: new Uint8Array([4, 5, 6]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'music-asset-db-2',
      uuid: 'music-resource-view-uuid-2',
      name: 'remix-source.mp3',
      path: 'https://storage.example.com/remix-source.mp3',
      metadata: {
        duration: 120,
      },
    });

    renderToStaticMarkup(<MusicChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    expect(mocks.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'remix',
        sourceMusic: expect.objectContaining({
          assetId: 'music-asset-db-2',
          title: 'remix-source.mp3',
          duration: 120,
        }),
      })
    );
  });
});
