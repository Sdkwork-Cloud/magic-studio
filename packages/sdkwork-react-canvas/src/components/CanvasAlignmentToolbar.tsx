
import React from 'react';
import { 
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
    StretchHorizontal, StretchVertical,
    Group, Ungroup
} from 'lucide-react';
import { useCanvasStore } from '../store';

export const CanvasAlignmentToolbar: React.FC = () => {
    const selectedIds = useCanvasStore(s => s.selectedIds);
    const elements = useCanvasStore(s => s.elements);
    const alignSelected = useCanvasStore(s => s.alignSelected);
    const distributeSelected = useCanvasStore(s => s.distributeSelected);
    const groupSelected = useCanvasStore(s => s.groupSelected);
    const ungroupSelected = useCanvasStore(s => s.ungroupSelected);

    // Analyze selection state
    const selectionCount = selectedIds.size;
    if (selectionCount === 0) return null;

    // Check if we have a single group selected (to show Ungroup)
    let isSingleGroupSelected = false;
    if (selectionCount === 1) {
        const id = Array.from(selectedIds)[0];
        const el = elements.find(e => e.id === id);
        if (el && el.type === 'group') isSingleGroupSelected = true;
    }

    return (
        <div 
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-[#1e1e1e]/90 backdrop-blur-xl border border-[#333] rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/10 select-none"
            onMouseDown={(e) => e.stopPropagation()} // Prevent deselection
        >
            
            {/* Grouping Actions - The Mouse Operation */}
            {selectionCount > 1 && (
                <>
                    <ToolButton 
                        icon={<Group size={16} />} 
                        onClick={groupSelected} 
                        label={`Group ${selectionCount} items (Ctrl+G)`}
                        shortcut="⌘G"
                        highlight
                    />
                    <div className="w-[1px] h-4 bg-[#333] mx-1" />
                </>
            )}

            {isSingleGroupSelected && (
                 <>
                    <ToolButton 
                        icon={<Ungroup size={16} />} 
                        onClick={ungroupSelected} 
                        label="Ungroup (Ctrl+Shift+G)" 
                        shortcut="⇧⌘G"
                    />
                    <div className="w-[1px] h-4 bg-[#333] mx-1" />
                </>
            )}

            {/* Alignment (Only if > 1 item) */}
            {selectionCount > 1 && (
                <>
                    <ToolButton icon={<AlignStartVertical size={16} />} onClick={() => alignSelected('left')} label="Align Left" />
                    <ToolButton icon={<AlignCenterVertical size={16} />} onClick={() => alignSelected('center')} label="Align Center" />
                    <ToolButton icon={<AlignEndVertical size={16} />} onClick={() => alignSelected('right')} label="Align Right" />
                    
                    <div className="w-[1px] h-4 bg-[#333] mx-1" />
                    
                    <ToolButton icon={<AlignStartHorizontal size={16} />} onClick={() => alignSelected('top')} label="Align Top" />
                    <ToolButton icon={<AlignCenterHorizontal size={16} />} onClick={() => alignSelected('middle')} label="Align Middle" />
                    <ToolButton icon={<AlignEndHorizontal size={16} />} onClick={() => alignSelected('bottom')} label="Align Bottom" />
                    
                    <div className="w-[1px] h-4 bg-[#333] mx-1" />
                    
                    <ToolButton icon={<StretchHorizontal size={16} />} onClick={() => distributeSelected('horizontal')} label="Distribute Horizontally" />
                    <ToolButton icon={<StretchVertical size={16} />} onClick={() => distributeSelected('vertical')} label="Distribute Vertically" />
                </>
            )}

            {/* Selection Info */}
            <div className="ml-2 px-2 py-0.5 bg-[#2a2a2c] rounded text-[10px] font-bold text-gray-400 border border-[#333]">
                {selectionCount} Selected
            </div>
        </div>
    );
};

const ToolButton = ({ icon, onClick, label, shortcut, highlight }: any) => (
    <button 
        onClick={onClick}
        className={`
            p-2 rounded-lg transition-all relative group
            ${highlight 
                ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300' 
                : 'text-gray-400 hover:text-white hover:bg-[#333]'
            }
        `}
    >
        {icon}
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#333] shadow-lg flex items-center gap-2">
            <span>{label}</span>
            {shortcut && <span className="text-gray-500 font-mono">{shortcut}</span>}
        </div>
    </button>
);
