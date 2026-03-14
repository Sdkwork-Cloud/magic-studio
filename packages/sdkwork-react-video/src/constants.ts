
import { ModelProvider, VIDEO_STYLES } from '@sdkwork/react-commons'
import {
    VideoAspectRatio,
    VideoDuration,
    VideoResolution,
    VideoGenerationMode,
    type VideoDurationOption,
    type VideoDurationPolicy,
    type VideoApiProviderId,
    type VideoModeAvailability,
    type VideoModelProfile,
    type VideoProviderApiProfile
} from './entities/video.entity';
import { Globe, Film, Box, Monitor, Sparkles, ArrowRightLeft, ScanFace, Focus, ImagePlus, Layers3 } from 'lucide-react';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export { VIDEO_STYLES };

export const STORAGE_KEY_VIDEO_HISTORY = 'open_studio_video_history_v1';

export const VIDEO_PROVIDERS: ModelProvider[] = [
    {
        id: 'aliyun',
        name: 'Alibaba Cloud',
        icon: React.createElement(Box, { size: 14 }),
        color: 'text-orange-500',
        models: [
            { id: 'wan2.2-t2v-plus', name: 'Wan 2.2 T2V Plus', description: 'Text-to-Video (official API)', badge: 'WAN' },
            { id: 'wan2.2-i2v-plus', name: 'Wan 2.2 I2V Plus', description: 'Image-to-Video (official API)', badge: 'WAN' },
            { id: 'wan2.2-kf2v-plus', name: 'Wan 2.2 KF2V Plus', description: 'First/Last Frame to Video', badge: 'KF2V' },
            { id: 'wan2.2-r2v-plus', name: 'Wan 2.2 R2V Plus', description: 'Reference to Video', badge: 'R2V' },
            { id: 'wan-s2v-1.0', name: 'Wan S2V 1.0', description: 'Speech + Portrait Video', badge: 'S2V' }
        ]
    },
    {
        id: 'volcengine',
        name: 'Volcengine',
        icon: React.createElement(Globe, { size: 14 }),
        color: 'text-rose-500',
        models: [
            { id: 'seedance-1-0-pro-250528', name: 'Seedance 1.0 Pro', description: 'Unified text/image video generation', badge: 'SEEDANCE' },
            { id: 'seedance-1-0-lite-t2v-250428', name: 'Seedance 1.0 Lite', description: 'Fast text/image generation', badge: 'FAST' }
        ]
    },
    {
        id: 'kling',
        name: 'Kling AI',
        icon: React.createElement(Film, { size: 14 }),
        color: 'text-violet-500',
        models: [
            { id: 'kling-v2.1-master', name: 'Kling v2.1 Master', description: 'Text/Image/Extend/Lip Sync', badge: 'MASTER' },
            { id: 'kling-v1.6-standard', name: 'Kling v1.6 Standard', description: 'Cost-efficient generation', badge: 'STANDARD' }
        ]
    },
    {
        id: 'google',
        name: 'Google',
        icon: React.createElement(Globe, { size: 14 }),
        color: 'text-green-500',
        models: [
            { id: 'veo-2.0-generate-001', name: 'Veo 2', description: 'High quality video generation', badge: 'ULTRA', badgeColor: 'bg-purple-600' },
            { id: 'veo-3.0-generate-001', name: 'Veo 3', description: 'Latest video model', badge: 'NEW', badgeColor: 'bg-green-600' },
        ]
    },
    {
        id: 'replicate',
        name: 'Replicate',
        icon: React.createElement(Film, { size: 14 }),
        color: 'text-blue-500',
        models: [
            { id: 'minimax/video-01', name: 'MiniMax Video', description: 'Fast video generation', badge: 'FAST' },
            { id: 'minimax/video-01-live', name: 'MiniMax Live', description: 'Real-time generation' },
        ]
    },
    {
        id: 'siliconflow',
        name: 'SiliconFlow',
        icon: React.createElement(Box, { size: 14 }),
        color: 'text-cyan-500',
        models: [
            { id: 'minimax/video-01', name: 'MiniMax Video', description: 'Fast video generation', badge: 'FAST' },
        ]
    },
];

type VideoModelEntry = VideoModelProfile & {
    description: string;
    region: string;
    badge?: string;
    capabilities: {
        maxDuration: number;
        resolutions: VideoResolution[];
        ratios: VideoAspectRatio[];
    };
    durationPolicy?: Partial<Record<VideoGenerationMode, VideoDurationPolicy>>;
};

