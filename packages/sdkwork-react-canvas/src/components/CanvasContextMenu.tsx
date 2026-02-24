

 
import React, { useEffect, useRef } from 'react';
import { 
    Copy, Trash2, ArrowUp, ArrowDown, 
    Maximize, RefreshCcw, Clipboard, Ungroup, Group
} from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
;

interface CanvasContextMenuProps {
    x: number;
    y: number;
    targetId: string | null;
    onClose: () => void;
    onAction: (action: string) => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ 
    x, y, targetId, onClose, onAction 
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedIds = useCanvasStore(s => s.selectedIds);
    const elements = useCanvasStore(s => s.elements);
    const groupSelected = useCanvasStore(s => s.groupSelected);
    const ungroupSelected = useCanvasStore(s => s.ungroupSelected);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Analyze Selection for Context Options
    const selectionCount = selectedIds.size;
    let canUngroup = false;
    
    // If exactly one item is selected and it's a group, we can ungroup
    if (selectionCount === 1) {
        const id = Array.from(selectedIds)[0];
        const el = elements.find(e => e.id === id);
        if (el && el.type === 'group') canUngroup = true;
    }

    const handleGroupAction = () => {
        groupSelected();
        onClose();
    };

    const handleUngroupAction = () => {
        ungroupSelected();
        onClose();
    };

    const style = {
        top: Math.min(y, window.innerHeight - 280),
        left: Math.min(x, window.innerWidth - 200),
    };

    return (
        <div 
            ref={menuRef}
            className="fixed z-[100] w-56 bg-[#1e1e1e]/95 backdrop-blur-md border border-[#333] rounded-xl shadow-2xl py-1.5 flex flex-col animate-in fade-in zoom-in-95 duration-75 select-none text-gray-200 ring-1 ring-white/10"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => e.stopPropagation()} // Critical: Prevent canvas click-through clearing selection
        >
            {targetId || selectionCount > 0 ? (
                <>
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 border-b border-white/5 mx-1">
                        Selection ({selectionCount})
                    </div>
                    
                    {selectionCount > 1 && (
                        <MenuItem onClick={handleGroupAction} icon={<Group size={14} />} label="Group Selection" shortcut="Ctrl+G" />
                    )}
                    
                    {canUngroup && (
                        <MenuItem onClick={handleUngroupAction} icon={<Ungroup size={14} />} label="Ungroup" shortcut="Ctrl+Shift+G" />
                    )}

                    <MenuItem onClick={() => onAction('duplicate')} icon={<Copy size={14} />} label="Duplicate" shortcut="Ctrl+D" />
                    
                    <div className="h-[1px] bg-[#333] my-1 mx-2" />
                    
                    <MenuItem onClick={() => onAction('front')} icon={<ArrowUp size={14} />} label="Bring to Front" />
                    <MenuItem onClick={() => onAction('back')} icon={<ArrowDown size={14} />} label="Send to Back" />
                    <div className="h-[1px] bg-[#333] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('delete')} icon={<Trash2 size={14} />} label="Delete" danger shortcut="Del" />
                </>
            ) : (
                <>
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 border-b border-white/5 mx-1">
                        Canvas
                    </div>
                    <MenuItem onClick={() => onAction('paste')} icon={<Clipboard size={14} />} label="Paste Here" shortcut="Ctrl+V" />
                    <MenuItem onClick={() => onAction('select-all')} icon={<Maximize size={14} />} label="Select All" shortcut="Ctrl+A" />
                    <div className="h-[1px] bg-[#333] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('reset-view')} icon={<RefreshCcw size={14} />} label="Reset View" />
                </>
            )}
        </div>
    );
};

const MenuItem = ({ onClick, icon, label, shortcut, danger }: any) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center gap-3 px-3 py-2 text-xs w-full text-left transition-colors relative group mx-1 rounded-lg max-w-[calc(100%-8px)]
            ${danger ? 'text-red-400 hover:bg-[#3a2020] hover:text-red-200' : 'text-gray-300 hover:bg-[#094771] hover:text-white'}
        `}
    >
        <span className="opacity-70 group-hover:opacity-100">{icon}</span>
        <span className="flex-1 font-medium">{label}</span>
        {shortcut && <span className="text-[10px] opacity-40 font-mono bg-[#2a2a2c] px-1 rounded border border-[#333]">{shortcut}</span>}
    </button>
);
