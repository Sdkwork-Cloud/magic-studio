import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';
import { VoiceTask, VoiceConfig, createVoiceTask } from '../entities';
import { voiceBusinessService } from '../services';
import { VOICE_MODELS, PRESET_VOICES } from '../constants';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';

const matchesVoiceTaskIdentity = (item: VoiceTask, task: VoiceTask): boolean => {
    const matchesById =
        typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
    const matchesByUuid =
        typeof task.uuid === 'string' && task.uuid.length > 0
            ? matchesEntityKey(item, task.uuid)
            : false;
    return matchesById || matchesByUuid;
};

interface VoiceStoreContextType {
    history: VoiceTask[];
    isGenerating: boolean;
    config: VoiceConfig;
    
    // Actions
    setConfig: (config: Partial<VoiceConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    importTask: (task: VoiceTask) => void;
}

const VoiceStoreContext = createContext<VoiceStoreContextType | undefined>(undefined);

export const VoiceStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<VoiceTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<VoiceConfig>({
        text: '',
        previewText: 'Hello, this is a preview of my new voice. How do I sound?',
        mode: 'design',
        inputMethod: 'upload',
        voiceId: PRESET_VOICES[0].id,
        model: VOICE_MODELS[0].id,
        speed: 1.0,
        pitch: 1.0,
        mediaType: 'voice'
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await voiceBusinessService.voiceHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<VoiceConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        const inputText = (config.text || config.previewText || '').trim();
        if (!inputText) return;
        if ((config.mode || 'design') === 'clone' && !config.referenceAudio) return;
        if (isGenerating) return;
        
        setIsGenerating(true);
        const normalizedConfig: VoiceConfig = {
            ...config,
            text: inputText
        };
        
        const taskUuid = generateUUID();
        const newTask: VoiceTask = createVoiceTask({
            id: null,
            uuid: taskUuid,
            config: { ...normalizedConfig },
            speakerId: normalizedConfig.voiceId,
            text: normalizedConfig.text,
            status: 'pending',
            results: []
        });

        setHistory(prev => [newTask, ...prev]);

        try {
            const completedTask = await voiceBusinessService.voiceService.generateTask(normalizedConfig);
            setHistory(prev => [
                completedTask,
                ...prev.filter((t) => !matchesVoiceTaskIdentity(t, completedTask) && !matchesEntityKey(t, newTask.uuid))
            ]);
        } catch (e: any) {
            const failedTask: VoiceTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? failedTask : t)));
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (taskKey: string) => {
        await voiceBusinessService.voiceHistoryService.deleteById(taskKey);
        setHistory(prev => prev.filter((t) => !matchesEntityKey(t, taskKey)));
    };

    const clearHistory = async () => {
        await voiceBusinessService.voiceHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (taskKey: string) => {
        await voiceBusinessService.voiceHistoryService.toggleFavorite(taskKey);
        setHistory(prev => prev.map(t => 
            matchesEntityKey(t, taskKey) ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    const importTask = (task: VoiceTask) => {
        void voiceBusinessService.voiceHistoryService.save(task).catch((error) => {
            console.error('Failed to persist imported voice task:', error);
        });
        setHistory(prev => [task, ...prev.filter((item) => !matchesVoiceTaskIdentity(item, task))]);
    };

    return (
        <VoiceStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite, importTask
        }}>
            {children}
        </VoiceStoreContext.Provider>
    );
};

export const useVoiceStore = () => {
    const context = useContext(VoiceStoreContext);
    if (!context) throw new Error('useVoiceStore must be used within VoiceStoreProvider');
    return context;
};

