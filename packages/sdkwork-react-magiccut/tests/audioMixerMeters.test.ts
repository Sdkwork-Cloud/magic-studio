import { describe, expect, it } from 'vitest';

import {
  buildMasterMeterBars,
  buildTrackMeterLevel,
} from '../src/domain/audio/audioMixerMeters';

describe('buildTrackMeterLevel', () => {
  it('returns zero when playback is stopped, the track is muted, or there are no active clips', () => {
    const baseInput = {
      masterLevel: 0.8,
      isPlaying: true,
      currentTime: 5,
      trackVolume: 1,
      isMuted: false,
      clips: [{ start: 0, duration: 2, volume: 1 }],
    };

    expect(buildTrackMeterLevel({ ...baseInput, isPlaying: false })).toBe(0);
    expect(buildTrackMeterLevel({ ...baseInput, isMuted: true })).toBe(0);
    expect(buildTrackMeterLevel(baseInput)).toBe(0);
  });

  it('produces a bounded active level when the timeline is playing and clips overlap the playhead', () => {
    const level = buildTrackMeterLevel({
      masterLevel: 0.9,
      isPlaying: true,
      currentTime: 4,
      trackVolume: 1.4,
      isMuted: false,
      clips: [
        { start: 0, duration: 10, volume: 0.5 },
        { start: 2, duration: 10, volume: 1.2 },
      ],
    });

    expect(level).toBeGreaterThan(0);
    expect(level).toBeLessThanOrEqual(1);
  });

  it('increases the signal when more active clips overlap the playhead', () => {
    const singleClipLevel = buildTrackMeterLevel({
      masterLevel: 0.75,
      isPlaying: true,
      currentTime: 3,
      trackVolume: 1,
      isMuted: false,
      clips: [{ start: 0, duration: 8, volume: 1 }],
    });

    const layeredLevel = buildTrackMeterLevel({
      masterLevel: 0.75,
      isPlaying: true,
      currentTime: 3,
      trackVolume: 1,
      isMuted: false,
      clips: [
        { start: 0, duration: 8, volume: 1 },
        { start: 1, duration: 8, volume: 1 },
      ],
    });

    expect(layeredLevel).toBeGreaterThan(singleClipLevel);
  });
});

describe('buildMasterMeterBars', () => {
  it('returns silent bars when the master level is zero', () => {
    expect(buildMasterMeterBars(0, 4)).toEqual([0, 0, 0, 0]);
  });

  it('builds a bounded multi-bar meter shape for active playback', () => {
    const bars = buildMasterMeterBars(0.8, 4);

    expect(bars).toHaveLength(4);
    expect(bars.every((bar) => bar >= 0 && bar <= 1)).toBe(true);
    expect(bars.at(-1)).toBeGreaterThan(bars[0]);
  });
});
