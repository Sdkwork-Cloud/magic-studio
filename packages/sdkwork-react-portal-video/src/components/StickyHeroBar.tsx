
import { PortalTab } from '@sdkwork/react-commons'
import React from 'react';
import { Sparkles, ArrowUp, Loader2, Maximize2 } from 'lucide-react';
;

interface StickyHeroBarProps {
    prompt: string;
    setPrompt: (val: string) => void;
    activeTab: PortalTab;
    isGenerating: boolean;
    onGenerate: () => void;
    onExpand: () => void;
    isVisible: boolean;
}

export const StickyHeroBar: React.FC<StickyHeroBarProps> = ({
    prompt, setPrompt, activeTab, isGenerating, onGenerate, onExpand, isVisible
}) => {
    // Determine gradient based on tab
    const getGradientIcon = () => {
        switch (activeTab) {
            case 'video': return 'bg-gradient-to-br from-pink-500 to-purple-600';
            case 'image': return 'bg-gradient-to-br from-cyan-400 to-blue-500';
            case 'one_click': return 'bg-gradient-to-br from-orange-400 to-red-500';
            case 'short_drama': return 'bg-gradient-to-br from-violet-500 to-indigo-600';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div 
            className={`
                fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4
                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0 pointer-events-none'}
            `}
        >
            <div className="bg-[#18181b]/80 backdrop-blur-xl border border-[#27272a] rounded-full shadow-2xl p-1.5 flex items-center gap-2 ring-1 ring-white/5">
                
                {/* Mode Indicator */}
                <div 
                    onClick={onExpand}
                    className={`w-9 h-9 rounded-full ${getGradientIcon()} flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform`}
                >
                    <Sparkles size={16} fill="currentColor" />
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={onExpand}
                    placeholder={`Create with ${activeTab.replace('_', ' ')}...`}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 px-2 h-full cursor-text"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                            e.preventDefault();
                            onGenerate();
                        }
                    }}
                />

                {/* Expand Button */}
                <button 
                    onClick={onExpand}
                    className="p-2 text-gray-500 hover:text-white hover:bg-[#27272a] rounded-full transition-colors"
                    title="Open Full Editor"
                >
                    <Maximize2 size={16} />
                </button>

                {/* Generate Button */}
                <button 
                    onClick={onGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className={`
                        w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                        ${!prompt.trim() || isGenerating 
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:scale-105 shadow-lg shadow-white/10'
                        }
                    `}
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                </button>
            </div>
        </div>
    );
};
