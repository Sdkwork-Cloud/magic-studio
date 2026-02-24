
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AudioTask, AudioConfig } from '../entities/audio.entity';
import { audioService } from '../services/audioService';
import { audioHistoryService } from '../services/audioHistoryService';
import { AUDIO_MODELS, AUDIO_VOICES } from '../constants';
import { generateUUID } from '../../../utils';
import { assetService } from '../../assets/services/assetService';

interface AudioStoreContextType {
    history: AudioTask[];
    isGenerating: boolean;
    config: AudioConfig;
    
    // Actions
    setConfig: (config: Partial<AudioConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const AudioStoreContext = createContext<AudioStoreContextType | undefined>(undefined);

export const AudioStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<AudioTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<AudioConfig>({
        text: '',
        model: AUDIO_MODELS[0].id,
        voice: AUDIO_VOICES[0].id,
        speed: 1.0,
        language: 'en-US',
        mediaType: 'speech'
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await audioHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<AudioConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        if (!config.text.trim() || isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: AudioTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await audioHistoryService.save(newTask);

        try {
            const results = await audioService.generateSpeech(config);
            
            // Persist all results
            const persistedResults = await Promise.all(results.map(async (res) => {
                const asset = await assetService.saveGeneratedAsset(res.url, 'audio', {
                    prompt: config.text,
                    duration: res.duration
                }, `gen_speech_${taskId}.wav`);
                
                return {
                    ...res,
                    url: asset.path // Use persistent path
                };
            }));

            const completedTask: AudioTask = {
                ...newTask,
                status: 'completed',
                results: persistedResults,
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await audioHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: AudioTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await audioHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await audioHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        await audioHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (id: string) => {
        await audioHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <AudioStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite
        }}>
            {children}
        </AudioStoreContext.Provider>
    );
};

export const useAudioStore = () => {
    const context = useContext(AudioStoreContext);
    if (!context) throw new Error('useAudioStore must be used within AudioStoreProvider');
    return context;
};
