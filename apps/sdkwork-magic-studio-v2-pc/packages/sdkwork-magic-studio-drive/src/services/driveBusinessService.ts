import { DriveItem, DriveStats } from '../entities';
import { assetService } from '@sdkwork/magic-studio-assets';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  decodeBytesToText,
  encodeTextToBytes,
  getPlatformRuntime,
  isDesktopShellRuntimeKind,
} from '@sdkwork/magic-studio-core/platform';
import { vfs } from '@sdkwork/magic-studio-fs';
import {
  isMagicStudioServerClientError,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type {
  DriveFileContent as CanonicalDriveFileContent,
  DriveItem as CanonicalDriveItem,
  DriveListScope,
  DriveRootDescriptor,
  DriveStats as CanonicalDriveStats,
} from '@sdkwork/magic-studio-types/drive';
import { Result, type ServiceResult } from '@sdkwork/magic-studio-types/service';
import { driveService } from './driveService';

type BufferLike = {
  from(
    value: Uint8Array | string,
    encoding?: string,
  ): {
    toString(encoding: string): string;
    readonly length: number;
    [index: number]: number;
  };
};

type DrivePathResult = ServiceResult<string>;
type DriveListResult = ServiceResult<DriveItem[]>;
type DriveStatsResult = ServiceResult<DriveStats>;
type DriveCapabilityResult = ServiceResult<boolean>;
type DriveContentResult = ServiceResult<string>;
type DriveBytesResult = ServiceResult<Uint8Array>;
type DriveDownloadResult = ServiceResult<string[]>;
type DriveVoidResult = ServiceResult<void>;

type DriveServerClient = Pick<
  MagicStudioServerClient,
  | 'readDriveRoot'
  | 'listDriveEntries'
  | 'readDriveStats'
  | 'readDriveFileContent'
  | 'updateDriveFileContent'
  | 'createDriveFolder'
  | 'uploadDriveFile'
  | 'importDriveFile'
  | 'renameDriveItem'
  | 'moveDriveItems'
  | 'deleteDriveItems'
  | 'restoreDriveItems'
  | 'emptyDriveTrash'
  | 'favoriteDriveItem'
>;

const ROOT_PATH = '/';
const VIRTUAL_STARRED = 'virtual://starred';
const VIRTUAL_RECENT = 'virtual://recent';
const VIRTUAL_TRASH = 'virtual://trash';
const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*]/;

const readGlobalBuffer = (): BufferLike | null => {
  const target = globalThis as typeof globalThis & { Buffer?: BufferLike };
  return target.Buffer ?? null;
};

