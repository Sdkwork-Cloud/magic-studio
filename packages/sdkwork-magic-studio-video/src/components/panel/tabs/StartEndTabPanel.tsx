import React from 'react';
import { StartEndFramesSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type StartEndTabPanelProps = Pick<
    VideoModeTabContentProps,
    'config' | 'onStartFrameChange' | 'onEndFrameChange' | 'onSwapStartEndFrames'
>;

export const StartEndTabPanel: React.FC<StartEndTabPanelProps> = ({
    config,
    onStartFrameChange,
    onEndFrameChange,
    onSwapStartEndFrames
}) => {
    return (
        <StartEndFramesSection
            startFrame={config.image}
            endFrame={config.lastFrame}
            onStartFrameChange={onStartFrameChange}
            onEndFrameChange={onEndFrameChange}
            onSwapOrder={onSwapStartEndFrames}
        />
    );
};
