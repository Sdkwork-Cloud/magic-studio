import { getPlatformRuntime, isDesktopShellRuntimeKind } from '@sdkwork/magic-studio-core/platform';
import { ICompressionProvider } from './types';
import { JszipProvider } from './providers/jszipProvider';
import { RuntimeCompressionProvider } from './providers/runtimeProvider';

class CompressionService implements ICompressionProvider {
  private browserProvider: ICompressionProvider | null = null;
  private runtimeProvider: ICompressionProvider | null = null;

  private getProvider(): ICompressionProvider {
    if (
      typeof window !== 'undefined'
      && isDesktopShellRuntimeKind(getPlatformRuntime().system.kind())
    ) {
      if (!this.runtimeProvider) {
        this.runtimeProvider = new RuntimeCompressionProvider();
      }
      return this.runtimeProvider;
    }

    if (!this.browserProvider) {
      this.browserProvider = new JszipProvider();
    }
    return this.browserProvider;
  }

  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    return this.getProvider().decompress(data, targetPath);
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    return this.getProvider().decompressFile(sourcePath, targetPath);
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    return this.getProvider().compress(sourcePaths);
  }
}

export const compressionService = new CompressionService();
