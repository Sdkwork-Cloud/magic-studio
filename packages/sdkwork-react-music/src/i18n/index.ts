export type { 
    PackageI18nConfig, 
    I18nNamespaceResource,
    I18nModuleResource,
    SupportedLocale 
} from '@sdkwork/react-i18n';

import { musicEnUS } from './locales/en-US';
import { musicZhCN } from './locales/zh-CN';
import type { PackageI18nConfig } from '@sdkwork/react-i18n';

export const NAMESPACE = 'music';

export const defaultI18nConfig: PackageI18nConfig = {
    namespace: NAMESPACE,
    supportedLocales: ['zh-CN', 'en-US'],
    resources: {
        'zh-CN': musicZhCN,
        'en-US': musicEnUS,
    },
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US',
};

export function getI18nKey(module: string, key: string): string {
    return `${NAMESPACE}.${module}.${key}`;
}
