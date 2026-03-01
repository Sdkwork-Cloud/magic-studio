import { FileStat } from '@sdkwork/react-types';
import { IFileSystemProvider } from '../types';

// Platform API will be injected at runtime
const getPlatformAPI = () => {
  if (typeof window !== 'undefined' && (window as any).__sdkworkPlatform) {
    return (window as any).__sdkworkPlatform;
  }
  // Fallback to no-op implementation
  return {
    readDir: async () => [] as string[],
    readFile: async () => '',
    writeFile: async () => {},
    readFileBinary: async () => new Uint8Array(),
    writeFileBinary: async () => {},
    readFileBlob: async () => new Blob(),
    writeFileBlob: async () => {},
    stat: async () => ({ 
      id: '',
      uuid: '',
      name: '',
      type: 'file' as const,
      isFile: true, 
      isDirectory: false, 
      size: 0, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString()
    } as FileStat),
    createDir: async () => {},
    delete: async () => {},
    rename: async () => {},
    copyFile: async () => {},
    exists: async () => false,
    mkdir: async () => {},
    readdir: async () => [] as string[],
    unlink: async () => {},
    rmdir: async () => {}
  };
};

const toPathName = (path: string): string => {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
};

const normalizeDirEntries = (entries: unknown): string[] => {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        if (typeof record.name === 'string' && record.name.length > 0) {
          return record.name;
        }
        if (typeof record.path === 'string' && record.path.length > 0) {
          return toPathName(record.path);
        }
      }
      return '';
    })
    .filter((item): item is string => item.length > 0);
};

export class LocalFileSystemProvider implements IFileSystemProvider {
  scheme = 'file';

  capabilities = {
    readonly: false,
    supportsStreaming: false
  };

  private get platform() {
    return getPlatformAPI() as Record<string, any>;
  }

  async readdir(path: string): Promise<string[]> {
    if (typeof this.platform.readdir === 'function') {
      const entries = await this.platform.readdir(path);
      return normalizeDirEntries(entries);
    }
    if (typeof this.platform.readDir === 'function') {
      const entries = await this.platform.readDir(path);
      return normalizeDirEntries(entries);
    }
    return [];
  }

  async readFile(path: string): Promise<string> {
    return this.platform.readFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    return this.platform.writeFile(path, content);
  }

  async readFileBinary(path: string): Promise<Uint8Array> {
    return this.platform.readFileBinary(path);
  }

  async writeFileBinary(path: string, content: Uint8Array): Promise<void> {
    return this.platform.writeFileBinary(path, content);
  }

  async readFileBlob(path: string): Promise<Blob> {
    return this.platform.readFileBlob(path);
  }

  async writeFileBlob(path: string, content: Blob): Promise<void> {
    return this.platform.writeFileBlob(path, content);
  }

  async exists(path: string): Promise<boolean> {
    if (typeof this.platform.exists === 'function') {
      return !!(await this.platform.exists(path));
    }
    if (typeof this.platform.stat === 'function') {
      try {
        await this.platform.stat(path);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async mkdir(path: string): Promise<void> {
    if (typeof this.platform.mkdir === 'function') {
      await this.platform.mkdir(path);
      return;
    }
    if (typeof this.platform.createDir === 'function') {
      await this.platform.createDir(path);
    }
  }

  async stat(path: string): Promise<FileStat> {
    if (typeof this.platform.stat === 'function') {
      const raw = await this.platform.stat(path);
      const isDirectory =
        typeof raw?.isDirectory === 'boolean'
          ? raw.isDirectory
          : raw?.type === 'directory';
      const isFile =
        typeof raw?.isFile === 'boolean'
          ? raw.isFile
          : raw?.type === 'file' || !isDirectory;
      const timestamp = (() => {
        if (typeof raw?.updatedAt === 'string') return raw.updatedAt;
        if (typeof raw?.createdAt === 'string') return raw.createdAt;
        const maybeMillis = Number(raw?.lastModified || raw?.createdAt || Date.now());
        return new Date(Number.isNaN(maybeMillis) ? Date.now() : maybeMillis).toISOString();
      })();
      return {
        id: typeof raw?.id === 'string' ? raw.id : path,
        uuid: typeof raw?.uuid === 'string' ? raw.uuid : path,
        name: typeof raw?.name === 'string' && raw.name.length > 0 ? raw.name : toPathName(path),
        path,
        isFile,
        isDirectory,
        size: Number(raw?.size || 0),
        type: isDirectory ? 'directory' : 'file',
        createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : timestamp,
        updatedAt: timestamp
      };
    }
    return {
      id: path,
      uuid: path,
      name: toPathName(path),
      path,
      isFile: true,
      isDirectory: false,
      size: 0,
      type: 'file',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async unlink(path: string): Promise<void> {
    if (typeof this.platform.unlink === 'function') {
      await this.platform.unlink(path);
      return;
    }
    if (typeof this.platform.delete === 'function') {
      await this.platform.delete(path);
    }
  }

  async rmdir(path: string): Promise<void> {
    if (typeof this.platform.rmdir === 'function') {
      await this.platform.rmdir(path);
      return;
    }
    if (typeof this.platform.delete === 'function') {
      await this.platform.delete(path);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    return this.platform.rename(oldPath, newPath);
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    return this.platform.copyFile(sourcePath, destPath);
  }
}
