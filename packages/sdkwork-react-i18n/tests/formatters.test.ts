import { afterEach, describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
} from '../src/formatters';
import { DEFAULT_LOCALE, i18nService } from '../src/I18nService';

describe('shared locale-aware formatters', () => {
  afterEach(() => {
    i18nService.setLocale(DEFAULT_LOCALE, { persist: false });
  });

  it('formats dates and times according to the requested locale', () => {
    const sample = '2024-01-02T03:04:05Z';

    const enDate = formatDate(sample, { locale: 'en-US', timeZone: 'UTC' });
    const zhDate = formatDate(sample, { locale: 'zh-CN', timeZone: 'UTC' });
    const enTime = formatTime(sample, { locale: 'en-US', timeZone: 'UTC' });
    const zhTime = formatTime(sample, { locale: 'zh-CN', timeZone: 'UTC' });

    expect(enDate).not.toBe(zhDate);
    expect(enTime).not.toBe(zhTime);
  });

  it('defaults to the active runtime locale when none is provided', () => {
    const sample = '2024-01-02T03:04:05Z';

    i18nService.setLocale('zh-CN', { persist: false });
    expect(formatDateTime(sample, { timeZone: 'UTC' })).toBe(
      formatDateTime(sample, { locale: 'zh-CN', timeZone: 'UTC' }),
    );

    i18nService.setLocale('en-US', { persist: false });
    expect(formatDateTime(sample, { timeZone: 'UTC' })).toBe(
      formatDateTime(sample, { locale: 'en-US', timeZone: 'UTC' }),
    );
  });

  it('formats currency with locale-aware symbols', () => {
    expect(formatCurrency(1234.5, 'CNY', { locale: 'en-US' })).toBe(
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CNY' }).format(1234.5),
    );
    expect(formatCurrency(1234.5, 'CNY', { locale: 'zh-CN' })).toBe(
      new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(1234.5),
    );
  });

  it('formats relative time with locale-aware text', () => {
    const reference = new Date('2024-01-02T03:04:05Z');
    const target = new Date('2024-01-02T03:02:05Z');

    expect(formatRelativeTime(target, { now: reference, locale: 'en-US' })).toBe('2 minutes ago');
    expect(formatRelativeTime(target, { now: reference, locale: 'zh-CN' })).toBe(
      new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' }).format(-2, 'minute'),
    );
  });
});
