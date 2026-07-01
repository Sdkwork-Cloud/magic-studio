import { describe, expect, it } from 'vitest';

import {
  MINIMAP_MIN_VIEWPORT_WIDTH,
  resolveMinimapScrollLeft,
  resolveMinimapTimeX,
  resolveMinimapViewport,
} from '../src/domain/timeline/minimap';

describe('resolveMinimapViewport', () => {
  it('maps the visible timeline range into a minimap lens', () => {
    const viewport = resolveMinimapViewport({
      totalDuration: 120,
      pixelsPerSecond: 60,
      containerWidth: 600,
      scrollLeft: 900,
      minimapWidth: 300,
    });

    expect(viewport.visibleStartTime).toBe(15);
    expect(viewport.visibleEndTime).toBe(25);
    expect(viewport.width).toBe(MINIMAP_MIN_VIEWPORT_WIDTH);
    expect(viewport.x).toBeCloseTo(36.54545454545454);
    expect(viewport.safeTotalDuration).toBe(120);
  });

  it('enforces a minimum lens width while preserving full scroll coverage', () => {
    expect(
      resolveMinimapViewport({
        totalDuration: 300,
        pixelsPerSecond: 300,
        containerWidth: 300,
        scrollLeft: 89700,
        minimapWidth: 240,
      })
    ).toMatchObject({
      visibleStartTime: 299,
      visibleEndTime: 300,
      x: 208,
      width: MINIMAP_MIN_VIEWPORT_WIDTH,
      safeTotalDuration: 300,
    });
  });
});

describe('resolveMinimapScrollLeft', () => {
  it('centers the viewport around a direct click on the minimap', () => {
    expect(
      resolveMinimapScrollLeft({
        pointerX: 150,
        dragOffsetX: MINIMAP_MIN_VIEWPORT_WIDTH / 2,
        totalDuration: 120,
        pixelsPerSecond: 60,
        containerWidth: 600,
        minimapWidth: 300,
      })
    ).toBe(3300);
  });

  it('clamps navigation to the end of the scrollable timeline', () => {
    expect(
      resolveMinimapScrollLeft({
        pointerX: 239,
        dragOffsetX: MINIMAP_MIN_VIEWPORT_WIDTH / 2,
        totalDuration: 300,
        pixelsPerSecond: 300,
        containerWidth: 300,
        minimapWidth: 240,
      })
    ).toBe(89700);
  });
});

describe('resolveMinimapTimeX', () => {
  it('converts project time into a clamped minimap position', () => {
    expect(resolveMinimapTimeX(30, 120, 300)).toBe(75);
    expect(resolveMinimapTimeX(200, 120, 300)).toBe(300);
  });
});
