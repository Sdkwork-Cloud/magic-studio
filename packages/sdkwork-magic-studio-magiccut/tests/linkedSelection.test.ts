import { describe, expect, it } from 'vitest';

import { resolveLinkedSelectionState } from '../src/domain/timeline/linkedSelection';
import type { CutClip } from '../src/entities/magicCut.entity';
import type { NormalizedState } from '../src/store/types';

const createClip = ({
  id,
  trackId,
  linkedClipId,
  linkGroupId,
}: {
  id: string;
  trackId: string;
  linkedClipId?: string;
  linkGroupId?: string;
}): CutClip => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutClip',
  track: { id: trackId, uuid: `${trackId}-uuid`, type: 'CutTrack' },
  resource: { id: `${id}-resource`, uuid: `${id}-resource-uuid`, type: 'MediaResource' },
  start: 0,
  duration: 4,
  offset: 0,
  speed: 1,
  volume: 1,
  layers: [],
  linkedClipId,
  linkGroupId,
  createdAt: 0,
  updatedAt: 0,
});

const createState = (clips: CutClip[]): NormalizedState => ({
  resources: Object.fromEntries(
    clips.map((clip) => [
      clip.resource.id,
      {
        id: clip.resource.id,
        uuid: clip.resource.uuid,
        name: clip.resource.id,
        type: 'VIDEO',
        path: `${clip.resource.id}.bin`,
      },
    ])
  ),
  timelines: {},
  tracks: Object.fromEntries(
    Array.from(new Set(clips.map((clip) => clip.track.id))).map((trackId, index) => [
      trackId,
      {
        id: trackId,
        uuid: `${trackId}-uuid`,
        type: 'CutTrack',
        trackType: trackId.startsWith('audio') ? 'audio' : 'video',
        name: trackId,
        order: index,
        isMain: index === 0,
        clips: clips
          .filter((clip) => clip.track.id === trackId)
          .map((clip) => ({ id: clip.id, uuid: clip.uuid, type: 'CutClip' })),
        height: 72,
        visible: true,
        locked: false,
        muted: false,
        createdAt: 0,
        updatedAt: 0,
      },
    ])
  ),
  clips: Object.fromEntries(clips.map((clip) => [clip.id, clip])),
  layers: {},
});

