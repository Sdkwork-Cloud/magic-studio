import type React from 'react';
import type {
    VoiceConfig,
    VoiceGenerationMode,
    VoiceModeAvailability,
    VoicePanelGenerationRequirement,
    VoicePanelModeSchema,
    VoicePanelRuntimeState,
    VoiceReferenceInputMethod
} from '../../entities';

export type {
    VoiceGenerationMode,
    VoiceReferenceInputMethod,
    VoicePanelSectionKey,
    VoicePanelRequirementKey,
    VoicePanelGenerationRequirement,
    VoicePanelGenerationRule,
    VoicePanelModeSchema,
    VoicePanelRuntimeState,
    VoiceModeAvailability,
    VoiceModelPolicy,
    VoiceModelModeOption,
    VoicePanelSchemaEvaluator
} from '../../entities';

export interface VoiceModeTabsProps {
    mode: VoiceGenerationMode;
    availability: Partial<Record<VoiceGenerationMode, VoiceModeAvailability>>;
    hideUnsupportedModes?: boolean;
    onModeChange: (mode: VoiceGenerationMode) => void;
}

export interface VoicePersonaSectionProps {
    mode: VoiceGenerationMode;
    name?: string;
    avatarUrl?: string;
    voiceId: string;
    description?: string;
    avatarAIGenerator?: React.ComponentType<{
        contextText?: string;
        onClose: () => void;
        onSuccess: (result: string | string[]) => void;
    }>;
    onAvatarChange: (url?: string) => void;
    onNameChange: (value: string) => void;
    onVoiceIdChange: (voiceId: string) => void;
}

export interface VoiceDesignTabPanelProps {
    description?: string;
    speed: number;
    pitch: number;
    stability?: number;
    similarityBoost?: number;
    disabled: boolean;
    speedRange: [number, number];
    pitchRange: [number, number];
    supportsSpeedControl: boolean;
    supportsPitchControl: boolean;
    supportsStabilityControl: boolean;
    supportsSimilarityControl: boolean;
    onDescriptionChange: (value: string) => void;
    onSpeedChange: (value: number) => void;
    onPitchChange: (value: number) => void;
    onStabilityChange: (value: number) => void;
    onSimilarityBoostChange: (value: number) => void;
}

export interface VoiceCloneTabPanelProps {
    inputMethod: VoiceReferenceInputMethod;
    referenceAudio?: string;
    onInputMethodChange: (method: VoiceReferenceInputMethod) => void;
    onAudioUpload: (file: { data: Uint8Array | File; name: string; path?: string }) => Promise<void>;
    onOpenReferenceAssetModal: () => void;
    onRecordingComplete: (blob: Blob) => Promise<void>;
    onPlayReferenceAudio: () => Promise<void>;
    onRemoveReferenceAudio: () => void;
}

export interface VoiceGenerateFooterProps {
    mode: VoiceGenerationMode;
    canGenerate: boolean;
    isGenerating: boolean;
    onGenerate: () => void | Promise<void>;
}

export interface VoiceConfigPatchEvaluator {
    modeSchemas: VoicePanelModeSchema[];
    canGenerate: (state: VoicePanelRuntimeState) => boolean;
    normalizeConfig: (
        model: VoiceConfig['model'],
        mode: VoiceGenerationMode,
        config: VoiceConfig
    ) => Partial<VoiceConfig> | null;
    evaluateRequirement: (
        requirement: VoicePanelGenerationRequirement,
        state: VoicePanelRuntimeState
    ) => boolean;
}
