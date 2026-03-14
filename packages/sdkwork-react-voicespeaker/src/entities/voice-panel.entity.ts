import type {
    VoiceConfig,
    VoiceGenerationMode,
    VoiceModelType,
    VoiceReferenceInputMethod
} from './voice.entity';

export type VoicePanelSectionKey =
    | 'persona'
    | 'mode'
    | 'design'
    | 'clone'
    | 'preview'
    | 'generate';

export type VoicePanelRequirementKey = 'text' | 'reference_audio';

export interface VoicePanelGenerationRequirement {
    key: VoicePanelRequirementKey;
}

export interface VoicePanelGenerationRule {
    allOf?: VoicePanelGenerationRequirement[];
    anyOf?: VoicePanelGenerationRequirement[];
}

export interface VoicePanelModeSchema {
    mode: VoiceGenerationMode;
    generationRule: VoicePanelGenerationRule;
}

export interface VoicePanelRuntimeState {
    mode: VoiceGenerationMode;
    isGenerating: boolean;
    hasText: boolean;
    hasReferenceAudio: boolean;
}

export interface VoiceModeAvailability {
    mode: VoiceGenerationMode;
    enabled: boolean;
    reason?: string;
}

export interface VoiceModelPolicy {
    model: VoiceModelType;
    supportedModes: VoiceGenerationMode[];
    speedRange: [number, number];
    pitchRange: [number, number];
    defaultSpeed: number;
    defaultPitch: number;
}

export interface VoiceModelModeOption {
    id: VoiceGenerationMode;
    label: string;
}

export type VoiceApiProviderId = 'google' | 'openai' | 'elevenlabs' | 'azure';

export interface VoiceProviderApiDocEntry {
    title: string;
    url: string;
    official: boolean;
    summary?: string;
}

export interface VoiceProviderFeatureSpec {
    supportsClone: boolean;
    supportsReferenceAudio: boolean;
    supportsStylePrompt: boolean;
    supportsSpeedControl: boolean;
    supportsPitchControl: boolean;
    supportsStabilityControl?: boolean;
    supportsSimilarityControl?: boolean;
}

export interface VoiceProviderApiProfile {
    provider: VoiceApiProviderId;
    displayName: string;
    docs: VoiceProviderApiDocEntry[];
    featureSpec: VoiceProviderFeatureSpec;
}

export interface VoiceModelApiProfile extends VoiceModelPolicy {
    provider: VoiceApiProviderId;
    displayName: string;
    maxTextLength?: number;
    defaultLanguage?: string;
}

export interface VoicePanelSchemaEvaluator {
    modeSchemas: VoicePanelModeSchema[];
    canGenerate: (state: VoicePanelRuntimeState) => boolean;
    normalizeConfig: (
        model: VoiceModelType,
        mode: VoiceGenerationMode,
        config: VoiceConfig
    ) => Partial<VoiceConfig> | null;
}
