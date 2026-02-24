
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Note, NoteSummary, NoteFolder, TreeItem, generateUUID } from 'sdkwork-react-commons';
import { noteService } from '../services/noteService';

interface NoteStoreContextType {
  notes: NoteSummary[]; 
  folders: NoteFolder[];
  activeNoteId: string | null;
  activeNote: Note | null; // Full content
  isLoading: boolean;
  treeData: TreeItem[];
  recentNotes: NoteSummary[];
  favoriteNotes: NoteSummary[];
  
  setActiveNoteId: (id: string | null) => void;
  createNote: (title: string, type?: Note['type'], parentId?: string | null) => Promise<string>;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteItem: (id: string, kind: 'note' | 'folder') => Promise<void>;
  toggleFavorite: (id: string) => void;
  
  moveItem: (itemId: string, itemKind: 'note' | 'folder', newParentId: string | null) => Promise<void>;
  toggleFolderExpand: (folderId: string) => void;
  renameFolder: (id: string, newName: string) => Promise<string>;
  expandedFolders: Set<string>;
  refresh: () => Promise<void>;
}

const NoteStoreContext = createContext<NoteStoreContextType | undefined>(undefined);

export const NoteStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Lists only store summaries to save memory
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const loadList = useCallback(async () => {
    setIsLoading(true);
    try {
        const notesResult = await noteService.findAll({ page: 0, size: 2000 });
        const foldersResult = await noteService.getFolders();
        
        if (notesResult.success && notesResult.data) {
            setNotes(notesResult.data.content);
        }
        if (foldersResult.success && foldersResult.data) {
            setFolders(foldersResult.data);
        }
    } catch (e) {
        console.error("Failed to load notes list", e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  // Lazy Load Content
  useEffect(() => {
      const fetchContent = async () => {
          if (!activeNoteId) {
              setActiveNote(null);
              return;
          }
          // Don't reload if we already have it (unless we force refresh elsewhere)
          if (activeNote?.id === activeNoteId) return;

          const res = await noteService.findById(activeNoteId);
          if (res.success && res.data) {
              setActiveNote(res.data);
          }
      };
      fetchContent();
  }, [activeNoteId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const createNote = async (title: string, type: Note['type'] = 'doc', parentId: string | null = null) => {
    const newNote: Note = {
      id: generateUUID(),
      uuid: generateUUID(),
      title,
      content: '',
      type,
      parentId,
      tags: [],
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      snippet: ''
    };
    
    // Add summary to list immediately
    const summary: NoteSummary = { ...newNote };
    delete (summary as any).content;
    setNotes(prev => [summary, ...prev]);
    
    // Set Active
    setActiveNoteId(newNote.id);
    setActiveNote(newNote); 
    
    if (parentId) {
        setExpandedFolders(prev => new Set(prev).add(parentId));
    }

    await noteService.save(newNote);
    return newNote.id;
  };

  const createFolder = async (name: string, parentId: string | null = null) => {
    const res = await noteService.createFolder(name, parentId);
    if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
    
    if (res.success) {
        setFolders(prev => [...prev, res.data!]);
        return res.data!.id;
    }
    return '';
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    // 1. Update Active Content if matching
    if (activeNoteId === id) {
        setActiveNote(prev => prev ? { ...prev, ...updates, updatedAt: Date.now() } : null);
    }

    // 2. Update Summary List (if metadata changed)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    
    // 3. Persist
    await noteService.save({ id, ...updates });
  };

  const renameFolder = async (id: string, newName: string) => {
      const res = await noteService.renameFolder(id, newName);
      if (res.success) {
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
      return id;
  };

  const deleteItem = async (id: string, kind: 'note' | 'folder') => {
    if (kind === 'note') {
        await noteService.deleteById(id);
        setNotes(prev => prev.filter(n => n.id !== id));
        if (activeNoteId === id) {
            setActiveNoteId(null);
            setActiveNote(null);
        }
    } else {
        await noteService.deleteFolder(id);
        await loadList(); 
    }
  };

  const toggleFavorite = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      updateNote(id, { isFavorite: !note.isFavorite });
    }
  };

  const moveItem = async (itemId: string, itemKind: 'note' | 'folder', newParentId: string | null) => {
      if (itemId === newParentId) return;

      if (itemKind === 'note') {
          const note = notes.find(n => n.id === itemId);
          if (note) {
              setNotes(prev => prev.map(n => n.id === itemId ? { ...n, parentId: newParentId } : n));
              await noteService.moveNote(note, newParentId);
          }
      } else {
          // Folder move not fully implemented in service yet
          await loadList();
      }
      
      if (newParentId) {
          setExpandedFolders(prev => new Set(prev).add(newParentId));
      }
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
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 5);
  }, [notes]);

  const favoriteNotes = useMemo(() => {
      return notes.filter(n => n.isFavorite);
  }, [notes]);

  return (
    <NoteStoreContext.Provider value={{
      notes, folders, activeNoteId, activeNote, isLoading, treeData, expandedFolders,
      recentNotes, favoriteNotes,
      setActiveNoteId, createNote, createFolder, updateNote, deleteItem, toggleFavorite,
      moveItem, toggleFolderExpand, renameFolder, refresh: loadList
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
