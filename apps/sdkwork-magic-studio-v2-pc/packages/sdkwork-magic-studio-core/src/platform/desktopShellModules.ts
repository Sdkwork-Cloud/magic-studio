import type { SystemTheme } from './types';
import type {
  PlatformShellCommandName,
  PlatformShellEventName,
} from './runtime/types';

export interface DesktopStoreHandle {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  save(): Promise<void>;
}

export interface DesktopWindowHandle {
  theme(): Promise<SystemTheme | null>;
  startDragging(): Promise<void>;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  isMaximized(): Promise<boolean>;
  close(): Promise<void>;
  setFullscreen(fullscreen: boolean): Promise<void>;
  setTitle(title: string): Promise<void>;
}

export interface DesktopUpdateHandle {
  version: string;
  body?: string;
  date?: string;
  downloadAndInstall(): Promise<void>;
  close(): Promise<void>;
}

export interface DesktopShellModules {
  checkForUpdate(): Promise<DesktopUpdateHandle | null>;
  relaunch(): Promise<void>;
  exit(code?: number): Promise<void>;
  sendNotification(options: { title: string; body?: string }): void;
  isNotificationPermissionGranted(): Promise<boolean>;
  requestNotificationPermission(): Promise<'default' | 'denied' | 'granted'>;
  ask(
    message: string,
    options?: { title?: string; kind?: 'info' | 'warning' | 'error' },
  ): Promise<boolean>;
  openDialog(options?: {
    multiple?: boolean;
    directory?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null>;
  saveDialog(options?: { defaultPath?: string }): Promise<string | null>;
  revealItemInDir(path: string | string[]): Promise<void>;
  openUrl(url: string | URL): Promise<void>;
  osType(): Promise<string>;
  loadStore(path: string): Promise<DesktopStoreHandle>;
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  getName(): Promise<string>;
  getVersion(): Promise<string>;
  getDesktopShellVersion(): Promise<string>;
  getCurrentWindow(): DesktopWindowHandle;
  toggleDesktopDevTools(): Promise<void>;
  shellInvoke<T = unknown>(
    command: PlatformShellCommandName,
    payload?: Record<string, unknown>,
  ): Promise<T>;
  shellListen<T = unknown>(
    event: PlatformShellEventName,
    callback: (event: { payload: T }) => void,
  ): Promise<() => void>;
  convertFileSrc(filePath: string): string;
  homeDir(): Promise<string>;
  appDataDir(): Promise<string>;
  desktopDir(): Promise<string>;
  documentDir(): Promise<string>;
  downloadDir(): Promise<string>;
  tempDir(): Promise<string>;
}

let desktopShellModules: DesktopShellModules | null = null;
let desktopShellModulesPromise: Promise<DesktopShellModules> | null = null;

export const getLoadedDesktopShellModules = (): DesktopShellModules | null =>
  desktopShellModules;

export const loadDesktopShellModules = async (): Promise<DesktopShellModules> => {
  if (!desktopShellModulesPromise) {
    desktopShellModulesPromise = (async () => {
      const [
        updaterModule,
        processModule,
        notificationModule,
        dialogModule,
        openerModule,
        osModule,
        storeModule,
        clipboardModule,
        appModule,
        windowModule,
        coreModule,
        eventModule,
        pathModule,
      ] = await Promise.all([
        import('@tauri-apps/plugin-updater'),
        import('@tauri-apps/plugin-process'),
        import('@tauri-apps/plugin-notification'),
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/plugin-opener'),
        import('@tauri-apps/plugin-os'),
        import('@tauri-apps/plugin-store'),
        import('@tauri-apps/plugin-clipboard-manager'),
        import('@tauri-apps/api/app'),
        import('@tauri-apps/api/window'),
        import('@tauri-apps/api/core'),
        import('@tauri-apps/api/event'),
        import('@tauri-apps/api/path'),
      ]);

      const loadedModules: DesktopShellModules = {
        checkForUpdate: updaterModule.check,
        relaunch: processModule.relaunch,
        exit: processModule.exit,
        sendNotification: notificationModule.sendNotification,
        isNotificationPermissionGranted: notificationModule.isPermissionGranted,
        requestNotificationPermission: notificationModule.requestPermission,
        ask: dialogModule.ask,
        openDialog: dialogModule.open,
        saveDialog: dialogModule.save,
        revealItemInDir: openerModule.revealItemInDir,
        openUrl: openerModule.openUrl,
        osType: async (): Promise<string> => osModule.type(),
        loadStore: async (path: string): Promise<DesktopStoreHandle> =>
          (await storeModule.Store.load(path)) as unknown as DesktopStoreHandle,
        writeText: clipboardModule.writeText,
        readText: clipboardModule.readText,
        getName: appModule.getName,
        getVersion: appModule.getVersion,
        getDesktopShellVersion: appModule.getTauriVersion,
        getCurrentWindow: windowModule.getCurrentWindow,
        toggleDesktopDevTools: async (): Promise<void> => {
          await coreModule.invoke('plugin:webview|internal_toggle_devtools');
        },
        shellInvoke: coreModule.invoke,
        convertFileSrc: coreModule.convertFileSrc,
        shellListen: eventModule.listen,
        homeDir: pathModule.homeDir,
        appDataDir: pathModule.appDataDir,
        desktopDir: pathModule.desktopDir,
        documentDir: pathModule.documentDir,
        downloadDir: pathModule.downloadDir,
        tempDir: pathModule.tempDir,
      };

      desktopShellModules = loadedModules;
      return loadedModules;
    })().catch((error) => {
      desktopShellModulesPromise = null;
      throw error;
    });
  }

  return desktopShellModulesPromise;
};
