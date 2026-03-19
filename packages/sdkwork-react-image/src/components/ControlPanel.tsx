import { AspectRatio, Button } from '@sdkwork/react-commons'
import { PromptTextInput } from '@sdkwork/react-assets'
import React from 'react';
import { useImageStore } from '../store/imageStore';
import { IMAGE_STYLES } from '../constants';
;
import {
    Wand2, Ratio, Layers, Image as ImageIcon,
    Trash2, CheckCircle2, Loader2, Copy
} from 'lucide-react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { resolveLocalizedText, useTranslation } from '@sdkwork/react-i18n';

export const ControlPanel: React.FC = () => {
    const { config, setConfig, generate, enhancePrompt, isGenerating, history, clearHistory } = useImageStore();
    const { t, locale } = useTranslation();

    const handleRatioChange = (ratio: AspectRatio) => {
        setConfig({ aspectRatio: ratio });
    };

    return (
        <div className="w-[360px] flex-none bg-[#18181b] border-r border-[#27272a] flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#27272a] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
                    <ImageIcon size={18} />
                </div>
                <h2 className="font-bold text-gray-200">AI Studio</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                
                {/* Prompt Section */}
                <div>
                    <PromptTextInput 
                        label="Prompt"
                        placeholder="Describe your imagination..."
                        value={config.prompt}
                        onChange={(val) => setConfig({ prompt: val })}
                        disabled={isGenerating}
                        onEnhance={enhancePrompt}
                        isEnhancing={isGenerating}
                        rows={5}
                    />
                </div>

                {/* Aspect Ratio */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Ratio size={12} /> Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map((r) => (
                            <button
                                key={r}
                                onClick={() => handleRatioChange(r as AspectRatio)}
                                className={`
                                    py-2 rounded-lg text-xs font-medium transition-all border
                                    ${config.aspectRatio === r 
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                                        : 'bg-[#252526] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'
                                    }
                                `}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Batch Size */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Copy size={12} /> Batch Size
                        </label>
                        <span className="text-xs font-mono text-gray-300 bg-[#252526] px-2 py-0.5 rounded border border-[#333]">
                            {config.batchSize || 1}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-[#252526] rounded-lg border border-[#333]">
                        {[1, 2, 3, 4].map(n => (
                            <button
                                key={n}
                                onClick={() => setConfig({ batchSize: n })}
                                className={`
                                    flex-1 py-1.5 text-xs font-medium rounded-md transition-all
                                    ${config.batchSize === n 
                                        ? 'bg-[#333] text-white shadow-sm border border-[#444]' 
                                        : 'text-gray-500 hover:text-gray-300'
                                    }
                                `}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Style Selector */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layers size={12} /> Style Preset
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {IMAGE_STYLES.map(style => {
                            // Determine visual representation: Use Thumbnail if available, else color strip
                            const thumbnail = style.assets?.scene?.url;
                            
                            return (
                                <button
                                    key={style.id}
                                    onClick={() => setConfig({ styleId: style.id })}
                                    className={`
                                        relative overflow-hidden rounded-lg h-10 flex items-center px-3 border transition-all text-left group
                                        ${config.styleId === style.id 
                                            ? 'border-purple-500 bg-[#252526]' 
                                            : 'border-[#333] bg-[#252526] hover:border-gray-500'
                                        }
                                    `}
                                >
                                    {thumbnail ? (
                                        <div className="absolute left-0 top-0 bottom-0 w-8 overflow-hidden border-r border-white/10">
                                            <img src={thumbnail} className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    ) : (
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 w-1" 
                                            style={{ backgroundColor: (style as any).previewColor || '#52525b' }} 
                                        />
                                    )}
                                    
                                    <span className={`ml-2 text-xs truncate ${thumbnail ? 'pl-6' : ''} ${config.styleId === style.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                        {t(`portalVideo.styles.${style.id}.label`, resolveLocalizedText(style.label, locale))}
                                    </span>
                                    {config.styleId === style.id && <CheckCircle2 size={12} className="ml-auto text-purple-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* History Quick Stats */}
                <div className="pt-4 border-t border-[#27272a]">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>History ({history.length})</span>
                        <button onClick={clearHistory} className="hover:text-red-400 flex items-center gap-1">
                            <Trash2 size={12} /> Clear
                        </button>
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div className="p-5 border-t border-[#27272a] bg-[#18181b]">
                <Button 
                    onClick={generate} 
                    disabled={isGenerating || !config.prompt.trim()}
                    className="w-full py-3.5 h-auto text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-0 shadow-xl shadow-purple-900/20"
                >
                    {isGenerating ? (
                        <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Generating...</span>
                    ) : (
                        <span className="flex items-center gap-2"><Wand2 size={16} fill="currentColor" /> Generate</span>
                    )}
                </Button>
            </div>
        </div>
    );
};
