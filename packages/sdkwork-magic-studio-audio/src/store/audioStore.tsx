import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
    AudioTask,
    AudioGenerationParams,
    createAudioTask,
    createAudioTaskResult,
    hasAudioInputResourceReference,
    resolveAudioInputResourcePath,
    resolveAudioInputResourceUrl,
} from '../entities';
import { audioBusinessService, persistAudioGenerationResult } from '../services';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';
import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import {
    DEFAULT_AUDIO_TTS_MODEL,
    normalizeAudioTextModel,
    normalizeAudioTtsModel,
} from '../utils/audioModel';

interface AudioStoreContextType {
    history: AudioTask[];
    config: AudioGenerationParams;
    isGenerating: boolean;
    setConfig: (config: Partial<AudioGenerationParams>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: AudioTask) => void;
    toggleFavorite: (id: string) => Promise<void>;
    loadHistory: () => Promise<void>;
}

const AudioStoreContext = createContext<AudioStoreContextType | undefined>(undefined);

const DEFAULT_CONFIG: AudioGenerationParams = {
    prompt: '',
    mode: 'text-to-speech',
    model: DEFAULT_AUDIO_TTS_MODEL,
    voice: 'Kore',
    duration: 10,
    mediaType: 'speech',
};

const normalizeConfig = (value: AudioGenerationParams): AudioGenerationParams => ({
    ...value,
    mode: value.mode || 'text-to-speech',
    model:
        (value.mode || 'text-to-speech') === 'text-to-speech'
            ? normalizeAudioTtsModel(value.model)
            : normalizeAudioTextModel(value.model),
    mediaType: 'speech',
});

const normalizeTask = (task: AudioTask): AudioTask => ({
    ...task,
    config: normalizeConfig(task.config),
});

const matchesAudioTaskIdentity = (item: AudioTask, task: AudioTask): boolean => {
    const matchesById =
        typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
    const matchesByUuid =
        typeof task.uuid === 'string' && task.uuid.length > 0
            ? matchesEntityKey(item, task.uuid)
            : false;
    return matchesById || matchesByUuid;
};

const resolveOutcomeTextPayload = (
    outcome: GenerationOutcome
): {
    text: string;
    language?: string;
    segments?: unknown[] | null;
} => {
    const metadata = outcome.delivery.metadata as Record<string, unknown> | undefined;
    const text =
        (typeof metadata?.text === 'string' && metadata.text.trim()) ||
        (typeof metadata?.transcript === 'string' && metadata.transcript.trim()) ||
        '';
    const language =
        typeof metadata?.language === 'string' && metadata.language.trim()
            ? metadata.language.trim()
            : undefined;
    const segments = Array.isArray(metadata?.segments) ? [...metadata.segments] : null;

    return {
        text,
        language,
        segments,
    };
};

const buildTaskResultFromOutcome = async (
    outcome: GenerationOutcome,
    taskUuid: string,
    config: AudioGenerationParams
) => {
    const outcomeMetadata = outcome.delivery.metadata as Record<string, unknown> | undefined;
    const outcomeSourceAudioUrl =
        typeof outcomeMetadata?.sourceAudioUrl === 'string' ? outcomeMetadata.sourceAudioUrl.trim() : '';
    const configSourceAudioUrl = resolveAudioInputResourceUrl(config.sourceAudio);
    const sourceAudioUrl =
        (isRenderableInputResourceUrl(outcomeSourceAudioUrl) ? outcomeSourceAudioUrl : '') ||
        (isRenderableInputResourceUrl(configSourceAudioUrl) ? configSourceAudioUrl : '');
    const sourceAudioPath =
        (typeof outcomeMetadata?.sourceAudioPath === 'string' && outcomeMetadata.sourceAudioPath.trim()) ||
        resolveAudioInputResourcePath(config.sourceAudio);

    if (outcome.primaryArtifact.type !== 'text') {
        return persistAudioGenerationResult({
            outcome,
            name: `audio_gen_${taskUuid}.wav`,
            fallbackDuration: config.duration || 10,
        });
    }

    const payload = resolveOutcomeTextPayload(outcome);
    const fileStem =
        config.sourceAudio?.name?.replace(/\.[^.]+$/, '') ||
        outcome.primaryArtifact.resource?.name?.replace(/\.[^.]+$/, '') ||
        `${config.mode === 'translation' ? 'audio_translation' : 'audio_transcription'}_${taskUuid}`;

    return createAudioTaskResult({
        id: outcome.primaryArtifact.id,
        uuid: outcome.primaryArtifact.uuid,
        assetId: outcome.delivery.assetId ?? outcome.primaryArtifact.assetId ?? null,
        primaryResourceId:
            outcome.delivery.primaryResourceId ?? outcome.primaryArtifact.primaryResourceId ?? null,
        resourceViewId:
            outcome.delivery.resourceViewId ?? outcome.primaryArtifact.resourceViewId ?? null,
        recipeUuid: outcome.recipe.uuid,
        executionUuid: outcome.execution.uuid,
        artifactSetUuid: outcome.artifactSet.uuid,
        artifactUuid: outcome.delivery.artifactUuid || outcome.primaryArtifact.uuid,
        executionId: outcome.execution.id,
        text: payload.text,
        language: payload.language,
        segments: payload.segments,
        resource: {
            id:
                outcome.delivery.primaryResourceId ??
                outcome.primaryArtifact.primaryResourceId ??
                outcome.primaryArtifact.id,
            uuid:
                outcome.primaryArtifact.resource?.uuid ||
                outcome.delivery.artifactUuid ||
                outcome.primaryArtifact.uuid,
            assetId: outcome.delivery.assetId ?? outcome.primaryArtifact.assetId ?? null,
            primaryResourceId:
                outcome.delivery.primaryResourceId ?? outcome.primaryArtifact.primaryResourceId ?? null,
            resourceViewId:
                outcome.delivery.resourceViewId ?? outcome.primaryArtifact.resourceViewId ?? null,
            url: outcome.delivery.url,
            type: MediaResourceType.TEXT,
            mimeType: outcome.delivery.mimeType || 'text/plain',
            name: `${fileStem}.txt`,
            text: payload.text,
            language: payload.language,
            metadata: {
                ...(outcome.delivery.metadata || {}),
                text: payload.text,
                language: payload.language || null,
                segments: payload.segments,
                sourceAudioUrl: sourceAudioUrl || null,
                sourceAudioPath: sourceAudioPath || null,
            },
        },
        duration: outcome.delivery.duration,
    });
};

