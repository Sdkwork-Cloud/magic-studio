import { GeneratedVideoResult, LipSyncStage, UnifiedVideoGenerationRequest } from '../entities';
import {
    OFFLINE_DEMO_VIDEO_URL,
    createOfflineArtwork,
} from '@sdkwork/react-core';

type LipSyncTaskStatus = 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface LipSyncTaskCreateResult {
    taskId: string;
    providerTaskId: string;
    provider: string;
    stage: LipSyncStage;
}

export interface LipSyncTaskState {
    taskId: string;
    status: LipSyncTaskStatus;
    stage: LipSyncStage;
    progress: number;
    result?: GeneratedVideoResult;
    error?: {
        code: string;
        message: string;
    };
}

interface MockLipSyncTaskRecord {
    taskId: string;
    providerTaskId: string;
    provider: string;
    createdAt: number;
    updatedAt: number;
    request: UnifiedVideoGenerationRequest;
    status: LipSyncTaskStatus;
    stage: LipSyncStage;
    progress: number;
    result?: GeneratedVideoResult;
    error?: {
        code: string;
        message: string;
    };
}

const mockLipSyncTasks = new Map<string, MockLipSyncTaskRecord>();

const toServiceError = (code: string, message: string): Error & { code: string } => {
    const error = new Error(message) as Error & { code: string };
    error.code = code;
    return error;
};

const createPoster = (title: string, accent: string): string =>
    createOfflineArtwork({
        title,
        subtitle: 'Offline bundled video preview',
        eyebrow: 'Magic Studio Video',
        accent,
        width: 1280,
        height: 720,
    });

const buildMockLipSyncResult = (taskId: string, modelId: string): GeneratedVideoResult => ({
    id: `lipsync_video_${taskId}`,
    url: OFFLINE_DEMO_VIDEO_URL,
    mp4Url: OFFLINE_DEMO_VIDEO_URL,
    posterUrl: createPoster('Lip Sync Preview', '#5b8cff'),
    modelId
});

const resolveMockLipSyncState = (record: MockLipSyncTaskRecord): LipSyncTaskState => {
    if (record.status === 'failed') {
        return {
            taskId: record.taskId,
            status: record.status,
            stage: 'failed',
            progress: record.progress,
            error: record.error
        };
    }
    if (record.status === 'canceled') {
        return {
            taskId: record.taskId,
            status: record.status,
            stage: 'canceled',
            progress: record.progress,
            error: record.error
        };
    }
    if (record.status === 'succeeded' && record.result) {
        return {
            taskId: record.taskId,
            status: 'succeeded',
            stage: 'succeeded',
            progress: 100,
            result: record.result
        };
    }

    const elapsedMs = Date.now() - record.createdAt;

    if (elapsedMs < 1200) {
        record.status = 'queued';
        record.stage = 'validating';
        record.progress = 5;
    } else if (elapsedMs < 3200) {
        record.status = 'queued';
        record.stage = 'queued';
        record.progress = 18;
    } else if (elapsedMs < 11000) {
        record.status = 'processing';
        record.stage = 'processing';
        const processingElapsed = elapsedMs - 3200;
        const progressive = 20 + Math.floor(processingElapsed / 140);
        record.progress = Math.min(94, progressive);
    } else {
        record.status = 'succeeded';
        record.stage = 'succeeded';
        record.progress = 100;
        record.result = buildMockLipSyncResult(record.taskId, record.request.model);
    }

    record.updatedAt = Date.now();

    return {
        taskId: record.taskId,
        status: record.status,
        stage: record.stage,
        progress: record.progress,
        result: record.result,
        error: record.error
    };
};

