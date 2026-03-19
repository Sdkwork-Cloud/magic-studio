import { describe, expect, it } from 'vitest';

import { buildDeterministicBarHeights } from '../src/domain/assets/audioVisualization';

describe('buildDeterministicBarHeights', () => {
  it('returns stable heights for the same asset id', () => {
    expect(buildDeterministicBarHeights('audio-track-1', 6, 0.3, 1)).toEqual(
      buildDeterministicBarHeights('audio-track-1', 6, 0.3, 1)
    );
  });

  it('keeps every bar inside the requested bounds', () => {
    const heights = buildDeterministicBarHeights('voice-track-2', 8, 0.2, 0.9);

    expect(heights).toHaveLength(8);
    expect(heights.every((height) => height >= 0.2 && height <= 0.9)).toBe(true);
  });

  it('produces different visual fingerprints for different assets', () => {
    expect(buildDeterministicBarHeights('audio-a', 6, 0.3, 1)).not.toEqual(
      buildDeterministicBarHeights('audio-b', 6, 0.3, 1)
    );
  });
});