export const VIDEO_MODELS: VideoModelEntry[] = [
    {
        id: 'wan2.2-t2v-plus',
        name: 'Wan 2.2 T2V Plus',
        description: 'Alibaba Cloud text-to-video model',
        provider: 'aliyun',
        region: 'cn-hangzhou',
        badge: 'WAN',
        maxAssetsCount: 0,
        supportedModes: ['smart_reference'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p', '1080p'],
            ratios: ['16:9', '9:16', '1:1', '3:4', '4:3', '21:9'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 5,
                maxSeconds: 5,
                preferredSeconds: [5]
            }
        }
    },
    {
        id: 'wan2.2-i2v-plus',
        name: 'Wan 2.2 I2V Plus',
        description: 'Alibaba Cloud image-to-video model',
        provider: 'aliyun',
        region: 'cn-hangzhou',
        badge: 'WAN',
        maxAssetsCount: 1,
        supportedModes: ['smart_reference', 'subject_ref'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p', '1080p'],
            ratios: ['16:9', '9:16', '1:1', '3:4', '4:3', '21:9'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 5,
                maxSeconds: 5,
                preferredSeconds: [5]
            },
            subject_ref: {
                minSeconds: 5,
                maxSeconds: 5,
                preferredSeconds: [5]
            }
        }
    },
    {
        id: 'wan2.2-kf2v-plus',
        name: 'Wan 2.2 KF2V Plus',
        description: 'Alibaba Cloud first/last frame to video model',
        provider: 'aliyun',
        region: 'cn-hangzhou',
        badge: 'KF2V',
        maxAssetsCount: 2,
        supportedModes: ['start_end'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p'],
            ratios: ['16:9', '9:16', '1:1', '3:4', '4:3'],
        },
        durationPolicy: {
            start_end: {
                minSeconds: 5,
                maxSeconds: 5,
                preferredSeconds: [5]
            }
        }
    },
    {
        id: 'wan2.2-r2v-plus',
        name: 'Wan 2.2 R2V Plus',
        description: 'Alibaba Cloud reference-to-video model',
        provider: 'aliyun',
        region: 'cn-hangzhou',
        badge: 'R2V',
        maxAssetsCount: 4,
        supportedModes: ['smart_reference', 'smart_multi', 'subject_ref'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p', '1080p'],
            ratios: ['16:9', '9:16', '1:1', '3:4', '4:3'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            },
            smart_multi: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            },
            subject_ref: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            }
        }
    },
    {
        id: 'wan-s2v-1.0',
        name: 'Wan S2V 1.0',
        description: 'Alibaba Cloud speech + portrait lip-sync model',
        provider: 'aliyun',
        region: 'cn-hangzhou',
        badge: 'S2V',
        maxAssetsCount: 1,
        supportedModes: ['lip-sync'],
        capabilities: {
            maxDuration: 60,
            resolutions: ['720p'],
            ratios: ['16:9', '9:16'],
        },
        durationPolicy: {
            'lip-sync': {
                minSeconds: 5,
                maxSeconds: 60,
                preferredSeconds: [5, 10, 20, 30, 60]
            }
        }
    },
    {
        id: 'seedance-1-0-pro-250528',
        name: 'Seedance 1.0 Pro',
        description: 'Volcengine Seedance unified text/image model',
        provider: 'volcengine',
        region: 'cn',
        badge: 'SEEDANCE',
        maxAssetsCount: 1,
        supportedModes: ['smart_reference', 'subject_ref'],
        capabilities: {
            maxDuration: 12,
            resolutions: ['720p', '1080p'],
            ratios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 2,
                maxSeconds: 12,
                preferredSeconds: [4, 6, 8, 10, 12]
            },
            subject_ref: {
                minSeconds: 2,
                maxSeconds: 12,
                preferredSeconds: [4, 6, 8, 10, 12]
            }
        }
    },
    {
        id: 'seedance-1-0-lite-t2v-250428',
        name: 'Seedance 1.0 Lite',
        description: 'Volcengine Seedance low-latency model',
        provider: 'volcengine',
        region: 'cn',
        badge: 'FAST',
        maxAssetsCount: 1,
        supportedModes: ['smart_reference'],
        capabilities: {
            maxDuration: 12,
            resolutions: ['720p'],
            ratios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 2,
                maxSeconds: 10,
                preferredSeconds: [4, 6, 8, 10]
            }
        }
    },
    {
        id: 'kling-v2.1-master',
        name: 'Kling v2.1 Master',
        description: 'Kling full-feature model for text/image/lip-sync',
        provider: 'kling',
        region: 'global',
        badge: 'MASTER',
        maxAssetsCount: 4,
        supportedModes: ['smart_reference', 'subject_ref', 'start_end', 'lip-sync'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p', '1080p'],
            ratios: ['16:9', '9:16', '1:1'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            },
            subject_ref: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            },
            start_end: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            },
            'lip-sync': {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            }
        }
    },
    {
        id: 'kling-v1.6-standard',
        name: 'Kling v1.6 Standard',
        description: 'Kling cost-efficient baseline model',
        provider: 'kling',
        region: 'global',
        badge: 'STANDARD',
        maxAssetsCount: 2,
        supportedModes: ['smart_reference', 'start_end'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p'],
            ratios: ['16:9', '9:16', '1:1'],
        },
        durationPolicy: {
            smart_reference: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            },
            start_end: {
                minSeconds: 5,
                maxSeconds: 10,
                preferredSeconds: [5, 10]
            }
        }
    },
    {
        id: 'veo-2.0-generate-001',
        name: 'Veo 2',
        description: 'High quality video generation',
        provider: 'google',
        region: 'us-central1',
        badge: 'ULTRA',
        maxAssetsCount: 1,
        supportedModes: ['smart_reference'],
        capabilities: {
            maxDuration: 60,
            resolutions: ['720p', '1080p'],
            ratios: ['16:9', '9:16', '1:1'],
        },
    },
    {
        id: 'veo-3.0-generate-001',
        name: 'Veo 3',
        description: 'Latest video model',
        provider: 'google',
        region: 'us-central1',
        badge: 'NEW',
        maxAssetsCount: 1,
        supportedModes: ['smart_reference'],
        capabilities: {
            maxDuration: 60,
            resolutions: ['720p', '1080p', '4k'],
            ratios: ['16:9', '9:16', '1:1'],
        },
    },
    {
        id: 'minimax/video-01',
        name: 'MiniMax Video',
        description: 'Fast video generation',
        provider: 'replicate',
        region: 'us',
        badge: 'FAST',
        maxAssetsCount: 1,
        supportedModes: ['smart_reference'],
        capabilities: {
            maxDuration: 10,
            resolutions: ['720p'],
            ratios: ['16:9', '9:16'],
        },
    },
];

