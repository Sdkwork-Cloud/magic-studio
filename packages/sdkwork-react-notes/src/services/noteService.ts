import type { NoteContentUpdateRequest, NoteCreateRequest, NoteFolderVO, NoteUpdateRequest, NoteVO, PageNoteVO, QueryParams } from '@sdkwork/app-sdk';
import { IBaseService, Note, NoteFolder, NoteSummary, Page, PageRequest, Result, ServiceResult } from '@sdkwork/react-commons';
import { getAppSdkClientWithSession } from '@sdkwork/react-core';

const DEFAULT_PAGE_SIZE = 50;
const MAX_LIST_PAGE_SIZE = 100;
const MAX_SCAN_PAGES = 50;
const DELETE_VERIFY_ATTEMPTS = 5;
const DELETE_VERIFY_WAIT_MS = 200;
const SUCCESS_CODE = '2000';
const FALLBACK_NOTE_TITLE = 'Untitled';
const FALLBACK_FOLDER_NAME = 'Untitled Folder';
const NOTE_TYPE_TAG_PREFIX = '__note_type__:';
const NOTES_BATCH_DELETE_PATHS = ['/app/v3/api/notes/batch-delete', '/app/v3/api/notes/batch'];
const NOTES_FOLDER_MOVE_PATH_TEMPLATES = [
  '/app/v3/api/notes/folders/{id}/move',
  '/app/v3/api/notes/folders/{id}:move',
  '/app/v3/api/notes/folders/{id}',
];
const NOTES_FOLDER_MOVE_HTTP_METHODS = ['PUT', 'PATCH', 'POST'] as const;
const SUPPORTED_NOTE_TYPES = new Set<Note['type']>(['doc', 'article', 'novel', 'log', 'news', 'code']);

type ApiEnvelope<T> = {
  code?: string | number;
  msg?: string;
  data?: T;
};

const toErrorMessage = (error: unknown, fallback: string): string => {
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

const buildApiPath = (template: string, id: string): string => {
  const encodedId = encodeURIComponent(normalizeString(id));
  return template.replace('{id}', encodedId);
};

const toTimestamp = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const text = normalizeString(value);
  if (!text) {
    return 0;
  }
  const directNumber = Number(text);
  if (Number.isFinite(directNumber)) {
    return directNumber;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  tags.forEach((tag) => {
    const text = normalizeString(tag);
    if (!text || seen.has(text)) {
      return;
    }
    seen.add(text);
    normalized.push(text);
  });
  return normalized;
};

const normalizeNoteType = (value: unknown, fallback: Note['type'] = 'doc'): Note['type'] => {
  const normalized = normalizeString(value) as Note['type'];
  if (SUPPORTED_NOTE_TYPES.has(normalized)) {
    return normalized;
  }
  return fallback;
};

const stripSystemTags = (tags: string[]): string[] => {
  return tags.filter((tag) => !tag.startsWith(NOTE_TYPE_TAG_PREFIX));
};

const extractNoteType = (tags: string[]): Note['type'] => {
  for (const tag of tags) {
    if (!tag.startsWith(NOTE_TYPE_TAG_PREFIX)) {
      continue;
    }
    const candidate = tag.slice(NOTE_TYPE_TAG_PREFIX.length).trim();
    if (SUPPORTED_NOTE_TYPES.has(candidate as Note['type'])) {
      return candidate as Note['type'];
    }
  }
  return 'doc';
};

const withSystemTypeTag = (tags: string[], type: Note['type']): string[] => {
  const userTags = stripSystemTags(tags);
  return [...userTags, `${NOTE_TYPE_TAG_PREFIX}${normalizeNoteType(type)}`];
};

const createSnippet = (value: string): string => {
  if (!value) {
    return '';
  }
  const plain = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) {
    return '';
  }
  return plain.length <= 300 ? plain : plain.slice(0, 300);
};

const normalizeStatus = (value: unknown): string => normalizeString(value).toUpperCase();

const isDeletedStatus = (status: unknown): boolean => normalizeStatus(status) === 'DELETED';

