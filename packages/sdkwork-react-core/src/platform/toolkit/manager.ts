import { getPlatformRuntime } from '../runtime';
import { createPlatformToolKit } from './createPlatformToolKit';
import type { PlatformToolKit } from './types';

let currentPlatformToolKit: PlatformToolKit = createPlatformToolKit(getPlatformRuntime());

export const getPlatformToolKit = (): PlatformToolKit => currentPlatformToolKit;

export const configurePlatformToolKit = (toolKit: PlatformToolKit): PlatformToolKit => {
  currentPlatformToolKit = toolKit;
  return currentPlatformToolKit;
};

export const resetPlatformToolKit = (): PlatformToolKit => {
  currentPlatformToolKit = createPlatformToolKit(getPlatformRuntime());
  return currentPlatformToolKit;
};

