import type { VideoConfig, VideoGenerationMode } from '../../entities';
import type { VideoPanelGenerationRequirement, VideoPanelModeSchema, VideoPanelRuntimeState } from './types';

export const VIDEO_PANEL_MODE_SCHEMAS: VideoPanelModeSchema[] = [
    {
        mode: 'lip-sync',
        viewKey: 'lip_sync',
        generationRule: {
            allOf: [
                { key: 'lip_sync_source' },
                { key: 'lip_sync_driver' }
            ]
        }
    },
    {
        mode: 'start_end',
        viewKey: 'start_end',
        generationRule: {
            allOf: [
                { key: 'prompt' },
                { key: 'start_frame' },
                { key: 'end_frame' }
            ]
        }
    },
    {
        mode: 'subject_ref',
        viewKey: 'subject_ref',
        generationRule: {
            allOf: [
                { key: 'prompt' },
                { key: 'start_frame' }
            ]
        }
    },
    {
        mode: 'smart_reference',
        viewKey: 'smart_reference',
        generationRule: {
            allOf: [{ key: 'prompt' }],
            anyOf: [
                { key: 'start_frame' },
                { key: 'reference_count', minCount: 1 }
            ]
        }
    },
    {
        mode: 'smart_multi',
        viewKey: 'smart_multi',
        generationRule: {
            allOf: [
                { key: 'prompt' },
                { key: 'reference_count', minCount: 2 }
            ]
        }
    }
];

const VIDEO_PANEL_MODE_SCHEMA_MAP: Partial<Record<VideoGenerationMode, VideoPanelModeSchema>> =
    VIDEO_PANEL_MODE_SCHEMAS.reduce((acc, schema) => {
        acc[schema.mode] = schema;
        return acc;
    }, {} as Partial<Record<VideoGenerationMode, VideoPanelModeSchema>>);

const evaluateRequirement = (
    requirement: VideoPanelGenerationRequirement,
    state: VideoPanelRuntimeState
): boolean => {
    switch (requirement.key) {
        case 'prompt':
            return state.hasPrompt;
        case 'start_frame':
            return state.hasStartFrame;
        case 'end_frame':
            return state.hasEndFrame;
        case 'reference_count':
            return state.referenceCount >= (requirement.minCount || 1);
        case 'lip_sync_source':
            return state.lipSyncSourceType === 'image'
                ? state.hasLipSyncSourceImage
                : state.hasLipSyncSourceVideo;
        case 'lip_sync_driver':
            return state.hasLipSyncDriver;
        default:
            return false;
    }
};

const evaluateRule = (state: VideoPanelRuntimeState, rule: VideoPanelModeSchema['generationRule']): boolean => {
    const allOf = rule.allOf || [];
    const anyOf = rule.anyOf || [];
    const allOfPassed = allOf.every((requirement) => evaluateRequirement(requirement, state));
    const anyOfPassed = anyOf.length === 0 || anyOf.some((requirement) => evaluateRequirement(requirement, state));
    return allOfPassed && anyOfPassed;
};

export const createVideoPanelRuntimeState = (
    config: VideoConfig,
    isGenerating: boolean
): VideoPanelRuntimeState => {
    const lipSyncSourceType = config.lipSyncSourceType || 'video';
    const lipSyncDriverType = config.lipSyncDriverType || 'audio';
    const hasPrompt = config.prompt.trim().length > 0;
    const hasLipSyncAudioDriver = !!config.driverAudio;
    const hasLipSyncTtsDriver = hasPrompt;
    return {
        mode: config.mode,
        isGenerating,
        hasPrompt,
        hasStartFrame: !!config.image,
        hasEndFrame: !!config.lastFrame,
        referenceCount: config.referenceImages?.length || 0,
        lipSyncSourceType,
        lipSyncDriverType,
        hasLipSyncSourceVideo: !!config.targetVideo,
        hasLipSyncSourceImage: !!config.targetImage,
        hasLipSyncAudioDriver,
        hasLipSyncTtsDriver,
        hasLipSyncDriver: lipSyncDriverType === 'tts' ? hasLipSyncTtsDriver : hasLipSyncAudioDriver
    };
};

export const resolveVideoPanelModeViewKey = (mode: VideoGenerationMode): VideoPanelModeSchema['viewKey'] => {
    return VIDEO_PANEL_MODE_SCHEMA_MAP[mode]?.viewKey || 'default';
};

export const canGenerateByPanelSchema = (state: VideoPanelRuntimeState): boolean => {
    if (state.isGenerating) {
        return false;
    }

    const schema = VIDEO_PANEL_MODE_SCHEMA_MAP[state.mode];
    if (!schema) {
        return state.hasPrompt || state.hasStartFrame || state.referenceCount > 0;
    }

    return evaluateRule(state, schema.generationRule);
};

export const getModeTransitionPatch = (
    mode: VideoGenerationMode,
    config: VideoConfig
): Partial<VideoConfig> | null => {
    if (mode === 'subject_ref' && !config.image && config.referenceImages?.[0]) {
        return { image: config.referenceImages[0] };
    }

    if (mode === 'smart_reference' && (!config.referenceImages || config.referenceImages.length === 0) && config.image) {
        return { referenceImages: [config.image] };
    }

    return null;
};
