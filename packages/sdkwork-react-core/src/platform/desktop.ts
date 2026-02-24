import { PlatformAPI, SystemPath, BrowserInstance } from './types';
import { pathUtils, logger } from 'sdkwork-react-commons';

let tauriModules: any = null;

const loadTauriModules = async () => {
    if (tauriModules) return tauriModules;
    
    tauriModules = {
        check: (await import('@tauri-apps/plugin-updater')).check,
        relaunch: (await import('@tauri-apps/plugin-process')).relaunch,
        exit: (await import('@tauri-apps/plugin-process')).exit,
        sendNotification: (await import('@tauri-apps/plugin-notification')).sendNotification,
        isPermissionGranted: (await import('@tauri-apps/plugin-notification')).isPermissionGranted,
        requestPermission: (await import('@tauri-apps/plugin-notification')).requestPermission,
        ask: (await import('@tauri-apps/plugin-dialog')).ask,
        openDialog: (await import('@tauri-apps/plugin-dialog')).open,
        save: (await import('@tauri-apps/plugin-dialog')).save,
        openUrl: (await import('@tauri-apps/plugin-shell')).open,
        readDir: (await import('@tauri-apps/plugin-fs')).readDir,
        readTextFile: (await import('@tauri-apps/plugin-fs')).readTextFile,
        writeTextFile: (await import('@tauri-apps/plugin-fs')).writeTextFile,
        readFile: (await import('@tauri-apps/plugin-fs')).readFile,
        writeFile: (await import('@tauri-apps/plugin-fs')).writeFile,
        fsStat: (await import('@tauri-apps/plugin-fs')).stat,
        mkdir: (await import('@tauri-apps/plugin-fs')).mkdir,
        remove: (await import('@tauri-apps/plugin-fs')).remove,
        rename: (await import('@tauri-apps/plugin-fs')).rename,
        fsCopyFile: (await import('@tauri-apps/plugin-fs')).copyFile,
        osType: (await import('@tauri-apps/plugin-os')).type,
        tauriFetch: (await import('@tauri-apps/plugin-http')).fetch,
        Store: (await import('@tauri-apps/plugin-store')).Store,
        writeText: (await import('@tauri-apps/plugin-clipboard-manager')).writeText,
        readText: (await import('@tauri-apps/plugin-clipboard-manager')).readText,
        getName: (await import('@tauri-apps/api/app')).getName,
        getVersion: (await import('@tauri-apps/api/app')).getVersion,
        getTauriVersion: (await import('@tauri-apps/api/app')).getTauriVersion,
        getCurrentWindow: (await import('@tauri-apps/api/window')).getCurrentWindow,
        tauriInvoke: (await import('@tauri-apps/api/core')).invoke,
        convertFileSrc: (await import('@tauri-apps/api/core')).convertFileSrc,
        tauriListen: (await import('@tauri-apps/api/event')).listen,
        homeDir: (await import('@tauri-apps/api/path')).homeDir,
        appDataDir: (await import('@tauri-apps/api/path')).appDataDir,
        desktopDir: (await import('@tauri-apps/api/path')).desktopDir,
        documentDir: (await import('@tauri-apps/api/path')).documentDir,
        downloadDir: (await import('@tauri-apps/api/path')).downloadDir,
        tempDir: (await import('@tauri-apps/api/path')).tempDir,
    };
    return tauriModules;
};

class PersistentStore {
    private static instance: any = null;

    static async get(): Promise<any> {
        if (!this.instance) {
            const { Store } = await loadTauriModules();
            this.instance = await Store.load('settings.json');
        }
        return this.instance;
    }
}

