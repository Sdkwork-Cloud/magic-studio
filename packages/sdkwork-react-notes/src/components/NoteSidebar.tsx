
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNoteStore } from '../store/noteStore';
import { TreeItem, NoteType, logger } from '@sdkwork/react-commons';
import { 
    Plus, Search, ChevronRight, Trash2, FileText, 
    Folder, FolderOpen, FilePlus, FolderPlus, Edit2, Star, Clock,
    BookOpen, Layout, Type, Code, MoreHorizontal, ChevronDown,
    File as GenericFile, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface CreateMenuDividerItem {
    label: string;
    divider: true;
}

interface CreateMenuActionItem {
    label: string;
    icon: LucideIcon;
    type: 'folder' | 'note';
    subType?: NoteType;
    color: string;
    divider?: false;
}

type CreateMenuItem = CreateMenuDividerItem | CreateMenuActionItem;

interface MenuOptionProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    shortcut?: string;
}

interface DragPayload {
    id: string;
    kind: TreeItem['kind'];
}

const isDragPayload = (value: unknown): value is DragPayload => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value as Partial<DragPayload>;
    return (
        typeof candidate.id === 'string' &&
        (candidate.kind === 'folder' || candidate.kind === 'note')
    );
};

// --- Icons Mapping ---
const TYPE_ICONS: Record<NoteType, LucideIcon> = {
    doc: FileText,
    article: Layout,
    novel: BookOpen,
    log: Clock,
    news: Type,
    code: Code
};

// --- Inline Input Component (For Renaming/Creating) ---
const SidebarItemInput: React.FC<{
    initialValue: string;
    placeholder?: string;
    onCommit: (value: string) => void;
    onCancel: () => void;
    level: number;
    icon: React.ReactNode; 
}> = ({ initialValue, placeholder, onCommit, onCancel, level, icon }) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);
    const isSubmitting = useRef(false);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            if (initialValue) {
                inputRef.current.select();
            }
        }
    }, []);

    const commit = () => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        if (value.trim()) onCommit(value.trim());
        else onCancel();
    };

    const cancel = () => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        onCancel();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            commit();
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            cancel();
        }
    };

    const handleBlur = () => {
        commit();
    };

    const paddingLeft = 12 + (level * 12);

    return (
        <div 
            className="flex items-center h-[28px] pr-2 bg-[#1a1a1c] border border-blue-500/50 rounded-md mx-2 my-0.5 z-20"
            style={{ paddingLeft: `${paddingLeft}px` }}
        >
            <span className="text-gray-400 flex-shrink-0 mr-2 opacity-80">
                {icon}
            </span>
            <input 
                ref={inputRef}
                type="text"
                className="bg-transparent border-none text-white text-[13px] outline-none w-full p-0 leading-none font-medium placeholder-gray-600"
                value={value}
                placeholder={placeholder}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onClick={(e) => e.stopPropagation()}
                spellCheck={false}
            />
        </div>
    );
};

