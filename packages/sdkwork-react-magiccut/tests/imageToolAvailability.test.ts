import { describe, expect, it } from 'vitest';

import { resolveImageToolAvailability } from '../src/domain/image/imageToolAvailability';

describe('resolveImageToolAvailability', () => {
  it('marks in-timeline AI image tools as unavailable when the destructive pipeline is not wired', () => {
    const tools = resolveImageToolAvailability();

    expect(tools.map((tool) => tool.id)).toEqual([
      'remove-bg',
      'upscale',
      'erase',
      'remix',
    ]);
    expect(tools.every((tool) => tool.available === false)).toBe(true);
    expect(tools[0]?.reason).toContain('asset');
    expect(tools[2]?.reason).toContain('mask');
  });
});
