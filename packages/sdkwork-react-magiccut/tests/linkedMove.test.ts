import { describe, expect, it } from 'vitest';

import { ClipLinkService } from '../src/services/ClipLinkService';
import type { CutClip, CutTimeline, CutTrack } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';

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
        clip.resource.id,
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
    timelines: { [timeline.id]: timeline },
    tracks: Object.fromEntries(tracks.map((track) => [track.id, track])),
    clips: Object.fromEntries(clips.map((clip) => [clip.id, clip])),
    layers: {},
  };
};

const createCollisionChecker = (state: NormalizedState) => {
  return (trackId: string, start: number, duration: number, exclude: Set<string>) => {
    const track = state.tracks[trackId];
    if (!track) return false;

    const end = start + duration;
    return track.clips.some((clipRef) => {
      if (exclude.has(clipRef.id)) return false;
      const clip = state.clips[clipRef.id];
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
      { clipId: 'clip-video', targetTrackId: 'track-video-2', newStart: 18 },
      { clipId: 'clip-audio', targetTrackId: 'track-audio-1', newStart: 18 },
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
      { clipId: 'clip-video', targetTrackId: 'track-video-1', newStart: 3 },
      { clipId: 'clip-audio', targetTrackId: 'track-audio-1', newStart: 0 },
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
    expect(result.excludeIds).toEqual(new Set(['clip-video']));
    expect(result.moves).toEqual([
      { clipId: 'clip-video', targetTrackId: 'track-video-2', newStart: 18 },
    ]);
  });
});
