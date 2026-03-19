import { i18nService, normalizeLocale } from './I18nService';
import type { Locale, LocaleInput } from './types';

export interface LocalizedText {
  'en-US': string;
  'zh-CN': string;
}

export type LocalizedTextLike = string | LocalizedText;

export const createLocalizedText = (enUS: string, zhCN: string): LocalizedText => ({
  'en-US': enUS,
  'zh-CN': zhCN,
});

export const resolveLocalizedText = (
  value: LocalizedTextLike,
  locale: LocaleInput = i18nService.locale,
): string => {
  if (typeof value === 'string') {
    return value;
  }

  const normalizedLocale = normalizeLocale(locale) as Locale;
  return value[normalizedLocale] ?? value['en-US'];
};

export const resolveLocalizedTextArray = (
  values: LocalizedTextLike[],
  locale: LocaleInput = i18nService.locale,
): string[] => values.map((value) => resolveLocalizedText(value, locale));
