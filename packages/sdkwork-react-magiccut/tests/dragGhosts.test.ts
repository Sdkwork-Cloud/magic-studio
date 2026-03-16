import { describe, expect, it } from 'vitest';

import { buildLinkedGhostPreviews } from '../src/domain/timeline/dragGhosts';
import type { CutClip } from '../src/entities/magicCut.entity';
import type { InteractionState } from '../src/store/types';

const createClip = ({
  id,
  trackId,
  start,
  duration,
}: {
  id: string;
  trackId: string;
  start: number;
  duration: number;
}): CutClip => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutClip',
  track: { id: trackId, uuid: `${trackId}-uuid`, type: 'CutTrack' },
  resource: { id: `${id}-resource`, uuid: `${id}-resource-uuid`, type: 'MediaResource' },
  start,
  duration,
  offset: 0,
  speed: 1,
  volume: 1,
  layers: [],
  createdAt: 0,
  updatedAt: 0,
});

const createInteraction = (): InteractionState => ({
  type: 'move',
  clipId: 'clip-video',
  initialX: 0,
  initialY: 0,
  initialStartTime: 10,
  initialDuration: 4,
  initialTrackId: 'track-video',
  initialOffset: 0,
  currentTrackId: 'track-video',
  currentTime: 18,
  isSnapping: false,
  snapLines: [],
  validDrop: true,
  hasCollision: false,
  insertTrackIndex: null,
});

describe('buildLinkedGhostPreviews', () => {
  it('builds companion ghost previews for linked clip moves on their own tracks', () => {
    const interaction: InteractionState = {
      ...createInteraction(),
      linkedMoves: [
        { clipId: 'clip-video', targetTrackId: 'track-video-2', newStart: 18 },
        { clipId: 'clip-audio', targetTrackId: 'track-audio', newStart: 18 },
      ],
    };

    const previews = buildLinkedGhostPreviews({
      interaction,
      clipsMap: {
        'clip-video': createClip({ id: 'clip-video', trackId: 'track-video', start: 10, duration: 4 }),
        'clip-audio': createClip({ id: 'clip-audio', trackId: 'track-audio', start: 10, duration: 4 }),
      },
      trackLayouts: [
        { id: 'track-video', top: 0, height: 72 },
        { id: 'track-video-2', top: 80, height: 72 },
        { id: 'track-audio', top: 160, height: 56 },
      ],
      pixelsPerSecond: 20,
    });

    expect(previews).toEqual([
      {
        clipId: 'clip-audio',
        targetTrackId: 'track-audio',
        left: 360,
        top: 160,
        trackHeight: 56,
      },
    ]);
  });

  it('returns no companion ghosts when the interaction has only the primary move', () => {
    const interaction: InteractionState = {
      ...createInteraction(),
      linkedMoves: [
        { clipId: 'clip-video', targetTrackId: 'track-video-2', newStart: 18 },
      ],
    };

    const previews = buildLinkedGhostPreviews({
      interaction,
      clipsMap: {
        'clip-video': createClip({ id: 'clip-video', trackId: 'track-video', start: 10, duration: 4 }),
      },
      trackLayouts: [{ id: 'track-video-2', top: 80, height: 72 }],
      pixelsPerSecond: 20,
    });

    expect(previews).toEqual([]);
  });
});
