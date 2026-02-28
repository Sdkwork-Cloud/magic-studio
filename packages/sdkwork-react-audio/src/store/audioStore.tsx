import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AudioTask, AudioGenerationParams } from '../entities';
import { audioHistoryService } from '../services/audioHistoryService';
import { audioService } from '../services/audioService';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';

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

const resolveAudioScope = (): { workspaceId: string; projectId?: string } => {
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

export const AudioStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<AudioTask[]>([]);
    const [config, setConfigState] = useState<AudioGenerationParams>(DEFAULT_CONFIG);
    const [isGenerating, setIsGenerating] = useState(false);

    const loadHistory = useCallback(async () => {
        try {
            const result = await audioHistoryService.findAll({ page: 0, size: 50 });
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
            const generated = await audioService.generateAudio(config);
            const candidateUrl =
                generated.results?.[0]?.url ||
                generated.url ||
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
            const inlineData = await tryExtractInlineData(candidateUrl);
            const persisted = await assetBusinessFacade.importAudioStudioAsset({
                scope: resolveAudioScope(),
                type: 'audio',
                name: `audio_gen_${Date.now()}.wav`,
                data: inlineData,
                remoteUrl: inlineData ? undefined : candidateUrl,
                metadata: {
                    origin: 'ai',
                    source: 'audio-studio-generate',
                    prompt: config.prompt,
                    duration: config.duration
                }
            });

            const newTask: AudioTask = {
                id: crypto.randomUUID(),
                uuid: crypto.randomUUID(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'completed',
                prompt: config.prompt,
                config: config,
                results: [{
                    url: persisted.primaryLocator.uri,
                    duration: config.duration || 10
                }]
            };
            
            await audioHistoryService.save(newTask);
            setHistory(prev => [newTask, ...prev]);
        } catch (error) {
            console.error('Audio generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [config]);

    const deleteTask = useCallback(async (id: string) => {
        try {
            await audioHistoryService.deleteById(id);
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
