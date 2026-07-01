/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  consumePortalLaunchSession: vi.fn(),
  resolvePortalLaunchAttachmentRef: vi.fn(),
  toPortalLaunchAttachmentAssetUrlSource: vi.fn(),
  resolveAssetUrlByAssetIdFirst: vi.fn(),
  setConfig: vi.fn(),
  deleteTask: vi.fn(),
  importTask: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  GENERATION_TABS: [],
  GenerationHistoryListPane: () => null,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  consumePortalLaunchSession: mocks.consumePortalLaunchSession,
  resolvePortalLaunchAttachmentRef: mocks.resolvePortalLaunchAttachmentRef,
  toPortalLaunchAttachmentAssetUrlSource: mocks.toPortalLaunchAttachmentAssetUrlSource,
  resolveAssetUrlByAssetIdFirst: mocks.resolveAssetUrlByAssetIdFirst,
}));

vi.mock('../store/videoStore', () => ({
  useVideoStore: () => ({
    history: [],
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
    VIDEO_CHAT: '/video-chat',
  },
}));

import VideoPage from './VideoPage';

describe('VideoPage portal attachment identity handling', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.consumePortalLaunchSession.mockReset();
    mocks.resolvePortalLaunchAttachmentRef.mockReset();
    mocks.toPortalLaunchAttachmentAssetUrlSource.mockReset();
    mocks.resolveAssetUrlByAssetIdFirst.mockReset();
    mocks.setConfig.mockReset();
    mocks.deleteTask.mockReset();
    mocks.importTask.mockReset();
    mocks.navigate.mockReset();

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

  it('creates local video refs with null id while preserving attachment uuid and asset identity', async () => {
    mocks.consumePortalLaunchSession.mockReturnValue({
      prompt: 'portal video prompt',
      attachments: [{ type: 'image' }],
    });
    mocks.resolvePortalLaunchAttachmentRef.mockReturnValue({
      id: 'attachment-db-2',
      uuid: 'attachment-local-uuid-2',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      locator: 'https://tmp.example.com/portal-video-image.png',
      name: 'Portal Video Image',
    });
    mocks.toPortalLaunchAttachmentAssetUrlSource.mockImplementation((identity) => identity);
    mocks.resolveAssetUrlByAssetIdFirst.mockResolvedValue('https://cdn.example.com/portal-video-image.png');

    await act(async () => {
      root = createRoot(container!);
      root.render(<VideoPage />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const updates = mocks.setConfig.mock.calls[0]?.[0] as {
      image: Record<string, unknown>;
      referenceImages: Array<Record<string, unknown>>;
    };

    expect(updates.image).toMatchObject({
      id: null,
      uuid: 'attachment-local-uuid-2',
      type: 'image',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      url: 'https://cdn.example.com/portal-video-image.png',
      name: 'Portal Video Image',
    });
    expect(updates.referenceImages[0]).toMatchObject({
      id: null,
      uuid: 'attachment-local-uuid-2',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
    });
  });
});
