import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, i18nService } from '../src/I18nService';
import {
  createLocalizedText,
  resolveLocalizedText,
  resolveLocalizedTextArray,
} from '../src/localizedText';

describe('localized text helpers', () => {
  afterEach(() => {
    i18nService.setLocale(DEFAULT_LOCALE, { persist: false });
  });

  it('resolves localized text using the requested locale alias', () => {
    const value = createLocalizedText('Upgrade', '\u5347\u7ea7');

    expect(resolveLocalizedText(value, 'en')).toBe('Upgrade');
    expect(resolveLocalizedText(value, 'zh')).toBe('\u5347\u7ea7');
  });

  it('falls back to the active runtime locale when none is provided', () => {
    const value = createLocalizedText('Settings', '\u8bbe\u7f6e');

    i18nService.setLocale('zh-CN', { persist: false });
    expect(resolveLocalizedText(value)).toBe('\u8bbe\u7f6e');
  });

  it('maps arrays of localized values into the active language', () => {
    const values = [
      createLocalizedText('Home', '\u9996\u9875'),
      createLocalizedText('Community', '\u793e\u533a'),
    ];

    expect(resolveLocalizedTextArray(values, 'en-US')).toEqual(['Home', 'Community']);
    expect(resolveLocalizedTextArray(values, 'zh-CN')).toEqual(['\u9996\u9875', '\u793e\u533a']);
  });
});
