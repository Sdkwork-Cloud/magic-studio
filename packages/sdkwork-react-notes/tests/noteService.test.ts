import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetClient = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  getAppSdkClientWithSession: mockGetClient,
}));

describe('noteService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('restores a note through the generated sdk restore method', async () => {
    const restore = vi.fn(async () => ({
      code: '200',
      data: { success: true, noteId: 12 },
    }));
    const getNoteDetail = vi.fn(async () => ({
      code: '200',
      data: {
        id: 12,
        uuid: 'note-12',
        title: 'Recovered',
        content: 'hello',
        status: 'ACTIVE',
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T01:00:00Z',
        tags: [],
      },
    }));
    const getNoteContent = vi.fn(async () => ({
      code: '200',
      data: { text: 'hello' },
    }));

    mockGetClient.mockReturnValue({
      notes: { restore, getNoteDetail, getNoteContent },
    });

    const { noteService } = await import('../src/services/noteService');
    const result = await noteService.restoreFromTrash('12');

    expect(restore).toHaveBeenCalledWith('12');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('12');
  });

  it('moves a note through the generated sdk move method', async () => {
    const move = vi.fn(async () => ({
      code: '200',
      data: { success: true, noteId: 22 },
    }));

    mockGetClient.mockReturnValue({
      notes: { move },
    });

    const { noteService } = await import('../src/services/noteService');
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

    expect(move).toHaveBeenCalledWith('22', { folderId: 'folder-1' });
    expect(result.success).toBe(true);
  });
});
