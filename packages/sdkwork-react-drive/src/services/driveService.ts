import { IDriveProvider } from './providers/types';
import { LocalDriveProvider } from './providers/localProvider';
import { driveMetadataService } from './driveMetadataService';
import { DriveItem } from '../entities';
import { platform } from '@sdkwork/react-core';

class DriveService {
  private activeProvider: IDriveProvider;

  constructor() {
    this.activeProvider = new LocalDriveProvider();
  }

  getProvider(): IDriveProvider {
    return this.activeProvider;
  }

  async getDefaultPath(): Promise<string> {
    if (platform.getPlatform() === 'web') {
      return '/mock/assets';
    }
    return await platform.getPath('documents');
  }

  async list(path: string): Promise<DriveItem[]> {
    if (path.startsWith('virtual://')) {
      return this.listVirtual(path);
    }

    const physicalItems = await this.activeProvider.list(path);

    const mergedItems: DriveItem[] = [];

    for (const item of physicalItems) {
      const meta = await driveMetadataService.getMeta(item.id);
      const fullItem = {
        ...item,
        isStarred: meta?.isStarred || false,
        trashedAt: meta?.trashedAt || null,
        accessedAt: meta?.accessedAt,
      };

      if (!fullItem.trashedAt) {
        mergedItems.push(fullItem);
      }
    }

    return mergedItems;
  }

  private async listVirtual(virtualPath: string): Promise<DriveItem[]> {
    let paths: string[] = [];

    switch (virtualPath) {
      case 'virtual://starred':
        paths = await driveMetadataService.getStarredPaths();
        break;
      case 'virtual://recent':
        paths = await driveMetadataService.getRecentPaths();
        break;
      case 'virtual://trash':
        paths = await driveMetadataService.getTrashedPaths();
        break;
      default:
        return [];
    }

    const items = await Promise.all(
      paths.map(async p => {
        try {
          const item = await this.activeProvider.stat(p);
          const meta = await driveMetadataService.getMeta(p);
          return {
            ...item,
            isStarred: meta?.isStarred || false,
            trashedAt: meta?.trashedAt || null,
            accessedAt: meta?.accessedAt,
          };
        } catch {
          return null;
        }
      })
    );

    return items.filter(Boolean) as DriveItem[];
  }

  async createFolder(name: string, parentPath: string) {
    return this.activeProvider.createFolder(name, parentPath);
  }

  async uploadFile(parentPath: string, name: string, content: Uint8Array) {
    return this.activeProvider.writeFile(parentPath, name, content);
  }

  async importFile(parentPath: string, sourcePath: string) {
    if (this.activeProvider.hasCapability('native_import')) {
      return this.activeProvider.importFile(parentPath, sourcePath);
    }
    throw new Error('Provider does not support native import');
  }

  async delete(paths: string[]) {
    const timestamp = Date.now();
    for (const p of paths) {
      await driveMetadataService.updateMeta(p, { trashedAt: timestamp });
    }
  }

  async restore(paths: string[]) {
    for (const p of paths) {
      await driveMetadataService.updateMeta(p, { trashedAt: null });
    }
  }

  async emptyTrash() {
    const paths = await driveMetadataService.getTrashedPaths();
    await this.activeProvider.delete(paths);
    for (const p of paths) {
      await driveMetadataService.updateMeta(p, {
        trashedAt: null,
        isStarred: false,
        accessedAt: undefined,
      });
    }
  }

  async rename(path: string, newName: string) {
    await this.activeProvider.rename(path, newName);
  }

  async toggleStar(path: string, status: boolean) {
    await driveMetadataService.updateMeta(path, { isStarred: status });
  }

  async touch(path: string) {
    await driveMetadataService.updateMeta(path, { accessedAt: Date.now() });
  }
}

export const driveService = new DriveService();
