
import { IDriveProvider } from './types';
import { DriveItem, DriveStats } from '../../entities/drive.entity';
import { vfs } from '../../../fs/vfs';
import { pathUtils } from '../../../../utils/pathUtils';
import { platform } from '../../../../platform';
import { logger } from '../../../../utils/logger';

export class LocalDriveProvider implements IDriveProvider {
  name = 'Local Drive';

  async list(path: string): Promise<DriveItem[]> {
    const entries = await vfs.readDir(path);
    
    // Map Platform FileEntry to DriveItem
    const items: DriveItem[] = await Promise.all(entries.map(async (entry) => {
       let size = 0;
       let lastModified = Date.now();
       let createdAt = Date.now();

       try {
           // Batching this in a real app would be better
           const stats = await vfs.stat(entry.path);
           size = stats.size;
           lastModified = stats.lastModified;
           createdAt = stats.createdAt || Date.now();
       } catch (e) {
           logger.warn('[LocalDriveProvider] Failed to stat entry', entry.path, e);
       }

       return {
           id: entry.path,
           parentId: path,
           name: entry.name,
           type: entry.isDirectory ? 'folder' : 'file',
           size: size,
           updatedAt: lastModified,
           createdAt: createdAt,
           mimeType: this.guessMimeType(entry.name)
       };
    }));

    return items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    });
  }

  async stat(path: string): Promise<DriveItem> {
      const stats = await vfs.stat(path);
      const name = pathUtils.basename(path);
      const parent = pathUtils.dirname(path);
      
      return {
          id: path,
          parentId: parent === path ? null : parent,
          name: name,
          type: stats.type === 'directory' ? 'folder' : 'file',
          size: stats.size,
          updatedAt: stats.lastModified,
          createdAt: stats.createdAt || Date.now(),
          mimeType: this.guessMimeType(name)
      };
  }

  async createFolder(name: string, parentPath: string): Promise<void> {
      const fullPath = pathUtils.join(parentPath, name);
      await vfs.createDir(fullPath);
  }

  async writeFile(parentPath: string, name: string, content: Uint8Array): Promise<void> {
      const fullPath = pathUtils.join(parentPath, name);
      await vfs.writeFileBinary(fullPath, content);
  }

  async importFile(parentPath: string, sourcePath: string): Promise<void> {
      const name = pathUtils.basename(sourcePath);
      const destPath = pathUtils.join(parentPath, name);
      
      // Native Copy
      await platform.copyFile(sourcePath, destPath);
  }

  async rename(path: string, newName: string): Promise<void> {
      const dir = pathUtils.dirname(path);
      const newPath = pathUtils.join(dir, newName);
      await vfs.rename(path, newPath);
  }

  async delete(paths: string[]): Promise<void> {
      for (const p of paths) {
          await vfs.delete(p);
      }
  }

  async move(paths: string[], targetPath: string): Promise<void> {
      for (const p of paths) {
          const name = pathUtils.basename(p);
          const dest = pathUtils.join(targetPath, name);
          await vfs.rename(p, dest);
      }
  }

  async getStats(): Promise<DriveStats> {
      // Mock stats for local drive (calculating real recursive size is expensive)
      return {
          usedBytes: 1024 * 1024 * 450, // 450 MB Mock
          totalBytes: 1024 * 1024 * 1024 * 100, // 100 GB Mock
          fileCount: 1205
      };
  }

  hasCapability(cap: string): boolean {
      if (cap === 'native_import') return true;
      return false; 
  }

  private guessMimeType(filename: string): string {
      const ext = pathUtils.extname(filename).toLowerCase();
      const map: Record<string, string> = {
          // Images
          '.png': 'image/png', 
          '.jpg': 'image/jpeg', 
          '.jpeg': 'image/jpeg', 
          '.svg': 'image/svg+xml',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp',
          
          // Video
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.mov': 'video/quicktime',
          '.mkv': 'video/x-matroska',
          '.avi': 'video/x-msvideo',
          
          // Audio
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
          '.m4a': 'audio/mp4',
          '.flac': 'audio/flac',

          // Code
          '.js': 'text/javascript', 
          '.ts': 'text/typescript', 
          '.tsx': 'text/typescript',
          '.jsx': 'text/javascript',
          '.json': 'application/json', 
          '.html': 'text/html',
          '.css': 'text/css',
          '.py': 'text/x-python',
          '.rs': 'text/x-rust',
          '.yaml': 'text/yaml',
          '.yml': 'text/yaml',
          '.md': 'text/markdown',
          
          // Documents
          '.txt': 'text/plain',
          '.pdf': 'application/pdf', 
          '.csv': 'text/csv',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          
          // Archives
          '.zip': 'application/zip', 
          '.rar': 'application/vnd.rar',
          '.7z': 'application/x-7z-compressed',
          '.tar': 'application/x-tar',
          '.gz': 'application/gzip'
      };
      return map[ext] || 'application/octet-stream';
  }
}
