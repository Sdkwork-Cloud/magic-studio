import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GeneratedVideoResult, VideoTask, VideoConfig, VideoGenerationMode } from '../entities';
import { buildUnifiedVideoGenerationRequest, videoBusinessService } from '../services';
import {
    getNearestSupportedDurationByModelMode,
    getSupportedModesByModel,
    VIDEO_MODELS
} from '../constants';
import { importAssetBySdk, importAssetFromUrlBySdk, resolveAssetPrimaryUrlBySdk } from '@sdkwork/react-assets';
import { inlineDataService } from '@sdkwork/react-core';

interface VideoStoreContextType {
    history: VideoTask[];
    isGenerating: boolean;
    config: VideoConfig;
    
    // Actions
    setConfig: (config: Partial<VideoConfig>) => void;
    setMode: (mode: VideoGenerationMode) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: VideoTask) => Promise<void>; 
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const VideoStoreContext = createContext<VideoStoreContextType | undefined>(undefined);

const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};

const getErrorCode = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object') {
        return undefined;
    }
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : undefined;
};

const mapVideoErrorMessage = (error: unknown): string => {
    const code = getErrorCode(error);
    switch (code) {
        case 'LIPSYNC_INPUT_INVALID':
            return 'Lip Sync requires source media and audio/text driver.';
        case 'LIPSYNC_VIDEO_UNSUPPORTED_CODEC':
            return 'Video codec is unsupported. Please convert to H.264 + AAC.';
        case 'LIPSYNC_AUDIO_UNSUPPORTED_FORMAT':
            return 'Audio format is unsupported. Please upload MP3/WAV.';
        case 'LIPSYNC_DURATION_EXCEEDED':
            return 'Duration exceeds the current model limit.';
        case 'LIPSYNC_PROVIDER_RATE_LIMIT':
            return 'Provider rate limit reached. Please retry later.';
        case 'LIPSYNC_PROVIDER_UNAVAILABLE':
            return 'Lip Sync provider is temporarily unavailable.';
        case 'LIPSYNC_TASK_NOT_FOUND':
            return 'Lip Sync task not found or expired.';
        case 'LIPSYNC_PERMISSION_DENIED':
            return 'Permission denied for Lip Sync task.';
        case 'LIPSYNC_CANCELED':
            return 'Lip Sync task canceled.';
        default:
            break;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }
    return 'Unknown error';
};

