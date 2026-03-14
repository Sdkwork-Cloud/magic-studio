
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { Note, NoteSummary, NoteFolder, TreeItem } from '@sdkwork/react-commons';
import { noteBusinessService } from '../services';

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
        const without = prev.filter((note) => note.id !== noteId);
        if (persisted.deletedAt) {
          return without;
        }
        return [{ ...persisted }, ...without];
      });
      setTrashedNotes((prev) => {
        const without = prev.filter((note) => note.id !== noteId);
        if (!persisted.deletedAt) {
          return without;
        }
        return [{ ...persisted }, ...without];
      });
      setActiveNote((prev) =>
        prev && prev.id === noteId
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

        const currentActiveId = activeNoteIdRef.current;
        if (currentActiveId && !nextNotes.some((note) => note.id === currentActiveId)) {
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
          if (activeNote?.id === activeNoteId) return;

          const res = await noteBusinessService.findById(activeNoteId);
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
    if (activeNoteId && activeNoteId !== id) {
      void flushPendingSave(activeNoteId);
    }
    setActiveNoteIdState(id);
  }, [activeNoteId, flushPendingSave]);

  const createNote = async (title: string, type: Note['type'] = 'doc', parentId: string | null = null) => {
    if (parentId) {
      setExpandedFolders(prev => new Set(prev).add(parentId));
    }

    const result = await noteBusinessService.save({
      title,
      type,
      parentId,
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
    const detailResult = await noteBusinessService.findById(createdSummary.id);
    const createdNote: Note = detailResult.success && detailResult.data
      ? detailResult.data
      : {
          ...createdSummary,
          content: '',
          type
        };

    setNotes(prev => [createdSummary, ...prev.filter(note => note.id !== createdSummary.id)]);
    setTrashedNotes(prev => prev.filter(note => note.id !== createdSummary.id));
    setActiveNoteId(createdSummary.id);
    setActiveNote(createdNote);
    return createdSummary.id;
  };

  const createFolder = async (name: string, parentId: string | null = null) => {
    const res = await noteBusinessService.createFolder(name, parentId);
    if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
    
    if (res.success) {
        clearOperationError();
        setFolders(prev => [...prev, res.data!]);
        return res.data!.id;
    }
    pushOperationError(res.message || 'Failed to create folder');
    return '';
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const { content: _ignoredContent, ...summaryUpdates } = updates;

    // 1. Update Active Content if matching
    if (activeNoteId === id) {
        setActiveNote(prev => prev ? { ...prev, ...updates, updatedAt: Date.now() } : null);
    }

    // 2. Update Summary List (if metadata changed)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...summaryUpdates, updatedAt: Date.now() } : n));
    setTrashedNotes(prev => prev.map(n => n.id === id ? { ...n, ...summaryUpdates, updatedAt: Date.now() } : n));

    // 3. Persist (debounced per-note to prevent write storms while typing)
    scheduleNoteSave(id, updates);
  };

  const renameFolder = async (id: string, newName: string) => {
      const res = await noteBusinessService.renameFolder(id, newName);
      if (res.success) {
          clearOperationError();
          const newPath = res.data!;
          if (expandedFolders.has(id)) {
              setExpandedFolders(prev => {
                  const next = new Set(prev);
                  next.delete(id);
                  next.add(newPath);
                  return next;
              });
          }
          await loadList();
          return newPath;
      }
      pushOperationError(res.message || 'Failed to rename folder');
      return id;
  };

  const deleteItem = async (id: string, kind: 'note' | 'folder'): Promise<boolean> => {
    if (kind === 'note') {
        await flushPendingSave(id);
        const result = await noteBusinessService.moveToTrash(id);
        if (!result.success || !result.data) {
            pushOperationError(result.message || 'Failed to move note to trash');
            return false;
        }
        clearOperationError();
        const moved = result.data;
        setNotes(prev => prev.filter(n => n.id !== id));
        setTrashedNotes(prev => [moved, ...prev.filter(n => n.id !== id)]);
        if (activeNoteId === id) {
            setActiveNoteIdState(null);
            setActiveNote(null);
        }
        return true;
    } else {
        const result = await noteBusinessService.deleteFolder(id);
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
    await flushPendingSave(id);
    const result = await noteBusinessService.restoreFromTrash(id);
    if (!result.success || !result.data) {
      pushOperationError(result.message || 'Failed to restore note');
      return false;
    }
    clearOperationError();
    const restored = result.data;
    setTrashedNotes((prev) => prev.filter((note) => note.id !== id));
    setNotes((prev) => [restored, ...prev.filter((note) => note.id !== id)]);
    return true;
  };

  const deletePermanently = async (id: string): Promise<boolean> => {
    await flushPendingSave(id);
    const result = await noteBusinessService.deleteById(id);
    if (!result.success) {
      pushOperationError(result.message || 'Failed to delete note permanently');
      return false;
    }
    clearOperationError();
    setTrashedNotes((prev) => prev.filter((note) => note.id !== id));
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (activeNoteId === id) {
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
    const trashedIdSet = new Set(trashedNotes.map((note) => note.id));
    setTrashedNotes([]);
    if (activeNoteId && trashedIdSet.has(activeNoteId)) {
      setActiveNoteIdState(null);
      setActiveNote(null);
    }
    return true;
  };

  const toggleFavorite = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      updateNote(id, { isFavorite: !note.isFavorite });
    }
  };

  const moveItem = async (itemId: string, itemKind: 'note' | 'folder', newParentId: string | null): Promise<boolean> => {
      if (itemId === newParentId) return false;
      let moved = false;

      if (itemKind === 'folder' && newParentId) {
          const parentById = new Map<string, string | null>();
          folders.forEach((folder) => {
              parentById.set(folder.id, folder.parentId);
          });
          let cursor: string | null = newParentId;
          while (cursor) {
              if (cursor === itemId) {
                  return false;
              }
              cursor = parentById.get(cursor) || null;
          }
      }

      if (itemKind === 'note') {
          await flushPendingSave(itemId);
          const note = notes.find(n => n.id === itemId);
          if (note) {
              const previousParentId = note.parentId;
              setNotes(prev => prev.map(n => n.id === itemId ? { ...n, parentId: newParentId } : n));
              const moveResult = await noteBusinessService.moveNote(note, newParentId);
              if (!moveResult.success) {
                  setNotes(prev => prev.map(n => n.id === itemId ? { ...n, parentId: previousParentId } : n));
                  await loadList();
                  pushOperationError(moveResult.message || 'Failed to move note');
              } else {
                  clearOperationError();
                  moved = true;
              }
          }
      } else {
          const moveResult = await noteBusinessService.moveFolder(itemId, newParentId);
          if (!moveResult.success) {
              pushOperationError(moveResult.message || 'Failed to move folder');
          } else {
              clearOperationError();
              moved = true;
          }
          await loadList();
      }
      
      if (moved && newParentId) {
          setExpandedFolders(prev => new Set(prev).add(newParentId));
      }
      return moved;
  };

  const toggleFolderExpand = (folderId: string) => {
      setExpandedFolders(prev => {
          const next = new Set(prev);
          if (next.has(folderId)) next.delete(folderId);
          else next.add(folderId);
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
                  isExpanded: expandedFolders.has(f.id),
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
