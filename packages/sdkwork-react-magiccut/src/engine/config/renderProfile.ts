export type RenderRuntime = 'web' | 'desktop';

export interface RenderRuntimeProfile {
  runtime: RenderRuntime;
  maxCanvasDpr: number;
  maxCanvasEdge: number;
  maxVideoElements: number;
  videoPreload: 'auto' | 'metadata';
  desynchronizedCanvas: boolean;
  powerPreference: WebGLPowerPreference;
}

const WEB_PROFILE: RenderRuntimeProfile = {
  runtime: 'web',
  maxCanvasDpr: 1.75,
  maxCanvasEdge: 4096,
  maxVideoElements: 10,
  videoPreload: 'metadata',
  desynchronizedCanvas: true,
  powerPreference: 'high-performance',
};

const DESKTOP_PROFILE: RenderRuntimeProfile = {
  runtime: 'desktop',
  maxCanvasDpr: 2.25,
  maxCanvasEdge: 5120,
  maxVideoElements: 18,
  videoPreload: 'auto',
  desynchronizedCanvas: true,
  powerPreference: 'high-performance',
};

export interface ResolveCanvasBackingStoreSizeOptions {
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
  profile: RenderRuntimeProfile;
}

export interface CanvasBackingStoreSize {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export const detectRenderRuntime = (): RenderRuntime => {
  if (typeof window === 'undefined') {
    return 'web';
  }

  const runtimeWindow = window as Window & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  };

  if (runtimeWindow.__TAURI__ || runtimeWindow.__TAURI_INTERNALS__) {
    return 'desktop';
  }

  return 'web';
};

export const resolveRenderRuntimeProfile = (
  runtime: RenderRuntime = detectRenderRuntime()
): RenderRuntimeProfile => {
  return runtime === 'desktop' ? DESKTOP_PROFILE : WEB_PROFILE;
};

export const resolveCanvasBackingStoreSize = ({
  cssWidth,
  cssHeight,
  devicePixelRatio,
  profile,
}: ResolveCanvasBackingStoreSizeOptions): CanvasBackingStoreSize => {
  const safeCssWidth = Math.max(1, cssWidth);
  const safeCssHeight = Math.max(1, cssHeight);
  const cappedDpr = Math.max(1, Math.min(devicePixelRatio || 1, profile.maxCanvasDpr));

  let width = Math.max(1, Math.round(safeCssWidth * cappedDpr));
  let height = Math.max(1, Math.round(safeCssHeight * cappedDpr));

  const largestEdge = Math.max(width, height);
  if (largestEdge > profile.maxCanvasEdge) {
    const edgeScale = profile.maxCanvasEdge / largestEdge;
    width = Math.max(1, Math.round(width * edgeScale));
    height = Math.max(1, Math.round(height * edgeScale));
  }

  return {
    width,
    height,
    devicePixelRatio: Math.min(width / safeCssWidth, height / safeCssHeight),
  };
};
