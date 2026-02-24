
import React from 'react';
import { AnyAsset } from 'sdkwork-react-assets';
import { SkimmableAssetCard } from '../SkimmableAssetCard';

interface VisualResourceGridProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onDragEnd: () => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDoubleClick: (item: AnyAsset) => void;
    onHover?: (item: AnyAsset | null) => void;
}

export const VisualResourceGrid: React.FC<VisualResourceGridProps> = React.memo(({
    assets,
    onDragStart,
    onDragEnd,
    onToggleFavorite,
    onDoubleClick,
    onHover
}) => {
    return (
        <div className="grid grid-cols-4 gap-2 content-start pb-10 px-2">
            {assets.map((item) => (
                <SkimmableAssetCard 
                    key={item.id}
                    item={item}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDoubleClick={onDoubleClick}
                    onToggleFavorite={onToggleFavorite}
                    onHover={onHover}
                />
            ))}
        </div>
    );
});

