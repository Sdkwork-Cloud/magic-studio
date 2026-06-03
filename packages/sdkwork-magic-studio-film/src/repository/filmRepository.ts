import type {
  FilmProject,
} from '@sdkwork/magic-studio-types/film';
import type {
  MagicStudioFilmExportPackage,
  MagicStudioFilmImportPackage,
} from '@sdkwork/magic-studio-host-types';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';

/**
 * Film Repository
 * Responsible for raw data access and persistence.
 * No complex business logic allowed here.
 * All host interactions go through the standardized runtime capability API.
 */
import { getPlatformRuntime, isDesktopShellRuntimeKind } from '@sdkwork/magic-studio-core/platform';
import { filmService } from '../services/filmService';
import { filmProjectService } from '../services/filmProjectService';

const CURRENT_PROJECT_KEY = 'film_current_project';
const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*]/g;

const normalizeString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const sanitizeFileName = (value: string, fallback = 'film-export.zip'): string => {
  const normalized = normalizeString(value)
    .replace(INVALID_FILE_NAME_CHARS, '-')
    .replace(/\s+/g, ' ')
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
  const downloadsDir = await runtime.system.path('downloads');
  const safeName = sanitizeFileName(fileName);
  let candidate = pathUtils.join(downloadsDir, safeName);
  if (!(await runtime.fileSystem.exists(candidate))) {
    return candidate;
  }

  const { baseName, extension } = splitFileName(safeName);
  for (let index = 1; index <= 100; index += 1) {
    candidate = pathUtils.join(downloadsDir, `${baseName} (${index})${extension}`);
    if (!(await runtime.fileSystem.exists(candidate))) {
      return candidate;
    }
  }

  return pathUtils.join(downloadsDir, `${baseName}-${Date.now()}${extension}`);
};

const triggerBrowserDownload = (blob: Blob, fileName: string): string => {
  const safeName = sanitizeFileName(fileName);
  if (typeof document === 'undefined') {
    return safeName;
  }
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = safeName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  return safeName;
};

const decodeBase64ToBytes = (value: string): Uint8Array => {
  if (typeof atob === 'function') {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  const bufferCtor = (globalThis as unknown as {
    Buffer?: { from(input: string, encoding: string): Uint8Array };
  }).Buffer;
  if (bufferCtor) {
    return Uint8Array.from(bufferCtor.from(value, 'base64'));
  }

  throw new Error('Base64 decoding is not available in the current runtime');
};

const encodeBytesToBase64 = (bytes: Uint8Array): string => {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary);
  }

  const bufferCtor = (globalThis as unknown as {
    Buffer?: { from(input: Uint8Array): { toString(encoding: string): string } };
  }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(bytes).toString('base64');
  }

  throw new Error('Base64 encoding is not available in the current runtime');
};

const encodeTextToBase64 = (value: string): string => {
  return encodeBytesToBase64(new TextEncoder().encode(value));
};

const inferImportMimeType = (fileName: string): string => {
  return pathUtils.extname(fileName).toLowerCase() === '.zip'
    ? 'application/zip'
    : 'application/json';
};

