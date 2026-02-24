
import { IDriveProvider } from './providers/types';
import { LocalDriveProvider } from './providers/localProvider';
import { driveMetadataService } from './driveMetadataService';
import { DriveItem } from '../entities/drive.entity';
import { platform } from '../../../platform';

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

  // --- Core Listing Logic ---

  async list(path: string): Promise<DriveItem[]> {
      // 1. Virtual Views (Metadata Driven)
      if (path.startsWith('virtual://')) {
          return this.listVirtual(path);
      }

      // 2. Physical Views (Provider Driven)
      const physicalItems = await this.activeProvider.list(path);
      
      // 3. Hydrate with Metadata & Apply Filters
      const mergedItems: DriveItem[] = [];
      
      for (const item of physicalItems) {
          const meta = await driveMetadataService.getMeta(item.id);
          const fullItem = {
              ...item,
              isStarred: meta?.isStarred || false,
              trashedAt: meta?.trashedAt || null,
              accessedAt: meta?.accessedAt
          };

          // Filter: Don't show trashed items in normal folders
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

      // Hydrate items from provider
      // We process concurrently but gracefully handle missing files (if physically deleted outside app)
      const items = await Promise.all(paths.map(async (p) => {
          try {
              const item = await this.activeProvider.stat(p);
              const meta = await driveMetadataService.getMeta(p);
              return {
                  ...item,
                  isStarred: meta?.isStarred || false,
                  trashedAt: meta?.trashedAt || null,
                  accessedAt: meta?.accessedAt
              };
          } catch (e) {
              // File might be gone physically
              return null;
          }
      }));

      return items.filter(Boolean) as DriveItem[];
  }

  // --- Operations ---

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

  // Soft Delete (Move to Trash)
  async delete(paths: string[]) { 
      // Instead of physical delete, we set metadata
      const timestamp = Date.now();
      for (const p of paths) {
          await driveMetadataService.updateMeta(p, { trashedAt: timestamp });
      }
  }

  // Restore from Trash
  async restore(paths: string[]) {
      for (const p of paths) {
          await driveMetadataService.updateMeta(p, { trashedAt: null });
      }
  }

  // Hard Delete (Empty Trash)
  async emptyTrash() {
      const paths = await driveMetadataService.getTrashedPaths();
      // Physical delete
      await this.activeProvider.delete(paths);
      // Cleanup meta
      for (const p of paths) {
          await driveMetadataService.updateMeta(p, { trashedAt: null, isStarred: false, accessedAt: undefined });
      }
  }

  async rename(path: string, newName: string) { 
      await this.activeProvider.rename(path, newName); 
  }

  // Metadata Ops
  async toggleStar(path: string, status: boolean) {
      await driveMetadataService.updateMeta(path, { isStarred: status });
  }

  async touch(path: string) {
      await driveMetadataService.updateMeta(path, { accessedAt: Date.now() });
  }
}

export const driveService = new DriveService();
