import React, { useMemo } from 'react';
import { User } from 'lucide-react';
import { ChooseAsset } from '@sdkwork/react-assets';
import { SettingInput, SettingSelect } from '@sdkwork/react-settings';
import { PRESET_VOICES } from '../../constants';
import type { VoiceGender, VoiceStyle } from '../../entities';
import type { VoicePersonaSectionProps } from './types';
import { VoicePanelLabel } from './VoicePanelLabel';

const GENDER_OPTIONS: Array<{ label: string; value: VoiceGender }> = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Neutral', value: 'neutral' }
];

const STYLE_OPTIONS: Array<{ label: string; value: VoiceStyle }> = [
    { label: 'Neutral', value: 'neutral' },
    { label: 'Expressive', value: 'expressive' },
    { label: 'News', value: 'news' },
    { label: 'Story', value: 'story' },
    { label: 'Whisper', value: 'whisper' }
];

const resolveVoiceByGenderAndStyle = (
    gender: VoiceGender,
    style: VoiceStyle
): string => {
    const strictMatch = PRESET_VOICES.find(
        (voice) => voice.gender === gender && voice.style === style
    );
    if (strictMatch) {
        return strictMatch.id;
    }
    const genderMatch = PRESET_VOICES.find((voice) => voice.gender === gender);
    if (genderMatch) {
        return genderMatch.id;
    }
    return PRESET_VOICES[0].id;
};

export const VoicePersonaSection: React.FC<VoicePersonaSectionProps> = ({
    mode,
    name,
    avatarUrl,
    voiceId,
    description,
    avatarAIGenerator,
    onAvatarChange,
    onNameChange,
    onVoiceIdChange
}) => {
    const selectedVoice = useMemo(
        () => PRESET_VOICES.find((voice) => voice.id === voiceId) || PRESET_VOICES[0],
        [voiceId]
    );

    const handleGenderChange = (gender: string): void => {
        const next = resolveVoiceByGenderAndStyle(
            gender as VoiceGender,
            selectedVoice.style
        );
        onVoiceIdChange(next);
    };

    const handleStyleChange = (style: string): void => {
        const next = resolveVoiceByGenderAndStyle(
            selectedVoice.gender,
            style as VoiceStyle
        );
        onVoiceIdChange(next);
    };

    return (
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <VoicePanelLabel icon={<User size={12} />}>Character Persona</VoicePanelLabel>

            <div className="flex gap-5 mt-2">
                <div className="flex-shrink-0">
                    <ChooseAsset
                        value={avatarUrl || null}
                        onChange={(asset) => onAvatarChange(asset?.path || asset?.id || undefined)}
                        accepts={['image']}
                        domain="voice-speaker"
                        className="w-32 h-32 bg-[#18181b]"
                        label="Avatar"
                        aspectRatio="aspect-square"
                        contextText={description || name || 'A character portrait'}
                        imageFit="contain"
                        aiGenerator={avatarAIGenerator}
                    />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                        <SettingInput
                            label="Name"
                            value={name || ''}
                            onChange={(v: string) => onNameChange(v)}
                            placeholder={mode === 'design' ? 'e.g. Narrator Pro' : 'e.g. My Clone'}
                            fullWidth
                            labelClassName="text-[10px] text-gray-500 font-bold uppercase"
                        />
                        {mode === 'design' && (
                            <div className="grid grid-cols-2 gap-3">
                                <SettingSelect
                                    label="Gender"
                                    value={selectedVoice.gender}
                                    onChange={handleGenderChange}
                                    options={GENDER_OPTIONS}
                                    fullWidth
                                    labelClassName="text-[10px] text-gray-500 font-bold uppercase"
                                />
                                <SettingSelect
                                    label="Style"
                                    value={selectedVoice.style}
                                    onChange={handleStyleChange}
                                    options={STYLE_OPTIONS}
                                    fullWidth
                                    labelClassName="text-[10px] text-gray-500 font-bold uppercase"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