// Mock video generation service for demonstration
export const videoService = {
    isConfigured: () => true,

    /**
     * Generate a video using configured models.
     */
    generateVideo: async (request: UnifiedVideoGenerationRequest): Promise<GeneratedVideoResult> => {
        console.log('[VideoService] Generating video with request:', request);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock video generation based on mode
        let videoUrl = '';
        let posterUrl = '';
        
        switch (request.generationType) {
            case 'avatar':
                videoUrl = OFFLINE_DEMO_VIDEO_URL;
                posterUrl = createPoster('Avatar Motion', '#10b981');
                break;
            case 'lip-sync':
                videoUrl = OFFLINE_DEMO_VIDEO_URL;
                posterUrl = createPoster('Lip Sync', '#5b8cff');
                break;
            case 'multi-image':
            case 'smart_multi':
                videoUrl = OFFLINE_DEMO_VIDEO_URL;
                posterUrl = createPoster('Multi Image Motion', '#f97316');
                break;
            case 'image':
            case 'start_end':
            case 'smart_reference':
            case 'subject_ref':
                videoUrl = OFFLINE_DEMO_VIDEO_URL;
                posterUrl = createPoster('Reference Video', '#a855f7');
                break;
            case 'text':
            default:
                videoUrl = OFFLINE_DEMO_VIDEO_URL;
                posterUrl = createPoster('Text To Video', '#06b6d4');
                break;
        }

        return {
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: videoUrl,
            mp4Url: videoUrl,
            posterUrl: posterUrl,
            modelId: request.model
        };
    },

    createLipSyncTask: async (request: UnifiedVideoGenerationRequest): Promise<LipSyncTaskCreateResult> => {
        console.log('[VideoService] Creating lip-sync task:', request);
        await new Promise((resolve) => setTimeout(resolve, 350));

        const sourceType = (request.options?.lipSyncSourceType as string) || 'video';
        const hasSourceVideo = request.assets.some((asset) => asset.role === 'source_video' && asset.type === 'video');
        const hasSourceImage = request.assets.some((asset) => asset.role === 'source_image' && asset.type === 'image');
        const driverType = (request.options?.lipSyncDriverType as string) || 'audio';
        const hasAudioDriver = request.assets.some((asset) => asset.role === 'driver_audio' && asset.type === 'audio');
        const hasTtsDriver = !!request.prompt?.trim();
        const hasDriver = driverType === 'tts' ? hasTtsDriver : hasAudioDriver;
        const hasSource = sourceType === 'image' ? hasSourceImage : hasSourceVideo;

        if (!hasSource || !hasDriver) {
            throw toServiceError('LIPSYNC_INPUT_INVALID', 'Lip Sync requires source media and audio/tts driver.');
        }

        const taskId = `lipsync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const providerTaskId = `mock_provider_${taskId}`;
        const provider = 'mock-kling';

        mockLipSyncTasks.set(taskId, {
            taskId,
            providerTaskId,
            provider,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            request: { ...request },
            status: 'queued',
            stage: 'validating',
            progress: 0
        });

        return {
            taskId,
            providerTaskId,
            provider,
            stage: 'validating'
        };
    },

    queryLipSyncTask: async (taskId: string): Promise<LipSyncTaskState> => {
        await new Promise((resolve) => setTimeout(resolve, 220));

        const record = mockLipSyncTasks.get(taskId);
        if (!record) {
            throw toServiceError('LIPSYNC_TASK_NOT_FOUND', `Lip Sync task not found: ${taskId}`);
        }

        return resolveMockLipSyncState(record);
    },

    cancelLipSyncTask: async (taskId: string): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 180));

        const record = mockLipSyncTasks.get(taskId);
        if (!record) {
            throw toServiceError('LIPSYNC_TASK_NOT_FOUND', `Lip Sync task not found: ${taskId}`);
        }

        if (record.status === 'succeeded') {
            return;
        }

        record.status = 'canceled';
        record.stage = 'canceled';
        record.progress = Math.min(99, record.progress || 0);
        record.error = {
            code: 'LIPSYNC_CANCELED',
            message: 'Lip Sync task canceled by user.'
        };
        record.updatedAt = Date.now();
    },

    /**
     * Resolve media sources to usable format
     */
    resolveMediaSource: async (source: string): Promise<{ mimeType: string, data: string } | null> => {
        if (!source) return null;

        // Handle data URIs
        const matches = source.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            return { mimeType: matches[1], data: matches[2] };
        }

        // Handle file paths
        try {
            // For demo purposes, return mock data
            // In real implementation, this would read actual file data
            return {
                mimeType: source.endsWith('.mp4') ? 'video/mp4' : 'image/png',
                data: 'mock_base64_data'
            };
        } catch (e) {
            console.warn(`[VideoService] Failed to resolve source: ${source}`, e);
            return null;
        }
    }
};
