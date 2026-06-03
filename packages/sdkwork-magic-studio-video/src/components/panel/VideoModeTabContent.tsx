import React from 'react';
import { resolveVideoPanelModeViewKey } from './schema';
import type { VideoModeTabContentProps } from './types';
import { ImageToVideoTabPanel } from './tabs/ImageToVideoTabPanel';
import { LipSyncTabPanel } from './tabs/LipSyncTabPanel';
import { SmartMultiTabPanel } from './tabs/SmartMultiTabPanel';
import { SmartReferenceTabPanel } from './tabs/SmartReferenceTabPanel';
import { StartEndTabPanel } from './tabs/StartEndTabPanel';
import { SubjectRefTabPanel } from './tabs/SubjectRefTabPanel';
import { VideoExtendTabPanel } from './tabs/VideoExtendTabPanel';
import { VideoToVideoTabPanel } from './tabs/VideoToVideoTabPanel';

export const VideoModeTabContent: React.FC<VideoModeTabContentProps> = (props) => {
    const viewKey = resolveVideoPanelModeViewKey(props.config.mode);

    switch (viewKey) {
        case 'lip_sync':
            return (
                <LipSyncTabPanel
                    config={props.config}
                    isGenerating={props.isGenerating}
                    onConfigChange={props.onConfigChange}
                    onTargetVideoChange={props.onTargetVideoChange}
                    onTargetImageChange={props.onTargetImageChange}
                    onDriverAudioChange={props.onDriverAudioChange}
                />
            );
        case 'start_end':
            return (
                <StartEndTabPanel
                    config={props.config}
                    onStartFrameChange={props.onStartFrameChange}
                    onEndFrameChange={props.onEndFrameChange}
                    onSwapStartEndFrames={props.onSwapStartEndFrames}
                />
            );
        case 'subject_ref':
            return (
                <SubjectRefTabPanel
                    config={props.config}
                    onSubjectReferenceChange={props.onSubjectReferenceChange}
                />
            );
        case 'image_to_video':
            return (
                <ImageToVideoTabPanel
                    config={props.config}
                    onStartFrameChange={props.onStartFrameChange}
                />
            );
        case 'video_to_video':
            return (
                <VideoToVideoTabPanel
                    config={props.config}
                    onTargetVideoChange={props.onTargetVideoChange}
                />
            );
        case 'video_extend':
            return (
                <VideoExtendTabPanel
                    config={props.config}
                    onTargetVideoChange={props.onTargetVideoChange}
                />
            );
        case 'smart_reference':
            return (
                <SmartReferenceTabPanel
                    config={props.config}
                    maxAssets={props.maxAssets}
                    resolvedReferenceImages={props.resolvedReferenceImages}
                    onConfigChange={props.onConfigChange}
                    onOpenReferenceAssetModal={props.onOpenReferenceAssetModal}
                />
            );
        case 'smart_multi':
            return (
                <SmartMultiTabPanel
                    config={props.config}
                    maxAssets={props.maxAssets}
                    resolvedReferenceImages={props.resolvedReferenceImages}
                    onConfigChange={props.onConfigChange}
                    onOpenReferenceAssetModal={props.onOpenReferenceAssetModal}
                />
            );
        default:
            return null;
    }
};
