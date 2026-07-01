import {
  Result,
  type ServiceResult
} from '@sdkwork/magic-studio-types/service';
import type { Note, NoteFolder, NoteSummary } from '@sdkwork/magic-studio-types/notes';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import { noteService } from './noteService';

export interface NoteWorkspaceSnapshot {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
}

export interface INoteBusinessService {
  queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>>;
  findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>>;
  getFolders(): Promise<ServiceResult<NoteFolder[]>>;
  findById(id: string): Promise<ServiceResult<Note | null>>;
  save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>>;
  createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>>;
  renameFolder(id: string, newName: string): Promise<ServiceResult<string>>;
  moveToTrash(id: string): Promise<ServiceResult<NoteSummary>>;
  restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clearTrash(): Promise<ServiceResult<number>>;
  deleteFolder(id: string): Promise<ServiceResult<void>>;
  moveFolder(id: string, newParentId: string | null): Promise<ServiceResult<void>>;
  moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>>;
}

const DEFAULT_PAGE_REQUEST: PageRequest = {
  page: 0,
  size: 2000
};

const normalizeKeyword = (value: unknown): string => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
);

const paginateSummaries = (
  items: NoteSummary[],
  pageRequest: PageRequest = DEFAULT_PAGE_REQUEST,
): NoteSummary[] => {
  const keyword = normalizeKeyword(pageRequest.keyword);
  const filtered = keyword
    ? items.filter((item) => {
      const title = item.title.toLowerCase();
      const snippet = item.snippet.toLowerCase();
      return title.includes(keyword) || snippet.includes(keyword);
    })
    : items;
  const page = Math.max(0, pageRequest.page ?? 0);
  const size = Math.max(1, pageRequest.size ?? DEFAULT_PAGE_REQUEST.size);
  const start = page * size;
  return filtered.slice(start, start + size);
};

const toWorkspaceSnapshot = async (pageRequest: PageRequest = DEFAULT_PAGE_REQUEST): Promise<ServiceResult<NoteWorkspaceSnapshot>> => {
  const snapshotResult = await noteService.readWorkspaceSnapshot();

  if (!snapshotResult.success || !snapshotResult.data) {
    return Result.error(snapshotResult.message || 'Failed to query note workspace snapshot');
  }

  return Result.success({
    notes: paginateSummaries(snapshotResult.data.notes, pageRequest),
    trashedNotes: paginateSummaries(snapshotResult.data.trashedNotes, pageRequest),
    folders: snapshotResult.data.folders
  });
};

class NoteBusinessService implements INoteBusinessService {
  async queryWorkspaceSnapshot(pageRequest: PageRequest = DEFAULT_PAGE_REQUEST): Promise<ServiceResult<NoteWorkspaceSnapshot>> {
    return toWorkspaceSnapshot(pageRequest);
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    return noteService.findAll(pageRequest);
  }

  async findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    return noteService.findTrashed(pageRequest);
  }

  async getFolders(): Promise<ServiceResult<NoteFolder[]>> {
    return noteService.getFolders();
  }

  async findById(id: string): Promise<ServiceResult<Note | null>> {
    return noteService.findById(id);
  }

  async save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>> {
    return noteService.save(entity);
  }

  async createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>> {
    return noteService.createFolder(name, parentId);
  }

  async renameFolder(id: string, newName: string): Promise<ServiceResult<string>> {
    return noteService.renameFolder(id, newName);
  }

  async moveToTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    return noteService.moveToTrash(id);
  }

  async restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    return noteService.restoreFromTrash(id);
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    return noteService.deleteById(id);
  }

  async clearTrash(): Promise<ServiceResult<number>> {
    return noteService.clearTrash();
  }

  async deleteFolder(id: string): Promise<ServiceResult<void>> {
    return noteService.deleteFolder(id);
  }

  async moveFolder(id: string, newParentId: string | null): Promise<ServiceResult<void>> {
    return noteService.moveFolder(id, newParentId);
  }

  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
    return noteService.moveNote(note, newParentId);
  }
}

const localNoteBusinessService: INoteBusinessService = new NoteBusinessService();
const controller = createServiceAdapterController<INoteBusinessService>(localNoteBusinessService);

export const noteBusinessService: INoteBusinessService = controller.service;
export const setNoteBusinessAdapter = (adapter: INoteBusinessService): void => {
  controller.setAdapter(adapter);
};

export const getNoteBusinessAdapter = (): INoteBusinessService => {
  return controller.getAdapter();
};

export const resetNoteBusinessAdapter = (): void => {
  controller.resetAdapter();
};

