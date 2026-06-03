import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NoteService } from '../src/services/noteService';

type NoteServerClient = NonNullable<
  NonNullable<ConstructorParameters<typeof NoteService>[0]>['serverClient']
>;

const createNoteService = (serverClient: Partial<NoteServerClient>): NoteService =>
  new NoteService({ serverClient: serverClient as NoteServerClient });

describe('noteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates an immutable uuid instead of deriving it from persisted id when backend uuid is absent', async () => {
    const listNotes = vi.fn(async () => ({
      items: [
        {
          id: 99,
          title: 'Uuid Missing',
          content: 'body',
          status: 'ACTIVE',
          createdAt: '2026-03-15T00:00:00Z',
          updatedAt: '2026-03-15T01:00:00Z',
          tags: [],
        },
      ],
      meta: {
        page: 1,
        pageSize: 50,
        total: 1,
      },
    }));

    const noteService = createNoteService({ listNotes });
    const result = await noteService.findAll({ page: 0, size: 50 });

    expect(result.success).toBe(true);
    expect(result.data?.content).toHaveLength(1);
    expect(result.data?.content[0].id).toBe('99');
    expect(result.data?.content[0].uuid).toBeTruthy();
    expect(result.data?.content[0].uuid).not.toBe('99');
  });

  it('keeps note id empty when backend only provides uuid', async () => {
    const listNotes = vi.fn(async () => ({
      items: [
        {
          uuid: 'note-uuid-only',
          title: 'Uuid Only',
          content: 'body',
          status: 'ACTIVE',
          createdAt: '2026-03-15T00:00:00Z',
          updatedAt: '2026-03-15T01:00:00Z',
          tags: [],
        },
      ],
      meta: {
        page: 1,
        pageSize: 50,
        total: 1,
      },
    }));

    const noteService = createNoteService({ listNotes });
    const result = await noteService.findAll({ page: 0, size: 50 });

    expect(result.success).toBe(true);
    expect(result.data?.content[0].id).toBeNull();
    expect(result.data?.content[0].uuid).toBe('note-uuid-only');
  });

  it('keeps folder id empty when backend only provides uuid', async () => {
    const readNotesWorkspaceSnapshot = vi.fn(async () => ({
      data: {
        notes: [],
        trashedNotes: [],
        folders: [
          {
            uuid: 'folder-uuid-only',
            name: 'Uuid Folder',
            createdAt: '2026-03-15T00:00:00Z',
            updatedAt: '2026-03-15T01:00:00Z',
          },
        ],
      },
    }));

    const noteService = createNoteService({ readNotesWorkspaceSnapshot });
    const result = await noteService.getFolders();

    expect(result.success).toBe(true);
    expect(result.data?.[0]?.id).toBeNull();
    expect(result.data?.[0]?.uuid).toBe('folder-uuid-only');
  });

  it('restores a note through the canonical server restore method', async () => {
    const restoreNote = vi.fn(async () => ({
      data: {
        id: 12,
        uuid: 'note-12',
        title: 'Recovered',
        content: 'hello',
        type: 'doc',
        parentId: null,
        tags: [],
        isFavorite: false,
        snippet: 'hello',
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T01:00:00Z',
      },
    }));

    const noteService = createNoteService({ restoreNote });
    const result = await noteService.restoreFromTrash('12');

    expect(restoreNote).toHaveBeenCalledWith('12');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('12');
  });

  it('moves a note through the canonical server move method', async () => {
    const moveNote = vi.fn(async () => ({
      data: { success: true, noteId: 22 },
    }));

    const noteService = createNoteService({ moveNote });
    const result = await noteService.moveNote({
      id: '22',
      uuid: 'note-22',
      title: 'A',
      type: 'doc',
      parentId: null,
      tags: [],
      isFavorite: false,
      snippet: '',
      publishStatus: 'draft',
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    }, 'folder-1');

    expect(moveNote).toHaveBeenCalledWith('22', { targetFolderId: 'folder-1' });
    expect(result.success).toBe(true);
  });
});
