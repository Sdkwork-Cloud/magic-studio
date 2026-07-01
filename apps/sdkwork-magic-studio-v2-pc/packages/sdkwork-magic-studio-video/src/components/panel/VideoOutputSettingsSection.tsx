import React from 'react';
import { Film } from 'lucide-react';
import { VIDEO_ASPECT_RATIOS } from '../../constants';
import type { VideoAspectRatio, VideoDuration, VideoDurationOption } from '../../entities';
import { VideoPanelLabel } from './VideoPanelLabel';

interface VideoOutputSettingsSectionProps {
    aspectRatio: VideoAspectRatio;
    duration: VideoDuration;
    durationOptions: VideoDurationOption[];
    onAspectRatioChange: (value: VideoAspectRatio) => void;
    onDurationChange: (value: VideoDuration) => void;
}

export const VideoOutputSettingsSection: React.FC<VideoOutputSettingsSectionProps> = ({
    aspectRatio,
    duration,
    durationOptions,
    onAspectRatioChange,
    onDurationChange
}) => {
    return (
        <div className="space-y-4">
            <VideoPanelLabel icon={<Film size={12} />}>Output Settings</VideoPanelLabel>

            <div className="grid grid-cols-3 gap-2">
                {VIDEO_ASPECT_RATIOS.map((ratio) => {
                    const isActive = aspectRatio === ratio.id;
                    return (
                        <button
                            key={ratio.id}
                            onClick={() => onAspectRatioChange(ratio.id)}
                            className={`
                                flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-14
                                ${isActive
                                    ? 'bg-[#27272a] border-pink-500 text-pink-400 ring-1 ring-pink-500/20'
                                    : 'bg-[#121214] border-transparent hover:border-[#333] text-gray-500 hover:text-gray-300'
                                }
                            `}
                        >
                            <span className="text-sm mb-1">{ratio.icon}</span>
                            <span className="text-[10px] font-bold">{ratio.label}</span>
                            <span className="text-[8px] opacity-60 font-mono">{ratio.id}</span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Duration</span>
                        <span className="text-[10px] text-gray-600">Auto-matched by model</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 rounded-lg border border-[#27272a] bg-[#121214] p-2">
                        {durationOptions.map((item) => {
                            const isActive = duration === item.id;
                            const isDisabled = item.enabled === false;
                            return (
                            <button
                                key={item.id}
                                onClick={() => onDurationChange(item.id)}
                                disabled={isDisabled}
                                className={`
                                    relative py-1.5 text-[10px] font-bold rounded border transition-all
                                    ${isActive
                                        ? 'bg-[#27272a] text-white border-[#3a3a3d] shadow-sm'
                                        : 'bg-[#0f0f11] text-gray-500 border-[#1e1f22] hover:text-gray-300 hover:border-[#333]'
                                    }
                                    ${isDisabled ? 'opacity-40 cursor-not-allowed hover:text-gray-500 hover:border-[#1e1f22]' : ''}
                                `}
                            >
                                {item.label}
                                {item.recommended ? (
                                    <span className="absolute -top-1 -right-1 rounded bg-blue-500/20 border border-blue-500/40 px-1 text-[8px] font-semibold text-blue-300">
                                        R
                                    </span>
                                ) : null}
                            </button>
                        )})}
                    </div>
                </div>
            </div>
        </div>
    );
};
