import { describe, expect, it } from 'vitest';

import {
  resolveCanvasBackingStoreSize,
  resolveRenderRuntimeProfile,
} from '../src/engine/config/renderProfile';

describe('resolveRenderRuntimeProfile', () => {
  it('uses a more conservative browser profile than desktop', () => {
    const browser = resolveRenderRuntimeProfile('browser');
    const desktop = resolveRenderRuntimeProfile('desktop');

    expect(browser.maxCanvasDpr).toBeLessThan(desktop.maxCanvasDpr);
    expect(browser.maxCanvasEdge).toBeLessThan(desktop.maxCanvasEdge);
    expect(browser.maxVideoElements).toBeLessThan(desktop.maxVideoElements);
    expect(browser.videoPreload).toBe('metadata');
    expect(desktop.videoPreload).toBe('auto');
  });

  it('caps browser backing store size by the browser profile dpr limit', () => {
    const size = resolveCanvasBackingStoreSize({
      cssWidth: 1800,
      cssHeight: 1012.5,
      devicePixelRatio: 3,
      profile: resolveRenderRuntimeProfile('browser'),
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
