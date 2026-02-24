
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ImageTask, GenerationConfig, GeneratedResult } from '../entities/image.entity';
import { imageService } from '../services/imageService';
import { imageHistoryService } from '../services/imageHistoryService';
import { IMAGE_STYLES } from '../constants';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { platform as _platform } from 'sdkwork-react-core';
import { generateUUID } from 'sdkwork-react-commons';
import { assetService } from 'sdkwork-react-assets';

interface ImageStoreContextType {
    history: ImageTask[];
    isGenerating: boolean;
    config: GenerationConfig;
    
    setConfig: (config: Partial<GenerationConfig>) => void;
    generate: () => Promise<void>;
    enhancePrompt: (currentText?: string) => Promise<string>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: ImageTask) => Promise<void>;
    upscaleImage: (url: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const ImageStoreContext = createContext<ImageStoreContextType | undefined>(undefined);

interface ImageStoreProviderProps {
    children: ReactNode;
    initialConfig?: Partial<GenerationConfig>;
}

export const ImageStoreProvider: React.FC<ImageStoreProviderProps> = ({ children, initialConfig }) => {
    const [history, setHistory] = useState<ImageTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<GenerationConfig>({
        prompt: '',
        aspectRatio: '1:1',
        styleId: 'none',
        batchSize: 1,
        useMultiModel: false,
        models: ['gemini-3-flash-image'], 
        ...initialConfig
    });

    useEffect(() => {
        const load = async () => {
            const result = await imageHistoryService.findAll({ page: 0, size: 100 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<GenerationConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const enhancePrompt = async (currentText?: string): Promise<string> => {
        const textToEnhance = currentText || config.prompt;
        if (!textToEnhance.trim() || isGenerating) return textToEnhance;
        
        setIsGenerating(true);
        try {
            const enhanced = await imageService.enhancePrompt(textToEnhance);
            setConfig({ prompt: enhanced });
            return enhanced;
        } catch (e) {
            console.error(e);
            return textToEnhance;
        } finally {
            setIsGenerating(false);
        }
    };

    const generate = async () => {
        if (!config.prompt.trim() || isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: ImageTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await imageHistoryService.save(newTask);

        try {
            const style = IMAGE_STYLES.find(s => s.id === config.styleId);
            const styleSuffix = style ? (style.prompt || '') : '';
            const fullPrompt = config.prompt + styleSuffix;
            
            let targetModels = [config.model || 'gemini-3-flash-image'];
            
            if (config.useMultiModel && config.models && config.models.length > 0) {
                targetModels = config.models;
            }

            const allPromises: Promise<GeneratedResult>[] = [];

            targetModels.forEach(modelId => {
                const count = config.batchSize || 1;
                for(let i=0; i<count; i++) {
                    const p = imageService.generateImage({
                        ...config,
                        prompt: fullPrompt,
                        model: modelId
                    }).then(async (url) => {
                        const asset = await assetService.saveGeneratedAsset(url, 'image', {
                            prompt: fullPrompt,
                            model: modelId
                        }, `gen_image_${taskId}_${i}.png`);

                        return {
                            id: generateUUID(),
                            url: asset.path,
                            modelId: modelId
                        };
                    });
                    allPromises.push(p);
                }
            });

            const results = await Promise.all(allPromises);
            
            const completedTask: ImageTask = { 
                ...newTask, 
                status: 'completed', 
                results,
                updatedAt: Date.now()
            };
            
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await imageHistoryService.save(completedTask);
            
        } catch (e: any) {
            const failedTask: ImageTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await imageHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const upscaleImage = async (url: string) => {
        const taskId = generateUUID();
        const newTask: ImageTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'pending',
            config: {
                prompt: 'Upscaling image to 4K...',
                aspectRatio: '1:1',
                styleId: 'none',
                batchSize: 1,
                mediaType: 'image',
                quality: 'ultra',
                model: 'upscaler-pro'
            }
        };

        setHistory(prev => [newTask, ...prev]);
        await imageHistoryService.save(newTask);

        setTimeout(async () => {
            const asset = await assetService.saveGeneratedAsset(url, 'image', {}, `upscaled_${taskId}.png`);

            const completedTask: ImageTask = {
                ...newTask,
                status: 'completed',
                updatedAt: Date.now(),
                results: [{ 
                    id: generateUUID(), 
                    url: asset.path, 
                    modelId: 'upscaler-pro' 
                }]
            };
            
            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await imageHistoryService.save(completedTask);
        }, 2000);
    };

    const deleteTask = async (id: string) => {
        await imageHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };
    
    const importTask = async (task: ImageTask) => {
        await imageHistoryService.save(task);
        setHistory(prev => [task, ...prev]);
    };

    const clearHistory = async () => {
        await imageHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
        await imageHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <ImageStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, generate, enhancePrompt, deleteTask, importTask, upscaleImage, clearHistory, toggleFavorite
        }}>
            {children}
        </ImageStoreContext.Provider>
    );
};

export const useImageStore = () => {
    const context = useContext(ImageStoreContext);
    if (!context) throw new Error('useImageStore must be used within ImageStoreProvider');
    return context;
};

// Adapter types for dependency injection
export interface RemixServiceAdapter {
    remixImage: (config: any) => Promise<string>;
}

export interface AssetServiceAdapter {
    saveAsset: (data: any) => Promise<any>;
}

export enum RemixIntent {
    INPAINT = 'INPAINT',
    OUTPAINT = 'OUTPAINT',
    VARIATION = 'VARIATION'
}

// Adapter setters for testing and mocking (stub implementations)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setRemixServiceAdapter(_adapter: RemixServiceAdapter) {
    // Stub implementation for future use
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAssetServiceAdapter(_adapter: AssetServiceAdapter) {
    // Stub implementation for future use
}
