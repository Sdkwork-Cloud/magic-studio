
import React, { useState, useRef, useEffect } from 'react';
import { X, FolderOpen, FileArchive } from 'lucide-react';
import { FileEntry } from 'sdkwork-react-core';
import { useEditorStore } from '../store/editorStore';
import { pathUtils } from 'sdkwork-react-commons';
import { useTranslation } from 'sdkwork-react-i18n';

// Sub-components
import { ExplorerHeader } from './file-explorer/ExplorerHeader';
import { ExplorerContextMenu } from './file-explorer/ExplorerContextMenu';
import { FileTreeNode, InlineInput } from './file-explorer/FileTreeNode';
import { GitHubSyncModal } from './modals/GitHubSyncModal';
import { PublishAppModal } from './modals/PublishAppModal';

// --- Recursive Filter Helper ---
const filterTree = (entries: FileEntry[], query: string): FileEntry[] => {
  if (!query) return entries;
  return entries.reduce<FileEntry[]>((acc, entry) => {
    const matches = entry.name.toLowerCase().includes(query.toLowerCase());
    let children: FileEntry[] | undefined;
    if (entry.children) children = filterTree(entry.children, query);
    if (matches || (children && children.length > 0)) {
       acc.push({ ...entry, children: children });
    }
    return acc;
  }, []);
};

