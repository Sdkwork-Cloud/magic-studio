import React from 'react';
import { AudioWaveform, Image, Mic, SlidersHorizontal, Sparkles, Video } from 'lucide-react';
import { ChooseAsset, PromptTextInput, createPromptTextInputCapabilityProps } from '@sdkwork/react-assets';
import type { Asset } from '@sdkwork/react-commons';
import type { VideoConfig } from '../../entities';

interface LipSyncSectionProps {
    config: VideoConfig;
    isGenerating: boolean;
    onConfigChange: (updates: Partial<VideoConfig>) => void;
    onTargetVideoChange: (asset: Asset | null) => void;
    onTargetImageChange: (asset: Asset | null) => void;
    onDriverAudioChange: (asset: Asset | null) => void;
}

export const LipSyncSection: React.FC<LipSyncSectionProps> = ({
    config,
    isGenerating,
    onConfigChange,
    onTargetVideoChange,
    onTargetImageChange,
    onDriverAudioChange
}) => {
    const sourceType = config.lipSyncSourceType || 'video';
    const driverType = config.lipSyncDriverType || 'audio';

    const applyPreset = (preset: 'dialogue' | 'speech' | 'emotion') => {
        const presetConfig: Record<typeof preset, {
            lipSyncLipStrength: number;
            lipSyncExpressionStrength: number;
            lipSyncSyncMode: 'standard' | 'pro';
        }> = {
            dialogue: {
                lipSyncLipStrength: 68,
                lipSyncExpressionStrength: 42,
                lipSyncSyncMode: 'standard'
            },
            speech: {
                lipSyncLipStrength: 74,
                lipSyncExpressionStrength: 35,
                lipSyncSyncMode: 'pro'
            },
            emotion: {
                lipSyncLipStrength: 78,
                lipSyncExpressionStrength: 70,
                lipSyncSyncMode: 'pro'
            }
        };

        onConfigChange({
            lipSyncPreset: preset,
            ...presetConfig[preset]
        });
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <FieldLabel icon={sourceType === 'image' ? <Image size={12} className="text-blue-400" /> : <Video size={12} className="text-blue-400" />}>
                        Source
                    </FieldLabel>
                    <div className="inline-flex rounded-md border border-[#2a2a2d] bg-[#121214] p-0.5 text-[10px]">
                        <button
                            type="button"
                            onClick={() => onConfigChange({ lipSyncSourceType: 'video' })}
                            className={`rounded px-2 py-1 font-semibold transition ${sourceType === 'video' ? 'bg-[#2563eb]/15 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Video
                        </button>
                        <button
                            type="button"
                            onClick={() => onConfigChange({ lipSyncSourceType: 'image' })}
                            className={`rounded px-2 py-1 font-semibold transition ${sourceType === 'image' ? 'bg-[#2563eb]/15 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Portrait
                        </button>
                    </div>
                </div>
                {sourceType === 'video' ? (
                    <ChooseAsset
                        value={config.targetVideo || null}
                        onChange={onTargetVideoChange}
                        accepts={['video']}
                        domain="video-studio"
                        aspectRatio="aspect-video"
                        className="bg-[#121214] border-[#27272a] hover:border-blue-500/40 h-44"
                        label="Upload Source Video"
                    />
                ) : (
                    <ChooseAsset
                        value={config.targetImage || null}
                        onChange={onTargetImageChange}
                        accepts={['image']}
                        domain="video-studio"
                        aspectRatio="aspect-video"
                        className="bg-[#121214] border-[#27272a] hover:border-blue-500/40 h-44"
                        label="Upload Portrait Image"
                    />
                )}
            </div>

            <div className="space-y-3">
                <FieldLabel icon={<Mic size={12} className="text-emerald-400" />}>Driver Input</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onConfigChange({ lipSyncDriverType: 'audio' })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            driverType === 'audio'
                                ? 'border-[#2563eb]/50 bg-[#2563eb]/12 text-white'
                                : 'border-[#27272a] bg-[#121214] text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Upload Audio
                    </button>
                    <button
                        onClick={() => onConfigChange({ lipSyncDriverType: 'tts' })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            driverType === 'tts'
                                ? 'border-[#2563eb]/50 bg-[#2563eb]/12 text-white'
                                : 'border-[#27272a] bg-[#121214] text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        TTS Script
                    </button>
                </div>

                {driverType === 'audio' ? (
                    <ChooseAsset
                        value={config.driverAudio || null}
                        onChange={onDriverAudioChange}
                        accepts={['audio']}
                        domain="video-studio"
                        aspectRatio="aspect-[16/7]"
                        className="bg-[#121214] border-[#27272a] hover:border-emerald-500/30 h-32"
                        label="Upload Audio Driver"
                    />
                ) : (
                    <PromptTextInput
                        {...createPromptTextInputCapabilityProps('TEXT')}
                        label="Speech Script"
                        value={config.prompt}
                        onChange={(value) => onConfigChange({ prompt: value })}
                        placeholder="Input speech text for TTS-driven lip sync..."
                        rows={4}
                        disabled={isGenerating}
                        className="bg-[#121214]"
                    />
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <FieldLabel icon={<Sparkles size={12} className="text-yellow-500" />}>Smart Presets</FieldLabel>
                    <span className="text-[10px] text-gray-500">
                        Active: {(config.lipSyncPreset || 'dialogue').toUpperCase()}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <PresetButton
                        active={(config.lipSyncPreset || 'dialogue') === 'dialogue'}
                        label="Dialogue"
                        onClick={() => applyPreset('dialogue')}
                    />
                    <PresetButton
                        active={config.lipSyncPreset === 'speech'}
                        label="Speech"
                        onClick={() => applyPreset('speech')}
                    />
                    <PresetButton
                        active={config.lipSyncPreset === 'emotion'}
                        label="Emotion"
                        onClick={() => applyPreset('emotion')}
                    />
                </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[#27272a] bg-[#121214] p-3">
                <FieldLabel icon={<SlidersHorizontal size={12} className="text-blue-400" />}>Sync Strategy</FieldLabel>
                <RangeField
                    label="Lip Strength"
                    value={config.lipSyncLipStrength ?? 70}
                    onChange={(value) => onConfigChange({ lipSyncLipStrength: value })}
                />
                <RangeField
                    label="Expression Strength"
                    value={config.lipSyncExpressionStrength ?? 50}
                    onChange={(value) => onConfigChange({ lipSyncExpressionStrength: value })}
                />
                <div className="grid grid-cols-2 gap-2">
                    <PresetButton
                        active={(config.lipSyncSyncMode || 'standard') === 'standard'}
                        label="Standard Sync"
                        onClick={() => onConfigChange({ lipSyncSyncMode: 'standard' })}
                    />
                    <PresetButton
                        active={config.lipSyncSyncMode === 'pro'}
                        label="Pro Sync"
                        onClick={() => onConfigChange({ lipSyncSyncMode: 'pro' })}
                    />
                </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[#27272a] bg-[#121214] p-3">
                <FieldLabel icon={<AudioWaveform size={12} className="text-emerald-400" />}>Audio Options</FieldLabel>
                <ToggleRow
                    label="Denoise Audio"
                    checked={config.lipSyncDenoise ?? true}
                    onChange={(checked) => onConfigChange({ lipSyncDenoise: checked })}
                />
                <ToggleRow
                    label="Trim Silence"
                    checked={config.lipSyncTrimSilence ?? true}
                    onChange={(checked) => onConfigChange({ lipSyncTrimSilence: checked })}
                />
                <ToggleRow
                    label="Preserve Head Motion"
                    checked={config.lipSyncPreserveHeadMotion ?? true}
                    onChange={(checked) => onConfigChange({ lipSyncPreserveHeadMotion: checked })}
                />
                <ToggleRow
                    label="Keep Original BGM"
                    checked={config.lipSyncKeepOriginalBgm ?? false}
                    onChange={(checked) => onConfigChange({ lipSyncKeepOriginalBgm: checked })}
                />
            </div>
        </div>
    );
};

const FieldLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);

const PresetButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`rounded-lg border px-2 py-2 text-[10px] font-semibold transition ${
            active
                ? 'border-[#2563eb]/50 bg-[#2563eb]/12 text-white'
                : 'border-[#27272a] bg-[#121214] text-gray-400 hover:text-gray-200'
        }`}
    >
        {label}
    </button>
);

const RangeField: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>{label}</span>
            <span>{value}</span>
        </div>
        <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-blue-500"
        />
    </div>
);

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
            className={`relative h-5 w-9 rounded-full transition ${
                checked ? 'bg-blue-600' : 'bg-[#3a3a3d]'
            }`}
            aria-pressed={checked}
        >
            <span
                className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition ${
                    checked ? 'left-[18px]' : 'left-[2px]'
                }`}
            />
        </button>
    </label>
);
