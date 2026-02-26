
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVideoStore } from '../store/videoStore';
import { VIDEO_DURATIONS, VIDEO_ASPECT_RATIOS, VIDEO_GENERATION_MODES, VIDEO_STYLES, VIDEO_MODELS } from '../constants';
import { 
    Film, ChevronDown, Check, Loader2, Sparkles, Zap, ArrowRight, Settings2, Palette
} from 'lucide-react';
import { VideoGenerationMode, InputAttachment, ImageUpload } from '@sdkwork/react-commons';
import { StyleSelector } from '@sdkwork/react-assets';
import { useTranslation } from '@sdkwork/react-i18n';
import { VideoModelSelector } from './VideoModelSelector';
import { PromptTextInput, ChooseAssetModal, assetService } from '@sdkwork/react-assets';
import { AssetType, Asset } from '@sdkwork/react-commons';
import { SettingSelect } from '@sdkwork/react-settings';
import { ChooseAsset } from '@sdkwork/react-assets';
import { genAIService } from '@sdkwork/react-core';

export const VideoLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, setMode, generate, isGenerating } = useVideoStore();
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [activeUploadField, setActiveUploadField] = useState<keyof typeof config | null>(null);

    const clearField = (field: keyof typeof config) => {
        setConfig({ [field]: undefined });
    };

    const handleAssetSelect = (field: keyof typeof config) => (asset: Asset | null) => {
        if (asset) {
            setConfig({ [field]: asset.path || asset.id });
        } else {
            setConfig({ [field]: undefined });
        }
    };

    const activeModel = VIDEO_MODELS.find(m => m.id === config.model) || VIDEO_MODELS[0];
    const maxAssets = activeModel.maxAssetsCount || 5;

    const attachments: InputAttachment[] = useMemo(() => {
        const list: InputAttachment[] = [];
        if (config.image) {
            list.push({ id: 'start_frame', name: 'Start Frame', type: 'image', url: config.image });
        }
        if (config.lastFrame) {
            list.push({ id: 'end_frame', name: 'End Frame', type: 'image', url: config.lastFrame });
        }
        if (config.referenceImages && config.referenceImages.length > 0) {
            config.referenceImages.forEach((img, i) => {
                 list.push({ id: `ref_${i}`, name: `Ref ${i+1}`, type: 'image', url: img });
            });
        }
        return list;
    }, [config.image, config.lastFrame, config.referenceImages]);

    const handleEnhance = async (text: string) => {
        return await genAIService.enhancePrompt(text);
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            <div className="flex-none h-16 px-6 border-b border-[#27272a] flex items-center justify-between z-30 bg-[#09090b]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-900/20 shrink-0">
                        <Film size={16} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-sm text-white leading-none truncate">Video Studio</h2>
                        <span className="text-[10px] text-gray-500 font-medium truncate block">Create cinematic videos</span>
                    </div>
                </div>
                
                <div className="flex-1 max-w-[200px] ml-4">
                    <VideoModelSelector 
                        value={config.model} 
                        onChange={(model) => setConfig({ model })}
                        className="w-full border-[#333] bg-[#121214] hover:bg-[#1a1a1c] text-xs h-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                <div className="flex p-1 bg-[#121214] rounded-xl border border-[#27272a]">
                    {VIDEO_GENERATION_MODES.map(mode => {
                        const isActive = config.mode === mode.id;
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setMode(mode.id)}
                                className={`
                                    flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-200 gap-1.5 group relative
                                    ${isActive 
                                        ? 'bg-[#27272a] text-white shadow-md ring-1 ring-white/5' 
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
                                    }
                                `}
                            >
                                <Icon size={16} className={isActive ? 'text-pink-500' : 'group-hover:text-pink-400/70 transition-colors'} />
                                <span className="text-[10px] font-bold">{mode.label}</span>
                                {mode.badge && !isActive && (
                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-6">
                    
                    {config.mode === 'start_end' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="space-y-2">
                                <Label>Start Frame</Label>
                                <ChooseAsset 
                                    value={config.image || null}
                                    onChange={handleAssetSelect('image')}
                                    accepts={['image']}
                                    aspectRatio="aspect-video"
                                    className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-36"
                                    label="Start Image"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Frame</Label>
                                <ChooseAsset 
                                    value={config.lastFrame || null}
                                    onChange={handleAssetSelect('lastFrame')}
                                    accepts={['image']}
                                    aspectRatio="aspect-video"
                                    className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-36"
                                    label="End Image"
                                />
                            </div>
                        </div>
                    )}

                    {config.mode === 'subject_ref' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                             <Label>Subject Reference</Label>
                             <ChooseAsset 
                                value={config.image || null}
                                onChange={handleAssetSelect('image')}
                                accepts={['image']}
                                aspectRatio="aspect-video"
                                className="bg-[#121214] border-[#27272a] hover:border-pink-500/30 h-48"
                                label="Upload Subject"
                            />
                        </div>
                    )}

                    {(config.mode === 'smart_multi' || config.mode === 'smart_reference') && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>{config.mode === 'smart_reference' ? 'All-round References' : 'Multi-References'}</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-gray-500 bg-[#1a1a1c] px-1.5 py-0.5 rounded border border-[#27272a]">
                                        Max: {maxAssets}
                                    </span>
                                    <button 
                                        onClick={() => { setActiveUploadField('referenceImages'); setShowAssetModal(true); }}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        <Sparkles size={10} /> Select from Assets
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {(config.referenceImages || []).map((img, i) => (
                                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-[#27272a] group bg-[#121214]">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => {
                                                const newRefs = config.referenceImages?.filter((_, idx) => idx !== i);
                                                setConfig({ referenceImages: newRefs });
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <Zap size={10} />
                                        </button>
                                        <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 rounded text-[9px] font-mono text-gray-300">{i+1}</div>
                                    </div>
                                ))}
                                {(config.referenceImages?.length || 0) < maxAssets && (
                                     <div className="aspect-video bg-[#121214] border border-dashed border-[#333] hover:border-pink-500/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a1a1c] transition-colors relative gap-1 group">
                                         <PlusIcon />
                                         <span className="text-[10px] text-gray-500 group-hover:text-gray-300 font-medium">Add Frame</span>
                                         <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={async (e) => {
                                                if (e.target.files) {
                                                    const files = [];
                                                    for (let i=0; i<e.target.files.length; i++) {
                                                        const f = e.target.files[i];
                                                        const buf = await f.arrayBuffer();
                                                        files.push({ name: f.name, data: new Uint8Array(buf) });
                                                    }
                                                    try {
                                                        const newRefs: string[] = [];
                                                        for (const f of files) {
                                                            const asset = await assetService.importAsset(f.data, f.name, 'image', 'upload');
                                                            newRefs.push(asset.path);
                                                        }
                                                        const existing = config.referenceImages || [];
                                                        const combined = [...existing, ...newRefs];
                                                        setConfig({ referenceImages: combined.slice(0, maxAssets) });
                                                    } catch(e) { console.error(e); }
                                                }
                                            }}
                                         />
                                     </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label icon={<Sparkles size={12} className="text-yellow-500" />}>
                            Prompt
                        </Label>
                        <PromptTextInput 
                            label={null}
                            value={config.prompt}
                            onChange={(val) => setConfig({ prompt: val })}
                            placeholder="Describe the motion, lighting, and camera movement... (Type @ to reference uploaded assets)"
                            rows={5}
                            disabled={isGenerating}
                            className="bg-[#121214]"
                            assets={attachments}
                            onEnhance={handleEnhance}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label icon={<Palette size={12} className="text-purple-500" />}>Video Style</Label>
                        <div className="relative">
                            <StyleSelector 
                                value={config.styleId || 'none'}
                                onChange={(id) => setConfig({ styleId: id })}
                                options={VIDEO_STYLES}
                                className="w-full bg-[#121214] border-[#27272a] hover:border-[#444] h-10 justify-between px-3"
                                isOpen={showStyleMenu}
                                onToggle={(open) => setShowStyleMenu(open)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                         <div 
                            className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors py-2" 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                             <Settings2 size={14} />
                             <span className="text-xs font-bold uppercase tracking-wider">Advanced Settings</span>
                             <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                         </div>
                         
                         {showAdvanced && (
                             <div className="animate-in fade-in slide-in-from-top-1 space-y-4 pt-1 pb-2">
                                 <PromptTextInput 
                                    label="Negative Prompt"
                                    value={config.negativePrompt || ''}
                                    onChange={(val) => setConfig({ negativePrompt: val })}
                                    placeholder="blurry, distorted, low quality..."
                                    rows={2}
                                    className="bg-[#121214]"
                                />
                             </div>
                         )}
                    </div>
                </div>

                <div className="h-px bg-[#27272a]" />

                <div className="space-y-4">
                     <Label icon={<Film size={12} />}>Output Settings</Label>
                     
                     <div className="grid grid-cols-3 gap-2">
                         {VIDEO_ASPECT_RATIOS.map(ratio => {
                             const isActive = config.aspectRatio === ratio.id;
                             return (
                                 <button
                                    key={ratio.id}
                                    onClick={() => setConfig({ aspectRatio: ratio.id })}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-14
                                        ${isActive 
                                            ? 'bg-[#27272a] border-pink-500 text-pink-400 ring-1 ring-pink-500/20' 
                                            : 'bg-[#121214] border-transparent hover:border-[#333] text-gray-500 hover:text-gray-300'
                                        }
                                    `}
                                 >
                                     <span className="text-sm mb-1">{ratio.icon}</span>
                                     <span className="text-[10px] font-bold">{ratio.label}</span>
                                     <span className="text-[8px] opacity-60 font-mono">{ratio.id}</span>
                                 </button>
                             );
                         })}
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                         <div className="space-y-2">
                             <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Duration</span>
                             <div className="flex bg-[#121214] p-1 rounded-lg border border-[#27272a]">
                                 {VIDEO_DURATIONS.map(d => (
                                     <button
                                        key={d.id}
                                        onClick={() => setConfig({ duration: d.id })}
                                        className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${config.duration === d.id ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                     >
                                         {d.id}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button 
                    onClick={generate} 
                    disabled={isGenerating || (config.mode === 'text' && !config.prompt.trim())}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 group
                        ${isGenerating || (config.mode === 'text' && !config.prompt.trim())
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' 
                            : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 hover:shadow-pink-500/20 active:scale-[0.98]'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Creating Video...</span>
                        </>
                    ) : (
                        <>
                            <Zap size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                            <span>Generate Video</span>
                        </>
                    )}
                </button>
                <div className="text-center mt-2 flex justify-between px-1">
                    <span className="text-[10px] text-gray-600 font-mono">Cost: ~20 Credits</span>
                    <span className="text-[10px] text-gray-600">Pro Plan</span>
                </div>
            </div>

            <ChooseAssetModal 
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onConfirm={(assets) => {
                    const paths = assets.map(a => a.path);
                    if (activeUploadField === 'referenceImages') {
                        const existing = config.referenceImages || [];
                        const combined = [...existing, ...paths];
                        setConfig({ referenceImages: combined.slice(0, maxAssets) });
                    }
                    setShowAssetModal(false);
                    setActiveUploadField(null);
                }}
                accepts={['image']}
                title="Select Reference Images"
                multiple
            />
        </div>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode; className?: string }> = ({ children, icon, className }) => (
    <label className={`text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 ${className || ''}`}>
        {icon}
        {children}
    </label>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-gray-300">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
