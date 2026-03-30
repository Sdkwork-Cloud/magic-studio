import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatInput } from './ChatInput';

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ChatInput', () => {
  it('renders the composer with shared theme surface classes', () => {
    const html = renderToStaticMarkup(<ChatInput onSend={vi.fn()} />);

    expect(html).toContain('app-floating-panel');
    expect(html).toContain('app-status-icon');
    expect(html).toContain('app-header-action');
  });
});
