import { describe, expect, it } from 'vitest';

import {
  resolveAssetRecordClientUuid,
  resolveAssetRecordAssetUuid,
} from './assetIdentity';

describe('resolveAssetRecordClientUuid', () => {
  it('derives a stable client uuid from persisted asset id when canonical uuids are missing', () => {
    expect(
      resolveAssetRecordClientUuid({
        id: 'asset-db-1',
        metadata: {},
      })
    ).toBe('client-asset:asset-db-1');
  });

  it('does not reuse top-level uuid when it is just the persisted asset id echoed back', () => {
    expect(
      resolveAssetRecordClientUuid({
        id: 'asset-db-2',
        uuid: 'asset-db-2',
        metadata: {},
      })
    ).toBe('client-asset:asset-db-2');
  });
});

describe('resolveAssetRecordAssetUuid', () => {
  it('returns explicit canonical assetUuid from metadata', () => {
    expect(
      resolveAssetRecordAssetUuid({
        id: 'asset-db-3',
        uuid: 'client-runtime-uuid-3',
        metadata: {
          assetUuid: 'asset-uuid-3',
        },
      })
    ).toBe('asset-uuid-3');
  });

  it('does not fabricate assetUuid from runtime or client uuid when metadata omits it', () => {
    expect(
      resolveAssetRecordAssetUuid({
        id: 'asset-db-4',
        uuid: 'resource-view-uuid-4',
        metadata: {},
      })
    ).toBeUndefined();
  });
});
