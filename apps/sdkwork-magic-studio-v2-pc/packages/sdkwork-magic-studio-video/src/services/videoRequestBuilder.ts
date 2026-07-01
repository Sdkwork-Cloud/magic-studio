import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import { VIDEO_STYLES } from '../constants';
import type {
    MediaInputRef,
    UnifiedVideoGenerationRequest,
    VideoConfig,
    VideoGenerationAsset,
    VideoInputResourceRef
} from '../entities';
import {
    hasVideoInputResourceReference,
    resolveCanonicalVideoGenerationType,
    resolveVideoInputResourceKey,
    resolveVideoInputResourceUrl,
} from '../entities';

type ProviderPayload = Record<string, unknown>;

const mapVideoAssetRoleToInputRole = (role: string): MediaInputRef['role'] => {
    switch (role) {
        case 'source_video':
            return 'source-video';
        case 'source_image':
            return 'source-image';
        case 'driver_audio':
            return 'driver-audio';
        case 'start_frame':
            return 'start-frame';
        case 'end_frame':
            return 'end-frame';
        case 'subject_reference':
        case 'reference_1':
        case 'reference_2':
        case 'reference_3':
        case 'reference_4':
        case 'keyframe_1':
        case 'keyframe_2':
        case 'keyframe_3':
        case 'keyframe_4':
            return 'reference';
        default:
            return 'input';
    }
};

const toMediaInputRef = (
    role: string,
    ref?: VideoInputResourceRef | null
): MediaInputRef | undefined => {
    if (!ref) {
        return undefined;
    }

    return {
        ...ref,
        assetId: ref.assetId ?? null,
        assetUuid: ref.assetUuid ?? null,
        primaryResourceId: ref.primaryResourceId ?? null,
        primaryResourceUuid: ref.primaryResourceUuid ?? null,
        resourceViewId: ref.resourceViewId ?? null,
        resourceViewUuid: ref.resourceViewUuid ?? null,
        role: mapVideoAssetRoleToInputRole(role),
        resource: ref.resource ? { ...ref.resource } : undefined,
        metadata: {
            ...(ref.metadata || {}),
            originalRole: role
        }
    };
};

const pushAsset = (
    list: VideoGenerationAsset[],
    role: string,
    type: VideoGenerationAsset['type'],
    ref?: VideoInputResourceRef | null
): void => {
    if (!ref) {
        return;
    }

    const value = resolveVideoInputResourceKey(ref);
    if (!value) {
        return;
    }

    list.push({
        role,
        type,
        value,
        assetId: ref.assetId ?? null,
        assetUuid: ref.assetUuid ?? null,
        primaryResourceId: ref.primaryResourceId ?? null,
        primaryResourceUuid: ref.primaryResourceUuid ?? null,
        resourceViewId: ref.resourceViewId ?? null,
        resourceViewUuid: ref.resourceViewUuid ?? null,
        ref: toMediaInputRef(role, ref)
    });
};

const toDurationSeconds = (durationId: string): number => {
    const parsed = Number(durationId.replace('s', ''));
    return Number.isFinite(parsed) ? parsed : 5;
};

const uniq = (items: string[]): string[] => {
    return Array.from(new Set(items.filter(Boolean)));
};

const resolveRenderableVideoInputResourceUrl = (
    ref?: VideoInputResourceRef | null
): string | undefined => {
    const candidate = resolveVideoInputResourceUrl(ref);
    return typeof candidate === 'string' && isRenderableInputResourceUrl(candidate)
        ? candidate
        : undefined;
};

const buildReferenceUrls = (config: VideoConfig): string[] => {
    return uniq(
        [
            ...(config.referenceImages || []).map((item) => resolveRenderableVideoInputResourceUrl(item)),
            ...(config.referenceVideos || []).map((item) => resolveRenderableVideoInputResourceUrl(item)),
            resolveRenderableVideoInputResourceUrl(config.image)
        ].filter((value): value is string => !!value)
    );
};

