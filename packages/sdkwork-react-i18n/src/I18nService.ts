import { Locale, TranslationResource } from './types';
import en from './resources/en';
import zhCN from './resources/zh-CN';
import { packageI18nRegistry } from './registryInstance';
import { mapLocaleToSupported } from './packageTypes';

class I18nService {
  private _locale: Locale = 'en';
  private _resources: Record<Locale, TranslationResource>;
  private _listeners: Set<(locale: Locale) => void> = new Set();

  constructor() {
    this._resources = {
      'en': en,
      'zh-CN': zhCN,
      'ja': en
    };
  }

  public get locale(): Locale {
    return this._locale;
  }

  public setLocale(locale: Locale) {
    if (this._locale !== locale) {
      this._locale = locale;
      this._notifyListeners();
    }
  }

  public subscribe(listener: (locale: Locale) => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notifyListeners() {
    this._listeners.forEach(fn => fn(this._locale));
  }

  private _getMergedResources(): Record<string, any> {
    const baseResources = this._resources[this._locale] || this._resources['en'];
    const supportedLocale = mapLocaleToSupported(this._locale);
    const packageResources = packageI18nRegistry.getMergedResources(supportedLocale);
    
    return {
      ...baseResources,
      ...packageResources,
    };
  }

  public t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let current: any = this._getMergedResources();

    for (const k of keys) {
      if (current && typeof current === 'object') {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    // Fallback to base resources if not found
    if (current === undefined) {
        let fallback: any = this._resources['en'];
        for (const k of keys) {
            if (fallback && typeof fallback === 'object') {
                fallback = fallback[k];
            } else {
                fallback = undefined;
                break;
            }
        }
        current = fallback;
    }

    // Fallback to package resources in en-US
    if (current === undefined) {
        const packageResources = packageI18nRegistry.getMergedResources('en-US');
        let fallback: any = packageResources;
        for (const k of keys) {
            if (fallback && typeof fallback === 'object') {
                fallback = fallback[k];
            } else {
                fallback = undefined;
                break;
            }
        }
        current = fallback;
    }

    if (current === undefined) return key;

    let result = String(current);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }

    return result;
  }
}

export const i18nService = new I18nService();

import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const [locale, setLocale] = useState(i18nService.locale);
  
  useEffect(() => {
    const unsubscribe = i18nService.subscribe(setLocale);
    return () => { unsubscribe(); };
  }, []);

  return {
    t: (key: string, params?: Record<string, string>) => i18nService.t(key, params),
    locale,
    setLocale: (l: Locale) => i18nService.setLocale(l)
  };
};
