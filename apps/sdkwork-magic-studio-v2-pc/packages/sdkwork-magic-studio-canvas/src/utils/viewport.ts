import type { Viewport } from '../entities';

interface ScreenPoint {
  x: number;
  y: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface ZoomViewportAroundPointOptions {
  viewport: Viewport;
  nextZoom: number;
  screenPoint: ScreenPoint;
}

interface ZoomViewportAtCenterOptions {
  viewport: Viewport;
  nextZoom: number;
  viewportSize: ViewportSize;
}

interface CenterViewportOnWorldPointOptions {
  worldPoint: {
    x: number;
    y: number;
  };
  viewportSize: ViewportSize;
  zoom: number;
}

export const MIN_CANVAS_ZOOM = 0.1;
export const MAX_CANVAS_ZOOM = 5;

export const clampCanvasZoom = (
  zoom: number,
  minZoom = MIN_CANVAS_ZOOM,
  maxZoom = MAX_CANVAS_ZOOM
): number => {
  if (!Number.isFinite(zoom)) {
    return minZoom;
  }
  return Math.min(maxZoom, Math.max(minZoom, zoom));
};

export const zoomViewportAroundPoint = (
  options: ZoomViewportAroundPointOptions
): Viewport => {
  const { viewport, nextZoom, screenPoint } = options;
  const zoom = clampCanvasZoom(nextZoom);

  const worldX = (screenPoint.x - viewport.x) / viewport.zoom;
  const worldY = (screenPoint.y - viewport.y) / viewport.zoom;

  return {
    x: screenPoint.x - worldX * zoom,
    y: screenPoint.y - worldY * zoom,
    zoom
  };
};

export const zoomViewportAtCenter = (
  options: ZoomViewportAtCenterOptions
): Viewport => {
  const { viewport, nextZoom, viewportSize } = options;
  return zoomViewportAroundPoint({
    viewport,
    nextZoom,
    screenPoint: {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2
    }
  });
};

export const centerViewportOnWorldPoint = (
  options: CenterViewportOnWorldPointOptions
): Viewport => {
  const { worldPoint, viewportSize, zoom } = options;
  const clampedZoom = clampCanvasZoom(zoom);
  return {
    x: viewportSize.width / 2 - worldPoint.x * clampedZoom,
    y: viewportSize.height / 2 - worldPoint.y * clampedZoom,
    zoom: clampedZoom
  };
};
