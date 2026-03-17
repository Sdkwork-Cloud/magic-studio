import type { Locale, SupportedLocale } from './types';

export type { SupportedLocale } from './types';

export interface PackageI18nConfig {
    namespace: string;
    supportedLocales: SupportedLocale[];
    resources: Record<SupportedLocale, I18nNamespaceResource>;
    defaultLocale?: SupportedLocale;
    fallbackLocale?: SupportedLocale;
}

export interface I18nNamespaceResource {
    common?: I18nModuleResource;
    page?: I18nModuleResource;
    form?: I18nModuleResource;
    message?: I18nModuleResource;
    error?: I18nModuleResource;
    // Allow root-level string keys (e.g. auth.sign_in) as well as module objects.
    [module: string]: string | I18nModuleResource | undefined;
}

export interface I18nModuleResource {
    [key: string]: string | I18nModuleResource;
}

export type I18nRegistry = Map<string, PackageI18nConfig>;

export function mapLocaleToSupported(locale: Locale): SupportedLocale {
    return locale;
}
