export type {
  I18nModuleResource,
  I18nNamespaceResource,
  PackageI18nConfig,
  SupportedLocale,
} from '@sdkwork/magic-studio-i18n';

import type { PackageI18nConfig } from '@sdkwork/magic-studio-i18n';
import { userEnUS } from './locales/en-US';
import { userZhCN } from './locales/zh-CN';

export const NAMESPACE = 'user';

export const defaultI18nConfig: PackageI18nConfig = {
  namespace: NAMESPACE,
  supportedLocales: ['zh-CN', 'en-US'],
  resources: {
    'en-US': userEnUS,
    'zh-CN': userZhCN,
  },
  defaultLocale: 'en-US',
  fallbackLocale: 'en-US',
};
