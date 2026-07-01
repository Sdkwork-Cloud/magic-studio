import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  isMagicStudioServerClientError,
  isMagicStudioServerResourceNotFoundError,
  type MagicStudioNoteCreateRequest,
  type MagicStudioNotesListQuery,
  type MagicStudioNoteUpdateRequest,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type {
  Note,
  NoteFolder,
  NoteMetadata,
  NoteSummary,
  NoteType,
  NoteWorkspaceSnapshot,
} from '@sdkwork/magic-studio-types/notes';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { createClientEntityIdentity } from '@sdkwork/magic-studio-types/entity';
import {
  Result,
  type IBaseService,
  type ServiceResult,
} from '@sdkwork/magic-studio-types/service';

const DEFAULT_PAGE_SIZE = 50;
const FALLBACK_NOTE_TITLE = 'Untitled';
const FALLBACK_FOLDER_NAME = 'Untitled Folder';
const NOTE_NOT_FOUND_CODES = ['APP_NOTE_NOT_FOUND'] as const;
const SUPPORTED_NOTE_TYPES = new Set<NoteType>([
  'doc',
  'article',
  'novel',
  'log',
  'news',
  'code',
]);

type NotesServerClient = Pick<
  MagicStudioServerClient,
  | 'readNotesWorkspaceSnapshot'
  | 'listNotes'
  | 'createNote'
  | 'listTrashedNotes'
  | 'readNote'
  | 'updateNote'
  | 'createNoteFolder'
  | 'renameNoteFolder'
  | 'deleteNoteFolder'
  | 'trashNote'
  | 'restoreNote'
  | 'deleteNote'
  | 'clearNotesTrash'
  | 'moveNoteFolder'
  | 'moveNote'
  | 'publishNote'
>;

export interface NoteServiceOptions {
  serverClient?: NotesServerClient;
}

function readText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function readOptionalText(value: unknown): string | undefined {
  const text = readText(value);
  return text || undefined;
}

function readPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return fallback;
}

function normalizePageRequest(
  pageRequest?: PageRequest,
): Required<Pick<PageRequest, 'page' | 'size'>> {
  return {
    page: Math.max(0, pageRequest?.page ?? 0),
    size: Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE),
  };
}

function normalizeTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const seen = new Set<string>();
  const tags = value
    .map((entry) => readText(entry))
    .filter((entry) => {
      if (!entry || seen.has(entry)) {
        return false;
      }
      seen.add(entry);
      return true;
    });

  return tags.length > 0 ? tags : undefined;
}

