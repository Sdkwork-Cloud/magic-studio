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

vi.mock('../store/imageStore', () => ({
  ImageStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  useImageStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    generate: mocks.generate,
    isGenerating: false,
    config: {},
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  useRouter: () => ({
    navigate: mocks.navigate,
  }),
  ROUTES: {
    IMAGE: '/image',
  },
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

import ImageChatPage from './ImageChatPage';

describe('ImageChatPage upload identity handling', () => {
  beforeEach(() => {
    mocks.generationProps = null;
    mocks.importAssetBySdk.mockReset();
    mocks.pickFiles.mockReset();
    mocks.setConfig.mockReset();
    mocks.navigate.mockReset();
    mocks.deleteTask.mockReset();
    mocks.generate.mockReset();
  });

  it('creates local image refs with null id and no fabricated assetUuid when upload only returns a client uuid', async () => {
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'reference.png',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.importAssetBySdk.mockResolvedValue({
      id: 'asset-db-1',
      uuid: 'resource-view-uuid-1',
      name: 'reference.png',
      path: 'https://storage.example.com/reference.png',
      metadata: {},
    });

    renderToStaticMarkup(<ImageChatPage />);

    await (mocks.generationProps?.onUpload as (() => Promise<void>))();

    const configPatch = mocks.setConfig.mock.calls[0]?.[0] as {
      referenceImages: Array<Record<string, unknown>>;
    };
    const reference = configPatch.referenceImages[0];

    expect(reference).toMatchObject({
      id: null,
      uuid: 'resource-view-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: null,
      url: 'https://storage.example.com/reference.png',
      name: 'reference.png',
    });
  });
});
