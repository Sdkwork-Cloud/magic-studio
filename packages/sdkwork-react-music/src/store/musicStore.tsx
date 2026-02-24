import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MusicTask, MusicConfig } from '../entities/music.entity';
import { musicService } from '../services/musicService';
import { MUSIC_MODELS, MUSIC_STYLES } from '../constants';

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

export type AssetSaveResult = { path: string }; // eslint-disable-line @typescript-eslint/no-unused-vars

let assetAdapter: AssetServiceAdapter | null = null;

export const setAssetServiceAdapter = (adapter: AssetServiceAdapter) => {
    assetAdapter = adapter;
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

        try {
            const result = await musicService.generateMusic(config);
            
            const completedTask: MusicTask = { 
                ...newTask, 
                status: 'completed', 
                results: [result],
                updatedAt: Date.now()
            };

            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));

        } catch (e: any) {
            const failedTask: MusicTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
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