const buildAliyunPayload = (config: VideoConfig): ProviderPayload => {
    const duration = toDurationSeconds(config.duration);
    const hasPrimaryImageReference =
        hasVideoInputResourceReference(config.image) ||
        (config.referenceImages || []).some((item) => hasVideoInputResourceReference(item));
    const primaryImageUrl =
        resolveRenderableVideoInputResourceUrl(config.image) ||
        (config.referenceImages || [])
            .map((item) => resolveRenderableVideoInputResourceUrl(item))
            .find((item): item is string => !!item);
    const baseParameters: Record<string, unknown> = {
        duration,
        size: config.aspectRatio,
        prompt_extend: config.promptExtend ?? true,
        seed: config.seed
    };
    if (config.shotType) {
        baseParameters.shot_type = config.shotType;
    }
    if (config.watermark !== undefined) {
        baseParameters.watermark = config.watermark;
    }
    const audioTrackUrl = resolveRenderableVideoInputResourceUrl(config.audioTrack);
    if (audioTrackUrl) {
        baseParameters.audio_url = audioTrackUrl;
    }

    switch (config.mode) {
        case 'start_end':
            return {
                operation: 'first-last-frame-to-video',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    first_frame_url: resolveRenderableVideoInputResourceUrl(config.image),
                    last_frame_url: resolveRenderableVideoInputResourceUrl(config.lastFrame)
                },
                parameters: baseParameters
            };
        case 'subject_ref':
        case 'smart_multi':
            return {
                operation: 'reference-to-video',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    negative_prompt: config.negativePrompt || undefined,
                    reference_urls: buildReferenceUrls(config)
                },
                parameters: baseParameters
            };
        case 'lip-sync':
            return {
                operation: 'speech-to-video',
                model: config.model,
                input: {
                    image_url:
                        resolveRenderableVideoInputResourceUrl(config.targetImage) ||
                        resolveRenderableVideoInputResourceUrl(config.image),
                    audio_url: resolveRenderableVideoInputResourceUrl(config.driverAudio),
                    text: config.lipSyncDriverType === 'tts' ? config.prompt : undefined
                },
                parameters: {
                    ...baseParameters,
                    denoise: config.lipSyncDenoise ?? true,
                    trim_silence: config.lipSyncTrimSilence ?? true
                }
            };
        case 'extend':
            return {
                operation: 'video-extend',
                model: config.model,
                input: {
                    video_url: resolveRenderableVideoInputResourceUrl(config.targetVideo),
                    style: config.prompt || undefined
                },
                parameters: {
                    ...baseParameters,
                    extend_duration: duration
                }
            };
        case 'smart_reference':
        default:
            return hasPrimaryImageReference
                ? {
                    operation: 'image-to-video',
                    model: config.model,
                    input: {
                        prompt: config.prompt,
                        negative_prompt: config.negativePrompt || undefined,
                        img_url: primaryImageUrl
                    },
                    parameters: baseParameters
                }
                : {
                    operation: 'text-to-video',
                    model: config.model,
                    input: {
                        prompt: config.prompt,
                        negative_prompt: config.negativePrompt || undefined
                    },
                    parameters: baseParameters
                };
    }
};

const buildVolcenginePayload = (config: VideoConfig): ProviderPayload => {
    const duration = toDurationSeconds(config.duration);
    const targetVideoUrl = resolveRenderableVideoInputResourceUrl(config.targetVideo);
    const imageUrl =
        config.mode === 'lip-sync'
            ? resolveRenderableVideoInputResourceUrl(config.targetImage) ||
              resolveRenderableVideoInputResourceUrl(config.image)
            : resolveRenderableVideoInputResourceUrl(config.image);
    const firstReference =
        imageUrl ||
        (config.referenceImages || [])
            .map((item) => resolveRenderableVideoInputResourceUrl(item))
            .find((item): item is string => !!item);
    const content: Array<Record<string, unknown>> = [];

    if (config.prompt) {
        content.push({ type: 'text', text: config.prompt });
    }
    if (config.mode === 'extend' && targetVideoUrl) {
        content.push({ type: 'video_url', video_url: { url: targetVideoUrl } });
    }
    if (firstReference) {
        content.push({ type: 'image_url', image_url: { url: firstReference } });
    }

    return {
        operation: 'generation-task-create',
        model: config.model,
        content,
        ratio: config.aspectRatio,
        duration,
        resolution: config.resolution,
        seed: config.seed,
        watermark: config.watermark,
        generate_audio: config.generateAudio,
        camera_fixed: config.cameraFixed,
        note: config.mode === 'lip-sync'
            ? 'Seedance docs do not provide a dedicated lip-sync endpoint.'
            : config.mode === 'extend'
                ? 'Current app-api routes video extend through a dedicated extend endpoint.'
                : undefined
    };
};

