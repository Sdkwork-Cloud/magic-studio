
import React from 'react';
import { AnyAsset, TransitionAsset } from '@sdkwork/react-assets';
import { ArrowRightLeft, Heart, MonitorPlay } from 'lucide-react';
import { useAssetUrl } from '@sdkwork/react-assets';
import { resolveNextFavoriteState } from '../../../domain/assets/favoriteToggle';
import { getResourceCardFrameClass, getResourcePanelLayoutClass, type ResourcePanelViewMode } from '../../../domain/assets/resourcePanelPresentation';

interface TransitionResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    viewMode?: ResourcePanelViewMode;
}

export const TransitionResourcePanel: React.FC<TransitionResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite,
    viewMode = 'grid'
}) => {
    return (
        <div className={getResourcePanelLayoutClass(viewMode)}>
            {(assets as TransitionAsset[]).map((item) => (
                <TransitionCard 
                    key={item.id} 
                    item={item} 
                    onDragStart={onDragStart} 
                    onToggleFavorite={onToggleFavorite} 
                    viewMode={viewMode}
                />
            ))}
        </div>
    );
});

const TransitionCard: React.FC<{
    item: TransitionAsset;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    viewMode: ResourcePanelViewMode;
}> = ({ item, onDragStart, onToggleFavorite, viewMode }) => {
    // Resolve thumbnail if available
    const { url: thumb } = useAssetUrl(item.metadata?.thumbnailUrl ? { id: 'thumb', path: item.metadata.thumbnailUrl } as any : null);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={`
                group relative ${getResourceCardFrameClass(viewMode, 'tile')} bg-[#1e1e1e] border border-[#333] hover:border-pink-500/50 
                rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-md select-none
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

            {/* Visual Rep: A | B Transition Metaphor */}
            <div className="absolute inset-0 flex items-center justify-center">
                {thumb ? (
                    <img src={thumb} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" draggable={false} />
                ) : (
                    <div className="flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-4 h-6 bg-gray-600 rounded-l-sm" />
                        <div className="z-10 bg-[#0a0a0a] p-1 rounded-full border border-[#333]">
                                <ArrowRightLeft size={10} className="text-pink-400" />
                        </div>
                        <div className="w-4 h-6 bg-gray-500 rounded-r-sm" />
                    </div>
                )}
            </div>

            {/* Label Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                <span className="text-[9px] font-bold text-gray-300 block truncate text-center">
                    {item.name}
                </span>
            </div>

            {/* Type Badge */}
            <div className="absolute top-1 left-1 bg-pink-500/10 text-pink-400 p-0.5 rounded border border-pink-500/20 backdrop-blur-sm">
                <MonitorPlay size={8} />
            </div>
        </div>
    );
};

