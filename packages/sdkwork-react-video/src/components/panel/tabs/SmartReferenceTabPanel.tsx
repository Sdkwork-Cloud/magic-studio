import React from 'react';
import { SmartFramesSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type SmartReferenceTabPanelProps = Pick<
    VideoModeTabContentProps,
    | 'config'
    | 'maxAssets'
    | 'resolvedReferenceImages'
    | 'onConfigChange'
    | 'onOpenReferenceAssetModal'
>;

export const SmartReferenceTabPanel: React.FC<SmartReferenceTabPanelProps> = ({
    config,
    maxAssets,
    resolvedReferenceImages,
    onConfigChange,
    onOpenReferenceAssetModal
}) => {
    return (
        <SmartFramesSection
            mode="smart_reference"
            referenceImages={config.referenceImages || []}
            resolvedReferenceImages={resolvedReferenceImages}
            maxAssets={maxAssets}
            onChangeReferences={(value) => onConfigChange({ referenceImages: value })}
            onOpenAssetModal={onOpenReferenceAssetModal}
        />
    );
};
