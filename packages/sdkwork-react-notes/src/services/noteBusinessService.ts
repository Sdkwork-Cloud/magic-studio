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
  moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>>;
}

export interface NoteBusinessAdapter {
  queryWorkspaceSnapshot?(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
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
  moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>>;
}

const DEFAULT_PAGE_REQUEST: PageRequest = {
  page: 0,
  size: 2000
};

const toWorkspaceSnapshot = async (
  adapter: NoteBusinessAdapter,
  pageRequest: PageRequest = DEFAULT_PAGE_REQUEST
): Promise<ServiceResult<NoteWorkspaceSnapshot>> => {
  const [notesResult, trashedResult, foldersResult] = await Promise.all([
    adapter.findAll(pageRequest),
    adapter.findTrashed(pageRequest),
    adapter.getFolders()
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

export class LocalNoteBusinessAdapter implements NoteBusinessAdapter {
  async queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>> {
    return toWorkspaceSnapshot(this, pageRequest || DEFAULT_PAGE_REQUEST);
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

  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
    return noteService.moveNote(note, newParentId);
  }
}

let noteBusinessAdapter: NoteBusinessAdapter = new LocalNoteBusinessAdapter();

export const setNoteBusinessAdapter = (adapter: NoteBusinessAdapter): void => {
  noteBusinessAdapter = adapter;
};

export const getNoteBusinessAdapter = (): NoteBusinessAdapter => noteBusinessAdapter;

export const resetNoteBusinessAdapter = (): void => {
  noteBusinessAdapter = new LocalNoteBusinessAdapter();
};

class NoteBusinessService implements INoteBusinessService {
  async queryWorkspaceSnapshot(pageRequest: PageRequest = DEFAULT_PAGE_REQUEST): Promise<ServiceResult<NoteWorkspaceSnapshot>> {
    const adapter = getNoteBusinessAdapter();
    if (adapter.queryWorkspaceSnapshot) {
      return adapter.queryWorkspaceSnapshot(pageRequest);
    }
    return toWorkspaceSnapshot(adapter, pageRequest);
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    return getNoteBusinessAdapter().findAll(pageRequest);
  }

  async findTrashed(pageRequest?: PageRequest): Promise<ServiceResult<Page<NoteSummary>>> {
    return getNoteBusinessAdapter().findTrashed(pageRequest);
  }

  async getFolders(): Promise<ServiceResult<NoteFolder[]>> {
    return getNoteBusinessAdapter().getFolders();
  }

  async findById(id: string): Promise<ServiceResult<Note | null>> {
    return getNoteBusinessAdapter().findById(id);
  }

  async save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>> {
    return getNoteBusinessAdapter().save(entity);
  }

  async createFolder(name: string, parentId: string | null): Promise<ServiceResult<NoteFolder>> {
    return getNoteBusinessAdapter().createFolder(name, parentId);
  }

  async renameFolder(id: string, newName: string): Promise<ServiceResult<string>> {
    return getNoteBusinessAdapter().renameFolder(id, newName);
  }

  async moveToTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    return getNoteBusinessAdapter().moveToTrash(id);
  }

  async restoreFromTrash(id: string): Promise<ServiceResult<NoteSummary>> {
    return getNoteBusinessAdapter().restoreFromTrash(id);
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    return getNoteBusinessAdapter().deleteById(id);
  }

  async clearTrash(): Promise<ServiceResult<number>> {
    return getNoteBusinessAdapter().clearTrash();
  }

  async deleteFolder(id: string): Promise<ServiceResult<void>> {
    return getNoteBusinessAdapter().deleteFolder(id);
  }

  async moveNote(note: NoteSummary, newParentId: string | null): Promise<ServiceResult<void>> {
    return getNoteBusinessAdapter().moveNote(note, newParentId);
  }
}

export const noteBusinessService: INoteBusinessService = new NoteBusinessService();
