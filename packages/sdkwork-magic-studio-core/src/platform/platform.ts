import type { PlatformAPI } from './types';
import { webPlatform } from './web';
import { createDesktopPlatform } from './desktop';

export const isDesktopShellRuntime =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const getPlatformImpl = (): PlatformAPI => {
  if (isDesktopShellRuntime) {
    return createDesktopPlatform();
  }
  return webPlatform;
};

let currentPlatformApi: PlatformAPI | null = null;

const ensurePlatformApi = (): PlatformAPI => {
  if (!currentPlatformApi) {
    currentPlatformApi = getPlatformImpl();
  }
  return currentPlatformApi;
};

export const getPlatformApi = (): PlatformAPI => ensurePlatformApi();

export const configurePlatformApi = (api: PlatformAPI): PlatformAPI => {
  currentPlatformApi = api;
  return currentPlatformApi;
};

export const platform = new Proxy({} as PlatformAPI, {
  get(_target, prop) {
    const api = ensurePlatformApi();
    const value = api[prop as keyof PlatformAPI];
    return typeof value === 'function' ? value.bind(api) : value;
  },
}) as PlatformAPI;

export * from './types';
export { webPlatform } from './web';
export { createDesktopPlatform, desktopPlatform } from './desktop';
export { createServerPlatform, serverPlatform } from './server';
