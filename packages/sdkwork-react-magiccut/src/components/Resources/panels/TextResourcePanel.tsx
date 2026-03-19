
import React from 'react';
import { AnyAsset, TextAsset } from '@sdkwork/react-assets';
import { Type, Plus, Heart } from 'lucide-react';
import { resolveNextFavoriteState } from '../../../domain/assets/favoriteToggle';
import { getResourceCardFrameClass, getResourcePanelLayoutClass, type ResourcePanelViewMode } from '../../../domain/assets/resourcePanelPresentation';

interface TextResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    viewMode?: ResourcePanelViewMode;
}

export const TextResourcePanel: React.FC<TextResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite,
    viewMode = 'grid'
}) => {
    return (
        <div className={getResourcePanelLayoutClass(viewMode)}>
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
                
                return (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className={`
                            group relative ${getResourceCardFrameClass(viewMode, 'visual')} bg-[#1e1e1e] border border-[#333] hover:border-yellow-500/50 hover:bg-[#252526]
                            rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-lg flex flex-col
                            select-none
                        `}
                        title={item.name}
                    >
                        <div className={`absolute top-1 right-1 z-20 transition-opacity duration-200 ${item.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleFavorite(item.id, resolveNextFavoriteState(item.isFavorite));
                                }}
                                className="p-1 text-white/80 hover:text-red-500 hover:scale-110 transition-all"
                                title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart size={12} fill={item.isFavorite ? '#ef4444' : 'none'} className={item.isFavorite ? 'text-red-500' : 'text-white drop-shadow-md'} />
                            </button>
                        </div>

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

