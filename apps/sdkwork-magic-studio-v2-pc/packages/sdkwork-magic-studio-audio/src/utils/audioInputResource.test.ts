import { describe, expect, it } from 'vitest';

import { toAudioInputResourceRefFromAsset } from './audioInputResource';

describe('toAudioInputResourceRefFromAsset', () => {
  it('preserves stable asset locators as canonical input paths while keeping delivery urls separate', () => {
    const ref = toAudioInputResourceRefFromAsset(
      {
        id: 'asset-db-1',
        uuid: 'resource-uuid-1',
        name: 'Source Audio',
        type: 'audio',
        path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/source.wav',
        size: 0,
        origin: 'upload',
        createdAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T00:00:00.000Z',
        metadata: {
          primaryResourceId: 'primary-resource-1',
          primaryResourceUuid: 'primary-resource-uuid-1',
        },
      } as any,
      'audio',
      'https://cdn.example.com/source.wav'
    );

    expect(ref).toMatchObject({
      id: null,
      uuid: 'primary-resource-uuid-1',
      assetId: 'asset-db-1',
      primaryResourceId: 'primary-resource-1',
      primaryResourceUuid: 'primary-resource-uuid-1',
      path: 'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/source.wav',
      url: 'https://cdn.example.com/source.wav',
      metadata: {
        canonicalPath:
          'assets://workspaces/workspace-1/projects/project-1/media/originals/audio/source.wav',
        deliveryUrl: 'https://cdn.example.com/source.wav',
      },
    });
  });
});
