import { IDriveProvider } from './types';
import { DriveItem, DriveStats } from '../../entities/drive.entity';
import { vfs } from '@sdkwork/react-fs';
import { pathUtils, logger } from '@sdkwork/react-commons';
import { platform } from '@sdkwork/react-core';

export class LocalDriveProvider implements IDriveProvider {
  name = 'Local Drive';

  async list(path: string): Promise<DriveItem[]> {
    const entryPaths = await vfs.readdir(path);

    const items: DriveItem[] = await Promise.all(
      entryPaths.map(async (entryPath: string) => {
        let size = 0;
        let lastModified = Date.now();
        let createdAt = Date.now();
        let isDirectory = false;
        let name = pathUtils.basename(entryPath);

        try {
          const stats = await vfs.stat(entryPath);
          const extendedStats = stats as typeof stats & { lastModified?: number };
          size = stats.size;
          isDirectory = stats.isDirectory;
          name = stats.name || name;
          lastModified =
            typeof extendedStats.lastModified === 'number'
              ? extendedStats.lastModified
              : Date.now();
          createdAt = typeof stats.createdAt === 'number' ? stats.createdAt : Date.now();
        } catch (e) {
          logger.warn('[LocalDriveProvider] Failed to stat entry', entryPath, e);
        }

        return {
          id: entryPath,
          parentId: path,
          name: name,
          type: isDirectory ? 'folder' : 'file',
          size: size,
          updatedAt: lastModified,
          createdAt: createdAt,
          mimeType: this.guessMimeType(name),
        };
      })
    );

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
      updatedAt: typeof stats.updatedAt === 'number' ? stats.updatedAt : Date.now(),
      createdAt: typeof stats.createdAt === 'number' ? stats.createdAt : Date.now(),
      mimeType: this.guessMimeType(name),
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
    return {
      usedBytes: 1024 * 1024 * 450,
      totalBytes: 1024 * 1024 * 1024 * 100,
      fileCount: 1205,
    };
  }

  hasCapability(cap: string): boolean {
    if (cap === 'native_import') return true;
    return false;
  }

  private guessMimeType(filename: string): string {
    const ext = pathUtils.extname(filename).toLowerCase();
    const map: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
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
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
    };
    return map[ext] || 'application/octet-stream';
  }
}
