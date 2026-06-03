import { describe, expect, it } from 'vitest';

import type { AnyMediaResource } from '@sdkwork/magic-studio-commons';
import { resolveEntityKey } from '@sdkwork/magic-studio-types';
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
    const track = makeTrack('track-a', 'video', ['clip-a']);
    const clip = makeClip('clip-a', 'track-a', 'res-a', 2, 5);
    const resource = makeResource('res-a', 'VIDEO');
    const tracks = [track];
    const clips = {
      [resolveEntityKey(clip)]: clip,
    };
    const resources = {
      [resolveEntityKey(resource)]: resource,
    };

    expect(
      resolveResourceDropPreview({
        resourceType: 'EFFECT',
        time: 4,
        preferredTrackId: resolveEntityKey(track),
        tracks,
        clips,
        resources,
      })
    ).toEqual({
      kind: 'effect',
      clipId: resolveEntityKey(clip),
      trackId: resolveEntityKey(track),
      start: 2,
      end: 7,
    });
  });

  it('returns the cut boundary and both clips for transition drop previews', () => {
    const track = makeTrack('track-a', 'video', ['clip-a', 'clip-b']);
    const clipA = makeClip('clip-a', 'track-a', 'res-a', 0, 5);
    const clipB = makeClip('clip-b', 'track-a', 'res-b', 5, 4);
    const resourceA = makeResource('res-a', 'VIDEO');
    const resourceB = makeResource('res-b', 'VIDEO');
    const tracks = [track];
    const clips = {
      [resolveEntityKey(clipA)]: clipA,
      [resolveEntityKey(clipB)]: clipB,
    };
    const resources = {
      [resolveEntityKey(resourceA)]: resourceA,
      [resolveEntityKey(resourceB)]: resourceB,
    };

    expect(
      resolveResourceDropPreview({
        resourceType: 'TRANSITION',
        time: 5.01,
        preferredTrackId: resolveEntityKey(track),
        tracks,
        clips,
        resources,
      })
    ).toEqual({
      kind: 'transition',
      fromClipId: resolveEntityKey(clipA),
      toClipId: resolveEntityKey(clipB),
      trackId: resolveEntityKey(track),
      boundaryTime: 5,
    });
  });

  it('returns null when the pointer is not over a valid effect or transition target', () => {
    const track = makeTrack('track-a', 'video', ['clip-a']);
    const clip = makeClip('clip-a', 'track-a', 'res-a', 0, 3);
    const resource = makeResource('res-a', 'VIDEO');
    const tracks = [track];
    const clips = {
      [resolveEntityKey(clip)]: clip,
    };
    const resources = {
      [resolveEntityKey(resource)]: resource,
    };

    expect(
      resolveResourceDropPreview({
        resourceType: 'EFFECT',
        time: 10,
        preferredTrackId: resolveEntityKey(track),
        tracks,
        clips,
        resources,
      })
    ).toBeNull();
  });
});