function normalizeNoteType(value: unknown, fallback: NoteType = 'doc'): NoteType {
  const candidate = readText(value) as NoteType;
  return SUPPORTED_NOTE_TYPES.has(candidate) ? candidate : fallback;
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function normalizeMetadata(value: NoteMetadata | undefined): NoteMetadata {
  return stripUndefinedFields({
    author: readOptionalText(value?.author),
    coverImage: readOptionalText(value?.coverImage),
    customWidth: readOptionalText(value?.customWidth),
    icon: readOptionalText(value?.icon),
    readingTime:
      typeof value?.readingTime === 'number' && Number.isFinite(value.readingTime)
        ? value.readingTime
        : undefined,
    tags: normalizeTags(value?.tags),
    wordCount:
      typeof value?.wordCount === 'number' && Number.isFinite(value.wordCount)
        ? value.wordCount
        : undefined,
  }) as NoteMetadata;
}

function toServerListQuery(pageRequest?: PageRequest): MagicStudioNotesListQuery {
  const normalized = normalizePageRequest(pageRequest);
  return stripUndefinedFields({
    keyword: readOptionalText(pageRequest?.keyword),
    page: normalized.page + 1,
    pageSize: normalized.size,
  }) as MagicStudioNotesListQuery;
}

function toPage<T>(
  items: T[],
  meta: {
    page?: number;
    pageSize?: number;
    total?: number;
  },
  pageRequest?: PageRequest,
): Page<T> {
  const fallback = normalizePageRequest(pageRequest);
  const pageSize = readPositiveInteger(meta.pageSize, fallback.size);
  const page = Math.max(0, readPositiveInteger(meta.page, fallback.page + 1) - 1);
  const totalElements = readPositiveInteger(meta.total, items.length);
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize);

  return {
    content: items,
    pageable: {
      pageNumber: page,
      pageSize,
      offset: page * pageSize,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: totalPages === 0 ? true : page >= totalPages - 1,
    totalPages,
    totalElements,
    size: pageSize,
    number: page,
    sort: { sorted: true, unsorted: false, empty: false },
    first: page === 0,
    numberOfElements: items.length,
    empty: items.length === 0,
  };
}

function toNoteSummary(note: Partial<Note>): NoteSummary {
  const identity = createClientEntityIdentity({
    id: readOptionalText(note.id) ?? null,
    uuid: readOptionalText(note.uuid),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt,
  });
  const content = readText(note.content);

  return stripUndefinedFields({
    ...identity,
    title: readText(note.title) || FALLBACK_NOTE_TITLE,
    type: normalizeNoteType(note.type, 'doc'),
    parentId:
      note.parentId !== undefined ? readOptionalText(note.parentId) ?? null : null,
    tags: normalizeTags(note.tags) ?? [],
    isFavorite: note.isFavorite === true,
    snippet: readText(note.snippet) || content.slice(0, 300),
    publishStatus: note.publishStatus,
    metadata:
      note.metadata !== undefined ? normalizeMetadata(note.metadata) : undefined,
  }) as NoteSummary;
}

function toNote(note: Partial<Note>): Note {
  return {
    ...toNoteSummary(note),
    content: readText(note.content),
  };
}

function toNoteFolder(folder: Partial<NoteFolder>): NoteFolder {
  const identity = createClientEntityIdentity({
    id: readOptionalText(folder.id) ?? null,
    uuid: readOptionalText(folder.uuid),
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    deletedAt: folder.deletedAt,
  });

  return {
    ...identity,
    name: resolveFolderName(folder.name),
    parentId:
      folder.parentId !== undefined ? readOptionalText(folder.parentId) ?? null : null,
  };
}

function toWorkspaceSnapshot(snapshot: NoteWorkspaceSnapshot): NoteWorkspaceSnapshot {
  return {
    notes: snapshot.notes.map(toNoteSummary),
    trashedNotes: snapshot.trashedNotes.map(toNoteSummary),
    folders: snapshot.folders.map(toNoteFolder),
  };
}

function toCreateRequest(entity: Partial<Note>): MagicStudioNoteCreateRequest {
  return stripUndefinedFields({
    content: entity.content ?? '',
    isFavorite: entity.isFavorite,
    metadata:
      entity.metadata !== undefined ? normalizeMetadata(entity.metadata) : undefined,
    parentId:
      entity.parentId !== undefined ? readOptionalText(entity.parentId) ?? null : undefined,
    tags: normalizeTags(entity.tags),
    title: readText(entity.title) || FALLBACK_NOTE_TITLE,
    type: normalizeNoteType(entity.type, 'doc'),
  }) as MagicStudioNoteCreateRequest;
}

function toUpdateRequest(entity: Partial<Note>): MagicStudioNoteUpdateRequest | null {
  const payload = stripUndefinedFields({
    content: entity.content,
    isFavorite: entity.isFavorite,
    metadata:
      entity.metadata !== undefined ? normalizeMetadata(entity.metadata) : undefined,
    tags: normalizeTags(entity.tags),
    title: entity.title !== undefined ? readText(entity.title) || FALLBACK_NOTE_TITLE : undefined,
    type: entity.type !== undefined ? normalizeNoteType(entity.type, 'doc') : undefined,
  }) as MagicStudioNoteUpdateRequest;

  return Object.keys(payload).length > 0 ? payload : null;
}

function resolveFolderName(value: unknown): string {
  return readText(value) || FALLBACK_FOLDER_NAME;
}

function resolveNoteId(value: unknown): string {
  return readText(value);
}

function isNotFoundError(error: unknown): boolean {
  return isMagicStudioServerResourceNotFoundError(error, NOTE_NOT_FOUND_CODES);
}

function toErrorMessage(error: unknown, fallback: string): string {
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
}

export class NoteService implements IBaseService<NoteSummary> {
  private readonly serverClient?: NotesServerClient;
  private cachedServerClient?: NotesServerClient;

  constructor(options: NoteServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): NotesServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('NoteService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[NoteService] Notes capabilities require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  async readWorkspaceSnapshot(): Promise<ServiceResult<NoteWorkspaceSnapshot>> {
    try {
      const response = await this.getServerClient().readNotesWorkspaceSnapshot();
      return Result.success(toWorkspaceSnapshot(response.data));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query note workspace snapshot'));
    }
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    try {
      const response = await this.getServerClient().listNotes(toServerListQuery(pageRequest));
      return Result.success(toPage(response.items.map(toNoteSummary), response.meta, pageRequest));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query notes'));
    }
  }

  async findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    try {
      const response = await this.getServerClient().listTrashedNotes(
        toServerListQuery(pageRequest),
      );
      return Result.success(toPage(response.items.map(toNoteSummary), response.meta, pageRequest));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query trashed notes'));
    }
  }

  async findById(id: string): Promise<ServiceResult<Note | null>> {
    const noteId = resolveNoteId(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      const response = await this.getServerClient().readNote(noteId);
      return Result.success(toNote(response.data));
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return Result.success(null);
      }
      return Result.error(toErrorMessage(error, 'Failed to load note'));
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return Boolean(result.success && result.data);
  }

  async save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>> {
    try {
      const client = this.getServerClient();
      const noteId = resolveNoteId(entity.id);

      if (!noteId) {
        const response = await client.createNote(toCreateRequest(entity));
        return Result.success(toNoteSummary(response.data));
      }

      const updatePayload = toUpdateRequest(entity);
      if (updatePayload) {
        await client.updateNote(noteId, updatePayload);
      }

      if (entity.parentId !== undefined) {
        await client.moveNote(noteId, {
          targetFolderId: readOptionalText(entity.parentId) ?? null,
        });
      }

      if (entity.deletedAt !== undefined) {
        if (entity.deletedAt) {
          const response = await client.trashNote(noteId);
          return Result.success(toNoteSummary(response.data));
        }
        const response = await client.restoreNote(noteId);
        return Result.success(toNoteSummary(response.data));
      }

      const response = await client.readNote(noteId);
      return Result.success(toNoteSummary(response.data));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to save note'));
    }
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    const noteId = resolveNoteId(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      await this.getServerClient().deleteNote(noteId);
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to permanently delete note'));
    }
  }

  async moveToTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    const noteId = resolveNoteId(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      const response = await this.getServerClient().trashNote(noteId);
      return Result.success(toNoteSummary(response.data));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to move note to trash'));
    }
  }

  async restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    const noteId = resolveNoteId(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      const response = await this.getServerClient().restoreNote(noteId);
      return Result.success(toNoteSummary(response.data));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to restore note'));
    }
  }

  async clearTrash(): Promise<ServiceResult<number>> {
    try {
      const client = this.getServerClient();
      const snapshot = await client.readNotesWorkspaceSnapshot();
      const total = snapshot.data.trashedNotes.length;
      if (total === 0) {
        return Result.success(0);
      }

      await client.clearNotesTrash();
      return Result.success(total);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to clear trash'));
    }
  }

  async getFolders(): Promise<ServiceResult<NoteFolder[]>> {
    const snapshot = await this.readWorkspaceSnapshot();
    if (!snapshot.success || !snapshot.data) {
      return Result.error(snapshot.message || 'Failed to query folders');
    }

    return Result.success(snapshot.data.folders);
  }

  async createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>> {
    try {
      const response = await this.getServerClient().createNoteFolder({
        name: resolveFolderName(name),
        parentId: readOptionalText(parentId) ?? null,
      });
      return Result.success(response.data);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to create folder'));
    }
  }

  async deleteFolder(id: string): Promise<ServiceResult<void>> {
    const folderId = resolveNoteId(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }

    try {
      await this.getServerClient().deleteNoteFolder(folderId);
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete folder'));
    }
  }

  async renameFolder(id: string, newName: string): Promise<ServiceResult<string>> {
    const folderId = resolveNoteId(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }

    try {
      const response = await this.getServerClient().renameNoteFolder(folderId, {
        name: resolveFolderName(newName),
      });
      return Result.success(readText(response.data.id) || response.data.uuid);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to rename folder'));
    }
  }

  async moveFolder(id: string, newParentId: string | null): Promise<ServiceResult<void>> {
    const folderId = resolveNoteId(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }

    try {
      await this.getServerClient().moveNoteFolder(folderId, {
        targetFolderId: readOptionalText(newParentId) ?? null,
      });
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to move folder'));
    }
  }

  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
    const noteId = readText(note.id) || note.uuid;
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      await this.getServerClient().moveNote(noteId, {
        targetFolderId: readOptionalText(newParentId) ?? null,
      });
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to move note'));
    }
  }

  async delete(entity: NoteSummary): Promise<ServiceResult<void>> {
    const noteId = readText(entity.id) || entity.uuid;
    if (!noteId) {
      return Result.error('Note id is required');
    }
    return this.deleteById(noteId);
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      const result = await this.deleteById(id);
      if (!result.success) {
        return Result.error(result.message || 'Failed to delete notes');
      }
    }
    return Result.success(undefined);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<NoteSummary[]>> {
    const found: NoteSummary[] = [];
    for (const id of ids) {
      const result = await this.findById(id);
      if (!result.success || !result.data) {
        continue;
      }
      found.push(toNoteSummary(result.data));
    }
    return Result.success(found);
  }

  async saveAll(entities: Partial<NoteSummary>[]): Promise<ServiceResult<NoteSummary[]>> {
    const saved: NoteSummary[] = [];
    for (const entity of entities) {
      const result = await this.save(entity as Partial<Note>);
      if (!result.success || !result.data) {
        return Result.error(result.message || 'Failed to save notes');
      }
      saved.push(result.data);
    }
    return Result.success(saved);
  }

  async count(): Promise<number> {
    const result = await this.findAll({ page: 0, size: 1 });
    if (!result.success || !result.data) {
      return 0;
    }
    return result.data.totalElements;
  }
}

export const noteService = new NoteService();
