import { describe, expect, it } from 'vitest';

import { timelineOperationService } from '../src/services/TimelineOperationService';
import type { CutClip, CutTimeline, CutTrack } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';

const createTrack = (
  id: string,
  trackType: CutTrack['trackType'],
  order: number,
  clipIds: string[] = []
): CutTrack => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutTrack',
  trackType,
  name: id,
  order,
  isMain: trackType === 'video',
  clips: clipIds.map((clipId) => ({ id: clipId, uuid: `${clipId}-uuid`, type: 'CutClip' })),
  height: 72,
  visible: true,
  locked: false,
  muted: false,
  createdAt: 0,
  updatedAt: 0,
});

const createClip = ({
  id,
  trackId,
  resourceId,
  start,
  duration,
}: {
  id: string;
  trackId: string;
  resourceId: string;
  start: number;
  duration: number;
}): CutClip => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutClip',
  track: { id: trackId, uuid: `${trackId}-uuid`, type: 'CutTrack' },
  resource: { id: resourceId, uuid: `${resourceId}-uuid`, type: 'MediaResource' },
  start,
  duration,
  offset: 1,
  speed: 1,
  volume: 1,
  layers: [],
  createdAt: 0,
  updatedAt: 0,
});

const createState = (clips: CutClip[]): NormalizedState => {
  const videoTrack = createTrack(
    'track-video',
    'video',
    0,
    clips.filter((clip) => clip.track.id === 'track-video').map((clip) => clip.id)
  );
  const audioTrack = createTrack(
    'track-audio',
    'audio',
    1,
    clips.filter((clip) => clip.track.id === 'track-audio').map((clip) => clip.id)
  );

  const timeline: CutTimeline = {
    id: 'timeline-1',
    uuid: 'timeline-1-uuid',
    type: 'CutTimeline',
    name: 'Sequence 1',
    fps: 30,
    duration: 60,
    tracks: [
      { id: videoTrack.id, uuid: videoTrack.uuid, type: 'CutTrack' },
      { id: audioTrack.id, uuid: audioTrack.uuid, type: 'CutTrack' },
    ],
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
          name: clip.resource.id,
          type: clip.track.id === 'track-video' ? 'VIDEO' : 'AUDIO',
          path: `${clip.resource.id}.bin`,
          duration: clip.duration,
          metadata: { duration: clip.duration },
        },
      ])
    ),
    timelines: { [timeline.id]: timeline },
    tracks: {
      [videoTrack.id]: videoTrack,
      [audioTrack.id]: audioTrack,
    },
    clips: Object.fromEntries(clips.map((clip) => [clip.id, clip])),
    layers: {},
  };
};

describe('TimelineOperationService', () => {
  it('links detached audio back to the source video clip', () => {
    const videoClip = createClip({
      id: 'clip-video',
      trackId: 'track-video',
      resourceId: 'video-resource',
      start: 12,
      duration: 4,
    });
    const state = createState([videoClip]);

    const result = timelineOperationService.calculateDetachAudio(
      state,
      videoClip.id,
      'detached-audio-resource'
    );

    expect(result).not.toBeNull();
    expect(result?.targetTrackId).toBe('track-audio');
    expect(result?.shouldCreateNewTrack).toBe(false);

    const linkGroupId = result?.updatedVideoClip.linkGroupId;
    expect(linkGroupId).toEqual(expect.any(String));
    expect(result?.updatedVideoClip).toMatchObject({
      muted: true,
      linkedClipId: result?.newAudioClip.id,
      linkGroupId,
    });
    expect(result?.newAudioClip).toMatchObject({
      linkedClipId: videoClip.id,
      linkGroupId,
      start: videoClip.start,
      duration: videoClip.duration,
      offset: videoClip.offset,
      speed: videoClip.speed,
    });
  });
});
