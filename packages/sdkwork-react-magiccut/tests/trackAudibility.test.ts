import { describe, expect, it } from 'vitest';

type TrackLike = {
  id: string;
  trackType: 'audio' | 'video' | 'text' | 'subtitle';
  muted?: boolean;
};

async function loadTrackAudibilityModule() {
  try {
    return await import('../src/domain/audio/trackAudibility');
  } catch {
    return null;
  }
}

describe('resolveAudibleTrackIds', () => {
  it('allows all non-muted audio-bearing tracks when nothing is soloed', async () => {
    const mod = await loadTrackAudibilityModule();

    expect(mod).not.toBeNull();
    if (!mod) return;

    const tracks: TrackLike[] = [
      { id: 'video-1', trackType: 'video' },
      { id: 'audio-1', trackType: 'audio' },
      { id: 'audio-2', trackType: 'audio', muted: true },
      { id: 'text-1', trackType: 'text' },
    ];

    expect(Array.from(mod.resolveAudibleTrackIds(tracks, new Set()))).toEqual([
      'video-1',
      'audio-1',
    ]);
  });

  it('restricts playback to soloed audio-bearing tracks without treating muted solos as audible', async () => {
    const mod = await loadTrackAudibilityModule();

    expect(mod).not.toBeNull();
    if (!mod) return;

    const tracks: TrackLike[] = [
      { id: 'video-1', trackType: 'video' },
      { id: 'audio-1', trackType: 'audio', muted: true },
      { id: 'audio-2', trackType: 'audio' },
      { id: 'audio-3', trackType: 'audio' },
    ];

    expect(Array.from(mod.resolveAudibleTrackIds(tracks, new Set(['video-1', 'audio-1', 'audio-2'])))).toEqual([
      'video-1',
      'audio-2',
    ]);
  });

  it('ignores non-audio solo flags so text tracks cannot silence the mix', async () => {
    const mod = await loadTrackAudibilityModule();

    expect(mod).not.toBeNull();
    if (!mod) return;

    const tracks: TrackLike[] = [
      { id: 'audio-1', trackType: 'audio' },
      { id: 'audio-2', trackType: 'audio' },
      { id: 'text-1', trackType: 'text' },
    ];

    expect(Array.from(mod.resolveAudibleTrackIds(tracks, new Set(['text-1'])))).toEqual([
      'audio-1',
      'audio-2',
    ]);
  });
});
