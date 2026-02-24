
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CharacterTask, CharacterConfig, GeneratedCharacterResult } from '../entities/character.entity';
import { characterService } from '../services/characterService';
import { characterHistoryService } from '../services/characterHistoryService';
import { CHARACTER_MODELS } from '../constants';
import { generateUUID } from '../../../utils';

interface CharacterStoreContextType {
    history: CharacterTask[];
    isGenerating: boolean;
    config: CharacterConfig;
    
    // Actions
    setConfig: (config: Partial<CharacterConfig>) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: CharacterTask) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const CharacterStoreContext = createContext<CharacterStoreContextType | undefined>(undefined);

export const CharacterStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<CharacterTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<CharacterConfig>({
        name: '',
        description: '',
        archetype: 'hero',
        gender: 'female',
        age: '20s',
        
        avatarMode: 'full-body',
        referenceImages: [],
        
        voiceSource: 'preset',
        voiceId: 'Kore', // Default voice
        
        styleId: 'none',
        model: CHARACTER_MODELS[0].id,
        mediaType: 'character',
        aspectRatio: '9:16', // Updated default per request
        batchSize: 1
    });

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await characterHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<CharacterConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const generate = async () => {
        if (!config.description.trim() && !config.name.trim()) return;
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: CharacterTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await characterHistoryService.save(newTask);

        try {
            const results = await characterService.generateCharacter(config);
            const completedTask: CharacterTask = {
                ...newTask,
                status: 'completed',
                results,
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await characterHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: CharacterTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await characterHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await characterHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };
    
    const importTask = async (task: CharacterTask) => {
        await characterHistoryService.save(task);
        setHistory(prev => [task, ...prev]);
    };

    const clearHistory = async () => {
        await characterHistoryService.clear();
        setHistory([]);
    };

    const toggleFavorite = async (id: string) => {
        await characterHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <CharacterStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, deleteTask, importTask, clearHistory, toggleFavorite
        }}>
            {children}
        </CharacterStoreContext.Provider>
    );
};

export const useCharacterStore = () => {
    const context = useContext(CharacterStoreContext);
    if (!context) throw new Error('useCharacterStore must be used within CharacterStoreProvider');
    return context;
};
