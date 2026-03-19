import { describe, expect, it } from 'vitest';

import { createTimelineStore } from '../src/store/transientStore';

describe('createTimelineStore solo state', () => {
  it('tracks multi-solo state outside the React component tree', () => {
    const store = createTimelineStore();
    const state = store.getState() as any;

    expect(state.soloTrackIds).toBeInstanceOf(Set);
    expect(Array.from(state.soloTrackIds)).toEqual([]);
    expect(typeof state.toggleSoloTrack).toBe('function');
    expect(typeof state.clearSoloTracks).toBe('function');

    state.toggleSoloTrack('audio-1');
    state.toggleSoloTrack('audio-2');
    expect(Array.from(store.getState().soloTrackIds)).toEqual(['audio-1', 'audio-2']);

    store.getState().toggleSoloTrack('audio-1');
    expect(Array.from(store.getState().soloTrackIds)).toEqual(['audio-2']);

    store.getState().clearSoloTracks();
    expect(Array.from(store.getState().soloTrackIds)).toEqual([]);
  });
});
