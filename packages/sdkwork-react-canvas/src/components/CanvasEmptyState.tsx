
import { CanvasElementType } from '../entities'
import React from 'react';
import { 
    Image as ImageIcon, Film, Type, StickyNote, LayoutGrid
} from 'lucide-react';
import { useCanvasStore } from '../store';
import { NodeFactory } from '../services';
import { getCanvasViewportSize } from '../utils/canvasContainer';
;
;

export const CanvasEmptyState: React.FC = () => {
    const addElement = useCanvasStore(s => s.addElement);
    const viewport = useCanvasStore(s => s.viewport);

    const handleAdd = (type: CanvasElementType) => {
        const viewportSize = getCanvasViewportSize();
        const containerWidth = viewportSize.width;
        const containerHeight = viewportSize.height;
        
        const centerX = (containerWidth / 2 - viewport.x) / viewport.zoom;
        const centerY = (containerHeight / 2 - viewport.y) / viewport.zoom;
        
        const element = NodeFactory.create({ type, x: centerX, y: centerY });
        // Center adjustment
        element.x -= element.width / 2;
        element.y -= element.height / 2;

        addElement(element);
    };

    return (
        <div className="flex flex-col items-center justify-center pointer-events-auto select-none animate-in fade-in zoom-in-95 duration-500">
            
            {/* Minimal Logo/Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] border border-[#27272a] flex items-center justify-center mb-6 shadow-sm">
                <LayoutGrid size={20} className="text-gray-600" />
            </div>
            
            <h2 className="text-base font-medium text-gray-400 mb-8 tracking-wide">
                Start Creating
            </h2>

            <div className="flex items-center gap-3">
                <ActionButton 
                    icon={<ImageIcon size={18} />} 
                    label="Image" 
                    desc="AI Gen"
                    onClick={() => handleAdd('image')}
                    hoverClass="hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5"
                />
                <ActionButton 
                    icon={<Film size={18} />} 
                    label="Video" 
                    desc="AI Gen"
                    onClick={() => handleAdd('video')}
                    hoverClass="hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/5"
                />
                
                <div className="w-px h-10 bg-[#27272a] mx-2" />
                
                <ActionButton 
                    icon={<StickyNote size={18} />} 
                    label="Note" 
                    onClick={() => handleAdd('note')}
                    hoverClass="hover:text-yellow-400 hover:border-yellow-500/30 hover:bg-yellow-500/5"
                />
                <ActionButton 
                    icon={<Type size={18} />} 
                    label="Text" 
                    onClick={() => handleAdd('text')}
                    hoverClass="hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5"
                />
            </div>
            
            <p className="mt-12 text-[10px] text-gray-700 font-mono tracking-widest opacity-60">
                SPACE TO PAN | SCROLL TO ZOOM | ALT+CLICK TO EDIT
            </p>
        </div>
    );
};

const ActionButton = ({ icon, label, desc, onClick, hoverClass }: any) => (
    <button 
        onClick={onClick}
        className={`
            group flex flex-col items-center justify-center w-24 h-24 rounded-xl
            bg-[#121214] border border-[#1f1f22] text-gray-500
            transition-all duration-200 ease-out
            ${hoverClass}
            hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20
        `}
    >
        <div className="mb-2 p-2 rounded-lg bg-[#18181b] group-hover:bg-[#1f1f22] transition-colors border border-[#27272a] group-hover:border-transparent">
            {icon}
        </div>
        <span className="text-xs font-medium text-gray-400 group-hover:text-inherit transition-colors">{label}</span>
        {desc && <span className="text-[9px] opacity-40 mt-0.5">{desc}</span>}
    </button>
);
