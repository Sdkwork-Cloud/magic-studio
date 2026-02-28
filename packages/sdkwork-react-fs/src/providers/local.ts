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

export class LocalFileSystemProvider implements IFileSystemProvider {
  scheme = 'file';

  capabilities = {
    readonly: false,
    supportsStreaming: false
  };

  private get platform() {
    return getPlatformAPI();
  }

  async readdir(path: string): Promise<string[]> {
    return this.platform.readdir(path);
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
    return this.platform.exists(path);
  }

  async mkdir(path: string): Promise<void> {
    return this.platform.mkdir(path);
  }

  async stat(path: string): Promise<FileStat> {
    return this.platform.stat(path);
  }

  async unlink(path: string): Promise<void> {
    return this.platform.unlink(path);
  }

  async rmdir(path: string): Promise<void> {
    return this.platform.rmdir(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    return this.platform.rename(oldPath, newPath);
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    return this.platform.copyFile(sourcePath, destPath);
  }
}