const isArchivedStatus = (status: unknown): boolean => normalizeStatus(status) === 'ARCHIVED';

const isNotFoundMessage = (message: string): boolean => /(not\s*found|notfound|不存在|未找到)/i.test(message);

const isApiSuccess = (result: { code?: string | number } | null | undefined): boolean => {
  const code = normalizeString(result?.code);
  return !code || code === SUCCESS_CODE || code === '200';
};

const isMethodUnavailableError = (error: unknown): boolean => {
  const message = toErrorMessage(error, '').toLowerCase();
  if (!message) {
    return false;
  }
  return (
    message.includes('404')
    || message.includes('405')
    || message.includes('not found')
    || message.includes('method not allowed')
    || message.includes('unsupported')
  );
};

const findCallableMethodName = (target: Record<string, unknown>, candidates: string[]): string | null => {
  for (const name of candidates) {
    if (typeof target[name] === 'function') {
      return name;
    }
  }
  return null;
};

const wait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const ensureApiSuccess = (result: { code?: string | number; msg?: string } | null | undefined, fallback: string): void => {
  if (isApiSuccess(result)) {
    return;
  }
  const message = normalizeString(result?.msg);
  throw new Error(message || fallback);
};

const unwrapApiData = <T>(result: ApiEnvelope<T>, fallback: string): T => {
  ensureApiSuccess(result, fallback);
  if (result.data === undefined || result.data === null) {
    throw new Error(fallback);
  }
  return result.data;
};

const mapNoteSummary = (note: NoteVO): NoteSummary => {
  const id = normalizeString(note.id) || normalizeString(note.uuid);
  const uuid = normalizeString(note.uuid) || id;
  const createdAt = normalizeString(note.createdAt) || new Date().toISOString();
  const updatedAt = normalizeString(note.updatedAt) || createdAt;
  const status = normalizeStatus(note.status);
  const content = normalizeString(note.content);
  const summary = normalizeString(note.summary);
  const snippet = summary || createSnippet(content);
  const deletedAt = isDeletedStatus(status) ? updatedAt || new Date().toISOString() : undefined;

  const rawTags = normalizeTags(note.tags);
  const resolvedType = extractNoteType(rawTags);
  const userTags = stripSystemTags(rawTags);

  const metadata: NoteSummary['metadata'] = {};
  const coverImage = normalizeString(note.coverImageUrl);
  if (coverImage) {
    metadata.coverImage = coverImage;
  }
  if (typeof note.wordCount === 'number' && Number.isFinite(note.wordCount)) {
    metadata.wordCount = note.wordCount;
  }
  if (userTags.length > 0) {
    metadata.tags = userTags;
  }

  const publishStatus: NoteSummary['publishStatus'] = isArchivedStatus(status) ? 'archived' : 'draft';

  return {
    id: id || uuid || `note-${Date.now()}`,
    uuid: uuid || id || `note-${Date.now()}`,
    title: normalizeString(note.title) || FALLBACK_NOTE_TITLE,
    type: resolvedType,
    parentId: normalizeString(note.folderId) || null,
    tags: userTags,
    isFavorite: Boolean(note.favorited),
    snippet,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    publishStatus,
    createdAt,
    updatedAt,
    deletedAt,
  };
};

const mapNote = (note: NoteVO, fullContent?: string): Note => {
  const summary = mapNoteSummary(note);
  const content = fullContent !== undefined ? fullContent : normalizeString(note.content);
  return {
    ...summary,
    content,
  };
};

const toNoteSummaryFromNote = (note: Note): NoteSummary => {
  const { content: _content, ...summary } = note;
  return summary;
};

const mapFolder = (folder: NoteFolderVO, parentId?: string | null): NoteFolder => {
  const id = normalizeString(folder.id) || normalizeString(folder.uuid);
  const uuid = normalizeString(folder.uuid) || id;
  const createdAt = normalizeString(folder.createdAt) || new Date().toISOString();
  const updatedAt = normalizeString(folder.updatedAt) || createdAt;
  return {
    id: id || uuid || `folder-${Date.now()}`,
    uuid: uuid || id || `folder-${Date.now()}`,
    name: normalizeString(folder.name) || FALLBACK_FOLDER_NAME,
    parentId: parentId !== undefined ? parentId : (normalizeString(folder.parentId) || null),
    createdAt,
    updatedAt,
  };
};

