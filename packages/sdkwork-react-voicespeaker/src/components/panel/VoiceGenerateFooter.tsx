import React from 'react';
import { Loader2, Mic } from 'lucide-react';
import type { VoiceGenerateFooterProps } from './types';

export const VoiceGenerateFooter: React.FC<VoiceGenerateFooterProps> = ({
    mode,
    canGenerate,
    isGenerating,
    onGenerate
}) => {
    return (
        <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
            <button
                onClick={onGenerate}
                disabled={!canGenerate}
                className={`
                    w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                    ${!canGenerate
                        ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]'
                        : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 hover:shadow-green-500/20 active:scale-[0.98]'
                    }
                `}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <Mic size={16} fill="currentColor" />
                        <span>{mode === 'clone' ? 'Clone Voice' : 'Create Voice'}</span>
                    </>
                )}
            </button>
        </div>
    );
};
