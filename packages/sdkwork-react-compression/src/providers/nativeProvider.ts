import { ICompressionProvider } from '../types';
import { nativeCompressionInvokeService } from '../services/nativeCompressionInvokeService';

export class NativeCompressionProvider implements ICompressionProvider {
  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    await nativeCompressionInvokeService.decompressBuffer(data, targetPath);
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    await nativeCompressionInvokeService.decompressFile(sourcePath, targetPath);
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    return nativeCompressionInvokeService.compressFiles(sourcePaths);
  }
}