export const VideoStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<VideoTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<VideoConfig>({
        mode: 'smart_reference',
        prompt: '',
        negativePrompt: '',
        styleId: 'none', // Default to none
        aspectRatio: '16:9',
        resolution: '720p',
        duration: '5s',
        fps: 30,
        model: VIDEO_MODELS[0].id,
        useMultiModel: false,
        models: [VIDEO_MODELS[0].id],
        mediaType: 'video',
        referenceImages: [],
        batchSize: 1,
        shotType: 'single-shot',
        promptExtend: true,
        watermark: true,
        generateAudio: false,
        cameraFixed: false,
        lipSyncDriverType: 'audio',
        lipSyncSourceType: 'video',
        lipSyncSyncMode: 'standard',
        lipSyncPreset: 'dialogue',
        lipSyncLipStrength: 70,
        lipSyncExpressionStrength: 50,
        lipSyncPreserveHeadMotion: true,
        lipSyncDenoise: true,
        lipSyncTrimSilence: true,
        lipSyncTargetLufs: -16,
        lipSyncKeepOriginalBgm: false
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const tasks = await videoBusinessService.videoHistoryService.findAll();
            setHistory(tasks);
        };
        load();
    }, []);

    const setConfig = (updates: Partial<VideoConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const setMode = (mode: VideoGenerationMode) => {
        setConfig({ mode });
    };

    const upsertTask = async (taskId: string, patch: Partial<VideoTask>): Promise<void> => {
        setHistory((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, ...patch, updatedAt: Date.now() } : task))
        );
        await videoBusinessService.videoHistoryService.save({
            id: taskId,
            ...patch,
            updatedAt: Date.now()
        } as Partial<VideoTask> & { id: string });
    };

    const persistGeneratedResult = async (
        taskId: string,
        result: GeneratedVideoResult
    ): Promise<GeneratedVideoResult> => {
        const videoInlineData = await inlineDataService.tryExtractInlineData(result.url);
        const uploaded = videoInlineData
            ? await importAssetBySdk(
                {
                    name: `video_gen_${taskId}.mp4`,
                    data: videoInlineData
                },
                'video',
                { domain: 'video-studio' }
            )
            : await importAssetFromUrlBySdk(
                result.url,
                'video',
                {
                    name: `video_gen_${taskId}.mp4`,
                    domain: 'video-studio'
                }
            );

        const persistedVideoUrl =
            (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
            uploaded.path ||
            result.url;

        return {
            ...result,
            url: persistedVideoUrl,
            mp4Url: persistedVideoUrl
        };
    };

    const generate = async () => {
        const supportedModes = getSupportedModesByModel(config.model);
        if (!supportedModes.includes(config.mode)) {
            return;
        }

        const normalizedDuration = getNearestSupportedDurationByModelMode(
            config.model,
            config.mode,
            config.duration
        );
        const effectiveConfig: VideoConfig = normalizedDuration === config.duration
            ? config
            : { ...config, duration: normalizedDuration };
        if (normalizedDuration !== config.duration) {
            setConfig({ duration: normalizedDuration });
        }

        const isLipSyncMode = effectiveConfig.mode === 'lip-sync';
        const lipSyncSourceType = effectiveConfig.lipSyncSourceType || 'video';
        const lipDriverType = effectiveConfig.lipSyncDriverType || 'audio';
        const hasLipSyncSource = lipSyncSourceType === 'image'
            ? !!effectiveConfig.targetImage
            : !!effectiveConfig.targetVideo;
        const hasLipSyncDriver = lipDriverType === 'tts'
            ? !!effectiveConfig.prompt.trim()
            : !!effectiveConfig.driverAudio;
        const canRunLipSync = hasLipSyncSource && hasLipSyncDriver;
        const canRunStandardGenerate = !!effectiveConfig.prompt.trim() || !!effectiveConfig.image;

        if ((isLipSyncMode && !canRunLipSync) || (!isLipSyncMode && !canRunStandardGenerate)) {
            return;
        }
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = `${isLipSyncMode ? 'lipsync' : 'video'}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const taskType = isLipSyncMode ? 'lip_sync' : 'generation';
        const generationRequest = buildUnifiedVideoGenerationRequest(effectiveConfig);
        const newTask: VideoTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...effectiveConfig },
            generationRequest,
            status: 'pending',
            stage: isLipSyncMode ? 'validating' : undefined,
            taskType,
            provider: isLipSyncMode ? 'mock-kling' : undefined,
            results: [],
            isFavorite: false
        };

        setHistory(prev => [newTask, ...prev]);
        await videoBusinessService.videoHistoryService.save(newTask);

        try {
            if (isLipSyncMode) {
                const created = await videoBusinessService.videoService.createLipSyncTask(generationRequest);
                await upsertTask(taskId, {
                    stage: created.stage,
                    provider: created.provider,
                    remoteTaskId: created.taskId,
                    progress: 5
                });

                let remoteResult: GeneratedVideoResult | undefined;
                const maxPollCount = 120;
                for (let i = 0; i < maxPollCount; i += 1) {
                    const state = await videoBusinessService.videoService.queryLipSyncTask(created.taskId);
                    await upsertTask(taskId, {
                        status: 'pending',
                        stage: state.stage,
                        progress: state.progress || 0
                    });

                    if (state.status === 'succeeded' && state.result) {
                        remoteResult = state.result;
                        break;
                    }
                    if (state.status === 'failed' || state.status === 'canceled') {
                        const taskError = new Error(state.error?.message || 'Lip Sync failed');
                        (taskError as Error & { code?: string }).code = state.error?.code;
                        throw taskError;
                    }
                    await sleep(1200);
                }

                if (!remoteResult) {
                    const timeoutError = new Error('Lip Sync processing timeout');
                    (timeoutError as Error & { code?: string }).code = 'LIPSYNC_TIMEOUT';
                    throw timeoutError;
                }

                const persistedResult = await persistGeneratedResult(taskId, remoteResult);
                const completedTask: VideoTask = {
                    ...newTask,
                    status: 'completed',
                    stage: 'succeeded',
                    progress: 100,
                    provider: created.provider,
                    remoteTaskId: created.taskId,
                    results: [persistedResult],
                    updatedAt: Date.now()
                };
                setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
                await videoBusinessService.videoHistoryService.save(completedTask);
            } else {
                const requestWithStylePrompt = {
                    ...generationRequest,
                    prompt: `${generationRequest.prompt}${generationRequest.videoStyle.prompt || ''}`
                };
                const result = await videoBusinessService.videoService.generateVideo(requestWithStylePrompt);
                const persistedResult = await persistGeneratedResult(taskId, result);

                const completedTask: VideoTask = {
                    ...newTask,
                    status: 'completed',
                    progress: 100,
                    results: [persistedResult],
                    updatedAt: Date.now()
                };

                setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
                await videoBusinessService.videoHistoryService.save(completedTask);
            }

        } catch (e: unknown) {
            const failedTask: VideoTask = {
                ...newTask,
                status: 'failed',
                stage: isLipSyncMode ? 'failed' : undefined,
                error: mapVideoErrorMessage(e),
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await videoBusinessService.videoHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await videoBusinessService.videoHistoryService.delete(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const importTask = async (task: VideoTask) => {
        await videoBusinessService.videoHistoryService.save(task);
        setHistory(prev => [task, ...prev]);
    };

    const clearHistory = async () => {
        await videoBusinessService.videoHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
        await videoBusinessService.videoHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <VideoStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, setMode, generate, deleteTask, importTask, clearHistory, toggleFavorite
        }}>
            {children}
        </VideoStoreContext.Provider>
    );
};

export const useVideoStore = () => {
    const context = useContext(VideoStoreContext);
    if (!context) throw new Error('useVideoStore must be used within VideoStoreProvider');
    return context;
};

