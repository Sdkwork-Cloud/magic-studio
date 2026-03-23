import { afterEach, describe, expect, it } from 'vitest';
import {
  localeStorageService,
  resetLocaleStorageServiceAdapter,
  setLocaleStorageServiceAdapter,
  type LocaleStorageServiceAdapter,
  type StorageLike,
} from './localeStorageService';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('localeStorageService', () => {
  afterEach(() => {
    resetLocaleStorageServiceAdapter();
  });

  it('reads and writes locale values through the configured adapter', () => {
    const storage = new MemoryStorage();
    const adapter: LocaleStorageServiceAdapter = {
      getStorage: () => storage,
      read: (key) => storage.getItem(key),
      write: (key, value) => storage.setItem(key, value),
      remove: (key) => storage.removeItem(key),
    };

    setLocaleStorageServiceAdapter(adapter);

    localeStorageService.write('sdkwork_locale', 'zh-CN');

    expect(localeStorageService.read('sdkwork_locale')).toBe('zh-CN');

    localeStorageService.remove('sdkwork_locale');

    expect(localeStorageService.read('sdkwork_locale')).toBeNull();
  });
});
