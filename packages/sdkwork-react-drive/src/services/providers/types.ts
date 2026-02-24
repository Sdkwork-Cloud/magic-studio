
import { DriveItem, DriveStats } from '../../entities/drive.entity';

export interface IDriveProvider {
  name: string;
  
  list(path: string): Promise<DriveItem[]>;

  stat(path: string): Promise<DriveItem>;

  createFolder(name: string, parentPath: string): Promise<void>;

  writeFile(parentPath: string, name: string, content: Uint8Array): Promise<void>;

  importFile(parentPath: string, sourcePath: string): Promise<void>;

  rename(path: string, newName: string): Promise<void>;

  delete(paths: string[]): Promise<void>;

  move(paths: string[], targetPath: string): Promise<void>;

  getStats(): Promise<DriveStats>;

  hasCapability(cap: 'thumbnails' | 'sharing' | 'public_link' | 'native_import'): boolean;
}
