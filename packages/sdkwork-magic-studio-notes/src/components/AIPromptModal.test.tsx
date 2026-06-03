/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, render, screen } from '@/tests/support/reactTesting';
import { AIPromptModal } from './AIPromptModal';

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

describe('AIPromptModal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails closed instead of inserting mock generated content when no generation handler is available', async () => {
    vi.useFakeTimers();
    const onInsert = vi.fn();

    render(
      <AIPromptModal
        onClose={() => undefined}
        onInsert={onInsert}
        context="Existing note context"
      />,
    );

    const continueButton = screen.getAllByText('notes.ai_actions.continue')[0]?.closest('button');
    expect(continueButton).toBeTruthy();

    clickElement(continueButton as HTMLButtonElement);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onInsert).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain('[AI Generated Content');
    expect(document.body.textContent).toContain('notes.ai_generation.unavailable');
  });
});
