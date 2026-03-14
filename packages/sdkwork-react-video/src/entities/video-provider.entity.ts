import type { VideoAspectRatio, VideoGenerationMode, VideoResolution } from './index';
import type { VideoDuration } from './index';

export type VideoApiProviderId =
    | 'aliyun'
    | 'volcengine'
    | 'kling'
    | 'google'
    | 'replicate'
    | 'siliconflow';

export interface VideoProviderApiDocEntry {
    title: string;
    url: string;
    official: boolean;
    summary?: string;
}

export interface VideoProviderModeSpec {
    mode: VideoGenerationMode;
    supported: boolean;
    requiredAssets: Array<'image' | 'video' | 'audio' | 'text'>;
    supportsNegativePrompt?: boolean;
    supportsReferenceImages?: boolean;
    supportsReferenceVideos?: boolean;
    supportsStartEndFrames?: boolean;
    supportsLipSync?: boolean;
    durationRangeSeconds?: [number, number];
    supportedAspectRatios?: VideoAspectRatio[];
    supportedResolutions?: VideoResolution[];
    note?: string;
}

export interface VideoProviderApiProfile {
    provider: VideoApiProviderId;
    displayName: string;
    docs: VideoProviderApiDocEntry[];
    modeSpecs: VideoProviderModeSpec[];
}

export interface VideoModelProfile {
    id: string;
    name: string;
    provider: VideoApiProviderId;
    supportedModes: VideoGenerationMode[];
    maxAssetsCount?: number;
}

export interface VideoModeAvailability {
    mode: VideoGenerationMode;
    enabled: boolean;
    reason?: string;
}

export interface VideoDurationOption {
    id: VideoDuration;
    seconds: number;
    label: string;
    recommended?: boolean;
    enabled?: boolean;
}

export interface VideoDurationPolicy {
    minSeconds: number;
    maxSeconds: number;
    preferredSeconds?: number[];
    stepSeconds?: number;
}