const getErrorMessage = (error: unknown, fallback = 'Unknown error'): string => {
  if (isMagicStudioServerClientError(error)) {
    return error.message || error.detail || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
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

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(normalizeString(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toTimestamp = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    return 0;
  }

  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeDrivePath = (value: string): string => {
  const raw = normalizeString(value);
  if (!raw || raw === '0' || raw.toLowerCase() === 'null') {
    return ROOT_PATH;
  }

  const normalizedSlashes = raw.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const withPrefix = normalizedSlashes.startsWith('/')
    ? normalizedSlashes
    : `/${normalizedSlashes}`;

  if (withPrefix.length > 1 && withPrefix.endsWith('/')) {
    return withPrefix.slice(0, -1);
  }

  return withPrefix || ROOT_PATH;
};

const isVirtualPath = (value: string): boolean => value.startsWith('virtual://');

const resolveVirtualScope = (value: string): DriveListScope | undefined => {
  switch (normalizeString(value)) {
    case VIRTUAL_STARRED:
      return 'starred';
    case VIRTUAL_RECENT:
      return 'recent';
    case VIRTUAL_TRASH:
      return 'trash';
    default:
      return undefined;
  }
};

const cloneBytes = (value: Uint8Array): Uint8Array => {
  const next = new Uint8Array(value.byteLength);
  next.set(value);
  return next;
};

const encodeBytesToBase64 = (content: Uint8Array): string => {
  if (content.byteLength === 0) {
    return '';
  }

  let output = '';
  for (const value of content) {
    output += String.fromCharCode(value);
  }

  if (typeof btoa === 'function') {
    return btoa(output);
  }

  const buffer = readGlobalBuffer();
  if (buffer) {
    return buffer.from(content).toString('base64');
  }

  throw new Error('[DriveBusinessService] Base64 encoding is unavailable in the current runtime');
};

const decodeBase64ToBytes = (value: string): Uint8Array => {
  if (!value) {
    return new Uint8Array();
  }

  if (typeof atob === 'function') {
    const decoded = atob(value);
    return Uint8Array.from(decoded, character => character.charCodeAt(0));
  }

  const buffer = readGlobalBuffer();
  if (buffer) {
    return Uint8Array.from(buffer.from(value, 'base64'));
  }

  throw new Error('[DriveBusinessService] Base64 decoding is unavailable in the current runtime');
};

const decodeDriveContentToBytes = (content: CanonicalDriveFileContent): Uint8Array => {
  if (content.encoding === 'base64') {
    return decodeBase64ToBytes(content.content);
  }

  return encodeTextToBytes(content.content);
};

const decodeDriveContentToText = (content: CanonicalDriveFileContent): string => {
  if (content.encoding === 'utf-8') {
    return content.content;
  }

  return decodeBytesToText(decodeDriveContentToBytes(content));
};

const runDriveOperation = async <T>(
  operation: () => Promise<T>,
  failureContext: string,
): Promise<ServiceResult<T>> => {
  try {
    return Result.success(await operation());
  } catch (error) {
    const message = `${failureContext}: ${getErrorMessage(error, failureContext)}`;
    console.error(`[DriveBusinessService] ${message}`, error);
    return Result.error<T>(message);
  }
};

const runDriveVoidOperation = async (
  operation: () => Promise<void>,
  failureContext: string,
): Promise<DriveVoidResult> => {
  return runDriveOperation(async () => {
    await operation();
    return undefined;
  }, failureContext);
};

const toUint8Array = (value: unknown): Uint8Array => {
  if (value instanceof Uint8Array) {
    return cloneBytes(value);
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }
  if (value && typeof value === 'object' && 'buffer' in value) {
    const typed = value as {
      buffer?: ArrayBufferLike;
      byteOffset?: number;
      byteLength?: number;
    };
    if (typed.buffer) {
      const offset = typed.byteOffset ?? 0;
      const length = typed.byteLength ?? typed.buffer.byteLength;
      return new Uint8Array(typed.buffer, offset, length);
    }
  }
  return new Uint8Array();
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
    '.7z': 'application/x-7z-compressed',
  };

  return map[ext] || 'application/octet-stream';
};

const sanitizeFileName = (value: string, fallback = 'download.bin'): string => {
  const normalized = Array.from(normalizeString(value))
    .map(character => {
      const charCode = character.charCodeAt(0);
      if (charCode < 32 || INVALID_FILE_NAME_CHARS.test(character)) {
        return '-';
      }
      return character;
    })
    .join('')
    .trim();

  return normalized || fallback;
};

const splitFileName = (fileName: string): { baseName: string; extension: string } => {
  const extension = pathUtils.extname(fileName);
  if (!extension || extension === '.') {
    return { baseName: fileName, extension: '' };
  }

  return {
    baseName: fileName.slice(0, -extension.length),
    extension,
  };
};

const resolveUniqueDownloadPath = async (fileName: string): Promise<string> => {
  const runtime = getPlatformRuntime();
  const downloadDir = await runtime.system.path('downloads');
  const safeName = sanitizeFileName(fileName);
  let candidate = pathUtils.join(downloadDir, safeName);

  if (!(await runtime.fileSystem.exists(candidate))) {
    return candidate;
  }

  const { baseName, extension } = splitFileName(safeName);
  let index = 1;
  while (index <= 100) {
    candidate = pathUtils.join(downloadDir, `${baseName} (${index})${extension}`);
    if (!(await runtime.fileSystem.exists(candidate))) {
      return candidate;
    }
    index += 1;
  }

  return pathUtils.join(downloadDir, `${baseName}-${Date.now()}${extension}`);
};

const triggerBrowserDownload = (blob: Blob, fileName: string): string => {
  if (typeof document === 'undefined') {
    return sanitizeFileName(fileName);
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = sanitizeFileName(fileName);
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  return sanitizeFileName(fileName);
};

const saveBytesAsDownload = async (
  fileName: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<string> => {
  const runtime = getPlatformRuntime();
  if (isDesktopShellRuntimeKind(runtime.system.kind())) {
    const destinationPath = await resolveUniqueDownloadPath(fileName);
    await runtime.fileSystem.writeBinary(destinationPath, bytes);
    return destinationPath;
  }

  return triggerBrowserDownload(
    new Blob([Uint8Array.from(bytes)] as BlobPart[], {
      type: mimeType || 'application/octet-stream',
    }),
    fileName,
  );
};

const canFetchResolvedDownloadUrl = (value: string): boolean =>
  /^(https?:|blob:|data:)/i.test(value);

const fetchResolvedDownloadBytes = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch download resource: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

const resolveDriveDownloadUrl = async (item: DriveItem): Promise<string> => {
  const directUrl = normalizeString(item.previewUrl);
  if (directUrl) {
    const resolvedDirectUrl = await assetService.resolveAssetUrl({ path: directUrl });
    if (resolvedDirectUrl) {
      return resolvedDirectUrl;
    }
  }

  const detailUrl = normalizeString(item.path || item.id);
  if (detailUrl) {
    const resolvedDetailUrl = await assetService.resolveAssetUrl({ path: detailUrl });
    if (resolvedDetailUrl) {
      return resolvedDetailUrl;
    }
  }

  return '';
};

const mapDriveItem = (item: CanonicalDriveItem): DriveItem => ({
  id: item.id,
  parentId: item.parentId ?? null,
  name: item.name,
  type: item.kind,
  path: normalizeDrivePath(item.path),
  size: safeNumber(item.size),
  mimeType: normalizeString(item.mimeType) || guessMimeType(item.name),
  status: item.status,
  updatedAt: toTimestamp(item.updatedAt),
  createdAt: toTimestamp(item.createdAt),
  accessedAt: item.accessedAt ? toTimestamp(item.accessedAt) : undefined,
  trashedAt: item.trashedAt ? toTimestamp(item.trashedAt) : null,
  isStarred: Boolean(item.isFavorite),
});

const mapDriveStats = (stats: CanonicalDriveStats): DriveStats => ({
  usedBytes: safeNumber(stats.usedBytes),
  totalBytes: safeNumber(stats.totalBytes),
  fileCount: safeNumber(stats.fileCount),
});

export interface IDriveBusinessService {
  getDefaultPath(): Promise<ServiceResult<string>>;
  list(path: string): Promise<ServiceResult<DriveItem[]>>;
  getStats(): Promise<ServiceResult<DriveStats>>;
  createFolder(name: string, parentPath: string): Promise<ServiceResult<void>>;
  uploadFile(parentPath: string, name: string, content: Uint8Array): Promise<ServiceResult<void>>;
  importFile(parentPath: string, sourcePath: string): Promise<ServiceResult<void>>;
  hasNativeImportCapability(): Promise<ServiceResult<boolean>>;
  getFileContent(itemId: string): Promise<ServiceResult<string>>;
  getFileBytes(itemId: string): Promise<ServiceResult<Uint8Array>>;
  updateFileContent(itemId: string, content: string): Promise<ServiceResult<void>>;
  delete(paths: string[]): Promise<ServiceResult<void>>;
  restore(paths: string[]): Promise<ServiceResult<void>>;
  emptyTrash(): Promise<ServiceResult<void>>;
  rename(path: string, newName: string): Promise<ServiceResult<void>>;
  toggleStar(path: string, status: boolean): Promise<ServiceResult<void>>;
  touch(path: string): Promise<ServiceResult<void>>;
  move(paths: string[], targetPath: string): Promise<ServiceResult<void>>;
  downloadItems(items: DriveItem[]): Promise<ServiceResult<string[]>>;
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
  getFileBytes(itemId: string): Promise<ServiceResult<Uint8Array>>;
  updateFileContent(itemId: string, content: string): Promise<ServiceResult<void>>;
  delete(paths: string[]): Promise<ServiceResult<void>>;
  restore(paths: string[]): Promise<ServiceResult<void>>;
  emptyTrash(): Promise<ServiceResult<void>>;
  rename(path: string, newName: string): Promise<ServiceResult<void>>;
  toggleStar(path: string, status: boolean): Promise<ServiceResult<void>>;
  touch(path: string): Promise<ServiceResult<void>>;
  move(paths: string[], targetPath: string): Promise<ServiceResult<void>>;
  downloadItems(items: DriveItem[]): Promise<ServiceResult<string[]>>;
}

export class LocalDriveBusinessAdapter implements DriveBusinessAdapter {
  async getDefaultPath(): Promise<DrivePathResult> {
    return runDriveOperation(() => driveService.getDefaultPath(), 'Failed to resolve default path');
  }

  async list(path: string): Promise<DriveListResult> {
    return runDriveOperation(() => driveService.list(path), 'Failed to list drive path');
  }

  async getStats(): Promise<DriveStatsResult> {
    return runDriveOperation(
      () => driveService.getProvider().getStats(),
      'Failed to load drive stats',
    );
  }

  async createFolder(name: string, parentPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.createFolder(name, parentPath),
      'Failed to create folder',
    );
  }

  async uploadFile(
    parentPath: string,
    name: string,
    content: Uint8Array,
  ): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.uploadFile(parentPath, name, content),
      'Failed to upload file',
    );
  }

  async importFile(parentPath: string, sourcePath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.importFile(parentPath, sourcePath),
      'Failed to import file',
    );
  }

  async hasNativeImportCapability(): Promise<DriveCapabilityResult> {
    return runDriveOperation(
      async () => driveService.getProvider().hasCapability('native_import'),
      'Failed to inspect native import capability',
    );
  }

  async getFileContent(itemId: string): Promise<DriveContentResult> {
    return runDriveOperation(async () => vfs.readFile(itemId), 'Failed to read file content');
  }

  async getFileBytes(itemId: string): Promise<DriveBytesResult> {
    return runDriveOperation(async () => {
      const bytes = await vfs.readFileBinary(itemId);
      return toUint8Array(bytes);
    }, 'Failed to read file bytes');
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
    return runDriveVoidOperation(
      () => driveService.toggleStar(path, status),
      'Failed to update starred state',
    );
  }

  async touch(path: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.touch(path),
      'Failed to update file access time',
    );
  }

  async move(paths: string[], targetPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(
      () => driveService.getProvider().move(paths, targetPath),
      'Failed to move files',
    );
  }

  async downloadItems(items: DriveItem[]): Promise<DriveDownloadResult> {
    return runDriveOperation(async () => {
      const downloadableItems = items.filter(item => item.type === 'file');
      if (downloadableItems.length === 0) {
        throw new Error('No downloadable files selected');
      }

      const savedPaths: string[] = [];
      for (const item of downloadableItems) {
        const sourcePath = normalizeString(item.path || item.id);
        if (!sourcePath) {
          continue;
        }
        const resolvedUrl = await resolveDriveDownloadUrl(item);
        const bytes =
          !isDesktopShellRuntimeKind(getPlatformRuntime().system.kind()) &&
          canFetchResolvedDownloadUrl(resolvedUrl)
            ? await fetchResolvedDownloadBytes(resolvedUrl)
            : toUint8Array(await vfs.readFileBinary(sourcePath));
        const savedPath = await saveBytesAsDownload(
          item.name,
          bytes,
          normalizeString(item.mimeType) || guessMimeType(item.name),
        );
        savedPaths.push(savedPath);
      }

      if (savedPaths.length === 0) {
        throw new Error('No downloadable files selected');
      }

      return savedPaths;
    }, 'Failed to download drive items');
  }
}

