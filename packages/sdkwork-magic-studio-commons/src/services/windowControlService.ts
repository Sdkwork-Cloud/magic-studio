import { createServiceAdapterController } from '../utils/serviceAdapter.ts';
import {
  isDesktopWindowPlatformRuntime,
  readWindowPlatformRuntime,
} from './runtimeGlobal.ts';

interface PlatformWindowBridge {
  window?: {
    minimize?: () => void | Promise<void>;
    maximize?: () => void | Promise<void>;
    isMaximized?: () => boolean | Promise<boolean>;
    close?: () => void | Promise<void>;
  };
}

const getPlatformWindowBridge = (): PlatformWindowBridge | null =>
  readWindowPlatformRuntime<PlatformWindowBridge>();

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
    const windowCapability = bridge?.window;
    return isDesktopWindowPlatformRuntime()
      && typeof windowCapability?.minimize === 'function'
      && typeof windowCapability?.maximize === 'function'
      && typeof windowCapability?.isMaximized === 'function'
      && typeof windowCapability?.close === 'function';
  },

  async isMaximized(): Promise<boolean> {
    const bridge = getPlatformWindowBridge();
    if (!bridge?.window?.isMaximized) {
      return false;
    }

    return Boolean(await bridge.window.isMaximized());
  },

  async minimize(): Promise<void> {
    await getPlatformWindowBridge()?.window?.minimize?.();
  },

  async maximize(): Promise<boolean> {
    const bridge = getPlatformWindowBridge();
    await bridge?.window?.maximize?.();
    if (!bridge?.window?.isMaximized) {
      return false;
    }

    return Boolean(await bridge.window.isMaximized());
  },

  async close(): Promise<void> {
    await getPlatformWindowBridge()?.window?.close?.();
  }
};

const controller = createServiceAdapterController<WindowControlServiceAdapter>(
  localWindowControlAdapter
);

export const windowControlService: WindowControlServiceAdapter = controller.service;
export const setWindowControlServiceAdapter = controller.setAdapter;
export const getWindowControlServiceAdapter = controller.getAdapter;
export const resetWindowControlServiceAdapter = controller.resetAdapter;
