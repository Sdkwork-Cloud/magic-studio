export const MINIMAP_MIN_VIEWPORT_WIDTH = 32;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface MinimapTimingInput {
  totalDuration: number;
  pixelsPerSecond: number;
  containerWidth: number;
}

export interface MinimapViewportInput extends MinimapTimingInput {
  scrollLeft: number;
  minimapWidth: number;
  minViewportWidth?: number;
}

export interface MinimapViewport {
  visibleStartTime: number;
  visibleEndTime: number;
  visibleDuration: number;
  safeTotalDuration: number;
  x: number;
  width: number;
}

const resolveMinimapTiming = ({
  totalDuration,
  pixelsPerSecond,
  containerWidth,
}: MinimapTimingInput) => {
  const visibleDuration =
    pixelsPerSecond > 0 && containerWidth > 0
      ? containerWidth / pixelsPerSecond
      : 0;
  const safeTotalDuration = Math.max(totalDuration, visibleDuration, 1);
  const maxStartTime = Math.max(0, safeTotalDuration - visibleDuration);

  return {
    visibleDuration,
    safeTotalDuration,
    maxStartTime,
  };
};

export const resolveMinimapViewport = ({
  totalDuration,
  pixelsPerSecond,
  containerWidth,
  scrollLeft,
  minimapWidth,
  minViewportWidth = MINIMAP_MIN_VIEWPORT_WIDTH,
}: MinimapViewportInput): MinimapViewport => {
  const { visibleDuration, safeTotalDuration, maxStartTime } = resolveMinimapTiming({
    totalDuration,
    pixelsPerSecond,
    containerWidth,
  });
  const visibleStartTime =
    pixelsPerSecond > 0 ? clamp(scrollLeft / pixelsPerSecond, 0, maxStartTime) : 0;
  const rawWidth =
    safeTotalDuration > 0 ? (visibleDuration / safeTotalDuration) * minimapWidth : minimapWidth;
  const width = clamp(rawWidth, Math.min(minViewportWidth, minimapWidth), minimapWidth);
  const maxX = Math.max(0, minimapWidth - width);
  const x = maxStartTime > 0 && maxX > 0 ? (visibleStartTime / maxStartTime) * maxX : 0;

  return {
    visibleStartTime,
    visibleEndTime: Math.min(safeTotalDuration, visibleStartTime + visibleDuration),
    visibleDuration,
    safeTotalDuration,
    x,
    width,
  };
};

interface ResolveMinimapScrollLeftInput extends MinimapTimingInput {
  pointerX: number;
  dragOffsetX: number;
  minimapWidth: number;
  minViewportWidth?: number;
}

export const resolveMinimapScrollLeft = ({
  pointerX,
  dragOffsetX,
  totalDuration,
  pixelsPerSecond,
  containerWidth,
  minimapWidth,
  minViewportWidth = MINIMAP_MIN_VIEWPORT_WIDTH,
}: ResolveMinimapScrollLeftInput): number => {
  const viewport = resolveMinimapViewport({
    totalDuration,
    pixelsPerSecond,
    containerWidth,
    scrollLeft: 0,
    minimapWidth,
    minViewportWidth,
  });
  const maxX = Math.max(0, minimapWidth - viewport.width);
  const maxStartTime = Math.max(0, viewport.safeTotalDuration - viewport.visibleDuration);
  const lensLeft = clamp(pointerX - dragOffsetX, 0, maxX);
  const visibleStartTime = maxX > 0 ? (lensLeft / maxX) * maxStartTime : 0;

  return visibleStartTime * pixelsPerSecond;
};

export const resolveMinimapTimeX = (
  time: number,
  safeTotalDuration: number,
  minimapWidth: number
) => clamp((time / Math.max(safeTotalDuration, 1)) * minimapWidth, 0, minimapWidth);
