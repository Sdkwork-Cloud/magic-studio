import { describe, expect, it } from 'vitest';

import { getProtectedAssetDeleteMessage } from '../src/domain/assets/assetDeleteGuard';

describe('assetDeleteGuard', () => {
  it('blocks deleting system-curated assets with a user-facing explanation', () => {
    expect(getProtectedAssetDeleteMessage('system')).toBe('System assets are read-only and cannot be deleted.');
    expect(getProtectedAssetDeleteMessage('stock')).toBe('Stock assets are read-only and cannot be deleted.');
  });

  it('allows deleting user-managed assets', () => {
    expect(getProtectedAssetDeleteMessage('upload')).toBeNull();
    expect(getProtectedAssetDeleteMessage('ai')).toBeNull();
    expect(getProtectedAssetDeleteMessage(undefined)).toBeNull();
  });
});
