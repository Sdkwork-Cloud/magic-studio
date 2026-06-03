import { describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-core/services', () => {
  class FakeLocalStorageService<T extends { id: string | null; uuid: string }> {
    protected cache: T[] | null = [];

    constructor(_storageKey: string, _legacyKeys: readonly string[] = []) {}

    protected async ensureInitialized(): Promise<void> {
      if (this.cache === null) {
        this.cache = [];
      }
    }

    async save(entity: Partial<T>): Promise<{ success: true; data: T }> {
      await this.ensureInitialized();
      const saved = entity as T;
      const nextCache = this.cache || [];
      const existingIndex = nextCache.findIndex(
        (item) => item.uuid === saved.uuid || (item.id !== null && item.id === saved.id)
      );
      if (existingIndex >= 0) {
        nextCache[existingIndex] = { ...nextCache[existingIndex], ...saved };
      } else {
        nextCache.unshift(saved);
      }
      this.cache = nextCache;
      return { success: true, data: saved };
    }

    async deleteById(id: string): Promise<{ success: true }> {
      await this.ensureInitialized();
      this.cache = (this.cache || []).filter(
        (item) => item.uuid !== id && item.id !== id
      );
      return { success: true };
    }
  }

  return {
    LocalStorageService: FakeLocalStorageService,
  };
});

import { driveMetadataService } from './driveMetadataService';

describe('driveMetadataService', () => {
  it('creates local metadata with a dedicated path field and uuid-first identity', async () => {
    await driveMetadataService.updateMeta('/workspace/demo.txt', { isStarred: true });

    const meta = await driveMetadataService.getMeta('/workspace/demo.txt');

    expect(meta).toMatchObject({
      id: null,
      uuid: 'drive-metadata:/workspace/demo.txt',
      path: '/workspace/demo.txt',
      isStarred: true,
    });
  });
});
