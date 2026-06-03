import { routeSpecs } from './registry/specs';
import type { RoutePreloadKey } from './registry/types';
import { matchRoutePrefix } from './routeMatching';

type PreloadLoader = () => Promise<unknown>;
const MAX_PRELOAD_KEYS_PER_ROUTE = 2;

const PRELOAD_LOADERS: Record<RoutePreloadKey, PreloadLoader> = {
  assets: () =>
    Promise.all([
      import('@sdkwork/magic-studio-assets/pages'),
      import('@sdkwork/magic-studio-assets/store'),
    ]),
  image: () =>
    Promise.all([
      import('@sdkwork/magic-studio-image/pages'),
      import('@sdkwork/magic-studio-image/store'),
      import('@sdkwork/magic-studio-image/panels'),
    ]),
  video: () =>
    Promise.all([
      import('@sdkwork/magic-studio-video/pages'),
      import('@sdkwork/magic-studio-video/store'),
      import('@sdkwork/magic-studio-video/panels'),
    ]),
  music: () =>
    Promise.all([
      import('@sdkwork/magic-studio-music/pages'),
      import('@sdkwork/magic-studio-music/store'),
      import('@sdkwork/magic-studio-music/panels'),
    ]),
  sfx: () =>
    Promise.all([
      import('@sdkwork/magic-studio-sfx/pages'),
      import('@sdkwork/magic-studio-sfx/store'),
      import('@sdkwork/magic-studio-sfx/panels'),
    ]),
  voice: () =>
    Promise.all([
      import('@sdkwork/magic-studio-voicespeaker/pages'),
      import('@sdkwork/magic-studio-voicespeaker/store'),
      import('@sdkwork/magic-studio-voicespeaker/panels'),
    ]),
  audio: () =>
    Promise.all([
      import('@sdkwork/magic-studio-audio/pages'),
      import('@sdkwork/magic-studio-audio/store'),
      import('@sdkwork/magic-studio-audio/panels'),
    ]),
  character: () =>
    Promise.all([
      import('@sdkwork/magic-studio-character/pages'),
      import('@sdkwork/magic-studio-character/store'),
      import('@sdkwork/magic-studio-character/panels'),
    ]),
  magiccut: () =>
    Promise.all([
      import('@sdkwork/magic-studio-magiccut/pages'),
      import('@sdkwork/magic-studio-magiccut/store'),
    ]),
  film: () => import('@sdkwork/magic-studio-film/pages'),
  'portal-video': () => import('@sdkwork/magic-studio-portal-video/pages'),
  skills: () => import('@sdkwork/magic-studio-skills/pages'),
  plugins: () => import('@sdkwork/magic-studio-plugins/pages'),
  editor: () =>
    Promise.all([
      import('@sdkwork/magic-studio-editor/pages'),
      import('@sdkwork/magic-studio-editor/store'),
    ]),
  drive: () => import('@sdkwork/magic-studio-drive/pages'),
  notes: () => import('@sdkwork/magic-studio-notes/pages'),
  chatppt: () =>
    Promise.all([
      import('@sdkwork/magic-studio-chatppt/pages'),
      import('@sdkwork/magic-studio-chatppt/store'),
      import('@sdkwork/magic-studio-chatppt/panels'),
    ]),
  canvas: () => import('@sdkwork/magic-studio-canvas/pages'),
  trade: () => import('@sdkwork/magic-studio-trade/pages')
};

const preloadedKeys = new Set<RoutePreloadKey>();

const routePreloadSpecs = routeSpecs.filter(
  (spec): spec is (typeof routeSpecs)[number] & { preload: readonly RoutePreloadKey[] } =>
    'preload' in spec && Array.isArray(spec.preload) && spec.preload.length > 0,
);

const resolvePreloadKeys = (currentPath: string): RoutePreloadKey[] => {
  for (const routeSpec of routePreloadSpecs) {
    if (matchRoutePrefix(routeSpec.path, currentPath)) {
      return routeSpec.preload.slice(0, MAX_PRELOAD_KEYS_PER_ROUTE);
    }
  }

  return [];
};

const preloadByKey = async (key: RoutePreloadKey): Promise<void> => {
  if (preloadedKeys.has(key)) {
    return;
  }
  preloadedKeys.add(key);
  try {
    await PRELOAD_LOADERS[key]();
  } catch {
    // Keep idempotent: allow retry on next route switch after transient failures.
    preloadedKeys.delete(key);
  }
};

type CancelFn = () => void;

export const scheduleRoutePreload = (currentPath: string): CancelFn => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const keys = resolvePreloadKeys(currentPath);
  if (keys.length === 0) {
    return () => undefined;
  }

  let cancelled = false;
  const preloadSequentially = async () => {
    for (const key of keys) {
      if (cancelled) {
        return;
      }

      await preloadByKey(key);
    }
  };

  const run = () => {
    if (cancelled) {
      return;
    }

    void preloadSequentially();
  };

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof win.requestIdleCallback === 'function') {
    const idleId = win.requestIdleCallback(run, { timeout: 1200 });
    return () => {
      cancelled = true;
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
    };
  }

  const timerId = window.setTimeout(run, 240);
  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
  };
};
