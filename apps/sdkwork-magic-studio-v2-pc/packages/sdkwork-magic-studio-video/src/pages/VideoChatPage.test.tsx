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

vi.mock('../store/videoStore', () => ({
  VideoStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useVideoStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    generate: mocks.generate,
    isGenerating: false,
    config: {
      mode: 'text',
      prompt: '',
      model: 'test-model',
      styleId: 'none',
      aspectRatio: '16:9',
      resolution: '1080p',
      duration: '5s',
      fps: 24,
    },
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    VIDEO: '/video',
  },
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

import VideoChatPage from './VideoChatPage';

describe('VideoChatPage upload identity handling', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.importAssetBySdk.mockReset();
    mocks.pickFiles.mockReset();
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
  });

  it('creates canonical subject reference refs with null id and no fabricated assetUuid when upload only returns a client uuid', async () => {
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'reference-frame.png',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'asset-db-2',
      uuid: 'resource-view-uuid-2',
      name: 'reference-frame.png',
      path: 'https://storage.example.com/reference-frame.png',
      metadata: {},
    });

    renderToStaticMarkup(<VideoChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    const configPatch = mocks.setConfig.mock.calls[0]?.[0] as {
      image: Record<string, unknown>;
      mode: string;
    };

    expect(configPatch.mode).toBe('subject_ref');
    expect(configPatch.image).toMatchObject({
      id: null,
      uuid: 'resource-view-uuid-2',
      type: 'image',
      assetId: 'asset-db-2',
      assetUuid: null,
      url: 'https://storage.example.com/reference-frame.png',
      name: 'reference-frame.png',
    });
  });
});
