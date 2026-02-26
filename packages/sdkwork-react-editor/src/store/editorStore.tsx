
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { EditorFile } from '../types';
import { platform, FileEntry } from '@sdkwork/react-core';
import { pathUtils } from '@sdkwork/react-commons';
import { GitSyncOptions, PublishOptions } from '../types';
import { projectService } from '../services/projectService';
import { filePicker } from '../utils/filePicker';
import { editorService } from '../services/editorService';
import { editorSessionService } from '../services/editorSessionService';
import { compressionService } from '@sdkwork/react-compression';
import { vfs } from '@sdkwork/react-fs';

interface ClipboardItem {
    path: string;
    op: 'copy' | 'cut';
}

interface EditorStoreContextType {
  rootPath: string | null;
  fileTree: FileEntry[];
  openFiles: EditorFile[];
  activeFilePath: string | null;
  selectedExplorerPath: string | null;
  isLoading: boolean;
  expandedPaths: Set<string>;
  
  openFolder: () => Promise<void>;
  openProject: (path: string) => Promise<void>;
  openFile: (path: string, name: string, isPreview?: boolean) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  selectExplorerItem: (path: string | null) => void;
  
  toggleDirectory: (path: string, forceState?: boolean) => Promise<void>;
  collapseAll: () => void;
  refreshDirectory: (path: string) => Promise<void>;
  refreshTree: () => Promise<void>;

  saveCurrentFile: () => Promise<void>;
  updateFileContent: (path: string, content: string) => void;

  createItem: (path: string, type: 'file' | 'folder') => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
  
  uploadFiles: () => Promise<void>;
  uploadZip: () => Promise<void>;
  importProjectFromZip: () => Promise<void>;
  downloadWorkspaceAsZip: () => Promise<void>;
  
  syncToGitHub: (options: GitSyncOptions) => Promise<void>;
  publishApp: (options: PublishOptions) => Promise<string>;

  internalClipboard: ClipboardItem | null;
  copyItem: (path: string) => void;
  cutItem: (path: string) => void;
  pasteItem: (destFolder: string) => Promise<void>;
  copyPathToClipboard: (path: string, relative?: boolean) => Promise<void>;
  revealInOS: (path: string) => Promise<void>;
}

const EditorStoreContext = createContext<EditorStoreContextType | undefined>(undefined);

const updateNodeInTree = (nodes: FileEntry[], targetPath: string, newChildren: FileEntry[]): FileEntry[] => {
  return nodes.map(node => {
    if (node.path === targetPath) {
      return { ...node, children: newChildren };
    }
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, targetPath, newChildren) };
    }
    return node;
  });
};

