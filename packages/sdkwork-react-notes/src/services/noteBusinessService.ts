import {
  Note,
  NoteFolder,
  NoteSummary,
  Page,
  PageRequest,
  Result,
  ServiceResult
} from '@sdkwork/react-commons';
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

const toWorkspaceSnapshot = async (pageRequest: PageRequest = DEFAULT_PAGE_REQUEST): Promise<ServiceResult<NoteWorkspaceSnapshot>> => {
  const [notesResult, trashedResult, foldersResult] = await Promise.all([
    noteService.findAll(pageRequest),
    noteService.findTrashed(pageRequest),
    noteService.getFolders()
  ]);

  if (!notesResult.success) {
    return Result.error(notesResult.message || 'Failed to query notes');
  }
  if (!trashedResult.success) {
    return Result.error(trashedResult.message || 'Failed to query trashed notes');
  }
  if (!foldersResult.success) {
    return Result.error(foldersResult.message || 'Failed to query folders');
  }

  return Result.success({
    notes: notesResult.data?.content || [],
    trashedNotes: trashedResult.data?.content || [],
    folders: foldersResult.data || []
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

export const noteBusinessService: INoteBusinessService = new NoteBusinessService();
