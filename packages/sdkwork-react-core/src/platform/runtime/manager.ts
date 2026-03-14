import type { PlatformAPI } from '../types';
import { platform } from '../platform';
import { createPlatformRuntime } from './createPlatformRuntime';
import type { PlatformRuntime } from './types';

type PlatformWindow = Window & {
  __sdkworkPlatform?: PlatformAPI;
  __sdkworkPlatformRuntime?: PlatformRuntime;
};

const syncWindowPlatform = (api: PlatformAPI): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const targetWindow = window as PlatformWindow;
  targetWindow.__sdkworkPlatform = api;
  targetWindow.__sdkworkPlatformRuntime = currentPlatformRuntime;
};

let currentPlatformApi: PlatformAPI = platform;
let currentPlatformRuntime: PlatformRuntime = createPlatformRuntime(currentPlatformApi);

syncWindowPlatform(currentPlatformApi);

export const getPlatformRuntime = (): PlatformRuntime => currentPlatformRuntime;

export const getPlatformRuntimeApi = (): PlatformAPI => currentPlatformApi;

export const configurePlatformRuntime = (api: PlatformAPI): PlatformRuntime => {
  currentPlatformApi = api;
  currentPlatformRuntime = createPlatformRuntime(api);
  syncWindowPlatform(api);
  return currentPlatformRuntime;
};
