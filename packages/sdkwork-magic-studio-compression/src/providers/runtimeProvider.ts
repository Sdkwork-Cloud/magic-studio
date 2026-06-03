import { ICompressionProvider } from '../types';
import { runtimeCompressionService } from '../services/runtimeCompressionService';

export class RuntimeCompressionProvider implements ICompressionProvider {
  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    await runtimeCompressionService.decompressBuffer(data, targetPath);
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    await runtimeCompressionService.decompressFile(sourcePath, targetPath);
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    return runtimeCompressionService.compressFiles(sourcePaths);
  }
}
