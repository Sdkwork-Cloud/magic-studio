
import React from 'react';
import { AnyAsset, TextAsset } from '../../../services/assets/AssetTypes';
import { Type, Plus } from 'lucide-react';

interface TextResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export const TextResourcePanel: React.FC<TextResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite
}) => {
    return (
        <div className="grid grid-cols-4 gap-2 content-start pb-10 px-2">
            {(assets as TextAsset[]).map((item) => {
                const meta = item.metadata || {};
                
                // Construct preview style
                const displayStyle: React.CSSProperties = {
                    fontFamily: meta.fontFamily || 'sans-serif',
                    color: meta.color || '#ffffff',
                    WebkitTextStroke: meta.strokeWidth ? `${meta.strokeWidth}px ${meta.strokeColor}` : undefined,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    letterSpacing: meta.letterSpacing ? `${meta.letterSpacing}em` : undefined,
                    fontSize: '12px', // Force small font for card preview
                    lineHeight: 1.1
                };
                
                const category = (item as any).category || 'Text';

                return (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className={`
                            group relative aspect-video bg-[#1e1e1e] border border-[#333] hover:border-yellow-500/50 hover:bg-[#252526] 
                            rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-lg flex flex-col
                            select-none
                        `}
                        title={item.name}
                    >
                        {/* Preview Area */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-1">
                             <div className="absolute inset-0 opacity-5" 
                                  style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} 
                             />
                             
                             <span className="font-bold z-10 truncate max-w-full pointer-events-none text-center px-1" style={displayStyle}>
                                 {meta.text || 'Title'}
                             </span>

                             {/* Hover Add Icon */}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Plus size={16} className="text-white drop-shadow-md" />
                             </div>
                        </div>

                        {/* Footer Info */}
                        <div className="h-5 px-1.5 flex items-center justify-between bg-[#141414] border-t border-[#333]">
                            <span className="text-[8px] text-gray-400 font-bold truncate uppercase tracking-wide flex items-center gap-1">
                                <Type size={8} className="text-yellow-500" />
                                {item.name}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});
