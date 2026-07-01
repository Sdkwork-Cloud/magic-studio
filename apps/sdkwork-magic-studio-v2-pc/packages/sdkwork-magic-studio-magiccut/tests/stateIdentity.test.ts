import { describe, expect, it } from 'vitest';

import type { CutClip, CutTimeline, CutTrack } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';
import {
  findMagicCutClipByKey,
  findMagicCutClipResourceByKey,
  findMagicCutTimelineByKey,
  findMagicCutTimelineByTrackRef,
  findMagicCutTrackByRef,
} from '../src/store/stateIdentity';

const createTrack = ({
  id,
  uuid,
  clipRefs = [],
}: {
  id: string;
  uuid: string;
  clipRefs?: Array<{ id: string; uuid: string }>;
}): CutTrack => ({
  id,
  uuid,
  type: 'CutTrack',
  trackType: 'video',
  name: 'Track',
  order: 0,
  isMain: true,
  clips: clipRefs.map((clip) => ({ id: clip.id, uuid: clip.uuid, type: 'CutClip' })),
  height: 72,
  visible: true,
  locked: false,
  muted: false,
  createdAt: 0,
  updatedAt: 0,
});

const createClip = ({
  id,
  uuid,
  track,
}: {
  id: string;
  uuid: string;
  track: { id: string; uuid: string };
}): CutClip => ({
  id,
  uuid,
  type: 'CutClip',
  track: { id: track.id, uuid: track.uuid, type: 'CutTrack' },
  resource: { id: 'resource-db-id', uuid: 'resource-uuid', type: 'MediaResource' },
  start: 0,
  duration: 4,
  offset: 0,
  speed: 1,
  volume: 1,
  layers: [],
  createdAt: 0,
  updatedAt: 0,
});

const createState = (): NormalizedState => {
  const timeline: CutTimeline = {
    id: 'timeline-db-id',
    uuid: 'timeline-uuid',
    type: 'CutTimeline',
    name: 'Sequence',
    fps: 30,
    duration: 12,
    tracks: [{ id: 'track-db-id', uuid: 'track-uuid', type: 'CutTrack' }],
    createdAt: 0,
    updatedAt: 0,
  };
  const track = createTrack({
    id: 'track-db-id',
    uuid: 'track-uuid',
    clipRefs: [{ id: 'clip-db-id', uuid: 'clip-uuid' }],
  });
  const clip = createClip({
    id: 'clip-db-id',
    uuid: 'clip-uuid',
    track: { id: 'track-db-id', uuid: 'track-uuid' },
  });

  return {
    assets: {},
    resourceViews: {},
    resources: {
      'resource-uuid': {
        id: 'resource-db-id',
        uuid: 'resource-uuid',
        name: 'resource.mp4',
        type: 'VIDEO',
        path: 'resource.mp4',
        metadata: {},
      },
    },
    timelines: {
      'timeline-uuid': timeline,
    },
    tracks: {
      'track-uuid': track,
    },
    clips: {
      'clip-uuid': clip,
    },
    layers: {},
  };
};

describe('magiccut store state identity helpers', () => {
  it('finds timelines, tracks, clips, and resources through uuid-first state keys', () => {
    const state = createState();

    expect(findMagicCutTimelineByKey(state, 'timeline-db-id')?.uuid).toBe('timeline-uuid');
    expect(findMagicCutTrackByRef(state, { id: 'track-db-id', uuid: 'track-uuid' })?.uuid).toBe(
      'track-uuid'
    );
    expect(findMagicCutClipByKey(state, 'clip-db-id')?.uuid).toBe('clip-uuid');
    expect(findMagicCutClipResourceByKey(state, 'clip-db-id')?.uuid).toBe('resource-uuid');
  });

  it('resolves a timeline through track refs even when state maps are keyed by uuid', () => {
    const state = createState();

    expect(
      findMagicCutTimelineByTrackRef(state, {
        id: 'track-db-id',
        uuid: 'track-uuid',
      })?.uuid
    ).toBe('timeline-uuid');
  });
});
