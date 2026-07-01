import React from 'react';
import { SubjectReferenceSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type VideoToVideoTabPanelProps = Pick<VideoModeTabContentProps, 'config' | 'onTargetVideoChange'>;

export const VideoToVideoTabPanel: React.FC<VideoToVideoTabPanelProps> = ({
    config,
    onTargetVideoChange
}) => {
    return (
        <SubjectReferenceSection
            value={config.targetVideo}
            onChange={onTargetVideoChange}
            title="Source Video"
            label="Upload Source Video"
            accepts={['video']}
        />
    );
};
