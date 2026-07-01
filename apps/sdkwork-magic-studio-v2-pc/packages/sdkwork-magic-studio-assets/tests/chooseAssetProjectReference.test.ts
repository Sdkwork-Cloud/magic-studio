import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(async () => undefined),
  findById: vi.fn(async () => null),
  bindReference: vi.fn(async () => undefined),
  registerExistingAsset: vi.fn(async () => undefined),
  readWorkspaceScope: vi.fn(),
}));

vi.mock('../src/asset-center', () => ({
  assetCenterService: {
    initialize: mocks.initialize,
    findById: mocks.findById,
    bindReference: mocks.bindReference,
    registerExistingAsset: mocks.registerExistingAsset,
  },
  isManagedAssetLocator: (value: string) => value.startsWith('assets://'),
  isExplicitLocalAssetLocator: (value: string) =>
    value.startsWith('file://') || value.startsWith('desktop://'),
  isDesktopAssetLocator: (value: string) => value.startsWith('desktop://'),
  stripExplicitLocalAssetLocatorProtocol: (value: string) =>
    value.startsWith('file://')
      ? value.slice('file://'.length)
      : value.startsWith('desktop://')
        ? value.slice('desktop://'.length)
        : value,
  readWorkspaceScope: mocks.readWorkspaceScope,
}));

import { persistChooseAssetProjectReference } from '../src/components/chooseAssetProjectReference';

describe('persistChooseAssetProjectReference', () => {
  beforeEach(() => {
    mocks.initialize.mockClear();
    mocks.findById.mockReset();
    mocks.bindReference.mockClear();
    mocks.registerExistingAsset.mockClear();
    mocks.readWorkspaceScope.mockReset();

    mocks.findById.mockResolvedValue(null);
    mocks.readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-1',
      projectId: 'project-1',
    });
  });

  it('preserves managed asset locators as canonical uri while keeping delivery url separate', async () => {
    await persistChooseAssetProjectReference({
      uploaded: {
        id: 'asset-db-1',
        name: 'reference.wav',
        type: 'audio',
        path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/reference.wav',
        origin: 'upload',
        metadata: {},
      } as any,
      resolvedUrl: 'https://cdn.example.com/reference.wav',
      fallbackType: 'audio',
      domain: 'voice-speaker',
      projectReference: {
        slot: 'voice-left-reference-audio',
        metadata: {
          source: 'voice-left-generator-panel',
        },
      },
    });

    expect(mocks.registerExistingAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'asset-db-1',
        scope: {
          workspaceId: 'workspace-1',
          projectId: 'project-1',
          domain: 'voice-speaker',
        },
        locator: {
          protocol: 'assets',
          uri: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/reference.wav',
          url: 'https://cdn.example.com/reference.wav',
        },
      })
    );
  });

  it('preserves desktop locators as canonical uri while keeping desktop preview delivery separate', async () => {
    await persistChooseAssetProjectReference({
      uploaded: {
        id: 'asset-db-2',
        name: 'reference.wav',
        type: 'audio',
        path: 'desktop://D:/magic-studio/workspaces/workspace-1/reference.wav',
        origin: 'upload',
        metadata: {},
      } as any,
      resolvedUrl: 'http://127.0.0.1:6130/assets/reference.wav',
      fallbackType: 'audio',
      domain: 'voice-speaker',
      projectReference: {
        slot: 'voice-left-reference-audio',
      },
    });

    expect(mocks.registerExistingAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'asset-db-2',
        locator: {
          protocol: 'desktop',
          uri: 'desktop://D:/magic-studio/workspaces/workspace-1/reference.wav',
          path: 'D:/magic-studio/workspaces/workspace-1/reference.wav',
          url: 'http://127.0.0.1:6130/assets/reference.wav',
        },
      })
    );
  });
});
