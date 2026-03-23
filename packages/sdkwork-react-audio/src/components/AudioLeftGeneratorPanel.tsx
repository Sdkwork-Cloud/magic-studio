
import { PromptTextInput, createPromptTextInputCapabilityProps } from '@sdkwork/react-assets'
import React from 'react';
import { useAudioStore } from '../store/audioStore';
import { AudioModelSelector } from './AudioModelSelector';
import {
    Volume2, Loader2, Play, Settings2, Type
} from 'lucide-react';

export const AudioLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useAudioStore();

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10">
                            <Volume2 size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">Speech Studio</h2>
                            <span className="text-[10px] text-gray-500 font-medium">Text to Speech</span>
                        </div>
                    </div>
                    
                    <AudioModelSelector 
                        value={config.model || 'gemini-2.5-flash-tts'} 
                        onChange={(model) => setConfig({ model: model as any })}
                        className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                     <div>
                        <Label icon={<Type size={12} />}>Script</Label>
                        <PromptTextInput
                            {...createPromptTextInputCapabilityProps('TEXT')}
                            label={null}
                            placeholder="Enter text to synthesize..."
                            value={config.prompt || ''}
                            onChange={(val) => setConfig({ prompt: val })}
                            disabled={isGenerating}
                            rows={8}
                            className="bg-[#121214]"
                        />
                    </div>

                    <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Settings2 size={12} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Settings</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Duration</span>
                                <span className="font-mono text-gray-300">{config.duration || 10}s</span>
                            </div>
                            <input
                                type="range" min="5" max="60" step="5"
                                value={config.duration || 10}
                                onChange={(e) => setConfig({ duration: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button
                    onClick={generate}
                    disabled={isGenerating || !config.prompt?.trim()}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                        ${isGenerating
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]'
                            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 hover:shadow-indigo-500/20 active:scale-[0.98]'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <Play size={16} fill="currentColor" />
                            <span>Generate Speech</span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);
