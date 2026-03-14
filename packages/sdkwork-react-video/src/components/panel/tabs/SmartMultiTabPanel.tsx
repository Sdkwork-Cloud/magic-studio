import React from 'react';
import { SmartFramesSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type SmartMultiTabPanelProps = Pick<
    VideoModeTabContentProps,
    | 'config'
    | 'maxAssets'
    | 'resolvedReferenceImages'
    | 'onConfigChange'
    | 'onOpenReferenceAssetModal'
>;

export const SmartMultiTabPanel: React.FC<SmartMultiTabPanelProps> = ({
    config,
    maxAssets,
    resolvedReferenceImages,
    onConfigChange,
    onOpenReferenceAssetModal
}) => {
    return (
        <SmartFramesSection
            mode="smart_multi"
            referenceImages={config.referenceImages || []}
            resolvedReferenceImages={resolvedReferenceImages}
            maxAssets={maxAssets}
            onChangeReferences={(value) => onConfigChange({ referenceImages: value })}
            onOpenAssetModal={onOpenReferenceAssetModal}
        />
    );
};
