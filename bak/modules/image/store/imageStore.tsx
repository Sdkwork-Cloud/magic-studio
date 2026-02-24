import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ImageTask, GenerationConfig, GeneratedResult } from '../entities/image.entity';
import { imageService } from '../services/imageService';
import { imageHistoryService } from '../services/imageHistoryService';
import { IMAGE_STYLES } from '../constants';
import { platform } from '../../../platform';
import { remixService } from '../../../services/remix/remixService';
import { generateUUID } from '../../../utils';
import { assetService } from '../../assets/services/assetService';

interface ImageStoreContextType {
    history: ImageTask[];
    isGenerating: boolean;
    config: GenerationConfig;
    
    // Actions
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
    initialConfig?: Partial<GenerationConfig>; // Allow external initialization
}

export const ImageStoreProvider: React.FC<ImageStoreProviderProps> = ({ children, initialConfig }) => {
    const [history, setHistory] = useState<ImageTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Merge default config with injected initialConfig
    const [config, setConfigState] = useState<GenerationConfig>({
        prompt: '',
        aspectRatio: '1:1',
        styleId: 'none',
        batchSize: 1,
        // Multi-model support defaults
        useMultiModel: false,
        models: ['gemini-3-flash-image'], 
        ...initialConfig // Override defaults if provided
    });

    // --- Remix Service Hydration ---
    useEffect(() => {
        const intent = remixService.consumeIntent('image');
        if (intent) {
            console.log("[ImageStore] Hydrating from Remix Intent", intent);
            
            const updates: Partial<GenerationConfig> = {
                prompt: intent.prompt,
                negativePrompt: intent.negativePrompt,
            };

            // Map aspect ratio
            if (intent.aspectRatio) {
                 const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
                 if (validRatios.includes(intent.aspectRatio)) {
                     updates.aspectRatio = intent.aspectRatio as any;
                 }
            }

             // Map Media
            if (intent.mediaReferences && intent.mediaReferences.length > 0) {
                const images = intent.mediaReferences.filter(r => r.type === 'IMAGE').map(r => r.url);
                if (images.length > 0) {
                    updates.referenceImages = images;
                    // If 1 image, also populate single ref for backward compat
                    if (images.length === 1) updates.referenceImage = images[0];
                }
            }
            
            setConfigState(prev => ({ ...prev, ...updates }));
        }
    }, []);

    // Load History using Service
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

        // Optimistic UI update
        setHistory(prev => [newTask, ...prev]);
        // Persist pending state
        await imageHistoryService.save(newTask);

        try {
            const style = IMAGE_STYLES.find(s => s.id === config.styleId);
            // Append style prompt (prefer 'prompt' field, fallback to 'value')
            const styleSuffix = style ? (style.prompt || (style as any).value || '') : '';
            const fullPrompt = config.prompt + styleSuffix;
            
            let targetModels = [config.model || 'gemini-3-flash-image'];
            
            // Override with multi-models list if enabled
            if (config.useMultiModel && config.models && config.models.length > 0) {
                targetModels = config.models;
            }

            const allPromises: Promise<GeneratedResult>[] = [];

            // Loop through each selected model
            targetModels.forEach(modelId => {
                const count = config.batchSize || 1;
                // Launch parallel requests for batch size per model
                for(let i=0; i<count; i++) {
                    const p = imageService.generateImage({
                        ...config,
                        prompt: fullPrompt,
                        model: modelId // Override specific model for this call
                    }).then(async (url) => {
                        // Persist immediately to Assets
                        const asset = await assetService.saveGeneratedAsset(url, 'image', {
                            prompt: fullPrompt,
                            model: modelId
                        }, `gen_image_${taskId}_${i}.png`);

                        return {
                            id: generateUUID(),
                            url: asset.path, // Use persistent path
                            modelId: modelId
                        };
                    });
                    allPromises.push(p);
                }
            });

            // Wait for all models to finish (could be optimized to stream results)
            const results = await Promise.all(allPromises);
            
            // Update task with success
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
        // 1. Create a "Pending" Task visible in history immediately
        const taskId = generateUUID();
        const newTask: ImageTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'pending',
            config: {
                prompt: 'Upscaling image to 4K...',
                aspectRatio: '1:1', // Placeholder
                styleId: 'none',
                batchSize: 1,
                mediaType: 'image',
                quality: 'ultra',
                model: 'upscaler-pro'
            }
        };

        setHistory(prev => [newTask, ...prev]);
        await imageHistoryService.save(newTask);

        // 2. Simulate processing (Mock 2 seconds)
        // In a real app, this would call an API with the image URL
        setTimeout(async () => {
            // Persist the "upscaled" version (just saving original again as mock)
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
        // Refresh local state to reflect change
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