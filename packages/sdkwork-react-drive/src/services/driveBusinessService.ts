import { DriveItem, DriveStats } from '../entities';
import { Result, type ServiceResult } from '@sdkwork/react-commons';
import { driveService } from './driveService';

type DrivePathResult = ServiceResult<string>;
type DriveListResult = ServiceResult<DriveItem[]>;
type DriveStatsResult = ServiceResult<DriveStats>;
type DriveCapabilityResult = ServiceResult<boolean>;
type DriveVoidResult = ServiceResult<void>;

export interface IDriveBusinessService {
  getDefaultPath(): Promise<ServiceResult<string>>;
  list(path: string): Promise<ServiceResult<DriveItem[]>>;
  getStats(): Promise<ServiceResult<DriveStats>>;
  createFolder(name: string, parentPath: string): Promise<ServiceResult<void>>;
  uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<ServiceResult<void>>;
  importFile(parentPath: string, sourcePath: string): Promise<ServiceResult<void>>;
  hasNativeImportCapability(): Promise<ServiceResult<boolean>>;
  delete(paths: string[]): Promise<ServiceResult<void>>;
  restore(paths: string[]): Promise<ServiceResult<void>>;
  emptyTrash(): Promise<ServiceResult<void>>;
  rename(path: string, newName: string): Promise<ServiceResult<void>>;
  toggleStar(path: string, status: boolean): Promise<ServiceResult<void>>;
  touch(path: string): Promise<ServiceResult<void>>;
  move(paths: string[], targetPath: string): Promise<ServiceResult<void>>;
}

export interface DriveBusinessAdapter {
  getDefaultPath(): Promise<ServiceResult<string>>;
  list(path: string): Promise<ServiceResult<DriveItem[]>>;
  getStats(): Promise<ServiceResult<DriveStats>>;
  createFolder(name: string, parentPath: string): Promise<ServiceResult<void>>;
  uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<ServiceResult<void>>;
  importFile(parentPath: string, sourcePath: string): Promise<ServiceResult<void>>;
  hasNativeImportCapability(): Promise<ServiceResult<boolean>>;
  delete(paths: string[]): Promise<ServiceResult<void>>;
  restore(paths: string[]): Promise<ServiceResult<void>>;
  emptyTrash(): Promise<ServiceResult<void>>;
  rename(path: string, newName: string): Promise<ServiceResult<void>>;
  toggleStar(path: string, status: boolean): Promise<ServiceResult<void>>;
  touch(path: string): Promise<ServiceResult<void>>;
  move(paths: string[], targetPath: string): Promise<ServiceResult<void>>;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
};

const runDriveOperation = async <T>(
  operation: () => Promise<T>,
  failureContext: string
): Promise<ServiceResult<T>> => {
  try {
    return Result.success(await operation());
  } catch (error) {
    const message = `${failureContext}: ${getErrorMessage(error)}`;
    console.error(`[DriveBusinessService] ${message}`, error);
    return Result.error<T>(message);
  }
};

const runDriveVoidOperation = async (
  operation: () => Promise<void>,
  failureContext: string
): Promise<ServiceResult<void>> => {
  return runDriveOperation(async () => {
    await operation();
    return undefined;
  }, failureContext);
};

export class LocalDriveBusinessAdapter implements DriveBusinessAdapter {
  async getDefaultPath(): Promise<DrivePathResult> {
    return runDriveOperation(() => driveService.getDefaultPath(), 'Failed to resolve default path');
  }

  async list(path: string): Promise<DriveListResult> {
    return runDriveOperation(() => driveService.list(path), 'Failed to list drive path');
  }

  async getStats(): Promise<DriveStatsResult> {
    return runDriveOperation(() => driveService.getProvider().getStats(), 'Failed to load drive stats');
  }

  async createFolder(name: string, parentPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.createFolder(name, parentPath), 'Failed to create folder');
  }

  async uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.uploadFile(parentPath, name, content),
      'Failed to upload file'
    );
  }

  async importFile(parentPath: string, sourcePath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.importFile(parentPath, sourcePath),
      'Failed to import file'
    );
  }

  async hasNativeImportCapability(): Promise<DriveCapabilityResult> {
    return runDriveOperation(
      async () => driveService.getProvider().hasCapability('native_import'),
      'Failed to inspect native import capability'
    );
  }

  async delete(paths: string[]): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.delete(paths), 'Failed to move files to trash');
  }

  async restore(paths: string[]): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.restore(paths), 'Failed to restore files');
  }

  async emptyTrash(): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.emptyTrash(), 'Failed to empty trash');
  }

  async rename(path: string, newName: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.rename(path, newName), 'Failed to rename file');
  }

  async toggleStar(path: string, status: boolean): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.toggleStar(path, status), 'Failed to update starred state');
  }

  async touch(path: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(() => driveService.touch(path), 'Failed to update file access time');
  }

  async move(paths: string[], targetPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.getProvider().move(paths, targetPath),
      'Failed to move files'
    );
  }
}

let driveBusinessAdapter: DriveBusinessAdapter = new LocalDriveBusinessAdapter();

export const setDriveBusinessAdapter = (adapter: DriveBusinessAdapter): void => {
  driveBusinessAdapter = adapter;
};

export const getDriveBusinessAdapter = (): DriveBusinessAdapter => {
  return driveBusinessAdapter;
};

export const resetDriveBusinessAdapter = (): void => {
  driveBusinessAdapter = new LocalDriveBusinessAdapter();
};

class DriveBusinessService implements IDriveBusinessService {
  async getDefaultPath(): Promise<DrivePathResult> {
    return getDriveBusinessAdapter().getDefaultPath();
  }

  async list(path: string): Promise<DriveListResult> {
    return getDriveBusinessAdapter().list(path);
  }

  async getStats(): Promise<DriveStatsResult> {
    return getDriveBusinessAdapter().getStats();
  }

  async createFolder(name: string, parentPath: string): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().createFolder(name, parentPath);
  }

  async uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().uploadFile(parentPath, name, content);
  }

  async importFile(parentPath: string, sourcePath: string): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().importFile(parentPath, sourcePath);
  }

  async hasNativeImportCapability(): Promise<DriveCapabilityResult> {
    return getDriveBusinessAdapter().hasNativeImportCapability();
  }

  async delete(paths: string[]): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().delete(paths);
  }

  async restore(paths: string[]): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().restore(paths);
  }

  async emptyTrash(): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().emptyTrash();
  }

  async rename(path: string, newName: string): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().rename(path, newName);
  }

  async toggleStar(path: string, status: boolean): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().toggleStar(path, status);
  }

  async touch(path: string): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().touch(path);
  }

  async move(paths: string[], targetPath: string): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().move(paths, targetPath);
  }
}

export const driveBusinessService: IDriveBusinessService = new DriveBusinessService();
