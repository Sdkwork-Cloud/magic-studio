
import { CanvasElementType } from '../entities';
import { NodeFactory } from '../services/nodeFactory';
import React from 'react';
import { 
    MousePointer2, Type, Image as ImageIcon, Film, 
    StickyNote, Square, Undo, Redo
} from 'lucide-react';
import { useCanvasStore } from '../store'; 
import { getCanvasViewportSize } from '../utils/canvasContainer';

export const CanvasToolbar: React.FC = () => {
    // Zustand Hooks
    const addElement = useCanvasStore(s => s.addElement);
    const viewport = useCanvasStore(s => s.viewport);
    const undo = useCanvasStore(s => s.undo);
    const redo = useCanvasStore(s => s.redo);
    const canUndo = useCanvasStore(s => s.past.length > 0);
    const canRedo = useCanvasStore(s => s.future.length > 0);

    const handleAdd = (type: CanvasElementType) => {
        const viewportSize = getCanvasViewportSize();
        const containerWidth = viewportSize.width;
        const containerHeight = viewportSize.height;
        
        // Calculate World Center
        const centerX = (containerWidth / 2 - viewport.x) / viewport.zoom;
        const centerY = (containerHeight / 2 - viewport.y) / viewport.zoom;
        
        // Use Factory
        const element = NodeFactory.create({
            type,
            x: centerX, 
            y: centerY
        });
        
        // Center the new element
        element.x = centerX - (element.width / 2);
        element.y = centerY - (element.height / 2);

        addElement(element);
    };

    return (
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 p-1.5 bg-[#18181b]/90 backdrop-blur-md border border-[#27272a] rounded-2xl shadow-xl z-40 select-none">
            {/* History Controls */}
            <div className="flex flex-col gap-1 pb-2 border-b border-[#333] mb-1">
                <ToolButton 
                    icon={<Undo size={20} />} 
                    label="Undo (Ctrl+Z)" 
                    onClick={undo} 
                    disabled={!canUndo} 
                    className={!canUndo ? "opacity-30 cursor-not-allowed" : ""}
                />
                <ToolButton 
                    icon={<Redo size={20} />} 
                    label="Redo (Ctrl+Shift+Z)" 
                    onClick={redo} 
                    disabled={!canRedo} 
                    className={!canRedo ? "opacity-30 cursor-not-allowed" : ""}
                />
            </div>

            <ToolButton icon={<MousePointer2 size={20} />} label="Select" active />
            <div className="h-[1px] bg-[#333] mx-2" />
            <ToolButton icon={<ImageIcon size={20} />} label="Image Gen" onClick={() => handleAdd('image')} />
            <ToolButton icon={<Film size={20} />} label="Video Gen" onClick={() => handleAdd('video')} />
            <div className="h-[1px] bg-[#333] mx-2" />
            <ToolButton icon={<Type size={20} />} label="Text" onClick={() => handleAdd('text')} />
            <ToolButton icon={<StickyNote size={20} />} label="Note" onClick={() => handleAdd('note')} />
            <ToolButton icon={<Square size={20} />} label="Shape" onClick={() => handleAdd('shape')} />
        </div>
    );
};

const ToolButton = ({ icon, label, onClick, active, disabled, className }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            p-2.5 rounded-xl transition-all group relative flex items-center justify-center
            ${active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:text-white hover:bg-[#27272a]'
            }
            ${className}
        `}
    >
        {icon}
        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#333]">
            {label}
        </div>
    </button>
);
