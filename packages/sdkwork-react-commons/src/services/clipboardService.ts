import { createServiceAdapterController } from '../utils/serviceAdapter';

interface PlatformClipboardBridge {
  copy?: (text: string) => void | Promise<void>;
}

export interface ClipboardServiceAdapter {
  copyText(text: string): Promise<void>;
}

const getPlatformClipboardBridge = (): PlatformClipboardBridge | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const globalWindow = window as Window & { __sdkworkPlatform?: unknown };
  const platform = globalWindow.__sdkworkPlatform;
  if (!platform || typeof platform !== 'object') {
    return null;
  }

  return platform as PlatformClipboardBridge;
};

const localClipboardServiceAdapter: ClipboardServiceAdapter = {
  async copyText(text: string): Promise<void> {
    const platform = getPlatformClipboardBridge();
    if (platform?.copy) {
      await Promise.resolve(platform.copy(text));
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    throw new Error('Clipboard copy API is unavailable in current environment');
  }
};

const controller = createServiceAdapterController<ClipboardServiceAdapter>(
  localClipboardServiceAdapter
);

export const clipboardService: ClipboardServiceAdapter = controller.service;
export const setClipboardServiceAdapter = controller.setAdapter;
export const getClipboardServiceAdapter = controller.getAdapter;
export const resetClipboardServiceAdapter = controller.resetAdapter;
