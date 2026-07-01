import { createServiceAdapterController } from '../utils/serviceAdapter.ts';
import { readWindowPlatformRuntime } from './runtimeGlobal.ts';

interface PlatformClipboardBridge {
  clipboard?: {
    copy?: (text: string) => void | Promise<void>;
  };
}

export interface ClipboardServiceAdapter {
  copyText(text: string): Promise<void>;
}

const getPlatformClipboardBridge = (): PlatformClipboardBridge | null =>
  readWindowPlatformRuntime<PlatformClipboardBridge>();

const localClipboardServiceAdapter: ClipboardServiceAdapter = {
  async copyText(text: string): Promise<void> {
    const runtime = getPlatformClipboardBridge();
    if (runtime?.clipboard?.copy) {
      await Promise.resolve(runtime.clipboard.copy(text));
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
