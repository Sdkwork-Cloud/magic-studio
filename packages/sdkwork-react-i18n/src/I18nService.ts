import { useEffect, useState } from 'react';
import type {
  InitializeI18nOptions,
  I18nListener,
  Locale,
  LocaleInput,
  LocaleResolutionOptions,
  TranslationResource,
} from './types';
import en from './resources/en';
import zhCN from './resources/zh-CN';
import { packageI18nRegistry } from './registryInstance';
import { mapLocaleToSupported } from './packageTypes';

export const DEFAULT_LOCALE: Locale = 'en-US';
export const FALLBACK_LOCALE: Locale = 'en-US';
export const LOCALE_STORAGE_KEY = 'sdkwork_locale';
export const SUPPORTED_LOCALES: Locale[] = ['en-US', 'zh-CN'];

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type DocumentLike = {
  documentElement?: {
    lang?: string;
  };
};
type NavigatorLike = {
  language?: string;
  languages?: readonly string[];
};

const readStorage = (): StorageLike | null => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

const readDocument = (): DocumentLike | null => {
  if (typeof globalThis === 'undefined' || !('document' in globalThis)) {
    return null;
  }

  return globalThis.document as DocumentLike;
};

const readNavigator = (): NavigatorLike | null => {
  if (typeof globalThis === 'undefined' || !('navigator' in globalThis)) {
    return null;
  }

  return globalThis.navigator as NavigatorLike;
};

const resolveKnownLocale = (value: unknown): Locale | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) {
    return null;
  }

  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-CN';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en-US';
  }

  return null;
};

export function normalizeLocale(value: LocaleInput | unknown, fallback: Locale = DEFAULT_LOCALE): Locale {
  return resolveKnownLocale(value) ?? fallback;
}

export function getBrowserLanguages(navigatorLike: NavigatorLike | null = readNavigator()): string[] {
  if (!navigatorLike) {
    return [];
  }

  const candidates = [
    ...(Array.isArray(navigatorLike.languages) ? navigatorLike.languages : []),
    navigatorLike.language,
  ];

  return candidates.filter((value, index, list): value is string => (
    typeof value === 'string'
    && value.trim().length > 0
    && list.indexOf(value) === index
  ));
}

export function getRequestedLocaleFromSearch(search: string | undefined): string | null {
  if (typeof search !== 'string' || !search.trim()) {
    return null;
  }

  const params = new URLSearchParams(search);
  return params.get('locale');
}

export function readStoredLocale(
  storageKey: string = LOCALE_STORAGE_KEY,
  storage: StorageLike | null = readStorage(),
): Locale | null {
  const stored = storage?.getItem(storageKey);
  return resolveKnownLocale(stored);
}

export function resolveLocale(options: LocaleResolutionOptions = {}): Locale {
  const defaultLocale = normalizeLocale(options.defaultLocale, DEFAULT_LOCALE);

  if (options.requestedLocale !== undefined && options.requestedLocale !== null) {
    return normalizeLocale(options.requestedLocale, defaultLocale);
  }

  if (options.storedLocale !== undefined && options.storedLocale !== null) {
    return normalizeLocale(options.storedLocale, defaultLocale);
  }

  for (const browserLanguage of options.browserLanguages ?? getBrowserLanguages()) {
    const resolved = resolveKnownLocale(browserLanguage);
    if (resolved) {
      return resolved;
    }
  }

  return defaultLocale;
}

class I18nService {
  private _locale: Locale;
  private _resources: Record<Locale, TranslationResource>;
  private _listeners: Set<I18nListener> = new Set();

  constructor() {
    this._resources = {
      'en-US': en,
      'zh-CN': zhCN,
    };
    this._locale = resolveLocale({
      storedLocale: readStoredLocale(),
      browserLanguages: getBrowserLanguages(),
      defaultLocale: DEFAULT_LOCALE,
    });
    this._syncDocumentLanguage(this._locale);

    packageI18nRegistry.subscribe(() => {
      this._notifyListeners();
    });
  }

  public get locale(): Locale {
    return this._locale;
  }

  public initialize(options: InitializeI18nOptions = {}): Locale {
    const locale = resolveLocale({
      ...options,
      storedLocale: options.storedLocale ?? readStoredLocale(),
      browserLanguages: options.browserLanguages ?? getBrowserLanguages(),
    });

    this._applyLocale(locale, {
      persist: options.persist ?? false,
      syncDocument: options.syncDocument ?? true,
    });

    return locale;
  }

  public setLocale(locale: LocaleInput, options: { persist?: boolean; syncDocument?: boolean } = {}) {
    const nextLocale = normalizeLocale(locale);
    this._applyLocale(nextLocale, {
      persist: options.persist ?? true,
      syncDocument: options.syncDocument ?? true,
    });
  }

  public subscribe(listener: I18nListener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _applyLocale(locale: Locale, options: { persist: boolean; syncDocument: boolean }) {
    const didChange = this._locale !== locale;
    this._locale = locale;

    if (options.persist) {
      this._persistLocale(locale);
    }

    if (options.syncDocument) {
      this._syncDocumentLanguage(locale);
    }

    if (didChange) {
      this._notifyListeners();
    }
  }

  private _persistLocale(locale: Locale) {
    readStorage()?.setItem(LOCALE_STORAGE_KEY, locale);
  }

  private _syncDocumentLanguage(locale: Locale) {
    const documentRef = readDocument();
    if (documentRef?.documentElement) {
      documentRef.documentElement.lang = locale;
    }
  }

  private _notifyListeners() {
    this._listeners.forEach((listener) => listener(this._locale));
  }

  private _getMergedResources(locale: Locale): Record<string, unknown> {
    const baseResources = this._resources[locale] || this._resources[FALLBACK_LOCALE];
    const packageResources = packageI18nRegistry.getMergedResources(mapLocaleToSupported(locale));

    return {
      ...baseResources,
      ...packageResources,
    };
  }

  public t(key: string, paramsOrDefault?: Record<string, string> | string): string {
    const keys = key.split('.');
    let current: unknown = this._getMergedResources(this._locale);

    for (const segment of keys) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[segment];
      } else {
        current = undefined;
        break;
      }
    }

    if (current === undefined) {
      let fallback: unknown = this._getMergedResources(FALLBACK_LOCALE);

      for (const segment of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = (fallback as Record<string, unknown>)[segment];
        } else {
          fallback = undefined;
          break;
        }
      }

      current = fallback;
    }

    if (current === undefined) {
      return typeof paramsOrDefault === 'string' ? paramsOrDefault : key;
    }

    let result = String(current);
    if (paramsOrDefault && typeof paramsOrDefault === 'object') {
      Object.entries(paramsOrDefault).forEach(([paramKey, paramValue]) => {
        result = result.replace(`{${paramKey}}`, paramValue);
      });
    }

    return result;
  }
}

export const i18nService = new I18nService();

export const useTranslation = () => {
  const [locale, setLocale] = useState(i18nService.locale);

  useEffect(() => {
    const unsubscribe = i18nService.subscribe(setLocale);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    t: (key: string, paramsOrDefault?: Record<string, string> | string) => i18nService.t(key, paramsOrDefault),
    locale,
    setLocale: (nextLocale: LocaleInput) => i18nService.setLocale(nextLocale),
  };
};
