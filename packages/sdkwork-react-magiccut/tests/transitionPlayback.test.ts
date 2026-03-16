import { describe, expect, it } from 'vitest';

import {
  buildIncomingTransitionLeadIns,
  clampTimelineTimeToClipStart,
  resolveClipActivationStart,
} from '../src/domain/playback/transitionPlayback';
import type { CutClip, CutLayer, CutTrack } from '../src/entities/magicCut.entity';

const createTrack = (clipIds: string[]): CutTrack => ({
  id: 'track-video',
  uuid: 'track-video-uuid',
  type: 'CutTrack',
  trackType: 'video',
  order: 0,
  clips: clipIds.map((id) => ({ id, uuid: `${id}-uuid`, type: 'CutClip' })),
  createdAt: 0,
  updatedAt: 0,
});

const createClip = (id: string, start: number, duration: number): CutClip => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutClip',
  track: { id: 'track-video', uuid: 'track-video-uuid', type: 'CutTrack' },
  resource: { id: `${id}-resource`, uuid: `${id}-resource-uuid`, type: 'MediaResource' },
  start,
  duration,
  offset: 0,
  speed: 1,
  volume: 1,
  layers: [],
  createdAt: 0,
  updatedAt: 0,
});

const createTransitionLayer = (clipId: string, nextClipId: string, duration: number): CutLayer => ({
  id: `transition-${clipId}`,
  uuid: `transition-${clipId}-uuid`,
  type: 'CutLayer',
  clip: { id: clipId, uuid: `${clipId}-uuid`, type: 'CutClip' },
  layerType: 'transition_out',
  enabled: true,
  order: 0,
  params: {
    definitionId: 'cross-dissolve',
    duration,
    nextClipId,
  },
  createdAt: 0,
  updatedAt: 0,
});

describe('buildIncomingTransitionLeadIns', () => {
  it('maps each target clip to the incoming transition duration on its track', () => {
    const clipA = createClip('clip-a', 0, 6);
    const clipB = createClip('clip-b', 6, 4);
    const clipC = createClip('clip-c', 10, 5);
    const transitionAB = createTransitionLayer(clipA.id, clipB.id, 1.2);
    const transitionBC = createTransitionLayer(clipB.id, clipC.id, 0.35);

    clipA.layers = [{ id: transitionAB.id, uuid: transitionAB.uuid, type: 'CutLayer' }];
    clipB.layers = [{ id: transitionBC.id, uuid: transitionBC.uuid, type: 'CutLayer' }];

    const leadIns = buildIncomingTransitionLeadIns({
      track: createTrack([clipA.id, clipB.id, clipC.id]),
      clips: {
        [clipA.id]: clipA,
        [clipB.id]: clipB,
        [clipC.id]: clipC,
      },
      layers: {
        [transitionAB.id]: transitionAB,
        [transitionBC.id]: transitionBC,
      },
    });

    expect(leadIns).toEqual(
      new Map([
        [clipB.id, 1.2],
        [clipC.id, 0.35],
      ])
    );
  });
});

describe('resolveClipActivationStart', () => {
  it('extends activation by the full incoming transition when it exceeds the default lookahead', () => {
    expect(
      resolveClipActivationStart({
        clipStart: 10,
        incomingTransitionLeadIn: 1.25,
        defaultLookahead: 0.5,
      })
    ).toBe(8.75);
  });

  it('keeps the default lookahead when no longer transition lead-in exists', () => {
    expect(
      resolveClipActivationStart({
        clipStart: 10,
        incomingTransitionLeadIn: 0.2,
        defaultLookahead: 0.5,
      })
    ).toBe(9.5);
  });
});

describe('clampTimelineTimeToClipStart', () => {
  it('clamps pre-roll transition sampling to the first frame of the incoming clip', () => {
    expect(clampTimelineTimeToClipStart(9.4, 10)).toBe(10);
    expect(clampTimelineTimeToClipStart(10.6, 10)).toBe(10.6);
  });
});
