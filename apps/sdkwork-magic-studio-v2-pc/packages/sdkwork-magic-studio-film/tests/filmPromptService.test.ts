import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  enhancePrompt: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-image/services', () => {
  return {
    imageService: {
      enhancePrompt: mocks.enhancePrompt,
    },
  };
});

import { enhanceFilmPrompt } from '../src/services/filmPromptService';

describe('filmPromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes film prompt enhancement through imageService', async () => {
    mocks.enhancePrompt.mockResolvedValue('enhanced:cinematic alley at night');

    const enhanced = await enhanceFilmPrompt('cinematic alley at night');

    expect(mocks.enhancePrompt).toHaveBeenCalledWith('cinematic alley at night');
    expect(enhanced).toBe('enhanced:cinematic alley at night');
  });

  it('returns the original prompt when enhancement fails', async () => {
    mocks.enhancePrompt.mockRejectedValue(new Error('prompt enhance failed'));

    const enhanced = await enhanceFilmPrompt('storm over the harbor');

    expect(enhanced).toBe('storm over the harbor');
  });

  it('skips enhancement when the prompt is blank', async () => {
    const enhanced = await enhanceFilmPrompt('   ');

    expect(mocks.enhancePrompt).not.toHaveBeenCalled();
    expect(enhanced).toBe('   ');
  });
});
