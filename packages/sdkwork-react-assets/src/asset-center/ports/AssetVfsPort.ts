import type { AssetStorageMode } from '@sdkwork/react-types';

export interface AssetFileStat {
  isDirectory: boolean;
  size: number;
}

export interface AssetVfsPort {
  getMode(): AssetStorageMode;
  getLibraryRoot(): Promise<string>;
  ensureDir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(path: string): Promise<string[]>;
  stat(path: string): Promise<AssetFileStat>;
  writeText(path: string, content: string): Promise<void>;
  readText(path: string): Promise<string>;
  writeBinary(path: string, content: Uint8Array): Promise<void>;
  readBinary(path: string): Promise<Uint8Array>;
  writeBlob(path: string, content: Blob): Promise<void>;
  readBlob(path: string): Promise<Blob>;
  copyFile(sourcePath: string, destinationPath: string): Promise<void>;
  delete(path: string): Promise<void>;
  toVirtualPath(absolutePath: string): Promise<string>;
  toAbsolutePath(virtualPath: string): Promise<string>;
}
