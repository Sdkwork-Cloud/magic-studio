
import { platform } from '../../../platform';
import { FileEntry, FileStat } from '../../../platform/types';
import { IFileSystemProvider } from '../types';

export class LocalFileSystemProvider implements IFileSystemProvider {
  scheme = 'file';
  
  capabilities = {
    readonly: false,
    supportsStreaming: false
  };

  async readDir(path: string): Promise<FileEntry[]> {
    return platform.readDir(path);
  }

  async readFile(path: string): Promise<string> {
    return platform.readFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    return platform.writeFile(path, content);
  }

  async readFileBinary(path: string): Promise<Uint8Array> {
    return platform.readFileBinary(path);
  }

  async writeFileBinary(path: string, content: Uint8Array): Promise<void> {
    return platform.writeFileBinary(path, content);
  }

  async readFileBlob(path: string): Promise<Blob> {
    return platform.readFileBlob(path);
  }

  async writeFileBlob(path: string, content: Blob): Promise<void> {
    return platform.writeFileBlob(path, content);
  }

  async stat(path: string): Promise<FileStat> {
    return platform.stat(path);
  }

  async createDir(path: string): Promise<void> {
    return platform.createDir(path);
  }

  async delete(path: string): Promise<void> {
    return platform.delete(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    return platform.rename(oldPath, newPath);
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    return platform.copyFile(sourcePath, destPath);
  }
}
