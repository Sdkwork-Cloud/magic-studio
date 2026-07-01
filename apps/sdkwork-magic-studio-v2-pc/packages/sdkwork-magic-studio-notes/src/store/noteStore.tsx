
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import type { Note, NoteSummary, NoteFolder, TreeItem } from '@sdkwork/magic-studio-types/notes';
import { noteBusinessService } from '../services';
import {
  excludeNoteEntitiesByKey,
  findNoteEntityByKey,
  hasNoteEntityKeyInSet,
  mapNoteEntitiesByKey,
  matchesNoteEntityKey,
  reconcileNoteEntityKeySet,
  resolveNoteEntityKey,
  resolveNotePersistedIdByKey
} from '../utils/noteIdentity';

interface NoteStoreContextType {
  notes: NoteSummary[]; 
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
  activeNoteId: string | null;
  activeNote: Note | null; // Full content
  operationError: string | null;
  isLoading: boolean;
  treeData: TreeItem[];
  recentNotes: NoteSummary[];
  favoriteNotes: NoteSummary[];
  
  setActiveNoteId: (id: string | null) => void;
  createNote: (title: string, type?: Note['type'], parentId?: string | null) => Promise<string>;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteItem: (id: string, kind: 'note' | 'folder') => Promise<boolean>;
  restoreFromTrash: (id: string) => Promise<boolean>;
  deletePermanently: (id: string) => Promise<boolean>;
  clearTrash: () => Promise<boolean>;
  toggleFavorite: (id: string) => void;
  
  moveItem: (itemId: string, itemKind: 'note' | 'folder', newParentId: string | null) => Promise<boolean>;
  toggleFolderExpand: (folderId: string) => void;
  renameFolder: (id: string, newName: string) => Promise<string>;
  expandedFolders: Set<string>;
  clearOperationError: () => void;
  refresh: () => Promise<void>;
}

const NoteStoreContext = createContext<NoteStoreContextType | undefined>(undefined);
const NOTE_SAVE_DEBOUNCE_MS = 500;

