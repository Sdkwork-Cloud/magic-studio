import React from 'react';
import { LipSyncSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type LipSyncTabPanelProps = Pick<
    VideoModeTabContentProps,
    'config' | 'isGenerating' | 'onConfigChange' | 'onTargetVideoChange' | 'onTargetImageChange' | 'onDriverAudioChange'
>;

export const LipSyncTabPanel: React.FC<LipSyncTabPanelProps> = ({
    config,
    isGenerating,
    onConfigChange,
    onTargetVideoChange,
    onTargetImageChange,
    onDriverAudioChange
}) => {
    return (
        <LipSyncSection
            config={config}
            isGenerating={isGenerating}
            onConfigChange={onConfigChange}
            onTargetVideoChange={onTargetVideoChange}
            onTargetImageChange={onTargetImageChange}
            onDriverAudioChange={onDriverAudioChange}
        />
    );
};
