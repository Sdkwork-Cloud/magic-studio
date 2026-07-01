import { describe, expect, it } from 'vitest';

import { createNoteUploadedAssetAttrs } from '../src/utils/noteUploadedAssetAttrs';

describe('createNoteUploadedAssetAttrs', () => {
  it('does not fabricate assetUuid from upload runtime uuid when metadata is missing', () => {
    expect(
      createNoteUploadedAssetAttrs(
        {
          id: 'asset-db-1',
          uuid: 'upload-runtime-uuid-1',
          metadata: {},
        },
        'https://storage.example.com/reference.png'
      )
    ).toEqual({
      src: 'https://storage.example.com/reference.png',
      assetId: 'asset-db-1',
      assetUuid: null,
    });
  });

  it('preserves explicit assetUuid metadata when the upload response provides it', () => {
    expect(
      createNoteUploadedAssetAttrs(
        {
          id: 'asset-db-2',
          uuid: 'upload-runtime-uuid-2',
          metadata: {
            assetUuid: 'asset-uuid-2',
          },
        },
        'https://storage.example.com/reference-2.png'
      )
    ).toEqual({
      src: 'https://storage.example.com/reference-2.png',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
    });
  });
});