export const VIDEO_GENERATION_MODES: Array<{
    id: VideoGenerationMode;
    label: string;
    description: string;
    icon: LucideIcon;
    badge?: string;
    badgeColor?: string;
}> = [
    { 
        id: 'smart_reference', 
        label: 'All-round Reference', 
        description: 'Use one or multiple references to control style and consistency.',
        icon: Sparkles,
        badge: 'RECOMMENDED',
        badgeColor: 'bg-blue-600'
    },
    { 
        id: 'subject_ref', 
        label: 'Subject Reference', 
        description: 'Keep the same subject identity with a dedicated reference frame.',
        icon: Focus,
        badge: 'SUBJECT'
    },
    { 
        id: 'smart_multi', 
        label: 'Smart Multi-Frame', 
        description: 'Blend multiple keyframes for richer motion and scene continuity.',
        icon: Layers3,
        badge: 'MULTI'
    },
    { 
        id: 'start_end', 
        label: 'Start-End Frame', 
        description: 'Generate smooth transitions between the first and last frames.',
        icon: ImagePlus,
        badge: 'KEYFRAMES'
    },
];

export const VIDEO_PROVIDER_API_PROFILES: Record<VideoApiProviderId, VideoProviderApiProfile> = {
    aliyun: {
        provider: 'aliyun',
        displayName: 'Alibaba Cloud Model Studio',
        docs: [
            {
                title: 'Text-to-Video API',
                url: 'https://www.alibabacloud.com/help/en/model-studio/text-to-video-api-reference',
                official: true,
                summary: 'submit text-to-video tasks with prompt, duration, size and optional negative prompt'
            },
            {
                title: 'Image-to-Video API',
                url: 'https://www.alibabacloud.com/help/en/model-studio/image-to-video-api-reference',
                official: true,
                summary: 'submit image-to-video tasks with image_url, duration, movement options and optional audio'
            },
            {
                title: 'First/Last Frame API',
                url: 'https://www.alibabacloud.com/help/en/model-studio/wanx-image-to-video-api-reference',
                official: true,
                summary: 'supports first_frame_url and last_frame_url keyframe generation'
            },
            {
                title: 'Reference-to-Video API',
                url: 'https://www.alibabacloud.com/help/en/model-studio/reference-to-video-api-reference',
                official: true,
                summary: 'supports reference_urls for identity/style continuity'
            },
            {
                title: 'Speech-to-Video API',
                url: 'https://www.alibabacloud.com/help/en/model-studio/speech-to-video-api-reference',
                official: true,
                summary: 'digital human lip-sync with portrait image + audio'
            }
        ],
        modeSpecs: [
            { mode: 'smart_reference', supported: true, requiredAssets: ['text'], durationRangeSeconds: [5, 10] },
            { mode: 'subject_ref', supported: true, requiredAssets: ['image', 'text'], supportsReferenceImages: true, durationRangeSeconds: [5, 10] },
            { mode: 'smart_multi', supported: true, requiredAssets: ['text', 'image'], supportsReferenceImages: true, durationRangeSeconds: [5, 10] },
            { mode: 'start_end', supported: true, requiredAssets: ['image', 'text'], supportsStartEndFrames: true, durationRangeSeconds: [5, 10] },
            { mode: 'lip-sync', supported: true, requiredAssets: ['image', 'audio'], supportsLipSync: true, durationRangeSeconds: [5, 60] }
        ]
    },
    volcengine: {
        provider: 'volcengine',
        displayName: 'Volcengine Seedance',
        docs: [
            {
                title: 'Seedance Create Task',
                url: 'https://docs.byteplus.com/en/docs/byteplus-modelark/Seedance_create_task',
                official: true,
                summary: 'single endpoint for text/image to video with prompt, ratio, duration and resolution'
            }
        ],
        modeSpecs: [
            { mode: 'smart_reference', supported: true, requiredAssets: ['text'], durationRangeSeconds: [2, 12] },
            { mode: 'subject_ref', supported: true, requiredAssets: ['image', 'text'], supportsReferenceImages: true, durationRangeSeconds: [2, 12] },
            { mode: 'smart_multi', supported: false, requiredAssets: ['image', 'text'], note: 'official docs focus on single image/text input' },
            { mode: 'start_end', supported: false, requiredAssets: ['image', 'text'], note: 'no dedicated first/last frame endpoint in current spec' },
            { mode: 'lip-sync', supported: false, requiredAssets: ['video', 'audio'], note: 'no official lip-sync endpoint in Seedance docs' }
        ]
    },
    kling: {
        provider: 'kling',
        displayName: 'Kling AI',
        docs: [
            {
                title: 'Kling API Docs (community mirror)',
                url: 'https://www.klingapi.com/documents/video_generation',
                official: false,
                summary: 'text/image/extend/lip-sync API fields used for payload compatibility'
            }
        ],
        modeSpecs: [
            { mode: 'smart_reference', supported: true, requiredAssets: ['text'], durationRangeSeconds: [5, 10] },
            { mode: 'subject_ref', supported: true, requiredAssets: ['image', 'text'], supportsReferenceImages: true, durationRangeSeconds: [5, 10] },
            { mode: 'smart_multi', supported: false, requiredAssets: ['image', 'text'], note: 'multi-reference support depends on model tier' },
            { mode: 'start_end', supported: true, requiredAssets: ['image', 'text'], supportsStartEndFrames: true, durationRangeSeconds: [5, 10] },
            { mode: 'lip-sync', supported: true, requiredAssets: ['video', 'audio'], supportsLipSync: true, durationRangeSeconds: [5, 10] }
        ]
    },
    google: {
        provider: 'google',
        displayName: 'Google',
        docs: [],
        modeSpecs: []
    },
    replicate: {
        provider: 'replicate',
        displayName: 'Replicate',
        docs: [],
        modeSpecs: []
    },
    siliconflow: {
        provider: 'siliconflow',
        displayName: 'SiliconFlow',
        docs: [],
        modeSpecs: []
    }
};

