import { FileStat } from '@sdkwork/react-types';

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

const localRuntimePlatformAdapter: RuntimePlatformServiceAdapter = {
  getPlatformApi(): RuntimeFsPlatformApi {
    if (typeof window === 'undefined') {
      return FALLBACK_PLATFORM_API;
    }

    const globalWindow = window as Window & { __sdkworkPlatform?: unknown };
    const platform = globalWindow.__sdkworkPlatform;
    if (!platform || typeof platform !== 'object') {
      return FALLBACK_PLATFORM_API;
    }

    return {
      ...FALLBACK_PLATFORM_API,
      ...(platform as Partial<RuntimeFsPlatformApi>)
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
