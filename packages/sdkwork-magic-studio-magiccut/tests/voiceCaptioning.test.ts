import { describe, expect, it } from 'vitest';

import {
  buildVoiceCaptionCues,
  resolveVoiceCaptionTrackPlacement,
} from '../src/domain/subtitle/voiceCaptioning';

describe('buildVoiceCaptionCues', () => {
  it('splits a script on sentence boundaries and spans the full clip duration', () => {
    const cues = buildVoiceCaptionCues({
      text: 'Hello world. This is the second line! Final beat?',
      duration: 6,
    });

    expect(cues).toHaveLength(3);
    expect(cues[0]).toMatchObject({
      index: 1,
      startTime: 0,
      text: 'Hello world.',
    });
    expect(cues[1].text).toBe('This is the second line!');
    expect(cues[2]).toMatchObject({
      index: 3,
      endTime: 6,
      text: 'Final beat?',
    });
  });

  it('breaks an oversized sentence into readable caption chunks', () => {
    const cues = buildVoiceCaptionCues({
      text: 'This caption is intentionally long so it has to break into readable chunks without exceeding the per line character limit for subtitles.',
      duration: 5,
      maxCharsPerCue: 32,
    });

    expect(cues.length).toBeGreaterThan(1);
    expect(cues.every((cue) => cue.text.length <= 32)).toBe(true);
    expect(cues.at(-1)?.endTime).toBe(5);
  });

  it('returns no cues for blank scripts or invalid durations', () => {
    expect(buildVoiceCaptionCues({ text: '   ', duration: 5 })).toEqual([]);
    expect(buildVoiceCaptionCues({ text: 'Hello', duration: 0 })).toEqual([]);
  });
});

describe('resolveVoiceCaptionTrackPlacement', () => {
  it('reuses an existing subtitle track when one is already present', () => {
    const placement = resolveVoiceCaptionTrackPlacement([
      { id: 'video-track', trackType: 'video' },
      { id: 'subtitle-track', trackType: 'subtitle' },
    ], 'video-track');

    expect(placement).toEqual({
      trackId: 'subtitle-track',
      insertIndex: 1,
      shouldCreateTrack: false,
    });
  });

  it('inserts a subtitle track directly after the source track when needed', () => {
    const placement = resolveVoiceCaptionTrackPlacement([
      { id: 'video-track', trackType: 'video' },
      { id: 'audio-track', trackType: 'audio' },
    ], 'audio-track');

    expect(placement).toEqual({
      trackId: null,
      insertIndex: 2,
      shouldCreateTrack: true,
    });
  });
});