export const VIDEO_IMPLEMENTED_MODES: VideoGenerationMode[] = [
    'smart_reference',
    'subject_ref',
    'smart_multi',
    'start_end',
    'lip-sync'
];

export const getVideoModelById = (modelId: string): VideoModelEntry | undefined => {
    return VIDEO_MODELS.find((item) => item.id === modelId);
};

export const getSupportedModesByModel = (modelId: string): VideoGenerationMode[] => {
    const model = getVideoModelById(modelId);
    if (!model || !model.supportedModes || model.supportedModes.length === 0) {
        return VIDEO_IMPLEMENTED_MODES;
    }
    return model.supportedModes;
};

export const buildVideoModeAvailabilityByModel = (
    modelId: string
): Partial<Record<VideoGenerationMode, VideoModeAvailability>> => {
    const supportedModes = new Set(getSupportedModesByModel(modelId));
    const availability: Partial<Record<VideoGenerationMode, VideoModeAvailability>> = {};
    const allExposedModes: VideoGenerationMode[] = [
        ...VIDEO_GENERATION_MODES.map((item) => item.id),
        ...VIDEO_MORE_GENERATION_TOOLS.map((item) => item.id)
    ];

    allExposedModes.forEach((mode) => {
        const implemented = VIDEO_IMPLEMENTED_MODES.includes(mode);
        const providerSupported = supportedModes.has(mode);
        const enabled = implemented && providerSupported;
        availability[mode] = {
            mode,
            enabled,
            reason: implemented
                ? (providerSupported ? undefined : 'Current model does not support this mode')
                : 'Coming soon: this mode is not implemented in UI yet'
        };
    });

    return availability;
};

