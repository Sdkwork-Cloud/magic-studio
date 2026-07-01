import { logger } from '@sdkwork/magic-studio-commons/utils/logger';
import { PlatformAPI, SystemPath, BrowserInstance } from './types';
import { createDesktopShellBridge } from './desktopBridge';
import { createDesktopFileSystemApi } from './desktopFileSystem';
import type { PlatformShellCommandName, PlatformShellEventName } from './runtime/types';
import {
  createPtyOutputShellEventName,
  PLATFORM_SHELL_COMMAND,
} from './runtime/shellVocabulary';
import {
  getLoadedDesktopShellModules,
  loadDesktopShellModules,
  type DesktopStoreHandle,
  type DesktopUpdateHandle,
} from './desktopShellModules';

const SETTINGS_STORE_FILE = 'settings.json';
const DEVICE_ID_STORAGE_KEY = 'platform.deviceId';
type DesktopPlatformOs = Awaited<ReturnType<PlatformAPI['getOsType']>>;
type DesktopBridgePlatformApi = PlatformAPI & {
  invoke<T = unknown>(
    command: PlatformShellCommandName,
    payload?: Record<string, unknown>,
  ): Promise<T>;
  listen<T = unknown>(
    event: PlatformShellEventName,
    callback: (payload: T) => void,
  ): Promise<() => void>;
};

const desktopShellBridge = createDesktopShellBridge(loadDesktopShellModules);

const desktopFileSystem = createDesktopFileSystemApi({
  request: async (url: string, options?: RequestInit): Promise<Response> => fetch(url, options),
  convertFileSrc: (filePath: string): string => {
    try {
      return getLoadedDesktopShellModules()?.convertFileSrc(filePath) ?? filePath;
    } catch (error) {
      logger.warn('[Platform] convertFileSrc failed', error);
      return filePath;
    }
  },
});

const normalizeDesktopOsType = (
  osType: string,
): DesktopPlatformOs => {
  if (
    osType === 'linux'
    || osType === 'macos'
    || osType === 'windows'
    || osType === 'android'
    || osType === 'ios'
  ) {
    return osType;
  }

  return 'unknown';
};

