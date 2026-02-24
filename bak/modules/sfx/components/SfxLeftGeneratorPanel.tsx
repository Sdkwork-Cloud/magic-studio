
import React, { useState, useRef, useEffect } from 'react';
import { useSfxStore } from '../store/sfxStore';
import { SFX_MODELS } from '../constants';
import { 
    AudioWaveform, ChevronDown, Check, Loader2, Sparkles, Clock, Flame
} from 'lucide-react';
import { PromptTextInput } from '../../../components/generate/PromptTextInput';
import { Button } from '../../../components/Button/Button';

export const SfxLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useSfxStore();
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

    const activeModel = SFX_MODELS.find(m => m.id === config.model) || SFX_MODELS[0];

    return (
        <>
            {/* --- 1. HEADER --- */}
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/20 ring-1 ring-white/10">
                            <AudioWaveform size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">SFX Studio</h2>
                            <span className="text-[10px] text-gray-500 font-medium">Sound Effects Generation</span>
                        </div>
                    </div>
                    
                    {/* Model Selector */}
                    <div className="relative" ref={modelMenuRef}>
                         <button 
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#333] hover:border-[#444] hover:bg-[#202023] transition-all text-xs font-medium text-gray-300 group"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            {activeModel.name}
                            <ChevronDown size={10} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </button>
                        
                        {showModelMenu && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#18181b] border border-[#333] rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right ring-1 ring-black/50">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Available Models
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-0.5">
                                    {SFX_MODELS.map(model => (
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
                                            {config.model === model.id && <Check size={12} className="text-orange-500" />}
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
                
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                     <div>
                        <Label icon={<Sparkles size={12} className="text-orange-500" />}>Sound Description</Label>
                        <PromptTextInput 
                            label={null}
                            placeholder="Footsteps on gravel, laser blast, ambient rain..."
                            value={config.prompt}
                            onChange={(val) => setConfig({ prompt: val })}
                            disabled={isGenerating}
                            rows={6}
                            className="bg-[#121214]"
                        />
                    </div>
                    
                    {/* Duration Slider */}
                    <div>
                         <Label icon={<Clock size={12} />}>Duration (Seconds)</Label>
                         <div className="flex items-center gap-4 bg-[#18181b] border border-[#27272a] p-3 rounded-xl">
                             <input 
                                type="range"
                                min={1}
                                max={20}
                                step={1}
                                value={config.duration}
                                onChange={(e) => setConfig({ duration: Number(e.target.value) })}
                                className="flex-1 h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400"
                                disabled={isGenerating}
                             />
                             <div className="w-12 text-center text-xs font-mono text-gray-300 bg-[#252526] py-1 rounded border border-[#333]">
                                 {config.duration}s
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* --- 3. FOOTER --- */}
            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button 
                    onClick={generate} 
                    disabled={isGenerating || !config.prompt.trim()}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                        ${isGenerating 
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' 
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/20 active:scale-[0.98]'
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
                            <Flame size={16} fill="currentColor" className="text-orange-500" />
                            <span className="font-mono">5</span>
                            <span className="ml-1">Generate Sound</span>
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