export const VIDEO_MORE_GENERATION_TOOLS: Array<{
    id: VideoGenerationMode;
    label: string;
    description: string;
    icon: LucideIcon;
    badge?: string;
}> = [
    {
        id: 'lip-sync',
        label: 'Lip Sync',
        description: 'Sync lip movements with audio and dialogue rhythm.',
        icon: Monitor,
        badge: 'AUDIO'
    },
    {
        id: 'face-swap',
        label: 'Face Swap',
        description: 'Replace faces in generated or uploaded clips.',
        icon: ScanFace,
        badge: 'FACE'
    },
    {
        id: 'video-to-video',
        label: 'Video to Video',
        description: 'Transform style and motion of an existing video.',
        icon: Film,
        badge: 'EDIT'
    },
    {
        id: 'image-to-video',
        label: 'Image to Video',
        description: 'Animate a single still image into short clips.',
        icon: ArrowRightLeft,
        badge: 'ANIMATE'
    },
];

export const VIDEO_ASPECT_RATIOS = [
    { id: '16:9' as VideoAspectRatio, label: '16:9 (Landscape)', icon: '▭' },
    { id: '9:16' as VideoAspectRatio, label: '9:16 (Portrait)', icon: '▯' },
    { id: '1:1' as VideoAspectRatio, label: '1:1 (Square)', icon: '□' },
    { id: '4:3' as VideoAspectRatio, label: '4:3 (Standard)', icon: '▭' },
    { id: '3:4' as VideoAspectRatio, label: '3:4 (Portrait)', icon: '▯' },
    { id: '21:9' as VideoAspectRatio, label: '21:9 (Ultrawide)', icon: '▬' },
];

export const VIDEO_DURATION_PRESET_SECONDS: number[] = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 45, 60];

const toDurationId = (seconds: number): VideoDuration => `${Math.max(1, Math.round(seconds))}s` as VideoDuration;

const toDurationSeconds = (duration: VideoDuration): number => {
    const parsed = Number(duration.replace('s', ''));
    return Number.isFinite(parsed) ? parsed : 0;
};

const buildDurationOption = (
    seconds: number,
    recommendedSecondsSet: Set<number>
): VideoDurationOption => {
    return {
        id: toDurationId(seconds),
        seconds,
        label: `${seconds}s`,
        recommended: recommendedSecondsSet.has(seconds),
        enabled: true
    };
};

const getModeDurationPolicyFromProvider = (
    provider: VideoApiProviderId,
    mode: VideoGenerationMode
): VideoDurationPolicy | null => {
    const modeSpec = VIDEO_PROVIDER_API_PROFILES[provider]?.modeSpecs.find((item) => item.mode === mode);
    if (!modeSpec || !modeSpec.durationRangeSeconds) {
        return null;
    }
    return {
        minSeconds: modeSpec.durationRangeSeconds[0],
        maxSeconds: modeSpec.durationRangeSeconds[1]
    };
};