const FileExplorer: React.FC = () => {
  const { 
      fileTree, openFolder, importProjectFromZip, rootPath, isLoading, createItem, 
      refreshTree, deleteItem, renameItem, openFile,
      selectedExplorerPath, selectExplorerItem, toggleDirectory,
      copyItem, cutItem, pasteItem, copyPathToClipboard, revealInOS,
      syncToGitHub, publishApp
  } = useEditorStore();
  
  const { t } = useTranslation();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entry: FileEntry } | null>(null);
  
  // Modals
  const [showGitModal, setShowGitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Mutation State
  const [creationState, setCreationState] = useState<{ type: 'file' | 'folder'; parentPath: string } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus Search
  useEffect(() => {
      if (isSearchVisible) searchInputRef.current?.focus();
  }, [isSearchVisible]);

  // Derived Data
  const visibleTree = filterTree(fileTree, searchQuery);
  const projectName = rootPath ? pathUtils.basename(rootPath) : 'my-app';

  // --- Actions ---

  const handleCreateCommit = async (name: string) => {
      if (creationState && rootPath) {
          const basePath = creationState.parentPath;
          const fullPath = pathUtils.join(basePath, name);
          try {
              await createItem(fullPath, creationState.type);
          } catch (e) {
              console.error(e);
          }
      }
      setCreationState(null);
      containerRef.current?.focus();
  };

  const startCreation = async (type: 'file' | 'folder', specificParent?: string) => {
      if (!rootPath) return;

      let targetParent = rootPath;

      if (specificParent) {
          targetParent = specificParent;
      } else if (selectedExplorerPath) {
          try {
              const stats = await import('sdkwork-react-fs').then(m => m.vfs.stat(selectedExplorerPath));
              if (stats.type === 'directory') {
                  targetParent = selectedExplorerPath;
                  await toggleDirectory(targetParent, true);
              } else {
                  targetParent = pathUtils.dirname(selectedExplorerPath);
              }
          } catch (e) {
              targetParent = rootPath;
          }
      }
      setCreationState({ type, parentPath: targetParent });
  };

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const performDelete = async (pathToDelete?: string) => {
      const target = pathToDelete || selectedExplorerPath;
      if (!target) return;
      
      const name = pathUtils.basename(target);
      if (confirm(t('editor.explorer.confirm_delete', { name }))) {
          await deleteItem(target);
      }
      setContextMenu(null);
  };

  const performRename = (pathToRename?: string) => {
      const target = pathToRename || selectedExplorerPath;
      if (target) {
          setRenamingPath(target);
          setContextMenu(null);
      }
  };

  const performCopy = (path?: string) => {
      const target = path || selectedExplorerPath;
      if (target) copyItem(target);
      setContextMenu(null);
  };

  const performCut = (path?: string) => {
      const target = path || selectedExplorerPath;
      if (target) cutItem(target);
      setContextMenu(null);
  };

  const performPaste = async (dest?: string) => {
      const target = dest || selectedExplorerPath;
      if (target) await pasteItem(target);
      setContextMenu(null);
  };

  const handleRenameCommit = async (entry: FileEntry, newName: string) => {
      if (newName && newName !== entry.name) {
          await renameItem(entry.path, newName);
      }
      setRenamingPath(null);
      containerRef.current?.focus();
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          selectExplorerItem(null);
      }
  };

  const handleTriggerAction = (action: 'rename' | 'delete', entry: FileEntry) => {
      if (action === 'rename') performRename(entry.path);
      if (action === 'delete') performDelete(entry.path);
  };

  const getParentPath = (entry: FileEntry) => {
      return entry.isDirectory ? entry.path : pathUtils.dirname(entry.path);
  };

  // --- Keyboard Handling ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Ignore if typing in an input
      if (isSearchVisible || renamingPath || creationState) return;

      if (e.key === 'Delete') {
          e.preventDefault();
          performDelete();
      } else if (e.key === 'F2') {
          e.preventDefault();
          performRename();
      } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedExplorerPath) {
              const name = pathUtils.basename(selectedExplorerPath);
              openFile(selectedExplorerPath, name);
          }
      }
      // Ctrl+C / Ctrl+X / Ctrl+V
      if ((e.metaKey || e.ctrlKey)) {
          if (e.key === 'c') {
              performCopy();
          } else if (e.key === 'x') {
              performCut();
          } else if (e.key === 'v') {
              performPaste();
          }
      }
  };

  return (
    <div 
        className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] min-w-[240px] select-none outline-none transition-colors duration-200" 
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={0} 
        ref={containerRef}
        onKeyDown={handleKeyDown}
    >
      
      {/* 1. Header */}
      <ExplorerHeader 
         hasRoot={!!rootPath}
         onRefresh={refreshTree}
         onToggleSearch={() => {
             setIsSearchVisible(!isSearchVisible);
             if (isSearchVisible) setSearchQuery('');
         }}
         isSearchActive={isSearchVisible}
         onCreateFile={() => startCreation('file')}
         onCreateFolder={() => startCreation('folder')}
         onSyncToGitHub={() => setShowGitModal(true)}
         onPublishApp={() => setShowPublishModal(true)}
      />

      {/* 2. Content */}
      {!rootPath ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('editor.explorer.empty_title')}</span>
            <p className="text-gray-400 text-sm">{t('editor.explorer.empty_desc')}</p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[180px]">
            <button 
                onClick={openFolder} 
                className="flex items-center gap-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20 group"
            >
                <FolderOpen size={16} className="text-blue-100" />
                <span>{t('editor.explorer.open_folder')}</span>
            </button>
            
            <button 
                onClick={importProjectFromZip} 
                className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-all border border-gray-200 dark:border-[#333] group"
            >
                <FileArchive size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
                <span>{t('editor.explorer.import_archive')}</span>
            </button>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-4 max-w-[160px] leading-relaxed">
             {t('editor.explorer.drag_drop_hint')}
          </p>
        </div>
      ) : (
        <>
           {isSearchVisible && (
              <div className="px-2 pb-1.5 pt-1.5 bg-gray-50 dark:bg-[#252526] border-b border-gray-200 dark:border-[#333] flex-none animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="relative">
                      <input 
                        ref={searchInputRef} 
                        type="text" 
                        placeholder={t('common.actions.search') + "..."} 
                        className="w-full bg-white dark:bg-[#3c3c3c] border border-gray-300 dark:border-transparent focus:border-blue-500 text-gray-900 dark:text-gray-200 text-xs px-2 py-0.5 rounded focus:outline-none placeholder-gray-400 dark:placeholder-gray-500" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={(e) => e.stopPropagation()} 
                      />
                      {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={12} /></button>}
                  </div>
              </div>
           )}

           <div 
             className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-2 pt-1 relative bg-white dark:bg-[#1e1e1e]" 
             onClick={handleBackgroundClick}
           >
             {isLoading ? (
                 <div className="px-6 py-2 text-xs text-gray-500 italic">{t('common.status.loading')}</div>
             ) : (
                 <>
                    {creationState && creationState.parentPath === rootPath && (
                        <InlineInput 
                            type={creationState.type} 
                            level={0} 
                            onCommit={handleCreateCommit} 
                            onCancel={() => { setCreationState(null); containerRef.current?.focus(); }} 
                        />
                    )}

                    {visibleTree.map(entry => (
                      <FileTreeNode 
                         key={entry.uuid} 
                         entry={entry} 
                         level={0} 
                         isSearching={!!searchQuery}
                         renamingPath={renamingPath}
                         creationState={creationState}
                         onContextMenu={handleContextMenu}
                         onRenameCommit={handleRenameCommit}
                         onRenameCancel={() => { setRenamingPath(null); containerRef.current?.focus(); }}
                         onCreateCommit={handleCreateCommit}
                         onCreateCancel={() => { setCreationState(null); containerRef.current?.focus(); }}
                         onTriggerAction={handleTriggerAction}
                      />
                    ))}
                    
                    {visibleTree.length === 0 && searchQuery && (
                        <div className="px-6 py-2 text-xs text-gray-500">{t('editor.explorer.no_results')}</div>
                    )}
                 </>
             )}
           </div>
        </>
      )}

      {/* 3. Context Menu */}
      {contextMenu && (
          <ExplorerContextMenu 
              x={contextMenu.x} 
              y={contextMenu.y} 
              isDirectory={contextMenu.entry.isDirectory}
              onClose={() => setContextMenu(null)}
              onDelete={() => performDelete(contextMenu.entry.path)}
              onRename={() => performRename(contextMenu.entry.path)}
              onCreateFile={() => { 
                  startCreation('file', getParentPath(contextMenu.entry)); 
                  setContextMenu(null); 
              }}
              onCreateFolder={() => { 
                  startCreation('folder', getParentPath(contextMenu.entry)); 
                  setContextMenu(null); 
              }}
              onCopy={() => performCopy(contextMenu.entry.path)}
              onCut={() => performCut(contextMenu.entry.path)}
              onPaste={() => performPaste(contextMenu.entry.path)}
              onCopyPath={() => { copyPathToClipboard(contextMenu.entry.path); setContextMenu(null); }}
              onCopyRelPath={() => { copyPathToClipboard(contextMenu.entry.path, true); setContextMenu(null); }}
              onReveal={() => { revealInOS(contextMenu.entry.path); setContextMenu(null); }}
          />
      )}

      {/* 4. Modals */}
      {showGitModal && (
          <GitHubSyncModal 
              onClose={() => setShowGitModal(false)}
              onSync={syncToGitHub}
          />
      )}
      
      {showPublishModal && (
          <PublishAppModal 
              onClose={() => setShowPublishModal(false)}
              onPublish={publishApp}
              initialName={projectName}
          />
      )}
    </div>
  );
};

export default FileExplorer;
export { FileExplorer };
