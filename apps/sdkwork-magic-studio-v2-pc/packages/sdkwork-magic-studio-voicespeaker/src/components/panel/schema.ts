import type { VoiceConfig } from '../../entities';
import { getVoiceModelApiProfile, getVoiceModelPolicy } from '../../constants';
import type {
    VoiceGenerationMode,
    VoiceModeAvailability,
    VoicePanelGenerationRequirement,
    VoicePanelModeSchema,
    VoicePanelRuntimeState
} from './types';

export const DEFAULT_VOICE_MODE: VoiceGenerationMode = 'design';
export const DEFAULT_REFERENCE_INPUT_METHOD = 'upload' as const;
export const DEFAULT_PREVIEW_TEXT =
    'Hello, this is a preview of my new voice. How do I sound?';

export const VOICE_PANEL_MODE_SCHEMAS: VoicePanelModeSchema[] = [
    {
        mode: 'design',
        generationRule: {
            allOf: [{ key: 'text' }]
        }
    },
    {
        mode: 'clone',
        generationRule: {
            allOf: [{ key: 'text' }, { key: 'reference_audio' }]
        }
    }
];

const VOICE_PANEL_MODE_SCHEMA_MAP: Record<VoiceGenerationMode, VoicePanelModeSchema> =
    VOICE_PANEL_MODE_SCHEMAS.reduce((acc, schema) => {
        acc[schema.mode] = schema;
        return acc;
    }, {} as Record<VoiceGenerationMode, VoicePanelModeSchema>);

const clampValue = (value: number, range: [number, number]): number => {
    return Math.min(range[1], Math.max(range[0], value));
};

const evaluateRequirement = (
    requirement: VoicePanelGenerationRequirement,
    state: VoicePanelRuntimeState
): boolean => {
    switch (requirement.key) {
        case 'text':
            return state.hasText;
        case 'reference_audio':
            return state.hasReferenceAudio;
        default:
            return false;
    }
};

const evaluateRule = (
    state: VoicePanelRuntimeState,
    rule: VoicePanelModeSchema['generationRule']
): boolean => {
    const allOf = rule.allOf || [];
    const anyOf = rule.anyOf || [];
    const allPassed = allOf.every((requirement) =>
        evaluateRequirement(requirement, state)
    );
    const anyPassed =
        anyOf.length === 0 ||
        anyOf.some((requirement) => evaluateRequirement(requirement, state));
    return allPassed && anyPassed;
};

export const resolveVoiceModelPolicy = (
    model: VoiceConfig['model']
): ReturnType<typeof getVoiceModelPolicy> => {
    return getVoiceModelPolicy(model);
};

export const getSupportedVoiceModesByModel = (
    model: VoiceConfig['model']
): VoiceGenerationMode[] => {
    return resolveVoiceModelPolicy(model).supportedModes;
};

export const buildVoiceModeAvailabilityByModel = (
    model: VoiceConfig['model']
): Partial<Record<VoiceGenerationMode, VoiceModeAvailability>> => {
    const supportedModes = new Set(getSupportedVoiceModesByModel(model));
    const allModes: VoiceGenerationMode[] = ['design', 'clone'];
    const availability: Partial<Record<VoiceGenerationMode, VoiceModeAvailability>> = {};

    allModes.forEach((mode) => {
        const enabled = supportedModes.has(mode);
        availability[mode] = {
            mode,
            enabled,
            reason: enabled
                ? undefined
                : 'Current model does not support this mode'
        };
    });

    return availability;
};

export const resolveVoiceModeForModel = (
    model: VoiceConfig['model'],
    mode?: VoiceGenerationMode
): VoiceGenerationMode => {
    const supportedModes = getSupportedVoiceModesByModel(model);
    if (mode && supportedModes.includes(mode)) {
        return mode;
    }
    return supportedModes[0] || DEFAULT_VOICE_MODE;
};

export const createVoicePanelRuntimeState = (
    config: VoiceConfig,
    mode: VoiceGenerationMode,
    isGenerating: boolean
): VoicePanelRuntimeState => {
    const text = (config.text || config.previewText || '').trim();
    return {
        mode,
        isGenerating,
        hasText: text.length > 0,
        hasReferenceAudio: !!config.referenceAudio
    };
};

export const canGenerateByVoicePanelSchema = (
    state: VoicePanelRuntimeState
): boolean => {
    if (state.isGenerating) {
        return false;
    }
    const schema = VOICE_PANEL_MODE_SCHEMA_MAP[state.mode];
    if (!schema) {
        return state.hasText;
    }
    return evaluateRule(state, schema.generationRule);
};

export const getVoiceConfigPatchByModelMode = (
    model: VoiceConfig['model'],
    mode: VoiceGenerationMode,
    config: VoiceConfig
): Partial<VoiceConfig> | null => {
    const policy = resolveVoiceModelPolicy(model);
    const modelApiProfile = getVoiceModelApiProfile(model);
    const resolvedMode = resolveVoiceModeForModel(model, mode);
    const sourceText = (config.text || '').trim().length > 0
        ? config.text
        : config.previewText || '';
    const normalizedText =
        modelApiProfile.maxTextLength && sourceText.length > modelApiProfile.maxTextLength
            ? sourceText.slice(0, modelApiProfile.maxTextLength)
            : sourceText;
    const normalizedPreviewText = (config.previewText || '').trim().length > 0
        ? config.previewText
        : normalizedText || DEFAULT_PREVIEW_TEXT;

    const inputSpeed =
        typeof config.speed === 'number' && Number.isFinite(config.speed)
            ? config.speed
            : policy.defaultSpeed;
    const inputPitch =
        typeof config.pitch === 'number' && Number.isFinite(config.pitch)
            ? config.pitch
            : policy.defaultPitch;
    const nextSpeed = Number(clampValue(inputSpeed, policy.speedRange).toFixed(2));
    const nextPitch = Number(clampValue(inputPitch, policy.pitchRange).toFixed(2));

    const patch: Partial<VoiceConfig> = {};
    if (config.mode !== resolvedMode) {
        patch.mode = resolvedMode;
    }
    if (config.text !== normalizedText) {
        patch.text = normalizedText;
    }
    if (config.previewText !== normalizedPreviewText) {
        patch.previewText = normalizedPreviewText;
    }
    if (config.speed !== nextSpeed) {
        patch.speed = nextSpeed;
    }
    if (config.pitch !== nextPitch) {
        patch.pitch = nextPitch;
    }
    if (!config.inputMethod) {
        patch.inputMethod = DEFAULT_REFERENCE_INPUT_METHOD;
    }

    return Object.keys(patch).length > 0 ? patch : null;
};

export const getVoiceModelRangeHint = (
    model: VoiceConfig['model']
): { speedRange: [number, number]; pitchRange: [number, number] } => {
    const policy = resolveVoiceModelPolicy(model);
    return {
        speedRange: policy.speedRange,
        pitchRange: policy.pitchRange
    };
};
