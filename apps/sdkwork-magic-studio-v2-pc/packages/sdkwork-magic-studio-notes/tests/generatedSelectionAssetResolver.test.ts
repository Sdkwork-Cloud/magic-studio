import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} = vi.hoisted(() => ({
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

import { resolveNotesGeneratedSelectionSource } from '../src/utils/generatedSelectionAssetResolver';

describe('resolveNotesGeneratedSelectionSource', () => {
  beforeEach(() => {
    importAssetFromUrlBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
  });

  it('prefers existing asset identity over re-importing generated urls', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-image.png');

    await expect(
      resolveNotesGeneratedSelectionSource({
        selection: {
          key: 'asset-1',
          type: 'image',
          taskId: 'task-1',
          resultIndex: 0,
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          primaryResourceId: 'primary-resource-1',
          primaryResourceUuid: 'primary-resource-uuid-1',
          resourceViewId: 'resource-view-1',
          resourceViewUuid: 'resource-view-uuid-1',
          url: 'https://tmp.example.com/image.png',
          createdAt: 0,
        },
        type: 'image',
        name: 'note-image.png',
      })
    ).resolves.toEqual({
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'primary-resource-1',
      primaryResourceUuid: 'primary-resource-uuid-1',
      resourceViewId: 'resource-view-1',
      resourceViewUuid: 'resource-view-uuid-1',
      url: 'https://cdn.example.com/final-image.png',
    });

    expect(importAssetFromUrlBySdk).not.toHaveBeenCalled();
  });

  it('imports url-only selections into the asset center before insertion without fabricating assetUuid', async () => {
    importAssetFromUrlBySdk.mockResolvedValue({
      id: 'asset-imported-1',
      uuid: 'asset-imported-uuid-1',
      path: 'https://storage.example.com/generated-video.mp4',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);

    await expect(
      resolveNotesGeneratedSelectionSource({
        selection: {
          key: 'tmp-result',
          type: 'video',
          taskId: 'task-2',
          resultIndex: 0,
          url: 'https://tmp.example.com/generated-video.mp4',
          createdAt: 0,
        },
        type: 'video',
        name: 'generated-video.mp4',
      })
    ).resolves.toEqual({
      assetId: 'asset-imported-1',
      assetUuid: null,
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: null,
      url: 'https://storage.example.com/generated-video.mp4',
    });

    expect(importAssetFromUrlBySdk).toHaveBeenCalledWith(
      'https://tmp.example.com/generated-video.mp4',
      'video',
      {
        name: 'generated-video.mp4',
        domain: 'notes',
      }
    );
  });

  it('does not fabricate assetUuid from persisted assetId when generated selection lacks it', async () => {
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/final-audio.wav');

    await expect(
      resolveNotesGeneratedSelectionSource({
        selection: {
          key: 'asset-2',
          type: 'audio',
          taskId: 'task-3',
          resultIndex: 0,
          assetId: 'asset-2',
          url: 'https://tmp.example.com/audio.wav',
          createdAt: 0,
        },
        type: 'audio',
        name: 'generated-audio.wav',
      })
    ).resolves.toMatchObject({
      assetId: 'asset-2',
      url: 'https://cdn.example.com/final-audio.wav',
    });

    const resolved = await resolveNotesGeneratedSelectionSource({
      selection: {
        key: 'asset-2',
        type: 'audio',
        taskId: 'task-3',
        resultIndex: 0,
        assetId: 'asset-2',
        url: 'https://tmp.example.com/audio.wav',
        createdAt: 0,
      },
      type: 'audio',
      name: 'generated-audio.wav',
    });

    expect(resolved.assetUuid).toBeNull();
  });
});
