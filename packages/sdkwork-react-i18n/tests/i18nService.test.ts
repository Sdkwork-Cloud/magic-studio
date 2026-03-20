import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerPackageI18n } from '../src';
import { packageI18nRegistry } from '../src/registryInstance';
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  getRequestedLocaleFromSearch,
  i18nService,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  readStoredLocale,
  resolveLocale,
} from '../src/I18nService';
import type { PackageI18nConfig } from '../src/packageTypes';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.has(key) ? this.values.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

const localStorageMock = new MemoryStorage();
const originalDocument = globalThis.document;
const originalLocalStorage = globalThis.localStorage;
const originalNavigator = globalThis.navigator;

describe('i18nService locale handling', () => {
  afterEach(() => {
    localStorageMock.clear();
    vi.unstubAllGlobals();

    if (originalDocument) {
      vi.stubGlobal('document', originalDocument);
    }

    if (originalLocalStorage) {
      vi.stubGlobal('localStorage', originalLocalStorage);
    }

    if (originalNavigator) {
      vi.stubGlobal('navigator', originalNavigator);
    }

    packageI18nRegistry.unregister('demo');
    i18nService.setLocale(DEFAULT_LOCALE, { persist: false });
  });

  it('normalizes locale aliases to the supported runtime locales', () => {
    expect(normalizeLocale('en')).toBe('en-US');
    expect(normalizeLocale('en-GB')).toBe('en-US');
    expect(normalizeLocale('zh')).toBe('zh-CN');
    expect(normalizeLocale('zh-TW')).toBe('zh-CN');
    expect(normalizeLocale('ja', FALLBACK_LOCALE)).toBe(FALLBACK_LOCALE);
  });

  it('extracts a requested locale override from the URL search string', () => {
    expect(getRequestedLocaleFromSearch('?locale=zh-CN')).toBe('zh-CN');
    expect(getRequestedLocaleFromSearch('?foo=bar')).toBeNull();
    expect(getRequestedLocaleFromSearch('')).toBeNull();
  });

  it('prefers requested locale over stored locale and browser language', () => {
    expect(resolveLocale({
      requestedLocale: 'zh',
      storedLocale: 'en-US',
      browserLanguages: ['en-US'],
      defaultLocale: DEFAULT_LOCALE,
    })).toBe('zh-CN');
  });

  it('uses the stored locale when there is no requested override', () => {
    expect(resolveLocale({
      storedLocale: 'zh-CN',
      browserLanguages: ['en-US'],
      defaultLocale: DEFAULT_LOCALE,
    })).toBe('zh-CN');
  });

  it('falls back to browser language and then the default locale', () => {
    expect(resolveLocale({
      browserLanguages: ['fr-FR', 'zh-TW'],
      defaultLocale: DEFAULT_LOCALE,
    })).toBe('zh-CN');

    expect(resolveLocale({
      browserLanguages: ['fr-FR'],
      defaultLocale: DEFAULT_LOCALE,
    })).toBe(DEFAULT_LOCALE);
  });

  it('persists locale changes and syncs document language', () => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('document', { documentElement: { lang: '' } });

    const listener = vi.fn();
    const unsubscribe = i18nService.subscribe(listener);

    i18nService.setLocale('zh');

    expect(i18nService.locale).toBe('zh-CN');
    expect(localStorageMock.getItem(LOCALE_STORAGE_KEY)).toBe('zh-CN');
    expect(readStoredLocale()).toBe('zh-CN');
    expect(globalThis.document.documentElement.lang).toBe('zh-CN');
    expect(listener).toHaveBeenCalledWith('zh-CN');

    unsubscribe();
  });

  it('notifies subscribers when package resources change and falls back to en-US package strings', () => {
    const listener = vi.fn();
    const unsubscribe = i18nService.subscribe(listener);

    const config: PackageI18nConfig = {
      namespace: 'demo',
      supportedLocales: ['zh-CN', 'en-US'],
      resources: {
        'zh-CN': {
          message: {},
        },
        'en-US': {
          message: {
            greeting: 'Hello from demo',
          },
        },
      },
      defaultLocale: 'en-US',
      fallbackLocale: 'en-US',
    };

    i18nService.setLocale('zh-CN', { persist: false });
    listener.mockClear();

    registerPackageI18n(config);

    expect(listener).toHaveBeenCalledWith('zh-CN');
    expect(i18nService.t('demo.message.greeting')).toBe('Hello from demo');

    unsubscribe();
  });
});
