import { i18nService, normalizeLocale } from './I18nService';
import type { LocaleInput } from './types';

type DateValue = Date | string | number;

interface BaseFormatterOptions {
  locale?: LocaleInput;
  fallback?: string;
}

export interface NumberFormatterOptions extends BaseFormatterOptions, Intl.NumberFormatOptions {}
export interface CurrencyFormatterOptions extends NumberFormatterOptions {}
export interface DateFormatterOptions extends BaseFormatterOptions, Intl.DateTimeFormatOptions {}

export interface RelativeTimeFormatterOptions extends BaseFormatterOptions {
  now?: DateValue;
  numeric?: Intl.RelativeTimeFormatNumeric;
}

const INVALID_DATE_FALLBACK = '--';

const resolveFormatterLocale = (locale?: LocaleInput) => (
  locale ? normalizeLocale(locale) : i18nService.locale
);

const resolveDate = (value: DateValue): Date | null => {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function formatNumber(value: number, options: NumberFormatterOptions = {}): string {
  const { locale, fallback = '0', ...intlOptions } = options;
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return new Intl.NumberFormat(resolveFormatterLocale(locale), intlOptions).format(value);
}

export function formatCurrency(
  value: number,
  currency: string,
  options: CurrencyFormatterOptions = {},
): string {
  const { locale, fallback = '--', ...intlOptions } = options;
  if (!Number.isFinite(value) || typeof currency !== 'string' || currency.trim().length === 0) {
    return fallback;
  }

  return new Intl.NumberFormat(resolveFormatterLocale(locale), {
    style: 'currency',
    currency,
    ...intlOptions,
  }).format(value);
}

export function formatDate(value: DateValue, options: DateFormatterOptions = {}): string {
  const { locale, fallback = INVALID_DATE_FALLBACK, ...intlOptions } = options;
  const parsed = resolveDate(value);
  if (!parsed) {
    return fallback;
  }

  return new Intl.DateTimeFormat(resolveFormatterLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...intlOptions,
  }).format(parsed);
}

export function formatTime(value: DateValue, options: DateFormatterOptions = {}): string {
  const { locale, fallback = INVALID_DATE_FALLBACK, ...intlOptions } = options;
  const parsed = resolveDate(value);
  if (!parsed) {
    return fallback;
  }

  return new Intl.DateTimeFormat(resolveFormatterLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    ...intlOptions,
  }).format(parsed);
}

export function formatDateTime(value: DateValue, options: DateFormatterOptions = {}): string {
  const { locale, fallback = INVALID_DATE_FALLBACK, ...intlOptions } = options;
  const parsed = resolveDate(value);
  if (!parsed) {
    return fallback;
  }

  return new Intl.DateTimeFormat(resolveFormatterLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...intlOptions,
  }).format(parsed);
}

export function formatRelativeTime(value: DateValue, options: RelativeTimeFormatterOptions = {}): string {
  const {
    locale,
    fallback = INVALID_DATE_FALLBACK,
    now = Date.now(),
    numeric = 'auto',
  } = options;
  const parsed = resolveDate(value);
  const nowDate = resolveDate(now);

  if (!parsed || !nowDate) {
    return fallback;
  }

  const diffSeconds = Math.round((parsed.getTime() - nowDate.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  let valueToFormat = diffSeconds;
  let unit: Intl.RelativeTimeFormatUnit = 'second';

  if (absSeconds >= 86400) {
    valueToFormat = Math.round(diffSeconds / 86400);
    unit = 'day';
  } else if (absSeconds >= 3600) {
    valueToFormat = Math.round(diffSeconds / 3600);
    unit = 'hour';
  } else if (absSeconds >= 60) {
    valueToFormat = Math.round(diffSeconds / 60);
    unit = 'minute';
  }

  return new Intl.RelativeTimeFormat(resolveFormatterLocale(locale), {
    numeric,
  }).format(valueToFormat, unit);
}
