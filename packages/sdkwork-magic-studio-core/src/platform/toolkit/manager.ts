import { getPlatformRuntime } from '../runtime';
import type { PlatformRuntime } from '../runtime';
import { createPlatformToolKit } from './createPlatformToolKit';
import type { PlatformToolKit } from './types';

let currentPlatformToolKit: PlatformToolKit | null = null;
let currentToolKitRuntime: PlatformRuntime | null = null;

const ensurePlatformToolKit = (): PlatformToolKit => {
  const runtime = getPlatformRuntime();
  if (!currentPlatformToolKit || currentToolKitRuntime !== runtime) {
    currentToolKitRuntime = runtime;
    currentPlatformToolKit = createPlatformToolKit(runtime);
  }
  return currentPlatformToolKit;
};

export const getPlatformToolKit = (): PlatformToolKit => ensurePlatformToolKit();

export const configurePlatformToolKit = (toolKit: PlatformToolKit): PlatformToolKit => {
  currentToolKitRuntime = getPlatformRuntime();
  currentPlatformToolKit = toolKit;
  return currentPlatformToolKit;
};

export const resetPlatformToolKit = (): PlatformToolKit => {
  currentToolKitRuntime = getPlatformRuntime();
  currentPlatformToolKit = createPlatformToolKit(currentToolKitRuntime);
  return currentPlatformToolKit;
};
