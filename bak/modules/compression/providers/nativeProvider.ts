
import { ICompressionProvider } from '../types';
import { JszipProvider } from './jszipProvider';
import { invoke } from '@tauri-apps/api/core';

export class NativeCompressionProvider implements ICompressionProvider {
  private fallbackProvider = new JszipProvider();

  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    return this.fallbackProvider.decompress(data, targetPath);
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
      try {
          await invoke('native_unzip', { zipPath: sourcePath, targetDir: targetPath });
      } catch (e) {
          console.warn('Native unzip failed, falling back to JSZip', e);
          return this.fallbackProvider.decompressFile(sourcePath, targetPath);
      }
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
      try {
          const bytes = await invoke<number[]>('native_zip_bytes', { sourcePaths });
          return new Uint8Array(bytes);
      } catch (e) {
          console.warn('Native zip failed, falling back to JSZip', e);
          return this.fallbackProvider.compress(sourcePaths);
      }
  }
}
