
import React, { useState, useRef, useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { CHARACTER_MODELS, CHARACTER_ARCHETYPES, CHARACTER_GENDERS } from '../constants';
import { 
    User, ChevronDown, Check, ScanFace, 
    Mic2, Upload, Trash2, Wand2, Paintbrush, AlertCircle,
    Sparkles, Play, Pause, Loader2, Flame
} from 'lucide-react';
import { PromptTextInput } from '../../../components/generate/PromptTextInput';
import { Button } from '../../../components/Button/Button';
import { ImageUpload } from '../../../components/upload';
import { ChooseVoiceSpeaker } from '../../../components/voicespeaker';
import { PRESET_VOICES } from '../../voicespeaker/constants';
import { useTranslation } from '../../../i18n';
import { CharacterViewMode } from '../entities/character.entity';
import { AIImageGeneratorModal } from '../../assets/components/AIImageGeneratorModal';
import { genAIService } from '../../notes/services/genAIService'; // Import Service

// UI Helper
const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);

export const CharacterLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useCharacterStore();
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    
    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Voice Preview State
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const modelMenuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

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

    // Cleanup Audio
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const toggleVoicePreview = (url?: string) => {
        if (!url) return;
        
        if (isPlayingVoice) {
            audioRef.current?.pause();
            setIsPlayingVoice(false);
        } else {
            if (!audioRef.current) {
                audioRef.current = new Audio(url);
                audioRef.current.onended = () => setIsPlayingVoice(false);
            } else if (audioRef.current.src !== url) {
                audioRef.current.src = url;
            }
            audioRef.current.play().catch(() => setIsPlayingVoice(false));
            setIsPlayingVoice(true);
        }
    };

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const activeModel = CHARACTER_MODELS.find(m => m.id === config.model) || CHARACTER_MODELS[0];
    
    // Voice helpers
    const activeVoice = PRESET_VOICES.find(v => v.id === config.voiceId);
    const selectedVoiceForChooser = activeVoice ? {
        id: activeVoice.id,
        name: activeVoice.name,
        gender: activeVoice.gender.toLowerCase(),
        language: activeVoice.language,
        style: activeVoice.style
    } : null;

    // View Modes
    const viewModes: { id: CharacterViewMode; label: string; icon: any }[] = [
        { id: 'full-body', label: 'Full Body', icon: User },
        { id: 'three-view', label: '3-View', icon: ScanFace }, // Changed icon slightly
        { id: 'portrait', label: 'Portrait', icon: User },
    ];

    // Helper for dynamic aspect ratio class
    const getAspectRatioClass = (ratio: string) => {
        switch (ratio) {
            case '1:1': return 'aspect-square';
            case '9:16': return 'aspect-[9/16]';
            case '3:4': return 'aspect-[3/4]';
            case '16:9': return 'aspect-video';
            default: return 'aspect-[3/4]';
        }
    };
    
    const getAIAspectRatio = (): '1:1' | '16:9' | '3:4' => {
        switch (activeTab) {
            case 'grid': return '1:1';
            case 'threeView': return '16:9';
            default: return '3:4';
        }
    };
    
    const [activeTab, setActiveTab] = useState<'avatar' | 'threeView' | 'grid'>('avatar');

    // Direct Service Call for Prompt Enhancement
    const handleEnhance = async (text: string): Promise<string> => {
        if (!text) return "";
        try {
            return await genAIService.enhancePrompt(text);
        } catch (e) {
            console.error("Enhancement failed", e);
            return text;
        }
    };

    return (
        <>
            {/* --- 1. HEADER (Tool Specific) --- */}
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20 ring-1 ring-white/10">
                            <User size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">{t('studio.character.title')}</h2>
                            <span className="text-[10px] text-gray-500 font-medium">Concept & Design</span>
                        </div>
                    </div>
                    
                    {/* Model Selector */}
                    <div className="relative" ref={modelMenuRef}>
                         <button 
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#333] hover:border-[#444] hover:bg-[#202023] transition-all text-xs font-medium text-gray-300 group"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            {activeModel.name}
                            <ChevronDown size={10} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </button>
                        
                        {showModelMenu && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-[#18181b] border border-[#333] rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right ring-1 ring-black/50">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {t('studio.common.model')}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-0.5">
                                    {CHARACTER_MODELS.map(model => (
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
                                                <p className="text-[10px] text-gray-600 line-clamp-1 mt-0.5">{model.desc}</p>
                                            </div>
                                            {config.model === model.id && <Check size={12} className="text-cyan-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 2. SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#09090b]">
                
                {/* --- AVATAR VISUALIZER --- */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label icon={<ScanFace size={12} className="text-cyan-400" />}>Concept Art</Label>
                        <div className="flex bg-[#18181b] rounded-lg p-0.5 border border-[#333]">
                            {viewModes.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setConfig({ avatarMode: m.id })}
                                    className={`
                                        px-2.5 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5
                                        ${config.avatarMode === m.id 
                                            ? 'bg-[#333] text-white shadow-sm font-medium' 
                                            : 'text-gray-500 hover:text-gray-300'
                                        }
                                    `}
                                    title={m.label}
                                >
                                    <m.icon size={12} />
                                    <span className="hidden sm:inline">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visualizer Area */}
                     <div className={`relative group w-full ${getAspectRatioClass(config.aspectRatio)} bg-[#121214] border border-[#27272a] hover:border-cyan-500/30 rounded-xl overflow-hidden flex flex-col transition-all items-center justify-center`}>
                        {config.avatarImage ? (
                            <>
                                <img src={config.avatarImage} className="w-full h-full object-contain" alt="Character" />
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                     <button 
                                        onClick={() => setShowAIModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-white text-xs font-medium border border-white/10 shadow-lg"
                                     >
                                         <Wand2 size={14} /> Regenerate with AI
                                     </button>
                                     <div className="flex gap-2">
                                         <div className="w-9 h-9">
                                                {/* Image Upload Component */}
                                         </div>
                                         <button 
                                            onClick={() => setConfig({ avatarImage: undefined })}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full backdrop-blur-md transition-colors text-red-400 border border-red-500/30"
                                            title="Remove"
                                         >
                                             <Trash2 size={16} />
                                         </button>
                                     </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center w-full h-full">
                                {/* ... Empty State ... */}
                                <div className="w-16 h-16 rounded-2xl bg-[#1e1e20] flex items-center justify-center mb-4 text-gray-600 shadow-inner">
                                    <User size={32} />
                                </div>
                                <h3 className="text-sm font-medium text-gray-300 mb-1">Visual Reference</h3>
                                <p className="text-xs text-gray-500 mb-6 max-w-[200px]">Upload a base image or generate one using AI.</p>
                                <Button 
                                    size="sm" 
                                    onClick={() => setShowAIModal(true)} 
                                    className="h-10 bg-gradient-to-r from-cyan-600 to-blue-600 border-0 text-white shadow-lg shadow-cyan-900/20"
                                >
                                    <Sparkles size={14} className="mr-2" /> AI Generate
                                </Button>
                            </div>
                        )}
                        
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[9px] font-bold text-gray-300 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider pointer-events-none z-10">
                            {config.avatarMode}
                        </div>
                    </div>
                </div>
                
                {/* --- DESCRIPTION & ARCHETYPE --- */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between">
                            <Label icon={<Sparkles size={12} className="text-yellow-500" />}>{t('studio.character.description')}</Label>
                            {errors.description && <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> Required</span>}
                        </div>
                        <PromptTextInput 
                            label={null}
                            placeholder="Tall, silver hair, glowing blue eyes, wearing futuristic armor..."
                            value={config.description}
                            onChange={(val) => { setConfig({ description: val }); clearError('description'); }}
                            disabled={isGenerating}
                            rows={5}
                            className={`bg-[#121214] ${errors.description ? 'border-red-500/50' : ''}`}
                            onEnhance={handleEnhance}
                        />
                    </div>
                </div>

            </div>

            {/* --- 3. FOOTER --- */}
            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button 
                    onClick={generate} 
                    disabled={isGenerating || (!config.description.trim() && !config.name.trim())}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                        ${isGenerating || (!config.description.trim() && !config.name.trim())
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/20 active:scale-[0.98]'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Creating Character...</span>
                        </>
                    ) : (
                        <>
                            <Flame size={16} fill="currentColor" />
                            <span>Generate Character</span>
                        </>
                    )}
                </button>
            </div>

            {showAIModal && (
                <AIImageGeneratorModal 
                    contextText={config.description ? `${name}: ${config.description}` : (config.name || "Portrait")}
                    config={{ aspectRatio: getAIAspectRatio() }}
                    onClose={() => setShowAIModal(false)}
                    onSuccess={(url) => {
                        const finalUrl = Array.isArray(url) ? url[0] : url;
                        setConfig({ avatarImage: finalUrl });
                        setShowAIModal(false);
                    }}
                />
            )}
        </>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${active ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);