const buildKlingPayload = (config: VideoConfig): ProviderPayload => {
    const duration = toDurationSeconds(config.duration);
    const sourceType = config.lipSyncSourceType || 'video';
    const hasPrimaryImageReference =
        hasVideoInputResourceReference(config.image) ||
        (config.referenceImages || []).some((item) => hasVideoInputResourceReference(item));
    const primaryImage =
        resolveRenderableVideoInputResourceUrl(config.image) ||
        (config.referenceImages || [])
            .map((item) => resolveRenderableVideoInputResourceUrl(item))
            .find((item): item is string => !!item);

    switch (config.mode) {
        case 'lip-sync':
            return {
                operation: 'videos:lip-sync',
                model: config.model,
                input: {
                    video_url:
                        sourceType === 'video'
                            ? resolveRenderableVideoInputResourceUrl(config.targetVideo)
                            : undefined,
                    image_url:
                        sourceType === 'image'
                            ? resolveRenderableVideoInputResourceUrl(config.targetImage) || primaryImage
                            : undefined,
                    audio_url: resolveRenderableVideoInputResourceUrl(config.driverAudio),
                    text: config.lipSyncDriverType === 'tts' ? config.prompt : undefined
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio,
                    lip_strength: config.lipSyncLipStrength ?? 70,
                    expression_strength: config.lipSyncExpressionStrength ?? 50
                }
            };
        case 'extend':
            return {
                operation: 'videos:extend',
                model: config.model,
                input: {
                    video_url: resolveRenderableVideoInputResourceUrl(config.targetVideo),
                    prompt: config.prompt || undefined
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio
                }
            };
        case 'start_end':
            return {
                operation: 'videos:extend',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    first_frame_url: resolveRenderableVideoInputResourceUrl(config.image),
                    last_frame_url: resolveRenderableVideoInputResourceUrl(config.lastFrame)
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio
                }
            };
        case 'subject_ref':
        case 'smart_multi':
            return {
                operation: 'videos:image-to-video',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    negative_prompt: config.negativePrompt || undefined,
                    image_url: primaryImage,
                    reference_images: (config.referenceImages || [])
                        .map((item) => resolveRenderableVideoInputResourceUrl(item))
                        .filter((item): item is string => !!item)
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio
                }
            };
        case 'smart_reference':
        default:
            return hasPrimaryImageReference
                ? {
                    operation: 'videos:image-to-video',
                    model: config.model,
                    input: {
                        prompt: config.prompt,
                        negative_prompt: config.negativePrompt || undefined,
                        image_url: primaryImage
                    },
                    parameters: {
                        duration,
                        aspect_ratio: config.aspectRatio
                    }
                }
                : {
                    operation: 'videos:text-to-video',
                    model: config.model,
                    input: {
                        prompt: config.prompt,
                        negative_prompt: config.negativePrompt || undefined
                    },
                    parameters: {
                        duration,
                        aspect_ratio: config.aspectRatio
                    }
                };
    }
};

export type VideoExecutionOperation =
    | 'create'
    | 'image-to-video'
    | 'extend'
    | 'style-transfer'
    | 'lip-sync'
    | 'enhance-prompt'
    | 'read-task'
    | 'cancel-task';

export interface VideoExecutionTarget {
    operation: VideoExecutionOperation | null;
    unavailableReason: string | null;
}

const shouldUseImageToVideoExecutionOperation = (
    request: UnifiedVideoGenerationRequest
): boolean => {
    const hasVideoAsset = request.assets.some((asset) => asset.type === 'video');
    const hasImageAsset = request.assets.some((asset) => asset.type === 'image');
    return hasImageAsset && !hasVideoAsset;
};

export const readVideoExecutionTarget = (
    request: UnifiedVideoGenerationRequest
): VideoExecutionTarget => {
    switch (resolveCanonicalVideoGenerationType(request.generationType)) {
        case 'lip-sync':
            return {
                operation: 'lip-sync',
                unavailableReason: null
            };
        case 'extend':
            return {
                operation: 'extend',
                unavailableReason: null
            };
        case 'style-transfer':
            return {
                operation: 'style-transfer',
                unavailableReason: null
            };
        case 'face-swap':
            return {
                operation: null,
                unavailableReason:
                    'Face Swap is not implemented in the canonical video service yet.'
            };
        default:
            break;
    }

    return {
        operation: shouldUseImageToVideoExecutionOperation(request)
            ? 'image-to-video'
            : 'create',
        unavailableReason: null
    };
};

