import { createImportData } from '@sdkwork/magic-studio-assets/generation';
import { describe, expect, it } from 'vitest';

import { mapImportDataToMusicTask } from './importMusicTask';

describe('mapImportDataToMusicTask', () => {
  it('maps imported generation data into a completed music task', () => {
    const importData = createImportData({
      uuid: 'import-music-uuid-1',
      type: 'music',
      createdAt: 1712300000000,
      prompt: 'Dreamy synthwave track',
      model: 'External Source',
      duration: 142,
      title: 'Midnight Drive',
      lyrics: 'We ride through neon skies',
      style: 'synthwave',
      isInstrumental: false,
      resource: {
        id: 'music-resource-id-1',
        uuid: 'music-resource-uuid-1',
        assetId: 'music-asset-id-1',
        assetUuid: 'music-asset-uuid-1',
        primaryResourceId: 'music-primary-resource-id-1',
        primaryResourceUuid: 'music-primary-resource-uuid-1',
        resourceViewId: 'music-resource-view-id-1',
        resourceViewUuid: 'music-resource-view-uuid-1',
        type: 'music',
        url: 'https://example.com/music-import.mp3',
        name: 'music-import.mp3',
        mimeType: 'audio/mpeg',
        metadata: {
          sourcePath: 'assets://workspaces/ws-1/projects/proj-1/media/music-import.mp3',
        },
      },
      coverResource: {
        id: 'music-cover-id-1',
        uuid: 'music-cover-uuid-1',
        assetId: 'music-cover-asset-id-1',
        assetUuid: 'music-cover-asset-uuid-1',
        primaryResourceId: 'music-cover-primary-resource-id-1',
        primaryResourceUuid: 'music-cover-primary-resource-uuid-1',
        resourceViewId: 'music-cover-resource-view-id-1',
        resourceViewUuid: 'music-cover-resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/music-cover.png',
        name: 'music-cover.png',
        mimeType: 'image/png',
        metadata: {
          canonicalPath: 'file:///workspace/generated/music-cover.png',
        },
      },
    });

    const task = mapImportDataToMusicTask(importData);

    expect(task).toMatchObject({
      id: null,
      uuid: 'import-music-uuid-1',
      status: 'completed',
      config: {
        mode: 'generate',
        customMode: true,
        prompt: 'Dreamy synthwave track',
        lyrics: 'We ride through neon skies',
        style: 'synthwave',
        title: 'Midnight Drive',
        instrumental: false,
        model: 'suno-v3',
        duration: 142,
        mediaType: 'music',
      },
    });
    expect(task.results?.[0]).toMatchObject({
      uuid: 'music-resource-uuid-1',
      title: 'Midnight Drive',
      duration: 142,
      lyrics: 'We ride through neon skies',
      style: 'synthwave',
      resource: {
        assetId: 'music-asset-id-1',
        assetUuid: 'music-asset-uuid-1',
        primaryResourceId: 'music-primary-resource-id-1',
        resourceViewId: 'music-resource-view-id-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/music-import.mp3',
        url: 'https://example.com/music-import.mp3',
      },
      coverResource: {
        assetId: 'music-cover-asset-id-1',
        assetUuid: 'music-cover-asset-uuid-1',
        path: 'file:///workspace/generated/music-cover.png',
        url: 'https://example.com/music-cover.png',
      },
    });
  });
});
