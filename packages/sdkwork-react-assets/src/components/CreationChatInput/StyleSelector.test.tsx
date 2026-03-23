import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@sdkwork/react-commons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/react-commons')>();

  return {
    ...actual,
    Popover: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? <div data-testid="mock-popover">{children}</div> : null,
  };
});

vi.mock('@sdkwork/react-core', () => ({
  platform: {
    copy: vi.fn(),
  },
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    locale: 'en-US',
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
  resolveLocalizedText: (value: unknown) => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      const localized = value as Record<string, string | undefined>;
      return localized['en-US'] ?? localized.en ?? localized['zh-CN'] ?? localized.zh ?? '';
    }
    return '';
  },
}));

describe('StyleSelector', () => {
  it('renders an empty state instead of crashing when no style options are available', async () => {
    const { StyleSelector } = await import('./StyleSelector');

    const html = renderToStaticMarkup(
      <StyleSelector
        value=""
        onChange={() => undefined}
        options={[]}
        isOpen
      />,
    );

    expect(html).toContain('Art Style');
    expect(html).toContain('No styles available right now.');
  });
});
