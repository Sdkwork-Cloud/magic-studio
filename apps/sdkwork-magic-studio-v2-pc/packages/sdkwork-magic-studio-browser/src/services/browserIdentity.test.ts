import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-core', () => {
  class FakeLocalStorageService<T extends { id: string | null; uuid: string }> {
    protected cache: T[] | null = [];

    constructor(_storageKey: string, _legacyKeys: readonly string[] = []) {}

    protected async ensureInitialized(): Promise<void> {
      if (this.cache === null) {
        this.cache = [];
      }
    }

    async findAll(): Promise<{ success: true; data: { content: T[] } }> {
      await this.ensureInitialized();
      return { success: true, data: { content: [...(this.cache || [])] } };
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

    async clear(): Promise<{ success: true }> {
      this.cache = [];
      return { success: true };
    }
  }

  return {
    LocalStorageService: FakeLocalStorageService,
  };
});

import { browserBookmarkService } from './browserBookmarkService';
import { browserHistoryService } from './browserHistoryService';

describe('browser identity services', () => {
  beforeEach(async () => {
    await browserHistoryService.clearHistory();
  });

  it('creates history entries with uuid-first local identity', async () => {
    const saveSpy = vi.spyOn(browserHistoryService, 'save');

    await browserHistoryService.addHistoryItem('https://example.com/history', 'History');

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: null,
        uuid: expect.any(String),
      })
    );
    const savedEntity = saveSpy.mock.calls[0]?.[0] as { id: string | null; uuid: string };
    expect(savedEntity.uuid).toEqual(expect.any(String));
  });

  it('creates bookmarks with uuid-first local identity and removes by entity key', async () => {
    const saveSpy = vi.spyOn(browserBookmarkService, 'save');

    const created = await browserBookmarkService.toggleBookmark(
      'https://example.com/bookmark',
      'Bookmark'
    );

    expect(created).toBe(true);
    const savedEntity = saveSpy.mock.calls[0]?.[0] as { id: string | null; uuid: string };
    expect(savedEntity).toMatchObject({
      id: null,
      uuid: expect.any(String),
    });

    const removed = await browserBookmarkService.toggleBookmark(
      'https://example.com/bookmark',
      'Bookmark'
    );

    expect(removed).toBe(false);
  });
});