export const EditorStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [selectedExplorerPath, setSelectedExplorerPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [internalClipboard, setInternalClipboard] = useState<ClipboardItem | null>(null);

  useEffect(() => {
      const restore = async () => {
          setIsLoading(true);
          try {
              const session = await editorSessionService.loadSession();
              if (session && session.rootPath) {
                  const rootRes = await editorService.refreshDirectory(session.rootPath);
                  
                  if (rootRes.success) {
                      setRootPath(session.rootPath);
                      setOpenFiles(session.openFiles || []);
                      setActiveFilePath(session.activeFilePath);
                      setExpandedPaths(new Set(session.expandedPaths || []));
                      setFileTree(rootRes.data || []);
                      
                      session.expandedPaths.forEach(p => refreshDirectory(p));
                  } else {
                      console.warn("Saved session root path invalid or inaccessible.");
                  }
              }
          } catch (e) {
              console.error("Failed to restore session", e);
          } finally {
              setIsLoading(false);
          }
      };
      restore();
  }, []);

  useEffect(() => {
      if (rootPath) {
          const timeout = setTimeout(() => {
              editorSessionService.saveSession(
                  rootPath,
                  openFiles,
                  activeFilePath,
                  Array.from(expandedPaths)
              );
          }, 2000);
          return () => clearTimeout(timeout);
      }
  }, [rootPath, openFiles, activeFilePath, expandedPaths]);

  const refreshDirectory = useCallback(async (dirPath: string) => {
      const result = await editorService.refreshDirectory(dirPath);
      if (result.success && result.data) {
          setFileTree(prevTree => {
             if (dirPath === rootPath) return result.data!;
             return updateNodeInTree(prevTree, dirPath, result.data!);
          });
      }
  }, [rootPath]);

  const refreshTree = useCallback(async () => {
    if (rootPath) {
       await refreshDirectory(rootPath);
       for (const path of expandedPaths) {
           await refreshDirectory(path);
       }
    }
  }, [rootPath, refreshDirectory, expandedPaths]);

  const toggleDirectory = useCallback(async (path: string, forceState?: boolean) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      const isCurrentlyExpanded = next.has(path);
      const shouldExpand = forceState !== undefined ? forceState : !isCurrentlyExpanded;
      if (shouldExpand) {
        next.add(path);
        refreshDirectory(path).catch(console.error);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, [refreshDirectory]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const openProject = useCallback(async (path: string) => {
      setIsLoading(true);
      try {
          const result = await editorService.loadProjectTree(path);
          if (result.success) {
              setFileTree(result.data!);
              setRootPath(path);
              setOpenFiles([]);
              setActiveFilePath(null);
              setExpandedPaths(new Set()); 
              setSelectedExplorerPath(null);
              setInternalClipboard(null);
          } else {
              throw new Error(result.message);
          }
      } catch (e: any) {
          console.error('Failed to load project', e);
          alert('Failed to load project: ' + e.message);
      } finally {
          setIsLoading(false);
      }
  }, []);

  const openFolder = async () => {
    try {
      const path = await platform.selectDir();
      if (path) {
        await openProject(path);
      }
    } catch (e) {
      console.error('Failed to open folder', e);
    }
  };

  const selectExplorerItem = useCallback((path: string | null) => {
      setSelectedExplorerPath(path);
  }, []);

  const openFile = useCallback(async (path: string, name: string, isPreview: boolean = false) => {
    setSelectedExplorerPath(path);
    const existingIndex = openFiles.findIndex(f => f.path === path);
    const existing = openFiles[existingIndex];

    if (existing) {
      if (existing.isPreview && !isPreview) {
          setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, isPreview: false } : f));
      }
      setActiveFilePath(path);
      return;
    }

    try {
        const stats = await vfs.stat(path);
        if (stats.size > 5 * 1024 * 1024) { 
            alert(`File is too large to open (${(stats.size / 1024 / 1024).toFixed(2)} MB). Limit is 5MB.`);
            return;
        }

        const isBinary = pathUtils.isBinary(path);
        let content = '';
        
        if (!isBinary) {
            const res = await editorService.readFile(path);
            if (res.success) content = res.data!;
            else throw new Error(res.message);
        } else {
            content = '[Binary File - Preview Not Supported Yet]';
        }

        const newFile: EditorFile = {
            path,
            name,
            content,
            isDirty: false,
            language: getLanguageFromExtension(name),
            isPreview
        };
      
        setOpenFiles(prev => {
            if (isPreview) {
                const previewIndex = prev.findIndex(f => f.isPreview);
                if (previewIndex !== -1) {
                    const next = [...prev];
                    next[previewIndex] = newFile;
                    return next;
                }
            }
            return [...prev, newFile];
        });
        setActiveFilePath(path);
    } catch (e) {
        console.error('Failed to read file', e);
    }
  }, [openFiles]);

  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      const remaining = prev.filter(f => f.path !== path);
      if (activeFilePath === path) {
        setActiveFilePath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
      }
      return remaining;
    });
  }, [activeFilePath]);

  const setActiveFile = useCallback((path: string) => {
    setActiveFilePath(path);
    setSelectedExplorerPath(path);
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setOpenFiles(prev => prev.map(f => f.path === path ? { ...f, content, isDirty: true } : f));
  }, []);

  const saveCurrentFile = useCallback(async () => {
    if (!activeFilePath) return;
    const file = openFiles.find(f => f.path === activeFilePath);
    if (file && file.content !== undefined) {
      const res = await editorService.writeFile(file.path, file.content);
      if (res.success) {
          setOpenFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, isDirty: false } : f));
      } else {
          alert(res.message);
      }
    }
  }, [activeFilePath, openFiles]);

  const createItem = useCallback(async (path: string, type: 'file' | 'folder') => {
      const res = await editorService.createItem(path, type);
      if (res.success) {
          if (type === 'file') {
              const name = pathUtils.basename(path);
              await openFile(path, name, false);
          }
          const parentDir = pathUtils.dirname(path);
          if (parentDir) {
             await refreshDirectory(parentDir);
             toggleDirectory(parentDir, true);
          }
      } else {
          alert(res.message);
      }
  }, [openFile, refreshDirectory, toggleDirectory]);

  const deleteItem = useCallback(async (path: string) => {
      const res = await editorService.deleteItem(path);
      if (res.success) {
          setOpenFiles(prev => prev.filter(f => !f.path.startsWith(path)));
          if (activeFilePath && activeFilePath.startsWith(path)) {
              setActiveFilePath(null);
          }
          const parentDir = pathUtils.dirname(path);
          if (parentDir) await refreshDirectory(parentDir);
      } else {
          console.error(res.message);
      }
  }, [activeFilePath, refreshDirectory]);

  const renameItem = useCallback(async (oldPath: string, newName: string) => {
      const res = await editorService.renameItem(oldPath, newName);
      if (res.success) {
          const newPath = res.data!;
          const dir = pathUtils.dirname(oldPath);
          
          setOpenFiles(prev => prev.map(f => {
              if (f.path.startsWith(oldPath)) {
                  const relative = f.path.substring(oldPath.length);
                  return {
                      ...f,
                      path: newPath + relative,
                      name: f.path === oldPath ? newName : f.name
                  };
              }
              return f;
          }));
          
          if (activeFilePath && activeFilePath.startsWith(oldPath)) {
              const relative = activeFilePath.substring(oldPath.length);
              setActiveFilePath(newPath + relative);
          }
          await refreshDirectory(dir);
      } else {
          console.error(res.message);
      }
  }, [activeFilePath, refreshDirectory]);

  const getUploadTarget = async (): Promise<string> => {
      if (!rootPath) return '';
      let target = rootPath;
      if (selectedExplorerPath) {
          try {
             const stats = await vfs.stat(selectedExplorerPath).catch(() => null);
             if (stats && stats.type === 'directory') target = selectedExplorerPath;
             else target = pathUtils.dirname(selectedExplorerPath);
          } catch (e) { target = rootPath; }
      }
      return target;
  };

  const uploadFiles = useCallback(async () => {
    if (!rootPath) return;
    try {
        const files = await filePicker.pickFiles(true, '*');
        if (files.length === 0) return;
        const targetDir = await getUploadTarget();
        
        for (const file of files) {
            const destPath = pathUtils.join(targetDir, file.name);
            await vfs.writeFileBinary(destPath, file.data);
        }
        await refreshDirectory(targetDir);
        await toggleDirectory(targetDir, true);
    } catch (e) {
        console.error('Upload failed', e);
        alert('Upload failed');
    }
  }, [rootPath, selectedExplorerPath, refreshDirectory, toggleDirectory]);

  const uploadZip = useCallback(async () => {
    if (!rootPath) return;
    try {
        const files = await filePicker.pickFiles(false, '.zip,.tar,.gz,.rar,.7z');
        if (files.length === 0) return;
        
        const file = files[0];
        const targetDir = await getUploadTarget();
        
        if (file.path) {
            await compressionService.decompressFile(file.path, targetDir);
        } else {
            await compressionService.decompress(file.data, targetDir);
        }

        await refreshDirectory(targetDir);
        await toggleDirectory(targetDir, true);
    } catch (e) {
        console.error('Zip upload failed', e);
        alert('Failed to process archive: ' + e);
    }
  }, [rootPath, selectedExplorerPath, refreshDirectory, toggleDirectory]);

  const importProjectFromZip = useCallback(async () => {
      try {
          const files = await filePicker.pickFiles(false, '.zip,.tar,.gz,.rar,.7z');
          if (files.length === 0) return;
          const file = files[0];
          
          let targetDir = '';

          if (platform.getPlatform() === 'desktop') {
              const selectedDir = await platform.selectDir();
              if (!selectedDir) return;
              targetDir = selectedDir;
          } else {
              targetDir = '/imported-project';
              try { await vfs.delete(targetDir); } catch {}
              await vfs.createDir(targetDir);
          }

          setIsLoading(true);

          if (file.path) {
              await compressionService.decompressFile(file.path, targetDir);
          } else {
              await compressionService.decompress(file.data, targetDir);
          }

          await openProject(targetDir);
      } catch (e) {
          console.error('Import zip project failed', e);
          alert('Failed to import project: ' + e);
          setIsLoading(false);
      }
  }, [openProject]);

  const downloadWorkspaceAsZip = useCallback(async () => {
    if (!rootPath) {
        alert('Please open a folder first.');
        return;
    }
    try {
        const children = await vfs.readDir(rootPath);
        const sourcePaths = children
            .filter(c => c.name !== 'node_modules' && c.name !== '.git' && c.name !== '.DS_Store' && c.name !== '__MACOSX')
            .map(c => c.path);

        if (sourcePaths.length === 0) {
            alert('Workspace is empty.');
            return;
        }

        const blobData = await compressionService.compress(sourcePaths);
        const buffer = new Uint8Array(blobData).buffer;
        const blob = new Blob([buffer], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pathUtils.basename(rootPath)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Download zip failed', e);
        alert('Failed to generate zip archive.');
    }
  }, [rootPath]);
  
  const syncToGitHub = useCallback(async (options: GitSyncOptions) => {
      if (!rootPath) return;
      await projectService.syncToGitHub(rootPath, options);
  }, [rootPath]);

  const publishApp = useCallback(async (options: PublishOptions) => {
      if (!rootPath) throw new Error("No project open");
      return await projectService.publishApp(rootPath, options);
  }, [rootPath]);

  const copyItem = useCallback((path: string) => {
      setInternalClipboard({ path, op: 'copy' });
  }, []);
  const cutItem = useCallback((path: string) => {
      setInternalClipboard({ path, op: 'cut' });
  }, []);
  
  const pasteItem = useCallback(async (destFolder: string) => {
      if (!internalClipboard) return;
      const { path: srcPath, op } = internalClipboard;
      const fileName = pathUtils.basename(srcPath);
      const destPath = pathUtils.join(destFolder, fileName);
      if (srcPath === destPath) return; 
      
      try {
          if (op === 'cut') {
              const res = await editorService.renameItem(srcPath, destPath);
              if(res.success) {
                  setInternalClipboard(null);
                  const srcParent = pathUtils.dirname(srcPath);
                  if (srcParent !== destFolder) await refreshDirectory(srcParent);
              } else {
                  throw new Error(res.message);
              }
          } else {
              const stats = await vfs.stat(srcPath);
              if (stats.type === 'directory') {
                  alert('Folder copy not yet implemented in web version.');
                  return;
              }
              const content = await vfs.readFileBinary(srcPath);
              await vfs.writeFileBinary(destPath, content);
          }
          await refreshDirectory(destFolder);
          await toggleDirectory(destFolder, true);
      } catch (e: any) {
          console.error('Paste failed', e);
          alert('Failed to paste item: ' + e.message);
      }
  }, [internalClipboard, refreshDirectory, toggleDirectory]);

  const copyPathToClipboard = useCallback(async (path: string, relative: boolean = false) => {
      let text = path;
      if (relative && rootPath && path.startsWith(rootPath)) {
          text = path.substring(rootPath.length + 1); 
      }
      await platform.copy(text);
  }, [rootPath]);

  const revealInOS = useCallback(async (path: string) => {
      await platform.showItemInFolder(path);
  }, []);

  const getLanguageFromExtension = (filename: string): string => {
    const ext = pathUtils.extname(filename).toLowerCase();
    switch (ext) {
      case '.ts': case '.tsx': return 'typescript';
      case '.js': case '.jsx': return 'javascript';
      case '.json': return 'json';
      case '.html': return 'html';
      case '.css': return 'css';
      case '.rs': return 'rust';
      case '.py': return 'python';
      case '.md': return 'markdown';
      default: return 'plaintext';
    }
  };

  return (
    <EditorStoreContext.Provider value={{ 
      rootPath, fileTree, openFiles, activeFilePath, isLoading, expandedPaths, selectedExplorerPath,
      openFolder, openProject, openFile, closeFile, setActiveFile, selectExplorerItem,
      saveCurrentFile, updateFileContent, 
      toggleDirectory, collapseAll, refreshDirectory, refreshTree,
      createItem, deleteItem, renameItem,
      uploadFiles, uploadZip, importProjectFromZip, downloadWorkspaceAsZip,
      syncToGitHub, publishApp,
      internalClipboard, copyItem, cutItem, pasteItem, copyPathToClipboard, revealInOS
    }}>
      {children}
    </EditorStoreContext.Provider>
  );
};

export const useEditorStore = () => {
  const context = useContext(EditorStoreContext);
  if (!context) throw new Error('useEditorStore must be used within a EditorStoreProvider');
  return context;
};
