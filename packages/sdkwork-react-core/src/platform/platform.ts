import { PlatformAPI } from './types';
import { webPlatform } from './web';
import { createDesktopPlatform } from './desktop';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const getPlatformImpl = (): PlatformAPI => {
  if (isTauri) {
    console.log('[Platform] Running in Desktop mode');
    return createDesktopPlatform();
  }
  console.log('[Platform] Running in Web mode');
  return webPlatform;
};

export const platform = getPlatformImpl();

export * from './types';
export { webPlatform } from './web';
export { createDesktopPlatform, desktopPlatform } from './desktop';
