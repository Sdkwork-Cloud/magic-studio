import { DriveItem, DriveStats } from '../entities';
import { Result, type ServiceResult, pathUtils } from '@sdkwork/react-commons';
import { getAppSdkClientWithSession, platform, uploadViaPresignedUrl } from '@sdkwork/react-core';
import { vfs } from '@sdkwork/react-fs';
import { driveService } from './driveService';

type DrivePathResult = ServiceResult<string>;
type DriveListResult = ServiceResult<DriveItem[]>;
type DriveStatsResult = ServiceResult<DriveStats>;
type DriveCapabilityResult = ServiceResult<boolean>;
type DriveContentResult = ServiceResult<string>;
type DriveVoidResult = ServiceResult<void>;

const ROOT_PATH = '/';
const DEFAULT_UPLOAD_PATH = 'uploads';
const MAX_SCAN_PAGES = 20;
const PAGE_SIZE = 100;
const SUCCESS_CODES = new Set(['0', '200', '2000']);
const VIRTUAL_STARRED = 'virtual://starred';
const VIRTUAL_RECENT = 'virtual://recent';
const VIRTUAL_TRASH = 'virtual://trash';

type ApiEnvelope<T> = {
  code?: string | number;
  msg?: string;
  data?: T;
};

type DriveResourceRecord = {
  url?: string;
};

type DriveItemRecord = {
  itemId?: string;
  itemUuid?: string;
  itemName?: string;
  fileType?: string;
  directory?: boolean;
  mimeType?: string;
  extension?: string;
  size?: number;
  parentId?: string;
  path?: string;
  objectKey?: string;
  status?: string;
  favorited?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
  resource?: DriveResourceRecord;
  coverImage?: DriveResourceRecord;
};

type DrivePageRecord = {
  content?: DriveItemRecord[];
  totalPages?: number;
  last?: boolean;
};

type DriveContentRecord = {
  text?: string;
  contents?: Record<string, string>;
  prompt?: string;
};

type StorageUsageRecord = {
  totalSize?: number;
  usedSize?: number;
  fileCount?: number;
};

type PrimaryDiskRecord = {
  totalSize?: number;
  usedSize?: number;
  fileCount?: number;
};

type UploadFileRecord = {
  fileId?: string;
  path?: string;
};

export interface IDriveBusinessService {
  getDefaultPath(): Promise<ServiceResult<string>>;
  list(path: string): Promise<ServiceResult<DriveItem[]>>;
  getStats(): Promise<ServiceResult<DriveStats>>;
  createFolder(name: string, parentPath: string): Promise<ServiceResult<void>>;
  uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<ServiceResult<void>>;
  importFile(parentPath: string, sourcePath: string): Promise<ServiceResult<void>>;
  hasNativeImportCapability(): Promise<ServiceResult<boolean>>;
  getFileContent(itemId: string): Promise<ServiceResult<string>>;
  updateFileContent(itemId: string, content: string): Promise<ServiceResult<void>>;
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
  getFileContent(itemId: string): Promise<ServiceResult<string>>;
  updateFileContent(itemId: string, content: string): Promise<ServiceResult<void>>;
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

const normalizeString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const toTimestamp = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const text = normalizeString(value);
  if (!text) {
    return 0;
  }
  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = Number(normalizeString(value));
  return Number.isFinite(normalized) ? normalized : 0;
};

const normalizeDrivePath = (value: string): string => {
  const raw = normalizeString(value);
  if (!raw || raw === '0' || raw.toLowerCase() === 'null') {
    return ROOT_PATH;
  }
  const normalizedSlashes = raw.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const withPrefix = normalizedSlashes.startsWith('/') ? normalizedSlashes : `/${normalizedSlashes}`;
  if (withPrefix.length > 1 && withPrefix.endsWith('/')) {
    return withPrefix.slice(0, -1);
  }
  return withPrefix || ROOT_PATH;
};

const isApiEnvelope = (value: unknown): value is ApiEnvelope<unknown> => {
  return Boolean(value && typeof value === 'object' && ('code' in value || 'msg' in value) && 'data' in value);
};

const ensureApiSuccess = (value: unknown, fallbackMessage: string): void => {
  if (!isApiEnvelope(value)) {
    return;
  }
  const code = normalizeString(value.code);
  if (!code || SUCCESS_CODES.has(code)) {
    return;
  }
  const message = normalizeString(value.msg);
  throw new Error(message || fallbackMessage);
};