const flattenFolders = (folders: NoteFolderVO[] | undefined): NoteFolder[] => {
  if (!Array.isArray(folders) || folders.length === 0) {
    return [];
  }
  const collected: NoteFolder[] = [];
  const seen = new Set<string>();

  const visit = (items: NoteFolderVO[], parentId?: string | null): void => {
    items.forEach((item) => {
      const mapped = mapFolder(item, parentId);
      if (!seen.has(mapped.id)) {
        seen.add(mapped.id);
        collected.push(mapped);
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        visit(item.children, mapped.id);
      }
    });
  };

  visit(folders);
  return collected;
};

const normalizePageRequest = (pageRequest?: PageRequest): Required<Pick<PageRequest, 'page' | 'size'>> => ({
  page: Math.max(0, pageRequest?.page ?? 0),
  size: Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE),
});

const buildListParams = (
  pageRequest?: PageRequest,
  overrides: {
    includeDeleted?: boolean;
    includeArchived?: boolean;
    favoriteOnly?: boolean;
  } = {},
): QueryParams => {
  const normalized = normalizePageRequest(pageRequest);
  const params: QueryParams = {
    pageNum: normalized.page + 1,
    pageSize: Math.min(MAX_LIST_PAGE_SIZE, normalized.size),
    sortField: 'updatedAt',
    sortOrder: 'desc',
    includeDeleted: Boolean(overrides.includeDeleted),
    includeArchived: Boolean(overrides.includeArchived),
    favoriteOnly: Boolean(overrides.favoriteOnly),
  };
  const keyword = normalizeString(pageRequest?.keyword);
  if (keyword) {
    params.keyword = keyword;
  }
  return params;
};

