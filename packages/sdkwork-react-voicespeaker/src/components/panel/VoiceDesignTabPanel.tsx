import React from 'react';
import { Sparkles } from 'lucide-react';
import { PromptTextInput, createPromptTextInputCapabilityProps } from '@sdkwork/react-assets';
import { SettingSlider } from '@sdkwork/react-settings';
import type { VoiceDesignTabPanelProps } from './types';
import { VoicePanelLabel } from './VoicePanelLabel';

export const VoiceDesignTabPanel: React.FC<VoiceDesignTabPanelProps> = ({
    description,
    speed,
    pitch,
    stability,
    similarityBoost,
    disabled,
    speedRange,
    pitchRange,
    supportsSpeedControl,
    supportsPitchControl,
    supportsStabilityControl,
    supportsSimilarityControl,
    onDescriptionChange,
    onSpeedChange,
    onPitchChange,
    onStabilityChange,
    onSimilarityBoostChange
}) => {
    const hasAdvancedSliders = supportsStabilityControl || supportsSimilarityControl;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
                <VoicePanelLabel icon={<Sparkles size={12} className="text-yellow-500" />}>
                    Voice Description
                </VoicePanelLabel>
                <PromptTextInput
                    {...createPromptTextInputCapabilityProps('VOICE_CLONE_WORDS')}
                    label={null}
                    placeholder="Describe the voice: deep, raspy, cheerful, robotic, accent..."
                    value={description || ''}
                    onChange={onDescriptionChange}
                    disabled={disabled}
                    rows={4}
                    className="bg-[#121214]"
                />
            </div>

            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-4">
                {supportsSpeedControl ? (
                    <SettingSlider
                        label="Speed"
                        value={speed}
                        onChange={onSpeedChange}
                        min={speedRange[0]}
                        max={speedRange[1]}
                        step={0.05}
                    />
                ) : null}
                {supportsPitchControl ? (
                    <SettingSlider
                        label="Pitch"
                        value={pitch}
                        onChange={onPitchChange}
                        min={pitchRange[0]}
                        max={pitchRange[1]}
                        step={0.05}
                    />
                ) : null}
                {supportsStabilityControl ? (
                    <SettingSlider
                        label="Stability"
                        value={stability || 0.5}
                        onChange={onStabilityChange}
                        min={0}
                        max={1}
                        step={0.05}
                    />
                ) : null}
                {supportsSimilarityControl ? (
                    <SettingSlider
                        label="Similarity"
                        value={similarityBoost || 0.75}
                        onChange={onSimilarityBoostChange}
                        min={0}
                        max={1}
                        step={0.05}
                    />
                ) : null}
                {!supportsSpeedControl && !supportsPitchControl && !hasAdvancedSliders ? (
                    <div className="rounded-md border border-[#2b2b2e] bg-[#111114] px-3 py-2 text-[10px] text-gray-500">
                        Current model applies built-in voice parameters automatically.
                    </div>
                ) : null}
            </div>
        </div>
    );
};
