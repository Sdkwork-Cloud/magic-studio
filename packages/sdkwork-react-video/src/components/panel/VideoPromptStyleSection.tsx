import React from 'react';
import { ChevronDown, Palette, Settings2, Sparkles } from 'lucide-react';
import { PromptTextInput, StyleSelector, createPromptTextInputCapabilityProps, type InputAttachment } from '@sdkwork/react-assets';
import { VIDEO_STYLES } from '../../constants';
import type { VideoConfig } from '../../entities';
import { VideoPanelLabel } from './VideoPanelLabel';

interface VideoPromptStyleSectionProps {
    config: VideoConfig;
    isGenerating: boolean;
    attachments: InputAttachment[];
    showStyleMenu: boolean;
    showAdvanced: boolean;
    onPromptChange: (value: string) => void;
    onNegativePromptChange: (value: string) => void;
    onStyleChange: (styleId: string) => void;
    onStyleMenuToggle: (open: boolean) => void;
    onToggleAdvanced: () => void;
    onPromptExtendChange: (value: boolean) => void;
    onWatermarkChange: (value: boolean) => void;
    onGenerateAudioChange: (value: boolean) => void;
    onCameraFixedChange: (value: boolean) => void;
    onShotTypeChange: (value: 'single-shot' | 'multi-shot') => void;
    onAudioUrlChange: (value: string) => void;
    onEnhance: (text: string) => Promise<string>;
}

export const VideoPromptStyleSection: React.FC<VideoPromptStyleSectionProps> = ({
    config,
    isGenerating,
    attachments,
    showStyleMenu,
    showAdvanced,
    onPromptChange,
    onNegativePromptChange,
    onStyleChange,
    onStyleMenuToggle,
    onToggleAdvanced,
    onPromptExtendChange,
    onWatermarkChange,
    onGenerateAudioChange,
    onCameraFixedChange,
    onShotTypeChange,
    onAudioUrlChange,
    onEnhance
}) => {
    return (
        <>
            <div className="space-y-2">
                <VideoPanelLabel icon={<Sparkles size={12} className="text-yellow-500" />}>
                    Prompt
                </VideoPanelLabel>
                <PromptTextInput
                    {...createPromptTextInputCapabilityProps('VIDEO')}
                    label={null}
                    value={config.prompt}
                    onChange={onPromptChange}
                    placeholder="Describe the motion, lighting, and camera movement... (Type @ to reference uploaded assets)"
                    rows={5}
                    disabled={isGenerating}
                    className="bg-[#121214]"
                    assets={attachments}
                    onEnhance={onEnhance}
                />
            </div>

            <div className="space-y-2">
                <VideoPanelLabel icon={<Palette size={12} className="text-purple-500" />}>Video Style</VideoPanelLabel>
                <StyleSelector
                    value={config.styleId || 'none'}
                    onChange={onStyleChange}
                    options={VIDEO_STYLES}
                    className="w-full bg-[#121214] border-[#27272a] hover:border-[#444] h-10 justify-between px-3"
                    isOpen={showStyleMenu}
                    onToggle={onStyleMenuToggle}
                />
            </div>

            <div className="space-y-2">
                <div
                    className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-300 transition-colors py-2"
                    onClick={onToggleAdvanced}
                >
                    <Settings2 size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Advanced Settings</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                </div>

                {showAdvanced && (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-4 pt-1 pb-2">
                        <PromptTextInput
                            {...createPromptTextInputCapabilityProps('VIDEO')}
                            label="Negative Prompt"
                            value={config.negativePrompt || ''}
                            onChange={onNegativePromptChange}
                            placeholder="blurry, distorted, low quality..."
                            rows={2}
                            className="bg-[#121214]"
                        />

                        <PromptTextInput
                            label="Audio URL (Optional)"
                            value={config.audioUrl || ''}
                            onChange={onAudioUrlChange}
                            placeholder="https://... (for providers supporting custom soundtrack)"
                            rows={1}
                            className="bg-[#121214]"
                        />

                        <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Shot Type</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => onShotTypeChange('single-shot')}
                                    className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${(config.shotType || 'single-shot') === 'single-shot' ? 'border-[#2563eb]/50 bg-[#2563eb]/12 text-white' : 'border-[#27272a] bg-[#121214] text-gray-400 hover:text-gray-200'}`}
                                >
                                    Single Shot
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onShotTypeChange('multi-shot')}
                                    className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${(config.shotType || 'single-shot') === 'multi-shot' ? 'border-[#2563eb]/50 bg-[#2563eb]/12 text-white' : 'border-[#27272a] bg-[#121214] text-gray-400 hover:text-gray-200'}`}
                                >
                                    Multi Shot
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <ToggleRow
                                label="Prompt Rewrite (Prompt Extend)"
                                checked={config.promptExtend ?? true}
                                onChange={onPromptExtendChange}
                            />
                            <ToggleRow
                                label="Watermark"
                                checked={config.watermark ?? true}
                                onChange={onWatermarkChange}
                            />
                            <ToggleRow
                                label="Generate Audio (model support required)"
                                checked={config.generateAudio ?? false}
                                onChange={onGenerateAudioChange}
                            />
                            <ToggleRow
                                label="Camera Fixed"
                                checked={config.cameraFixed ?? false}
                                onChange={onCameraFixedChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

const ToggleRow: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between gap-3 rounded-md border border-[#27272a] bg-[#0f0f10] px-2.5 py-2 text-[10px] text-gray-300">
        <span className="font-medium">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-[#3a3a3d]'}`}
            aria-pressed={checked}
        >
            <span
                className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition ${checked ? 'left-[18px]' : 'left-[2px]'}`}
            />
        </button>
    </label>
);
