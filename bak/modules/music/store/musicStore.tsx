
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MusicTask, MusicConfig } from '../entities/music.entity';
import { musicService } from '../services/musicService';
import { musicHistoryService } from '../services/musicHistoryService';
import { MUSIC_MODELS } from '../constants';
import { generateUUID } from '../../../utils';
import { assetService } from '../../assets/services/assetService';
import { AssetType } from '../../assets/entities/asset.entity';

interface MusicStoreContextType {
    history: MusicTask[];
    isGenerating: boolean;
    config: MusicConfig;
    
    // Actions
    setConfig: (config: Partial<MusicConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: MusicTask) => Promise<void>; 
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const MusicStoreContext = createContext<MusicStoreContextType | undefined>(undefined);

export const MusicStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<MusicTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<MusicConfig>({
        customMode: false,
        prompt: '',
        lyrics: '',
        style: '',
        title: '',
        instrumental: false,
        model: 'suno-v3.5',
        mediaType: 'music'
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await musicHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<MusicConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        const hasContent = config.customMode ? (config.lyrics.trim() || config.style.trim()) : config.prompt.trim();
        if (!hasContent || isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: MusicTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await musicHistoryService.save(newTask);

        try {
            const rawResults = await musicService.generateMusic(config);
            
            // Persist to Assets
            const persistedResults = await Promise.all(rawResults.map(async (res) => {
                try {
                     // We use 'music' category if available, but AssetType usually has 'audio' or 'music'
                     // Assuming 'music' is added to AssetType or mapped to 'audio'
                     const asset = await assetService.saveGeneratedAsset(
                         res.url, 
                         'music' as AssetType, 
                         {
                             prompt: config.prompt,
                             title: res.title,
                             duration: res.duration
                         }, 
                         `gen_music_${taskId}_${res.id}.mp3`
                     );
                     return { ...res, url: asset.path };
                } catch (e) {
                    console.error("Failed to persist music asset", e);
                    // Fallback to original URL if save fails (though less durable)
                    return res;
                }
            }));

            const completedTask: MusicTask = {
                ...newTask,
                status: 'completed',
                results: persistedResults,
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
        await musicHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };
    
    const importTask = async (task: MusicTask) => {
        await musicHistoryService.save(task);
        setHistory(prev => [task, ...prev]);
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
            setConfig, generate, deleteTask, importTask, clearHistory, toggleFavorite
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
