
export interface ICompressionProvider {
  /**
   * Decompress a binary buffer into the target path.
   * @param data The raw zip/tar data
   * @param targetPath The destination directory in the VFS
   */
  decompress(data: Uint8Array, targetPath: string): Promise<void>;

  /**
   * Optimized decompression from a file path on disk.
   * Falls back to memory decompression if not supported.
   * @param sourcePath The path to the zip file on disk
   * @param targetPath The destination directory
   */
  decompressFile(sourcePath: string, targetPath: string): Promise<void>;

  /**
   * Compress a list of files/folders into a single archive buffer.
   * @param sourcePaths List of VFS paths to compress
   */
  compress(sourcePaths: string[]): Promise<Uint8Array>;
}
