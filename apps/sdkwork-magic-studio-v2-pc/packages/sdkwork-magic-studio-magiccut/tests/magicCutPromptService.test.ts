import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  enhancePrompt: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-image/services', () => ({
  imageService: {
    enhancePrompt: mocks.enhancePrompt,
  },
}));

import { enhanceMagicCutPrompt } from '../src/services/magicCutPromptService';

describe('magicCutPromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes magiccut prompt enhancement through imageService', async () => {
    mocks.enhancePrompt.mockResolvedValue('enhanced:voice over script');

    const enhanced = await enhanceMagicCutPrompt('voice over script');

    expect(mocks.enhancePrompt).toHaveBeenCalledWith('voice over script');
    expect(enhanced).toBe('enhanced:voice over script');
  });

  it('returns the original prompt when enhancement fails', async () => {
    mocks.enhancePrompt.mockRejectedValue(new Error('enhance failed'));

    const enhanced = await enhanceMagicCutPrompt('opening title');

    expect(enhanced).toBe('opening title');
  });

  it('skips enhancement when the prompt is blank', async () => {
    const enhanced = await enhanceMagicCutPrompt('');

    expect(mocks.enhancePrompt).not.toHaveBeenCalled();
    expect(enhanced).toBe('');
  });
});
