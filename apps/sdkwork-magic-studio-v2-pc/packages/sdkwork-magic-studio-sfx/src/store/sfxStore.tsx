import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SfxTask, SfxConfig, createSfxTask } from '../entities';
import { sfxBusinessService, persistSfxGenerationResult } from '../services';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';
import { DEFAULT_SFX_MODEL } from '../utils/sfxModel';

const matchesSfxTaskIdentity = (item: SfxTask, task: SfxTask): boolean => {
    const matchesById =
        typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
    const matchesByUuid =
        typeof task.uuid === 'string' && task.uuid.length > 0
            ? matchesEntityKey(item, task.uuid)
            : false;
    return matchesById || matchesByUuid;
};

interface SfxStoreContextType {
    history: SfxTask[];
    isGenerating: boolean;
    config: SfxConfig;
    
    // Actions
    setConfig: (config: Partial<SfxConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    importTask: (task: SfxTask) => void;
}

const SfxStoreContext = createContext<SfxStoreContextType | undefined>(undefined);

export const SfxStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<SfxTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<SfxConfig>({
        prompt: '',
        duration: 5,
        model: DEFAULT_SFX_MODEL,
        mediaType: 'sfx'
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await sfxBusinessService.sfxHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<SfxConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        if (!config.prompt.trim() || isGenerating) return;
        
        setIsGenerating(true);
        
        const taskUuid = generateUUID();
        const newTask: SfxTask = createSfxTask({
            id: null,
            uuid: taskUuid,
            config: { ...config },
            status: 'pending',
            results: []
        });

        setHistory(prev => [newTask, ...prev]);
        await sfxBusinessService.sfxHistoryService.save(newTask);

        try {
            const outcome = await sfxBusinessService.sfxService.generateSfx(config);
            const persistedResult = await persistSfxGenerationResult({
                outcome,
                name: `sfx_gen_${taskUuid}.mp3`,
                fallbackDuration: config.duration,
            });
            
            const completedTask: SfxTask = {
                ...newTask,
                recipe: outcome.recipe,
                execution: outcome.execution,
                artifactSet: outcome.artifactSet,
                status: 'completed',
                results: [persistedResult],
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? completedTask : t)));
            await sfxBusinessService.sfxHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: SfxTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? failedTask : t)));
            await sfxBusinessService.sfxHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (taskKey: string) => {
        await sfxBusinessService.sfxHistoryService.deleteById(taskKey);
        setHistory(prev => prev.filter((t) => !matchesEntityKey(t, taskKey)));
    };

    const clearHistory = async () => {
        await sfxBusinessService.sfxHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (taskKey: string) => {
        await sfxBusinessService.sfxHistoryService.toggleFavorite(taskKey);
        setHistory(prev => prev.map((t) =>
            matchesEntityKey(t, taskKey) ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    const importTask = (task: SfxTask) => {
        void sfxBusinessService.sfxHistoryService.save(task);
        setHistory(prev => [task, ...prev.filter((item) => !matchesSfxTaskIdentity(item, task))]);
    };

    return (
        <SfxStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite, importTask
        }}>
            {children}
        </SfxStoreContext.Provider>
    );
};

export const useSfxStore = () => {
    const context = useContext(SfxStoreContext);
    if (!context) throw new Error('useSfxStore must be used within SfxStoreProvider');
    return context;
};

