export type { 
    PackageI18nConfig, 
    I18nNamespaceResource,
    I18nModuleResource,
    SupportedLocale 
} from './types';

import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import type { PackageI18nConfig, I18nNamespaceResource, SupportedLocale } from './types';

export const NAMESPACE = 'prompt';

export const defaultI18nConfig: PackageI18nConfig = {
    namespace: NAMESPACE,
    supportedLocales: ['zh-CN', 'en-US'],
    resources: {
        'zh-CN': zhCN,
        'en-US': enUS,
    },
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
};

export function createI18nConfig(
    overrides?: Partial<PackageI18nConfig> & { 
        resourceOverrides?: Record<SupportedLocale, Partial<I18nNamespaceResource>> 
    }
): PackageI18nConfig {
    if (!overrides) return defaultI18nConfig;

    const mergedResources: PackageI18nConfig['resources'] = {} as any;
    
    for (const locale of defaultI18nConfig.supportedLocales) {
        mergedResources[locale] = {
            ...defaultI18nConfig.resources[locale],
            ...(overrides.resourceOverrides?.[locale] || {}),
        };
    }

    return {
        namespace: overrides.namespace ?? defaultI18nConfig.namespace,
        supportedLocales: overrides.supportedLocales ?? defaultI18nConfig.supportedLocales,
        resources: mergedResources,
        defaultLocale: overrides.defaultLocale ?? defaultI18nConfig.defaultLocale,
        fallbackLocale: overrides.fallbackLocale ?? defaultI18nConfig.fallbackLocale,
    };
}

export function getResources(locale?: SupportedLocale): I18nNamespaceResource {
    const targetLocale = locale || defaultI18nConfig.defaultLocale!;
    return defaultI18nConfig.resources[targetLocale] || defaultI18nConfig.resources[defaultI18nConfig.fallbackLocale!];
}

export function getNamespace(): string {
    return NAMESPACE;
}

export function getI18nKey(module: string, key: string): string {
    return `${NAMESPACE}.${module}.${key}`;
}