const readStoreString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const generateDesktopDeviceId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `desktop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

class PersistentStore {
  private static instance: DesktopStoreHandle | null = null;

  static async get(): Promise<DesktopStoreHandle> {
    if (!this.instance) {
      const modules = await loadDesktopShellModules();
      this.instance = await modules.loadStore(SETTINGS_STORE_FILE);
    }

    return this.instance;
  }
}

let pendingDesktopUpdate: DesktopUpdateHandle | null = null;

const closePendingDesktopUpdate = async (): Promise<void> => {
  if (!pendingDesktopUpdate) {
    return;
  }

  try {
    await pendingDesktopUpdate.close();
  } catch (error) {
    logger.warn('[Platform] Failed to close pending updater handle', error);
  } finally {
    pendingDesktopUpdate = null;
  }
};

const resolveDesktopWindow = async () => {
  const modules = await loadDesktopShellModules();
  return modules.getCurrentWindow();
};

const mapUpdateInfo = (update: DesktopUpdateHandle) => ({
  version: update.version,
  body: update.body,
  date: update.date,
});

export const createDesktopPlatform = (): PlatformAPI => {
  const api: DesktopBridgePlatformApi = {
    getPlatform: () => 'desktop',
    invoke: async <T = unknown>(
      command: PlatformShellCommandName,
      payload?: Record<string, unknown>,
    ): Promise<T> => desktopShellBridge.invoke<T>(command, payload),
    listen: async <T = unknown>(
      event: PlatformShellEventName,
      callback: (payload: T) => void,
    ): Promise<() => void> => desktopShellBridge.listen(event, callback),
    getOsType: async () => {
      const modules = await loadDesktopShellModules();
      return normalizeDesktopOsType(await modules.osType());
    },
    getDeviceId: async () => {
      const store = await PersistentStore.get();
      const existing = readStoreString(await store.get(DEVICE_ID_STORAGE_KEY));
      if (existing) {
        return existing;
      }

      const generated = generateDesktopDeviceId();
      await store.set(DEVICE_ID_STORAGE_KEY, generated);
      await store.save();
      return generated;
    },
    getAppMetadata: async () => {
      const modules = await loadDesktopShellModules();
      return {
        name: await modules.getName(),
        version: await modules.getVersion(),
        desktopShellVersion: await modules.getDesktopShellVersion(),
      };
    },
    getPath: async (name: SystemPath) => {
      const modules = await loadDesktopShellModules();
      switch (name) {
        case 'home':
          return modules.homeDir();
        case 'appData':
          return modules.appDataDir();
        case 'desktop':
          return modules.desktopDir();
        case 'documents':
          return modules.documentDir();
        case 'downloads':
          return modules.downloadDir();
        case 'temp':
          return modules.tempDir();
        default:
          return '';
      }
    },
    getSystemTheme: async () => (await (await resolveDesktopWindow()).theme()) ?? 'light',
    restartApp: async () => {
      const modules = await loadDesktopShellModules();
      await modules.relaunch();
    },
    quitApp: async () => {
      const modules = await loadDesktopShellModules();
      await modules.exit(0);
    },
    toggleDevTools: async () => {
      const modules = await loadDesktopShellModules();
      try {
        await modules.toggleDesktopDevTools();
      } catch (error) {
        logger.warn('[Platform] toggleDevTools failed', error);
      }
    },
    startDragging: async () => {
      await (await resolveDesktopWindow()).startDragging();
    },
    minimizeWindow: async () => {
      await (await resolveDesktopWindow()).minimize();
    },
    maximizeWindow: async () => {
      await (await resolveDesktopWindow()).toggleMaximize();
    },
    isWindowMaximized: async () => (await resolveDesktopWindow()).isMaximized(),
    closeWindow: async () => {
      await (await resolveDesktopWindow()).close();
    },
    setFullscreen: async (fullscreen: boolean) => {
      await (await resolveDesktopWindow()).setFullscreen(fullscreen);
    },
    setTitle: async (title: string) => {
      await (await resolveDesktopWindow()).setTitle(title);
    },
    setAppBadge: async () => {},
    setStorage: async (key: string, value: string) => {
      const store = await PersistentStore.get();
      await store.set(key, value);
      await store.save();
    },
    getStorage: async (key: string) => {
      const store = await PersistentStore.get();
      return readStoreString(await store.get(key));
    },
    removeStorage: async (key: string) => {
      const store = await PersistentStore.get();
      await store.delete(key);
      await store.save();
    },
    clearStorage: async () => {
      const store = await PersistentStore.get();
      await store.clear();
      await store.save();
    },
    copy: async (text: string) => {
      const modules = await loadDesktopShellModules();
      await modules.writeText(text);
    },
    paste: async () => {
      const modules = await loadDesktopShellModules();
      return (await modules.readText()) || '';
    },
    openExternal: async (url: string) => {
      const modules = await loadDesktopShellModules();
      await modules.openUrl(url);
    },
    checkCommandExists: async (command: string) => {
      try {
        return await desktopShellBridge.invoke<boolean>(PLATFORM_SHELL_COMMAND.systemCommandExists, {
          name: command,
        });
      } catch {
        return false;
      }
    },
    httpRequest: async (url: string, options?: RequestInit) => fetch(url, options),
    isOnline: async () => navigator.onLine,
    notify: async (title: string, body: string) => {
      const modules = await loadDesktopShellModules();
      let granted = await modules.isNotificationPermissionGranted();
      if (!granted) {
        granted = (await modules.requestNotificationPermission()) === 'granted';
      }

      if (granted) {
        modules.sendNotification({ title, body });
      }
    },
    confirm: async (
      message: string,
      title?: string,
      type: 'info' | 'warning' | 'error' = 'info',
    ) => {
      const modules = await loadDesktopShellModules();
      return modules.ask(message, { title, kind: type });
    },
    checkForUpdates: async () => {
      await closePendingDesktopUpdate();

      const modules = await loadDesktopShellModules();
      const update = await modules.checkForUpdate();
      if (!update) {
        return null;
      }

      pendingDesktopUpdate = update;
      return mapUpdateInfo(update);
    },
    installUpdate: async () => {
      let update = pendingDesktopUpdate;
      if (!update) {
        const modules = await loadDesktopShellModules();
        update = await modules.checkForUpdate();
      }

      if (!update) {
        return;
      }

      try {
        await update.downloadAndInstall();
      } finally {
        try {
          await update.close();
        } catch (error) {
          logger.warn('[Platform] Failed to close updater handle after install', error);
        }

        if (pendingDesktopUpdate === update) {
          pendingDesktopUpdate = null;
        }
      }
    },
    showItemInFolder: async (path: string) => {
      const modules = await loadDesktopShellModules();
      await modules.revealItemInDir(path);
    },
    selectFile: async (options?: { multiple?: boolean; extensions?: string[] }) => {
      const modules = await loadDesktopShellModules();
      const selected = await modules.openDialog({
        multiple: options?.multiple,
        directory: false,
        filters: options?.extensions
          ? [{ name: 'Files', extensions: options.extensions }]
          : undefined,
      });

      if (selected === null) {
        return [];
      }

      return Array.isArray(selected) ? selected : [selected];
    },
    selectDir: async () => {
      const modules = await loadDesktopShellModules();
      const selected = await modules.openDialog({
        directory: true,
        multiple: false,
      });

      return typeof selected === 'string' ? selected : null;
    },
    ...desktopFileSystem,
    saveFile: async (data: string, filename: string) => {
      const modules = await loadDesktopShellModules();
      const path = await modules.saveDialog({ defaultPath: filename });
      if (!path) {
        return null;
      }

      await desktopFileSystem.writeFile(path, data);
      return path;
    },
    createPty: async (
      shell: string,
      size: { cols: number; rows: number },
      env?: Record<string, string>,
      cmd?: string,
    ) =>
      desktopShellBridge.invoke<string>(PLATFORM_SHELL_COMMAND.createPty, {
        shell,
        cols: size.cols,
        rows: size.rows,
        env,
        initial_command: cmd,
      }),
    startPty: async (pid: string) => {
      await desktopShellBridge.invoke(PLATFORM_SHELL_COMMAND.startPty, { pid });
    },
    resizePty: async (pid: string, size: { cols: number; rows: number }) => {
      await desktopShellBridge.invoke(PLATFORM_SHELL_COMMAND.resizePty, {
        pid,
        cols: size.cols,
        rows: size.rows,
      });
    },
    writePty: async (pid: string, data: string) => {
      await desktopShellBridge.invoke(PLATFORM_SHELL_COMMAND.writePty, { pid, data });
    },
    onPtyData: (pid: string, callback: (data: string | Uint8Array) => void) => {
      let active = true;
      let unlisten: (() => void) | null = null;

      void desktopShellBridge
        .listen(createPtyOutputShellEventName(pid), (payload: string | number[]) => {
          callback(typeof payload === 'string' ? payload : new Uint8Array(payload));
        })
        .then((dispose) => {
          if (!active) {
            dispose();
            return;
          }

          unlisten = dispose;
        })
        .catch((error) => {
          logger.warn('[Platform] Failed to subscribe to PTY output', error);
        });

      return (): void => {
        active = false;
        if (unlisten) {
          unlisten();
        }
      };
    },
    killPty: async (pid: string) => {
      await desktopShellBridge.invoke(PLATFORM_SHELL_COMMAND.killPty, { pid });
    },
    syncPtySessions: async (ids: string[]) => {
      await desktopShellBridge.invoke(PLATFORM_SHELL_COMMAND.syncPtySessions, { active_ids: ids });
    },
    isProfessionalBrowserSupported: () => false,
    createBrowser: async (): Promise<BrowserInstance> => {
      throw new Error(
        '[Platform] Embedded browser is not available in the desktop shell runtime.',
      );
    },
  };

  return api;
};

export const desktopPlatform = createDesktopPlatform();
