import { describe, expect, it } from 'vitest';

import {
  assetMatchesSelectionKey,
  resolveAssetSelectionKey,
  toggleSelectedAssets,
} from '../src/components/assetSelectionIdentity';

describe('assetSelectionIdentity', () => {
  it('uses uuid-first selection keys with id fallback', () => {
    expect(resolveAssetSelectionKey({ id: 'asset-db-1', uuid: 'asset-uuid-1' } as any)).toBe('asset-uuid-1');
    expect(resolveAssetSelectionKey({ id: 'asset-db-2', uuid: '' } as any)).toBe('asset-db-2');
  });

  it('treats assets with the same uuid as the same selected item even when ids differ', () => {
    const selected = toggleSelectedAssets(
      [
        {
          id: 'asset-db-1',
          uuid: 'asset-uuid-1',
        } as any,
      ],
      {
        id: 'asset-db-2',
        uuid: 'asset-uuid-1',
      } as any
    );

    expect(selected).toEqual([]);
  });

  it('matches rendered selection state by uuid first and id fallback', () => {
    expect(
      assetMatchesSelectionKey(
        {
          id: 'asset-db-3',
          uuid: 'asset-uuid-3',
        } as any,
        'asset-uuid-3'
      )
    ).toBe(true);

    expect(
      assetMatchesSelectionKey(
        {
          id: 'asset-db-4',
          uuid: '',
        } as any,
        'asset-db-4'
      )
    ).toBe(true);
  });
});
