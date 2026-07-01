import { describe, expect, it } from 'vitest';

import { timelineOperationService } from '../src/services/TimelineOperationService';
import type { CutClip, CutTimeline, CutTrack } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';
import type { AnyMediaResource } from '@sdkwork/magic-studio-commons';

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
    const detachedAudioResource: AnyMediaResource = {
      id: 'detached-audio-resource-db-id',
      uuid: 'detached-audio-resource-uuid',
      assetId: 'detached-audio-resource-db-id',
      type: 'AUDIO',
      name: 'detached-audio.wav',
      path: 'detached-audio.wav',
      createdAt: 0,
      updatedAt: 0,
    } as AnyMediaResource;

    const result = timelineOperationService.calculateDetachAudio(
      state,
      videoClip.id,
      detachedAudioResource
    );

    expect(result).not.toBeNull();
    expect(result?.targetTrackId).toBe('track-audio');
    expect(result?.shouldCreateNewTrack).toBe(false);

    const linkGroupId = result?.updatedVideoClip.linkGroupId;
    expect(linkGroupId).toEqual(expect.any(String));
    expect(result?.updatedVideoClip).toMatchObject({
      muted: true,
      linkedClipId: result?.newAudioClip.uuid,
      linkGroupId,
    });
    expect(result?.newAudioClip).toMatchObject({
      id: null,
      linkedClipId: videoClip.uuid,
      linkGroupId,
      start: videoClip.start,
      duration: videoClip.duration,
      offset: videoClip.offset,
      speed: videoClip.speed,
    });
    expect(result?.newAudioClip.uuid).toEqual(expect.any(String));
    expect(result?.newAudioClip.resource.id).toBe(detachedAudioResource.id);
    expect(result?.newAudioClip.resource.uuid).toBe(detachedAudioResource.uuid);
    expect(result?.newAudioClip.resource.id).not.toBe(result?.newAudioClip.resource.uuid);
  });

  it('finds candidate tracks through uuid-first refs when normalized state maps are keyed by uuid', () => {
    const videoClip: CutClip = {
      id: 'clip-db-id',
      uuid: 'clip-uuid',
      type: 'CutClip',
      track: { id: 'track-video-db-id', uuid: 'track-video-uuid', type: 'CutTrack' },
      resource: { id: 'video-resource-db-id', uuid: 'video-resource-uuid', type: 'MediaResource' },
      start: 12,
      duration: 4,
      offset: 1,
      speed: 1,
      volume: 1,
      layers: [],
      createdAt: 0,
      updatedAt: 0,
    };

    const audioTrack = createTrack('track-audio', 'audio', 1, []);
    const timeline: CutTimeline = {
      id: 'timeline-db-id',
      uuid: 'timeline-uuid',
      type: 'CutTimeline',
      name: 'Sequence 1',
      fps: 30,
      duration: 60,
      tracks: [
        { id: 'track-video-db-id', uuid: 'track-video-uuid', type: 'CutTrack' },
        { id: 'track-audio-db-id', uuid: 'track-audio-uuid', type: 'CutTrack' },
      ],
      createdAt: 0,
      updatedAt: 0,
    };

    const state: NormalizedState = {
      assets: {},
      resourceViews: {},
      resources: {
        'video-resource-uuid': {
          id: 'video-resource-db-id',
          uuid: 'video-resource-uuid',
          name: 'video-resource',
          type: 'VIDEO',
          path: 'video-resource.bin',
          duration: videoClip.duration,
          metadata: { duration: videoClip.duration },
        },
      },
      timelines: {
        'timeline-uuid': timeline,
      },
      tracks: {
        'track-video-uuid': {
          id: 'track-video-db-id',
          uuid: 'track-video-uuid',
          type: 'CutTrack',
          trackType: 'video',
          name: 'video',
          order: 0,
          isMain: true,
          clips: [{ id: 'clip-db-id', uuid: 'clip-uuid', type: 'CutClip' }],
          height: 72,
          visible: true,
          locked: false,
          muted: false,
          createdAt: 0,
          updatedAt: 0,
        },
        'track-audio-uuid': {
          ...audioTrack,
          id: 'track-audio-db-id',
          uuid: 'track-audio-uuid',
        },
      },
      clips: {
        'clip-uuid': videoClip,
      },
      layers: {},
    };

    const result = timelineOperationService.calculateDetachAudio(
      state,
      'clip-uuid',
      {
        id: 'detached-audio-resource-db-id',
        uuid: 'detached-audio-resource-uuid',
        assetId: 'detached-audio-resource-db-id',
        type: 'AUDIO',
        name: 'detached-audio.wav',
        path: 'detached-audio.wav',
        createdAt: 0,
        updatedAt: 0,
      } as AnyMediaResource
    );

    expect(result?.targetTrackId).toBe('track-audio-uuid');
    expect(result?.shouldCreateNewTrack).toBe(false);
    expect(result?.newAudioClip.id).toBeNull();
    expect(result?.newAudioClip.linkedClipId).toBe('clip-uuid');
  });
});
