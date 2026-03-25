
import React from 'react';
import { AnyAsset } from '@sdkwork/react-assets';
import { Sparkles, Eye, Heart } from 'lucide-react';
import { useAssetUrl } from '@sdkwork/react-assets';
import { resolveNextFavoriteState } from '../../../domain/assets/favoriteToggle';
import { getResourceCardFrameClass, getResourcePanelLayoutClass, type ResourcePanelViewMode } from '../../../domain/assets/resourcePanelPresentation';
import { useMagicCutTranslation } from '../../../hooks/useMagicCutTranslation';

interface EffectResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    previewEffect: AnyAsset | null;
    setPreviewEffect: (effect: AnyAsset | null) => void;
    viewMode?: ResourcePanelViewMode;
}

export const EffectResourcePanel: React.FC<EffectResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite,
    previewEffect,
    setPreviewEffect,
    viewMode = 'grid'
}) => {
    return (
        <div className={getResourcePanelLayoutClass(viewMode)}>
            {assets.map((item) => (
                <EffectCard 
                    key={item.id}
                    item={item}
                    onDragStart={onDragStart}
                    onToggleFavorite={onToggleFavorite}
                    previewEffect={previewEffect}
                    setPreviewEffect={setPreviewEffect}
                    viewMode={viewMode}
                />
            ))}
        </div>
    );
});

const EffectCard: React.FC<{
    item: AnyAsset;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    previewEffect: AnyAsset | null;
    setPreviewEffect: (effect: AnyAsset | null) => void;
    viewMode: ResourcePanelViewMode;
}> = ({ item, onDragStart, onToggleFavorite, previewEffect, setPreviewEffect, viewMode }) => {
    const { tr } = useMagicCutTranslation();
    const isActive = previewEffect?.id === item.id;
    
    const { url: thumbnail } = useAssetUrl(item.metadata?.thumbnailUrl ? { id: 'thumb', path: item.metadata.thumbnailUrl } as any : null);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onMouseEnter={() => setPreviewEffect(item)}
            onMouseLeave={() => setPreviewEffect(null)}
            className={`
                group relative ${getResourceCardFrameClass(viewMode, 'tile')} bg-[#1e1e1e] border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all select-none
                ${isActive 
                    ? 'border-purple-500 ring-1 ring-purple-500/50 scale-[1.05] z-10 shadow-lg' 
                    : 'border-[#333] hover:border-[#555] hover:bg-[#252526]'
                }
            `}
            title={item.name}
        >
            {/* Cover Image */}
            {thumbnail ? (
                <div className="absolute inset-0">
                    <img 
                        src={thumbnail} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                        alt={item.name} 
                        draggable={false}
                    />
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2a2a2c] to-[#1a1a1a]">
                    <Sparkles size={20} className="text-purple-900/50 group-hover:text-purple-500/50 transition-colors" />
                </div>
            )}

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-1.5 bg-gradient-to-t from-black/90 via-black/10 to-transparent">
                <div className="flex flex-col">
                    <span className="text-[7px] text-purple-400 font-bold uppercase tracking-wider block mb-0.5 opacity-80 truncate">
                        {(item as any).category || tr('defaults.effectCategory')}
                    </span>
                    <span className="text-[9px] font-bold text-gray-200 line-clamp-1 leading-tight group-hover:text-white transition-colors">
                        {item.name}
                    </span>
                </div>
            </div>

            <div className="absolute top-1 right-1 z-20 flex gap-1">
                {isActive && (
                    <div className="bg-black/60 text-purple-400 p-1 rounded-full shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100 border border-white/10">
                        <Eye size={8} />
                    </div>
                )}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    onToggleFavorite(item.id, resolveNextFavoriteState(item.isFavorite));
                    }}
                    className={`p-1 rounded-full transition-all ${item.isFavorite ? 'text-red-500 bg-black/40' : 'text-white/80 bg-black/30 opacity-0 group-hover:opacity-100 hover:text-red-500'}`}
                    title={item.isFavorite ? tr('actions.removeFromFavorites') : tr('actions.addToFavorites')}
                >
                    <Heart size={10} fill={item.isFavorite ? 'currentColor' : 'none'} />
                </button>
            </div>
        </div>
    );
};

