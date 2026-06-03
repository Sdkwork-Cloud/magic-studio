/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryWorkspaceSnapshot: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  moveToTrash: vi.fn(),
  restoreFromTrash: vi.fn(),
  deleteById: vi.fn(),
  clearTrash: vi.fn(),
  deleteFolder: vi.fn(),
  moveFolder: vi.fn(),
  moveNote: vi.fn(),
}));

vi.mock('../src/services', () => ({
  noteBusinessService: {
    queryWorkspaceSnapshot: mocks.queryWorkspaceSnapshot,
    findById: mocks.findById,
    save: mocks.save,
    createFolder: mocks.createFolder,
    renameFolder: mocks.renameFolder,
    moveToTrash: mocks.moveToTrash,
    restoreFromTrash: mocks.restoreFromTrash,
    deleteById: mocks.deleteById,
    clearTrash: mocks.clearTrash,
    deleteFolder: mocks.deleteFolder,
    moveFolder: mocks.moveFolder,
    moveNote: mocks.moveNote,
  },
}));

import { NoteStoreProvider, useNoteStore } from '../src/store/noteStore';

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: ReturnType<typeof useNoteStore>) => void;
}) => {
  const store = useNoteStore();
  onStore(store);
  return null;
};

const createSummary = () => ({
  id: 'note-db-1',
  uuid: 'note-uuid-1',
  title: 'Original Title',
  type: 'doc' as const,
  parentId: null,
  tags: [],
  isFavorite: false,
  snippet: '',
  publishStatus: 'draft' as const,
  createdAt: '2026-03-15T00:00:00Z',
  updatedAt: '2026-03-15T00:00:00Z',
});

const createDetail = () => ({
  ...createSummary(),
  content: '<p>Hello</p>',
});

const createFolder = (overrides: Partial<{ id: string; uuid: string; name: string; parentId: string | null }> = {}) => ({
  id: overrides.id ?? 'folder-db-1',
  uuid: overrides.uuid ?? 'folder-uuid-1',
  name: overrides.name ?? 'Workspace',
  parentId: overrides.parentId ?? null,
  createdAt: '2026-03-15T00:00:00Z',
  updatedAt: '2026-03-15T00:00:00Z',
});