export class ServerDriveBusinessAdapter implements DriveBusinessAdapter {
  private readonly pathToItemId = new Map<string, string>();
  private readonly itemIdToPath = new Map<string, string>();
  private cachedServerClient?: DriveServerClient;
  private cachedRootDescriptor?: DriveRootDescriptor;

  private getServerClient(): DriveServerClient {
    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('DriveBusinessService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[DriveBusinessService] Drive requires the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  private async readRootDescriptor(): Promise<DriveRootDescriptor> {
    if (!this.cachedRootDescriptor) {
      const response = await this.getServerClient().readDriveRoot();
      this.cachedRootDescriptor = response.data;
    }

    return this.cachedRootDescriptor;
  }

  private rememberItem(item: CanonicalDriveItem): DriveItem {
    const mapped = mapDriveItem(item);
    const normalizedPath = normalizeDrivePath(mapped.path || ROOT_PATH);
    this.pathToItemId.set(normalizedPath, mapped.id);
    this.itemIdToPath.set(mapped.id, normalizedPath);
    return mapped;
  }

  private resolveItemId(idOrPath: string): string | undefined {
    const normalized = normalizeString(idOrPath);
    if (!normalized) {
      return undefined;
    }

    if (this.itemIdToPath.has(normalized)) {
      return normalized;
    }

    if (normalized.startsWith('/')) {
      return this.pathToItemId.get(normalizeDrivePath(normalized));
    }

    return normalized;
  }

  private async readFileContentRecord(itemIdOrPath: string): Promise<CanonicalDriveFileContent> {
    const itemId = this.resolveItemId(itemIdOrPath);
    if (!itemId) {
      throw new Error('Drive item id is required');
    }

    const response = await this.getServerClient().readDriveFileContent(itemId);
    return response.data;
  }

  private resolveTargetPayload(targetPathOrId: string):
    | { targetParentId: string }
    | { targetParentPath: string }
    | Record<string, never> {
    const normalized = normalizeString(targetPathOrId);
    if (!normalized || normalized === ROOT_PATH) {
      return {};
    }

    if (this.itemIdToPath.has(normalized)) {
      return { targetParentId: normalized };
    }

    if (normalized.startsWith('/')) {
      return { targetParentPath: normalizeDrivePath(normalized) };
    }

    return { targetParentId: normalized };
  }

  async getDefaultPath(): Promise<DrivePathResult> {
    return runDriveOperation(async () => {
      const root = await this.readRootDescriptor();
      return normalizeDrivePath(root.rootPath);
    }, 'Failed to resolve default path');
  }

  async list(path: string): Promise<DriveListResult> {
    return runDriveOperation(async () => {
      const root = await this.readRootDescriptor();
      const scope = resolveVirtualScope(path);
      const response = await this.getServerClient().listDriveEntries(
        scope
          ? { scope }
          : {
              scope: root.defaultScope,
              parentPath: normalizeDrivePath(path || root.rootPath),
            },
      );

      return response.items.map(item => this.rememberItem(item));
    }, 'Failed to list drive path');
  }

  async getStats(): Promise<DriveStatsResult> {
    return runDriveOperation(async () => {
      const response = await this.getServerClient().readDriveStats();
      return mapDriveStats(response.data);
    }, 'Failed to load drive stats');
  }

  async createFolder(name: string, parentPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const root = await this.readRootDescriptor();
      const response = await this.getServerClient().createDriveFolder({
        name,
        parentPath: normalizeDrivePath(parentPath || root.rootPath),
      });
      this.rememberItem(response.data);
    }, 'Failed to create folder');
  }

  async uploadFile(
    parentPath: string,
    name: string,
    content: Uint8Array,
  ): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const root = await this.readRootDescriptor();
      const response = await this.getServerClient().uploadDriveFile({
        name,
        content: encodeBytesToBase64(new Uint8Array(content)),
        encoding: 'base64',
        parentPath: normalizeDrivePath(parentPath || root.rootPath),
        mimeType: guessMimeType(name),
      });
      this.rememberItem(response.data);
    }, 'Failed to upload file');
  }

  async importFile(parentPath: string, sourcePath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const root = await this.readRootDescriptor();
      const fileName = pathUtils.basename(sourcePath) || `import-${Date.now()}`;
      const response = await this.getServerClient().importDriveFile({
        sourcePath,
        parentPath: normalizeDrivePath(parentPath || root.rootPath),
        name: fileName,
        mimeType: guessMimeType(fileName),
      });
      this.rememberItem(response.data);
    }, 'Failed to import file');
  }

  async hasNativeImportCapability(): Promise<DriveCapabilityResult> {
    return runDriveOperation(async () => {
      const runtime = readDefaultPlatformRuntime('DriveBusinessService');
      return isDesktopShellRuntimeKind(runtime.system.kind());
    }, 'Failed to inspect native import capability');
  }

  async getFileContent(itemId: string): Promise<DriveContentResult> {
    return runDriveOperation(async () => {
      const response = await this.readFileContentRecord(itemId);
      return decodeDriveContentToText(response);
    }, 'Failed to read file content');
  }

  async getFileBytes(itemId: string): Promise<DriveBytesResult> {
    return runDriveOperation(async () => {
      const response = await this.readFileContentRecord(itemId);
      return cloneBytes(decodeDriveContentToBytes(response));
    }, 'Failed to read file bytes');
  }

  async updateFileContent(itemId: string, content: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const resolvedId = this.resolveItemId(itemId);
      if (!resolvedId) {
        throw new Error('Drive item id is required');
      }

      await this.getServerClient().updateDriveFileContent(resolvedId, {
        content,
        encoding: 'utf-8',
      });
    }, 'Failed to update file content');
  }

  async delete(paths: string[]): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemIds = paths
        .map(path => this.resolveItemId(path))
        .filter((itemId): itemId is string => Boolean(itemId));

      if (itemIds.length === 0) {
        return;
      }

      await this.getServerClient().deleteDriveItems({ itemIds });
    }, 'Failed to move files to trash');
  }

  async restore(paths: string[]): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemIds = paths
        .map(path => this.resolveItemId(path))
        .filter((itemId): itemId is string => Boolean(itemId));

      if (itemIds.length === 0) {
        return;
      }

      await this.getServerClient().restoreDriveItems({ itemIds });
    }, 'Failed to restore files');
  }

  async emptyTrash(): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      await this.getServerClient().emptyDriveTrash();
    }, 'Failed to empty trash');
  }

  async rename(path: string, newName: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemId = this.resolveItemId(path);
      if (!itemId) {
        throw new Error('Drive item id is required');
      }

      const response = await this.getServerClient().renameDriveItem({
        itemId,
        name: newName,
      });
      this.rememberItem(response.data);
    }, 'Failed to rename file');
  }

  async toggleStar(path: string, status: boolean): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemId = this.resolveItemId(path);
      if (!itemId) {
        throw new Error('Drive item id is required');
      }

      const response = await this.getServerClient().favoriteDriveItem({
        itemId,
        isFavorite: status,
      });
      this.rememberItem(response.data);
    }, 'Failed to update starred state');
  }

  async touch(_path: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      // Access timestamps are refreshed by canonical file-read APIs.
    }, 'Failed to update file access time');
  }

  async move(paths: string[], targetPath: string): Promise<DriveVoidResult> {
    return runDriveVoidOperation(async () => {
      const itemIds = paths
        .map(path => this.resolveItemId(path))
        .filter((itemId): itemId is string => Boolean(itemId));

      if (itemIds.length === 0) {
        return;
      }

      await this.getServerClient().moveDriveItems({
        itemIds,
        ...this.resolveTargetPayload(targetPath),
      });
    }, 'Failed to move files');
  }

  async downloadItems(items: DriveItem[]): Promise<DriveDownloadResult> {
    return runDriveOperation(async () => {
      const downloadableItems = items.filter(item => item.type === 'file');
      if (downloadableItems.length === 0) {
        throw new Error('No downloadable files selected');
      }

      const savedPaths: string[] = [];
      const failures: string[] = [];

      for (const item of downloadableItems) {
        try {
          const resolvedUrl = await resolveDriveDownloadUrl(item);
          const bytes =
            !isDesktopShellRuntimeKind(getPlatformRuntime().system.kind()) &&
            canFetchResolvedDownloadUrl(resolvedUrl)
              ? await fetchResolvedDownloadBytes(resolvedUrl)
              : decodeDriveContentToBytes(await this.readFileContentRecord(item.id));
          const savedPath = await saveBytesAsDownload(
            item.name,
            bytes,
            normalizeString(item.mimeType) || guessMimeType(item.name),
          );
          savedPaths.push(savedPath);
        } catch (error) {
          failures.push(`${item.name}: ${getErrorMessage(error, 'Download failed')}`);
        }
      }

      if (savedPaths.length === 0) {
        throw new Error(failures[0] || 'No downloadable files selected');
      }

      if (failures.length > 0) {
        console.warn('[DriveBusinessService] Partial download failures:', failures);
      }

      return savedPaths;
    }, 'Failed to download drive items');
  }
}

let driveBusinessAdapter: DriveBusinessAdapter = new ServerDriveBusinessAdapter();

export const setDriveBusinessAdapter = (adapter: DriveBusinessAdapter): void => {
  driveBusinessAdapter = adapter;
};

export const getDriveBusinessAdapter = (): DriveBusinessAdapter => {
  return driveBusinessAdapter;
};

export const resetDriveBusinessAdapter = (): void => {
  driveBusinessAdapter = new ServerDriveBusinessAdapter();
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

  async uploadFile(
    parentPath: string,
    name: string,
    content: Uint8Array,
  ): Promise<DriveVoidResult> {
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

  async getFileBytes(itemId: string): Promise<DriveBytesResult> {
    return getDriveBusinessAdapter().getFileBytes(itemId);
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

  async downloadItems(items: DriveItem[]): Promise<DriveDownloadResult> {
    return getDriveBusinessAdapter().downloadItems(items);
  }
}

export const driveBusinessService: IDriveBusinessService = new DriveBusinessService();
