import type { PlatformAPI } from '../types';
import { configurePlatformApi, getPlatformApi } from '../platform';
import { createPlatformRuntime } from './createPlatformRuntime';
import type { PlatformRuntime } from './types';
import { writeWindowPlatformRuntime } from './windowGlobal';

const syncWindowPlatformRuntime = (): void => {
  writeWindowPlatformRuntime(currentPlatformRuntime);
};

let currentPlatformRuntime: PlatformRuntime | null = null;

const ensurePlatformRuntime = (): PlatformRuntime => {
  if (!currentPlatformRuntime) {
    currentPlatformRuntime = createPlatformRuntime(getPlatformApi());
    syncWindowPlatformRuntime();
  }
  return currentPlatformRuntime;
};

export const getPlatformRuntime = (): PlatformRuntime => ensurePlatformRuntime();

export const configurePlatformRuntime = (api: PlatformAPI): PlatformRuntime => {
  configurePlatformApi(api);
  currentPlatformRuntime = createPlatformRuntime(getPlatformApi());
  syncWindowPlatformRuntime();
  return currentPlatformRuntime;
};
