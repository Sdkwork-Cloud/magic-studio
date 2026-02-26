export type { 
    PackageI18nConfig, 
    I18nNamespaceResource,
    I18nModuleResource,
    SupportedLocale 
} from '@sdkwork/react-i18n';

import { promptEnUS } from './locales/en-US';
import { promptZhCN } from './locales/zh-CN';
import type { PackageI18nConfig, I18nNamespaceResource, SupportedLocale } from '@sdkwork/react-i18n';

export const NAMESPACE = 'prompt';

export const defaultI18nConfig: PackageI18nConfig = {
    namespace: NAMESPACE,
    supportedLocales: ['zh-CN', 'en-US'],
    resources: {
        'zh-CN': promptZhCN,
        'en-US': promptEnUS,
    },
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US',
};

export function getI18nKey(module: string, key: string): string {
    return `${NAMESPACE}.${module}.${key}`;
}

export function createI18nConfig(
    overrides?: Partial<PackageI18nConfig>
): PackageI18nConfig {
    return {
        ...defaultI18nConfig,
        ...overrides,
        resources: {
            ...defaultI18nConfig.resources,
            ...overrides?.resources,
        },
    };
}

export function getResources(): Record<SupportedLocale, I18nNamespaceResource> {
    return defaultI18nConfig.resources;
}

export function getNamespace(): string {
    return NAMESPACE;
}
