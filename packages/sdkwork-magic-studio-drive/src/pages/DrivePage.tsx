import React, { useEffect, useState, useRef } from 'react';
import { DriveItem } from '../entities';
import {
  DriveSidebar,
  DriveGrid,
  DriveBreadcrumbs,
  DriveContextMenu,
  FilePreviewModal,
  initViewers,
} from '../services';
import { DriveStoreProvider, useDriveStore, SortOption, FileTypeFilter } from '../store/driveStore';
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  UploadCloud,
  Cloud,
  SlidersHorizontal,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Image,
  Film,
  Code,
  Box,
  X,
  Music,
  Type,
  Database,
  Hexagon,
  Filter,
  Download,
  Edit2,
  RotateCcw,
  Star,
  type LucideIcon,
} from 'lucide-react';

const DriveContent: React.FC = () => {
  const {
    items,
    viewMode,
    setViewMode,
    isLoading,
    currentPath,
    isVirtualView,
    selection,
    clearSelection,
    selectAll,
    uploadFiles,
    createFolder,
    refresh,
    sortBy,
    sortDirection,
    setSort,
    filterType,
    setFilterType,
    renameItem,
    deleteItems,
    restoreItems,
    emptyTrash,
    toggleStar,
    downloadItems,
  } = useDriveStore();

  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: DriveItem } | null>(
    null
  );
  const dragCounter = useRef(0);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // UI Toggles
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filterRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const isTrashView = currentPath === 'virtual://trash';

  useEffect(() => {
    initViewers();

    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
        setShowSortMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilterMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const closeMobileSidebarWhenDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };
    mediaQuery.addEventListener('change', closeMobileSidebarWhenDesktop);
    return () => mediaQuery.removeEventListener('change', closeMobileSidebarWhenDesktop);
  }, []);

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        )
          return;
        e.preventDefault();
        selectAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAll]);

  // Drag & Drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items?.length > 0 && e.dataTransfer.types.includes('Files'))
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length > 0) await uploadFiles(Array.from(e.dataTransfer.files));
  };

  // Actions
  const handleContextMenu = (e: React.MouseEvent, item?: DriveItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleRenameCommit = async (id: string, newName: string) => {
    if (newName && newName.trim()) await renameItem(id, newName.trim());
    setRenamingId(null);
  };

  // --- Added Handlers ---
  const handleEmptyTrash = async () => {
    if (confirm('Permanently delete all items in Trash?')) {
      await emptyTrash();
    }
  };

  const handleNewFolderPrompt = async () => {
    setContextMenu(null);
    const name = prompt('Folder Name:');
    if (name) await createFolder(name);
  };

  const handleDeleteAction = async () => {
    if (contextMenu?.item) {
      await deleteItems([contextMenu.item.id]);
    }
    setContextMenu(null);
  };

  const handleRestoreAction = async () => {
    if (contextMenu?.item) {
      await restoreItems([contextMenu.item.id]);
    }
    setContextMenu(null);
  };

  const handleToggleStarAction = async () => {
    if (contextMenu?.item) {
      await toggleStar(contextMenu.item.id, !contextMenu.item.isStarred);
    }
    setContextMenu(null);
  };

  // Bulk Actions (Floating Bar)
  const handleBulkDelete = async () => {
    if (selection.size === 0) return;
    if (confirm(`Delete ${selection.size} items?`)) {
      await deleteItems(Array.from(selection));
      clearSelection();
    }
  };

  const handleBulkRestore = async () => {
    await restoreItems(Array.from(selection));
    clearSelection();
  };

  const handleBulkStar = async (status: boolean) => {
    const ids = Array.from(selection);
    for (const id of ids) await toggleStar(id, status);
    // Don't clear selection immediately so user sees effect? Maybe clear.
    clearSelection();
  };

  const handleBulkDownload = async () => {
    const ids = Array.from(selection);
    if (ids.length === 0) {
      return;
    }
    await downloadItems(ids);
    clearSelection();
  };

  // ---------------------

  const handleSortOption = (option: SortOption) => {
    setSort(option, sortBy === option && sortDirection === 'asc' ? 'desc' : 'asc');
    setShowSortMenu(false);
  };

  const handleFilterSelect = (type: FileTypeFilter) => {
    setFilterType(type);
    setShowFilterMenu(false);
  };

  // --- Filter Icons Map ---
  const filterOptions: { id: FileTypeFilter; label: string; icon: LucideIcon }[] = [
    { id: 'all', label: 'All Files', icon: LayoutGrid },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'sheet', label: 'Spreadsheets', icon: Database },
    { id: 'presentation', label: 'Presentations', icon: Hexagon },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'video', label: 'Videos', icon: Film },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'font', label: 'Fonts', icon: Type },
    { id: 'archive', label: 'Archives', icon: Box },
    { id: '3d', label: '3D Models', icon: Box },
  ];

  const currentFilterLabel = filterOptions.find(f => f.id === filterType)?.label || 'All';
  const CurrentFilterIcon = filterOptions.find(f => f.id === filterType)?.icon || Filter;

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-[#121214] text-gray-200 relative"
      onClick={() => {
        clearSelection();
        setContextMenu(null);
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={e => handleContextMenu(e)}
    >
      <div className="hidden border-r border-[#27272a] bg-[#0f0f11] lg:block">
        <DriveSidebar />
      </div>

      {isMobileSidebarOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="h-full w-[272px] border-r border-[#27272a] bg-[#0f0f11]"
            onClick={event => event.stopPropagation()}
          >
            <DriveSidebar />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-[#111]">
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-20 border-b border-[#27272a] bg-[#141417]/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-100">Drive</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#333] bg-[#202024] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                {isTrashView
                  ? 'Trash'
                  : isVirtualView
                    ? currentPath.replace('virtual://', '')
                    : 'My Drive'}
              </span>
              <span className="hidden items-center rounded-full border border-[#333] bg-[#202024] px-2 py-0.5 text-[10px] font-mono text-gray-400 sm:inline-flex">
                {`Items: ${items.length}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isTrashView && !isVirtualView && (
                <button
                  onClick={() => uploadFiles()}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                >
                  <UploadCloud size={13} />
                  Upload
                </button>
              )}
              {isTrashView && items.length > 0 && (
                <button
                  onClick={handleEmptyTrash}
                  className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/50"
                >
                  <Trash2 size={13} />
                  Empty Trash
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#222225] px-3 py-1.5 text-xs font-semibold text-gray-200 lg:hidden"
            >
              <SlidersHorizontal size={13} />
              Sidebar
            </button>

            <div className="relative w-full max-w-[36rem]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search files and folders"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#333] bg-[#252526] py-1.5 pl-9 pr-3 text-sm text-gray-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowFilterMenu(!showFilterMenu);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${filterType !== 'all' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-[#333] bg-[#252526] text-gray-400 hover:bg-[#2a2a2d] hover:text-gray-200'}`}
                  title="Filter by Type"
                >
                  <CurrentFilterIcon size={14} />
                  <span className="hidden xl:inline">{currentFilterLabel}</span>
                  <ChevronDown size={10} className="opacity-50" />
                </button>
                {showFilterMenu && (
                  <div className="absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-[#333] bg-[#252526] py-1 shadow-xl animate-in fade-in zoom-in-95 duration-75">
                    <div className="border-b border-[#333] bg-[#2a2a2d] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      File Type
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {filterOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleFilterSelect(opt.id)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors ${filterType === opt.id ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-[#333]'}`}
                        >
                          <opt.icon size={14} className="opacity-70" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowSortMenu(!showSortMenu);
                  }}
                  className="rounded-lg border border-[#333] bg-[#252526] p-1.5 text-gray-400 transition-colors hover:bg-[#2a2a2d] hover:text-gray-200"
                  title="Sort Options"
                >
                  <ArrowDown size={14} className={sortDirection === 'asc' ? 'rotate-180' : ''} />
                </button>
                {showSortMenu && (
                  <div className="absolute top-full right-0 z-50 mt-1 flex w-40 flex-col rounded-lg border border-[#333] bg-[#252526] py-1 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-75">
                    {['name', 'date', 'size'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleSortOption(opt as SortOption)}
                        className={`flex items-center justify-between px-3 py-2 text-left hover:bg-[#333] ${sortBy === opt ? 'text-blue-400' : 'text-gray-300'}`}
                      >
                        <span className="capitalize">{opt}</span>
                        {sortBy === opt &&
                          (sortDirection === 'asc' ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          ))}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Switch */}
              <div className="flex rounded-lg border border-[#333] bg-[#252526] p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1 ${viewMode === 'list' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <ListIcon size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1 ${viewMode === 'grid' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-[#27272a] bg-[#18181b] px-4 py-2 sm:px-6">
          <DriveBreadcrumbs />
        </div>

        {/* --- FILE VIEW --- */}
        <div
          className="flex-1 overflow-y-auto p-4 scroll-smooth relative"
          onClick={() => clearSelection()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500 gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading content...</span>
            </div>
          ) : (
            <div className="pb-20">
              {' '}
              {/* Extra padding for floating bar */}
              <DriveGrid
                items={items}
                viewMode={viewMode}
                onPreview={setPreviewItem}
                renamingId={renamingId}
                onRenameCommit={handleRenameCommit}
                onRenameCancel={() => setRenamingId(null)}
                onContextMenu={handleContextMenu}
              />
            </div>
          )}
        </div>
      </div>

      {/* --- FLOATING ACTION BAR (Selection) --- */}
      {selection.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] border border-[#333] rounded-full shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 fade-in duration-200 backdrop-blur-sm bg-opacity-90">
          <div className="px-2 text-xs font-semibold text-white border-r border-[#333] mr-1">
            {selection.size} selected
          </div>

          {isTrashView ? (
            <>
              <BarAction
                onClick={handleBulkRestore}
                icon={<RotateCcw size={14} />}
                label="Restore"
              />
              <BarAction
                onClick={handleBulkDelete}
                icon={<Trash2 size={14} />}
                label="Delete"
                danger
              />
            </>
          ) : (
            <>
              <BarAction
                onClick={handleBulkDownload}
                icon={<Download size={14} />}
                label="Download"
              />

              {selection.size === 1 && (
                <BarAction
                  onClick={() => setRenamingId(Array.from(selection)[0])}
                  icon={<Edit2 size={14} />}
                  label="Rename"
                />
              )}

              <BarAction
                onClick={() => handleBulkStar(true)}
                icon={<Star size={14} />}
                label="Star"
              />

              <div className="w-[1px] h-4 bg-[#333] mx-1" />

              <BarAction
                onClick={handleBulkDelete}
                icon={<Trash2 size={14} />}
                label="Delete"
                danger
              />
            </>
          )}

          <div className="w-[1px] h-4 bg-[#333] mx-1" />

          <button
            onClick={clearSelection}
            className="p-1.5 rounded-full hover:bg-[#333] text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && !isTrashView && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-[2px] border-4 border-dashed border-blue-500 m-4 rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-none">
          <Cloud size={64} className="text-blue-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white drop-shadow-md">Drop files to upload</h2>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <DriveContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          isTrashView={isTrashView}
          onClose={() => setContextMenu(null)}
          onNewFolder={handleNewFolderPrompt}
          onUpload={() => {
            setContextMenu(null);
            uploadFiles();
          }}
          onRefresh={() => {
            setContextMenu(null);
            refresh();
          }}
          onDelete={handleDeleteAction}
          onRestore={handleRestoreAction}
          onToggleStar={handleToggleStarAction}
        />
      )}

      {/* File Preview */}
      {previewItem && <FilePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
};

const BarAction = ({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) => (
  <button
    onClick={e => {
      e.stopPropagation();
      onClick();
    }}
    className={`
            p-2 rounded-lg transition-all flex items-center gap-2 group
            ${
              danger
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-blue-600 dark:hover:text-blue-400'
            }
        `}
    title={label}
  >
    {icon}
  </button>
);

const DrivePage: React.FC = () => {
  return (
    <DriveStoreProvider>
      <DriveContent />
    </DriveStoreProvider>
  );
};

export default DrivePage;
