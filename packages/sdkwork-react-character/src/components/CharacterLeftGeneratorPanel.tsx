import React, { useEffect, useMemo, useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import {
    User,
    ScanFace,
    Sparkles,
    AlertCircle,
    Loader2,
    Flame
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { ChooseAsset, PromptTextInput, type Asset } from '@sdkwork/react-assets';
import { AIImageGeneratorModal, IMAGE_PROVIDERS, ImageModelSelector } from '@sdkwork/react-image';
import { genAIService } from '@sdkwork/react-core';
import { ChooseVoiceSpeaker, PRESET_VOICES } from '@sdkwork/react-voicespeaker';

export type CharacterViewMode = 'full-body' | 'three-view' | 'portrait';

interface CharacterAssetAIGeneratorProps {
    contextText?: string;
    onClose: () => void;
    onSuccess: (result: string | string[]) => void;
}

const IMAGE_MODEL_IDS = IMAGE_PROVIDERS.flatMap((provider) =>
    provider.models.map((model) => model.id)
);
const DEFAULT_IMAGE_MODEL = IMAGE_MODEL_IDS[0] || 'gemini-2.5-flash-image';

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);

const resolveAiAspectRatio = (mode?: string): '1:1' | '16:9' | '3:4' => {
    if (mode === 'three-view') {
        return '16:9';
    }
    if (mode === 'portrait') {
        return '1:1';
    }
    return '3:4';
};

export const CharacterLeftGeneratorPanel: React.FC = () => {
    const characterStore = useCharacterStore();
    const config = characterStore?.config || { model: DEFAULT_IMAGE_MODEL, voiceId: '' };
    const setConfig = characterStore?.setConfig || (() => {});
    const generate = characterStore?.generate || (() => {});
    const isGenerating = characterStore?.isGenerating || false;
    const { t } = useTranslation();

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!config.model || !IMAGE_MODEL_IDS.includes(config.model)) {
            setConfig({ model: DEFAULT_IMAGE_MODEL });
        }
    }, [config.model, setConfig]);

    const clearError = (field: string) => {
        if (!errors[field]) {
            return;
        }
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleEnhance = async (text: string): Promise<string> => {
        if (!text) {
            return '';
        }
        try {
            return await genAIService.enhancePrompt(text);
        } catch (error) {
            console.error('Enhancement failed', error);
            return text;
        }
    };

    const handleAvatarChange = (asset: Asset | null) => {
        setConfig({ avatarImage: asset?.path || asset?.id || '' });
    };

    const selectedVoice = PRESET_VOICES.find((voice) => voice.id === config.voiceId);
    const selectedVoiceValue = selectedVoice
        ? {
              id: selectedVoice.id,
              name: selectedVoice.name,
              gender: selectedVoice.gender,
              language: selectedVoice.language,
              style: selectedVoice.style,
              previewUrl: selectedVoice.previewUrl
          }
        : config.voiceId || null;

    const voiceOptions = useMemo(
        () =>
            PRESET_VOICES.map((voice) => ({
                id: voice.id,
                name: voice.name,
                gender: voice.gender,
                language: voice.language,
                style: voice.style,
                previewUrl: voice.previewUrl
            })),
        []
    );

    const viewModes: ReadonlyArray<{ id: CharacterViewMode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
        { id: 'full-body', label: 'Full Body', icon: User },
        { id: 'three-view', label: '3-View', icon: ScanFace },
        { id: 'portrait', label: 'Portrait', icon: User }
    ];

    const AvatarAIGenerator: React.FC<CharacterAssetAIGeneratorProps> = ({ contextText, onClose, onSuccess }) => (
        <AIImageGeneratorModal
            contextText={contextText}
            config={{
                model: config.model,
                aspectRatio: resolveAiAspectRatio(config.avatarMode)
            }}
            onClose={onClose}
            onSuccess={(result) => onSuccess(result)}
        />
    );

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-4 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20 ring-1 ring-white/10 shrink-0">
                            <User size={14} fill="currentColor" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-bold text-sm text-white leading-none">{t('studio.character.title')}</h2>
                            <span className="text-[10px] text-gray-500 font-medium truncate block">Concept & Design</span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-[220px] min-w-[170px]">
                        <ImageModelSelector
                            value={config.model || DEFAULT_IMAGE_MODEL}
                            onChange={(modelId) => setConfig({ model: modelId })}
                            className="w-full border-[#333] bg-[#121214] hover:bg-[#1a1a1c] text-xs h-8"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#09090b]">
                <div className="space-y-2">
                    <div className="flex justify-between items-center gap-3">
                        <Label icon={<ScanFace size={12} className="text-cyan-400" />}>Character Image</Label>
                        <div className="flex bg-[#18181b] rounded-lg p-0.5 border border-[#333]">
                            {viewModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setConfig({ avatarMode: mode.id })}
                                    className={`
                                        px-2 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5
                                        ${config.avatarMode === mode.id
                                            ? 'bg-[#333] text-white shadow-sm font-medium'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }
                                    `}
                                    title={mode.label}
                                >
                                    <mode.icon size={12} />
                                    <span className="hidden md:inline">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[clamp(220px,34vh,300px)] w-full rounded-xl border border-[#27272a] bg-[#101013] p-3">
                        <ChooseAsset
                            value={config.avatarImage || null}
                            onChange={handleAvatarChange}
                            accepts={['image']}
                            domain="character"
                            label="Character Image"
                            aspectRatio="h-full"
                            className="h-full w-full bg-[#121214] border-[#27272a] hover:border-cyan-500/30"
                            imageFit="contain"
                            aiGenerator={AvatarAIGenerator}
                            contextText={
                                config.description
                                    ? `${config.name || t('studio.character.title')}: ${config.description}`
                                    : config.name || t('studio.character.title')
                            }
                        />

                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[9px] font-bold text-gray-300 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider pointer-events-none z-10">
                            {config.avatarMode || 'full-body'}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <ChooseVoiceSpeaker
                        value={selectedVoiceValue}
                        onChange={(voice) => setConfig({ voiceId: voice.id })}
                        label="Voice"
                        className="w-full"
                        voices={voiceOptions}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label icon={<Sparkles size={12} className="text-yellow-500" />}>{t('studio.character.description')}</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-mono">{(config.description || '').length} chars</span>
                            {errors.description && (
                                <span className="text-[10px] text-red-500 flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    Required
                                </span>
                            )}
                        </div>
                    </div>

                    <PromptTextInput
                        label={null}
                        placeholder="Tall, silver hair, glowing blue eyes, wearing futuristic armor..."
                        value={config.description || ''}
                        onChange={(value) => {
                            setConfig({ description: value || '' });
                            clearError('description');
                        }}
                        disabled={isGenerating}
                        rows={3}
                        maxHeight={180}
                        className={`bg-[#121214] ${errors.description ? 'border-red-500/50' : ''}`}
                        onEnhance={handleEnhance}
                    />

                    <p className="text-[10px] text-gray-600">
                        Keep it specific: appearance, outfit, expression, and scene style.
                    </p>
                </div>
            </div>

            <div className="p-3 border-t border-[#27272a] bg-[#09090b] z-30">
                <button
                    onClick={generate}
                    disabled={isGenerating || (!config.description?.trim() && !config.name?.trim())}
                    className={`
                        w-full h-11 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                        ${isGenerating || (!config.description?.trim() && !config.name?.trim())
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
        </>
    );
};
