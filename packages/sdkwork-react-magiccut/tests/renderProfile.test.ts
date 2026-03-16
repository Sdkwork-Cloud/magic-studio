import { describe, expect, it } from 'vitest';

import {
  resolveCanvasBackingStoreSize,
  resolveRenderRuntimeProfile,
} from '../src/engine/config/renderProfile';

describe('resolveRenderRuntimeProfile', () => {
  it('uses a more conservative browser profile than desktop', () => {
    const web = resolveRenderRuntimeProfile('web');
    const desktop = resolveRenderRuntimeProfile('desktop');

    expect(web.maxCanvasDpr).toBeLessThan(desktop.maxCanvasDpr);
    expect(web.maxCanvasEdge).toBeLessThan(desktop.maxCanvasEdge);
    expect(web.maxVideoElements).toBeLessThan(desktop.maxVideoElements);
    expect(web.videoPreload).toBe('metadata');
    expect(desktop.videoPreload).toBe('auto');
  });

  it('caps browser backing store size by the browser profile dpr limit', () => {
    const size = resolveCanvasBackingStoreSize({
      cssWidth: 1800,
      cssHeight: 1012.5,
      devicePixelRatio: 3,
      profile: resolveRenderRuntimeProfile('web'),
    });

    expect(size.width).toBe(3150);
    expect(size.height).toBe(1772);
    expect(size.devicePixelRatio).toBeCloseTo(1.75, 3);
  });

  it('downscales oversized desktop stages to stay within the configured edge budget', () => {
    const profile = resolveRenderRuntimeProfile('desktop');
    const size = resolveCanvasBackingStoreSize({
      cssWidth: 2800,
      cssHeight: 1575,
      devicePixelRatio: 2.5,
      profile,
    });

    expect(size.width).toBe(profile.maxCanvasEdge);
    expect(size.height).toBe(2880);
    expect(size.devicePixelRatio).toBeCloseTo(1.8285, 3);
  });
});
