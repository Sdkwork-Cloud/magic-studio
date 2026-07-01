import React from 'react';
import { Loader2, Zap } from 'lucide-react';

interface VideoGenerateFooterProps {
    canGenerate: boolean;
    isGenerating: boolean;
    isLipSyncMode: boolean;
    disabledReason?: string | null;
    isCapabilityLoading?: boolean;
    onGenerate: () => void | Promise<void>;
}

export const VideoGenerateFooter: React.FC<VideoGenerateFooterProps> = ({
    canGenerate,
    isGenerating,
    isLipSyncMode,
    disabledReason,
    isCapabilityLoading,
    onGenerate
}) => {
    const helperText = !canGenerate
        ? disabledReason
            || (isCapabilityLoading ? 'Checking canonical runtime capability...' : null)
        : null;

    return (
        <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
            <button
                onClick={onGenerate}
                disabled={!canGenerate}
                className={`
                    w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 group
                    ${!canGenerate
                        ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]'
                        : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 hover:shadow-pink-500/20 active:scale-[0.98]'
                    }
                `}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>{isLipSyncMode ? 'Generating Lip Sync...' : 'Creating Video...'}</span>
                    </>
                ) : (
                    <>
                        <Zap size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        <span>{isLipSyncMode ? 'Generate Lip Sync' : 'Generate Video'}</span>
                    </>
                )}
            </button>
            {helperText && (
                <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">
                    {helperText}
                </div>
            )}
            <div className="text-center mt-2 flex justify-between px-1">
                <span className="text-[10px] text-gray-600 font-mono">Cost: ~20 Credits</span>
                <span className="text-[10px] text-gray-600">Pro Plan</span>
            </div>
        </div>
    );
};
