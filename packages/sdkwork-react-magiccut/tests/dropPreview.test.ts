import { describe, expect, it } from 'vitest';

import type { AnyMediaResource } from '@sdkwork/react-commons';
import type { CutClip, CutTrack } from '../src/entities';
import {
  resolveResourceDropPreview,
} from '../src/domain/dnd/dropPreview';

const makeTrack = (id: string, trackType: CutTrack['trackType'], clipIds: string[]): CutTrack => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutTrack',
  trackType,
  name: id,
  order: 0,
  clips: clipIds.map((clipId) => ({ id: clipId, type: 'CutClip', uuid: `${clipId}-uuid` })),
  visible: true,
  locked: false,
  muted: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const makeClip = (
  id: string,
  trackId: string,
  resourceId: string,
  start: number,
  duration: number
): CutClip => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutClip',
  track: { id: trackId, type: 'CutTrack', uuid: `${trackId}-uuid` },
  resource: { id: resourceId, type: 'MediaResource', uuid: `${resourceId}-uuid` },
  start,
  duration,
  layers: [],
  speed: 1,
  volume: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const makeResource = (id: string, type: AnyMediaResource['type']): AnyMediaResource =>
  ({
    id,
    uuid: `${id}-uuid`,
    name: id,
    type,
    path: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }) as AnyMediaResource;

describe('dropPreview', () => {
  it('returns clip bounds for effect drop previews', () => {
    const tracks = [makeTrack('track-a', 'video', ['clip-a'])];
    const clips = {
      'clip-a': makeClip('clip-a', 'track-a', 'res-a', 2, 5),
    };
    const resources = {
      'res-a': makeResource('res-a', 'VIDEO'),
    };

    expect(
      resolveResourceDropPreview({
        resourceType: 'EFFECT',
        time: 4,
        preferredTrackId: 'track-a',
        tracks,
        clips,
        resources,
      })
    ).toEqual({
      kind: 'effect',
      clipId: 'clip-a',
      trackId: 'track-a',
      start: 2,
      end: 7,
    });
  });

  it('returns the cut boundary and both clips for transition drop previews', () => {
    const tracks = [makeTrack('track-a', 'video', ['clip-a', 'clip-b'])];
    const clips = {
      'clip-a': makeClip('clip-a', 'track-a', 'res-a', 0, 5),
      'clip-b': makeClip('clip-b', 'track-a', 'res-b', 5, 4),
    };
    const resources = {
      'res-a': makeResource('res-a', 'VIDEO'),
      'res-b': makeResource('res-b', 'VIDEO'),
    };

    expect(
      resolveResourceDropPreview({
        resourceType: 'TRANSITION',
        time: 5.01,
        preferredTrackId: 'track-a',
        tracks,
        clips,
        resources,
      })
    ).toEqual({
      kind: 'transition',
      fromClipId: 'clip-a',
      toClipId: 'clip-b',
      trackId: 'track-a',
      boundaryTime: 5,
    });
  });

  it('returns null when the pointer is not over a valid effect or transition target', () => {
    const tracks = [makeTrack('track-a', 'video', ['clip-a'])];
    const clips = {
      'clip-a': makeClip('clip-a', 'track-a', 'res-a', 0, 3),
    };
    const resources = {
      'res-a': makeResource('res-a', 'VIDEO'),
    };

    expect(
      resolveResourceDropPreview({
        resourceType: 'EFFECT',
        time: 10,
        preferredTrackId: 'track-a',
        tracks,
        clips,
        resources,
      })
    ).toBeNull();
  });
});
