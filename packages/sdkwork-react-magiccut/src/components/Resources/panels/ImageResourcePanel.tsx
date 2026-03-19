
import React from 'react';
import { AnyAsset } from '@sdkwork/react-assets';
import { SkimmableAssetCard } from '../SkimmableAssetCard';
import { getResourcePanelLayoutClass, type ResourcePanelViewMode } from '../../../domain/assets/resourcePanelPresentation';

interface ImageResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onDragEnd: () => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDoubleClick: (item: AnyAsset) => void;
    onHover?: (item: AnyAsset | null) => void;
    onDelete?: (item: AnyAsset) => void;
    viewMode?: ResourcePanelViewMode;
}

export const ImageResourcePanel: React.FC<ImageResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onDragEnd,
    onToggleFavorite,
    onDoubleClick,
    onHover,
    onDelete,
    viewMode = 'grid'
}) => {
    return (
        <div className={getResourcePanelLayoutClass(viewMode)}>
            {assets.map((item) => (
                <SkimmableAssetCard 
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
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

