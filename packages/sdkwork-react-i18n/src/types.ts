export type SupportedLocale = 'en-US' | 'zh-CN';
export type Locale = SupportedLocale;
export type LocaleInput = Locale | string;

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

export interface LocaleResolutionOptions {
  requestedLocale?: unknown;
  storedLocale?: unknown;
  browserLanguages?: readonly unknown[];
  defaultLocale?: Locale;
}

export interface InitializeI18nOptions extends LocaleResolutionOptions {
  persist?: boolean;
  syncDocument?: boolean;
}
