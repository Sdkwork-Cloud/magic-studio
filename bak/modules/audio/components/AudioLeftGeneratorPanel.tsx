
import React, { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '../store/audioStore';
import { AUDIO_MODELS, AUDIO_VOICES } from '../constants';
import { 
    Volume2, ChevronDown, Check, Loader2, Play, Mic, Type, Settings2
} from 'lucide-react';
import { PromptTextInput } from '../../../components/generate/PromptTextInput';
import { ChooseVoiceSpeaker } from '../../../components/voicespeaker';
import { Button } from '../../../components/Button/Button';

export const AudioLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useAudioStore();
    const [showModelMenu, setShowModelMenu] = useState(false);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
                setShowModelMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeModel = AUDIO_MODELS.find(m => m.id === config.model) || AUDIO_MODELS[0];
    
    // Adapt AUDIO_VOICES to IVoice for the chooser
    // We try to match the ID structure.
    const activeVoice = AUDIO_VOICES.find(v => v.id === config.voice);
    const selectedVoiceForChooser = activeVoice ? {
        id: activeVoice.id,
        name: activeVoice.name,
        gender: activeVoice.gender.toLowerCase(),
        language: config.language,
        style: 'neutral'
    } : null;

    return (
        <>
            {/* --- 1. HEADER --- */}
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
                    
                    {/* Model Selector */}
                    <div className="relative" ref={modelMenuRef}>
                         <button 
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#333] hover:border-[#444] hover:bg-[#202023] transition-all text-xs font-medium text-gray-300 group"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {activeModel.name}
                            <ChevronDown size={10} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </button>
                        
                        {showModelMenu && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#18181b] border border-[#333] rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right ring-1 ring-black/50">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Available Models
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-0.5">
                                    {AUDIO_MODELS.map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => { setConfig({ model: model.id }); setShowModelMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${config.model === model.id ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:bg-[#202023] hover:text-gray-200'}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-xs truncate">{model.name}</span>
                                                    {model.badge && (
                                                        <span className="text-[9px] bg-[#333] px-1.5 py-0.5 rounded text-gray-400 font-mono">{model.badge}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {config.model === model.id && <Check size={12} className="text-indigo-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 2. SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                     
                     {/* Voice Selector */}
                     <div>
                         <Label icon={<Mic size={12} className="text-indigo-400" />}>Voice</Label>
                         <ChooseVoiceSpeaker 
                            value={selectedVoiceForChooser}
                            onChange={(v) => setConfig({ voice: v.id })}
                            label={null}
                         />
                     </div>

                     {/* Text Input */}
                     <div>
                        <Label icon={<Type size={12} />}>Script</Label>
                        <PromptTextInput 
                            label={null}
                            placeholder="Enter text to synthesize..."
                            value={config.text}
                            onChange={(val) => setConfig({ text: val })}
                            disabled={isGenerating}
                            rows={8}
                            className="bg-[#121214]"
                        />
                    </div>

                    {/* Speed Controls */}
                    <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Settings2 size={12} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Settings</span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Speed</span>
                                <span className="font-mono text-gray-300">{config.speed}x</span>
                            </div>
                            <input 
                                type="range" min="0.5" max="2.0" step="0.1" 
                                value={config.speed} 
                                onChange={(e) => setConfig({ speed: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* --- 3. FOOTER --- */}
            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button 
                    onClick={generate} 
                    disabled={isGenerating || !config.text.trim()}
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

// UI Helper
const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);
