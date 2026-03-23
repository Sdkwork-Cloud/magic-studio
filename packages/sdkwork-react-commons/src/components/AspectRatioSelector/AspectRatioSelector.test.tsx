import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../Popover', () => ({
  Popover: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="mock-popover">{children}</div> : null,
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

describe('AspectRatioSelector', () => {
  it('computes standard 1080p 4:3 dimensions from the height baseline', async () => {
    const { AspectRatioSelector } = await import('./AspectRatioSelector');

    const html = renderToStaticMarkup(
      <AspectRatioSelector
        value="4:3"
        onChange={() => undefined}
        resolution="1080p"
        onResolutionChange={() => undefined}
        isOpen
      />,
    );

    expect(html).toContain('1440');
    expect(html).toContain('1080');
    expect(html).not.toContain('1920');
  });
});