const toPage = <T>(items: T[], pageRequest?: PageRequest): Page<T> => {
  const normalized = normalizePageRequest(pageRequest);
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / normalized.size);
  const from = normalized.page * normalized.size;
  const content = items.slice(from, from + normalized.size);
  return {
    content,
    pageable: {
      pageNumber: normalized.page,
      pageSize: normalized.size,
      offset: from,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: totalPages === 0 ? true : normalized.page >= totalPages - 1,
    totalPages,
    totalElements,
    size: normalized.size,
    number: normalized.page,
    sort: { sorted: true, unsorted: false, empty: false },
    first: normalized.page === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
};

const mergePage = (page: PageNoteVO, content: NoteSummary[], pageRequest?: PageRequest): Page<NoteSummary> => {
  const normalized = normalizePageRequest(pageRequest);
  const size = page.size ?? normalized.size;
  const number = page.number ?? normalized.page;
  const totalElements = page.totalElements ?? content.length;
  const totalPages = page.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

  return {
    content,
    pageable: {
      pageNumber: number,
      pageSize: size,
      offset: number * size,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: page.last ?? (totalPages === 0 ? true : number >= totalPages - 1),
    totalPages,
    totalElements,
    size,
    number,
    sort: { sorted: true, unsorted: false, empty: false },
    first: page.first ?? number === 0,
    numberOfElements: page.numberOfElements ?? content.length,
    empty: page.empty ?? content.length === 0,
  };
};

class NoteService implements IBaseService<NoteSummary> {
  private getClient() {
    return getAppSdkClientWithSession();
  }

  private getNotesApiRecord(): Record<string, unknown> {
    return this.getClient().notes as unknown as Record<string, unknown>;
  }

  private getRawHttpRequest():
    | ((path: string, options?: { method?: string; body?: unknown }) => Promise<unknown>)
    | null {
    const client = this.getClient() as unknown as {
      http?: {
        request?: (path: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;
      };
    };
    if (!client.http || typeof client.http.request !== 'function') {
      return null;
    }
    return client.http.request.bind(client.http);
  }

  private async tryInvokeNotesMethod(
    candidates: string[],
    args: unknown[],
    fallbackMessage: string,
  ): Promise<boolean> {
    const notesApi = this.getNotesApiRecord();
    const methodName = findCallableMethodName(notesApi, candidates);
    if (!methodName) {
      return false;
    }
    const method = notesApi[methodName] as (...methodArgs: unknown[]) => Promise<unknown>;
    const response = await method.call(notesApi, ...args);
    ensureApiSuccess(response as ApiEnvelope<unknown>, fallbackMessage);
    return true;
  }

  private async tryBatchDeleteNotes(noteIds: string[]): Promise<boolean> {
    const normalizedIds = noteIds
      .map((id) => normalizeString(id))
      .filter((id) => Boolean(id));
    if (normalizedIds.length === 0) {
      return false;
    }
    const request = this.getRawHttpRequest();
    if (!request) {
      return false;
    }

    const payload = normalizedIds
      .map((id) => {
        const parsed = Number(id);
        return Number.isFinite(parsed) ? parsed : id;
      });

    let unavailableCount = 0;
    let lastError: unknown = null;

    for (const path of NOTES_BATCH_DELETE_PATHS) {
      try {
        const response = await request(path, { method: 'DELETE', body: payload });
        ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to batch delete notes');
        return true;
      } catch (error: unknown) {
        lastError = error;
        if (isMethodUnavailableError(error)) {
          unavailableCount += 1;
          continue;
        }
        throw error;
      }
    }

    if (unavailableCount === NOTES_BATCH_DELETE_PATHS.length) {
      return false;
    }
    if (lastError) {
      throw lastError;
    }
    return false;
  }

  private async tryMoveFolderByRawHttp(folderId: string, newParentId: string | null): Promise<boolean> {
    const request = this.getRawHttpRequest();
    if (!request) {
      return false;
    }

    let unavailableCount = 0;
    let lastError: unknown = null;
    const body = {
      parentId: normalizeString(newParentId) || undefined,
    };

    for (const template of NOTES_FOLDER_MOVE_PATH_TEMPLATES) {
      const path = buildApiPath(template, folderId);
      for (const method of NOTES_FOLDER_MOVE_HTTP_METHODS) {
        try {
          const response = await request(path, { method, body });
          ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to move folder');
          return true;
        } catch (error: unknown) {
          lastError = error;
          if (isMethodUnavailableError(error)) {
            unavailableCount += 1;
            continue;
          }
          throw error;
        }
      }
    }

    if (unavailableCount === (NOTES_FOLDER_MOVE_PATH_TEMPLATES.length * NOTES_FOLDER_MOVE_HTTP_METHODS.length)) {
      return false;
    }
    if (lastError) {
      throw lastError;
    }
    return false;
  }

  private async resolveFolderMap(): Promise<Map<string, NoteFolder>> {
    const foldersResult = await this.getFolders();
    if (!foldersResult.success || !foldersResult.data) {
      throw new Error(foldersResult.message || 'Failed to query folders');
    }

    const folderMap = new Map<string, NoteFolder>();
    foldersResult.data.forEach((folder) => {
      const id = normalizeString(folder.id) || normalizeString(folder.uuid);
      if (!id) {
        return;
      }
      folderMap.set(id, folder);
    });
    return folderMap;
  }

  private async resolveFolderParentId(folderId: string): Promise<string | null | undefined> {
    const folderMap = await this.resolveFolderMap();
    const folder = folderMap.get(folderId);
    if (!folder) {
      return undefined;
    }
    const normalizedParentId = normalizeString(folder.parentId);
    return normalizedParentId || null;
  }

  private async assertValidFolderMove(folderId: string, newParentId: string | null): Promise<void> {
    const folderMap = await this.resolveFolderMap();
    if (!folderMap.has(folderId)) {
      throw new Error('Folder not found');
    }

    const normalizedParentId = normalizeString(newParentId);
    if (!normalizedParentId) {
      return;
    }

    if (!folderMap.has(normalizedParentId)) {
      throw new Error('Target folder not found');
    }
    if (normalizedParentId === folderId) {
      throw new Error('Cannot move folder into itself');
    }

    let cursor: string | null = normalizedParentId;
    while (cursor) {
      if (cursor === folderId) {
        throw new Error('Cannot move folder into its own descendant');
      }
      const parent = folderMap.get(cursor)?.parentId;
      const normalizedCursorParent = normalizeString(parent);
      cursor = normalizedCursorParent || null;
    }
  }

  private async ensureNotePermanentlyDeleted(noteId: string): Promise<void> {
    for (let attempt = 1; attempt <= DELETE_VERIFY_ATTEMPTS; attempt += 1) {
      const deleted = await this.findDeletedById(noteId);
      if (!deleted) {
        return;
      }
      if (attempt < DELETE_VERIFY_ATTEMPTS) {
        await wait(DELETE_VERIFY_WAIT_MS);
      }
    }
    throw new Error('Permanent delete API is unavailable for current SDK/backend version');
  }

  private async ensureNotesPermanentlyDeleted(noteIds: string[]): Promise<void> {
    const normalizedIds = Array.from(
      new Set(
        noteIds
          .map((id) => normalizeString(id))
          .filter((id) => Boolean(id)),
      ),
    );
    if (normalizedIds.length === 0) {
      return;
    }

    const remaining = new Set(normalizedIds);
    for (let attempt = 1; attempt <= DELETE_VERIFY_ATTEMPTS; attempt += 1) {
      const deletedNotes = await this.listDeletedNoteVOs();
      deletedNotes.forEach((item) => {
        const itemId = normalizeString(item.id) || normalizeString(item.uuid);
        if (!itemId) {
          return;
        }
        remaining.delete(itemId);
      });

      if (remaining.size === 0) {
        return;
      }

      if (attempt < DELETE_VERIFY_ATTEMPTS) {
        await wait(DELETE_VERIFY_WAIT_MS);
      }
    }

    throw new Error('Permanent delete API is unavailable for current SDK/backend version');
  }

  private async listNotesPage(params: QueryParams): Promise<PageNoteVO> {
    const response = await this.getClient().notes.listNotes(params);
    return unwrapApiData(response as ApiEnvelope<PageNoteVO>, 'Failed to list notes');
  }

  private async listDeletedNoteVOs(keyword?: string): Promise<NoteVO[]> {
    const found: NoteVO[] = [];
    const seenIds = new Set<string>();
    for (let pageNum = 1; pageNum <= MAX_SCAN_PAGES; pageNum += 1) {
      const page = await this.listNotesPage({
        pageNum,
        pageSize: MAX_LIST_PAGE_SIZE,
        sortField: 'updatedAt',
        sortOrder: 'desc',
        includeDeleted: true,
        includeArchived: false,
        favoriteOnly: false,
        ...(keyword ? { keyword } : {}),
      });
      const content = Array.isArray(page.content) ? page.content : [];
      content.forEach((item) => {
        if (!isDeletedStatus(item.status)) {
          return;
        }
        const id = normalizeString(item.id) || normalizeString(item.uuid);
        if (!id || seenIds.has(id)) {
          return;
        }
        seenIds.add(id);
        found.push(item);
      });
      if (page.last || content.length === 0) {
        break;
      }
    }
    found.sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));
    return found;
  }

  private async findDeletedById(id: string): Promise<NoteVO | null> {
    const normalizedId = normalizeString(id);
    if (!normalizedId) {
      return null;
    }
    for (let pageNum = 1; pageNum <= MAX_SCAN_PAGES; pageNum += 1) {
      const page = await this.listNotesPage({
        pageNum,
        pageSize: MAX_LIST_PAGE_SIZE,
        sortField: 'updatedAt',
        sortOrder: 'desc',
        includeDeleted: true,
        includeArchived: true,
      });
      const content = Array.isArray(page.content) ? page.content : [];
      const matched = content.find((item) => {
        const itemId = normalizeString(item.id) || normalizeString(item.uuid);
        return itemId === normalizedId && isDeletedStatus(item.status);
      });
      if (matched) {
        return matched;
      }
      if (page.last || content.length === 0) {
        break;
      }
    }
    return null;
  }

  private async loadSummaryById(id: string, allowDeleted = false): Promise<NoteSummary> {
    const detailResult = await this.findById(id);
    if (detailResult.success && detailResult.data) {
      return toNoteSummaryFromNote(detailResult.data);
    }
    if (allowDeleted) {
      const deleted = await this.findDeletedById(id);
      if (deleted) {
        return mapNoteSummary(deleted);
      }
    }
    throw new Error('Note not found');
  }

  private async toggleFavorite(id: string, enabled: boolean): Promise<void> {
    if (enabled) {
      const response = await this.getClient().notes.favoriteNote(id);
      ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to favorite note');
      return;
    }
    const response = await this.getClient().notes.unfavoriteNote(id);
    ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to unfavorite note');
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    try {
      const page = await this.listNotesPage(buildListParams(pageRequest, { includeDeleted: false }));
      const mapped = (page.content || [])
        .filter((item) => !isDeletedStatus(item.status))
        .map((item) => mapNoteSummary(item));
      return Result.success(mergePage(page, mapped, pageRequest));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query notes'));
    }
  }

  async findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    try {
      const deleted = await this.listDeletedNoteVOs(normalizeString(pageRequest?.keyword) || undefined);
      const mapped = deleted.map((item) => mapNoteSummary(item));
      return Result.success(toPage(mapped, pageRequest));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query trashed notes'));
    }
  }

  async findById(id: string): Promise<ServiceResult<Note | null>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }

    try {
      const detailResponse = await this.getClient().notes.getNoteDetail(noteId);
      if (!isApiSuccess(detailResponse as ApiEnvelope<NoteVO>)) {
        const message = normalizeString((detailResponse as ApiEnvelope<NoteVO>)?.msg);
        if (isNotFoundMessage(message)) {
          return Result.success(null);
        }
        return Result.error(message || 'Failed to load note detail');
      }

      const detailData = (detailResponse as ApiEnvelope<NoteVO>).data;
      if (!detailData) {
        return Result.success(null);
      }

      let text = normalizeString(detailData.content);
      try {
        const contentResponse = await this.getClient().notes.getNoteContent(noteId);
        if (isApiSuccess(contentResponse as ApiEnvelope<{ text?: string }>) && (contentResponse as ApiEnvelope<{ text?: string }>).data) {
          const remoteText = normalizeString((contentResponse as ApiEnvelope<{ text?: string }>).data?.text);
          if (remoteText) {
            text = remoteText;
          }
        }
      } catch {
        // Keep detail snapshot content when content API fails.
      }

      return Result.success(mapNote(detailData, text));
    } catch (error: unknown) {
      const message = toErrorMessage(error, 'Failed to load note');
      if (isNotFoundMessage(message)) {
        return Result.success(null);
      }
      return Result.error(message);
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return Boolean(result.success && result.data);
  }

  async save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>> {
    try {
      const noteId = normalizeString(entity.id);
      if (!noteId) {
        const body: NoteCreateRequest = {
          title: normalizeString(entity.title) || FALLBACK_NOTE_TITLE,
          content: entity.content ?? '',
          folderId: normalizeString(entity.parentId) || undefined,
          tags: withSystemTypeTag(
            normalizeTags(entity.tags),
            normalizeNoteType(entity.type, 'doc'),
          ),
        };
        const createResponse = await this.getClient().notes.createNote(body);
        const operation = unwrapApiData(createResponse as ApiEnvelope<{ noteId?: number | string }>, 'Failed to create note');
        const createdId = normalizeString(operation.noteId);
        if (!createdId) {
          return Result.error('Create note succeeded but noteId is missing');
        }
        if (entity.isFavorite) {
          await this.toggleFavorite(createdId, true);
        }
        const summary = await this.loadSummaryById(createdId, false);
        return Result.success(summary);
      }

      const updatePayload: NoteUpdateRequest = {};
      let hasMetadataUpdate = false;
      if (entity.title !== undefined) {
        updatePayload.title = normalizeString(entity.title) || FALLBACK_NOTE_TITLE;
        hasMetadataUpdate = true;
      }
      if (entity.tags !== undefined) {
        updatePayload.tags = withSystemTypeTag(
          normalizeTags(entity.tags),
          normalizeNoteType(entity.type, 'doc'),
        );
        hasMetadataUpdate = true;
      }
      if (hasMetadataUpdate) {
        const updateResponse = await this.getClient().notes.updateNote(noteId, updatePayload);
        ensureApiSuccess(updateResponse as ApiEnvelope<unknown>, 'Failed to update note');
      }

      if (entity.content !== undefined) {
        const contentPayload: NoteContentUpdateRequest = {
          text: entity.content ?? '',
          bumpVersion: true,
        };
        const contentResponse = await this.getClient().notes.updateNoteContent(noteId, contentPayload);
        ensureApiSuccess(contentResponse as ApiEnvelope<unknown>, 'Failed to update note content');
      }

      if (entity.parentId !== undefined) {
        const moveResponse = await this.getClient().notes.moveNote(noteId, {
          folderId: normalizeString(entity.parentId) || undefined,
        });
        ensureApiSuccess(moveResponse as ApiEnvelope<unknown>, 'Failed to move note');
      }

      if (entity.isFavorite !== undefined) {
        await this.toggleFavorite(noteId, Boolean(entity.isFavorite));
      }

      if (entity.deletedAt !== undefined) {
        if (entity.deletedAt) {
          const deleteResponse = await this.getClient().notes.deleteNote(noteId);
          ensureApiSuccess(deleteResponse as ApiEnvelope<unknown>, 'Failed to move note to trash');
        } else {
          const restoreResponse = await this.getClient().notes.restoreNote(noteId);
          ensureApiSuccess(restoreResponse as ApiEnvelope<unknown>, 'Failed to restore note');
        }
      }

      const summary = await this.loadSummaryById(noteId, Boolean(entity.deletedAt));
      return Result.success(summary);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to save note'));
    }
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      const deletedByDedicatedMethod = await this.tryInvokeNotesMethod(
        ['deleteNotePermanent', 'deleteNotePermanently', 'deletePermanentNote', 'permanentDeleteNote'],
        [noteId],
        'Failed to permanently delete note',
      );
      if (!deletedByDedicatedMethod) {
        const deletedByBatch = await this.tryBatchDeleteNotes([noteId]);
        if (!deletedByBatch) {
          const response = await this.getClient().notes.deleteNote(noteId);
          ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to permanently delete note');
        }
      }
      await this.ensureNotePermanentlyDeleted(noteId);
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to permanently delete note'));
    }
  }

  async moveToTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      const response = await this.getClient().notes.deleteNote(noteId);
      ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to move note to trash');
      const summary = await this.loadSummaryById(noteId, true);
      return Result.success(summary);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to move note to trash'));
    }
  }

  async restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    const noteId = normalizeString(id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      const response = await this.getClient().notes.restoreNote(noteId);
      ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to restore note');
      const summary = await this.loadSummaryById(noteId, false);
      return Result.success(summary);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to restore note'));
    }
  }

  async clearTrash(): Promise<ServiceResult<number>> {
    try {
      const deleted = await this.listDeletedNoteVOs();
      if (deleted.length === 0) {
        return Result.success(0);
      }
      const deletedIds = deleted
        .map((item) => normalizeString(item.id) || normalizeString(item.uuid))
        .filter((itemId) => Boolean(itemId));

      const clearedByDedicatedMethod = await this.tryInvokeNotesMethod(
        ['clearTrash', 'clearDeletedNotes', 'purgeTrash', 'emptyTrash'],
        [],
        'Failed to clear trash',
      );
      if (!clearedByDedicatedMethod) {
        const clearedByBatch = await this.tryBatchDeleteNotes(deletedIds);
        if (!clearedByBatch) {
          for (const itemId of deletedIds) {
            const result = await this.deleteById(itemId);
            if (!result.success) {
              return Result.error(result.message || 'Failed to clear trash');
            }
          }
        }
      }
      await this.ensureNotesPermanentlyDeleted(deletedIds);
      return Result.success(deletedIds.length);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to clear trash'));
    }
  }

  async getFolders(): Promise<ServiceResult<NoteFolder[]>> {
    try {
      const response = await this.getClient().notes.listFolders();
      const folders = unwrapApiData(response as ApiEnvelope<NoteFolderVO[]>, 'Failed to query folders');
      return Result.success(flattenFolders(folders));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query folders'));
    }
  }

  async createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>> {
    try {
      const response = await this.getClient().notes.createFolder({
        name: normalizeString(name) || FALLBACK_FOLDER_NAME,
        parentId: normalizeString(parentId) || undefined,
      });
      const folder = unwrapApiData(response as ApiEnvelope<NoteFolderVO>, 'Failed to create folder');
      return Result.success(mapFolder(folder));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to create folder'));
    }
  }

  async deleteFolder(id: string): Promise<ServiceResult<void>> {
    const folderId = normalizeString(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }
    try {
      const response = await this.getClient().notes.deleteFolder(folderId);
      ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to delete folder');
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete folder'));
    }
  }

  async renameFolder(id: string, newName: string): Promise<ServiceResult<string>> {
    const folderId = normalizeString(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }
    try {
      const response = await this.getClient().notes.updateFolder(folderId, {
        name: normalizeString(newName) || FALLBACK_FOLDER_NAME,
      });
      const folder = unwrapApiData(response as ApiEnvelope<NoteFolderVO>, 'Failed to rename folder');
      const resolvedId = normalizeString(folder.id) || folderId;
      return Result.success(resolvedId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to rename folder'));
    }
  }

  async moveFolder(id: string, newParentId: string | null): Promise<ServiceResult<void>> {
    const folderId = normalizeString(id);
    if (!folderId) {
      return Result.error('Folder id is required');
    }

    try {
      const normalizedParentId = normalizeString(newParentId) || null;
      await this.assertValidFolderMove(folderId, normalizedParentId);

      const currentParentId = await this.resolveFolderParentId(folderId);
      if (currentParentId === undefined) {
        return Result.error('Folder not found');
      }
      if ((normalizeString(currentParentId) || null) === normalizedParentId) {
        return Result.success(undefined);
      }

      let dedicatedMoveError: unknown = null;
      let movedByDedicatedMethod = false;
      try {
        movedByDedicatedMethod = await this.tryInvokeNotesMethod(
          ['moveFolder', 'moveNoteFolder', 'relocateFolder', 'updateFolderParent'],
          [folderId, { parentId: normalizedParentId || undefined }],
          'Failed to move folder',
        );
      } catch (error: unknown) {
        dedicatedMoveError = error;
      }

      const movedByHttp = movedByDedicatedMethod
        ? true
        : await this.tryMoveFolderByRawHttp(folderId, normalizedParentId);

      const updatedParentId = await this.resolveFolderParentId(folderId);
      let resolvedParentId = updatedParentId;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (resolvedParentId === undefined) {
          break;
        }
        if ((normalizeString(resolvedParentId) || null) === normalizedParentId) {
          return Result.success(undefined);
        }
        await wait(150);
        resolvedParentId = await this.resolveFolderParentId(folderId);
      }
      if (resolvedParentId === undefined) {
        return Result.error('Folder not found after move');
      }
      if ((normalizeString(resolvedParentId) || null) === normalizedParentId) {
        return Result.success(undefined);
      }

      if (!movedByHttp) {
        if (dedicatedMoveError) {
          throw dedicatedMoveError;
        }
        return Result.error('Folder move API is unavailable for current SDK/backend version');
      }
      return Result.error('Folder move request succeeded but folder parent did not change');
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to move folder'));
    }
  }

  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
    const noteId = normalizeString(note.id);
    if (!noteId) {
      return Result.error('Note id is required');
    }
    try {
      const response = await this.getClient().notes.moveNote(noteId, {
        folderId: normalizeString(newParentId) || undefined,
      });
      ensureApiSuccess(response as ApiEnvelope<unknown>, 'Failed to move note');
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to move note'));
    }
  }

  async delete(entity: NoteSummary): Promise<ServiceResult<void>> {
    return this.deleteById(entity.id);
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
      found.push(toNoteSummaryFromNote(result.data));
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
