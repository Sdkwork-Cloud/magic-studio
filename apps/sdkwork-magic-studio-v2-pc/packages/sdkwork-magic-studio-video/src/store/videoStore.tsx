import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    VideoTask,
    VideoConfig,
    VideoGenerationMode,
    hasVideoInputResourceReference,
    createVideoTask
} from '../entities';
import {
    buildUnifiedVideoGenerationRequest,
    persistVideoGenerationResult,
    videoBusinessService
} from '../services';
import {
    getNearestSupportedDurationByModelMode,
    getSupportedModesByModel,
    VIDEO_MODELS,
    VIDEO_STYLES
} from '../constants';
import {
    resolveGenerationExecutionOutcome,
} from '@sdkwork/magic-studio-core/ai';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { GenerationExecution, GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

interface VideoStoreContextType {
    history: VideoTask[];
    isGenerating: boolean;
    config: VideoConfig;
    
    // Actions
    setConfig: (config: Partial<VideoConfig>) => void;
    setMode: (mode: VideoGenerationMode) => void;
    enhancePrompt: (currentText?: string) => Promise<string>;
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

const resolveLipSyncStage = (
    execution: GenerationExecution | null | undefined
): VideoTask['stage'] => {
    const providerStage = execution?.providerPayload?.stage;
    if (typeof providerStage === 'string' && providerStage.trim().length > 0) {
        return providerStage as VideoTask['stage'];
    }

    switch (execution?.status) {
        case 'queued':
            return 'queued';
        case 'processing':
            return 'processing';
        case 'succeeded':
            return 'succeeded';
        case 'failed':
            return 'failed';
        case 'cancelled':
            return 'canceled';
        default:
            return 'validating';
    }
};

const resolveExecutionErrorCode = (
    execution: GenerationExecution | null | undefined
): string | undefined => {
    const errorCode = execution?.providerPayload?.errorCode;
    if (typeof errorCode === 'string' && errorCode.trim().length > 0) {
        return errorCode;
    }
    return undefined;
};

const matchesVideoTaskIdentity = (item: VideoTask, task: VideoTask): boolean => {
    const matchesById =
        typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
    const matchesByUuid =
        typeof task.uuid === 'string' && task.uuid.length > 0
            ? matchesEntityKey(item, task.uuid)
            : false;
    return matchesById || matchesByUuid;
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
            const result = await videoBusinessService.videoHistoryService.findAll({ page: 0, size: 100 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<VideoConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const setMode = (mode: VideoGenerationMode) => {
        setConfig({ mode });
    };

    const enhancePrompt = async (currentText?: string): Promise<string> => {
        const textToEnhance = currentText || config.prompt;
        if (!textToEnhance.trim() || isGenerating) {
            return textToEnhance;
        }

        setIsGenerating(true);
        try {
            const style = VIDEO_STYLES.find((item) => item.id === config.styleId);
            const enhanced = await videoBusinessService.videoService.enhancePrompt({
                prompt: textToEnhance,
                style: style?.prompt || undefined,
                maxWords: 120,
            });
            setConfig({ prompt: enhanced });
            return enhanced;
        } catch (error) {
            console.error(error);
            return textToEnhance;
        } finally {
            setIsGenerating(false);
        }
    };

    const upsertTask = async (taskKey: string, patch: Partial<VideoTask>): Promise<void> => {
        const existingTask = history.find((task) => matchesEntityKey(task, taskKey));
        const hasExplicitId = Object.prototype.hasOwnProperty.call(patch, 'id');
        const nextId = hasExplicitId ? (patch.id ?? null) : existingTask?.id ?? null;
        const nextUuid = patch.uuid ?? existingTask?.uuid ?? taskKey;
        const updatedAt = Date.now();

        setHistory((prev) =>
            prev.map((task) =>
                matchesEntityKey(task, taskKey) ? { ...task, ...patch, updatedAt } : task
            )
        );
        await videoBusinessService.videoHistoryService.save({
            ...patch,
            id: nextId,
            uuid: nextUuid,
            updatedAt,
        });
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
        const hasStartFrame = hasVideoInputResourceReference(effectiveConfig.image);
        const hasTargetVideo = hasVideoInputResourceReference(effectiveConfig.targetVideo);
        const hasLipSyncSource = lipSyncSourceType === 'image'
            ? hasVideoInputResourceReference(effectiveConfig.targetImage)
            : hasTargetVideo;
        const hasLipSyncDriver = lipDriverType === 'tts'
            ? !!effectiveConfig.prompt.trim()
            : hasVideoInputResourceReference(effectiveConfig.driverAudio);
        const canRunLipSync = hasLipSyncSource && hasLipSyncDriver;
        const hasPrompt = !!effectiveConfig.prompt.trim();
        const canRunStandardGenerate = (() => {
            switch (effectiveConfig.mode) {
                case 'image-to-video':
                    return hasPrompt && hasStartFrame;
                case 'video-to-video':
                    return hasPrompt && hasTargetVideo;
                case 'extend':
                    return hasTargetVideo;
                default:
                    return hasPrompt || hasStartFrame;
            }
        })();

        if ((isLipSyncMode && !canRunLipSync) || (!isLipSyncMode && !canRunStandardGenerate)) {
            return;
        }
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskUuid = generateUUID();
        const taskType = isLipSyncMode ? 'lip_sync' : 'generation';
        const generationRequest = buildUnifiedVideoGenerationRequest(effectiveConfig);
        const newTask: VideoTask = createVideoTask({
            id: null,
            uuid: taskUuid,
            config: { ...effectiveConfig },
            generationRequest,
            status: 'pending',
            stage: isLipSyncMode ? 'validating' : undefined,
            taskType,
            results: [],
            isFavorite: false
        });

        setHistory(prev => [newTask, ...prev]);
        await videoBusinessService.videoHistoryService.save(newTask);

        let latestExecution: GenerationExecution | undefined;

        try {
            if (isLipSyncMode) {
                const created = await videoBusinessService.videoService.createLipSyncTask(generationRequest);
                latestExecution = created;
                await upsertTask(taskUuid, {
                    recipe: created.recipe,
                    execution: created,
                    stage: resolveLipSyncStage(created),
                    provider: created.provider,
                    remoteTaskId: created.remoteJobId || undefined,
                    progress: created.progress || 0
                });

                let completedOutcome: GenerationOutcome | null = resolveGenerationExecutionOutcome(created);
                const maxPollCount = 120;
                for (let i = 0; i < maxPollCount; i += 1) {
                    const execution = await videoBusinessService.videoService.queryLipSyncTask(
                        created.remoteJobId || ''
                    );
                    latestExecution = execution;
                    await upsertTask(taskUuid, {
                        recipe: execution.recipe,
                        execution,
                        status: 'pending',
                        stage: resolveLipSyncStage(execution),
                        provider: execution.provider,
                        remoteTaskId: execution.remoteJobId || undefined,
                        progress: execution.progress || 0
                    });

                    completedOutcome = resolveGenerationExecutionOutcome(execution);
                    if (completedOutcome) {
                        break;
                    }

                    if (execution.status === 'failed' || execution.status === 'cancelled') {
                        const taskError = new Error(execution.error || 'Lip Sync failed');
                        (taskError as Error & { code?: string }).code =
                            resolveExecutionErrorCode(execution);
                        throw taskError;
                    }
                    await sleep(1200);
                }

                if (!completedOutcome) {
                    const timeoutError = new Error('Lip Sync processing timeout');
                    (timeoutError as Error & { code?: string }).code = 'LIPSYNC_TIMEOUT';
                    throw timeoutError;
                }

                const persistedResult = await persistVideoGenerationResult({
                    outcome: completedOutcome,
                    name: `video_gen_${taskUuid}.mp4`,
                });
                const completedTask: VideoTask = {
                    ...newTask,
                    status: 'completed',
                    stage: 'succeeded',
                    progress: 100,
                    recipe: completedOutcome.recipe,
                    execution: completedOutcome.execution,
                    artifactSet: completedOutcome.artifactSet,
                    provider: completedOutcome.execution.provider,
                    remoteTaskId: completedOutcome.execution.remoteJobId || undefined,
                    results: [persistedResult],
                    updatedAt: Date.now()
                };
                setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? completedTask : t)));
                await videoBusinessService.videoHistoryService.save(completedTask);
            } else {
                const requestWithStylePrompt = {
                    ...generationRequest,
                    prompt: `${generationRequest.prompt}${generationRequest.videoStyle.prompt || ''}`
                };
                const outcome = await videoBusinessService.videoService.generateVideo(requestWithStylePrompt);
                const persistedResult = await persistVideoGenerationResult({
                    outcome,
                    name: `video_gen_${taskUuid}.mp4`,
                });

                const completedTask: VideoTask = {
                    ...newTask,
                    status: 'completed',
                    progress: 100,
                    recipe: outcome.recipe,
                    execution: outcome.execution,
                    artifactSet: outcome.artifactSet,
                    results: [persistedResult],
                    updatedAt: Date.now()
                };

                setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? completedTask : t)));
                await videoBusinessService.videoHistoryService.save(completedTask);
            }

        } catch (e: unknown) {
            const failedTask: VideoTask = {
                ...newTask,
                status: 'failed',
                recipe: latestExecution?.recipe,
                execution: latestExecution,
                artifactSet: latestExecution
                    ? resolveGenerationExecutionOutcome(latestExecution)?.artifactSet
                    : undefined,
                stage: isLipSyncMode ? resolveLipSyncStage(latestExecution) : undefined,
                provider: latestExecution?.provider || newTask.provider,
                remoteTaskId: latestExecution?.remoteJobId || newTask.remoteTaskId,
                progress: latestExecution?.progress ?? newTask.progress,
                error: mapVideoErrorMessage(e),
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? failedTask : t)));
            await videoBusinessService.videoHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (taskKey: string) => {
        await videoBusinessService.videoHistoryService.deleteById(taskKey);
        setHistory(prev => prev.filter((t) => !matchesEntityKey(t, taskKey)));
    };

    const importTask = async (task: VideoTask) => {
        await videoBusinessService.videoHistoryService.save(task);
        setHistory(prev => [task, ...prev.filter((item) => !matchesVideoTaskIdentity(item, task))]);
    };

    const clearHistory = async () => {
        await videoBusinessService.videoHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (taskKey: string) => {
        await videoBusinessService.videoHistoryService.toggleFavorite(taskKey);
        setHistory(prev => prev.map((t) =>
            matchesEntityKey(t, taskKey) ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <VideoStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, setMode, enhancePrompt, generate, deleteTask, importTask, clearHistory, toggleFavorite
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

