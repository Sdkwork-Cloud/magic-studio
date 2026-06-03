import { readWindowPlatformRuntime } from '@sdkwork/magic-studio-commons/services';
import type { FileStat } from '@sdkwork/magic-studio-types/infrastructure';

export interface RuntimeFsPlatformApi {
  readDir(path: string): Promise<unknown>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readFileBinary(path: string): Promise<Uint8Array>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  readFileBlob(path: string): Promise<Blob>;
  writeFileBlob(path: string, content: Blob): Promise<void>;
  stat(path: string): Promise<unknown>;
  createDir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copyFile(sourcePath: string, destPath: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<unknown>;
  unlink(path: string): Promise<void>;
  rmdir(path: string): Promise<void>;
}

export interface RuntimePlatformServiceAdapter {
  getPlatformApi(): RuntimeFsPlatformApi;
}

const buildFallbackStat = (): FileStat => ({
  id: '',
  uuid: '',
  name: '',
  type: 'file',
  isFile: true,
  isDirectory: false,
  size: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const FALLBACK_PLATFORM_API: RuntimeFsPlatformApi = {
  readDir: async () => [],
  readFile: async () => '',
  writeFile: async () => {},
  readFileBinary: async () => new Uint8Array(),
  writeFileBinary: async () => {},
  readFileBlob: async () => new Blob(),
  writeFileBlob: async () => {},
  stat: async () => buildFallbackStat(),
  createDir: async () => {},
  delete: async () => {},
  rename: async () => {},
  copyFile: async () => {},
  exists: async () => false,
  mkdir: async () => {},
  readdir: async () => [],
  unlink: async () => {},
  rmdir: async () => {}
};

interface RuntimePlatformBridge {
  fileSystem?: {
    readDir?: (path: string) => Promise<unknown>;
    readText?: (path: string) => Promise<string>;
    writeText?: (path: string, content: string) => Promise<void>;
    readBinary?: (path: string) => Promise<Uint8Array>;
    writeBinary?: (path: string, content: Uint8Array) => Promise<void>;
    readBlob?: (path: string) => Promise<Blob>;
    writeBlob?: (path: string, content: Blob) => Promise<void>;
    stat?: (path: string) => Promise<unknown>;
    createDir?: (path: string) => Promise<void>;
    remove?: (path: string) => Promise<void>;
    rename?: (oldPath: string, newPath: string) => Promise<void>;
    copy?: (sourcePath: string, destinationPath: string) => Promise<void>;
    exists?: (path: string) => Promise<boolean>;
  };
}

const getPlatformRuntimeBridge = (): RuntimePlatformBridge | null =>
  readWindowPlatformRuntime<RuntimePlatformBridge>();

const localRuntimePlatformAdapter: RuntimePlatformServiceAdapter = {
  getPlatformApi(): RuntimeFsPlatformApi {
    const fileSystem = getPlatformRuntimeBridge()?.fileSystem;
    if (!fileSystem) {
      return FALLBACK_PLATFORM_API;
    }

    return {
      ...FALLBACK_PLATFORM_API,
      readDir: async (path: string): Promise<unknown> =>
        fileSystem.readDir ? fileSystem.readDir(path) : FALLBACK_PLATFORM_API.readDir(path),
      readFile: async (path: string): Promise<string> =>
        fileSystem.readText ? fileSystem.readText(path) : FALLBACK_PLATFORM_API.readFile(path),
      writeFile: async (path: string, content: string): Promise<void> => {
        if (fileSystem.writeText) {
          await fileSystem.writeText(path, content);
        }
      },
      readFileBinary: async (path: string): Promise<Uint8Array> =>
        fileSystem.readBinary
          ? fileSystem.readBinary(path)
          : FALLBACK_PLATFORM_API.readFileBinary(path),
      writeFileBinary: async (path: string, content: Uint8Array): Promise<void> => {
        if (fileSystem.writeBinary) {
          await fileSystem.writeBinary(path, content);
        }
      },
      readFileBlob: async (path: string): Promise<Blob> =>
        fileSystem.readBlob ? fileSystem.readBlob(path) : FALLBACK_PLATFORM_API.readFileBlob(path),
      writeFileBlob: async (path: string, content: Blob): Promise<void> => {
        if (fileSystem.writeBlob) {
          await fileSystem.writeBlob(path, content);
        }
      },
      stat: async (path: string): Promise<unknown> =>
        fileSystem.stat ? fileSystem.stat(path) : FALLBACK_PLATFORM_API.stat(path),
      createDir: async (path: string): Promise<void> => {
        if (fileSystem.createDir) {
          await fileSystem.createDir(path);
        }
      },
      delete: async (path: string): Promise<void> => {
        if (fileSystem.remove) {
          await fileSystem.remove(path);
        }
      },
      rename: async (oldPath: string, newPath: string): Promise<void> => {
        if (fileSystem.rename) {
          await fileSystem.rename(oldPath, newPath);
        }
      },
      copyFile: async (sourcePath: string, destPath: string): Promise<void> => {
        if (fileSystem.copy) {
          await fileSystem.copy(sourcePath, destPath);
        }
      },
      exists: async (path: string): Promise<boolean> =>
        fileSystem.exists ? fileSystem.exists(path) : FALLBACK_PLATFORM_API.exists(path),
      mkdir: async (path: string): Promise<void> => {
        if (fileSystem.createDir) {
          await fileSystem.createDir(path);
        }
      },
      readdir: async (path: string): Promise<unknown> =>
        fileSystem.readDir ? fileSystem.readDir(path) : FALLBACK_PLATFORM_API.readdir(path),
      unlink: async (path: string): Promise<void> => {
        if (fileSystem.remove) {
          await fileSystem.remove(path);
        }
      },
      rmdir: async (path: string): Promise<void> => {
        if (fileSystem.remove) {
          await fileSystem.remove(path);
        }
      }
    };
  }
};

let currentRuntimePlatformAdapter: RuntimePlatformServiceAdapter =
  localRuntimePlatformAdapter;

export const runtimePlatformService: RuntimePlatformServiceAdapter = {
  getPlatformApi(): RuntimeFsPlatformApi {
    return currentRuntimePlatformAdapter.getPlatformApi();
  }
};

export const setRuntimePlatformServiceAdapter = (
  adapter: RuntimePlatformServiceAdapter
): void => {
  currentRuntimePlatformAdapter = adapter;
};

export const getRuntimePlatformServiceAdapter = (): RuntimePlatformServiceAdapter =>
  currentRuntimePlatformAdapter;

export const resetRuntimePlatformServiceAdapter = (): void => {
  currentRuntimePlatformAdapter = localRuntimePlatformAdapter;
};
