
import React from 'react';
import { AnyAsset } from '../../../services/assets/AssetTypes';
import { Sparkles, LayoutTemplate, Star, Eye } from 'lucide-react';

interface EffectResourceGridProps {
    assets: AnyAsset[];
    type: 'effect' | 'transition';
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    previewEffect: AnyAsset | null;
    setPreviewEffect: (effect: AnyAsset | null) => void;
}

export const EffectResourceGrid: React.FC<EffectResourceGridProps> = React.memo(({
    assets,
    type,
    onDragStart,
    onToggleFavorite,
    previewEffect,
    setPreviewEffect
}) => {
    return (
        <div className="grid grid-cols-3 gap-2 content-start pb-10 px-1">
            {assets.map((item) => {
                const isActive = previewEffect?.id === item.id;
                const thumbnail = item.metadata?.thumbnailUrl;

                return (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        onMouseEnter={() => setPreviewEffect(item)}
                        onMouseLeave={() => setPreviewEffect(null)}
                        className={`
                            group relative aspect-video bg-[#252526] border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all
                            ${isActive 
                                ? 'border-purple-500 ring-1 ring-purple-500/50 scale-[1.05] z-10 shadow-lg' 
                                : 'border-[#333] hover:border-[#555]'
                            }
                        `}
                        title={item.name}
                    >
                        {/* Cover Image */}
                        {thumbnail ? (
                            <img 
                                src={thumbnail} 
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" 
                                alt={item.name} 
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2a2a2c] to-[#1e1e1e]">
                                {type === 'effect' ? <Sparkles size={16} className="text-gray-600" /> : <LayoutTemplate size={16} className="text-gray-600" />}
                            </div>
                        )}

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end p-1.5 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                            <div className="flex justify-between items-end">
                                <div className="min-w-0 flex-1">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5 opacity-80 truncate">
                                        {(item as any).category || (type === 'effect' ? 'Filter' : 'Trans')}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-200 line-clamp-1 leading-tight group-hover:text-white transition-colors">
                                        {item.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, !item.isFavorite); }}
                                className={`p-1 rounded-full hover:bg-black/60 backdrop-blur-sm transition-colors ${item.isFavorite ? 'opacity-100 text-yellow-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Star size={8} fill={item.isFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                        
                        {/* Active Indicator (Eye) */}
                        {isActive && (
                            <div className="absolute top-1 left-1 bg-purple-500/90 text-white text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
                                <Eye size={8} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});
