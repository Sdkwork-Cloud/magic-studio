import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VoiceTask, VoiceConfig } from '../entities';
import { voiceService } from '../services/voiceService';
import { voiceHistoryService } from '../services/voiceHistoryService';
import { VOICE_MODELS, PRESET_VOICES } from '../constants';
import { generateUUID } from '@sdkwork/react-commons';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';

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

const resolveVoiceScope = (): { workspaceId: string; projectId?: string } => {
    const scope = readWorkspaceScope();
    return {
        workspaceId: scope.workspaceId,
        projectId: scope.projectId
    };
};

const tryExtractInlineData = async (source: string): Promise<Uint8Array | undefined> => {
    if (!source) {
        return undefined;
    }
    if (source.startsWith('data:')) {
        const comma = source.indexOf(',');
        if (comma < 0) {
            return undefined;
        }
        const base64 = source.slice(comma + 1);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    if (source.startsWith('blob:')) {
        const response = await fetch(source);
        return new Uint8Array(await response.arrayBuffer());
    }
    return undefined;
};

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
            const result = await voiceHistoryService.findAll({ page: 0, size: 50 });
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
        await voiceHistoryService.save(newTask);

        try {
            const rawResults = await voiceService.generateSpeech(config);
            const persistedResults = await Promise.all(rawResults.map(async (result, index) => {
                const inlineData = await tryExtractInlineData(result.url);
                const persisted = await assetBusinessFacade.importVoiceSpeakerAsset({
                    scope: resolveVoiceScope(),
                    type: 'voice',
                    name: `voice_gen_${taskId}_${index + 1}.wav`,
                    data: inlineData,
                    remoteUrl: inlineData ? undefined : result.url,
                    metadata: {
                        origin: 'ai',
                        source: 'voice-speaker-generate',
                        text: result.text,
                        speakerName: result.speakerName,
                        duration: result.duration
                    }
                });
                return {
                    ...result,
                    url: persisted.primaryLocator.uri
                };
            }));
            
            const completedTask: VoiceTask = {
                ...newTask,
                status: 'completed',
                results: persistedResults,
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await voiceHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: VoiceTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await voiceHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await voiceHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        await voiceHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (id: string) => {
        await voiceHistoryService.toggleFavorite(id);
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
