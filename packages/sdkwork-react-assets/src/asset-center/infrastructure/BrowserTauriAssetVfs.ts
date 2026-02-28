import { pathUtils } from '@sdkwork/react-commons';
import { storageConfig, vfs } from '@sdkwork/react-fs';
import { platform } from '@sdkwork/react-core';
import type { AssetStorageMode } from '@sdkwork/react-types';
import type { AssetFileStat, AssetVfsPort } from '../ports/AssetVfsPort';
import { ASSET_CENTER_PROTOCOL } from '../domain/assetCenter.domain';

export class BrowserTauriAssetVfs implements AssetVfsPort {
  private libraryRoot: string | null = null;

  getMode(): AssetStorageMode {
    return platform.getPlatform() === 'desktop' ? 'tauri-fs' : 'browser-vfs';
  }

  async getLibraryRoot(): Promise<string> {
    if (this.libraryRoot) {
      return this.libraryRoot;
    }
    const documentsDir = await platform.getPath('documents');
    this.libraryRoot = pathUtils.join(documentsDir, storageConfig.library.root);
    await this.ensureDir(this.libraryRoot);
    return this.libraryRoot;
  }

  async ensureDir(path: string): Promise<void> {
    await vfs.createDir(path);
  }

  async exists(path: string): Promise<boolean> {
    return vfs.exists(path);
  }

  async list(path: string): Promise<string[]> {
    return vfs.readdir(path);
  }

  async stat(path: string): Promise<AssetFileStat> {
    const result = await vfs.stat(path);
    return {
      isDirectory: result.isDirectory,
      size: result.size
    };
  }

  async writeText(path: string, content: string): Promise<void> {
    await vfs.writeFile(path, content);
  }

  async readText(path: string): Promise<string> {
    return vfs.readFile(path);
  }

  async writeBinary(path: string, content: Uint8Array): Promise<void> {
    await vfs.writeFileBinary(path, content);
  }

  async readBinary(path: string): Promise<Uint8Array> {
    return vfs.readFileBinary(path);
  }

  async writeBlob(path: string, content: Blob): Promise<void> {
    await vfs.writeFileBlob(path, content);
  }

  async readBlob(path: string): Promise<Blob> {
    return vfs.readFileBlob(path);
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    await vfs.copyFile(sourcePath, destinationPath);
  }

  async delete(path: string): Promise<void> {
    await vfs.delete(path);
  }

  async toVirtualPath(absolutePath: string): Promise<string> {
    const root = await this.getLibraryRoot();
    const normalizedRoot = pathUtils.normalize(root);
    const normalizedPath = pathUtils.normalize(absolutePath);
    const separator = pathUtils.detectSeparator(normalizedRoot);
    const rootWithSeparator = normalizedRoot.endsWith(separator)
      ? normalizedRoot
      : `${normalizedRoot}${separator}`;

    if (normalizedPath.startsWith(rootWithSeparator)) {
      const relativePath = normalizedPath.substring(rootWithSeparator.length).replace(/\\/g, '/');
      return `${ASSET_CENTER_PROTOCOL}${relativePath}`;
    }

    if (normalizedPath === normalizedRoot) {
      return ASSET_CENTER_PROTOCOL;
    }

    return absolutePath;
  }

  async toAbsolutePath(virtualPath: string): Promise<string> {
    if (!virtualPath.startsWith(ASSET_CENTER_PROTOCOL)) {
      return virtualPath;
    }
    const root = await this.getLibraryRoot();
    const relativePath = virtualPath.substring(ASSET_CENTER_PROTOCOL.length);
    return pathUtils.join(root, relativePath);
  }
}
