import { describe, expect, it } from 'vitest';

import type { AnyMediaResource } from '@sdkwork/react-commons';
import type { CutClip, CutTrack } from '../src/entities';
import {
  findEffectTargetClip,
  findTransitionTarget,
} from '../src/domain/effects/effectPlacement';

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

describe('effectPlacement', () => {
  it('prefers a clip under the cursor on the hinted visual track for effect drops', () => {
    const tracks = [
      makeTrack('track-a', 'video', ['clip-a']),
      makeTrack('track-b', 'video', ['clip-b']),
    ];
    const clips = {
      'clip-a': makeClip('clip-a', 'track-a', 'res-a', 0, 5),
      'clip-b': makeClip('clip-b', 'track-b', 'res-b', 0, 5),
    };
    const resources = {
      'res-a': makeResource('res-a', 'VIDEO'),
      'res-b': makeResource('res-b', 'VIDEO'),
    };

    expect(
      findEffectTargetClip({
        time: 2,
        preferredTrackId: 'track-b',
        tracks,
        clips,
        resources,
      })
    ).toBe('clip-b');
  });

  it('finds a cut boundary with adjacent visual clips for transition application', () => {
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
      findTransitionTarget({
        time: 5.02,
        preferredTrackId: 'track-a',
        tolerance: 0.1,
        tracks,
        clips,
        resources,
      })
    ).toEqual({
      fromClipId: 'clip-a',
      toClipId: 'clip-b',
    });
  });
});