export const AudioStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<AudioTask[]>([]);
    const [config, setConfigState] = useState<AudioGenerationParams>(normalizeConfig(DEFAULT_CONFIG));
    const [isGenerating, setIsGenerating] = useState(false);

    const loadHistory = useCallback(async () => {
        try {
            const result = await audioBusinessService.audioHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content.map(normalizeTask));
            }
        } catch (error) {
            console.error('Failed to load audio history:', error);
        }
    }, []);

    const setConfig = useCallback((updates: Partial<AudioGenerationParams>) => {
        setConfigState(prev => normalizeConfig({ ...prev, ...updates }));
    }, []);

    const generate = useCallback(async () => {
        const effectiveMode = config.mode || 'text-to-speech';
        const hasPrompt = !!config.prompt.trim();
        const hasSourceAudio = hasAudioInputResourceReference(config.sourceAudio);

        if (effectiveMode === 'text-to-speech' && !hasPrompt) return;
        if (effectiveMode === 'transcription' && !hasSourceAudio) return;
        if (effectiveMode === 'translation' && (!hasSourceAudio || !config.targetLanguage?.trim())) return;
        
        setIsGenerating(true);
        try {
            const taskUuid = generateUUID();
            const timestamp = Date.now();
            const normalizedConfig = normalizeConfig(config);
            const outcome = await audioBusinessService.audioService.generateAudio(normalizedConfig);
            const persistedResult = await buildTaskResultFromOutcome(outcome, taskUuid, normalizedConfig);
            const taskPrompt =
                outcome.recipe.prompt ||
                normalizedConfig.prompt ||
                normalizedConfig.sourceAudio?.name ||
                (effectiveMode === 'translation' ? 'Audio translation' : 'Audio transcription');
            const newTask: AudioTask = createAudioTask({
                id: null,
                uuid: taskUuid,
                status: 'completed',
                prompt: taskPrompt,
                config: {
                    ...normalizedConfig,
                    prompt: taskPrompt,
                },
                createdAt: timestamp,
                updatedAt: timestamp,
                duration: outcome.delivery.duration || normalizedConfig.duration,
                recipe: outcome.recipe,
                execution: outcome.execution,
                artifactSet: outcome.artifactSet,
                results: [persistedResult]
            });
            
            await audioBusinessService.audioHistoryService.save(newTask);
            setHistory(prev => [newTask, ...prev]);
        } catch (error) {
            console.error('Audio generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [config]);

    const deleteTask = useCallback(async (taskKey: string) => {
        try {
            await audioBusinessService.audioHistoryService.deleteById(taskKey);
            setHistory(prev => prev.filter((t) => !matchesEntityKey(t, taskKey)));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }, []);

    const importTask = useCallback((task: AudioTask) => {
        const normalizedTask = normalizeTask(task);
        void audioBusinessService.audioHistoryService.save(normalizedTask).catch((error) => {
            console.error('Failed to persist imported audio task:', error);
        });
        setHistory(prev => [
            normalizedTask,
            ...prev.filter((item) => !matchesAudioTaskIdentity(item, normalizedTask)),
        ]);
    }, []);

    const toggleFavorite = useCallback(async (taskKey: string) => {
        await audioBusinessService.audioHistoryService.toggleFavorite(taskKey);
        setHistory(prev => prev.map((t) =>
            matchesEntityKey(t, taskKey) ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    }, []);

    return (
        <AudioStoreContext.Provider value={{
            history,
            config,
            isGenerating,
            setConfig,
            generate,
            deleteTask,
            importTask,
            toggleFavorite,
            loadHistory,
        }}>
            {children}
        </AudioStoreContext.Provider>
    );
};

export const useAudioStore = () => {
    const context = useContext(AudioStoreContext);
    if (!context) {
        throw new Error('useAudioStore must be used within AudioStoreProvider');
    }
    return context;
};