export const NoteStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Lists only store summaries to save memory
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [trashedNotes, setTrashedNotes] = useState<NoteSummary[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  
  const [activeNoteId, setActiveNoteIdState] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const activeNoteIdRef = useRef<string | null>(null);
  const pendingSavePayloadRef = useRef<Map<string, Partial<Note>>>(new Map());
  const pendingSaveTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const getKnownNotes = (): Array<Pick<Note, 'id' | 'uuid'> | Pick<NoteSummary, 'id' | 'uuid'>> => {
    const known: Array<Pick<Note, 'id' | 'uuid'> | Pick<NoteSummary, 'id' | 'uuid'>> = [];
    if (activeNote) {
      known.push(activeNote);
    }
    known.push(...notes);
    known.push(...trashedNotes);
    return known;
  };

  const resolveActiveNoteEntity = (): (Pick<Note, 'id' | 'uuid'> | Pick<NoteSummary, 'id' | 'uuid'>) | null => {
    if (activeNote) {
      return activeNote;
    }
    return findNoteEntityByKey(getKnownNotes(), activeNoteIdRef.current) || null;
  };

  const isActiveNoteKey = (key: string | null): boolean => {
    const activeEntity = resolveActiveNoteEntity();
    if (activeEntity) {
      return matchesNoteEntityKey(activeEntity, key);
    }
    return Boolean(activeNoteIdRef.current && activeNoteIdRef.current === key);
  };

  const resolveNotePersistedId = (key: string | null): string | null => {
    return resolveNotePersistedIdByKey(getKnownNotes(), key);
  };

  const resolveFolderEntity = (key: string | null): NoteFolder | undefined =>
    findNoteEntityByKey(folders, key);

  const resolveFolderKey = (key: string | null): string | null => {
    if (!key) {
      return null;
    }
    const folder = resolveFolderEntity(key);
    return folder ? resolveNoteEntityKey(folder) : key;
  };

  const resolveFolderPersistedId = (key: string | null): string | null =>
    resolveNotePersistedIdByKey(folders, key);

  const flushPendingSave = useCallback(async (noteId: string): Promise<void> => {
    const timer = pendingSaveTimerRef.current.get(noteId);
    if (timer) {
      clearTimeout(timer);
      pendingSaveTimerRef.current.delete(noteId);
    }

    const payload = pendingSavePayloadRef.current.get(noteId);
    if (!payload) {
      return;
    }
    pendingSavePayloadRef.current.delete(noteId);

    try {
      const result = await noteBusinessService.save({ id: noteId, ...payload });
      if (!result.success || !result.data) {
        return;
      }
      const persisted = result.data;
      setNotes((prev) => {
        const without = excludeNoteEntitiesByKey(prev, noteId);
        if (persisted.deletedAt) {
          return without;
        }
        return [{ ...persisted }, ...without];
      });
      setTrashedNotes((prev) => {
        const without = excludeNoteEntitiesByKey(prev, noteId);
        if (!persisted.deletedAt) {
          return without;
        }
        return [{ ...persisted }, ...without];
      });
      setActiveNote((prev) =>
        prev && matchesNoteEntityKey(prev, noteId)
          ? {
              ...prev,
              ...payload,
              updatedAt: persisted.updatedAt
            }
          : prev
      );
    } catch (error) {
      console.error('[NoteStore] Failed to persist note update', error);
    }
  }, []);

  const pushOperationError = useCallback((message: string) => {
    const normalized = message.trim();
    if (!normalized) {
      return;
    }
    setOperationError(normalized);
  }, []);

  const clearOperationError = useCallback(() => {
    setOperationError(null);
  }, []);

  const flushAllPendingSaves = useCallback(async (): Promise<void> => {
    const ids = new Set<string>([
      ...pendingSavePayloadRef.current.keys(),
      ...pendingSaveTimerRef.current.keys()
    ]);
    for (const id of ids) {
      await flushPendingSave(id);
    }
  }, [flushPendingSave]);

  const scheduleNoteSave = useCallback((noteId: string, updates: Partial<Note>) => {
    const previous = pendingSavePayloadRef.current.get(noteId) || {};
    pendingSavePayloadRef.current.set(noteId, { ...previous, ...updates });

    const oldTimer = pendingSaveTimerRef.current.get(noteId);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }

    const timer = setTimeout(() => {
      void flushPendingSave(noteId);
    }, NOTE_SAVE_DEBOUNCE_MS);
    pendingSaveTimerRef.current.set(noteId, timer);
  }, [flushPendingSave]);

  const loadList = useCallback(async () => {
    await flushAllPendingSaves();
    setIsLoading(true);
    try {
        const snapshotResult = await noteBusinessService.queryWorkspaceSnapshot({ page: 0, size: 2000 });
        if (!snapshotResult.success || !snapshotResult.data) {
            pushOperationError(snapshotResult.message || 'Failed to load notes');
            return;
        }
        const nextNotes = snapshotResult.data.notes;
        const nextTrashedNotes = snapshotResult.data.trashedNotes;
        const nextFolders = snapshotResult.data.folders;

        setNotes(nextNotes);
        setTrashedNotes(nextTrashedNotes);
        setFolders(nextFolders);
        setExpandedFolders((prev) => reconcileNoteEntityKeySet(nextFolders, prev));

        const currentActiveId = activeNoteIdRef.current;
        if (currentActiveId && !nextNotes.some((note) => matchesNoteEntityKey(note, currentActiveId))) {
            setActiveNoteIdState(null);
            setActiveNote(null);
        }
        clearOperationError();
    } catch (e) {
        console.error("Failed to load notes list", e);
        const message = e instanceof Error ? e.message : 'Failed to load notes';
        pushOperationError(message);
    } finally {
        setIsLoading(false);
    }
  }, [clearOperationError, flushAllPendingSaves, pushOperationError]);

  // Lazy Load Content
  useEffect(() => {
      const fetchContent = async () => {
          if (!activeNoteId) {
              setActiveNote(null);
              return;
          }
          // Don't reload if we already have it (unless we force refresh elsewhere)
          if (activeNote && matchesNoteEntityKey(activeNote, activeNoteId)) return;

          const persistedId = resolveNotePersistedId(activeNoteId);
          if (!persistedId) {
              setActiveNote(null);
              return;
          }

          const res = await noteBusinessService.findById(persistedId);
          if (res.success && res.data) {
              setActiveNote(res.data);
          }
      };
      fetchContent();
  }, [activeNoteId]);

  useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const flushNow = () => {
      void flushAllPendingSaves();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushNow();
      }
    };

    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushAllPendingSaves]);

  useEffect(() => {
    return () => {
      const ids = Array.from(
        new Set<string>([
          ...pendingSavePayloadRef.current.keys(),
          ...pendingSaveTimerRef.current.keys()
        ])
      );
      for (const id of ids) {
        void flushPendingSave(id);
      }
    };
  }, [flushPendingSave]);

  const setActiveNoteId = useCallback((id: string | null) => {
    const previousActiveEntity = resolveActiveNoteEntity();
    if (previousActiveEntity && !matchesNoteEntityKey(previousActiveEntity, id)) {
      const previousPersistedId = previousActiveEntity.id;
      if (previousPersistedId) {
        void flushPendingSave(previousPersistedId);
      }
    } else if (activeNoteId && activeNoteId !== id) {
      const previousPersistedId = resolveNotePersistedId(activeNoteId);
      if (previousPersistedId) {
        void flushPendingSave(previousPersistedId);
      }
    }
    setActiveNoteIdState(id);
  }, [activeNoteId, activeNote, notes, trashedNotes, flushPendingSave]);

  const createNote = async (title: string, type: Note['type'] = 'doc', parentId: string | null = null) => {
    const parentFolderKey = resolveFolderKey(parentId);
    const parentPersistedId = resolveFolderPersistedId(parentId);

    if (parentFolderKey) {
      setExpandedFolders(prev => new Set(prev).add(parentFolderKey));
    }

    const result = await noteBusinessService.save({
      title,
      type,
      parentId: parentPersistedId,
      content: '',
      tags: [],
      isFavorite: false
    });
    if (!result.success || !result.data) {
      pushOperationError(result.message || 'Failed to create note');
      return '';
    }
    clearOperationError();

    const createdSummary = result.data;
    const createdKey = resolveNoteEntityKey(createdSummary);
    const createdPersistedId = createdSummary.id;
    const detailResult = createdPersistedId
      ? await noteBusinessService.findById(createdPersistedId)
      : { success: false, data: null };
    const createdNote: Note = detailResult.success && detailResult.data
      ? detailResult.data
      : {
          ...createdSummary,
          content: '',
          type
        };

    setNotes(prev => [createdSummary, ...excludeNoteEntitiesByKey(prev, createdKey)]);
    setTrashedNotes(prev => excludeNoteEntitiesByKey(prev, createdKey));
    setActiveNoteId(createdKey);
    setActiveNote(createdNote);
    return createdKey;
  };

  const createFolder = async (name: string, parentId: string | null = null) => {
    const parentFolderKey = resolveFolderKey(parentId);
    const parentPersistedId = resolveFolderPersistedId(parentId);
    const res = await noteBusinessService.createFolder(name, parentPersistedId);
    if (parentFolderKey) setExpandedFolders(prev => new Set(prev).add(parentFolderKey));
    
    if (res.success) {
        clearOperationError();
        setFolders(prev => [...prev, res.data!]);
        return resolveNoteEntityKey(res.data!);
    }
    pushOperationError(res.message || 'Failed to create folder');
    return '';
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const { content: _ignoredContent, ...summaryUpdates } = updates;
    const persistedId = resolveNotePersistedId(id);

    // 1. Update Active Content if matching
    if (isActiveNoteKey(id)) {
        setActiveNote(prev => prev && matchesNoteEntityKey(prev, id)
          ? { ...prev, ...updates, updatedAt: Date.now() }
          : prev
        );
    }

    // 2. Update Summary List (if metadata changed)
    setNotes(prev => mapNoteEntitiesByKey(
      prev,
      id,
      (note) => ({ ...note, ...summaryUpdates, updatedAt: Date.now() })
    ));
    setTrashedNotes(prev => mapNoteEntitiesByKey(
      prev,
      id,
      (note) => ({ ...note, ...summaryUpdates, updatedAt: Date.now() })
    ));

    // 3. Persist (debounced per-note to prevent write storms while typing)
    if (persistedId) {
      scheduleNoteSave(persistedId, updates);
    }
  };

  const renameFolder = async (id: string, newName: string) => {
      const folder = resolveFolderEntity(id);
      const folderKey = folder ? resolveNoteEntityKey(folder) : id;
      const persistedId = resolveFolderPersistedId(id);
      if (!persistedId) {
          pushOperationError('Failed to resolve folder identity');
          return id;
      }
      const res = await noteBusinessService.renameFolder(persistedId, newName);
      if (res.success) {
          clearOperationError();
          await loadList();
          return folderKey;
      }
      pushOperationError(res.message || 'Failed to rename folder');
      return folderKey;
  };

  const deleteItem = async (id: string, kind: 'note' | 'folder'): Promise<boolean> => {
    if (kind === 'note') {
        const persistedId = resolveNotePersistedId(id);
        if (!persistedId) {
            pushOperationError('Failed to resolve note identity');
            return false;
        }
        await flushPendingSave(persistedId);
        const result = await noteBusinessService.moveToTrash(persistedId);
        if (!result.success || !result.data) {
            pushOperationError(result.message || 'Failed to move note to trash');
            return false;
        }
        clearOperationError();
        const moved = result.data;
        setNotes(prev => excludeNoteEntitiesByKey(prev, id));
        setTrashedNotes(prev => [moved, ...excludeNoteEntitiesByKey(prev, id)]);
        if (isActiveNoteKey(id)) {
            setActiveNoteIdState(null);
            setActiveNote(null);
        }
        return true;
    } else {
        const persistedId = resolveFolderPersistedId(id);
        if (!persistedId) {
            pushOperationError('Failed to resolve folder identity');
            return false;
        }
        const result = await noteBusinessService.deleteFolder(persistedId);
        if (!result.success) {
            pushOperationError(result.message || 'Failed to delete folder');
            return false;
        }
        clearOperationError();
        await loadList(); 
        return true;
    }
  };

  const restoreFromTrash = async (id: string): Promise<boolean> => {
    const persistedId = resolveNotePersistedId(id);
    if (!persistedId) {
      pushOperationError('Failed to resolve note identity');
      return false;
    }
    await flushPendingSave(persistedId);
    const result = await noteBusinessService.restoreFromTrash(persistedId);
    if (!result.success || !result.data) {
      pushOperationError(result.message || 'Failed to restore note');
      return false;
    }
    clearOperationError();
    const restored = result.data;
    setTrashedNotes((prev) => excludeNoteEntitiesByKey(prev, id));
    setNotes((prev) => [restored, ...excludeNoteEntitiesByKey(prev, id)]);
    return true;
  };

  const deletePermanently = async (id: string): Promise<boolean> => {
    const persistedId = resolveNotePersistedId(id);
    if (!persistedId) {
      pushOperationError('Failed to resolve note identity');
      return false;
    }
    await flushPendingSave(persistedId);
    const result = await noteBusinessService.deleteById(persistedId);
    if (!result.success) {
      pushOperationError(result.message || 'Failed to delete note permanently');
      return false;
    }
    clearOperationError();
    setTrashedNotes((prev) => excludeNoteEntitiesByKey(prev, id));
    setNotes((prev) => excludeNoteEntitiesByKey(prev, id));
    if (isActiveNoteKey(id)) {
      setActiveNoteIdState(null);
      setActiveNote(null);
    }
    return true;
  };

  const clearTrash = async (): Promise<boolean> => {
    await flushAllPendingSaves();
    const result = await noteBusinessService.clearTrash();
    if (!result.success) {
      pushOperationError(result.message || 'Failed to clear trash');
      return false;
    }
    clearOperationError();
    const activeTrashedNote = findNoteEntityByKey(trashedNotes, activeNoteId);
    setTrashedNotes([]);
    if (activeTrashedNote) {
      setActiveNoteIdState(null);
      setActiveNote(null);
    }
    return true;
  };

  const toggleFavorite = async (id: string) => {
    const note = findNoteEntityByKey(notes, id);
    if (note) {
      updateNote(id, { isFavorite: !note.isFavorite });
    }
  };

  const moveItem = async (itemId: string, itemKind: 'note' | 'folder', newParentId: string | null): Promise<boolean> => {
      if (itemId === newParentId) return false;
      let moved = false;
      const newParentPersistedId = resolveFolderPersistedId(newParentId);
      const newParentKey = resolveFolderKey(newParentId);

      if (itemKind === 'folder' && newParentId) {
          let cursor: string | null = newParentId;
          while (cursor) {
              if (matchesNoteEntityKey(resolveFolderEntity(itemId), cursor)) {
                  return false;
              }
              cursor = resolveFolderEntity(cursor)?.parentId || null;
          }
      }

      if (itemKind === 'note') {
          const persistedId = resolveNotePersistedId(itemId);
          if (!persistedId) {
              pushOperationError('Failed to resolve note identity');
              return false;
          }
          await flushPendingSave(persistedId);
          const note = findNoteEntityByKey(notes, itemId);
          if (note) {
              const previousParentId = note.parentId;
              setNotes(prev => mapNoteEntitiesByKey(
                prev,
                itemId,
                (currentNote) => ({ ...currentNote, parentId: newParentPersistedId })
              ));
              const moveResult = await noteBusinessService.moveNote(note, newParentPersistedId);
              if (!moveResult.success) {
                  setNotes(prev => mapNoteEntitiesByKey(
                    prev,
                    itemId,
                    (currentNote) => ({ ...currentNote, parentId: previousParentId })
                  ));
                  await loadList();
                  pushOperationError(moveResult.message || 'Failed to move note');
              } else {
                  clearOperationError();
                  moved = true;
              }
          }
      } else {
          const folderPersistedId = resolveFolderPersistedId(itemId);
          if (!folderPersistedId) {
              pushOperationError('Failed to resolve folder identity');
              return false;
          }
          const moveResult = await noteBusinessService.moveFolder(folderPersistedId, newParentPersistedId);
          if (!moveResult.success) {
              pushOperationError(moveResult.message || 'Failed to move folder');
          } else {
              clearOperationError();
              moved = true;
          }
          await loadList();
      }
      
      if (moved && newParentKey) {
          setExpandedFolders(prev => new Set(prev).add(newParentKey));
      }
      return moved;
  };

  const toggleFolderExpand = (folderId: string) => {
      const folderKey = resolveFolderKey(folderId) || folderId;
      setExpandedFolders(prev => {
          const next = new Set(prev);
          if (next.has(folderKey)) next.delete(folderKey);
          else next.add(folderKey);
          return next;
      });
  };

  // --- Recursive Tree Building ---
  const treeData = useMemo(() => {
      const buildTree = (parentId: string | null): TreeItem[] => {
          const childFolders = folders
              .filter(f => f.parentId === parentId)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(f => ({
                  ...f,
                  kind: 'folder' as const,
                  isExpanded: hasNoteEntityKeyInSet(f, expandedFolders),
                  children: buildTree(f.id)
              }));
          
          const childNotes = notes
              .filter(n => n.parentId === parentId)
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(n => ({
                  ...n,
                  kind: 'note' as const
              }));

          return [...childFolders, ...childNotes];
      };
      
      return buildTree(null);
  }, [notes, folders, expandedFolders]);

  const recentNotes = useMemo(() => {
      return [...notes]
          .sort((a, b) => {
              const aTime = typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt).getTime();
              const bTime = typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt).getTime();
              return bTime - aTime;
          })
          .slice(0, 5);
  }, [notes]);

  const favoriteNotes = useMemo(() => {
      return notes.filter(n => n.isFavorite);
  }, [notes]);

  return (
    <NoteStoreContext.Provider value={{
      notes, trashedNotes, folders, activeNoteId, activeNote, operationError, isLoading, treeData, expandedFolders,
      recentNotes, favoriteNotes,
      setActiveNoteId, createNote, createFolder, updateNote, deleteItem, restoreFromTrash, deletePermanently, clearTrash, toggleFavorite,
      moveItem, toggleFolderExpand, renameFolder, clearOperationError, refresh: loadList
    }}>
      {children}
    </NoteStoreContext.Provider>
  );
};

export const useNoteStore = () => {
  const context = useContext(NoteStoreContext);
  if (!context) throw new Error('useNoteStore must be used within a NoteStoreProvider');
  return context;
};
