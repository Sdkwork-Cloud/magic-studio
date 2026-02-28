import { ROUTES } from './routes';

type RoutePreloadKey =
  | 'assets'
  | 'image'
  | 'video'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'audio'
  | 'character'
  | 'magiccut'
  | 'film'
  | 'portal-video'
  | 'skills'
  | 'plugins'
  | 'editor'
  | 'drive'
  | 'notes'
  | 'chatppt'
  | 'canvas'
  | 'trade';

type PreloadLoader = () => Promise<unknown>;

const PRELOAD_LOADERS: Record<RoutePreloadKey, PreloadLoader> = {
  assets: () => import('@sdkwork/react-assets'),
  image: () => import('@sdkwork/react-image'),
  video: () => import('@sdkwork/react-video'),
  music: () => import('@sdkwork/react-music'),
  sfx: () => import('@sdkwork/react-sfx'),
  voice: () => import('@sdkwork/react-voicespeaker'),
  audio: () => import('@sdkwork/react-audio'),
  character: () => import('@sdkwork/react-character'),
  magiccut: () => import('@sdkwork/react-magiccut'),
  film: () => import('@sdkwork/react-film'),
  'portal-video': () => import('@sdkwork/react-portal-video'),
  skills: () => import('@sdkwork/react-skills'),
  plugins: () => import('@sdkwork/react-plugins'),
  editor: () => import('@sdkwork/react-editor'),
  drive: () => import('@sdkwork/react-drive'),
  notes: () => import('@sdkwork/react-notes'),
  chatppt: () => import('@sdkwork/react-chatppt'),
  canvas: () => import('@sdkwork/react-canvas'),
  trade: () => import('@sdkwork/react-trade')
};

const preloadedKeys = new Set<RoutePreloadKey>();

const normalizePath = (path: string): string => {
  const trimmed = (path || '').trim();
  if (!trimmed) {
    return ROUTES.HOME;
  }
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
};

const isRoute = (currentPath: string, routePrefix: string): boolean => {
  const current = normalizePath(currentPath);
  const prefix = normalizePath(routePrefix);
  return current === prefix || current.startsWith(`${prefix}/`);
};

const resolvePreloadKeys = (currentPath: string): RoutePreloadKey[] => {
  if (isRoute(currentPath, ROUTES.PORTAL)) {
    return ['portal-video', 'skills', 'plugins', 'film'];
  }
  if (isRoute(currentPath, ROUTES.FILM)) {
    return ['assets', 'image', 'video', 'magiccut'];
  }
  if (isRoute(currentPath, ROUTES.MAGIC_CUT)) {
    return ['assets', 'video', 'audio', 'music'];
  }
  if (isRoute(currentPath, ROUTES.ASSETS)) {
    return ['image', 'video', 'magiccut'];
  }
  if (isRoute(currentPath, ROUTES.IMAGE)) {
    return ['video', 'assets', 'magiccut'];
  }
  if (isRoute(currentPath, ROUTES.VIDEO)) {
    return ['image', 'assets', 'magiccut'];
  }
  if (
    isRoute(currentPath, ROUTES.MUSIC) ||
    isRoute(currentPath, ROUTES.AUDIO) ||
    isRoute(currentPath, ROUTES.SFX) ||
    isRoute(currentPath, ROUTES.VOICE)
  ) {
    return ['assets', 'magiccut', 'video'];
  }
  if (isRoute(currentPath, ROUTES.CHARACTER)) {
    return ['voice', 'video', 'assets'];
  }
  if (isRoute(currentPath, ROUTES.NOTES)) {
    return ['assets', 'image', 'drive'];
  }
  if (isRoute(currentPath, ROUTES.DRIVE)) {
    return ['editor', 'assets', 'notes'];
  }
  if (isRoute(currentPath, ROUTES.EDITOR)) {
    return ['drive', 'assets', 'notes', 'chatppt'];
  }
  if (isRoute(currentPath, ROUTES.CHAT_PPT)) {
    return ['editor', 'drive', 'canvas'];
  }
  if (isRoute(currentPath, ROUTES.TASK_MARKET) || isRoute(currentPath, ROUTES.MY_TASKS)) {
    return ['portal-video', 'film', 'assets'];
  }
  if (isRoute(currentPath, ROUTES.HOME)) {
    return ['editor', 'assets', 'portal-video'];
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
  const run = () => {
    if (cancelled) {
      return;
    }
    for (const key of keys) {
      void preloadByKey(key);
    }
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

