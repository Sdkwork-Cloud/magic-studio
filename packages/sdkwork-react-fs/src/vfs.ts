import { FileStat, IFileSystemProvider } from '@sdkwork/react-types';
import { LocalFileSystemProvider } from './providers/local';

class FileSystemManager {
  private providers = new Map<string, IFileSystemProvider>();

  constructor() {
    this.registerProvider(new LocalFileSystemProvider());
  }

  registerProvider(provider: IFileSystemProvider) {
    const scheme = provider.scheme || 'file';
    this.providers.set(scheme, provider);
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

  async readdir(path: string): Promise<string[]> {
    return this.getProvider(path).readdir(path);
  }

  async readFile(path: string): Promise<string> {
    return this.getProvider(path).readFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    return this.getProvider(path).writeFile(path, content);
  }

  async readFileBinary(path: string): Promise<Uint8Array> {
    const provider = this.getProvider(path);
    if (provider.readFileBinary) {
      return provider.readFileBinary(path);
    }
    const content = await provider.readFile(path);
    return new TextEncoder().encode(content);
  }

  async writeFileBinary(path: string, content: Uint8Array): Promise<void> {
    const provider = this.getProvider(path);
    if (provider.writeFileBinary) {
      return provider.writeFileBinary(path, content);
    }
    const text = new TextDecoder().decode(content);
    return provider.writeFile(path, text);
  }

  async readFileBlob(path: string): Promise<Blob> {
    const provider = this.getProvider(path);
    if (provider.readFileBlob) {
      return provider.readFileBlob(path);
    }
    if (provider.readFileBinary) {
      const binary = await provider.readFileBinary(path);
      const copy = new Uint8Array(binary.byteLength);
      copy.set(binary);
      return new Blob([copy.buffer]);
    }
    const content = await provider.readFile(path);
    return new Blob([content]);
  }

  async writeFileBlob(path: string, content: Blob): Promise<void> {
    const provider = this.getProvider(path);
    if (provider.writeFileBlob) {
      return provider.writeFileBlob(path, content);
    }
    if (provider.writeFileBinary) {
      const buffer = await content.arrayBuffer();
      return provider.writeFileBinary(path, new Uint8Array(buffer));
    }
    const text = await content.text();
    return provider.writeFile(path, text);
  }

  async stat(path: string): Promise<FileStat> {
    return this.getProvider(path).stat(path);
  }

  async mkdir(path: string): Promise<void> {
    return this.getProvider(path).mkdir(path);
  }

  async delete(path: string): Promise<void> {
    return this.getProvider(path).unlink(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const sourceProvider = this.getProvider(oldPath);
    const targetProvider = this.getProvider(newPath);
    if (sourceProvider === targetProvider && sourceProvider.rename) {
      return sourceProvider.rename(oldPath, newPath);
    }

    const content = await this.readFileBinary(oldPath);
    await this.writeFileBinary(newPath, content);
    await this.delete(oldPath);
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const sourceProvider = this.getProvider(sourcePath);
    const targetProvider = this.getProvider(destPath);
    if (sourceProvider === targetProvider && sourceProvider.copyFile) {
      return sourceProvider.copyFile(sourcePath, destPath);
    }

    const content = await this.readFileBinary(sourcePath);
    await this.writeFileBinary(destPath, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.getProvider(path).exists(path);
  }

  async unlink(path: string): Promise<void> {
    return this.getProvider(path).unlink(path);
  }

  async rmdir(path: string): Promise<void> {
    return this.getProvider(path).rmdir(path);
  }

  // Alias for mkdir for backward compatibility
  async createDir(path: string): Promise<void> {
    return this.mkdir(path);
  }
}

export const vfs = new FileSystemManager();
