import { describe, expect, it } from 'vitest';

import {
  clampTimeToPlaybackRange,
  setPlaybackInPoint,
  setPlaybackOutPoint,
} from '../src/domain/playback/playbackRange';

describe('playbackRange', () => {
  it('clears the out point when a new in point would invalidate the range', () => {
    expect(
      setPlaybackInPoint({ inPoint: 2, outPoint: 6 }, 8, 12)
    ).toEqual({
      inPoint: 8,
      outPoint: null,
    });
  });

  it('clears the in point when a new out point would invalidate the range', () => {
    expect(
      setPlaybackOutPoint({ inPoint: 5, outPoint: 10 }, 3, 12)
    ).toEqual({
      inPoint: null,
      outPoint: 3,
    });
  });

  it('clamps seeks into the active playback range', () => {
    expect(
      clampTimeToPlaybackRange(12, { inPoint: 2, outPoint: 9 }, 20)
    ).toBe(9);

    expect(
      clampTimeToPlaybackRange(1, { inPoint: 2, outPoint: 9 }, 20)
    ).toBe(2);
  });
});
