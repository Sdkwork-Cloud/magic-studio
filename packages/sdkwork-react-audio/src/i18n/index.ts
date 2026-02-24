export type { 
    PackageI18nConfig, 
    I18nNamespaceResource,
    I18nModuleResource,
    SupportedLocale 
} from 'sdkwork-react-i18n';

import { audioEnUS } from './locales/en-US';
import { audioZhCN } from './locales/zh-CN';
import type { PackageI18nConfig } from 'sdkwork-react-i18n';

export const NAMESPACE = 'audio';

export const defaultI18nConfig: PackageI18nConfig = {
    namespace: NAMESPACE,
    supportedLocales: ['zh-CN', 'en-US'],
    resources: {
        'zh-CN': audioZhCN,
        'en-US': audioEnUS,
    },
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US',
};

export function getI18nKey(module: string, key: string): string {
    return `${NAMESPACE}.${module}.${key}`;
}
