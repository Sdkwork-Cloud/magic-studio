import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MusicTask, MusicConfig } from '../entities';
import { musicService } from '../services/musicService';
import { musicHistoryService } from '../services/musicHistoryService';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';

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
}

const MusicStoreContext = createContext<MusicStoreContextType | undefined>(undefined);

export interface AssetServiceAdapter {
    saveGeneratedAsset: (data: any, type: string, metadata: any, filename: string) => Promise<{ path: string }>;
}

const resolveMusicScope = (): { workspaceId: string; projectId?: string } => {
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

export const MusicStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<MusicTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<MusicConfig>({
        customMode: false,
        prompt: '',
        lyrics: '',
        style: 'pop',
        title: '',
        instrumental: false,
        model: 'suno-v3',
        duration: 180,
        mediaType: 'music'
    });

    useEffect(() => {
        const load = async () => {
            const tasks = await musicHistoryService.findAll();
            setHistory(tasks);
        };
        load();
    }, []);

    const setConfig = (updates: Partial<MusicConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        if (!config.prompt.trim()) return;
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTask: MusicTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: [],
            isFavorite: false
        };

        setHistory(prev => [newTask, ...prev]);
        await musicHistoryService.save(newTask);

        try {
            const result = await musicService.generateMusic(config);
            const inlineData = await tryExtractInlineData(result.url);
            const persisted = await assetBusinessFacade.importMusicAsset({
                scope: resolveMusicScope(),
                type: 'music',
                name: `music_gen_${taskId}.mp3`,
                data: inlineData,
                remoteUrl: inlineData ? undefined : result.url,
                metadata: {
                    origin: 'ai',
                    source: 'music-studio-generate',
                    prompt: config.prompt,
                    title: result.title,
                    duration: result.duration,
                    style: result.style
                }
            });

            const persistedResult = {
                ...result,
                url: persisted.primaryLocator.uri
            };
            
            const completedTask: MusicTask = { 
                ...newTask, 
                status: 'completed', 
                results: [persistedResult],
                updatedAt: Date.now()
            };

            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await musicHistoryService.save(completedTask);

        } catch (e: any) {
            const failedTask: MusicTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await musicHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await musicHistoryService.delete(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        await musicHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
        await musicHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <MusicStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite
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
