
import JSZip from 'jszip';
import { ICompressionProvider } from '../types';
import { vfs } from '../../fs/vfs';
import { pathUtils } from '../../../utils/pathUtils';

export class JszipProvider implements ICompressionProvider {
  async decompress(data: Uint8Array, targetPath: string): Promise<void> {
    const zip = await JSZip.loadAsync(data);
    const promises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // 0. Sanitize Path
      // Remove leading slashes/dots to prevent absolute path confusion or relative traversals
      // Replace double slashes with single
      let safePath = relativePath.replace(/^[/\\]+/, '').replace(/^\.\//, '').replace(/\/+/g, '/');
      
      // Remove trailing slash if it exists, to treat directory paths canonically
      if (safePath.endsWith('/')) {
          safePath = safePath.slice(0, -1);
      }

      // 1. Ignore Metadata and Garbage, and EMPTY paths
      if (!safePath || safePath === '.' || safePath.startsWith('__MACOSX') || safePath.includes('.DS_Store')) return;

      promises.push((async () => {
        // 2. Security: Prevent directory traversal
        if (safePath.includes('..')) {
             console.warn(`Skipping unsafe path: ${safePath}`);
             return;
        }

        // 3. Resolve absolute path in VFS
        // pathUtils.join now ensures no trailing slashes
        const fullPath = pathUtils.join(targetPath, safePath);

        // 4. Handle Directory Entry
        if (zipEntry.dir) {
          try {
            // Use createDir which should be recursive in platform impl
            await vfs.createDir(fullPath);
          } catch (e) {
            // Ignore if exists
          }
          return;
        }

        // 5. Handle File Entry
        // Ensure parent exists (recursively via platform)
        const parentDir = pathUtils.dirname(fullPath);
        if (parentDir && parentDir !== fullPath) {
             try {
                await vfs.createDir(parentDir);
             } catch (e) {
                // Parent likely exists
             }
        }

        const content = await zipEntry.async('uint8array');
        await vfs.writeFileBinary(fullPath, content);
      })());
    });

    await Promise.all(promises);
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    // Fallback: Read file into memory then decompress
    const data = await vfs.readFileBinary(sourcePath);
    return this.decompress(data, targetPath);
  }

  async compress(sourcePaths: string[]): Promise<Uint8Array> {
    const zip = new JSZip();

    for (const sourcePath of sourcePaths) {
      await this.addToZipRecursive(zip, sourcePath, '');
    }

    return await zip.generateAsync({ type: 'uint8array' });
  }

  private async addToZipRecursive(zip: JSZip, currentPath: string, zipPath: string): Promise<void> {
      try {
          const stats = await vfs.stat(currentPath);
          const name = pathUtils.basename(currentPath);
          
          if (!name || name === '.DS_Store' || name === '__MACOSX' || name === 'node_modules' || name === '.git') return; 

          const nextZipPath = zipPath ? `${zipPath}/${name}` : name;

          if (stats.type === 'directory') {
              const folder = zip.folder(nextZipPath);
              if (!folder) return;
              const children = await vfs.readDir(currentPath);
              for (const child of children) {
                  // Pass the newly created path (nextZipPath) as the parent for children
                  await this.addToZipRecursive(zip, child.path, nextZipPath);
              }
          } else {
              const content = await vfs.readFileBinary(currentPath);
              zip.file(nextZipPath, content);
          }
      } catch (e) {
          console.warn(`Failed to compress ${currentPath}`, e);
      }
  }
}
