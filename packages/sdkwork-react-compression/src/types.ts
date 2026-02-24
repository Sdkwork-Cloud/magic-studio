export interface ICompressionProvider {
  decompress(data: Uint8Array, targetPath: string): Promise<void>;
  decompressFile(sourcePath: string, targetPath: string): Promise<void>;
  compress(sourcePaths: string[]): Promise<Uint8Array>;
}
