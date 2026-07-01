import { describe, expect, it } from 'vitest';

import { createPromptTextInputCapabilityProps } from '../src/components/generate/promptCapabilityProps';

describe('promptCapabilityProps', () => {
  it('defaults PromptTextInput capability presets to replace mode with library and history enabled', () => {
    expect(createPromptTextInputCapabilityProps('VIDEO')).toEqual({
      enablePromptHistory: true,
      enablePromptLibrary: true,
      promptApplyMode: 'replace',
      promptBizType: 'VIDEO',
      promptType: 'USER',
    });
  });

  it('allows callers to override the default capability flags', () => {
    expect(
      createPromptTextInputCapabilityProps('AUDIO', {
        enablePromptHistory: false,
        promptApplyMode: 'append',
        promptType: 'ASSISTANT',
      })
    ).toEqual({
      enablePromptHistory: false,
      enablePromptLibrary: true,
      promptApplyMode: 'append',
      promptBizType: 'AUDIO',
      promptType: 'ASSISTANT',
    });
  });
});