describe('NoteStoreProvider identity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.queryWorkspaceSnapshot.mockReset();
    mocks.findById.mockReset();
    mocks.save.mockReset();
    mocks.createFolder.mockReset();
    mocks.renameFolder.mockReset();
    mocks.moveToTrash.mockReset();
    mocks.restoreFromTrash.mockReset();
    mocks.deleteById.mockReset();
    mocks.clearTrash.mockReset();
    mocks.deleteFolder.mockReset();
    mocks.moveFolder.mockReset();
    mocks.moveNote.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('loads note detail through persisted id when the active key is a uuid', async () => {
    const summary = createSummary();
    const detail = createDetail();

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [summary],
        trashedNotes: [],
        folders: [],
      },
    });
    mocks.findById.mockImplementation(async (id: string) => ({
      success: true,
      data: id === 'note-db-1' ? detail : null,
    }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useNoteStore> | null = null;

    await act(async () => {
      root.render(
        <NoteStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </NoteStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setActiveNoteId('note-uuid-1');
      await Promise.resolve();
    });

    expect(mocks.findById).toHaveBeenCalledWith('note-db-1');

    await act(async () => {
      root.unmount();
    });
  });

  it('updates and persists a note by persisted id when the caller supplies a uuid key', async () => {
    const summary = createSummary();
    const detail = createDetail();

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [summary],
        trashedNotes: [],
        folders: [],
      },
    });
    mocks.findById.mockResolvedValue({
      success: true,
      data: detail,
    });
    mocks.save.mockResolvedValue({
      success: true,
      data: {
        ...summary,
        title: 'Updated Title',
        updatedAt: '2026-03-15T02:00:00Z',
      },
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useNoteStore> | null = null;

    await act(async () => {
      root.render(
        <NoteStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </NoteStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.updateNote('note-uuid-1', { title: 'Updated Title' });
    });

    expect(latestStore?.notes[0]?.title).toBe('Updated Title');

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'note-db-1',
        title: 'Updated Title',
      })
    );

    await act(async () => {
      root.unmount();
    });
  });

  it('creates a note through a parent uuid but persists the parent id and returns the canonical note key', async () => {
    const parentFolder = createFolder();
    const createdSummary = {
      id: 'note-db-2',
      uuid: 'note-uuid-2',
      title: 'Child Note',
      type: 'doc' as const,
      parentId: parentFolder.id,
      tags: [],
      isFavorite: false,
      snippet: '',
      publishStatus: 'draft' as const,
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    };

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [parentFolder],
      },
    });
    mocks.save.mockResolvedValue({
      success: true,
      data: createdSummary,
    });
    mocks.findById.mockResolvedValue({
      success: true,
      data: {
        ...createdSummary,
        content: '<p>Child</p>',
      },
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useNoteStore> | null = null;

    await act(async () => {
      root.render(
        <NoteStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </NoteStoreProvider>
      );
      await Promise.resolve();
    });

    let createdKey = '';
    await act(async () => {
      createdKey = await latestStore!.createNote('Child Note', 'doc', 'folder-uuid-1');
      await Promise.resolve();
    });

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Child Note',
        parentId: 'folder-db-1',
      })
    );
    expect(createdKey).toBe('note-uuid-2');
    expect(latestStore?.activeNoteId).toBe('note-uuid-2');
    expect(latestStore?.expandedFolders.has('folder-uuid-1')).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  it('creates a folder through a parent uuid but persists the parent id and returns the canonical folder key', async () => {
    const parentFolder = createFolder();
    const childFolder = createFolder({
      id: 'folder-db-2',
      uuid: 'folder-uuid-2',
      name: 'Child Folder',
      parentId: parentFolder.id,
    });

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [parentFolder],
      },
    });
    mocks.createFolder.mockResolvedValue({
      success: true,
      data: childFolder,
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useNoteStore> | null = null;

    await act(async () => {
      root.render(
        <NoteStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </NoteStoreProvider>
      );
      await Promise.resolve();
    });

    let createdKey = '';
    await act(async () => {
      createdKey = await latestStore!.createFolder('Child Folder', 'folder-uuid-1');
      await Promise.resolve();
    });

    expect(mocks.createFolder).toHaveBeenCalledWith('Child Folder', 'folder-db-1');
    expect(createdKey).toBe('folder-uuid-2');
    expect(latestStore?.expandedFolders.has('folder-uuid-1')).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  it('treats uuid-based expanded folder keys as expanded tree state', async () => {
    const parentFolder = createFolder();

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [parentFolder],
      },
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useNoteStore> | null = null;

    await act(async () => {
      root.render(
        <NoteStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </NoteStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.toggleFolderExpand('folder-uuid-1');
      await Promise.resolve();
    });

    expect(latestStore?.expandedFolders.has('folder-uuid-1')).toBe(true);
    expect(latestStore?.treeData[0]).toMatchObject({
      id: 'folder-db-1',
      uuid: 'folder-uuid-1',
      kind: 'folder',
      isExpanded: true,
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('drops expanded folder keys that no longer exist after refresh', async () => {
    const parentFolder = createFolder();

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [parentFolder],
      },
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useNoteStore> | null = null;

    await act(async () => {
      root.render(
        <NoteStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </NoteStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.toggleFolderExpand('folder-uuid-1');
      await Promise.resolve();
    });

    expect(latestStore?.expandedFolders.has('folder-uuid-1')).toBe(true);

    mocks.queryWorkspaceSnapshot.mockResolvedValue({
      success: true,
      data: {
        notes: [],
        trashedNotes: [],
        folders: [],
      },
    });

    await act(async () => {
      await latestStore?.refresh();
      await Promise.resolve();
    });

    expect(latestStore?.expandedFolders.size).toBe(0);

    await act(async () => {
      root.unmount();
    });
  });
});
