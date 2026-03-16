import { PlatformAPI } from './types';
import { webPlatform } from './web';
import { createDesktopPlatform } from './desktop';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type PlatformWindow = Window & {
  __sdkworkPlatform?: PlatformAPI;
};

const getPlatformImpl = (): PlatformAPI => {
  if (isTauri) {
    console.log('[Platform] Running in Desktop mode');
    return createDesktopPlatform();
  }
  console.log('[Platform] Running in Web mode');
  return webPlatform;
};

export const platform = getPlatformImpl();

if (typeof window !== 'undefined') {
  const targetWindow = window as unknown as PlatformWindow;
  targetWindow.__sdkworkPlatform = platform;
}

export * from './types';
export { webPlatform } from './web';
export { createDesktopPlatform, desktopPlatform } from './desktop';
