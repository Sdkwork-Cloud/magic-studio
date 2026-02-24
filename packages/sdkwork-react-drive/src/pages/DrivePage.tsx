
import React, { useEffect, useState, useRef } from 'react';
import { DriveItem } from '../entities/drive.entity';
import { DriveSidebar, DriveGrid, DriveBreadcrumbs, DriveContextMenu, FilePreviewModal, initViewers } from '../services/viewerBootstrap';
import { DriveStoreProvider, useDriveStore, SortOption, FileTypeFilter } from '../store/driveStore';
import { 
    LayoutGrid, List as ListIcon, Search, UploadCloud, Cloud, 
    ChevronDown, ArrowUp, ArrowDown, Trash2, 
    FileText, Image, Film, Code, Box, X, Music, Type, Database, Hexagon, Filter,
    Download, Edit2, RotateCcw, Star, StarOff
} from 'lucide-react';
;
;

const DriveContent: React.FC = () => {
    const { 
        items, viewMode, setViewMode, isLoading, currentPath, isVirtualView,
        selection, clearSelection, selectAll, uploadFiles, createFolder, refresh,
        sortBy, sortDirection, setSort, 
        filterType, setFilterType,
        renameItem, deleteItems, restoreItems, emptyTrash, toggleStar
    } = useDriveStore();
    
    const [isDragging, setIsDragging] = useState(false);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, item?: DriveItem} | null>(null);
    const dragCounter = useRef(0);
    const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    
    // UI Toggles
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const filterRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    const isTrashView = currentPath === 'virtual://trash';

    useEffect(() => {
        initViewers();

        const handleClickOutside = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false);
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault();
                selectAll();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectAll]);

    // Drag & Drop
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current += 1;
        if (e.dataTransfer.items?.length > 0 && e.dataTransfer.types.includes('Files')) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files?.length > 0) await uploadFiles(Array.from(e.dataTransfer.files));
    };

    // Actions
    const handleContextMenu = (e: React.MouseEvent, item?: DriveItem) => {
        e.preventDefault(); e.stopPropagation(); 
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
         for(const id of ids) await toggleStar(id, status);
         // Don't clear selection immediately so user sees effect? Maybe clear.
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
    const filterOptions: { id: FileTypeFilter, label: string, icon: any }[] = [
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
            className="flex w-full h-full bg-[#111] text-gray-200 overflow-hidden relative" 
            onClick={() => { clearSelection(); setContextMenu(null); }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onContextMenu={(e) => handleContextMenu(e)}
        >
            <DriveSidebar />

            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111] transition-colors duration-200">
                
                {/* --- HEADER --- */}
                <div className="h-14 border-b border-gray-200 dark:border-[#27272a] flex items-center px-4 justify-between bg-white dark:bg-[#18181b] select-none flex-none gap-4">
                    
                    {/* LEFT: Breadcrumbs (Always Visible) */}
                    <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                        <DriveBreadcrumbs />
                    </div>

                    {/* RIGHT: Tools (Search, Filter, Sort, View, Primary) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        
                        {/* Search */}
                        <div className="relative group w-48 transition-all focus-within:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-[#252526] hover:bg-gray-200 dark:hover:bg-[#2a2a2d] border border-transparent dark:border-[#333] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#202022] focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-500"
                            />
                        </div>

                        <div className="h-5 w-[1px] bg-gray-200 dark:bg-[#333] mx-1" />

                        {/* Filter Dropdown */}
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterType !== 'all' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' : 'bg-gray-100 dark:bg-[#252526] border-transparent dark:border-[#333] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a2a2d]'}`}
                                title="Filter by Type"
                            >
                                <CurrentFilterIcon size={14} />
                                <span className="hidden xl:inline">{currentFilterLabel}</span>
                                <ChevronDown size={10} className="opacity-50" />
                            </button>
                            {showFilterMenu && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-75 overflow-hidden">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-[#2a2a2d] border-b border-gray-200 dark:border-[#333]">File Type</div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {filterOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleFilterSelect(opt.id)}
                                                className={`flex items-center gap-3 w-full px-3 py-2 text-xs text-left transition-colors ${filterType === opt.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]'}`}
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
                                onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#252526] border border-transparent dark:border-[#333] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a2a2d] transition-colors"
                                title="Sort Options"
                            >
                                <ArrowDown size={14} className={sortDirection === 'asc' ? 'rotate-180' : ''} />
                            </button>
                             {showSortMenu && (
                                 <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl py-1 z-50 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-75">
                                     {['name', 'date', 'size'].map((opt) => (
                                         <button
                                            key={opt}
                                            onClick={() => handleSortOption(opt as SortOption)}
                                            className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#333] text-left ${sortBy === opt ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                                         >
                                             <span className="capitalize">{opt}</span>
                                             {sortBy === opt && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                         </button>
                                     ))}
                                 </div>
                             )}
                        </div>

                        {/* View Switch */}
                        <div className="flex bg-gray-100 dark:bg-[#252526] p-0.5 rounded-lg border border-gray-200 dark:border-[#333]">
                             <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
                                 <ListIcon size={14} />
                             </button>
                             <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>
                                 <LayoutGrid size={14} />
                             </button>
                        </div>
                        
                        {/* Primary Upload Action */}
                        {!isTrashView && !isVirtualView && (
                             <button 
                                 onClick={() => uploadFiles()}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm ml-2"
                             >
                                 <UploadCloud size={14} />
                                 <span className="hidden lg:inline">Upload</span>
                             </button>
                         )}

                         {/* Empty Trash Action */}
                         {isTrashView && items.length > 0 && (
                            <button 
                                onClick={handleEmptyTrash}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium transition-colors ml-2"
                            >
                                <Trash2 size={14} /> Empty Trash
                            </button>
                        )}
                    </div>
                </div>

                {/* --- FILE VIEW --- */}
                <div className="flex-1 overflow-y-auto p-4 scroll-smooth relative" onClick={() => clearSelection()}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-500 gap-3">
                             <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                             <span className="text-sm">Loading content...</span>
                        </div>
                    ) : (
                        <div className="pb-20"> {/* Extra padding for floating bar */}
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-full shadow-2xl shadow-black/20 dark:shadow-black/50 animate-in slide-in-from-bottom-4 fade-in duration-200 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
                    <div className="px-2 text-xs font-semibold text-gray-700 dark:text-white border-r border-gray-200 dark:border-[#333] mr-1">
                        {selection.size} selected
                    </div>
                    
                    {isTrashView ? (
                        <>
                            <BarAction onClick={handleBulkRestore} icon={<RotateCcw size={14} />} label="Restore" />
                            <BarAction onClick={handleBulkDelete} icon={<Trash2 size={14} />} label="Delete" danger />
                        </>
                    ) : (
                        <>
                            <BarAction onClick={() => {}} icon={<Download size={14} />} label="Download" />
                            
                            {selection.size === 1 && (
                                <BarAction onClick={() => setRenamingId(Array.from(selection)[0])} icon={<Edit2 size={14} />} label="Rename" />
                            )}
                            
                            <BarAction onClick={() => handleBulkStar(true)} icon={<Star size={14} />} label="Star" />
                            
                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-[#333] mx-1" />
                            
                            <BarAction onClick={handleBulkDelete} icon={<Trash2 size={14} />} label="Delete" danger />
                        </>
                    )}

                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-[#333] mx-1" />
                    
                    <button 
                        onClick={clearSelection}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Drag Overlay */}
            {isDragging && !isTrashView && (
                <div className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-[2px] border-4 border-dashed border-blue-500 m-4 rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-none">
                    <Cloud size={64} className="text-blue-400 mb-4 animate-bounce" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-md">Drop files to upload</h2>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <DriveContextMenu 
                    x={contextMenu.x} y={contextMenu.y} item={contextMenu.item} isTrashView={isTrashView}
                    onClose={() => setContextMenu(null)} onNewFolder={handleNewFolderPrompt}
                    onUpload={() => { setContextMenu(null); uploadFiles(); }} onRefresh={() => { setContextMenu(null); refresh(); }}
                    onDelete={handleDeleteAction} onRestore={handleRestoreAction} onToggleStar={handleToggleStarAction}
                />
            )}

            {/* File Preview */}
            {previewItem && (
                <FilePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
            )}
        </div>
    );
};

const ActionButton = ({ onClick, label, danger, disabled }: { onClick: () => void, label: string, danger?: boolean, disabled?: boolean }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition-colors border
            ${disabled ? 'opacity-50 cursor-not-allowed border-transparent text-gray-500' : 
              danger ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40' : 
              'bg-white dark:bg-[#252526] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#333] hover:text-black dark:hover:text-white'
            }
        `}
    >
        {label}
    </button>
);

const BarAction = ({ onClick, icon, label, danger }: { onClick: () => void, icon: React.ReactNode, label: string, danger?: boolean }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`
            p-2 rounded-lg transition-all flex items-center gap-2 group
            ${danger 
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
