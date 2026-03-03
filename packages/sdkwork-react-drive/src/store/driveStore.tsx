
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { DriveItem, DriveStats } from '../entities';
import { driveBusinessService } from '../services';
import { pathUtils, type ServiceResult } from '@sdkwork/react-commons';
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
  rootPath: string;
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
  navigateHome: () => void;
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

const getResultDataOrThrow = <T,>(result: ServiceResult<T>, operation: string): T => {
  if (!result.success) {
    throw new Error(result.message || `${operation} failed.`);
  }
  if (typeof result.data === 'undefined') {
    throw new Error(`${operation} returned no data.`);
  }
  return result.data;
};

const ensureResultSuccess = (result: ServiceResult<unknown>, operation: string): void => {
  if (!result.success) {
    throw new Error(result.message || `${operation} failed.`);
  }
};

export const DriveStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rootPath, setRootPath] = useState<string>('');
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
          const defaultPathResult = await driveBusinessService.getDefaultPath();
          const defaultPath = getResultDataOrThrow(defaultPathResult, 'Initialize drive root path');
          setRootPath(defaultPath);
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
          const listResult = await driveBusinessService.list(path);
          setRawItems(getResultDataOrThrow(listResult, 'Load drive items'));
          
          const statsResult = await driveBusinessService.getStats();
          setStats(getResultDataOrThrow(statsResult, 'Load drive stats'));
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

  const navigateHome = () => {
      if (!rootPath) {
          return;
      }
      navigateTo(rootPath);
  };

  const navigateUp = () => {
      if (currentPath.startsWith('virtual://')) {
           navigateHome();
           return;
      }
      const parent = pathUtils.dirname(currentPath);
      if (parent && parent !== currentPath && parent.length >= 1) {
          setCurrentPath(parent);
      }
  };

  const createFolder = async (name: string) => {
      const createResult = await driveBusinessService.createFolder(name, currentPath);
      ensureResultSuccess(createResult, 'Create folder');
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
          
          const hasNativeImportResult = await driveBusinessService.hasNativeImportCapability();
          const hasNativeImport = getResultDataOrThrow(
              hasNativeImportResult,
              'Check native import capability'
          );
          for (const file of files) {
              if (file.path && hasNativeImport) {
                   const importResult = await driveBusinessService.importFile(currentPath, file.path);
                   ensureResultSuccess(importResult, 'Import file');
              } else {
                   if (file.data.length > 0) {
                       const uploadResult = await driveBusinessService.uploadFile(currentPath, file.name, file.data);
                       ensureResultSuccess(uploadResult, 'Upload file');
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
      const deleteResult = await driveBusinessService.delete(ids);
      ensureResultSuccess(deleteResult, 'Delete items');
      await refresh();
  };

  const restoreItems = async (ids: string[]) => {
      const restoreResult = await driveBusinessService.restore(ids);
      ensureResultSuccess(restoreResult, 'Restore items');
      await refresh();
  };

  const emptyTrash = async () => {
      const emptyTrashResult = await driveBusinessService.emptyTrash();
      ensureResultSuccess(emptyTrashResult, 'Empty trash');
      await refresh();
  };

  const toggleStar = async (id: string, status: boolean) => {
      const toggleStarResult = await driveBusinessService.toggleStar(id, status);
      ensureResultSuccess(toggleStarResult, 'Toggle starred status');
      await refresh();
  };

  const renameItem = async (id: string, newName: string) => {
      const renameResult = await driveBusinessService.rename(id, newName);
      ensureResultSuccess(renameResult, 'Rename item');
      await refresh();
  };

  const moveItems = async (ids: string[], targetFolderId: string) => {
      const moveResult = await driveBusinessService.move(ids, targetFolderId);
      ensureResultSuccess(moveResult, 'Move items');
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
        rootPath, currentPath, items, stats, isLoading, viewMode, selection,
        sortBy, sortDirection, setSort,
        filterType, setFilterType,
        navigateTo, navigateHome, navigateUp, refresh, createFolder, uploadFiles, 
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