describe('resolveLinkedSelectionState', () => {
  it('selects the whole linked group for single selection when linked selection is enabled', () => {
    const linkGroupId = 'link-group-1';
    const state = createState([
      createClip({
        id: 'clip-video',
        trackId: 'video-1',
        linkedClipId: 'clip-audio',
        linkGroupId,
      }),
      createClip({
        id: 'clip-audio',
        trackId: 'audio-1',
        linkedClipId: 'clip-video',
        linkGroupId,
      }),
    ]);

    const result = resolveLinkedSelectionState({
      clipId: 'clip-video',
      state,
      linkedSelectionEnabled: true,
      multi: false,
      selectedClipId: null,
      selectedClipIds: new Set<string>(),
    });

    expect(result.selectedClipId).toBe('clip-video-uuid');
    expect(result.selectedTrackId).toBe('video-1-uuid');
    expect(result.selectedClipIds).toEqual(new Set(['clip-video-uuid', 'clip-audio-uuid']));
  });

  it('falls back to selecting only the clicked clip when linked selection is disabled', () => {
    const linkGroupId = 'link-group-2';
    const state = createState([
      createClip({
        id: 'clip-video',
        trackId: 'video-1',
        linkedClipId: 'clip-audio',
        linkGroupId,
      }),
      createClip({
        id: 'clip-audio',
        trackId: 'audio-1',
        linkedClipId: 'clip-video',
        linkGroupId,
      }),
    ]);

    const result = resolveLinkedSelectionState({
      clipId: 'clip-video',
      state,
      linkedSelectionEnabled: false,
      multi: false,
      selectedClipId: null,
      selectedClipIds: new Set<string>(),
    });

    expect(result.selectedClipIds).toEqual(new Set(['clip-video-uuid']));
  });

  it('adds the entire linked group during multi-selection', () => {
    const linkGroupId = 'link-group-3';
    const state = createState([
      createClip({ id: 'clip-a', trackId: 'video-1' }),
      createClip({
        id: 'clip-video',
        trackId: 'video-2',
        linkedClipId: 'clip-audio',
        linkGroupId,
      }),
      createClip({
        id: 'clip-audio',
        trackId: 'audio-1',
        linkedClipId: 'clip-video',
        linkGroupId,
      }),
    ]);

    const result = resolveLinkedSelectionState({
      clipId: 'clip-video',
      state,
      linkedSelectionEnabled: true,
      multi: true,
      selectedClipId: 'clip-a',
      selectedClipIds: new Set(['clip-a']),
    });

    expect(result.selectedClipId).toBe('clip-video-uuid');
    expect(result.selectedClipIds).toEqual(new Set(['clip-a-uuid', 'clip-video-uuid', 'clip-audio-uuid']));
  });

  it('removes the entire linked group during multi-toggle off and keeps a stable fallback selection', () => {
    const linkGroupId = 'link-group-4';
    const state = createState([
      createClip({ id: 'clip-a', trackId: 'video-1' }),
      createClip({
        id: 'clip-video',
        trackId: 'video-2',
        linkedClipId: 'clip-audio',
        linkGroupId,
      }),
      createClip({
        id: 'clip-audio',
        trackId: 'audio-1',
        linkedClipId: 'clip-video',
        linkGroupId,
      }),
    ]);

    const result = resolveLinkedSelectionState({
      clipId: 'clip-video',
      state,
      linkedSelectionEnabled: true,
      multi: true,
      selectedClipId: 'clip-video',
      selectedClipIds: new Set(['clip-a', 'clip-video', 'clip-audio']),
    });

    expect(result.selectedClipId).toBe('clip-a-uuid');
    expect(result.selectedClipIds).toEqual(new Set(['clip-a-uuid']));
  });

  it('canonicalizes linked selection to uuid-first keys when clip state is keyed by uuid', () => {
    const linkGroupId = 'link-group-5';
    const videoClip = {
      ...createClip({
        id: 'clip-video-db-id',
        trackId: 'video-1',
        linkedClipId: 'clip-audio-db-id',
        linkGroupId,
      }),
      uuid: 'clip-video-uuid',
      linkedClipId: 'clip-audio-db-id',
    };
    const audioClip = {
      ...createClip({
        id: 'clip-audio-db-id',
        trackId: 'audio-1',
        linkedClipId: 'clip-video-db-id',
        linkGroupId,
      }),
      uuid: 'clip-audio-uuid',
      linkedClipId: 'clip-video-db-id',
    };

    const state: NormalizedState = {
      assets: {},
      resourceViews: {},
      resources: {
        'clip-video-resource-uuid': {
          id: 'clip-video-resource-db-id',
          uuid: 'clip-video-resource-uuid',
          name: 'clip-video-resource',
          type: 'VIDEO',
          path: 'clip-video-resource.bin',
        },
        'clip-audio-resource-uuid': {
          id: 'clip-audio-resource-db-id',
          uuid: 'clip-audio-resource-uuid',
          name: 'clip-audio-resource',
          type: 'AUDIO',
          path: 'clip-audio-resource.bin',
        },
      },
      timelines: {},
      tracks: {
        'video-1-uuid': {
          id: 'video-1',
          uuid: 'video-1-uuid',
          type: 'CutTrack',
          trackType: 'video',
          name: 'video-1',
          order: 0,
          isMain: true,
          clips: [{ id: 'clip-video-db-id', uuid: 'clip-video-uuid', type: 'CutClip' }],
          height: 72,
          visible: true,
          locked: false,
          muted: false,
          createdAt: 0,
          updatedAt: 0,
        },
        'audio-1-uuid': {
          id: 'audio-1',
          uuid: 'audio-1-uuid',
          type: 'CutTrack',
          trackType: 'audio',
          name: 'audio-1',
          order: 1,
          isMain: false,
          clips: [{ id: 'clip-audio-db-id', uuid: 'clip-audio-uuid', type: 'CutClip' }],
          height: 72,
          visible: true,
          locked: false,
          muted: false,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      clips: {
        'clip-video-uuid': {
          ...videoClip,
          track: { id: 'video-1', uuid: 'video-1-uuid', type: 'CutTrack' },
          resource: { id: 'clip-video-resource-db-id', uuid: 'clip-video-resource-uuid', type: 'MediaResource' },
        },
        'clip-audio-uuid': {
          ...audioClip,
          track: { id: 'audio-1', uuid: 'audio-1-uuid', type: 'CutTrack' },
          resource: { id: 'clip-audio-resource-db-id', uuid: 'clip-audio-resource-uuid', type: 'MediaResource' },
        },
      },
      layers: {},
    };

    const result = resolveLinkedSelectionState({
      clipId: 'clip-video-db-id',
      state,
      linkedSelectionEnabled: true,
      multi: false,
      selectedClipId: null,
      selectedClipIds: new Set<string>(),
    });

    expect(result.selectedClipId).toBe('clip-video-uuid');
    expect(result.selectedTrackId).toBe('video-1-uuid');
    expect(result.selectedClipIds).toEqual(new Set(['clip-video-uuid', 'clip-audio-uuid']));
  });
});
