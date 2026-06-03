/** @vitest-environment jsdom */

import { describe, expect, it, vi, afterEach } from 'vitest';

import { act, render, screen } from '@/tests/support/reactTesting';
import { AIPanel } from './AIPanel';

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const clickElement = (element: Element) => {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe('AIPanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails closed instead of inserting mock AI text when no generation handler is available', async () => {
    vi.useFakeTimers();
    const onInsert = vi.fn();

    render(
      <AIPanel
        onClose={() => undefined}
        onInsert={onInsert}
        selectionText="Selected sentence"
        contextText="Document context"
        position={{ top: 120, left: 240 }}
      />,
    );

    const improveButton = screen.getAllByText('notes.editor.ai_panel.improve')[0]?.closest('button');
    expect(improveButton).toBeTruthy();

    clickElement(improveButton as HTMLButtonElement);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onInsert).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain('[AI Generated');
    expect(document.body.textContent).toContain('notes.editor.ai_panel.unavailable');
  });
});
