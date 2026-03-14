import { VIDEO_STYLES } from '../constants';
import type {
    UnifiedVideoGenerationRequest,
    VideoConfig,
    VideoGenerationAsset
} from '../entities';

type ProviderPayload = Record<string, unknown>;

const pushAsset = (
    list: VideoGenerationAsset[],
    role: string,
    type: VideoGenerationAsset['type'],
    value?: string
): void => {
    if (!value) {
        return;
    }
    list.push({ role, type, value });
};

const toDurationSeconds = (durationId: string): number => {
    const parsed = Number(durationId.replace('s', ''));
    return Number.isFinite(parsed) ? parsed : 5;
};

const uniq = (items: string[]): string[] => {
    return Array.from(new Set(items.filter(Boolean)));
};

const buildReferenceUrls = (config: VideoConfig): string[] => {
    return uniq([
        ...(config.referenceImages || []),
        ...(config.referenceVideos || []),
        config.image || ''
    ]);
};

const buildAliyunPayload = (config: VideoConfig): ProviderPayload => {
    const duration = toDurationSeconds(config.duration);
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
    if (config.audioUrl) {
        baseParameters.audio_url = config.audioUrl;
    }

    switch (config.mode) {
        case 'start_end':
            return {
                endpoint: 'first-last-frame-to-video',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    first_frame_url: config.image,
                    last_frame_url: config.lastFrame
                },
                parameters: baseParameters
            };
        case 'subject_ref':
        case 'smart_multi':
            return {
                endpoint: 'reference-to-video',
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
                endpoint: 'speech-to-video',
                model: config.model,
                input: {
                    image_url: config.targetImage || config.image,
                    audio_url: config.driverAudio,
                    text: config.lipSyncDriverType === 'tts' ? config.prompt : undefined
                },
                parameters: {
                    ...baseParameters,
                    denoise: config.lipSyncDenoise ?? true,
                    trim_silence: config.lipSyncTrimSilence ?? true
                }
            };
        case 'smart_reference':
        default:
            return config.image
                ? {
                    endpoint: 'image-to-video',
                    model: config.model,
                    input: {
                        prompt: config.prompt,
                        negative_prompt: config.negativePrompt || undefined,
                        img_url: config.image
                    },
                    parameters: baseParameters
                }
                : {
                    endpoint: 'text-to-video',
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
    const imageUrl = config.mode === 'lip-sync' ? config.targetImage || config.image : config.image;
    const firstReference = imageUrl || (config.referenceImages || [])[0];
    const content: Array<Record<string, unknown>> = [];

    if (config.prompt) {
        content.push({ type: 'text', text: config.prompt });
    }
    if (firstReference) {
        content.push({ type: 'image_url', image_url: { url: firstReference } });
    }

    return {
        endpoint: '/api/v3/contents/generations/tasks',
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
            : undefined
    };
};

const buildKlingPayload = (config: VideoConfig): ProviderPayload => {
    const duration = toDurationSeconds(config.duration);
    const sourceType = config.lipSyncSourceType || 'video';
    const primaryImage = config.image || (config.referenceImages || [])[0];

    switch (config.mode) {
        case 'lip-sync':
            return {
                endpoint: '/v1/videos/lip-sync',
                model: config.model,
                input: {
                    video_url: sourceType === 'video' ? config.targetVideo : undefined,
                    image_url: sourceType === 'image' ? (config.targetImage || primaryImage) : undefined,
                    audio_url: config.driverAudio,
                    text: config.lipSyncDriverType === 'tts' ? config.prompt : undefined
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio,
                    lip_strength: config.lipSyncLipStrength ?? 70,
                    expression_strength: config.lipSyncExpressionStrength ?? 50
                }
            };
        case 'start_end':
            return {
                endpoint: '/v1/videos/extend',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    first_frame_url: config.image,
                    last_frame_url: config.lastFrame
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio
                }
            };
        case 'subject_ref':
        case 'smart_multi':
            return {
                endpoint: '/v1/videos/image-to-video',
                model: config.model,
                input: {
                    prompt: config.prompt,
                    negative_prompt: config.negativePrompt || undefined,
                    image_url: primaryImage,
                    reference_images: config.referenceImages || []
                },
                parameters: {
                    duration,
                    aspect_ratio: config.aspectRatio
                }
            };
        case 'smart_reference':
        default:
            return primaryImage
                ? {
                    endpoint: '/v1/videos/image-to-video',
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
                    endpoint: '/v1/videos/text-to-video',
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
        default:
            pushAsset(assets, 'input_image', 'image', config.image);
            pushAsset(assets, 'input_video', 'video', config.targetVideo);
            break;
    }

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
        generationType: config.mode,
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
