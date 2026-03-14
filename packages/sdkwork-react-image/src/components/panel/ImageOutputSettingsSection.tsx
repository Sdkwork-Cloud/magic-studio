import React from 'react';
import { Copy, Image as ImageIcon } from 'lucide-react';
import type { ImageOutputSettingsSectionProps } from './types';
import { ImagePanelLabel } from './ImagePanelLabel';

export const ImageOutputSettingsSection: React.FC<ImageOutputSettingsSectionProps> = ({
    aspectRatio,
    batchSize,
    outputPolicy,
    onAspectRatioChange,
    onBatchSizeChange
}) => {
    const aspectRatioOptions = outputPolicy.aspectRatios.filter((item) => item.enabled !== false);
    const batchSizeOptions = outputPolicy.batchSizes.filter((item) => item.enabled !== false);

    return (
        <div className="space-y-4">
            <ImagePanelLabel icon={<ImageIcon size={12} />}>Output Settings</ImagePanelLabel>

            <div className="grid grid-cols-5 gap-2">
                {aspectRatioOptions.map((ratio) => {
                    const isActive = aspectRatio === ratio.id;
                    return (
                        <button
                            key={ratio.id}
                            type="button"
                            onClick={() => onAspectRatioChange(ratio.id)}
                            className={`
                                flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-12 gap-1
                                ${isActive
                                    ? 'bg-[#27272a] border-purple-500 text-purple-400 ring-1 ring-purple-500/20'
                                    : 'bg-[#121214] border-transparent hover:border-[#333] text-gray-500 hover:text-gray-300'
                                }
                            `}
                            title={ratio.label}
                        >
                            <span className="text-[9px] font-semibold tracking-wide">{ratio.icon}</span>
                            <span className="text-[8px] font-mono">{ratio.id}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between bg-[#121214] p-3 rounded-xl border border-[#27272a]">
                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Copy size={12} /> Batch Size
                </span>
                <div className="flex bg-[#18181b] p-0.5 rounded-lg border border-[#333]">
                    {batchSizeOptions.map((item) => {
                        const isActive = batchSize === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onBatchSizeChange(item.id)}
                                className={`
                                    relative w-8 h-6 flex items-center justify-center text-[10px] font-bold rounded-md transition-all
                                    ${isActive
                                        ? 'bg-[#27272a] text-white shadow-sm border border-[#444]'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }
                                `}
                            >
                                {item.label}
                                {item.recommended ? (
                                    <span className="absolute -top-1 -right-1 rounded bg-blue-500/20 border border-blue-500/40 px-1 text-[7px] font-semibold text-blue-300">
                                        R
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
