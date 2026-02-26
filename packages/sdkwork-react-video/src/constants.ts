
import { ModelProvider, StyleOption, VIDEO_STYLES } from '@sdkwork/react-commons'
import { VideoAspectRatio, VideoDuration, VideoResolution, VideoGenerationMode } from './entities/video.entity';
import { Zap, Globe, Layers, Film, Box, Monitor, Sparkles, ArrowRightLeft, ScanFace, Grid3x3 } from 'lucide-react';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export { VIDEO_STYLES };

export const STORAGE_KEY_VIDEO_HISTORY = 'open_studio_video_history_v1';

export const VIDEO_PROVIDERS: ModelProvider[] = [
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

export const VIDEO_MODELS = [
    {
        id: 'veo-2.0-generate-001',
        name: 'Veo 2',
        description: 'High quality video generation',
        provider: 'google',
        region: 'us-central1',
        badge: 'ULTRA',
        maxAssetsCount: 1,
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
        id: 'text-to-video', 
        label: 'Text to Video', 
        description: 'Generate video from text description',
        icon: Sparkles,
        badge: 'AI',
        badgeColor: 'bg-purple-600'
    },
    { 
        id: 'image-to-video', 
        label: 'Image to Video', 
        description: 'Animate static images',
        icon: ArrowRightLeft,
        badge: 'ANIMATE'
    },
    { 
        id: 'video-to-video', 
        label: 'Video to Video', 
        description: 'Transform existing videos',
        icon: Film,
        badge: 'EDIT'
    },
    { 
        id: 'face-swap', 
        label: 'Face Swap', 
        description: 'Replace faces in videos',
        icon: ScanFace,
        badge: 'FACE'
    },
    { 
        id: 'lip-sync', 
        label: 'Lip Sync', 
        description: 'Sync lips to audio',
        icon: Monitor,
        badge: 'AUDIO'
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

export const VIDEO_DURATIONS = [
    { id: '5s' as VideoDuration, label: '5 seconds', value: 5 },
    { id: '10s' as VideoDuration, label: '10 seconds', value: 10 },
    { id: '60s' as VideoDuration, label: '60 seconds', value: 60 },
];

export const VIDEO_RESOLUTIONS = [
    { id: '720p' as VideoResolution, label: '720p (HD)' },
    { id: '1080p' as VideoResolution, label: '1080p (Full HD)' },
    { id: '4k' as VideoResolution, label: '4K (Ultra HD)' },
];

export const DEFAULT_ASPECT_RATIO: VideoAspectRatio = '16:9';
export const DEFAULT_DURATION: VideoDuration = '5s';
export const DEFAULT_RESOLUTION: VideoResolution = '720p';
export const DEFAULT_GENERATION_MODE: VideoGenerationMode = 'text-to-video';
