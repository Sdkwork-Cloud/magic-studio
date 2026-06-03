import { describe, expect, it } from 'vitest';
import {
  centerViewportOnWorldPoint,
  clampCanvasZoom,
  zoomViewportAroundPoint,
  zoomViewportAtCenter
} from './viewport';

describe('viewport helpers', () => {
  it('clamps zoom into the supported canvas range', () => {
    expect(clampCanvasZoom(0.01)).toBe(0.1);
    expect(clampCanvasZoom(10)).toBe(5);
    expect(clampCanvasZoom(1.25)).toBe(1.25);
  });

  it('keeps the anchored world point stable while zooming around a screen point', () => {
    const viewport = { x: 120, y: -80, zoom: 1 };
    const anchor = { x: 360, y: 240 };

    const anchoredWorldX = (anchor.x - viewport.x) / viewport.zoom;
    const anchoredWorldY = (anchor.y - viewport.y) / viewport.zoom;

    const nextViewport = zoomViewportAroundPoint({
      viewport,
      nextZoom: 2,
      screenPoint: anchor
    });

    expect(nextViewport.zoom).toBe(2);
    expect((anchor.x - nextViewport.x) / nextViewport.zoom).toBeCloseTo(anchoredWorldX);
    expect((anchor.y - nextViewport.y) / nextViewport.zoom).toBeCloseTo(anchoredWorldY);
  });

  it('zooms around the viewport center for toolbar controls', () => {
    const viewport = { x: 40, y: 60, zoom: 1 };
    const viewportSize = { width: 800, height: 600 };
    const center = { x: viewportSize.width / 2, y: viewportSize.height / 2 };

    const anchoredWorldX = (center.x - viewport.x) / viewport.zoom;
    const anchoredWorldY = (center.y - viewport.y) / viewport.zoom;

    const nextViewport = zoomViewportAtCenter({
      viewport,
      nextZoom: 1.5,
      viewportSize
    });

    expect((center.x - nextViewport.x) / nextViewport.zoom).toBeCloseTo(anchoredWorldX);
    expect((center.y - nextViewport.y) / nextViewport.zoom).toBeCloseTo(anchoredWorldY);
  });

  it('centers the viewport on a world point', () => {
    const viewport = centerViewportOnWorldPoint({
      worldPoint: { x: 320, y: 180 },
      viewportSize: { width: 1280, height: 720 },
      zoom: 2
    });

    expect(viewport).toEqual({
      x: 0,
      y: 0,
      zoom: 2
    });
  });
});