export const buildUnifiedVideoGenerationRequest = (config: VideoConfig): UnifiedVideoGenerationRequest => {
    const style = VIDEO_STYLES.find((item) => item.id === config.styleId);
    const assets: VideoGenerationAsset[] = [];
    const options: Record<string, unknown> = {};

    switch (config.mode) {
        case 'start_end':
            pushAsset(assets, 'start_frame', 'image', config.image);
            pushAsset(assets, 'end_frame', 'image', config.lastFrame);
            break;
        case 'subject_ref':
            pushAsset(assets, 'subject_reference', 'image', config.image);
            break;
        case 'smart_reference':
            (config.referenceImages || []).forEach((item, index) => {
                pushAsset(assets, `reference_${index + 1}`, 'image', item);
            });
            if ((config.referenceImages || []).length === 0) {
                pushAsset(assets, 'reference_1', 'image', config.image);
            }
            break;
        case 'smart_multi':
            (config.referenceImages || []).forEach((item, index) => {
                pushAsset(assets, `keyframe_${index + 1}`, 'image', item);
            });
            (config.referenceVideos || []).forEach((item, index) => {
                pushAsset(assets, `reference_video_${index + 1}`, 'video', item);
            });
            break;
        case 'lip-sync': {
            const sourceType = config.lipSyncSourceType || 'video';
            if (sourceType === 'image') {
                pushAsset(assets, 'source_image', 'image', config.targetImage || config.image);
            } else {
                pushAsset(assets, 'source_video', 'video', config.targetVideo);
            }
            pushAsset(assets, 'driver_audio', 'audio', config.driverAudio);
            options.lipSyncSourceType = sourceType;
            options.lipSyncDriverType = config.lipSyncDriverType || 'audio';
            options.lipSyncSyncMode = config.lipSyncSyncMode || 'standard';
            options.lipSyncPreset = config.lipSyncPreset || 'dialogue';
            options.lipSyncLipStrength = config.lipSyncLipStrength ?? 70;
            options.lipSyncExpressionStrength = config.lipSyncExpressionStrength ?? 50;
            options.lipSyncPreserveHeadMotion = config.lipSyncPreserveHeadMotion ?? true;
            options.lipSyncDenoise = config.lipSyncDenoise ?? true;
            options.lipSyncTrimSilence = config.lipSyncTrimSilence ?? true;
            options.lipSyncTargetLufs = config.lipSyncTargetLufs ?? -16;
            options.lipSyncKeepOriginalBgm = config.lipSyncKeepOriginalBgm ?? false;
            break;
        }
        case 'extend':
            pushAsset(assets, 'source_video', 'video', config.targetVideo);
            break;
        case 'video-to-video':
            pushAsset(assets, 'source_video', 'video', config.targetVideo);
            break;
        default:
            pushAsset(assets, 'input_image', 'image', config.image);
            pushAsset(assets, 'input_video', 'video', config.targetVideo);
            break;
    }

    pushAsset(assets, 'audio_track', 'audio', config.audioTrack);

    options.promptExtend = config.promptExtend ?? true;
    options.watermark = config.watermark ?? true;
    options.generateAudio = config.generateAudio ?? false;
    options.shotType = config.shotType || 'single-shot';
    options.cameraFixed = config.cameraFixed ?? false;
    options.seed = config.seed;
    options.providerPayloads = {
        aliyun: buildAliyunPayload(config),
        volcengine: buildVolcenginePayload(config),
        kling: buildKlingPayload(config)
    };

    return {
        generationType: resolveCanonicalVideoGenerationType(config.mode),
        assets,
        prompt: config.prompt || '',
        negativePrompt: config.negativePrompt || '',
        duration: config.duration,
        resolution: config.resolution,
        aspectRatio: config.aspectRatio,
        model: config.model,
        videoStyle: {
            id: config.styleId || 'none',
            prompt: style?.prompt || ''
        },
        options
    };
};

export const readVideoExecutionTargetFromConfig = (
    config: VideoConfig
): VideoExecutionTarget => readVideoExecutionTarget(
    buildUnifiedVideoGenerationRequest(config)
);
