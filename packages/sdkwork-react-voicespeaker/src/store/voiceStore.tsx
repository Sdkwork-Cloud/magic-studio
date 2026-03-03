import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VoiceTask, VoiceConfig } from '../entities';
import { voiceBusinessService } from '../services';
import { VOICE_MODELS, PRESET_VOICES } from '../constants';
import { generateUUID } from '@sdkwork/react-commons';
import { inlineDataService } from '@sdkwork/react-core';

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
}

const VoiceStoreContext = createContext<VoiceStoreContextType | undefined>(undefined);

export const VoiceStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<VoiceTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<VoiceConfig>({
        text: '',
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
        if (!config.text.trim() && !config.referenceAudio) return;
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: VoiceTask = {
            id: taskId,
            uuid: taskId,
            type: 'VOICE_TASK',
            speakerId: config.voiceId,
            text: config.text,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await voiceBusinessService.voiceHistoryService.save(newTask);

        try {
            const rawResults = await voiceBusinessService.voiceService.generateSpeech(config);
            const persistedResults = await Promise.all(rawResults.map(async (result, index) => {
                const inlineData = await inlineDataService.tryExtractInlineData(result.url);
                return voiceBusinessService.voiceSpeakerService.persistGeneratedVoiceResult({
                    taskId,
                    index,
                    result,
                    inlineData
                });
            }));
            
            const completedTask: VoiceTask = {
                ...newTask,
                status: 'completed',
                results: persistedResults,
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await voiceBusinessService.voiceHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: VoiceTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await voiceBusinessService.voiceHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await voiceBusinessService.voiceHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        await voiceBusinessService.voiceHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (id: string) => {
        await voiceBusinessService.voiceHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <VoiceStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite
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

