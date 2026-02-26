export type { 
    PackageI18nConfig, 
    I18nNamespaceResource,
    I18nModuleResource,
    SupportedLocale 
} from '@sdkwork/react-i18n';

import { sfxEnUS } from './locales/en-US';
import { sfxZhCN } from './locales/zh-CN';
import type { PackageI18nConfig } from '@sdkwork/react-i18n';

export const NAMESPACE = 'sfx';

export const defaultI18nConfig: PackageI18nConfig = {
    namespace: NAMESPACE,
    supportedLocales: ['zh-CN', 'en-US'],
    resources: {
        'zh-CN': sfxZhCN,
        'en-US': sfxEnUS,
    },
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US',
};

export function getI18nKey(module: string, key: string): string {
    return `${NAMESPACE}.${module}.${key}`;
}
