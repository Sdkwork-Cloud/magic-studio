import { vfs } from '@sdkwork/react-fs';
import type { AssetStorageMode } from '@sdkwork/react-types';
import { pathUtils } from '@sdkwork/react-commons';
import { platform } from '../../../../sdkwork-react-core/src/platform';
import { loadResolvedMagicStudioStorageConfig } from '../application/magicStudioStorageConfig';
import {
  resolveManagedAssetAbsolutePath,
  resolveManagedAssetVirtualPath
} from '../application/magicStudioAssetLayout';
import type { AssetFileStat, AssetVfsPort } from '../ports/AssetVfsPort';
import { ASSET_CENTER_PROTOCOL } from '../domain/assetCenter.domain';

const WINDOWS_DRIVE_PATTERN = /^[a-zA-Z]:$/;

const buildDirectoryChain = (inputPath: string): string[] => {
  const normalizedPath = pathUtils.normalize(inputPath);
  if (!normalizedPath) {
    return [];
  }

  const segments = normalizedPath.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0) {
    return [];
  }

  const usesBackslash = normalizedPath.includes('\\');
  const separator = usesBackslash ? '\\' : '/';
  const chain: string[] = [];

  if (normalizedPath.startsWith('\\\\') && segments.length >= 2) {
    let current = `\\\\${segments[0]}\\${segments[1]}`;
    for (const segment of segments.slice(2)) {
      current = `${current}\\${segment}`;
      chain.push(current);
    }
    return chain;
  }

  let current = '';
  let index = 0;

  if (WINDOWS_DRIVE_PATTERN.test(segments[0])) {
    current = `${segments[0]}${separator}`;
    index = 1;
  } else if (normalizedPath.startsWith('/')) {
    current = separator;
  }

  for (const segment of segments.slice(index)) {
    if (!segment) {
      continue;
    }

    if (!current || current === separator) {
      current = current === separator ? `${separator}${segment}` : segment;
    } else if (current.endsWith(separator)) {
      current = `${current}${segment}`;
    } else {
      current = `${current}${separator}${segment}`;
    }

    chain.push(current);
  }

  return chain;
};

export class BrowserTauriAssetVfs implements AssetVfsPort {
  getMode(): AssetStorageMode {
    return platform.getPlatform() === 'desktop' ? 'tauri-fs' : 'browser-vfs';
  }

  async getMagicStudioStorageConfig() {
    const homeDir = await platform.getPath('home');
    return loadResolvedMagicStudioStorageConfig(homeDir);
  }

  async getLibraryRoot(): Promise<string> {
    const storageConfig = await this.getMagicStudioStorageConfig();
    await this.ensureDir(storageConfig.rootDir);
    return storageConfig.rootDir;
  }

  async ensureDir(path: string): Promise<void> {
    const directoryChain = buildDirectoryChain(path);
    if (directoryChain.length === 0) {
      await vfs.createDir(path);
      return;
    }

    for (const directory of directoryChain) {
      if (await vfs.exists(directory)) {
        continue;
      }
      await vfs.createDir(directory);
    }
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
    const storageConfig = await this.getMagicStudioStorageConfig();
    return resolveManagedAssetVirtualPath(storageConfig, absolutePath);
  }

  async toAbsolutePath(virtualPath: string): Promise<string> {
    if (!virtualPath.startsWith(ASSET_CENTER_PROTOCOL)) {
      return virtualPath;
    }
    const relativePath = virtualPath.substring(ASSET_CENTER_PROTOCOL.length);
    const storageConfig = await this.getMagicStudioStorageConfig();
    return resolveManagedAssetAbsolutePath(storageConfig, relativePath);
  }
}
