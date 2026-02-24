import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SfxTask, SfxConfig } from '../entities/sfx.entity';
import { sfxService } from '../services/sfxService';
import { sfxHistoryService } from '../services/sfxHistoryService';
import { SFX_MODELS } from '../constants';
import { generateUUID } from 'sdkwork-react-commons';

interface SfxStoreContextType {
    history: SfxTask[];
    isGenerating: boolean;
    config: SfxConfig;
    
    // Actions
    setConfig: (config: Partial<SfxConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const SfxStoreContext = createContext<SfxStoreContextType | undefined>(undefined);

export const SfxStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<SfxTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<SfxConfig>({
        prompt: '',
        duration: 5,
        model: SFX_MODELS[0].id,
        mediaType: 'audio'
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await sfxHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<SfxConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        if (!config.prompt.trim() || isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: SfxTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await sfxHistoryService.save(newTask);

        try {
            const rawResults = await sfxService.generateSfx(config);
            
            const completedTask: SfxTask = {
                ...newTask,
                status: 'completed',
                results: rawResults,
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await sfxHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: SfxTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await sfxHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await sfxHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const clearHistory = async () => {
        await sfxHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (id: string) => {
        await sfxHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <SfxStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, clearHistory, toggleFavorite
        }}>
            {children}
        </SfxStoreContext.Provider>
    );
};

export const useSfxStore = () => {
    const context = useContext(SfxStoreContext);
    if (!context) throw new Error('useSfxStore must be used within SfxStoreProvider');
    return context;
};
