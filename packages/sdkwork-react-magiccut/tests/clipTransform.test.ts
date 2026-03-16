import { describe, expect, it } from 'vitest';

import {
  normalizeClipTransform,
  resolveClipTransformScaleFactors,
  toggleClipTransformFlip,
} from '../src/domain/transform/clipTransform';

describe('normalizeClipTransform', () => {
  it('fills in axis scale defaults for legacy transforms', () => {
    expect(
      normalizeClipTransform({
        x: 12,
        y: 20,
        width: 320,
        height: 180,
        rotation: 15,
        scale: 1.25,
        opacity: 0.8,
      })
    ).toMatchObject({
      x: 12,
      y: 20,
      width: 320,
      height: 180,
      rotation: 15,
      scale: 1.25,
      scaleX: 1,
      scaleY: 1,
      opacity: 0.8,
    });
  });
});

describe('toggleClipTransformFlip', () => {
  it('toggles horizontal flip by inverting the x-axis scale only', () => {
    expect(
      toggleClipTransformFlip(
        {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
          scale: 1.5,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
        },
        'horizontal'
      )
    ).toMatchObject({
      scale: 1.5,
      scaleX: -1,
      scaleY: 1,
    });
  });

  it('toggles vertical flip by inverting the y-axis scale only', () => {
    expect(
      toggleClipTransformFlip(
        {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
          scale: 1,
          scaleX: -1,
          scaleY: 1,
          opacity: 1,
        },
        'vertical'
      )
    ).toMatchObject({
      scaleX: -1,
      scaleY: -1,
    });
  });
});

describe('resolveClipTransformScaleFactors', () => {
  it('combines uniform scale with axis scale to produce render factors', () => {
    expect(
      resolveClipTransformScaleFactors({
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        rotation: 0,
        scale: 1.5,
        scaleX: -1,
        scaleY: 0.5,
        opacity: 1,
      })
    ).toEqual({
      scaleX: -1,
      scaleY: 0.5,
      effectiveScaleX: -1.5,
      effectiveScaleY: 0.75,
      maxAbsScale: 1.5,
    });
  });
});