const resolveDurationPolicy = (
    modelId: string,
    mode: VideoGenerationMode
): VideoDurationPolicy => {
    const model = getVideoModelById(modelId);
    if (!model) {
        return {
            minSeconds: 2,
            maxSeconds: 60,
            preferredSeconds: [5, 10]
        };
    }

    const modelModePolicy = model.durationPolicy?.[mode];
    if (modelModePolicy) {
        return modelModePolicy;
    }

    const providerModePolicy = getModeDurationPolicyFromProvider(model.provider, mode);
    if (providerModePolicy) {
        return providerModePolicy;
    }

    const maxDuration = model.capabilities.maxDuration || 60;
    return {
        minSeconds: 2,
        maxSeconds: maxDuration,
        preferredSeconds: maxDuration >= 10 ? [5, 10] : [5]
    };
};

export const resolveVideoDurationOptions = (
    modelId: string,
    mode: VideoGenerationMode
): VideoDurationOption[] => {
    const policy = resolveDurationPolicy(modelId, mode);
    const minSeconds = Math.max(1, policy.minSeconds);
    const maxSeconds = Math.max(minSeconds, policy.maxSeconds);
    const preferredSeconds = (policy.preferredSeconds || []).filter((seconds) => seconds >= minSeconds && seconds <= maxSeconds);

    let candidates: number[] = [];
    if (preferredSeconds.length > 0) {
        candidates = preferredSeconds;
    } else if (policy.stepSeconds && policy.stepSeconds > 0) {
        for (let seconds = minSeconds; seconds <= maxSeconds; seconds += policy.stepSeconds) {
            candidates.push(seconds);
        }
    } else {
        candidates = VIDEO_DURATION_PRESET_SECONDS.filter((seconds) => seconds >= minSeconds && seconds <= maxSeconds);
    }

    if (!candidates.includes(minSeconds)) {
        candidates.push(minSeconds);
    }
    if (!candidates.includes(maxSeconds)) {
        candidates.push(maxSeconds);
    }

    const normalized = Array.from(new Set(candidates))
        .filter((seconds) => Number.isFinite(seconds))
        .sort((a, b) => a - b);
    const recommendedSecondsSet = new Set<number>(preferredSeconds);

    return normalized.map((seconds) => buildDurationOption(seconds, recommendedSecondsSet));
};

export const isDurationSupportedByModelMode = (
    modelId: string,
    mode: VideoGenerationMode,
    duration: VideoDuration
): boolean => {
    return resolveVideoDurationOptions(modelId, mode).some((item) => item.id === duration);
};

export const getDefaultDurationByModelMode = (
    modelId: string,
    mode: VideoGenerationMode
): VideoDuration => {
    const options = resolveVideoDurationOptions(modelId, mode);
    const recommended = options.find((item) => item.recommended);
    if (recommended) {
        return recommended.id;
    }
    return options[0]?.id || DEFAULT_DURATION;
};

export const getNearestSupportedDurationByModelMode = (
    modelId: string,
    mode: VideoGenerationMode,
    duration: VideoDuration
): VideoDuration => {
    const options = resolveVideoDurationOptions(modelId, mode);
    if (options.length === 0) {
        return DEFAULT_DURATION;
    }
    const targetSeconds = toDurationSeconds(duration);
    const exact = options.find((item) => item.seconds === targetSeconds);
    if (exact) {
        return exact.id;
    }

    let nearest = options[0];
    let nearestDistance = Math.abs(options[0].seconds - targetSeconds);
    options.forEach((item) => {
        const distance = Math.abs(item.seconds - targetSeconds);
        if (distance < nearestDistance) {
            nearest = item;
            nearestDistance = distance;
        }
    });
    return nearest.id;
};

export const VIDEO_DURATIONS = resolveVideoDurationOptions('veo-2.0-generate-001', 'smart_reference').map((item) => ({
    id: item.id,
    label: `${item.seconds} seconds`,
    value: item.seconds
}));

export const VIDEO_RESOLUTIONS = [
    { id: '720p' as VideoResolution, label: '720p (HD)' },
    { id: '1080p' as VideoResolution, label: '1080p (Full HD)' },
    { id: '4k' as VideoResolution, label: '4K (Ultra HD)' },
];

export const DEFAULT_ASPECT_RATIO: VideoAspectRatio = '16:9';
export const DEFAULT_DURATION: VideoDuration = '5s';
export const DEFAULT_RESOLUTION: VideoResolution = '720p';
export const DEFAULT_GENERATION_MODE: VideoGenerationMode = 'smart_reference';
