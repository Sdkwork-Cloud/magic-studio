import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MusicTask, MusicConfig } from '../entities';
import { musicBusinessService } from '../services';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';
import { inlineDataService } from '@sdkwork/react-core';

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
            const tasks = await musicBusinessService.musicHistoryService.findAll();
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
        await musicBusinessService.musicHistoryService.save(newTask);

        try {
            const result = await musicBusinessService.musicService.generateMusic(config);
            const inlineData = await inlineDataService.tryExtractInlineData(result.url);
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
            await musicBusinessService.musicHistoryService.save(completedTask);

        } catch (e: any) {
            const failedTask: MusicTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await musicBusinessService.musicHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await musicBusinessService.musicHistoryService.delete(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        await musicBusinessService.musicHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
        await musicBusinessService.musicHistoryService.toggleFavorite(id);
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

