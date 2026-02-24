export type { 
    PackageI18nConfig, 
    I18nNamespaceResource,
    I18nModuleResource,
    SupportedLocale 
} from 'sdkwork-react-i18n';

import { assetsEnUS } from './locales/en-US';
import { assetsZhCN } from './locales/zh-CN';
import type { PackageI18nConfig } from 'sdkwork-react-i18n';

export const NAMESPACE = 'assets';

export const defaultI18nConfig: PackageI18nConfig = {
    namespace: NAMESPACE,
    supportedLocales: ['zh-CN', 'en-US'],
    resources: {
        'zh-CN': assetsZhCN,
        'en-US': assetsEnUS,
    },
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US',
};

export function getI18nKey(module: string, key: string): string {
    return `${NAMESPACE}.${module}.${key}`;
}
