import React from 'react';
import { Loader2, Zap } from 'lucide-react';

interface ImageGenerateFooterProps {
    canGenerate: boolean;
    isGenerating: boolean;
    batchSize: number;
    onGenerate: () => void | Promise<void>;
}

export const ImageGenerateFooter: React.FC<ImageGenerateFooterProps> = ({
    canGenerate,
    isGenerating,
    batchSize,
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
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-[0.98]'
                    }
                `}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Creating...</span>
                    </>
                ) : (
                    <>
                        <Zap size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        <span>Generate Image</span>
                    </>
                )}
            </button>
            <div className="text-center mt-2 flex justify-between px-1">
                <span className="text-[10px] text-gray-600 font-mono">Cost: ~{Math.max(1, batchSize) * 4} Credits</span>
                <span className="text-[10px] text-gray-600">Pro Plan</span>
            </div>
        </div>
    );
};
