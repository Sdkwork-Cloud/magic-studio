import { FileEntry, FileStat, IFileSystemProvider } from 'sdkwork-react-types';
import { LocalFileSystemProvider } from './providers/local';

class FileSystemManager {
  private providers = new Map<string, IFileSystemProvider>();

  constructor() {
    this.registerProvider(new LocalFileSystemProvider());
  }

  registerProvider(provider: IFileSystemProvider) {
    this.providers.set(provider.scheme, provider);
  }

  private getProvider(path: string): IFileSystemProvider {
    const match = path.match(/^([a-zA-Z0-9]+):\/\//);
    const scheme = match ? match[1] : 'file';

    const provider = this.providers.get(scheme);
    if (!provider) {
      if (scheme === 'file' || path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) {
         const local = this.providers.get('file');
         if (local) return local;
      }
      throw new Error(`No file system provider found for scheme: ${scheme}`);
    }
    return provider;
  }

  async readDir(path: string): Promise<FileEntry[]> {
    return this.getProvider(path).readDir(path);
  }

  async readFile(path: string): Promise<string> {
    return this.getProvider(path).readFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    return this.getProvider(path).writeFile(path, content);
  }

  async readFileBinary(path: string): Promise<Uint8Array> {
    return this.getProvider(path).readFileBinary(path);
  }

  async writeFileBinary(path: string, content: Uint8Array): Promise<void> {
    return this.getProvider(path).writeFileBinary(path, content);
  }

  async readFileBlob(path: string): Promise<Blob> {
    return this.getProvider(path).readFileBlob(path);
  }

  async writeFileBlob(path: string, content: Blob): Promise<void> {
    return this.getProvider(path).writeFileBlob(path, content);
  }

  async stat(path: string): Promise<FileStat> {
    return this.getProvider(path).stat(path);
  }

  async createDir(path: string): Promise<void> {
    return this.getProvider(path).createDir(path);
  }

  async delete(path: string): Promise<void> {
    return this.getProvider(path).delete(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const provider = this.getProvider(oldPath);
    return provider.rename(oldPath, newPath);
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const provider = this.getProvider(sourcePath);
    return provider.copy(sourcePath, destPath);
  }
}

export const vfs = new FileSystemManager();
