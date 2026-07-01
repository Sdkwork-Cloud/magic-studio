import { describe, expect, it } from 'vitest';

import { resolveAssetSelectionKey } from '../src/components/assetSelectionIdentity';
import { createDocumentSelectionAsset } from '../src/components/documentSelectionAsset';

describe('createDocumentSelectionAsset', () => {
  it('creates a transient asset with uuid identity and no fabricated persisted id', () => {
    const sourceUrl = 'https://cdn.example.com/extracted-cover.png';
    const asset = createDocumentSelectionAsset(sourceUrl);

    expect(asset.path).toBe(sourceUrl);
    expect(asset.id).toBe('');
    expect(asset.uuid).toEqual(expect.any(String));
    expect(asset.uuid).not.toBe(sourceUrl);
    expect(asset.uuid).not.toBe('');
    expect(resolveAssetSelectionKey(asset)).toBe(asset.uuid);
    expect(asset.metadata).toMatchObject({
      sourceUrl,
      transientSource: 'document-extracted-image',
    });
  });
});
