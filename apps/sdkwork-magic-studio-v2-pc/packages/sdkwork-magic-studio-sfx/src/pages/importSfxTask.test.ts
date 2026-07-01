import { describe, expect, it } from 'vitest';

import { mapImportDataToSfxTask } from './importSfxTask';

describe('mapImportDataToSfxTask', () => {
  it('maps imported audio generation data into a completed sfx task', () => {
    const task = mapImportDataToSfxTask({
      id: null,
      uuid: 'import-sfx-uuid-1',
      type: 'audio',
      createdAt: 1712300000000,
      prompt: 'Short synthetic impact',
      model: 'external-sfx-source',
      duration: 4,
      resource: {
        id: 'sfx-resource-id-1',
        uuid: 'sfx-resource-uuid-1',
        assetId: 'sfx-asset-id-1',
        assetUuid: 'sfx-asset-uuid-1',
        primaryResourceId: 'sfx-primary-resource-id-1',
        primaryResourceUuid: 'sfx-primary-resource-uuid-1',
        resourceViewId: 'sfx-resource-view-id-1',
        resourceViewUuid: 'sfx-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/imported-sfx.mp3',
        name: 'imported-sfx.mp3',
        mimeType: 'audio/mpeg',
        metadata: {
          sourcePath: 'assets://workspace/generated/imported-sfx.mp3',
        },
      },
    });

    expect(task).toMatchObject({
      id: null,
      uuid: 'import-sfx-uuid-1',
      status: 'completed',
      config: {
        prompt: 'Short synthetic impact',
        model: 'eleven-labs-sfx',
        duration: 4,
        mediaType: 'audio',
      },
      results: [
        expect.objectContaining({
          assetId: 'sfx-asset-id-1',
          resource: expect.objectContaining({
            path: 'assets://workspace/generated/imported-sfx.mp3',
            url: 'https://example.com/imported-sfx.mp3',
          }),
          duration: 4,
        }),
      ],
    });
  });
});