export const createDesktopPlatform = (): PlatformAPI => {
  return {
  getPlatform: () => 'desktop',
  
  getOsType: async () => {
      const { osType } = await loadTauriModules();
      const type = await osType();
      if (type === 'linux') return 'linux';
      if (type === 'macos') return 'macos';
      if (type === 'windows') return 'windows';
      return 'unknown';
  },
  
  getDeviceId: async () => 'desktop-device-id',
  getAppMetadata: async () => {
      const { getName, getVersion, getTauriVersion } = await loadTauriModules();
      return {
          name: await getName(),
          version: await getVersion(),
          tauriVersion: await getTauriVersion()
      };
  },
  getPath: async (name: SystemPath) => {
      const { homeDir, appDataDir, desktopDir, documentDir, downloadDir, tempDir } = await loadTauriModules();
      switch (name) {
          case 'home': return await homeDir();
          case 'appData': return await appDataDir();
          case 'desktop': return await desktopDir();
          case 'documents': return await documentDir();
          case 'downloads': return await downloadDir();
          case 'temp': return await tempDir();
          default: return '';
      }
  },
  getSystemTheme: async () => {
      const { getCurrentWindow } = await loadTauriModules();
      return (await getCurrentWindow().theme()) || 'light';
  },
  restartApp: async () => {
      const { relaunch } = await loadTauriModules();
      await relaunch();
  },
  quitApp: async () => {
      const { exit } = await loadTauriModules();
      await exit(0);
  },
  toggleDevTools: async () => {
      const { tauriInvoke } = await loadTauriModules();
      try {
          await tauriInvoke('plugin:webview|internal_toggle_devtools');
      } catch(e) {
          logger.warn('[Platform] toggleDevTools failed', e);
      }
  },
  startDragging: async () => {
      const { getCurrentWindow } = await loadTauriModules();
      await getCurrentWindow().startDragging();
  },
  minimizeWindow: async () => {
      const { getCurrentWindow } = await loadTauriModules();
      await getCurrentWindow().minimize();
  },
  maximizeWindow: async () => {
      const { getCurrentWindow } = await loadTauriModules();
      await getCurrentWindow().toggleMaximize();
  },
  closeWindow: async () => {
      const { getCurrentWindow } = await loadTauriModules();
      await getCurrentWindow().close();
  },
  setFullscreen: async (fullscreen: boolean) => {
      const { getCurrentWindow } = await loadTauriModules();
      await getCurrentWindow().setFullscreen(fullscreen);
  },
  setTitle: async (title: string) => {
      const { getCurrentWindow } = await loadTauriModules();
      await getCurrentWindow().setTitle(title);
  },
  setAppBadge: async () => {},

  setStorage: async (key: string, value: string) => {
      const store = await PersistentStore.get();
      await store.set(key, value);
      await store.save();
  },
  getStorage: async (key: string) => {
      const store = await PersistentStore.get();
      const val = await store.get(key);
      return val || null;
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
      const { writeText } = await loadTauriModules();
      await writeText(text);
  },
  paste: async () => {
      const { readText } = await loadTauriModules();
      return (await readText()) || '';
  },
  openExternal: async (url: string) => {
      const { openUrl } = await loadTauriModules();
      await openUrl(url);
  },
  checkCommandExists: async (command: string) => {
      const { tauriInvoke } = await loadTauriModules();
      try {
          return await tauriInvoke('check_executable', { name: command });
      } catch {
          return false;
      }
  },
  httpRequest: async (url: string, options?: RequestInit) => {
      const { tauriFetch } = await loadTauriModules();
      return tauriFetch(url, options);
  },
  isOnline: async () => navigator.onLine,

  notify: async (title: string, body: string) => {
      const { sendNotification, isPermissionGranted } = await loadTauriModules();
      if (await isPermissionGranted()) sendNotification({ title, body });
  },
  confirm: async (message: string, title?: string, type: 'info'|'warning'|'error' = 'info') => {
      const { ask } = await loadTauriModules();
      return await ask(message, { title, kind: type });
  },

  checkForUpdates: async () => null,
  installUpdate: async () => {},

  showItemInFolder: async (path: string) => {
      const { tauriInvoke } = await loadTauriModules();
      await tauriInvoke('show_item_in_folder', { path });
  },

  selectFile: async (options?: { multiple?: boolean; extensions?: string[] }) => {
      const { openDialog } = await loadTauriModules();
      const selected = await openDialog({
          multiple: options?.multiple,
          filters: options?.extensions ? [{ name: 'Files', extensions: options.extensions }] : undefined
      });
      if (selected === null) return [];
      if (Array.isArray(selected)) return selected;
      return [selected];
  },
  selectDir: async () => {
      const { openDialog } = await loadTauriModules();
      const selected = await openDialog({ directory: true, multiple: false });
      return selected || null;
  },
  readDir: async (path: string) => {
      const { readDir } = await loadTauriModules();
      const entries = await readDir(path);
      return entries.map((e: any) => ({
          uuid: pathUtils.join(path, e.name),
          name: e.name,
          path: pathUtils.join(path, e.name),
          isDirectory: e.isDirectory,
          children: []
      }));
  },
  
  readFile: async (path: string) => {
      const { readTextFile } = await loadTauriModules();
      return await readTextFile(path);
  },
  writeFile: async (path: string, content: string) => {
      const { writeTextFile } = await loadTauriModules();
      await writeTextFile(path, content);
  },
  
  saveFile: async (data: string, filename: string) => {
      const { save, writeTextFile } = await loadTauriModules();
      const path = await save({ defaultPath: filename });
      if (path) {
          await writeTextFile(path, data);
          return path;
      }
      return null;
  },

  readFileBinary: async (path: string) => {
      const { readFile } = await loadTauriModules();
      return await readFile(path);
  },
  writeFileBinary: async (path: string, content: Uint8Array) => {
      const { writeFile } = await loadTauriModules();
      await writeFile(path, content);
  },
  
  readFileBlob: async (path: string) => {
      const { readFile } = await loadTauriModules();
      const bytes = await readFile(path);
      return new Blob([bytes]);
  },
  writeFileBlob: async (path: string, content: Blob) => {
      const { writeFile } = await loadTauriModules();
      const buffer = await content.arrayBuffer();
      await writeFile(path, new Uint8Array(buffer));
  },

  stat: async (path: string) => {
      const { fsStat } = await loadTauriModules();
      const s = await fsStat(path);
      return {
          type: s.isDirectory ? 'directory' : s.isFile ? 'file' : 'symlink',
          size: s.size,
          lastModified: Date.now(),
          createdAt: Date.now()
      };
  },
  convertFileSrc: (filePath: string) => {
      return filePath;
  },
  createDir: async (path: string) => {
      const { mkdir } = await loadTauriModules();
      await mkdir(path, { recursive: true });
  },
  delete: async (path: string) => {
      const { remove } = await loadTauriModules();
      await remove(path, { recursive: true });
  },
  rename: async (oldPath: string, newPath: string) => {
      const { rename } = await loadTauriModules();
      await rename(oldPath, newPath);
  },
  copyFile: async (src: string, dst: string) => {
      const { fsCopyFile } = await loadTauriModules();
      await fsCopyFile(src, dst);
  },

  createPty: async (shell: string, size: { cols: number; rows: number }, env?: Record<string, string>, cmd?: string) => {
      const { tauriInvoke } = await loadTauriModules();
      return tauriInvoke('create_pty', {
          shell,
          cols: size.cols,
          rows: size.rows,
          env,
          initial_command: cmd
      });
  },
  startPty: async (pid: string) => {
      const { tauriInvoke } = await loadTauriModules();
      await tauriInvoke('start_pty', { pid });
  },
  resizePty: async (pid: string, size: { cols: number; rows: number }) => {
      const { tauriInvoke } = await loadTauriModules();
      await tauriInvoke('resize_pty', { pid, cols: size.cols, rows: size.rows });
  },
  writePty: async (pid: string, data: string) => {
      const { tauriInvoke } = await loadTauriModules();
      await tauriInvoke('write_pty', { pid, data });
  },
  onPtyData: (pid: string, callback: (data: string | Uint8Array) => void) => {
      let unlisten: (() => void) | null = null;
      loadTauriModules().then(({ tauriListen }) => {
          tauriListen(`pty-output:${pid}`, (e: any) => {
              callback(typeof e.payload === 'string' ? e.payload : new Uint8Array(e.payload));
          }).then((f: () => void) => { unlisten = f; });
      });
      return () => { if (unlisten) unlisten(); };
  },
  killPty: async (pid: string) => {
      const { tauriInvoke } = await loadTauriModules();
      await tauriInvoke('kill_pty', { pid });
  },
  syncPtySessions: async (ids: string[]) => {
      const { tauriInvoke } = await loadTauriModules();
      await tauriInvoke('sync_pty_sessions', { activeIds: ids });
  },

  isProfessionalBrowserSupported: () => true,
  createBrowser: async (): Promise<BrowserInstance> => {
      throw new Error("Browser not implemented in this version");
  }
  };
};

export const desktopPlatform = createDesktopPlatform();
