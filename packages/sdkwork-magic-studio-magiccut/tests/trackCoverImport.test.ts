import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} = vi.hoisted(() => ({
  importAssetBySdk: vi.fn(),
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

const {
  assetCenterInitialize,
  assetCenterFindById,
  assetCenterRegisterExistingAsset,
  assetCenterBindReference,
  readWorkspaceScope,
} = vi.hoisted(() => ({
  assetCenterInitialize: vi.fn(),
  assetCenterFindById: vi.fn(),
  assetCenterRegisterExistingAsset: vi.fn(),
  assetCenterBindReference: vi.fn(),
  readWorkspaceScope: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  readWorkspaceScope,
  isCanonicalMagicStudioAssetReference: (value: string) =>
    value.startsWith('assets://') ||
    value.startsWith('file://') ||
    value.startsWith('desktop://'),
  isManagedAssetLocator: (value: string) => value.startsWith('assets://'),
  isFileAssetLocator: (value: string) => value.startsWith('file://'),
  isDesktopAssetLocator: (value: string) => value.startsWith('desktop://'),
  isRenderableAssetUrl: (value: string) =>
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('asset:'),
  assetCenterService: {
    initialize: assetCenterInitialize,
    findById: assetCenterFindById,
    registerExistingAsset: assetCenterRegisterExistingAsset,
    bindReference: assetCenterBindReference,
  },
}));

import {
  importMagicCutTrackCoverFile,
  importMagicCutTrackCoverFromUrl,
} from '../src/utils/magicCutTrackCoverImport';

describe('magicCutTrackCoverImport', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-magiccut-1',
      projectId: 'workspace-project-fallback',
    });
  });

  it('uploads local files through the asset sdk and returns the resolved asset url', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'asset-file-1',
      path: 'https://storage.example.com/raw-cover.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-cover.png');

    await expect(
      importMagicCutTrackCoverFile({
        name: 'cover.png',
        data: new Uint8Array([1, 2, 3]),
      })
    ).resolves.toEqual({
      assetId: 'asset-file-1',
      reference: 'https://cdn.example.com/final-cover.png',
      previewUrl: 'https://cdn.example.com/final-cover.png',
    });

    expect(importAssetBySdk).toHaveBeenCalledWith(
      {
        name: 'cover.png',
        data: new Uint8Array([1, 2, 3]),
      },
      'image',
      { domain: 'magiccut' }
    );
  });

  it('registers project-level references when uploaded track covers are not yet indexed in asset center', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'asset-file-reference-1',
      path: 'https://storage.example.com/raw-cover-reference.png',
      size: 3,
      createdAt: '2026-04-07T10:00:00.000Z',
      updatedAt: '2026-04-07T10:00:00.000Z',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-cover-reference.png');
    assetCenterFindById.mockResolvedValue(null);

    await importMagicCutTrackCoverFile(
      {
        name: 'cover-reference.png',
        data: new Uint8Array([1, 2, 3]),
      },
      {
        projectId: 'magiccut-project-1',
        trackId: 'track-1',
        source: 'magiccut-track-cover-upload',
      }
    );

    expect(assetCenterInitialize).toHaveBeenCalledTimes(1);
    expect(assetCenterRegisterExistingAsset).toHaveBeenCalledWith({
      scope: {
        workspaceId: 'workspace-magiccut-1',
        projectId: 'magiccut-project-1',
        domain: 'magiccut',
      },
      type: 'image',
      name: 'cover-reference.png',
      assetId: 'asset-file-reference-1',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/final-cover-reference.png',
        url: 'https://cdn.example.com/final-cover-reference.png',
      },
      metadata: {
        source: 'magiccut-track-cover-upload',
        trackId: 'track-1',
      },
      references: [
        {
          domain: 'magiccut',
          entityType: 'project',
          entityId: 'magiccut-project-1',
          relation: 'reference',
          slot: 'track-cover',
          metadata: {
            source: 'magiccut-track-cover-upload',
            trackId: 'track-1',
          },
        },
      ],
      status: 'imported',
      size: 3,
      createdAt: '2026-04-07T10:00:00.000Z',
      updatedAt: '2026-04-07T10:00:00.000Z',
    });
    expect(assetCenterBindReference).not.toHaveBeenCalled();
  });

  it('re-imports url sources through the asset sdk so generated frames become persistent cover assets', async () => {
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-url-1',
      path: 'https://storage.example.com/reimported-cover.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      importMagicCutTrackCoverFromUrl('blob:track-cover', 'track-cover.png')
    ).resolves.toEqual({
      assetId: 'asset-url-1',
      reference: 'https://storage.example.com/reimported-cover.png',
      previewUrl: 'https://storage.example.com/reimported-cover.png',
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'blob:track-cover',
      'image',
      {
        name: 'track-cover.png',
        domain: 'magiccut',
      }
    );
  });

  it('binds project-level references when selected frame covers already exist in asset center', async () => {
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-url-reference-1',
      path: 'https://storage.example.com/reimported-cover-reference.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-cover-reference.png');
    assetCenterFindById.mockResolvedValue({
      assetId: 'asset-url-reference-1',
      references: [],
    });

    await importMagicCutTrackCoverFromUrl(
      'blob:track-cover-reference',
      'track-cover-reference.png',
      {
        projectId: 'magiccut-project-1',
        trackId: 'track-1',
        source: 'magiccut-track-cover-frame',
      }
    );

    expect(assetCenterInitialize).toHaveBeenCalledTimes(1);
    expect(assetCenterRegisterExistingAsset).not.toHaveBeenCalled();
    expect(assetCenterBindReference).toHaveBeenCalledWith('asset-url-reference-1', {
      domain: 'magiccut',
      entityType: 'project',
      entityId: 'magiccut-project-1',
      relation: 'reference',
      slot: 'track-cover',
      metadata: {
        source: 'magiccut-track-cover-frame',
        trackId: 'track-1',
      },
    });
  });

  it('prefers managed asset locators over resolved transport urls for persisted track cover state', async () => {
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-url-managed-1',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/track-cover.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/managed-track-cover.png');

    await expect(
      importMagicCutTrackCoverFromUrl('blob:managed-track-cover', 'managed-track-cover.png')
    ).resolves.toEqual({
      assetId: 'asset-url-managed-1',
      reference: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/track-cover.png',
      previewUrl: 'https://cdn.example.com/managed-track-cover.png',
    });
  });

  it('registers managed track cover locators with remote preview urls when both are available', async () => {
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-url-managed-reference-1',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/track-cover-reference.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/managed-track-cover-reference.png');
    assetCenterFindById.mockResolvedValue(null);

    await importMagicCutTrackCoverFromUrl(
      'blob:managed-track-cover-reference',
      'managed-track-cover-reference.png',
      {
        projectId: 'magiccut-project-1',
        trackId: 'track-1',
        source: 'magiccut-track-cover-frame',
      }
    );

    expect(assetCenterRegisterExistingAsset).toHaveBeenCalledWith({
      scope: {
        workspaceId: 'workspace-magiccut-1',
        projectId: 'magiccut-project-1',
        domain: 'magiccut',
      },
      type: 'image',
      name: 'managed-track-cover-reference.png',
      assetId: 'asset-url-managed-reference-1',
      locator: {
        protocol: 'assets',
        uri: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/track-cover-reference.png',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/track-cover-reference.png',
        url: 'https://cdn.example.com/managed-track-cover-reference.png',
      },
      metadata: {
        source: 'magiccut-track-cover-frame',
        trackId: 'track-1',
      },
      references: [
        {
          domain: 'magiccut',
          entityType: 'project',
          entityId: 'magiccut-project-1',
          relation: 'reference',
          slot: 'track-cover',
          metadata: {
            source: 'magiccut-track-cover-frame',
            trackId: 'track-1',
          },
        },
      ],
      status: 'imported',
    });
  });
});
