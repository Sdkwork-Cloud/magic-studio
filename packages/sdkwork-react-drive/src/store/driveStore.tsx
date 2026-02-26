
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { DriveItem, DriveStats } from '../entities/drive.entity';
import { driveService } from '../services/driveService';
import { pathUtils } from '@sdkwork/react-commons';
import { uploadHelper, UploadFile } from '../utils/uploadHelper';

type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'date' | 'size';
export type SortDirection = 'asc' | 'desc';
export type FileTypeFilter = 
    | 'all' 
    | 'document' 
    | 'sheet' 
    | 'presentation' 
    | 'image' 
    | 'video' 
    | 'audio' 
    | 'archive' 
    | 'code' 
    | 'font' 
    | '3d';

interface DriveStoreContextType {
  currentPath: string;
  items: DriveItem[];
  stats: DriveStats | null;
  isLoading: boolean;
  viewMode: ViewMode;
  selection: Set<string>; 
  
  sortBy: SortOption;
  sortDirection: SortDirection;
  filterType: FileTypeFilter;
  setSort: (by: SortOption, dir: SortDirection) => void;
  setFilterType: (type: FileTypeFilter) => void;

  navigateTo: (path: string) => void;
  navigateUp: () => void;
  refresh: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  uploadFiles: (droppedFiles?: File[]) => Promise<void>;
  deleteItems: (ids: string[]) => Promise<void>;
  restoreItems: (ids: string[]) => Promise<void>;
  emptyTrash: () => Promise<void>;
  toggleStar: (id: string, status: boolean) => Promise<void>;
  renameItem: (id: string, newName: string) => Promise<void>;
  moveItems: (ids: string[], targetFolderId: string) => Promise<void>;

  toggleSelection: (id: string, multi: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;

  isVirtualView: boolean;
}

const DriveStoreContext = createContext<DriveStoreContextType | undefined>(undefined);

export const DriveStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [rawItems, setRawItems] = useState<DriveItem[]>([]);
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<FileTypeFilter>('all');

  useEffect(() => {
      const init = async () => {
          const defaultPath = await driveService.getDefaultPath();
          setCurrentPath(defaultPath);
      };
      init();
  }, []);

  useEffect(() => {
      if (currentPath) {
          loadPath(currentPath);
      }
  }, [currentPath]);

  const loadPath = async (path: string) => {
      setIsLoading(true);
      setRawItems([]); 
      setSelection(new Set());
      setFilterType('all'); 
      
      try {
          const result = await driveService.list(path);
          setRawItems(result);
          
          const s = await driveService.getProvider().getStats();
          setStats(s);
      } catch (e) {
          console.error("Failed to load path", e);
      } finally {
          setIsLoading(false);
      }
  };

  const refresh = async () => {
      await loadPath(currentPath);
  };

  const items = useMemo(() => {
      let filtered = [...rawItems];

      if (filterType !== 'all') {
          filtered = filtered.filter(item => {
              if (item.type === 'folder') return true; 
              
              const name = item.name.toLowerCase();
              const mime = item.mimeType || '';
              
              switch (filterType) {
                  case 'image': 
                      return mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|tiff)$/.test(name);
                  case 'video': 
                      return mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v)$/.test(name);
                  case 'audio': 
                      return mime.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/.test(name);
                  case 'document': 
                      return mime.includes('pdf') || mime.includes('text') || /\.(pdf|doc|docx|txt|md|rtf|odt)$/.test(name);
                  case 'sheet':
                      return /\.(xls|xlsx|csv|tsv|ods)$/.test(name);
                  case 'presentation':
                      return /\.(ppt|pptx|odp)$/.test(name);
                  case 'archive': 
                      return mime.includes('zip') || mime.includes('compressed') || /\.(zip|tar|gz|rar|7z)$/.test(name);
                  case 'code': 
                      return /\.(ts|tsx|js|jsx|json|html|css|py|rs|go|java|c|cpp|h|xml|yaml|yml|sh|bat)$/.test(name);
                  case 'font':
                      return /\.(ttf|otf|woff|woff2|eot)$/.test(name);
                  case '3d':
                      return /\.(obj|fbx|glb|gltf|stl|blend)$/.test(name);
                  default: return true;
              }
          });
      }

