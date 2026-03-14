
import { DriveItem } from '../entities'
import React, { useState, useRef, useEffect } from 'react';
;
import { Folder, MoreHorizontal, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { useDriveStore, SortOption } from '../store/driveStore';
import { FileIcon } from '@sdkwork/react-editor'; 
import { useTranslation } from '@sdkwork/react-i18n';

interface DriveGridProps {
    items: DriveItem[];
    viewMode: 'grid' | 'list';
    onPreview: (item: DriveItem) => void;
    renamingId: string | null;
    onRenameCommit: (id: string, newName: string) => void;
    onRenameCancel: () => void;
    onContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
}

export const DriveGrid: React.FC<DriveGridProps> = ({ 
    items, viewMode, onPreview, renamingId, onRenameCommit, onRenameCancel, onContextMenu 
}) => {
    const { 
        selection, toggleSelection, clearSelection, navigateTo, navigateUp, moveItems,
        sortBy, sortDirection, setSort 
    } = useDriveStore();
    const { t } = useTranslation();
    
    const renameInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [renameValue, setRenameValue] = useState('');
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    // --- Helpers ---

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '--';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatSmartDate = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleDateString();
    };

    const getReadableType = (item: DriveItem) => {
        if (item.type === 'folder') return t('drive.grid.types.folder');
        if (item.mimeType) {
            if (item.mimeType.includes('image')) return t('drive.grid.types.image');
            if (item.mimeType.includes('video')) return t('drive.grid.types.video');
            if (item.mimeType.includes('audio')) return t('drive.grid.types.audio');
            if (item.mimeType.includes('pdf')) return t('drive.grid.types.pdf');
            if (item.mimeType.includes('text')) return t('drive.grid.types.text');
            if (item.mimeType.includes('zip') || item.mimeType.includes('compressed')) return t('drive.grid.types.archive');
            if (item.mimeType.includes('spreadsheet') || item.mimeType.includes('excel')) return t('drive.grid.types.sheet');
            if (item.mimeType.includes('presentation')) return t('drive.grid.types.presentation');
        }
        return t('drive.grid.types.file');
    };

    // --- Event Handlers ---
    // ... (Keep existing handlers mostly same, abbreviated for brevity in update)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (renamingId) return;

        if (e.key === 'Backspace') {
            navigateUp();
            return;
        }

        if (e.key === 'Enter') {
            if (selection.size === 1) {
                const id = Array.from(selection)[0];
                const item = items.find(i => i.id === id);
                if (item) {
                    if (item.type === 'folder') navigateTo(item.path || item.id);
                    else onPreview(item);
                }
            }
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const currentId = Array.from(selection)[0];
            const currentIndex = items.findIndex(i => i.id === currentId);
            
            let nextIndex = 0;
            if (currentIndex === -1) {
                nextIndex = 0;
            } else {
                if (viewMode === 'list') {
                    if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
                    if (e.key === 'ArrowDown') nextIndex = Math.min(items.length - 1, currentIndex + 1);
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') nextIndex = currentIndex;
                } else {
                    const cols = getGridColumns();
                    if (e.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
                    if (e.key === 'ArrowRight') nextIndex = Math.min(items.length - 1, currentIndex + 1);
                    if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - cols);
                    if (e.key === 'ArrowDown') nextIndex = Math.min(items.length - 1, currentIndex + cols);
                }
            }

            const nextItem = items[nextIndex];
            if (nextItem) {
                clearSelection();
                toggleSelection(nextItem.id, false);
            }
        }
    };

    const getGridColumns = () => {
        if (!containerRef.current) return 4;
        const width = containerRef.current.clientWidth;
        if (width >= 1536) return 8; 
        if (width >= 1280) return 6; 
        if (width >= 1024) return 5;
        if (width >= 768) return 4;
        return 2;
    };

    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            const item = items.find(i => i.id === renamingId);
            if (item) {
                setRenameValue(item.name);
                renameInputRef.current.focus();
                const dotIndex = item.name.lastIndexOf('.');
                if (dotIndex > 0) {
                    renameInputRef.current.setSelectionRange(0, dotIndex);
                } else {
                    renameInputRef.current.select();
                }
            }
        }
    }, [renamingId, items]);

    const handleDragStart = (e: React.DragEvent, item: DriveItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }));
        e.dataTransfer.effectAllowed = 'move';
        if (!selection.has(item.id)) {
            clearSelection();
            toggleSelection(item.id, false);
        }
    };

    const handleDragOverItem = (e: React.DragEvent, item: DriveItem) => {
        if (item.type === 'folder' && !selection.has(item.id)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverFolderId(item.id);
        }
    };

    const handleDropOnItem = async (e: React.DragEvent, targetFolder: DriveItem) => {
        e.preventDefault();
        setDragOverFolderId(null);
        if (targetFolder.type !== 'folder') return;
        if (selection.size > 0) {
            const ids = Array.from(selection);
            if (ids.includes(targetFolder.id)) return;
            await moveItems(ids, targetFolder.path || targetFolder.id);
        }
    };

    const handleItemClick = (e: React.MouseEvent, item: DriveItem) => {
        e.stopPropagation();
        toggleSelection(item.id, e.metaKey || e.ctrlKey || e.shiftKey);
    };

    const handleDoubleClick = (e: React.MouseEvent, item: DriveItem) => {
        e.stopPropagation();
        if (renamingId) return;
        if (item.type === 'folder') {
            if (!item.trashedAt) navigateTo(item.path || item.id);
        } else {
            if (!item.trashedAt) onPreview(item);
        }
    };

    const handleRenameCommitAction = () => {
         if (renamingId) onRenameCommit(renamingId, renameValue);
    };

    const handleHeaderClick = (option: SortOption) => {
        if (sortBy === option) {
            setSort(option, sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(option, 'asc');
        }
    };

    const SortArrow = ({ active }: { active: boolean }) => {
        if (!active) return null;
        return sortDirection === 'asc' 
            ? <ArrowUp size={12} className="ml-1 text-blue-400" /> 
            : <ArrowDown size={12} className="ml-1 text-blue-400" />;
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-in fade-in duration-300 select-none pb-20">
                <div className="w-32 h-32 rounded-full bg-[#1e1e1e] flex items-center justify-center mb-6 border border-[#333] shadow-inner">
                    <Folder size={64} className="opacity-10 text-gray-400" strokeWidth={1} />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-1">{t('drive.grid.empty_title')}</h3>
                <p className="text-sm text-gray-500">{t('drive.grid.empty_desc')}</p>
            </div>
        );
    }

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div 
                ref={containerRef}
                className="w-full pb-20 outline-none h-full flex flex-col" 
                tabIndex={0} 
                onKeyDown={handleKeyDown}
            >
                {/* List Header */}
                <div className="flex items-center px-4 py-2 border-b border-[#27272a] bg-[#111] sticky top-0 z-20 select-none text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="flex-1 flex items-center cursor-pointer hover:text-gray-300 transition-colors group" onClick={() => handleHeaderClick('name')}>
                        {t('common.form.name')} <SortArrow active={sortBy === 'name'} />
                    </div>
                    <div className="w-40 text-right pr-4 hidden md:flex items-center justify-end cursor-pointer hover:text-gray-300 transition-colors" onClick={() => handleHeaderClick('date')}>
                        Date <SortArrow active={sortBy === 'date'} />
                    </div>
                    <div className="w-32 text-left hidden lg:block cursor-default">
                        Type
                    </div>
                    <div className="w-24 text-right pr-4 hidden sm:flex items-center justify-end cursor-pointer hover:text-gray-300 transition-colors" onClick={() => handleHeaderClick('size')}>
                        Size <SortArrow active={sortBy === 'size'} />
                    </div>
                    <div className="w-8"></div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto">
                    {items.map((item, index) => {
                        const isSelected = selection.has(item.id);
                        const isRenaming = renamingId === item.id;
                        const isDropTarget = dragOverFolderId === item.id;
                        
                        return (
                            <div 
                                key={item.id}
                                draggable={!isRenaming}
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragOver={(e) => handleDragOverItem(e, item)}
                                onDragLeave={() => setDragOverFolderId(null)}
                                onDrop={(e) => handleDropOnItem(e, item)}
                                onClick={(e) => handleItemClick(e, item)}
                                onDoubleClick={(e) => handleDoubleClick(e, item)}
                                onContextMenu={(e) => onContextMenu(e, item)}
                                className={`
                                    flex items-center px-4 h-[40px] cursor-pointer transition-colors group border-b border-transparent
                                    ${isSelected 
                                        ? 'bg-[#094771] text-white' 
                                        : `hover:bg-[#27272a] text-gray-300 ${index % 2 === 0 ? 'bg-[#141414]' : 'bg-transparent'}`
                                    }
                                    ${isRenaming ? 'bg-[#252526] border-blue-500 ring-1 ring-blue-500 z-10' : ''}
                                    ${item.trashedAt ? 'opacity-60 grayscale' : ''}
                                    ${isDropTarget ? 'bg-[#094771]/60 border-blue-400' : ''}
                                `}
                            >
                                {/* Name */}
                                <div className="flex-1 flex items-center gap-3 min-w-0 pr-4">
                                    <div className="flex-shrink-0 relative">
                                        <FileIcon name={item.name} isDirectory={item.type === 'folder'} expanded={false} />
                                        {item.isStarred && !item.trashedAt && (
                                            <div className="absolute -top-1 -right-1 text-yellow-400 drop-shadow-sm transform scale-75">
                                                <Star size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isRenaming ? (
                                        <input 
                                            ref={renameInputRef}
                                            type="text"
                                            className="bg-[#111] text-white border-none outline-none w-full text-sm font-medium p-0 focus:ring-0"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameCommitAction();
                                                if (e.key === 'Escape') onRenameCancel();
                                            }}
                                            onBlur={handleRenameCommitAction}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className={`truncate text-sm font-medium ${item.name.startsWith('.') ? 'opacity-60' : ''}`}>
                                            {item.name}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Date */}
                                <div className={`w-40 text-xs text-right pr-4 hidden md:block whitespace-nowrap ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {formatSmartDate(item.updatedAt)}
                                </div>
                                
                                {/* Type */}
                                <div className={`w-32 text-xs text-left hidden lg:block truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {getReadableType(item)}
                                </div>

                                {/* Size */}
                                <div className={`w-24 text-xs font-mono text-right pr-4 hidden sm:block ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {item.type === 'folder' ? '--' : formatSize(item.size)}
                                </div>
                                
                                {/* Actions */}
                                <div className="w-8 text-right flex justify-end">
                                    <button 
                                        className={`p-1 rounded-md transition-all ${isSelected ? 'hover:bg-blue-500 text-white' : 'hover:bg-[#333] text-gray-400 opacity-0 group-hover:opacity-100'}`}
                                        onClick={(e) => onContextMenu(e, item)}
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- GRID VIEW ---
    return (
        <div 
            ref={containerRef}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 pb-10 outline-none content-start p-2"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {items.map(item => {
                const isSelected = selection.has(item.id);
                const isRenaming = renamingId === item.id;
                const isDropTarget = dragOverFolderId === item.id;

                return (
                    <div 
                        key={item.id}
                        draggable={!isRenaming}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOverItem(e, item)}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={(e) => handleDropOnItem(e, item)}
                        onClick={(e) => handleItemClick(e, item)}
                        onDoubleClick={(e) => handleDoubleClick(e, item)}
                        onContextMenu={(e) => onContextMenu(e, item)}
                        className={`
                            flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                            aspect-[1/1.1]
                            ${isSelected 
                                ? 'bg-[#094771]/20 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111]' 
                                : 'bg-transparent hover:bg-[#252526]'
                            }
                            ${item.trashedAt ? 'opacity-60 grayscale' : ''}
                            ${isDropTarget ? 'scale-105 ring-2 ring-blue-400 bg-[#094771]/40' : ''}
                        `}
                    >
                        {/* Checkbox Overlay (Visible on Hover/Select) */}
                        {isSelected && (
                             <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-sm z-10">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                             </div>
                        )}

                         {/* Star Indicator */}
                         {item.isStarred && !item.trashedAt && (
                            <div className="absolute top-2 left-2 text-yellow-500 z-10 drop-shadow-md">
                                <Star size={14} fill="currentColor" />
                            </div>
                        )}

                        <div className="flex-1 flex items-center justify-center w-full mb-3">
                             <div className="transform transition-transform duration-200 group-hover:scale-110 drop-shadow-2xl">
                                 <div className="scale-[3.0]">
                                     <FileIcon name={item.name} isDirectory={item.type === 'folder'} expanded={false} />
                                 </div>
                             </div>
                        </div>
                        
                        <div className="w-full text-center relative px-1">
                            {isRenaming ? (
                                <input 
                                    ref={renameInputRef}
                                    type="text"
                                    className="bg-[#111] text-white border border-blue-500 rounded px-1 text-xs w-full text-center focus:outline-none absolute -bottom-1 left-0 right-0 z-20 shadow-xl py-1"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameCommitAction();
                                        if (e.key === 'Escape') onRenameCancel();
                                    }}
                                    onBlur={handleRenameCommitAction}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <h4 className="text-xs text-gray-200 font-medium truncate w-full" title={item.name}>{item.name}</h4>
                                    <span className="text-[10px] text-gray-500 mt-1">{item.type === 'folder' ? formatSmartDate(item.updatedAt) : formatSize(item.size)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
