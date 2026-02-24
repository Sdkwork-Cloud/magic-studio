import { ICompressionProvider } from '../types';

export class NativeCompressionProvider implements ICompressionProvider {
  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('decompress_buffer', { data: Array.from(data), targetPath });
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('decompress_file', { sourcePath, targetPath });
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<number[]>('compress_files', { sourcePaths });
    return new Uint8Array(result);
  }
}
