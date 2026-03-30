import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AudioTask, AudioGenerationParams } from '../entities';
import { audioBusinessService } from '../services';
import { importAssetBySdk, importAssetFromUrlBySdk, resolveAssetPrimaryUrlBySdk } from '@sdkwork/react-assets';
import { OFFLINE_DEMO_AUDIO_URL, inlineDataService } from '@sdkwork/react-core';

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
    model: 'gemini-2.5-flash-tts',
    voice: 'Kore',
    duration: 10,
};

export const AudioStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<AudioTask[]>([]);
    const [config, setConfigState] = useState<AudioGenerationParams>(DEFAULT_CONFIG);
    const [isGenerating, setIsGenerating] = useState(false);

    const loadHistory = useCallback(async () => {
        try {
            const result = await audioBusinessService.audioHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        } catch (error) {
            console.error('Failed to load audio history:', error);
        }
    }, []);

    const setConfig = useCallback((updates: Partial<AudioGenerationParams>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    }, []);

    const generate = useCallback(async () => {
        if (!config.prompt.trim()) return;
        
        setIsGenerating(true);
        try {
            const generated = await audioBusinessService.audioService.generateAudio(config);
            const candidateUrl =
                generated.results?.[0]?.url ||
                generated.url ||
                OFFLINE_DEMO_AUDIO_URL;
            const inlineData = await inlineDataService.tryExtractInlineData(candidateUrl);
            const uploaded = inlineData
                ? await importAssetBySdk(
                    {
                        name: `audio_gen_${Date.now()}.wav`,
                        data: inlineData
                    },
                    'audio',
                    { domain: 'audio-studio' }
                )
                : await importAssetFromUrlBySdk(
                    candidateUrl,
                    'audio',
                    {
                        name: `audio_gen_${Date.now()}.wav`,
                        domain: 'audio-studio'
                    }
                );

            const persistedAudioUrl =
                (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
                uploaded.path ||
                candidateUrl;

            const newTask: AudioTask = {
                id: crypto.randomUUID(),
                uuid: crypto.randomUUID(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'completed',
                prompt: config.prompt,
                config: config,
                results: [{
                    url: persistedAudioUrl,
                    duration: config.duration || 10
                }]
            };
            
            await audioBusinessService.audioHistoryService.save(newTask);
            setHistory(prev => [newTask, ...prev]);
        } catch (error) {
            console.error('Audio generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [config]);

    const deleteTask = useCallback(async (id: string) => {
        try {
            await audioBusinessService.audioHistoryService.deleteById(id);
            setHistory(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }, []);

    const importTask = useCallback((task: AudioTask) => {
        setHistory(prev => [task, ...prev]);
    }, []);

    const toggleFavorite = useCallback(async (id: string) => {
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
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

