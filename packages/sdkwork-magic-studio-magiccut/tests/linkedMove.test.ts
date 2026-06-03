import { describe, expect, it } from 'vitest';

import { ClipLinkService } from '../src/services/ClipLinkService';
import type { CutClip, CutTimeline, CutTrack } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';
import { resolveEntityKey } from '@sdkwork/magic-studio-types';

type LinkedMovePlan = {
  moves: Array<{ clipId: string; targetTrackId: string; newStart: number }>;
  primaryStart: number;
  hasCollision: boolean;
  excludeIds: Set<string>;
};

const resolveLinkedMovePlan = (args: Record<string, unknown>): LinkedMovePlan => {
  const resolver = (
    ClipLinkService as unknown as {
      resolveLinkedMovePlan?: (options: Record<string, unknown>) => LinkedMovePlan;
    }
  ).resolveLinkedMovePlan;

  expect(resolver).toBeTypeOf('function');
  return resolver!(args);
};

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
  start,
  duration,
  linkedClipId,
  linkGroupId,
}: {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  linkedClipId?: string;
  linkGroupId?: string;
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
  linkedClipId,
  linkGroupId,
  createdAt: 0,
  updatedAt: 0,
});

const createState = (clips: CutClip[]): NormalizedState => {
  const trackIds = ['track-video-1', 'track-video-2', 'track-audio-1'];
  const tracks = trackIds.map((trackId, index) =>
    createTrack(
      trackId,
      trackId.startsWith('track-audio') ? 'audio' : 'video',
      index,
      clips.filter((clip) => clip.track.id === trackId).map((clip) => clip.id)
    )
  );

  const timeline: CutTimeline = {
    id: 'timeline-1',
    uuid: 'timeline-1-uuid',
    type: 'CutTimeline',
    name: 'Sequence 1',
    fps: 30,
    duration: 60,
    tracks: tracks.map((track) => ({ id: track.id, uuid: track.uuid, type: 'CutTrack' })),
    createdAt: 0,
    updatedAt: 0,
  };

  return {
    resources: Object.fromEntries(
      clips.map((clip) => [
        resolveEntityKey(clip.resource),
        {
          id: clip.resource.id,
          uuid: clip.resource.uuid,
          name: clip.resource.id,
          type: clip.track.id.startsWith('track-audio') ? 'AUDIO' : 'VIDEO',
          path: `${clip.resource.id}.bin`,
          duration: clip.duration,
          metadata: { duration: clip.duration },
        },
      ])
    ),
    timelines: { [resolveEntityKey(timeline)]: timeline },
    tracks: Object.fromEntries(tracks.map((track) => [resolveEntityKey(track), track])),
    clips: Object.fromEntries(clips.map((clip) => [resolveEntityKey(clip), clip])),
    layers: {},
  };
};

const createCollisionChecker = (state: NormalizedState) => {
  return (trackId: string, start: number, duration: number, exclude: Set<string>) => {
    const track =
      state.tracks[trackId] ||
      Object.values(state.tracks).find((candidate) => resolveEntityKey(candidate) === trackId);
    if (!track) return false;

    const end = start + duration;
    return track.clips.some((clipRef) => {
      const clipKey = resolveEntityKey(clipRef);
      if (exclude.has(clipKey)) return false;
      const clip = state.clips[clipKey];
      if (!clip) return false;
      return start < clip.start + clip.duration && end > clip.start;
    });
  };
};