      return filtered.sort((a, b) => {
          if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1;
          }
          let comparison = 0;
          switch (sortBy) {
              case 'name': comparison = a.name.localeCompare(b.name); break;
              case 'size': comparison = a.size - b.size; break;
              case 'date': comparison = a.updatedAt - b.updatedAt; break;
          }
          return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [rawItems, sortBy, sortDirection, filterType]);

  const setSort = (by: SortOption, dir: SortDirection) => {
      setSortBy(by);
      setSortDirection(dir);
  };

  const navigateTo = (path: string) => {
      if (path && path !== currentPath) {
          setCurrentPath(path);
      }
  };

  const navigateUp = () => {
      if (currentPath.startsWith('virtual://')) {
           driveService.getDefaultPath().then(setCurrentPath);
           return;
      }
      const parent = pathUtils.dirname(currentPath);
      if (parent && parent !== currentPath && parent.length >= 1) {
          setCurrentPath(parent);
      }
  };

  const createFolder = async (name: string) => {
      await driveService.createFolder(name, currentPath);
      await refresh();
  };

  const uploadFiles = async (droppedFiles?: File[]) => {
      if (currentPath.startsWith('virtual://')) {
          alert('Cannot upload to a virtual view.');
          return;
      }
      try {
          setIsLoading(true);
          let files: UploadFile[] = [];

          if (droppedFiles && droppedFiles.length > 0) {
              files = await uploadHelper.processFiles(droppedFiles);
          } else {
              files = await uploadHelper.pickFiles(true, '*', false); 
          }
          
          if (files.length === 0) {
              setIsLoading(false);
              return;
          }
          
          for (const file of files) {
              if (file.path && driveService.getProvider().hasCapability('native_import')) {
                   await driveService.importFile(currentPath, file.path);
              } else {
                   if (file.data.length > 0) {
                       await driveService.uploadFile(currentPath, file.name, file.data);
                   }
              }
          }
          await refresh();
      } catch (e) {
          console.error("Upload failed", e);
          alert("Upload failed: " + e);
      } finally {
          setIsLoading(false);
      }
  };

  const deleteItems = async (ids: string[]) => {
      await driveService.delete(ids);
      await refresh();
  };

  const restoreItems = async (ids: string[]) => {
      await driveService.restore(ids);
      await refresh();
  };

  const emptyTrash = async () => {
      await driveService.emptyTrash();
      await refresh();
  };

  const toggleStar = async (id: string, status: boolean) => {
      await driveService.toggleStar(id, status);
      await refresh();
  };

  const renameItem = async (id: string, newName: string) => {
      await driveService.rename(id, newName);
      await refresh();
  };

  const moveItems = async (ids: string[], targetFolderId: string) => {
      await driveService.getProvider().move(ids, targetFolderId);
      await refresh();
  };

  const toggleSelection = (id: string, multi: boolean) => {
      setSelection(prev => {
          const next = new Set(multi ? prev : []);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const selectAll = () => {
      setSelection(new Set(items.map(i => i.id)));
  };

  const clearSelection = () => setSelection(new Set());
  
  const isVirtualView = currentPath.startsWith('virtual://');

  return (
    <DriveStoreContext.Provider value={{
        currentPath, items, stats, isLoading, viewMode, selection,
        sortBy, sortDirection, setSort,
        filterType, setFilterType,
        navigateTo, navigateUp, refresh, createFolder, uploadFiles, 
        deleteItems, restoreItems, emptyTrash, toggleStar, renameItem, moveItems,
        toggleSelection, clearSelection, selectAll, setViewMode, isVirtualView
    }}>
      {children}
    </DriveStoreContext.Provider>
  );
};

export const useDriveStore = () => {
  const context = useContext(DriveStoreContext);
  if (!context) throw new Error('useDriveStore must be used within a DriveStoreProvider');
  return context;
};
