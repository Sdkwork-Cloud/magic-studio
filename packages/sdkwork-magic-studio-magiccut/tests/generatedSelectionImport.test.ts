import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-commons';
import type { UnifiedDigitalAsset } from '@sdkwork/magic-studio-types';

const {
  assetCenterService,
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} = vi.hoisted(() => ({
  assetCenterService: {
    initialize: vi.fn(),
    findById: vi.fn(),
  },
  importAssetBySdk: vi.fn(),
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

const { tryExtractInlineData } = vi.hoisted(() => ({
  tryExtractInlineData: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  assetCenterService,
  isCanonicalMagicStudioAssetReference: (value: string) =>
    value.startsWith('assets://') ||
    value.startsWith('file://') ||
    value.startsWith('desktop://'),
  isManagedAssetLocator: (value: string) =>
    value.startsWith('assets://') ||
    value.startsWith('file://') ||
    value.startsWith('desktop://'),
  isExplicitLocalAssetLocator: (value: string) =>
    value.startsWith('file://') ||
    value.startsWith('desktop://'),
  isDesktopAssetLocator: (value: string) => value.startsWith('desktop://'),
  isRenderableAssetUrl: (value: string) =>
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('asset:'),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  assetCenterService,
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  inlineDataService: {
    tryExtractInlineData,
  },
}));

import { resolveMagicCutGeneratedSelectionResource } from '../src/utils/generatedSelectionImport';

const createAsset = (): UnifiedDigitalAsset =>
  ({
    id: 'asset-1',
    uuid: 'asset-1',
    assetId: 'asset-1',
    key: 'workspace-1/magiccut/asset-1',
    title: 'Hero Clip',
    primaryType: 'video',
    payload: {
      video: {
        id: 'media-1',
        uuid: 'media-1',
        name: 'hero.mp4',
        type: MediaResourceType.VIDEO,
        path: 'assets://workspace-1/magiccut/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
        duration: 12,
        width: 1920,
        height: 1080,
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
      assets: [
        {
          id: 'media-1',
          uuid: 'media-1',
          name: 'hero.mp4',
          type: MediaResourceType.VIDEO,
          path: 'assets://workspace-1/magiccut/hero.mp4',
          url: 'https://cdn.example.com/hero.mp4',
          duration: 12,
          width: 1920,
          height: 1080,
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
      ],
    },
    scope: {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      domain: 'magiccut',
    },
    storage: {
      mode: 'hybrid',
      primary: {
        protocol: 'assets',
        uri: 'assets://workspace-1/magiccut/hero.mp4',
        path: '/workspace-1/magiccut/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
      },
      cacheable: true,
    },
    status: 'ready',
    versionInfo: {
      version: 1,
    },
    metadata: {
      origin: 'ai',
    },
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  }) as UnifiedDigitalAsset;

describe('resolveMagicCutGeneratedSelectionResource', () => {
  beforeEach(() => {
    assetCenterService.initialize.mockReset();
    assetCenterService.findById.mockReset();
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
  });

  it('reuses existing asset-center assets before falling back to URL import', async () => {
    assetCenterService.findById.mockResolvedValue(createAsset());

    await expect(
      resolveMagicCutGeneratedSelectionResource({
        selection: {
          key: 'asset-1',
          type: 'video',
          taskId: 'task-1',
          resultIndex: 0,
          url: 'https://cdn.example.com/hero.mp4',
          assetId: 'asset-1',
          createdAt: 0,
        },
        type: 'video',
        name: 'hero.mp4',
        metadata: {
          origin: 'ai',
        },
      })
    ).resolves.toSatisfy((resource) => {
      expect(resource).toMatchObject({
        id: 'asset-1',
        type: MediaResourceType.VIDEO,
        metadata: expect.objectContaining({
          assetId: 'asset-1',
          scopeDomain: 'magiccut',
        }),
      });
      expect(resource.resourceViewId).toBeUndefined();
      expect(resource.metadata?.resourceViewId).toBeUndefined();
      return true;
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
    expect(importAssetBySdk).not.toHaveBeenCalled();
  });

  it('reuses nested canonical identity from resource metadata instead of importing generated selections again', async () => {
    assetCenterService.findById.mockResolvedValue(null);
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-video-nested');

    await expect(
      resolveMagicCutGeneratedSelectionResource({
        selection: {
          url: 'https://tmp.example.com/generated-video-nested',
          resource: {
            url: 'https://cdn.example.com/generated-video-nested',
            metadata: {
              assetId: 'asset-10',
              assetUuid: 'asset-uuid-10',
              primaryResourceId: 'resource-db-10',
              primaryResourceUuid: 'resource-uuid-10',
              resourceViewId: 'resource-view-10',
              resourceViewUuid: 'resource-view-uuid-10',
            },
          },
          duration: 9,
        } as any,
        type: 'video',
        name: 'hero-video-nested.mp4',
        metadata: {
          origin: 'ai',
        },
      })
    ).resolves.toMatchObject({
      id: 'asset-10',
      uuid: 'resource-view-uuid-10',
      url: 'https://cdn.example.com/generated-video-nested',
      path: 'https://cdn.example.com/generated-video-nested',
      metadata: expect.objectContaining({
        assetId: 'asset-10',
        assetUuid: 'asset-uuid-10',
        primaryResourceId: 'resource-db-10',
        primaryResourceUuid: 'resource-uuid-10',
        resourceViewId: 'resource-view-10',
        resourceViewUuid: 'resource-view-uuid-10',
      }),
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
    expect(importAssetBySdk).not.toHaveBeenCalled();
  });

  it('imports URL-only selections through the asset sdk when no asset identity exists yet', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-imported-1',
      uuid: 'asset-imported-1',
      name: 'voice.wav',
      type: 'audio',
      path: 'https://storage.example.com/voice.wav',
      size: 4096,
      origin: 'ai',
      metadata: {
        model: 'tts-1',
      },
      createdAt: 1,
      updatedAt: 1,
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/voice.wav');

    await expect(
      resolveMagicCutGeneratedSelectionResource({
        selection: {
          key: 'remote-result-1',
          type: 'audio',
          taskId: 'task-1',
          resultIndex: 0,
          url: 'https://tmp.example.com/voice.wav',
          duration: 7,
          createdAt: 0,
        },
        type: 'audio',
        name: 'voice.wav',
        metadata: {
          origin: 'ai',
          duration: 7,
        },
      })
    ).resolves.toMatchObject({
      id: 'asset-imported-1',
      type: MediaResourceType.AUDIO,
      url: 'https://cdn.example.com/voice.wav',
      metadata: expect.objectContaining({
        assetId: 'asset-imported-1',
        duration: 7,
      }),
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://tmp.example.com/voice.wav',
      'audio',
      {
        name: 'voice.wav',
        domain: 'magiccut',
      }
    );
  });

  it('prefers canonical resource urls and uuids when rebuilding a selection-backed timeline resource', async () => {
    assetCenterService.findById.mockResolvedValue(null);
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-video');

    await expect(
      resolveMagicCutGeneratedSelectionResource({
        selection: {
          assetId: 'asset-9',
          assetUuid: 'asset-uuid-9',
          primaryResourceId: 'resource-db-9',
          primaryResourceUuid: 'resource-uuid-9',
          resourceViewId: 'resource-view-9',
          resourceViewUuid: 'resource-view-uuid-9',
          url: 'https://tmp.example.com/legacy-video',
          resource: {
            uuid: 'resource-uuid-9',
            url: 'https://cdn.example.com/generated-video',
          },
          duration: 5,
        },
        type: 'video',
        name: 'hero-video.mp4',
        metadata: {
          origin: 'ai',
        },
      })
    ).resolves.toMatchObject({
      id: 'asset-9',
      uuid: 'resource-view-uuid-9',
      url: 'https://cdn.example.com/generated-video',
      path: 'https://cdn.example.com/generated-video',
      metadata: expect.objectContaining({
        assetId: 'asset-9',
        assetUuid: 'asset-uuid-9',
        primaryResourceId: 'resource-db-9',
        primaryResourceUuid: 'resource-uuid-9',
        resourceViewId: 'resource-view-9',
        resourceViewUuid: 'resource-view-uuid-9',
      }),
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('preserves canonical generated selection paths while keeping delivery urls separate', async () => {
    assetCenterService.findById.mockResolvedValue(null);
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-video-path');

    await expect(
      resolveMagicCutGeneratedSelectionResource({
        selection: {
          assetId: 'asset-path-11',
          assetUuid: 'asset-uuid-path-11',
          resourceViewUuid: 'resource-view-uuid-path-11',
          url: 'https://tmp.example.com/legacy-generated-video-path',
          resource: {
            path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/video-path-11.mp4',
            url: 'https://cdn.example.com/generated-video-path',
            metadata: {
              assetId: 'asset-path-11',
              assetUuid: 'asset-uuid-path-11',
            },
          },
          duration: 6,
        } as any,
        type: 'video',
        name: 'hero-video-path.mp4',
        metadata: {
          origin: 'ai',
        },
      })
    ).resolves.toMatchObject({
      id: 'asset-path-11',
      uuid: 'resource-view-uuid-path-11',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/video-path-11.mp4',
      url: 'https://cdn.example.com/generated-video-path',
      metadata: expect.objectContaining({
        assetId: 'asset-path-11',
        assetUuid: 'asset-uuid-path-11',
      }),
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
    expect(importAssetBySdk).not.toHaveBeenCalled();
  });
});
