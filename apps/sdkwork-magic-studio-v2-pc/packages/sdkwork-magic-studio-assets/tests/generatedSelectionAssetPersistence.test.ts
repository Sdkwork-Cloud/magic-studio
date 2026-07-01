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

const { tryExtractInlineData } = vi.hoisted(() => ({
  tryExtractInlineData: vi.fn(),
}));

vi.mock('../src/services/assetSdkQueryService', () => ({
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  inlineDataService: {
    tryExtractInlineData,
  },
}));

import { persistGeneratedSelectionAsset } from '../src/services/generatedSelectionAssetPersistence';

describe('persistGeneratedSelectionAsset', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    tryExtractInlineData.mockReset();
  });

  it('reuses the canonical asset id already carried by the selection', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-image.png');

    await expect(
      persistGeneratedSelectionAsset({
        selection: {
          id: 'artifact-db-1',
          uuid: 'artifact-uuid-1',
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          primaryResourceId: 'resource-db-1',
          primaryResourceUuid: 'resource-uuid-1',
          resourceViewId: 'resource-view-1',
          resourceViewUuid: 'resource-view-uuid-1',
          url: 'https://tmp.example.com/generated-image.png',
        },
        type: 'image',
        domain: 'image-studio',
        name: 'generated-image.png',
      })
    ).resolves.toMatchObject({
      artifactId: 'artifact-db-1',
      artifactUuid: 'artifact-uuid-1',
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-db-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'resource-view-1',
      resourceViewUuid: 'resource-view-uuid-1',
      url: 'https://cdn.example.com/generated-image.png',
      sourceUrl: 'https://tmp.example.com/generated-image.png',
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('reuses nested canonical identity from resource metadata when top-level ids are absent', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-image-nested.png');

    await expect(
      persistGeneratedSelectionAsset({
        selection: {
          id: 'artifact-db-nested-1',
          uuid: 'artifact-uuid-nested-1',
          url: 'https://tmp.example.com/legacy-generated-image.png',
          resource: {
            url: 'https://tmp.example.com/generated-image-resource.png',
            metadata: {
              assetId: 'asset-nested-1',
              assetUuid: 'asset-uuid-nested-1',
              primaryResourceId: 'resource-db-nested-1',
              primaryResourceUuid: 'resource-uuid-nested-1',
              resourceViewId: 'resource-view-nested-1',
              resourceViewUuid: 'resource-view-uuid-nested-1',
            },
          },
        } as any,
        type: 'image',
        domain: 'image-studio',
        name: 'generated-nested-image.png',
      })
    ).resolves.toMatchObject({
      artifactId: 'artifact-db-nested-1',
      artifactUuid: 'artifact-uuid-nested-1',
      assetId: 'asset-nested-1',
      assetUuid: 'asset-uuid-nested-1',
      primaryResourceId: 'resource-db-nested-1',
      primaryResourceUuid: 'resource-uuid-nested-1',
      resourceViewId: 'resource-view-nested-1',
      resourceViewUuid: 'resource-view-uuid-nested-1',
      url: 'https://cdn.example.com/generated-image-nested.png',
      sourceUrl: 'https://tmp.example.com/generated-image-resource.png',
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
    expect(importAssetBySdk).not.toHaveBeenCalled();
  });

  it('imports the selection delivery url when no canonical asset exists yet', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-2',
      uuid: 'asset-uuid-2',
      path: 'https://storage.example.com/generated-image.png',
      metadata: {
        assetUuid: 'asset-uuid-2',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      persistGeneratedSelectionAsset({
        selection: {
          id: null,
          uuid: 'artifact-uuid-2',
          url: 'https://tmp.example.com/generated-image.png',
        },
        type: 'image',
        domain: 'image-studio',
        name: 'generated-image.png',
      })
    ).resolves.toMatchObject({
      artifactId: null,
      artifactUuid: 'artifact-uuid-2',
      assetId: 'asset-2',
      assetUuid: 'asset-uuid-2',
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: null,
      url: 'https://storage.example.com/generated-image.png',
      sourceUrl: 'https://tmp.example.com/generated-image.png',
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://tmp.example.com/generated-image.png',
      'image',
      {
        name: 'generated-image.png',
        domain: 'image-studio',
      }
    );
  });

  it('prefers canonical resource delivery urls over flat result urls when importing', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-3',
      uuid: 'asset-uuid-3',
      path: 'https://storage.example.com/generated-video',
      metadata: {
        assetUuid: 'asset-uuid-3',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      persistGeneratedSelectionAsset({
        selection: {
          id: null,
          uuid: 'artifact-uuid-3',
          url: 'https://tmp.example.com/legacy-video',
          resource: {
            uuid: 'resource-uuid-3',
            url: 'https://cdn.example.com/generated-video',
          },
        },
        type: 'video',
        domain: 'video-studio',
        name: 'generated-video.mp4',
      })
    ).resolves.toMatchObject({
      assetId: 'asset-3',
      sourceUrl: 'https://cdn.example.com/generated-video',
      url: 'https://storage.example.com/generated-video',
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://cdn.example.com/generated-video',
      'video',
      {
        name: 'generated-video.mp4',
        domain: 'video-studio',
      }
    );
  });

  it('preserves canonical selection paths for existing asset-backed results while keeping delivery urls separate', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/generated-image-path.png');

    await expect(
      persistGeneratedSelectionAsset({
        selection: {
          id: 'artifact-db-path-1',
          uuid: 'artifact-uuid-path-1',
          assetId: 'asset-path-1',
          assetUuid: 'asset-uuid-path-1',
          url: 'https://tmp.example.com/generated-image-path.png',
          resource: {
            path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/image-path-1.png',
            url: 'https://cdn.example.com/generated-image-path.png',
            metadata: {
              assetId: 'asset-path-1',
              assetUuid: 'asset-uuid-path-1',
            },
          },
        } as any,
        type: 'image',
        domain: 'image-studio',
        name: 'generated-image-path.png',
      })
    ).resolves.toMatchObject({
      artifactId: 'artifact-db-path-1',
      artifactUuid: 'artifact-uuid-path-1',
      assetId: 'asset-path-1',
      assetUuid: 'asset-uuid-path-1',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/image-path-1.png',
      url: 'https://cdn.example.com/generated-image-path.png',
      sourceUrl: 'https://cdn.example.com/generated-image-path.png',
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
    expect(importAssetBySdk).not.toHaveBeenCalled();
  });

  it('does not fabricate assetUuid from uploaded assetId when the upload response omits uuid', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-4',
      path: 'https://storage.example.com/generated-audio.wav',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    const persisted = await persistGeneratedSelectionAsset({
      selection: {
        id: null,
        uuid: 'artifact-uuid-4',
        url: 'https://tmp.example.com/generated-audio.wav',
      },
      type: 'audio',
      domain: 'audio-studio',
      name: 'generated-audio.wav',
    });

    expect(persisted).toMatchObject({
      artifactId: null,
      artifactUuid: 'artifact-uuid-4',
      assetId: 'asset-4',
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: null,
      url: 'https://storage.example.com/generated-audio.wav',
      sourceUrl: 'https://tmp.example.com/generated-audio.wav',
    });
    expect(persisted.assetUuid).toBeNull();
  });

  it('does not fabricate assetUuid from uploaded client uuid when the upload response omits canonical assetUuid', async () => {
    tryExtractInlineData.mockResolvedValue(null);
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-5',
      uuid: 'resource-view-uuid-5',
      path: 'https://storage.example.com/generated-audio-2.wav',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    const persisted = await persistGeneratedSelectionAsset({
      selection: {
        id: null,
        uuid: 'artifact-uuid-5',
        url: 'https://tmp.example.com/generated-audio-2.wav',
      },
      type: 'audio',
      domain: 'audio-studio',
      name: 'generated-audio-2.wav',
    });

    expect(persisted).toMatchObject({
      artifactId: null,
      artifactUuid: 'artifact-uuid-5',
      assetId: 'asset-5',
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: null,
      url: 'https://storage.example.com/generated-audio-2.wav',
      sourceUrl: 'https://tmp.example.com/generated-audio-2.wav',
    });
    expect(persisted.assetUuid).toBeNull();
  });
});
