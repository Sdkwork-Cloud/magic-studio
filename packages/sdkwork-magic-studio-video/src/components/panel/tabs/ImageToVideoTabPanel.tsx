import React from 'react';
import { SubjectReferenceSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type ImageToVideoTabPanelProps = Pick<VideoModeTabContentProps, 'config' | 'onStartFrameChange'>;

export const ImageToVideoTabPanel: React.FC<ImageToVideoTabPanelProps> = ({
    config,
    onStartFrameChange
}) => {
    return (
        <SubjectReferenceSection
            value={config.image}
            onChange={onStartFrameChange}
            title="Source Image"
            label="Upload Source Image"
            accepts={['image']}
        />
    );
};
