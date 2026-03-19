import { createServiceAdapterController } from '../utils/serviceAdapter';

interface PlatformWindowBridge {
  getPlatform?: () => 'web' | 'desktop';
  minimizeWindow?: () => void | Promise<void>;
  maximizeWindow?: () => void | Promise<void>;
  isWindowMaximized?: () => boolean | Promise<boolean>;
  closeWindow?: () => void | Promise<void>;
}

const getPlatformWindowBridge = (): PlatformWindowBridge | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const globalWindow = window as Window & { __sdkworkPlatform?: unknown };
  if (!globalWindow.__sdkworkPlatform || typeof globalWindow.__sdkworkPlatform !== 'object') {
    return null;
  }

  return globalWindow.__sdkworkPlatform as PlatformWindowBridge;
};

export interface WindowControlServiceAdapter {
  isAvailable(): boolean;
  isMaximized(): Promise<boolean>;
  minimize(): Promise<void>;
  maximize(): Promise<boolean>;
  close(): Promise<void>;
}

const localWindowControlAdapter: WindowControlServiceAdapter = {
  isAvailable(): boolean {
    const bridge = getPlatformWindowBridge();
    return bridge?.getPlatform?.() === 'desktop'
      && typeof bridge.minimizeWindow === 'function'
      && typeof bridge.maximizeWindow === 'function'
      && typeof bridge.closeWindow === 'function';
  },

  async isMaximized(): Promise<boolean> {
    const bridge = getPlatformWindowBridge();
    if (!bridge?.isWindowMaximized) {
      return false;
    }

    return Boolean(await bridge.isWindowMaximized());
  },

  async minimize(): Promise<void> {
    await getPlatformWindowBridge()?.minimizeWindow?.();
  },

  async maximize(): Promise<boolean> {
    const bridge = getPlatformWindowBridge();
    await bridge?.maximizeWindow?.();
    if (!bridge?.isWindowMaximized) {
      return false;
    }

    return Boolean(await bridge.isWindowMaximized());
  },

  async close(): Promise<void> {
    await getPlatformWindowBridge()?.closeWindow?.();
  }
};

const controller = createServiceAdapterController<WindowControlServiceAdapter>(
  localWindowControlAdapter
);

export const windowControlService: WindowControlServiceAdapter = controller.service;
export const setWindowControlServiceAdapter = controller.setAdapter;
export const getWindowControlServiceAdapter = controller.getAdapter;
export const resetWindowControlServiceAdapter = controller.resetAdapter;
