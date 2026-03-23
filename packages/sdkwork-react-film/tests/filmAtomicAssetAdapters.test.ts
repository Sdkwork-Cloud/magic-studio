import { describe, expect, it } from 'vitest';

import { MediaResourceType, MediaScene, type AssetAtomicMediaResource } from '@sdkwork/react-types';

import { applyImportedAssetToShotSlot } from '../src/utils/filmShotAssetBinding';

describe('applyImportedAssetToShotSlot', () => {
  it('keeps the slot identity while binding the imported asset id and resolved media details', () => {
    const current: AssetAtomicMediaResource = {
      id: 'slot-1',
      uuid: 'slot-1',
      url: '',
      name: 'placeholder',
      type: MediaResourceType.IMAGE,
      scene: MediaScene.END_FRAME,
      primary: 'image',
      metadata: {
        source: 'existing-slot',
      },
      createdAt: 1,
      updatedAt: 1,
    };

    const result = applyImportedAssetToShotSlot(
      current,
      {
        assetId: 'asset-7',
        url: 'https://cdn.example.com/cover.png',
      },
      {
        name: 'cover.png',
        type: MediaResourceType.VIDEO,
        metadata: {
          origin: 'upload',
        },
      }
    );

    expect(result.id).toBe('slot-1');
    expect(result.uuid).toBe('slot-1');
    expect(result.scene).toBe(MediaScene.END_FRAME);
    expect(result.url).toBe('https://cdn.example.com/cover.png');
    expect(result.name).toBe('cover.png');
    expect(result.type).toBe(MediaResourceType.VIDEO);
    expect(result.primary).toBe('video');
    expect(result.metadata).toMatchObject({
      source: 'existing-slot',
      origin: 'upload',
      assetId: 'asset-7',
    });
  });
});
