import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MusicTask, MusicConfig, createMusicTask } from '../entities';
import { musicBusinessService, persistMusicGenerationResult } from '../services';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';
import { DEFAULT_MUSIC_MODEL, normalizeMusicModel } from '../utils/musicModel';

export type { MusicTask, MusicConfig }; // Re-export entity types

interface MusicStoreContextType {
    history: MusicTask[];
    isGenerating: boolean;
    config: MusicConfig;
    
    // Actions
    setConfig: (config: Partial<MusicConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    importTask: (task: MusicTask) => void;
}

const MusicStoreContext = createContext<MusicStoreContextType | undefined>(undefined);

export interface AssetServiceAdapter {
    saveGeneratedAsset: (data: any, type: string, metadata: any, filename: string) => Promise<{ path: string }>;
}

const normalizeMusicConfigPatch = (
    updates: Partial<MusicConfig>
): Partial<MusicConfig> => {
    if (!Object.prototype.hasOwnProperty.call(updates, 'model')) {
        return updates;
    }

    return {
        ...updates,
        model: normalizeMusicModel(updates.model),
    };
};

const resolveMusicMode = (config: MusicConfig): NonNullable<MusicConfig['mode']> =>
    config.mode || 'generate';

const resolveCanGenerate = (config: MusicConfig): boolean => {
    const mode = resolveMusicMode(config);
    if (mode === 'similar') {
        return Boolean(config.sourceMusic);
    }
    if (mode === 'remix') {
        return Boolean(config.sourceMusic && config.style.trim());
    }
    if (mode === 'extend') {
        return Boolean(config.sourceMusic && (config.extendDuration || 0) > 0);
    }
    return Boolean(config.prompt.trim());
};

const resolvePersistenceName = (
    mode: NonNullable<MusicConfig['mode']>,
    taskUuid: string
): string => {
    if (mode === 'similar') {
        return `music_similar_${taskUuid}.mp3`;
    }
    if (mode === 'remix') {
        return `music_remix_${taskUuid}.mp3`;
    }
    if (mode === 'extend') {
        return `music_extend_${taskUuid}.mp3`;
    }
    return `music_gen_${taskUuid}.mp3`;
};

const resolvePersistenceTitle = (config: MusicConfig): string => {
    const mode = resolveMusicMode(config);
    if (mode === 'similar') {
        return config.title.trim() || `${config.sourceMusic?.title || 'Generated Music'} Similar`;
    }
    if (mode === 'remix') {
        return config.title.trim() || `${config.sourceMusic?.title || 'Generated Music'} Remix`;
    }
    if (mode === 'extend') {
        return config.title.trim() || `${config.sourceMusic?.title || 'Generated Music'} Extend`;
    }
    return config.title.trim() || 'Generated Music';
};

const resolvePersistenceLyrics = (config: MusicConfig): string => {
    return resolveMusicMode(config) === 'generate'
        ? config.lyrics
        : config.sourceMusic?.lyrics || '';
};

const resolvePersistenceStyle = (config: MusicConfig): string => {
    return config.style.trim() || config.sourceMusic?.style || '';
};

const resolveFallbackDuration = (config: MusicConfig): number => {
    const mode = resolveMusicMode(config);
    if (mode === 'extend') {
        return (config.sourceMusic?.duration || 0) + (config.extendDuration || 0);
    }
    if (mode === 'similar') {
        return config.duration || config.sourceMusic?.duration || 180;
    }
    if (mode === 'remix') {
        return config.sourceMusic?.duration || config.duration || 180;
    }
    return config.duration || 180;
};

const matchesMusicTaskIdentity = (item: MusicTask, task: MusicTask): boolean => {
    const matchesById =
        typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
    const matchesByUuid =
        typeof task.uuid === 'string' && task.uuid.length > 0
            ? matchesEntityKey(item, task.uuid)
            : false;
    return matchesById || matchesByUuid;
};

export const MusicStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<MusicTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<MusicConfig>({
        mode: 'generate',
        customMode: false,
        prompt: '',
        lyrics: '',
        style: 'pop',
        title: '',
        instrumental: false,
        model: DEFAULT_MUSIC_MODEL,
        duration: 180,
        extendDuration: 30,
        sourceMusic: null,
        mediaType: 'music'
    });

    useEffect(() => {
        const load = async () => {
            const result = await musicBusinessService.musicHistoryService.findAll({ page: 0, size: 100 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<MusicConfig>) => {
        const normalizedUpdates = normalizeMusicConfigPatch(updates);
        setConfigState(prev => ({ ...prev, ...normalizedUpdates }));
    };

    const generate = async () => {
        if (!resolveCanGenerate(config)) return;
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskUuid = generateUUID();
        const newTask: MusicTask = createMusicTask({
            id: null,
            uuid: taskUuid,
            config: {
                ...config,
                model: normalizeMusicModel(config.model),
            },
            status: 'pending',
            results: [],
            isFavorite: false
        });

        setHistory(prev => [newTask, ...prev]);
        await musicBusinessService.musicHistoryService.save(newTask);

        try {
            const mode = resolveMusicMode(config);
            const outcome = mode === 'similar'
                ? await musicBusinessService.musicService.generateSimilar({
                    source: config.sourceMusic!,
                    duration: config.duration,
                    model: config.model,
                  })
                : mode === 'remix'
                    ? await musicBusinessService.musicService.remixMusic({
                        source: config.sourceMusic!,
                        style: config.style,
                        model: config.model,
                      })
                    : mode === 'extend'
                        ? await musicBusinessService.musicService.extendMusic({
                            source: config.sourceMusic!,
                            extendDuration: config.extendDuration || 30,
                            style: config.style,
                            model: config.model,
                          })
                        : await musicBusinessService.musicService.generateMusic(config);
            const persistedResult = await persistMusicGenerationResult({
                outcome,
                name: resolvePersistenceName(mode, taskUuid),
                title: resolvePersistenceTitle(config),
                lyrics: resolvePersistenceLyrics(config),
                style: resolvePersistenceStyle(config),
                fallbackDuration: resolveFallbackDuration(config),
            });
            
            const completedTask: MusicTask = { 
                ...newTask, 
                status: 'completed', 
                recipe: outcome.recipe,
                execution: outcome.execution,
                artifactSet: outcome.artifactSet,
                results: [persistedResult],
                updatedAt: Date.now()
            };

            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? completedTask : t)));
            await musicBusinessService.musicHistoryService.save(completedTask);

        } catch (e: any) {
            const failedTask: MusicTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? failedTask : t)));
            await musicBusinessService.musicHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (taskKey: string) => {
        await musicBusinessService.musicHistoryService.deleteById(taskKey);
        setHistory(prev => prev.filter((t) => !matchesEntityKey(t, taskKey)));
    };

    const clearHistory = async () => {
        await musicBusinessService.musicHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (taskKey: string) => {
        await musicBusinessService.musicHistoryService.toggleFavorite(taskKey);
        setHistory(prev => prev.map((t) =>
            matchesEntityKey(t, taskKey) ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    const importTask = (task: MusicTask) => {
        void musicBusinessService.musicHistoryService.save(task).catch((error) => {
            console.error('Failed to persist imported music task:', error);
        });
        setHistory(prev => [task, ...prev.filter((item) => !matchesMusicTaskIdentity(item, task))]);
    };

    return (
        <MusicStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite, importTask
        }}>
            {children}
        </MusicStoreContext.Provider>
    );
};

export const useMusicStore = () => {
    const context = useContext(MusicStoreContext);
    if (!context) throw new Error('useMusicStore must be used within MusicStoreProvider');
    return context;
};