describe('ClipLinkService.resolveLinkedMovePlan', () => {
  it('moves linked clips by the same delta while preserving their native tracks', () => {
    const linkGroupId = 'link-group-1';
    const videoClip = createClip({
      id: 'clip-video',
      trackId: 'track-video-1',
      start: 10,
      duration: 4,
      linkedClipId: 'clip-audio',
      linkGroupId,
    });
    const audioClip = createClip({
      id: 'clip-audio',
      trackId: 'track-audio-1',
      start: 10,
      duration: 4,
      linkedClipId: 'clip-video',
      linkGroupId,
    });
    const fillerClip = createClip({
      id: 'clip-filler',
      trackId: 'track-video-2',
      start: 0,
      duration: 3,
    });
    const state = createState([videoClip, audioClip, fillerClip]);

    const result = resolveLinkedMovePlan({
      state,
      primaryClipId: videoClip.id,
      targetTrackId: 'track-video-2',
      newStart: 18,
      linkedSelectionEnabled: true,
      checkCollision: createCollisionChecker(state),
    });

    expect(result.hasCollision).toBe(false);
    expect(result.primaryStart).toBe(18);
    expect(result.moves).toEqual([
      { clipId: resolveEntityKey(videoClip), targetTrackId: resolveEntityKey(createTrack('track-video-2', 'video', 1)), newStart: 18 },
      { clipId: resolveEntityKey(audioClip), targetTrackId: resolveEntityKey(createTrack('track-audio-1', 'audio', 2)), newStart: 18 },
    ]);
  });

  it('clamps the entire linked move when a linked clip would move before time zero', () => {
    const linkGroupId = 'link-group-2';
    const videoClip = createClip({
      id: 'clip-video',
      trackId: 'track-video-1',
      start: 5,
      duration: 4,
      linkedClipId: 'clip-audio',
      linkGroupId,
    });
    const audioClip = createClip({
      id: 'clip-audio',
      trackId: 'track-audio-1',
      start: 2,
      duration: 4,
      linkedClipId: 'clip-video',
      linkGroupId,
    });
    const state = createState([videoClip, audioClip]);

    const result = resolveLinkedMovePlan({
      state,
      primaryClipId: videoClip.id,
      targetTrackId: 'track-video-1',
      newStart: 0,
      linkedSelectionEnabled: true,
      checkCollision: createCollisionChecker(state),
    });

    expect(result.hasCollision).toBe(false);
    expect(result.primaryStart).toBe(3);
    expect(result.moves).toEqual([
      { clipId: resolveEntityKey(videoClip), targetTrackId: resolveEntityKey(createTrack('track-video-1', 'video', 0)), newStart: 3 },
      { clipId: resolveEntityKey(audioClip), targetTrackId: resolveEntityKey(createTrack('track-audio-1', 'audio', 2)), newStart: 0 },
    ]);
  });

  it('detects collisions on linked tracks before committing a drag', () => {
    const linkGroupId = 'link-group-3';
    const videoClip = createClip({
      id: 'clip-video',
      trackId: 'track-video-1',
      start: 10,
      duration: 4,
      linkedClipId: 'clip-audio',
      linkGroupId,
    });
    const audioClip = createClip({
      id: 'clip-audio',
      trackId: 'track-audio-1',
      start: 10,
      duration: 4,
      linkedClipId: 'clip-video',
      linkGroupId,
    });
    const blockingAudio = createClip({
      id: 'clip-blocker',
      trackId: 'track-audio-1',
      start: 17,
      duration: 3,
    });
    const state = createState([videoClip, audioClip, blockingAudio]);

    const result = resolveLinkedMovePlan({
      state,
      primaryClipId: videoClip.id,
      targetTrackId: 'track-video-2',
      newStart: 18,
      linkedSelectionEnabled: true,
      checkCollision: createCollisionChecker(state),
    });

    expect(result.hasCollision).toBe(true);
  });

  it('falls back to a single-clip move when linked selection is disabled', () => {
    const linkGroupId = 'link-group-4';
    const videoClip = createClip({
      id: 'clip-video',
      trackId: 'track-video-1',
      start: 10,
      duration: 4,
      linkedClipId: 'clip-audio',
      linkGroupId,
    });
    const audioClip = createClip({
      id: 'clip-audio',
      trackId: 'track-audio-1',
      start: 10,
      duration: 4,
      linkedClipId: 'clip-video',
      linkGroupId,
    });
    const state = createState([videoClip, audioClip]);

    const result = resolveLinkedMovePlan({
      state,
      primaryClipId: videoClip.id,
      targetTrackId: 'track-video-2',
      newStart: 18,
      linkedSelectionEnabled: false,
      checkCollision: createCollisionChecker(state),
    });

    expect(result.hasCollision).toBe(false);
    expect(result.excludeIds).toEqual(new Set([resolveEntityKey(videoClip)]));
    expect(result.moves).toEqual([
      { clipId: resolveEntityKey(videoClip), targetTrackId: resolveEntityKey(createTrack('track-video-2', 'video', 1)), newStart: 18 },
    ]);
  });

  it('resolves linked moves with uuid-first keys for local null-id entities', () => {
    const linkGroupId = 'link-group-local';
    const videoTrack: CutTrack = {
      ...createTrack('track-video-1', 'video', 0, []),
      id: null,
      uuid: 'track-video-local-uuid',
      clips: [],
    };
    const audioTrack: CutTrack = {
      ...createTrack('track-audio-1', 'audio', 1, []),
      id: null,
      uuid: 'track-audio-local-uuid',
      clips: [],
    };
    const targetTrack: CutTrack = {
      ...createTrack('track-video-2', 'video', 2, []),
      id: null,
      uuid: 'track-target-local-uuid',
      clips: [],
    };

    const videoClip: CutClip = {
      ...createClip({
        id: 'clip-video',
        trackId: 'track-video-1',
        start: 10,
        duration: 4,
        linkedClipId: 'clip-audio-local-uuid',
        linkGroupId,
      }),
      id: null,
      uuid: 'clip-video-local-uuid',
      track: { id: null, uuid: videoTrack.uuid, type: 'CutTrack' },
      resource: { id: null, uuid: 'clip-video-resource-local-uuid', type: 'MediaResource' },
    };
    const audioClip: CutClip = {
      ...createClip({
        id: 'clip-audio',
        trackId: 'track-audio-1',
        start: 10,
        duration: 4,
        linkedClipId: 'clip-video-local-uuid',
        linkGroupId,
      }),
      id: null,
      uuid: 'clip-audio-local-uuid',
      track: { id: null, uuid: audioTrack.uuid, type: 'CutTrack' },
      resource: { id: null, uuid: 'clip-audio-resource-local-uuid', type: 'MediaResource' },
    };

    videoTrack.clips = [{ id: null, uuid: videoClip.uuid, type: 'CutClip' }];
    audioTrack.clips = [{ id: null, uuid: audioClip.uuid, type: 'CutClip' }];

    const timeline: CutTimeline = {
      id: null,
      uuid: 'timeline-local-uuid',
      type: 'CutTimeline',
      name: 'Sequence 1',
      fps: 30,
      duration: 60,
      tracks: [videoTrack, audioTrack, targetTrack].map((track) => ({
        id: null,
        uuid: track.uuid,
        type: 'CutTrack',
      })),
      createdAt: 0,
      updatedAt: 0,
    };

    const state: NormalizedState = {
      assets: {},
      resourceViews: {},
      resources: Object.fromEntries(
        [videoClip, audioClip].map((clip) => [
          resolveEntityKey(clip.resource),
          {
            id: clip.resource.id,
            uuid: clip.resource.uuid,
            name: clip.resource.uuid,
            type: clip.track.uuid === audioTrack.uuid ? 'AUDIO' : 'VIDEO',
            path: `${clip.resource.uuid}.bin`,
            duration: clip.duration,
            metadata: { duration: clip.duration },
          },
        ])
      ),
      timelines: { [resolveEntityKey(timeline)]: timeline },
      tracks: Object.fromEntries(
        [videoTrack, audioTrack, targetTrack].map((track) => [resolveEntityKey(track), track])
      ),
      clips: Object.fromEntries(
        [videoClip, audioClip].map((clip) => [resolveEntityKey(clip), clip])
      ),
      layers: {},
    };

    const result = resolveLinkedMovePlan({
      state,
      primaryClipId: videoClip.uuid,
      targetTrackId: targetTrack.uuid,
      newStart: 18,
      linkedSelectionEnabled: true,
      checkCollision: createCollisionChecker(state),
    });

    expect(result.hasCollision).toBe(false);
    expect(result.primaryStart).toBe(18);
    expect(result.excludeIds).toEqual(new Set([videoClip.uuid, audioClip.uuid]));
    expect(result.moves).toEqual([
      { clipId: videoClip.uuid, targetTrackId: targetTrack.uuid, newStart: 18 },
      { clipId: audioClip.uuid, targetTrackId: audioTrack.uuid, newStart: 18 },
    ]);
  });
});
