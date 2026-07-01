import React from 'react';
import { Film } from 'lucide-react';
import { VideoModelSelector } from '../VideoModelSelector';

interface VideoPanelHeaderProps {
    model: string;
    onModelChange: (model: string) => void;
}

export const VideoPanelHeader: React.FC<VideoPanelHeaderProps> = ({
    model,
    onModelChange
}) => {
    return (
        <div className="flex-none h-16 px-6 border-b border-[#27272a] flex items-center justify-between z-30 bg-[#09090b]">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-900/20 shrink-0">
                    <Film size={16} fill="currentColor" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-bold text-sm text-white leading-none truncate">Video Studio</h2>
                    <span className="text-[10px] text-gray-500 font-medium truncate block">Create cinematic videos</span>
                </div>
            </div>

            <div className="flex-1 max-w-[200px] ml-4">
                <VideoModelSelector
                    value={model}
                    onChange={onModelChange}
                    className="w-full border-[#333] bg-[#121214] hover:bg-[#1a1a1c] text-xs h-8"
                />
            </div>
        </div>
    );
};
