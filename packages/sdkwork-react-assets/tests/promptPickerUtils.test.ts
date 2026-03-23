import { describe, expect, it } from 'vitest';

import {
  applyPromptSelection,
  resolvePromptHistoryContent,
} from '../src/components/generate/promptPickerUtils';

describe('promptPickerUtils', () => {
  it('replaces the current prompt by default', () => {
    expect(applyPromptSelection('old prompt', 'new prompt')).toBe('new prompt');
    expect(applyPromptSelection('old prompt', 'new prompt', 'replace')).toBe('new prompt');
  });

  it('appends the selected prompt on a new line when append mode is used', () => {
    expect(applyPromptSelection('old prompt', 'new prompt', 'append')).toBe('old prompt\nnew prompt');
    expect(applyPromptSelection('', 'new prompt', 'append')).toBe('new prompt');
  });

  it('prefers used content when resolving prompt history entries', () => {
    expect(resolvePromptHistoryContent({
      usedContent: 'expanded prompt',
      promptContent: 'base prompt',
    })).toBe('expanded prompt');

    expect(resolvePromptHistoryContent({
      promptContent: 'base prompt',
    })).toBe('base prompt');

    expect(resolvePromptHistoryContent({})).toBe('');
  });
});
