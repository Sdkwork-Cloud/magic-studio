
import { ICompressionProvider } from './types';
import { JszipProvider } from './providers/jszipProvider';
import { NativeCompressionProvider } from './providers/nativeProvider';
import { platform } from '../../platform';

class CompressionService implements ICompressionProvider {
  private provider: ICompressionProvider;

  constructor() {
    const platformType = platform.getPlatform();
    
    if (platformType === 'desktop') {
        this.provider = new NativeCompressionProvider(); 
    } else {
        this.provider = new JszipProvider();
    }
  }

  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    return this.provider.decompress(data, targetPath);
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    return this.provider.decompressFile(sourcePath, targetPath);
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    return this.provider.compress(sourcePaths);
  }
}

export const compressionService = new CompressionService();
