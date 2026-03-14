import React from 'react';
import { Loader2, Zap } from 'lucide-react';

interface VideoGenerateFooterProps {
    canGenerate: boolean;
    isGenerating: boolean;
    isLipSyncMode: boolean;
    onGenerate: () => void | Promise<void>;
}

export const VideoGenerateFooter: React.FC<VideoGenerateFooterProps> = ({
    canGenerate,
    isGenerating,
    isLipSyncMode,
    onGenerate
}) => {
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
            <div className="text-center mt-2 flex justify-between px-1">
                <span className="text-[10px] text-gray-600 font-mono">Cost: ~20 Credits</span>
                <span className="text-[10px] text-gray-600">Pro Plan</span>
            </div>
        </div>
    );
};
