import { describe, expect, it } from 'vitest';

import { decideMagicCutImportRoute } from '../src/domain/assets/magicCutAssetState';

describe('decideMagicCutImportRoute', () => {
  it('prefers managed local asset import on desktop when material storage is local-first-sync', () => {
    const result = decideMagicCutImportRoute({
      runtime: 'desktop',
      storageMode: 'local-first-sync',
      filePath: '/incoming/a.mp4',
      hasBinaryData: true,
    });

    expect(result.kind).toBe('managed-local');
    expect(result.shouldQueueSync).toBe(true);
  });

  it('keeps assets local in local-only mode', () => {
    const result = decideMagicCutImportRoute({
      runtime: 'desktop',
      storageMode: 'local-only',
      hasBinaryData: true,
    });

    expect(result.kind).toBe('managed-local');
    expect(result.shouldQueueSync).toBe(false);
  });

  it('respects server-only mode even on desktop', () => {
    const result = decideMagicCutImportRoute({
      runtime: 'desktop',
      storageMode: 'server-only',
      filePath: '/incoming/a.mp4',
      hasBinaryData: true,
    });

    expect(result.kind).toBe('server-upload');
  });
});
