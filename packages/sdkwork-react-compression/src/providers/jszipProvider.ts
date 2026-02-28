import { ICompressionProvider } from '../types';

interface JsZipEntry {
  dir: boolean;
  async: (type: 'uint8array') => Promise<Uint8Array>;
}

interface JsZipLike {
  files: Record<string, JsZipEntry>;
  generateAsync: (options: { type: 'uint8array' }) => Promise<Uint8Array>;
}

interface JsZipConstructor {
  new (): JsZipLike;
  loadAsync: (data: Uint8Array) => Promise<JsZipLike>;
}

const loadJsZip = async (): Promise<JsZipConstructor> => {
  const moduleName = 'jszip';
  const jsZipModule: unknown = await import(moduleName);
  const constructor =
    typeof jsZipModule === 'object' &&
    jsZipModule !== null &&
    'default' in jsZipModule
      ? (jsZipModule.default as JsZipConstructor | undefined)
      : undefined;

  if (!constructor) {
    throw new Error('JSZip module is unavailable');
  }
  return constructor;
};

export class JszipProvider implements ICompressionProvider {
  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    const JSZip = await loadJsZip();
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
    const JSZip = await loadJsZip();
    const zip = new JSZip();
    
    console.log(`[JszipProvider] Would compress: ${sourcePaths.join(', ')}`);
    
    return await zip.generateAsync({ type: 'uint8array' });
  }
}
