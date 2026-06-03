import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';

import { createLocalServerFileSystemApi } from './localServerFileSystem';
import {
  readServerRuntimeSummary,
  readServerRuntimeSystemPath,
} from './serverRuntimeSummary';
import { PlatformAPI, SystemPath } from './types';
import { webPlatform } from './web';

type BrowserDirectoryInput = HTMLInputElement & {
  webkitdirectory?: boolean;
};

type BrowserFileWithRelativePath = File & {
  webkitRelativePath?: string;
};

function readLocationOrigin(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location?.origin;
}

function createImportSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toAcceptValue(extensions?: string[]): string {
  if (!extensions || extensions.length === 0) {
    return '';
  }

  return extensions.map((extension) => `.${extension}`).join(',');
}

function normalizeImportedRelativePath(value: string): string {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized || 'untitled';
}

async function readServerPlatformOsType(): Promise<
  Awaited<ReturnType<PlatformAPI['getOsType']>>
> {
  const runtimeOs = (await readServerRuntimeSummary()).runtimeOs;
  if (
    runtimeOs === 'linux'
    || runtimeOs === 'macos'
    || runtimeOs === 'windows'
    || runtimeOs === 'android'
    || runtimeOs === 'ios'
  ) {
    return runtimeOs;
  }

  return 'unknown';
}

const createServerPlatformFileSystem = () =>
  createLocalServerFileSystemApi({
    runtimeMode: 'server',
    request: async (url: string, options?: RequestInit): Promise<Response> => fetch(url, options),
    convertFileSrc: (filePath: string): string => filePath,
    preferSameOrigin: true,
    locationOrigin: readLocationOrigin(),
  });

async function stageBrowserFilesToServer(
  fileSystem: ReturnType<typeof createServerPlatformFileSystem>,
  files: FileList,
  rootLabel: 'files' | 'directories',
): Promise<{
  rootPath: string;
  importedPaths: string[];
}> {
  const tempRoot = await readServerRuntimeSystemPath('temp');
  const importRoot = pathUtils.join(
    tempRoot,
    'magic-studio',
    'browser-imports',
    rootLabel,
    createImportSessionId(),
  );
  const importedPaths: string[] = [];

  await fileSystem.createDir(importRoot);

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index] as BrowserFileWithRelativePath;
    const relativePath = normalizeImportedRelativePath(file.webkitRelativePath || file.name);
    const targetPath = pathUtils.join(importRoot, relativePath);
    await fileSystem.createDir(pathUtils.dirname(targetPath));
    await fileSystem.writeFileBlob(targetPath, file);
    importedPaths.push(targetPath);
  }

  return {
    rootPath: importRoot,
    importedPaths,
  };
}

async function pickServerFiles(
  fileSystem: ReturnType<typeof createServerPlatformFileSystem>,
  options?: { multiple?: boolean; extensions?: string[] },
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options?.multiple ?? false;
    input.accept = toAcceptValue(options?.extensions);

    input.onchange = async (event) => {
      try {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve([]);
          return;
        }

        const imported = await stageBrowserFilesToServer(fileSystem, files, 'files');
        resolve(imported.importedPaths);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => resolve([]);
    input.click();
  });
}

async function pickServerDirectory(
  fileSystem: ReturnType<typeof createServerPlatformFileSystem>,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input') as BrowserDirectoryInput;
    input.type = 'file';
    input.multiple = true;
    input.webkitdirectory = true;

    input.onchange = async (event) => {
      try {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(null);
          return;
        }

        const imported = await stageBrowserFilesToServer(fileSystem, files, 'directories');
        resolve(imported.rootPath);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

async function writeServerDownloadFile(
  fileSystem: ReturnType<typeof createServerPlatformFileSystem>,
  data: string,
  filename: string,
): Promise<string> {
  const downloadsDir = await readServerRuntimeSystemPath('downloads');
  const targetPath = pathUtils.join(downloadsDir, pathUtils.basename(filename) || 'download.bin');
  await fileSystem.createDir(downloadsDir);
  await fileSystem.writeFile(targetPath, data);
  return targetPath;
}

export const createServerPlatform = (): PlatformAPI => {
  const serverFileSystem = createServerPlatformFileSystem();

  const readServerPath = async (name: SystemPath): Promise<string> =>
    readServerRuntimeSystemPath(name);

  return {
    getPlatform: () => 'server',
    getOsType: readServerPlatformOsType,
    getDeviceId: webPlatform.getDeviceId,
    getAppMetadata: async () => {
      const metadata = await webPlatform.getAppMetadata();
      return {
        ...metadata,
        name: metadata.name.replace(/\bWeb\b/, 'Server') || 'Magic Studio Server',
      };
    },
    getPath: readServerPath,
    getSystemTheme: webPlatform.getSystemTheme,
    restartApp: webPlatform.restartApp,
    quitApp: webPlatform.quitApp,
    toggleDevTools: webPlatform.toggleDevTools,
    startDragging: webPlatform.startDragging,
    minimizeWindow: webPlatform.minimizeWindow,
    maximizeWindow: webPlatform.maximizeWindow,
    isWindowMaximized: webPlatform.isWindowMaximized,
    closeWindow: webPlatform.closeWindow,
    setFullscreen: webPlatform.setFullscreen,
    setTitle: webPlatform.setTitle,
    setAppBadge: webPlatform.setAppBadge,
    setStorage: webPlatform.setStorage,
    getStorage: webPlatform.getStorage,
    removeStorage: webPlatform.removeStorage,
    clearStorage: webPlatform.clearStorage,
    copy: webPlatform.copy,
    paste: webPlatform.paste,
    openExternal: webPlatform.openExternal,
    checkCommandExists: async () => false,
    httpRequest: async (url: string, options?: RequestInit) => fetch(url, options),
    isOnline: webPlatform.isOnline,
    notify: webPlatform.notify,
    confirm: webPlatform.confirm,
    checkForUpdates: webPlatform.checkForUpdates,
    installUpdate: webPlatform.installUpdate,
    showItemInFolder: webPlatform.showItemInFolder,
    selectFile: async (options?: { multiple?: boolean; extensions?: string[] }) =>
      pickServerFiles(serverFileSystem, options),
    selectDir: async () => pickServerDirectory(serverFileSystem),
    readDir: serverFileSystem.readDir,
    readFile: serverFileSystem.readFile,
    writeFile: serverFileSystem.writeFile,
    saveFile: async (data: string, filename: string) =>
      writeServerDownloadFile(serverFileSystem, data, filename),
    readFileBinary: serverFileSystem.readFileBinary,
    writeFileBinary: serverFileSystem.writeFileBinary,
    readFileBlob: serverFileSystem.readFileBlob,
    writeFileBlob: serverFileSystem.writeFileBlob,
    stat: serverFileSystem.stat,
    convertFileSrc: serverFileSystem.convertFileSrc,
    createDir: serverFileSystem.createDir,
    delete: serverFileSystem.delete,
    rename: serverFileSystem.rename,
    copyFile: serverFileSystem.copyFile,
    createPty: webPlatform.createPty,
    startPty: webPlatform.startPty,
    resizePty: webPlatform.resizePty,
    writePty: webPlatform.writePty,
    onPtyData: webPlatform.onPtyData,
    killPty: webPlatform.killPty,
    syncPtySessions: webPlatform.syncPtySessions,
    isProfessionalBrowserSupported: webPlatform.isProfessionalBrowserSupported,
    createBrowser: webPlatform.createBrowser,
  };
};

export const serverPlatform = createServerPlatform();
