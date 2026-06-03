import { createImportData } from '@sdkwork/magic-studio-assets/generation';
import { describe, expect, it } from 'vitest';

import { mapImportDataToCharacterTask } from './importCharacterTask';

describe('mapImportDataToCharacterTask', () => {
  it('maps imported generation data into a completed character task', () => {
    const importData = createImportData({
      uuid: 'import-character-uuid-1',
      type: 'character',
      createdAt: 1712300000000,
      prompt: 'A cyberpunk navigator',
      model: 'gemini-2.5-flash-image',
      aspectRatio: '9:16',
      resource: {
        id: 'resource-id-1',
        uuid: 'resource-uuid-1',
        assetId: 'asset-id-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'primary-resource-id-1',
        primaryResourceUuid: 'primary-resource-uuid-1',
        resourceViewId: 'resource-view-id-1',
        resourceViewUuid: 'resource-view-uuid-1',
        type: 'image',
        url: 'https://example.com/character-import.png',
        name: 'character-import.png',
        mimeType: 'image/png',
        metadata: {
          sourcePath: 'assets://workspaces/ws-1/projects/proj-1/media/character-import.png',
        },
      },
    });

    const task = mapImportDataToCharacterTask(importData);

    expect(task).toMatchObject({
      id: 'import-character-uuid-1',
      uuid: 'import-character-uuid-1',
      status: 'completed',
      config: {
        prompt: 'A cyberpunk navigator',
        description: 'A cyberpunk navigator',
        model: 'gemini-2.5-flash-image',
        aspectRatio: '9:16',
        mediaType: 'character',
        avatar: {
          assetId: 'asset-id-1',
          assetUuid: 'asset-uuid-1',
          primaryResourceId: 'primary-resource-id-1',
          primaryResourceUuid: 'primary-resource-uuid-1',
          resourceViewId: 'resource-view-id-1',
          resourceViewUuid: 'resource-view-uuid-1',
          path: 'assets://workspaces/ws-1/projects/proj-1/media/character-import.png',
          url: 'https://example.com/character-import.png',
          type: 'image',
        },
      },
    });
    expect(task.results?.[0]).toMatchObject({
      id: 'resource-id-1',
      uuid: 'resource-uuid-1',
      avatarUrl: 'https://example.com/character-import.png',
      url: 'https://example.com/character-import.png',
      resource: {
        assetId: 'asset-id-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'primary-resource-id-1',
        resourceViewId: 'resource-view-id-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/character-import.png',
        url: 'https://example.com/character-import.png',
      },
    });
  });
});
