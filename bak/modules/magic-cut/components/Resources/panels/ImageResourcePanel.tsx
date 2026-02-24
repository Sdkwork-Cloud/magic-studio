
import React from 'react';
import { AnyAsset } from '../../../services/assets/AssetTypes';
import { SkimmableAssetCard } from '../SkimmableAssetCard';

interface ImageResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onDragEnd: () => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDoubleClick: (item: AnyAsset) => void;
    onHover?: (item: AnyAsset | null) => void;
    onDelete?: (item: AnyAsset) => void;
}

export const ImageResourcePanel: React.FC<ImageResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onDragEnd,
    onToggleFavorite,
    onDoubleClick,
    onHover,
    onDelete
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
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
});
