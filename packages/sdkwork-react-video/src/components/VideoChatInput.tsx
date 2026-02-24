
import { VideoConfig, CreationChatInput } from 'sdkwork-react-commons'
import React from 'react';
;
;

interface VideoChatInputProps {
    config: VideoConfig;
    onConfigChange: (updates: Partial<VideoConfig>) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    className?: string;
}

export const VideoChatInput: React.FC<VideoChatInputProps> = ({
    config, onConfigChange, onGenerate, isGenerating, className
}) => {

    const renderFooterControls = () => (
        <div className="flex items-center gap-2">
            <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-transparent bg-[#27272a] text-gray-400 hover:bg-[#333] hover:text-gray-200 transition-colors"
                onClick={() => onConfigChange({ aspectRatio: config.aspectRatio === '16:9' ? '9:16' : '16:9' })}
                title="Toggle Aspect Ratio"
            >
                {config.aspectRatio}
            </button>
            
            <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-transparent bg-[#27272a] text-gray-400 hover:bg-[#333] hover:text-gray-200 transition-colors"
                onClick={() => onConfigChange({ resolution: config.resolution === '720p' ? '1080p' : '720p' })}
                title="Toggle Resolution"
            >
                {config.resolution}
            </button>
        </div>
    );

    return (
        <CreationChatInput 
            value={config.prompt}
            onChange={(val) => onConfigChange({ prompt: val })}
            onGenerate={onGenerate}
            isGenerating={isGenerating}
            placeholder="Describe the video scene you want to generate..."
            footerControls={renderFooterControls()}
            variant="compact"
            className={className}
            autoFocus
        />
    );
};
