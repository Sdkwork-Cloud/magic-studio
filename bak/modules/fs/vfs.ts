
import { IFileSystemProvider } from './types';
import { LocalFileSystemProvider } from './providers/local';
import { FileEntry, FileStat } from '../../platform/types';

class FileSystemManager {
  private providers = new Map<string, IFileSystemProvider>();

  constructor() {
    // Register default provider
    this.registerProvider(new LocalFileSystemProvider());
  }

  /**
   * Register a new file system provider (e.g. for 's3://' or 'remote://')
   */
  registerProvider(provider: IFileSystemProvider) {
    this.providers.set(provider.scheme, provider);
  }

  /**
   * Resolve the correct provider for a given path.
   * Defaults to 'file' scheme if none specified.
   */
  private getProvider(path: string): IFileSystemProvider {
    // Simple scheme parsing: s3://bucket/file -> scheme: s3
    const match = path.match(/^([a-zA-Z0-9]+):\/\//);
    const scheme = match ? match[1] : 'file';

    const provider = this.providers.get(scheme);
    if (!provider) {
      // Fallback for absolute paths on desktop which might not have file:// prefix explicitly
      if (scheme === 'file' || path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) {
         const local = this.providers.get('file');
         if (local) return local;
      }
      throw new Error(`No file system provider found for scheme: ${scheme}`);
    }
    return provider;
  }

  // --- Public API ---

  async readDir(path: string): Promise<FileEntry[]> {
    return this.getProvider(path).readDir(path);
  }

  // Text
  async readFile(path: string): Promise<string> {
    return this.getProvider(path).readFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    return this.getProvider(path).writeFile(path, content);
  }

  // Binary
  async readFileBinary(path: string): Promise<Uint8Array> {
    return this.getProvider(path).readFileBinary(path);
  }

  async writeFileBinary(path: string, content: Uint8Array): Promise<void> {
    return this.getProvider(path).writeFileBinary(path, content);
  }

  // Blob (Web Optimized)
  async readFileBlob(path: string): Promise<Blob> {
    return this.getProvider(path).readFileBlob(path);
  }

  async writeFileBlob(path: string, content: Blob): Promise<void> {
    return this.getProvider(path).writeFileBlob(path, content);
  }

  // Meta
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
    // Cross-provider move is not supported in this simple version
    return provider.rename(oldPath, newPath);
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const provider = this.getProvider(sourcePath);
    // Cross-provider copy fallback could be added here (read -> write)
    return provider.copy(sourcePath, destPath);
  }
}

export const vfs = new FileSystemManager();
