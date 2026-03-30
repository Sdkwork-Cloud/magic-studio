import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { PromptHistoryDialog } from '../src/components/generate/PromptHistoryDialog';
import { PromptPickerDialog } from '../src/components/generate/PromptPickerDialog';

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sdkwork/react-core', () => ({
  promptLibraryService: {
    favoritePrompt: vi.fn(),
    listMostFavoritedPrompts: vi.fn(),
    listPopularPrompts: vi.fn(),
    listPromptHistory: vi.fn(),
    listPrompts: vi.fn(),
    unfavoritePrompt: vi.fn(),
  },
}));

vi.mock('@sdkwork/react-commons/ui', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

describe('prompt dialog loading presentation', () => {
  it('renders the prompt library dialog in loading state on the first open frame', () => {
    const html = renderToStaticMarkup(
      <PromptPickerDialog
        open
        onOpenChange={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expect(html).toContain('assetCenter.promptLibrary.loading');
    expect(html).not.toContain('assetCenter.promptLibrary.empty');
  });

  it('renders the prompt history dialog in loading state on the first open frame', () => {
    const html = renderToStaticMarkup(
      <PromptHistoryDialog
        open
        onOpenChange={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expect(html).toContain('assetCenter.promptHistory.loading');
    expect(html).not.toContain('assetCenter.promptHistory.empty');
  });
});
