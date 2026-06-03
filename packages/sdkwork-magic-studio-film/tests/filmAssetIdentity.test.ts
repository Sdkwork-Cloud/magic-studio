import { describe, expect, it } from 'vitest';

import { resolveFilmAssetKey } from '../src/utils/filmAssetIdentity';

describe('filmAssetIdentity', () => {
  it('uses uuid-first keys with id fallback for film asset collections', () => {
    expect(
      resolveFilmAssetKey({
        id: 'asset-db-1',
        uuid: 'asset-uuid-1',
      } as any)
    ).toBe('asset-uuid-1');

    expect(
      resolveFilmAssetKey({
        id: 'asset-db-2',
        uuid: '',
      } as any)
    ).toBe('asset-db-2');
  });
});
