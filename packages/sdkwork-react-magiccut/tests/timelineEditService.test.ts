import { describe, expect, it } from 'vitest';

import { TimelineEditService } from '../src/services/TimelineEditService';
import type { CutClip, CutTrack, CutTimeline } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';

const createClip = ({
  id,
  start,
  duration,
  offset = 0,
  speed = 1,
}: {
  id: string;
  start: number;
  duration: number;
  offset?: number;
  speed?: number;
}): CutClip => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutClip',
  track: { id: 'track-1', uuid: 'track-1-uuid', type: 'CutTrack' },
  resource: { id: `${id}-resource`, uuid: `${id}-resource-uuid`, type: 'MediaResource' },
  start,
  duration,
  offset,
  layers: [],
  speed,
  volume: 1,
  createdAt: 0,
  updatedAt: 0,
  transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, scale: 1, opacity: 1 },
});

const createState = (clips: CutClip[]): NormalizedState => {
  const track: CutTrack = {
    id: 'track-1',
    uuid: 'track-1-uuid',
    type: 'CutTrack',
    trackType: 'video',
    name: 'V1',
    order: 0,
    isMain: true,
    clips: clips.map((clip) => ({ id: clip.id, uuid: clip.uuid, type: 'CutClip' })),
    height: 64,
    visible: true,
    locked: false,
    muted: false,
    createdAt: 0,
    updatedAt: 0,
  };

  const timeline: CutTimeline = {
    id: 'timeline-1',
    uuid: 'timeline-1-uuid',
    type: 'CutTimeline',
    name: 'Sequence 1',
    fps: 30,
    duration: 30,
    tracks: [{ id: track.id, uuid: track.uuid, type: 'CutTrack' }],
    createdAt: 0,
    updatedAt: 0,
  };

  return {
    resources: Object.fromEntries(
      clips.map((clip) => [
        clip.resource.id,
        {
          id: clip.resource.id,
          uuid: clip.resource.uuid,
          name: clip.id,
          type: 'VIDEO',
          path: `${clip.id}.mp4`,
          duration: 30,
          metadata: { duration: 30 },
        },
      ])
    ),
    timelines: { [timeline.id]: timeline },
    tracks: { [track.id]: track },
    clips: Object.fromEntries(clips.map((clip) => [clip.id, clip])),
    layers: {},
  };
};

const clipUpdatesById = (result: ReturnType<typeof TimelineEditService.calculateRippleTrim>) =>
  Object.fromEntries(result.clipsToUpdate.map(({ id, updates }) => [id, updates]));

describe('TimelineEditService', () => {
  it('keeps the trimmed clip anchored during ripple trim on the start edge', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRippleTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      start: 5,
      duration: 3,
      offset: 3,
    });
    expect(updates['clip-c']).toMatchObject({
      start: 8,
    });
  });

  it('updates offsets correctly when rolling a clip start against the previous clip', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRollTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-a']).toMatchObject({
      duration: 6,
    });
    expect(updates['clip-b']).toMatchObject({
      start: 6,
      duration: 3,
      offset: 3,
    });
  });

  it('updates offsets correctly when rolling a clip end against the next clip', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3, offset: 4 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRollTrim(clipB, 'end', 10, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      duration: 5,
    });
    expect(updates['clip-c']).toMatchObject({
      start: 10,
      duration: 2,
      offset: 5,
    });
  });

  it('slides a clip by borrowing time from the next clip and giving it to the previous clip', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3, offset: 4 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateSlideTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-a']).toMatchObject({
      duration: 6,
    });
    expect(updates['clip-b']).toMatchObject({
      start: 6,
      duration: 4,
    });
    expect(updates['clip-c']).toMatchObject({
      start: 10,
      duration: 2,
    });
  });

  it('slips source media in the opposite direction of the pointer drag', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateSlipTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      offset: 1,
    });
  });

  it('uses playback speed when ripple trimming a clip start', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 4, speed: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRippleTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      start: 5,
      duration: 3,
      offset: 6,
    });
    expect(updates['clip-c']).toMatchObject({
      start: 8,
    });
  });

  it('clamps backward ripple trims using speed-adjusted source availability', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 1, speed: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRippleTrim(clipB, 'start', 4, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      start: 5,
      duration: 4.5,
      offset: 0,
    });
    expect(updates['clip-c']).toMatchObject({
      start: 9.5,
    });
  });

  it('uses playback speed when rolling a clip start against the previous clip', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 4, speed: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRollTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-a']).toMatchObject({
      duration: 6,
    });
    expect(updates['clip-b']).toMatchObject({
      start: 6,
      duration: 3,
      offset: 6,
    });
  });

  it('uses playback speed when rolling a clip end into the next clip offset', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3, offset: 4, speed: 2 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateRollTrim(clipB, 'end', 10, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      duration: 5,
    });
    expect(updates['clip-c']).toMatchObject({
      start: 10,
      duration: 2,
      offset: 6,
    });
  });

  it('uses playback speed when slipping a retimed source window', () => {
    const clipA = createClip({ id: 'clip-a', start: 0, duration: 5 });
    const clipB = createClip({ id: 'clip-b', start: 5, duration: 4, offset: 4, speed: 2 });
    const clipC = createClip({ id: 'clip-c', start: 9, duration: 3 });
    const state = createState([clipA, clipB, clipC]);

    const result = TimelineEditService.calculateSlipTrim(clipB, 'start', 6, state);
    const updates = clipUpdatesById(result);

    expect(updates['clip-b']).toMatchObject({
      offset: 2,
    });
  });
});
