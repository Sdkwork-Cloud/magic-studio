import { describe, expect, it } from 'vitest';
import { MediaResourceType } from '@sdkwork/react-commons';

import { ClipTrimStrategy } from '../src/components/Timeline/dnd/strategies/ClipTrimStrategy';
import type { DragContext, DragInput } from '../src/components/Timeline/dnd/types';
import type { CutClip } from '../src/entities/magicCut.entity';

const createInput = (time: number): DragInput => ({
  clientX: time * 100,
  clientY: 0,
  containerRect: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect,
  scrollLeft: 0,
  scrollTop: 0,
  pixelsPerSecond: 100,
});

const context: DragContext = {
  tracks: [],
  trackLayouts: [],
  clipsMap: {},
  getResource: () => undefined,
  validateTrackDrop: () => true,
  checkCollision: () => false,
  calculateSnap: (time) => ({ time, lines: [] }),
};

const baseClip: CutClip = {
  id: 'clip-1',
  uuid: 'clip-1',
  type: 'CutClip',
  track: { id: 'track-1', uuid: 'track-1', type: 'CutTrack' },
  resource: { id: 'resource-1', uuid: 'resource-1', type: 'MediaResource' },
  start: 10,
  duration: 5,
  offset: 2,
  speed: 2,
  volume: 1,
  layers: [],
  createdAt: 0,
  updatedAt: 0,
};

describe('ClipTrimStrategy', () => {
  it('clamps trim-start dragging using source offset divided by clip speed', () => {
    const strategy = new ClipTrimStrategy(
      baseClip,
      {
        id: 'resource-1',
        uuid: 'resource-1',
        type: MediaResourceType.VIDEO,
        name: 'video.mp4',
        duration: 12,
        createdAt: 0,
        updatedAt: 0,
      },
      'trim-start',
      {
        startTime: 10,
        duration: 5,
        offset: 2,
      }
    );

    const result = strategy.calculate(createInput(8), context);

    expect(result.time).toBe(9);
  });

  it('clamps trim-end dragging using speed-adjusted required source duration', () => {
    const strategy = new ClipTrimStrategy(
      baseClip,
      {
        id: 'resource-1',
        uuid: 'resource-1',
        type: MediaResourceType.VIDEO,
        name: 'video.mp4',
        duration: 9,
        createdAt: 0,
        updatedAt: 0,
      },
      'trim-end',
      {
        startTime: 10,
        duration: 5,
        offset: 2,
      }
    );

    const result = strategy.calculate(createInput(16), context);

    expect(result.time).toBe(13.5);
  });
});
