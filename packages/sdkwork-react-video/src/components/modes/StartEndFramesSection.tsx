import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { ChooseAsset } from '@sdkwork/react-assets';
import type { Asset } from '@sdkwork/react-commons';

interface StartEndFramesSectionProps {
    startFrame?: string;
    endFrame?: string;
    onStartFrameChange: (asset: Asset | null) => void;
    onEndFrameChange: (asset: Asset | null) => void;
    onSwapOrder: () => void;
}

export const StartEndFramesSection: React.FC<StartEndFramesSectionProps> = ({
    startFrame,
    endFrame,
    onStartFrameChange,
    onEndFrameChange,
    onSwapOrder
}) => {
    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
                <FieldLabel>Start-End Frames</FieldLabel>
                <button
                    type="button"
                    onClick={onSwapOrder}
                    className="inline-flex items-center gap-1 rounded-md border border-[#2a2a2d] bg-[#121214] px-2 py-1 text-[10px] font-semibold text-gray-400 transition hover:border-[#3a3a3d] hover:text-white"
                >
                    <ArrowRightLeft size={12} />
                    Swap Order
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#333] bg-[#18181b] text-[9px] font-bold text-gray-300">1</span>
                    <span>Start Frame</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#333] bg-[#18181b] text-[9px] font-bold text-gray-300">2</span>
                    <span>End Frame</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChooseAsset
                    value={startFrame || null}
                    onChange={onStartFrameChange}
                    accepts={['image']}
                    domain="video-studio"
                    aspectRatio="aspect-video"
                    className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-36"
                    label="Start Image"
                />
                <ChooseAsset
                    value={endFrame || null}
                    onChange={onEndFrameChange}
                    accepts={['image']}
                    domain="video-studio"
                    aspectRatio="aspect-video"
                    className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-36"
                    label="End Image"
                />
            </div>
        </div>
    );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {children}
    </label>
);
