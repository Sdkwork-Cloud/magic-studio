import { describe, expect, it } from 'vitest';

import {
  toCharacterAvatarAssetFields,
  toCharacterAvatarChooseAssetValue,
} from '../src/utils/characterAvatarAsset';

describe('characterAvatarAsset', () => {
  it('preserves semantic asset identity when selecting an avatar asset', () => {
    const fields = toCharacterAvatarAssetFields({
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      type: 'image',
      name: 'Avatar',
      path: 'https://cdn.example.com/avatar.png',
      size: 0,
      origin: 'upload',
      isFavorite: false,
      metadata: {
        primaryResourceId: 'primary-resource-db-1',
        primaryResourceUuid: 'primary-resource-uuid-1',
        resourceViewId: 'resource-view-db-1',
        resourceViewUuid: 'resource-view-uuid-1',
      },
    });

    expect(fields).toEqual({
      avatar: expect.objectContaining({
        assetId: 'asset-db-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'primary-resource-db-1',
        primaryResourceUuid: 'primary-resource-uuid-1',
        resourceViewId: 'resource-view-db-1',
        resourceViewUuid: 'resource-view-uuid-1',
        path: 'https://cdn.example.com/avatar.png',
        url: 'https://cdn.example.com/avatar.png',
        type: 'image',
      }),
    });
  });

  it('reconstructs choose-asset value from stored avatar asset semantics', () => {
    const value = toCharacterAvatarChooseAssetValue({
      avatar: {
        assetId: 'asset-db-2',
        assetUuid: 'asset-uuid-2',
        primaryResourceId: 'primary-resource-db-2',
        primaryResourceUuid: 'primary-resource-uuid-2',
        resourceViewId: 'resource-view-db-2',
        resourceViewUuid: 'resource-view-uuid-2',
        path: 'https://cdn.example.com/avatar.png',
        url: 'https://cdn.example.com/avatar.png',
        type: 'image',
      },
    });

    expect(value).toEqual({
      id: 'asset-db-2',
      uuid: 'asset-uuid-2',
      createdAt: 0,
      updatedAt: 0,
      type: 'image',
      name: 'asset-db-2',
      path: 'https://cdn.example.com/avatar.png',
      size: 0,
      origin: 'upload',
      isFavorite: false,
      metadata: {
        assetId: 'asset-db-2',
        assetUuid: 'asset-uuid-2',
        primaryResourceId: 'primary-resource-db-2',
        primaryResourceUuid: 'primary-resource-uuid-2',
        resourceViewId: 'resource-view-db-2',
        resourceViewUuid: 'resource-view-uuid-2',
      },
    });
  });

  it('falls back to the canonical avatar reference only when no asset identity exists', () => {
    expect(
      toCharacterAvatarChooseAssetValue({
        avatar: {
          path: 'assets://workspace/character/avatar-only.png',
          type: 'image',
        },
      })
    ).toBe('assets://workspace/character/avatar-only.png');
  });
});
