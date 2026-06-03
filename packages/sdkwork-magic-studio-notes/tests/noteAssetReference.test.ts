import { describe, expect, it } from 'vitest';

import {
  createNoteImageAssetReferenceFromAsset,
  extractFirstHtmlImageAssetReference,
  toArticleCoverAssetFields,
  toMiniProgramImageAssetFields,
  toNoteImageChooseAssetValue,
} from '../src/utils/noteAssetReference';

describe('noteAssetReference', () => {
  it('creates semantic image asset references from selected assets', () => {
    const reference = createNoteImageAssetReferenceFromAsset(
      {
        id: 'asset-db-1',
        uuid: 'asset-client-1',
        path: 'assets://images/1',
        metadata: {
          assetId: 'asset-db-1',
          assetUuid: 'asset-uuid-1',
          primaryResourceId: 'resource-db-1',
          primaryResourceUuid: 'resource-uuid-1',
          resourceViewId: 'view-db-1',
          resourceViewUuid: 'view-uuid-1',
        },
      } as never,
      'https://cdn.example.com/cover.png'
    );

    expect(reference).toEqual({
      url: 'https://cdn.example.com/cover.png',
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-db-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-db-1',
      resourceViewUuid: 'view-uuid-1',
    });
  });

  it('extracts the first html image asset reference from editor content', () => {
    const reference = extractFirstHtmlImageAssetReference(
      '<p>hello</p><img src="https://cdn.example.com/image.png" data-asset-id="asset-db-2" data-asset-uuid="asset-uuid-2" data-primary-resource-id="resource-db-2" data-primary-resource-uuid="resource-uuid-2" data-resource-view-id="view-db-2" data-resource-view-uuid="view-uuid-2" />'
    );

    expect(reference).toEqual({
      url: 'https://cdn.example.com/image.png',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      primaryResourceId: 'resource-db-2',
      primaryResourceUuid: 'resource-uuid-2',
      resourceViewId: 'view-db-2',
      resourceViewUuid: 'view-uuid-2',
    });
  });

  it('maps image references to article cover asset fields', () => {
    expect(
      toArticleCoverAssetFields({
        url: 'https://cdn.example.com/article-cover.png',
        assetId: 'asset-db-3',
        assetUuid: 'asset-uuid-3',
        primaryResourceId: 'resource-db-3',
        primaryResourceUuid: 'resource-uuid-3',
        resourceViewId: 'view-db-3',
        resourceViewUuid: 'view-uuid-3',
      })
    ).toEqual({
      coverImage: 'https://cdn.example.com/article-cover.png',
      coverAssetId: 'asset-db-3',
      coverAssetUuid: 'asset-uuid-3',
      coverPrimaryResourceId: 'resource-db-3',
      coverPrimaryResourceUuid: 'resource-uuid-3',
      coverResourceViewId: 'view-db-3',
      coverResourceViewUuid: 'view-uuid-3',
    });
  });

  it('maps image references to mini program image asset fields', () => {
    expect(
      toMiniProgramImageAssetFields({
        url: 'https://cdn.example.com/card-cover.png',
        assetId: 'asset-db-4',
        assetUuid: 'asset-uuid-4',
        primaryResourceId: 'resource-db-4',
        primaryResourceUuid: 'resource-uuid-4',
        resourceViewId: 'view-db-4',
        resourceViewUuid: 'view-uuid-4',
      })
    ).toEqual({
      image: 'https://cdn.example.com/card-cover.png',
      imageAssetId: 'asset-db-4',
      imageAssetUuid: 'asset-uuid-4',
      imagePrimaryResourceId: 'resource-db-4',
      imagePrimaryResourceUuid: 'resource-uuid-4',
      imageResourceViewId: 'view-db-4',
      imageResourceViewUuid: 'view-uuid-4',
    });
  });

  it('creates choose-asset preview values that preserve semantic asset metadata', () => {
    const value = toNoteImageChooseAssetValue(
      {
        url: 'https://cdn.example.com/library-cover.png',
        assetId: 'asset-db-5',
        assetUuid: 'asset-uuid-5',
        primaryResourceId: 'resource-db-5',
        primaryResourceUuid: 'resource-uuid-5',
        resourceViewId: 'view-db-5',
        resourceViewUuid: 'view-uuid-5',
      },
      'Selected Cover'
    );

    expect(value).toMatchObject({
      id: 'asset-db-5',
      uuid: 'asset-uuid-5',
      name: 'Selected Cover',
      path: 'https://cdn.example.com/library-cover.png',
      metadata: {
        assetId: 'asset-db-5',
        assetUuid: 'asset-uuid-5',
        primaryResourceId: 'resource-db-5',
        primaryResourceUuid: 'resource-uuid-5',
        resourceViewId: 'view-db-5',
        resourceViewUuid: 'view-uuid-5',
      },
    });
  });
});
