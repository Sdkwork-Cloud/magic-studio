import React, { useEffect, useState } from 'react';
import { useImageStore } from '../store/imageStore';
import { IMAGE_STYLES } from '../constants';
import {
    Image as ImageIcon,
    ChevronDown,
    Loader2,
    Zap,
    Settings2,
    Copy,
    Layers,
    Wand2
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { ImageModelSelector } from './ImageModelSelector';
import { PromptTextInput, StyleSelector, ChooseAsset } from '@sdkwork/react-assets';
import type { Asset } from '@sdkwork/react-commons';
import { genAIService } from '@sdkwork/react-core';
import type { ImageAspectRatio } from '../entities';

type PanelAspectRatio = Extract<ImageAspectRatio, '1:1' | '4:3' | '3:4' | '16:9' | '9:16'>;

const IMAGE_ASPECT_RATIOS: ReadonlyArray<{ id: PanelAspectRatio; label: string; icon: string }> = [
    { id: '1:1', label: 'Square', icon: 'SQ' },
    { id: '4:3', label: 'Standard', icon: 'STD' },
    { id: '3:4', label: 'Portrait', icon: 'POR' },
    { id: '16:9', label: 'Landscape', icon: 'WIDE' },
    { id: '9:16', label: 'Story', icon: 'STORY' }
];

export const ImageLeftGeneratorPanel: React.FC<{ initialPrompt?: string; onClose?: () => void }> = ({ initialPrompt }) => {
    const { config, setConfig, generate, isGenerating } = useImageStore();
    const { t } = useTranslation();

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);

    useEffect(() => {
        if (initialPrompt) {
            setConfig({ prompt: initialPrompt });
        }
    }, [initialPrompt, setConfig]);

    const handleReferenceChange = (asset: Asset | null) => {
        if (asset) {
            const path = asset.path || asset.id;
            setConfig({ referenceImage: path, referenceImages: [path] });
        } else {
            setConfig({ referenceImage: undefined, referenceImages: [] });
        }
    };

    const handleEnhance = async (text: string) => {
        return genAIService.enhancePrompt(text);
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            <div className="flex-none h-16 px-6 border-b border-[#27272a] flex items-center justify-between z-30 bg-[#09090b]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/20 shrink-0">
                        <ImageIcon size={16} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-sm text-white leading-none truncate">{t('studio.image.title')}</h2>
                        <span className="text-[10px] text-gray-500 font-medium truncate block">Creative Studio</span>
                    </div>
                </div>

                <div className="flex-1 max-w-[200px] ml-4">
                    <ImageModelSelector
                        value={config.model || 'gemini-3-flash-image'}
                        onChange={(modelId) => setConfig({ model: modelId })}
                        className="w-full border-[#333] bg-[#121214] hover:bg-[#1a1a1c] text-xs h-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="space-y-2">
                    <Label icon={<Layers size={12} />}>Reference Image</Label>

                    <div className="relative group">
                        <ChooseAsset
                            value={config.referenceImage || null}
                            onChange={handleReferenceChange}
                            accepts={['image']}
                            domain="image-studio"
                            aspectRatio="aspect-video"
                            className={`bg-[#121214] border-[#27272a] ${config.referenceImage ? 'h-auto' : 'h-40 hover:border-purple-500/30'}`}
                            label="Reference (Img2Img)"
                            imageFit="contain"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label icon={<Wand2 size={12} className="text-purple-500" />}>
                        {t('studio.common.prompt')}
                    </Label>
                    <PromptTextInput
                        label={null}
                        value={config.prompt}
                        onChange={(value) => setConfig({ prompt: value })}
                        placeholder="Describe the image you want to create..."
                        rows={6}
                        disabled={isGenerating}
                        className="bg-[#121214]"
                        onEnhance={handleEnhance}
                    />
                </div>

                <div className="space-y-2">
                    <Label icon={<Settings2 size={12} />}>{t('studio.common.style')}</Label>
                    <div className="relative">
                        <StyleSelector
                            value={config.styleId || 'none'}
                            onChange={(id: string) => setConfig({ styleId: id })}
                            options={IMAGE_STYLES}
                            className="w-full bg-[#121214] border-[#27272a] hover:border-[#444] h-10 justify-between px-3"
                            isOpen={showStyleMenu}
                            onToggle={(open: boolean) => setShowStyleMenu(open)}
                        />
                    </div>
                </div>

                <div className="h-px bg-[#27272a]" />

                <div className="space-y-4">
                    <Label>Output Settings</Label>

                    <div className="grid grid-cols-5 gap-2">
                        {IMAGE_ASPECT_RATIOS.map((ratio) => {
                            const isActive = config.aspectRatio === ratio.id;
                            return (
                                <button
                                    key={ratio.id}
                                    onClick={() => setConfig({ aspectRatio: ratio.id })}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-12 gap-1
                                        ${isActive
                                            ? 'bg-[#27272a] border-purple-500 text-purple-400 ring-1 ring-purple-500/20'
                                            : 'bg-[#121214] border-transparent hover:border-[#333] text-gray-500 hover:text-gray-300'
                                        }
                                    `}
                                    title={ratio.label}
                                >
                                    <span className="text-[9px] font-semibold tracking-wide">{ratio.icon}</span>
                                    <span className="text-[8px] font-mono">{ratio.id}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between bg-[#121214] p-3 rounded-xl border border-[#27272a]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Copy size={12} /> Batch Size
                        </span>
                        <div className="flex bg-[#18181b] p-0.5 rounded-lg border border-[#333]">
                            {[1, 2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => setConfig({ batchSize: count })}
                                    className={`
                                        w-8 h-6 flex items-center justify-center text-[10px] font-bold rounded-md transition-all
                                        ${config.batchSize === count
                                            ? 'bg-[#27272a] text-white shadow-sm border border-[#444]'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }
                                    `}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
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
                        <div className="animate-in fade-in slide-in-from-top-1">
                            <PromptTextInput
                                label="Negative Prompt"
                                value={config.negativePrompt || ''}
                                onChange={(value) => setConfig({ negativePrompt: value })}
                                placeholder="blurry, distorted, low quality, bad anatomy..."
                                rows={2}
                                className="bg-[#121214]"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button
                    onClick={generate}
                    disabled={isGenerating || !config.prompt.trim()}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 group
                        ${isGenerating || !config.prompt.trim()
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
                    <span className="text-[10px] text-gray-600 font-mono">Cost: ~{(config.batchSize || 1) * 4} Credits</span>
                    <span className="text-[10px] text-gray-600">Pro Plan</span>
                </div>
            </div>
        </div>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);
