import { describe, expect, it } from 'vitest';

import { resolveClipToolInteraction } from '../src/domain/timeline/clipInteraction';

describe('clipInteraction', () => {
  it('maps edge drags to the correct trim interaction for advanced tools', () => {
    expect(
      resolveClipToolInteraction({ tool: 'ripple', zone: 'start-edge' })
    ).toBe('ripple-trim');

    expect(
      resolveClipToolInteraction({ tool: 'roll', zone: 'end-edge' })
    ).toBe('roll-trim');

    expect(
      resolveClipToolInteraction({ tool: 'slide', zone: 'end-edge' })
    ).toBe('slide-trim');
  });

  it('maps body gestures to slip and razor interactions', () => {
    expect(
      resolveClipToolInteraction({ tool: 'slip', zone: 'body' })
    ).toBe('slip-trim');

    expect(
      resolveClipToolInteraction({ tool: 'slide', zone: 'body' })
    ).toBe('slide-trim');

    expect(
      resolveClipToolInteraction({ tool: 'razor', zone: 'body' })
    ).toBe('razor-cut');
  });

  it('keeps select mode on body drags and standard trims on edge drags', () => {
    expect(
      resolveClipToolInteraction({ tool: 'select', zone: 'body' })
    ).toBe('move');

    expect(
      resolveClipToolInteraction({ tool: 'select', zone: 'end-edge' })
    ).toBe('trim-end');
  });
});
