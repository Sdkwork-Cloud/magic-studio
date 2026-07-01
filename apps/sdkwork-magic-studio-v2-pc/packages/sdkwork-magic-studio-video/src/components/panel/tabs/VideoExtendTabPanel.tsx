import React from 'react';
import { SubjectReferenceSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type VideoExtendTabPanelProps = Pick<VideoModeTabContentProps, 'config' | 'onTargetVideoChange'>;

export const VideoExtendTabPanel: React.FC<VideoExtendTabPanelProps> = ({
    config,
    onTargetVideoChange
}) => {
    return (
        <SubjectReferenceSection
            value={config.targetVideo}
            onChange={onTargetVideoChange}
            title="Video to Extend"
            label="Upload Source Video"
            accepts={['video']}
        />
    );
};
