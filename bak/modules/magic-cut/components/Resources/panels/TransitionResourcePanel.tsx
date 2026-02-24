
import React from 'react';
import { AnyAsset, TransitionAsset } from '../../../services/assets/AssetTypes';
import { ArrowRightLeft, MonitorPlay } from 'lucide-react';
import { useAssetUrl } from '../../../../../hooks/useAssetUrl'; // Import shared hook

interface TransitionResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export const TransitionResourcePanel: React.FC<TransitionResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite
}) => {
    return (
        <div className="grid grid-cols-4 gap-2 content-start pb-10 px-2">
            {(assets as TransitionAsset[]).map((item) => (
                <TransitionCard 
                    key={item.id} 
                    item={item} 
                    onDragStart={onDragStart} 
                    onToggleFavorite={onToggleFavorite} 
                />
            ))}
        </div>
    );
});

const TransitionCard: React.FC<{
    item: TransitionAsset;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
}> = ({ item, onDragStart }) => {
    // Resolve thumbnail if available
    const { url: thumb } = useAssetUrl(item.metadata?.thumbnailUrl ? { id: 'thumb', path: item.metadata.thumbnailUrl } as any : null);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={`
                group relative aspect-square bg-[#1e1e1e] border border-[#333] hover:border-pink-500/50 
                rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-md select-none
            `}
            title={item.name}
        >
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