const saveBytesAsDownload = async (
  fileName: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> => {
  const runtime = getPlatformRuntime();
  if (isDesktopShellRuntimeKind(runtime.system.kind())) {
    const destinationPath = await resolveUniqueDownloadPath(fileName);
    await runtime.fileSystem.writeBinary(destinationPath, bytes);
    return destinationPath;
  }

  return triggerBrowserDownload(
    new Blob([new Uint8Array(bytes)], { type: mimeType || 'application/octet-stream' }),
    fileName
  );
};

export const filmRepository = {
  // ============================================================================
  // Project Persistence
  // ============================================================================
  
  /**
   * Save project to storage
   */
  saveProject: async (project: FilmProject): Promise<void> => {
    const runtime = getPlatformRuntime();
    const result = await filmProjectService.save(project);
    if (!result.success) {
      throw new Error(result.message || 'Failed to save film project');
    }
    await runtime.storage.set(CURRENT_PROJECT_KEY, project.uuid);
  },
  
  /**
   * Get all projects
   */
  getAllProjects: async (): Promise<FilmProject[]> => {
    const result = await filmProjectService.findAll({ page: 0, size: 1000 });
    if (!result.success) {
      throw new Error(result.message || 'Failed to list film projects');
    }
    return result.data?.content || [];
  },
  
  /**
   * Get project by UUID
   */
  getProject: async (uuid: string): Promise<FilmProject | null> => {
    const result = await filmProjectService.findById(uuid);
    if (!result.success) {
      throw new Error(result.message || 'Failed to load film project');
    }
    return result.data || null;
  },
  
  /**
   * Get current project
   */
  getCurrentProject: async (): Promise<FilmProject | null> => {
    const runtime = getPlatformRuntime();
    const currentUuid = await runtime.storage.get(CURRENT_PROJECT_KEY);
    if (!currentUuid) return null;
    return filmRepository.getProject(currentUuid);
  },
  
  /**
   * Delete project
   */
  deleteProject: async (uuid: string): Promise<void> => {
    const result = await filmProjectService.deleteById(uuid);
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete film project');
    }
  },
  
  // ============================================================================
  // Export Operations
  // ============================================================================
  
  /**
   * Export project as canonical host-owned package
   */
  exportProject: async (project: FilmProject): Promise<MagicStudioFilmExportPackage> => {
    const projectId = project.uuid || project.id;
    if (!projectId) {
      throw new Error('Film project id is required for export');
    }
    return filmService.exportPackage(projectId, {
      fileName: `${project.name || 'film-project'}.zip`,
      includeAssetInventory: true,
    });
  },

  /**
   * Save exported package to the user-visible downloads surface
   */
  saveExportPackage: async (exportPackage: MagicStudioFilmExportPackage): Promise<string> => {
    const bytes = decodeBase64ToBytes(exportPackage.bytesBase64);
    return saveBytesAsDownload(exportPackage.fileName, bytes, exportPackage.mimeType);
  },
  
  /**
   * Import project from JSON
   */
  importProject: async (json: string): Promise<FilmProject> => {
    const result = await filmService.importPackage({
      sourceKind: 'project-json',
      fileName: 'film-project.json',
      mimeType: 'application/json',
      bytesBase64: encodeTextToBase64(json),
      conflictPolicy: 'rename',
    });
    const runtime = getPlatformRuntime();
    await runtime.storage.set(CURRENT_PROJECT_KEY, result.project.uuid || result.project.id);
    return result.project;
  },

  /**
   * Import project package from a selected source file
   */
  importProjectFile: async (path: string): Promise<MagicStudioFilmImportPackage> => {
    const runtime = getPlatformRuntime();
    const fileName = pathUtils.basename(path) || 'film-project.json';
    const bytes = await runtime.fileSystem.readBinary(path);
    const result = await filmService.importPackage({
      fileName,
      mimeType: inferImportMimeType(fileName),
      bytesBase64: encodeBytesToBase64(bytes),
      conflictPolicy: 'rename',
    });
    await runtime.storage.set(CURRENT_PROJECT_KEY, result.project.uuid || result.project.id);
    return result;
  },
  
  /**
   * Save file to disk
   */
  saveFile: async (data: string, filename: string): Promise<string | null> => {
    return await getPlatformRuntime().fileSystem.saveText(data, filename);
  },
  
  /**
   * Select file for import
   */
  selectFile: async (): Promise<string[]> => {
    return await getPlatformRuntime().fileSystem.selectFile({ multiple: false, extensions: ['json', 'zip'] });
  },
  
  /**
   * Read file content
   */
  readFile: async (path: string): Promise<string> => {
    return await getPlatformRuntime().fileSystem.readText(path);
  },
};
