import JSZip from 'jszip';
import { ICompressionProvider } from '../types';

export class JszipProvider implements ICompressionProvider {
  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    const zip = await JSZip.loadAsync(data);
    
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      
      await zipEntry.async('uint8array');
      console.log(`[JszipProvider] Would extract: ${relativePath} to ${targetPath}`);
    }
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    console.log(`[JszipProvider] decompressFile from ${sourcePath} to ${targetPath}`);
    throw new Error('JszipProvider does not support decompressFile directly. Use decompress() with file content.');
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    const zip = new JSZip();
    
    console.log(`[JszipProvider] Would compress: ${sourcePaths.join(', ')}`);
    
    return await zip.generateAsync({ type: 'uint8array' });
  }
}
