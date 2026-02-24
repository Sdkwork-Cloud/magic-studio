
import React from 'react';
import { Group, Ungroup, Trash2, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { Rect } from 'sdkwork-react-commons';

interface SelectionOverlayProps {
    bounds: Rect | null;
    zoom: number;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ bounds, zoom }) => {
    const groupSelected = useCanvasStore(s => s.groupSelected);
    const ungroupSelected = useCanvasStore(s => s.ungroupSelected);
    const removeSelected = useCanvasStore(s => s.removeSelected);
    const alignSelected = useCanvasStore(s => s.alignSelected);
    const selectedIds = useCanvasStore(s => s.selectedIds);
    const elements = useCanvasStore(s => s.elements);

    if (!bounds || selectedIds.size === 0) return null;

    const selectedElements = elements.filter(e => selectedIds.has(e.id));
    const hasGroup = selectedElements.some(e => e.type === 'group');
    const canGroup = selectedIds.size >= 2 && !hasGroup;
    const canUngroup = hasGroup;

    const toolbarScale = 1 / Math.max(0.5, zoom);

    return (
        <div 
            className="absolute pointer-events-none z-[100] transition-all duration-75 ease-out"
            style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
            }}
        >
            {/* Animated Dashed Border */}
            <div className="absolute inset-0 border-2 border-blue-500 border-dashed animate-march-ants pointer-events-none opacity-80" />
            
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white shadow-sm" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white shadow-sm" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white shadow-sm" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white shadow-sm" />

            {/* Contextual Toolbar */}
            <div 
                className="absolute pointer-events-auto flex justify-center"
                style={{ 
                    top: '-50px',
                    left: '50%',
                    transform: `translateX(-50%) scale(${toolbarScale})`,
                    transformOrigin: 'bottom center'
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-1 bg-[#1e1e1e]/90 backdrop-blur-xl border border-[#333] p-1.5 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 ring-1 ring-white/10">
                    {/* Item Count */}
                    <span className="text-[10px] text-gray-400 font-bold px-2 border-r border-[#333] select-none">
                        {selectedIds.size} {selectedIds.size === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                    
                    {/* Alignment Tools (only for 2+ items) */}
                    {selectedIds.size >= 2 && (
                        <div className="flex items-center gap-0.5 px-1 border-r border-[#333]">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); alignSelected('left'); }}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Align Left"
                            >
                                <AlignLeft size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); alignSelected('center'); }}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Align Center"
                            >
                                <AlignCenter size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); alignSelected('right'); }}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Align Right"
                            >
                                <AlignRight size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); alignSelected('top'); }}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Align Top"
                            >
                                <AlignStartVertical size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); alignSelected('middle'); }}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Align Middle"
                            >
                                <AlignCenterVertical size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); alignSelected('bottom'); }}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Align Bottom"
                            >
                                <AlignEndVertical size={12} />
                            </button>
                        </div>
                    )}
                    
                    {/* Group/Ungroup */}
                    {canGroup && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); groupSelected(); }}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 group"
                            title="Group (Ctrl+G)"
                        >
                            <Group size={12} className="group-hover:rotate-12 transition-transform" />
                            <span>Group</span>
                        </button>
                    )}
                    
                    {canUngroup && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); ungroupSelected(); }}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95 group"
                            title="Ungroup (Ctrl+Shift+G)"
                        >
                            <Ungroup size={12} />
                            <span>Ungroup</span>
                        </button>
                    )}

                    {/* Delete */}
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSelected(); }}
                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors border-l border-[#333] ml-1 pl-2"
                        title="Delete (Delete/Backspace)"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Dimensions Label */}
            <div 
                className="absolute -bottom-8 left-1/2 bg-blue-600/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none origin-top"
                style={{ transform: `translateX(-50%) scale(${toolbarScale})` }}
            >
                {Math.round(bounds.width / zoom)} x {Math.round(bounds.height / zoom)}
            </div>

            <style>{`
                @keyframes march {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 20; }
                }
                .animate-march-ants {
                    animation: march 1s linear infinite;
                    stroke-dasharray: 8 4;
                }
            `}</style>
        </div>
    );
};
