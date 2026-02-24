export type Locale = 'en' | 'zh-CN' | 'ja';

export interface TranslationResource {
  [namespace: string]: {
    [key: string]: any;
  };
}

export interface I18nConfig {
  locale: Locale;
  fallbackLocale: Locale;
  resources: Record<Locale, TranslationResource>;
}

export interface I18nListener {
  (locale: Locale): void;
}