const unwrapApiData = <T>(value: unknown, fallbackMessage: string): T => {
  if (isApiEnvelope(value)) {
    ensureApiSuccess(value, fallbackMessage);
    if (value.data === undefined || value.data === null) {
      throw new Error(fallbackMessage);
    }
    return value.data as T;
  }
  if (value === undefined || value === null) {
    throw new Error(fallbackMessage);
  }
  return value as T;
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

const toUint8Array = (value: unknown): Uint8Array => {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }
  if (value && typeof value === 'object' && 'buffer' in value) {
    const typed = value as { buffer?: ArrayBufferLike; byteOffset?: number; byteLength?: number };
    if (typed.buffer) {
      const offset = typed.byteOffset ?? 0;
      const length = typed.byteLength ?? typed.buffer.byteLength;
      return new Uint8Array(typed.buffer, offset, length);
    }
  }
  return new Uint8Array(0);
};

const guessMimeType = (filename: string): string => {
  const ext = pathUtils.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed'
  };
  return map[ext] || 'application/octet-stream';
};

const inferUploadType = (mimeType: string): string => {
  const normalized = mimeType.toLowerCase();
  if (normalized.startsWith('image/')) return 'IMAGE';
  if (normalized.startsWith('video/')) return 'VIDEO';
  if (normalized.startsWith('audio/')) return 'AUDIO';
  if (
    normalized.startsWith('text/') ||
    normalized.includes('pdf') ||
    normalized.includes('document') ||
    normalized.includes('presentation') ||
    normalized.includes('spreadsheet') ||
    normalized.includes('json')
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
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

  async getFileContent(itemId: string): Promise<DriveContentResult> {
    return runDriveOperation(async () => {
      return vfs.readFile(itemId);
    }, 'Failed to read file content');
  }

  async updateFileContent(itemId: string, content: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      await vfs.writeFile(itemId, content);
    }, 'Failed to update file content');
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

export class SdkDriveBusinessAdapter implements DriveBusinessAdapter {
  private readonly pathToItemId = new Map<string, string>();
  private readonly itemIdToPath = new Map<string, string>();

  constructor() {
    this.pathToItemId.set(ROOT_PATH, '');
  }

  private getClient(): any {
    return getAppSdkClientWithSession() as any;
  }

  private isVirtualPath(path: string): boolean {
    return path.startsWith('virtual://');
  }

  private resolveItemId(idOrPath: string): string | undefined {
    const normalized = normalizeString(idOrPath);
    if (!normalized || normalized === '0') {
      return undefined;
    }
    if (/^\d+$/.test(normalized)) {
      return normalized;
    }
    return this.pathToItemId.get(normalizeDrivePath(normalized));
  }

  private async resolveFolderIdByPath(path: string): Promise<string | undefined> {
    const normalized = normalizeDrivePath(path);
    if (normalized === ROOT_PATH) {
      return undefined;
    }
    const mapped = this.pathToItemId.get(normalized);
    if (mapped) {
      return mapped;
    }
    const discovered = await this.findFolderIdByPath(normalized);
    if (discovered) {
      this.pathToItemId.set(normalized, discovered);
      this.itemIdToPath.set(discovered, normalized);
    }
    return discovered;
  }

  private async findFolderIdByPath(targetPath: string): Promise<string | undefined> {
    const records = await this.listDriveRecords({
      includeDeleted: true,
      includeArchived: true,
      sortField: 'updatedAt',
      sortDirection: 'DESC'
    });
    const match = records.find((record) => {
      const path = normalizeDrivePath(normalizeString(record.path));
      const fileType = normalizeString(record.fileType).toUpperCase();
      const isDirectory = record.directory === true || fileType === 'DIRECTORY';
      return isDirectory && path === targetPath;
    });
    return normalizeString(match?.itemId) || undefined;
  }

  private resolveTargetFolderIdSync(targetPathOrId: string): string | undefined {
    const normalized = normalizeString(targetPathOrId);
    if (!normalized || normalized === '0' || normalized === ROOT_PATH) {
      return undefined;
    }
    if (/^\d+$/.test(normalized)) {
      return normalized;
    }
    return this.pathToItemId.get(normalizeDrivePath(normalized));
  }

  private async resolveTargetFolderId(targetPathOrId: string): Promise<string | undefined> {
    const direct = this.resolveTargetFolderIdSync(targetPathOrId);
    if (direct !== undefined) {
      return direct;
    }
    return this.resolveFolderIdByPath(targetPathOrId);
  }

  private async listDriveRecords(params: Record<string, unknown>): Promise<DriveItemRecord[]> {
    const client = this.getClient();
    const records: DriveItemRecord[] = [];
    const seenItemIds = new Set<string>();

    let pageNum = 1;
    while (pageNum <= MAX_SCAN_PAGES) {
      const response = await client.drive.listItems({
        ...params,
        pageNum,
        pageSize: PAGE_SIZE
      });
      const page = unwrapApiData<DrivePageRecord>(response, 'Failed to list drive items');
      const content = Array.isArray(page.content) ? page.content : [];
      content.forEach((entry) => {
        const itemId = normalizeString(entry.itemId);
        if (!itemId || seenItemIds.has(itemId)) {
          return;
        }
        seenItemIds.add(itemId);
        records.push(entry);
      });

      const totalPages = safeNumber(page.totalPages);
      if (page.last === true) {
        break;
      }
      if (totalPages > 0 && pageNum >= totalPages) {
        break;
      }
      if (content.length < PAGE_SIZE && totalPages === 0) {
        break;
      }
      pageNum += 1;
    }

    return records;
  }

  private resolveItemPath(record: DriveItemRecord, itemId: string, itemName: string, parentId?: string): string {
    const rawPath = normalizeString(record.path);
    if (rawPath) {
      return normalizeDrivePath(rawPath);
    }
    const parentPath = parentId ? this.itemIdToPath.get(parentId) : ROOT_PATH;
    return normalizeDrivePath(pathUtils.join(parentPath || ROOT_PATH, itemName || itemId));
  }

  private toDriveItem(record: DriveItemRecord): DriveItem | null {
    const itemId = normalizeString(record.itemId || record.itemUuid);
    if (!itemId) {
      return null;
    }
    const parentId = normalizeString(record.parentId) || null;
    const itemName = normalizeString(record.itemName) || `item-${itemId}`;
    const fileType = normalizeString(record.fileType).toUpperCase();
    const isDirectory = record.directory === true || fileType === 'DIRECTORY';
    const updatedAt = toTimestamp(record.updatedAt) || Date.now();
    const createdAt = toTimestamp(record.createdAt) || updatedAt;
    const path = this.resolveItemPath(record, itemId, itemName, parentId || undefined);
    const status = normalizeString(record.status).toUpperCase();

    this.pathToItemId.set(path, itemId);
    this.itemIdToPath.set(itemId, path);

    return {
      id: itemId,
      parentId,
      name: itemName,
      type: isDirectory ? 'folder' : 'file',
      path,
      size: safeNumber(record.size),
      mimeType: normalizeString(record.mimeType) || guessMimeType(itemName),
      status: status || undefined,
      previewUrl: normalizeString(record.resource?.url || record.coverImage?.url) || undefined,
      objectKey: normalizeString(record.objectKey) || undefined,
      updatedAt,
      createdAt,
      isStarred: Boolean(record.favorited),
      trashedAt: status === 'DELETED' ? updatedAt : null,
    };
  }

  private mapDriveItems(records: DriveItemRecord[]): DriveItem[] {
    return records
      .map((record) => this.toDriveItem(record))
      .filter((item): item is DriveItem => Boolean(item));
  }

  async getDefaultPath(): Promise<DrivePathResult> {
    return runDriveOperation(async () => ROOT_PATH, 'Failed to resolve default path');
  }

  async list(path: string): Promise<DriveListResult> {
    return runDriveOperation(async () => {
      if (this.isVirtualPath(path)) {
        return this.listVirtual(path);
      }

      const normalizedPath = normalizeDrivePath(path);
      const folderId = await this.resolveFolderIdByPath(normalizedPath);
      if (normalizedPath !== ROOT_PATH && !folderId) {
        return [];
      }

      const records = await this.listDriveRecords({
        ...(folderId ? { folderId } : {}),
        includeDeleted: false,
        includeArchived: false,
        sortField: 'name',
        sortDirection: 'ASC'
      });

      return this.mapDriveItems(records).filter((item) => !item.trashedAt);
    }, 'Failed to list drive path');
  }

  private async listVirtual(virtualPath: string): Promise<DriveItem[]> {
    let records: DriveItemRecord[] = [];
    switch (virtualPath) {
      case VIRTUAL_STARRED:
        records = await this.listDriveRecords({
          favoriteOnly: true,
          includeDeleted: false,
          includeArchived: false,
          sortField: 'updatedAt',
          sortDirection: 'DESC'
        });
        return this.mapDriveItems(records).filter((item) => !item.trashedAt);
      case VIRTUAL_RECENT:
        records = await this.listDriveRecords({
          includeDeleted: false,
          includeArchived: false,
          sortField: 'updatedAt',
          sortDirection: 'DESC'
        });
        return this.mapDriveItems(records).filter((item) => !item.trashedAt);
      case VIRTUAL_TRASH:
        records = await this.listDriveRecords({
          includeDeleted: true,
          includeArchived: true,
          sortField: 'updatedAt',
          sortDirection: 'DESC'
        });
        return this
          .mapDriveItems(records)
          .filter((item) => normalizeString(item.status).toUpperCase() === 'DELETED' || Boolean(item.trashedAt));
      default:
        return [];
    }
  }

  async getStats(): Promise<DriveStatsResult> {
    return runDriveOperation(async () => {
      const client = this.getClient();
      try {
        const usageResponse = await client.upload.getStorageUsage();
        const usage = unwrapApiData<StorageUsageRecord>(usageResponse, 'Failed to load storage usage');
        return {
          usedBytes: safeNumber(usage.usedSize),
          totalBytes: safeNumber(usage.totalSize),
          fileCount: safeNumber(usage.fileCount)
        };
      } catch {
        const primaryDiskResponse = await client.fileSystem.getPrimaryDisk();
        const disk = unwrapApiData<PrimaryDiskRecord>(primaryDiskResponse, 'Failed to load primary disk');
        return {
          usedBytes: safeNumber(disk.usedSize),
          totalBytes: safeNumber(disk.totalSize),
          fileCount: safeNumber(disk.fileCount)
        };
      }
    }, 'Failed to load drive stats');
  }

  async createFolder(name: string, parentPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const parentId = await this.resolveFolderIdByPath(parentPath);
      const response = await this.getClient().drive.createFolder({
        name,
        ...(parentId ? { parentId } : {})
      });
      const created = unwrapApiData<DriveItemRecord>(response, 'Failed to create folder');
      this.toDriveItem(created);
    }, 'Failed to create folder');
  }

  async uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const parentId = await this.resolveFolderIdByPath(parentPath);
      const mimeType = guessMimeType(name);
      const normalizedContent = new Uint8Array(content);
      const uploadResult = await uploadViaPresignedUrl(this.getClient(), {
        file: normalizedContent,
        fileName: name,
        contentType: mimeType,
        folderId: parentId,
        type: inferUploadType(mimeType),
        path: DEFAULT_UPLOAD_PATH,
        provider: 'AWS'
      });
      const uploaded = unwrapApiData<UploadFileRecord>(uploadResult.registerResult, 'Failed to upload file');
      const uploadedId = normalizeString(uploaded.fileId);
      const uploadedPath = normalizeString(uploaded.path);
      if (uploadedId) {
        const fallbackPath = normalizeDrivePath(pathUtils.join(normalizeDrivePath(parentPath), name));
        const normalizedPath = normalizeDrivePath(uploadedPath || fallbackPath);
        this.pathToItemId.set(normalizedPath, uploadedId);
        this.itemIdToPath.set(uploadedId, normalizedPath);
      }
    }, 'Failed to upload file');
  }

  async importFile(parentPath: string, sourcePath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const fileName = pathUtils.basename(sourcePath) || `import-${Date.now()}`;
      const binary = await platform.readFileBinary(sourcePath);
      await this.uploadFile(parentPath, fileName, toUint8Array(binary));
    }, 'Failed to import file');
  }

  async hasNativeImportCapability(): Promise<DriveCapabilityResult> {
    return runDriveOperation(async () => platform.getPlatform() === 'desktop', 'Failed to inspect native import capability');
  }

  async getFileContent(itemId: string): Promise<DriveContentResult> {
    return runDriveOperation(async () => {
      const resolvedId = this.resolveItemId(itemId);
      if (!resolvedId) {
        throw new Error('Drive item id is required');
      }
      const response = await this.getClient().drive.getItemContent(resolvedId);
      const content = unwrapApiData<DriveContentRecord>(response, 'Failed to load file content');
      const directText = normalizeString(content.text);
      if (directText) {
        return directText;
      }
      if (content.contents && typeof content.contents === 'object') {
        const first = Object.values(content.contents)
          .map((value) => normalizeString(value))
          .find((value) => Boolean(value));
        if (first) {
          return first;
        }
      }
      return normalizeString(content.prompt);
    }, 'Failed to read file content');
  }

  async updateFileContent(itemId: string, content: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const resolvedId = this.resolveItemId(itemId);
      if (!resolvedId) {
        throw new Error('Drive item id is required');
      }
      await this.getClient().drive.updateItemContent(resolvedId, {
        text: content,
        encoding: 'UTF-8'
      });
    }, 'Failed to update file content');
  }

  async delete(paths: string[]): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemIds = paths
        .map((path) => this.resolveItemId(path))
        .filter((id): id is string => Boolean(id));
      if (itemIds.length === 0) {
        return;
      }
      if (itemIds.length === 1) {
        await this.getClient().drive.deleteItem(itemIds[0]);
        return;
      }
      await this.getClient().drive.batchDeleteItems({ itemIds });
    }, 'Failed to move files to trash');
  }

  async restore(paths: string[]): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemIds = paths
        .map((path) => this.resolveItemId(path))
        .filter((id): id is string => Boolean(id));
      for (const itemId of itemIds) {
        await this.getClient().drive.restoreItem(itemId);
      }
    }, 'Failed to restore files');
  }

  async emptyTrash(): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const driveApi = this.getClient().drive as Record<string, unknown>;
      const candidateMethods = ['clearTrash', 'clearDriveTrash', 'purgeTrash', 'emptyTrash'];
      for (const methodName of candidateMethods) {
        const method = driveApi[methodName];
        if (typeof method === 'function') {
          await (method as (...args: unknown[]) => Promise<unknown>).call(driveApi);
          return;
        }
      }
      throw new Error('SDK drive clear-trash method is unavailable. Regenerate app SDK from latest backend OpenAPI schema.');
    }, 'Failed to empty trash');
  }

  async rename(path: string, newName: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemId = this.resolveItemId(path);
      if (!itemId) {
        throw new Error('Drive item id is required');
      }
      await this.getClient().drive.renameItem(itemId, { name: newName });
    }, 'Failed to rename file');
  }

  async toggleStar(path: string, status: boolean): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemId = this.resolveItemId(path);
      if (!itemId) {
        throw new Error('Drive item id is required');
      }
      if (status) {
        await this.getClient().drive.favoriteItem(itemId);
      } else {
        await this.getClient().drive.unfavoriteItem(itemId);
      }
    }, 'Failed to update starred state');
  }

  async touch(_path: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      // Backend recent list is based on updatedAt; no standalone access-time API yet.
    }, 'Failed to update file access time');
  }

  async move(paths: string[], targetPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const targetFolderId = await this.resolveTargetFolderId(targetPath);
      const itemIds = paths
        .map((path) => this.resolveItemId(path))
        .filter((id): id is string => Boolean(id));
      for (const itemId of itemIds) {
        await this.getClient().drive.moveItem(itemId, {
          ...(targetFolderId ? { targetFolderId } : {})
        });
      }
    }, 'Failed to move files');
  }
}

let driveBusinessAdapter: DriveBusinessAdapter = new SdkDriveBusinessAdapter();

export const setDriveBusinessAdapter = (adapter: DriveBusinessAdapter): void => {
  driveBusinessAdapter = adapter;
};

export const getDriveBusinessAdapter = (): DriveBusinessAdapter => {
  return driveBusinessAdapter;
};

export const resetDriveBusinessAdapter = (): void => {
  driveBusinessAdapter = new SdkDriveBusinessAdapter();
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

  async getFileContent(itemId: string): Promise<DriveContentResult> {
    return getDriveBusinessAdapter().getFileContent(itemId);
  }

  async updateFileContent(itemId: string, content: string): Promise<DriveVoidResult> {
    return getDriveBusinessAdapter().updateFileContent(itemId, content);
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
