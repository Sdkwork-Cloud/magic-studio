import { createServiceAdapterController } from '../utils/serviceAdapter';

interface PlatformWindowBridge {
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
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
  minimize(): void;
  maximize(): void;
  close(): void;
}

const localWindowControlAdapter: WindowControlServiceAdapter = {
  minimize(): void {
    getPlatformWindowBridge()?.minimizeWindow?.();
  },
  maximize(): void {
    getPlatformWindowBridge()?.maximizeWindow?.();
  },
  close(): void {
    getPlatformWindowBridge()?.closeWindow?.();
  }
};

const controller = createServiceAdapterController<WindowControlServiceAdapter>(
  localWindowControlAdapter
);

export const windowControlService: WindowControlServiceAdapter = controller.service;
export const setWindowControlServiceAdapter = controller.setAdapter;
export const getWindowControlServiceAdapter = controller.getAdapter;
export const resetWindowControlServiceAdapter = controller.resetAdapter;
