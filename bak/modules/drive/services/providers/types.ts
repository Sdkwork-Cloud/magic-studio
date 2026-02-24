
import { DriveItem, DriveStats } from '../../entities/drive.entity';

/**
 * Standard Interface for any Drive Backend (Local, S3, Google Drive, etc.)
 */
export interface IDriveProvider {
  name: string;
  
  /**
   * List contents of a directory.
   * @param path The folder ID or Path to list.
   */
  list(path: string): Promise<DriveItem[]>;

  /**
   * Get metadata for a specific item.
   */
  stat(path: string): Promise<DriveItem>;

  /**
   * Create a new folder.
   */
  createFolder(name: string, parentPath: string): Promise<void>;

  /**
   * Write a file (Upload).
   */
  writeFile(parentPath: string, name: string, content: Uint8Array): Promise<void>;

  /**
   * Efficiently import a file from local source path to target folder.
   * On Desktop: Uses native copy.
   * On Web: Falls back to read/write if implemented or throws.
   */
  importFile(parentPath: string, sourcePath: string): Promise<void>;

  /**
   * Rename an item.
   */
  rename(path: string, newName: string): Promise<void>;

  /**
   * Delete items.
   */
  delete(paths: string[]): Promise<void>;

  /**
   * Move items to a new folder.
   */
  move(paths: string[], targetPath: string): Promise<void>;

  /**
   * Get usage statistics.
   */
  getStats(): Promise<DriveStats>;

  /**
   * Check if the provider supports a capability.
   */
  hasCapability(cap: 'thumbnails' | 'sharing' | 'public_link' | 'native_import'): boolean;
}