// --- Creation Dropdown Menu ---
const CreateDropdown: React.FC<{ 
    onSelect: (type: 'folder' | 'note', subType?: NoteType) => void;
    t: TranslateFn;
}> = ({ onSelect, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
        }, 300); 
    };

    const menuItems: CreateMenuItem[] = [
        { label: t('notes.sidebar.actions.new_folder'), icon: FolderPlus, type: 'folder', color: 'text-yellow-500' },
        { label: '', divider: true },
        { label: t('notes.editor.types.doc'), icon: FileText, type: 'note', subType: 'doc', color: 'text-blue-400' },
        { label: t('notes.editor.types.article'), icon: Layout, type: 'note', subType: 'article', color: 'text-purple-400' },
        { label: t('notes.editor.types.code'), icon: Code, type: 'note', subType: 'code', color: 'text-green-400' },
        { label: t('notes.editor.types.log'), icon: Clock, type: 'note', subType: 'log', color: 'text-orange-400' },
    ];

    return (
        <div 
            className="relative h-full flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button 
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isOpen ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'}`}
            >
                <Plus size={16} />
                <ChevronDown size={10} className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-[#1e1e20] border border-[#333] shadow-2xl rounded-lg py-1 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-75 origin-top-right">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#27272a] mb-0.5">
                        {t('studio.common.create')}
                    </div>
                    {menuItems.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} className="h-[1px] bg-[#27272a] my-1 mx-2" />
                        ) : (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(item.type, item.subType);
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-[#27272a] hover:text-white transition-colors group"
                            >
                                {item.icon && <item.icon size={14} className={`${item.color} group-hover:text-white transition-colors`} />}
                                <span>{item.label}</span>
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Context Menu Component ---
const ContextMenu: React.FC<{
    x: number;
    y: number;
    item: TreeItem;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onCreateNote: () => void;
    onCreateFolder: () => void;
    onToggleFavorite: () => void;
    t: TranslateFn;
}> = ({ x, y, item, onClose, onRename, onDelete, onCreateNote, onCreateFolder, onToggleFavorite, t }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const style: React.CSSProperties = {
        top: Math.min(y, window.innerHeight - 250),
        left: Math.min(x, window.innerWidth - 180),
    };

    return (
        <div 
            ref={menuRef}
            className="fixed z-[100] w-52 bg-[#1e1e20] border border-[#333] shadow-2xl rounded-lg py-1 flex flex-col text-sm text-gray-200 animate-in fade-in duration-75 select-none"
            style={style}
        >
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 border-b border-[#27272a] mb-1 flex items-center gap-2 truncate bg-[#252526] rounded-t-md">
                {item.kind === 'folder' ? (
                     <Folder size={14} className="text-[#dcb67a]" fill="currentColor" fillOpacity={0.2} />
                ) : (
                     <FileText size={14} className="text-blue-500" />
                )}
                <span className="truncate text-gray-300">{item.kind === 'folder' ? item.name : item.title}</span>
            </div>
            
            {item.kind === 'folder' && (
                <>
                    <MenuOption onClick={onCreateNote} icon={<FilePlus size={14} />} label={t('notes.sidebar.actions.new_page')} />
                    <MenuOption onClick={onCreateFolder} icon={<FolderPlus size={14} />} label={t('notes.sidebar.actions.new_folder')} />
                    <div className="h-[1px] bg-[#27272a] my-1 mx-2" />
                </>
            )}
            
            {item.kind === 'note' && (
                 <MenuOption onClick={onToggleFavorite} icon={<Star size={14} className={item.isFavorite ? "text-yellow-500 fill-yellow-500" : ""} />} label={item.isFavorite ? "Unfavorite" : "Favorite"} />
            )}

            <MenuOption onClick={onRename} icon={<Edit2 size={14} />} label={t('notes.sidebar.actions.rename')} shortcut="F2" />
            
            <div className="h-[1px] bg-[#27272a] my-1 mx-2" />
            <MenuOption onClick={onDelete} icon={<Trash2 size={14} />} label={t('notes.sidebar.actions.delete')} danger shortcut="Del" />
        </div>
    );
};

const MenuOption: React.FC<MenuOptionProps> = ({ onClick, icon, label, danger = false, shortcut }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`
            flex items-center justify-between px-3 py-1.5 text-left w-full transition-colors group
            ${danger ? 'text-red-400 hover:bg-[#3a1d1d] hover:text-red-200' : 'text-gray-300 hover:bg-[#27272a] hover:text-white'}
        `}
    >
        <div className="flex items-center gap-2.5">
            <span className="opacity-70 group-hover:opacity-100">{icon}</span>
            <span>{label}</span>
        </div>
        {shortcut && <span className="text-[10px] opacity-40 group-hover:opacity-80">{shortcut}</span>}
    </button>
);

// --- Sidebar Item Row ---
const SidebarItemRow: React.FC<{
    item: TreeItem;
    level: number;
    isSelected: boolean;
    isExpanded: boolean;
    isDragOver: boolean;
    isRenaming: boolean;
    onRenameCommit: (val: string) => void;
    onRenameCancel: () => void;
    onClick: (e: React.MouseEvent) => void;
    onToggle: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    containerRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ 
    item, level, isSelected, isExpanded, isDragOver, isRenaming,
    onRenameCommit, onRenameCancel,
    onClick, onToggle, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop, containerRef
}) => {
    
    const isFolder = item.kind === 'folder';
    
    // Icon Selection Logic
    let Icon = GenericFile;
    let iconClass = "text-gray-500"; 
    
    if (isFolder) {
        Icon = isExpanded ? FolderOpen : Folder;
        iconClass = "text-[#dcb67a]"; 
        if (isDragOver) iconClass = "text-blue-500";
    } else {
        Icon = TYPE_ICONS[item.type] || FileText;
        if (isSelected) iconClass = "text-white";
    }
    
    // Render Inline Input if Renaming
    if (isRenaming) {
        return (
            <SidebarItemInput 
                initialValue={item.kind === 'folder' ? item.name : item.title}
                onCommit={onRenameCommit}
                onCancel={onRenameCancel}
                level={level}
                icon={<Icon size={14} className={iconClass} fill={isFolder ? "currentColor" : "none"} fillOpacity={isFolder ? 0.2 : 0} />}
            />
        );
    }

    const paddingLeft = 12 + (level * 12); 

    // Scroll into view if selected
    useEffect(() => {
        if (isSelected && containerRef?.current) {
             containerRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isSelected]);

    return (
        <div 
            ref={isSelected ? containerRef : undefined}
            className={`
                group relative flex items-center h-[30px] pr-2 cursor-pointer text-sm transition-all select-none mx-2 rounded-md
                ${isSelected 
                    ? 'bg-[#1e1e20] text-white' 
                    : 'text-gray-400 hover:bg-[#1a1a1c] hover:text-gray-200'
                }
                ${isDragOver ? 'bg-[#1e1e20] ring-1 ring-inset ring-blue-500 z-10' : ''}
            `}
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={onClick}
            onContextMenu={onContextMenu}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Expansion Arrow */}
            <div 
                className={`w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-colors mr-1 -ml-1 ${!isFolder ? 'invisible' : ''}`}
                onClick={onToggle}
            >
                <ChevronRight size={12} className={`transition-transform duration-100 ${isExpanded ? 'rotate-90 text-gray-400' : 'text-gray-600'}`} />
            </div>

            <Icon size={16} className={`${iconClass} flex-shrink-0 mr-2 transition-colors`} fill={isFolder ? "currentColor" : "none"} fillOpacity={isFolder ? 0.2 : 0} />

            <span className={`truncate flex-1 font-medium text-[13px] ${item.kind === 'note' && isSelected ? 'text-white' : ''}`}>
                {isFolder ? item.name : item.title || 'Untitled'}
            </span>
            
            {/* Context Menu Trigger (Hover) */}
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center ${isSelected ? 'opacity-100' : ''}`}>
                <button className="p-1 hover:bg-[#2a2a2d] rounded text-gray-500 hover:text-white" onClick={onContextMenu}>
                    <MoreHorizontal size={14} />
                </button>
            </div>
        </div>
    );
};

// --- Section Header ---
const SectionHeader: React.FC<{ title: string; isOpen: boolean; onToggle: () => void }> = ({ title, isOpen, onToggle }) => (
    <button 
        onClick={onToggle}
        className="flex items-center gap-1 w-full px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors focus:outline-none mt-2"
    >
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
        {title}
    </button>
);

// --- Header Action Button ---
const HeaderAction: React.FC<{ icon: React.ReactNode; onClick: () => void; tooltip: string; active?: boolean }> = ({ icon, onClick, tooltip, active }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`
            p-1.5 rounded-lg transition-colors
            ${active ? 'text-white bg-[#1e1e20]' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1c]'}
        `}
        title={tooltip}
    >
        {icon}
    </button>
);

// --- MAIN COMPONENT ---

export const NoteSidebar: React.FC = () => {
    const { 
        treeData, activeNoteId, setActiveNoteId, 
        createNote, createFolder, deleteItem, updateNote, renameFolder,
        toggleFolderExpand, moveItem, favoriteNotes, toggleFavorite, expandedFolders,
        folders, notes
    } = useNoteStore();
    const { t } = useTranslation();

    // Local UI State
    const [search, setSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [creationState, setCreationState] = useState<{ type: 'folder' | 'note', subType?: NoteType, parentId: string | null } | null>(null);

    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: TreeItem } | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    // Sync selection with active note
    useEffect(() => {
        if (activeNoteId) setSelectedId(activeNoteId);
    }, [activeNoteId]);

    // Sections
    const [showFavorites, setShowFavorites] = useState(true);
    const [showNotebooks, setShowNotebooks] = useState(true);

    // Auto-focus search
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
            setSearch('');
        }
    }, [isSearchOpen]);

    // Flatten tree logic for keyboard navigation
    const getVisibleItems = useCallback(() => {
        const visible: TreeItem[] = [];
        const traverse = (items: TreeItem[]) => {
            for (const item of items) {
                // Apply search filter if active
                if (search && !((item.kind === 'folder' ? item.name : item.title).toLowerCase().includes(search.toLowerCase()))) {
                    continue;
                }
                
                visible.push(item);
                if (item.kind === 'folder' && expandedFolders.has(item.id) && item.children) {
                    traverse(item.children);
                }
            }
        };
        traverse(treeData);
        return visible;
    }, [treeData, expandedFolders, search]);

    const handleDelete = async (item: TreeItem) => {
        if (confirm(`${t('common.actions.delete')} "${item.kind === 'folder' ? item.name : item.title}"?`)) {
            await deleteItem(item.id, item.kind);
            if (selectedId === item.id) {
                setSelectedId(null);
            }
        }
        setContextMenu(null);
    };

    // Keyboard Handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (renamingId || creationState || isSearchOpen) return;

        if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            const visible = getVisibleItems();
            const currentIndex = visible.findIndex(i => i.id === selectedId);
            
            if (e.key === 'ArrowDown') {
                const next = visible[currentIndex + 1];
                if (next) setSelectedId(next.id);
            } else if (e.key === 'ArrowUp') {
                const prev = visible[currentIndex - 1];
                if (prev) setSelectedId(prev.id);
            }
        } 
        else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (selectedId) {
                const visible = getVisibleItems();
                const item = visible.find(i => i.id === selectedId);
                if (item && item.kind === 'folder' && !expandedFolders.has(item.id)) {
                    toggleFolderExpand(item.id);
                }
            }
        }
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (selectedId) {
                const visible = getVisibleItems();
                const item = visible.find(i => i.id === selectedId);
                if (item) {
                    if (item.kind === 'folder' && expandedFolders.has(item.id)) {
                        toggleFolderExpand(item.id);
                    } else if (item.parentId) {
                        setSelectedId(item.parentId);
                    }
                }
            }
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedId) {
                const visible = getVisibleItems();
                const item = visible.find(i => i.id === selectedId);
                if (item) {
                    if (item.kind === 'note') setActiveNoteId(item.id);
                    else toggleFolderExpand(item.id);
                }
            }
        }
        else if (e.key === 'F2') {
             if (selectedId) setRenamingId(selectedId);
        }
        else if (e.key === 'Delete') {
             if (selectedId) {
                 const visible = getVisibleItems();
                 const item = visible.find(i => i.id === selectedId);
                 if (item) handleDelete(item);
             }
        }
    };

    // --- Smart Create Logic Helpers ---
    const getTargetParentId = (): string | null => {
        if (!selectedId) return null; 
        
        const folder = folders.find(f => f.id === selectedId);
        if (folder) return folder.id;

        const note = notes.find(n => n.id === selectedId);
        if (note) return note.parentId;
        
        return null; 
    };

    // --- Creation Handlers ---
    const initiateCreate = (type: 'folder' | 'note', subType: NoteType = 'doc') => {
        const parentId = getTargetParentId();
        if (parentId && !expandedFolders.has(parentId)) {
            toggleFolderExpand(parentId);
        }
        setCreationState({ type, subType, parentId });
    };
    
    const handleCreationCommit = async (name: string) => {
        if (!creationState) return;
        const { type, subType, parentId } = creationState;
        
        try {
            let newId;
            if (type === 'folder') {
                newId = await createFolder(name, parentId);
            } else {
                newId = await createNote(name, subType || 'doc', parentId);
            }
            setSelectedId(newId);
            if (type === 'note') setActiveNoteId(newId);
            
        } catch (e) {
            console.error("Creation failed", e);
        } finally {
            setCreationState(null);
            sidebarRef.current?.focus();
        }
    };

    const handleCreationCancel = () => {
        setCreationState(null);
        sidebarRef.current?.focus();
    };

    // --- Renaming Logic ---
    const handleRenameCommit = async (id: string, newName: string) => {
        const item = notes.find(n => n.id === id) || folders.find(f => f.id === id);
        if (!item) return;

        if ('title' in item) { 
             await updateNote(id, { title: newName });
        } else { 
             const newId = await renameFolder(id, newName);
             if (selectedId === id) setSelectedId(newId);
        }
        setRenamingId(null);
        sidebarRef.current?.focus();
    };

    // --- Interaction Handlers ---
    const handleItemClick = (e: React.MouseEvent, item: TreeItem) => {
        e.stopPropagation();
        if (renamingId) return; 
        setSelectedId(item.id);
        
        if (item.kind === 'note') {
            setActiveNoteId(item.id);
        }
    };

    const handleItemToggle = (e: React.MouseEvent, item: TreeItem) => {
        e.stopPropagation();
        if (item.kind === 'folder') toggleFolderExpand(item.id);
    };

    const handleContextMenu = (e: React.MouseEvent, item: TreeItem) => {
        e.preventDefault();
        e.stopPropagation();
        if (renamingId || creationState) return;
        
        setSelectedId(item.id); 
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const handleDragStart = (e: React.DragEvent, item: TreeItem) => {
        if (renamingId || creationState) { e.preventDefault(); return; }
        const dragPayload: DragPayload = { id: item.id, kind: item.kind };
        e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    };
    const handleDragOver = (e: React.DragEvent, item: TreeItem) => {
        e.preventDefault();
        if (item.kind === 'folder' && item.id !== selectedId) {
            setDragOverId(item.id);
            e.dataTransfer.dropEffect = 'move';
        }
    };
    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        setDragOverId(null);
        try {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
                const parsed: unknown = JSON.parse(data);
                if (isDragPayload(parsed) && parsed.id !== targetId) {
                    moveItem(parsed.id, parsed.kind, targetId);
                }
            }
        } catch (err) {
            logger.warn('[NoteSidebar] Drag drop parse failed', err);
        }
    };

    const startRename = (id: string) => {
        setContextMenu(null);
        setRenamingId(id);
    };

    // --- Recursive Tree Render ---
    const renderTreeNodes = (items: TreeItem[], level = 0, parentId: string | null = null) => {
        let nodesToRender = [...items];
        const isCreatingHere = creationState && creationState.parentId === parentId;
        
        if (search) {
             nodesToRender = nodesToRender.filter(i => (i.kind === 'folder' ? i.name : i.title).toLowerCase().includes(search.toLowerCase()));
        }

        const nodes = nodesToRender.map(item => {
            const isFolder = item.kind === 'folder';
            return (
                <div key={item.id}>
                    <SidebarItemRow 
                        item={item}
                        level={level}
                        isSelected={selectedId === item.id}
                        isExpanded={!!(isFolder && item.isExpanded)}
                        isDragOver={dragOverId === item.id}
                        isRenaming={renamingId === item.id}
                        onRenameCommit={(val) => handleRenameCommit(item.id, val)}
                        onRenameCancel={() => setRenamingId(null)}
                        onClick={(e) => handleItemClick(e, item)}
                        onToggle={(e) => handleItemToggle(e, item)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={(e) => {
                            if (isFolder) {
                                handleDrop(e, item.id);
                            }
                        }}
                        containerRef={itemRef}
                    />
                    {isFolder && item.isExpanded && (
                        <div>
                             {renderTreeNodes(item.children || [], level + 1, item.id)}
                        </div>
                    )}
                </div>
            );
        });

        if (isCreatingHere && !search) {
             let TempIcon = FolderPlus;
             let iconClass = "text-yellow-500";

             if (creationState.type === 'note') {
                 TempIcon = TYPE_ICONS[creationState.subType || 'doc'] || FileText;
                 iconClass = "text-blue-400";
             }
             
             nodes.unshift(
                 <div key="creating-temp">
                     <SidebarItemInput 
                         initialValue=""
                         placeholder={creationState.type === 'folder' ? t('drive.sidebar.folder_name') : "Untitled"}
                         onCommit={handleCreationCommit}
                         onCancel={handleCreationCancel}
                         level={level}
                         icon={<TempIcon size={14} className={iconClass} />}
                     />
                 </div>
             );
        }

        if (nodes.length === 0 && level > 0 && !search) {
             return (
                 <div className="py-1 text-[11px] text-gray-600 italic select-none" style={{ paddingLeft: `${12 + (level * 12) + 20}px` }}>
                    {t('notes.sidebar.empty_folder')}
                 </div>
             );
        }

        return nodes;
    };

    return (
        <div 
            ref={sidebarRef}
            className="w-full bg-[#09090b] flex flex-col h-full flex-none font-sans text-sm select-none border-r border-[#27272a] outline-none"
            onClick={() => { if(!renamingId) { setSelectedId(null); setRenamingId(null); } }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* 1. Unified Toolbar */}
            <div className="flex-none h-12 px-3 flex items-center justify-between bg-[#09090b] z-20 border-b border-[#27272a]">
                {isSearchOpen ? (
                    <div className="flex-1 flex items-center bg-[#1e1e20] rounded-lg border border-[#333] px-2 mx-1 animate-in fade-in zoom-in-95 duration-100">
                        <Search size={12} className="text-gray-400 mr-2" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setIsSearchOpen(false)}
                            className="flex-1 bg-transparent border-none outline-none text-xs text-white h-7 placeholder-gray-600"
                            placeholder="Filter..."
                        />
                        <button onClick={() => { setIsSearchOpen(false); setSearch(''); }} className="text-gray-400 hover:text-white">
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-1">
                             <HeaderAction 
                                icon={<Search size={16} />} 
                                onClick={() => setIsSearchOpen(true)} 
                                tooltip={t('common.actions.search')} 
                            />
                        </div>
                        
                        <div className="flex items-center gap-1">
                             <CreateDropdown onSelect={initiateCreate} t={t} />
                        </div>
                    </>
                )}
            </div>

            {/* 2. Scrollable Content */}
            <div 
                className="flex-1 overflow-y-auto custom-scrollbar py-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); }}
            >
                {/* Empty State */}
                {treeData.length === 0 && !search && !creationState && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3 px-6 text-center animate-in fade-in">
                        <BookOpen size={24} className="opacity-20" />
                        <p className="text-xs">{t('notes.sidebar.no_pages')}</p>
                        <button 
                            onClick={() => initiateCreate('note')}
                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 mt-2"
                        >
                            <Plus size={12} /> {t('notes.sidebar.actions.new_page')}
                        </button>
                    </div>
                )}

                {/* Favorites */}
                {favoriteNotes.length > 0 && !search && (
                    <div className="mb-2">
                         <SectionHeader title={t('notes.favorites')} isOpen={showFavorites} onToggle={() => setShowFavorites(!showFavorites)} />
                         {showFavorites && (
                             <div className="mt-0.5">
                                 {favoriteNotes.map(note => (
                                     <SidebarItemRow 
                                         key={`fav-${note.id}`}
                                         item={{ ...note, kind: 'note' } as TreeItem}
                                         level={0}
                                         isSelected={selectedId === note.id}
                                         isExpanded={false}
                                         isDragOver={false}
                                         isRenaming={false} 
                                         onRenameCommit={() => {}}
                                         onRenameCancel={() => {}}
                                         onClick={(e) => handleItemClick(e, { ...note, kind: 'note' } as TreeItem)}
                                         onToggle={() => {}}
                                         onContextMenu={(e) => handleContextMenu(e, { ...note, kind: 'note' } as TreeItem)}
                                         onDragStart={(e) => handleDragStart(e, { ...note, kind: 'note' } as TreeItem)}
                                         onDragOver={() => {}}
                                         onDragLeave={() => {}}
                                         onDrop={(e) => { e.preventDefault(); }}
                                     />
                                 ))}
                             </div>
                         )}
                    </div>
                )}

                {/* Notebooks Tree */}
                {(treeData.length > 0 || search || creationState) && (
                    <div className="mb-4">
                        {favoriteNotes.length > 0 && !search && (
                             <SectionHeader title={t('notes.sidebar.notebooks')} isOpen={showNotebooks} onToggle={() => setShowNotebooks(!showNotebooks)} />
                        )}
                        
                        {(showNotebooks || search) && (
                             <div className="mt-0.5 pb-8">
                                 {renderTreeNodes(treeData, 0, null)}
                             </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Footer */}
            <div className="flex-none p-3 border-t border-[#27272a] bg-[#09090b]">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c] w-full rounded-lg text-xs transition-colors">
                    <Trash2 size={14} />
                    <span>{t('notes.sidebar.trash')}</span>
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu 
                    {...contextMenu} 
                    onClose={() => setContextMenu(null)}
                    onRename={() => startRename(contextMenu.item.id)}
                    onDelete={() => handleDelete(contextMenu.item)}
                    onCreateNote={() => { 
                        const targetParent = contextMenu.item.kind === 'folder' ? contextMenu.item.id : contextMenu.item.parentId;
                        if (targetParent && !expandedFolders.has(targetParent)) toggleFolderExpand(targetParent);
                        setCreationState({ type: 'note', parentId: targetParent, subType: 'doc' });
                        setContextMenu(null); 
                    }}
                    onCreateFolder={() => {
                        const targetParent = contextMenu.item.kind === 'folder' ? contextMenu.item.id : contextMenu.item.parentId;
                        if (targetParent && !expandedFolders.has(targetParent)) toggleFolderExpand(targetParent);
                        setCreationState({ type: 'folder', parentId: targetParent });
                        setContextMenu(null);
                    }}
                    onToggleFavorite={() => { toggleFavorite(contextMenu.item.id); setContextMenu(null); }}
                    t={t}
                />
            )}
        </div>
    );
};
