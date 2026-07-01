
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    ImageTask,
    ImageGenerationConfig,
    GeneratedImageResult,
    createGeneratedImageResult,
    createImageTask,
    hasImageInputResourceReference
} from '../entities';
import { imageBusinessService, persistImageGenerationResult } from '../services';
import { IMAGE_STYLES } from '../constants';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';

interface ImageStoreContextType {
    history: ImageTask[];
    isGenerating: boolean;
    config: ImageGenerationConfig;
    
    setConfig: (config: Partial<ImageGenerationConfig>) => void;
    generate: () => Promise<void>;
    enhancePrompt: (currentText?: string) => Promise<string>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: ImageTask) => Promise<void>;
    upscaleImage: (source: GeneratedImageResult) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const ImageStoreContext = createContext<ImageStoreContextType | undefined>(undefined);

interface ImageStoreProviderProps {
    children: ReactNode;
    initialConfig?: Partial<ImageGenerationConfig>;
}

type StoreGeneratedResult = GeneratedImageResult & {
    modelId?: string;
    recipe?: ImageTask['recipe'];
    execution?: ImageTask['execution'];
    artifactSet?: ImageTask['artifactSet'];
};

const matchesImageTaskIdentity = (item: ImageTask, task: ImageTask): boolean => {
    const matchesById =
        typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
    const matchesByUuid =
        typeof task.uuid === 'string' && task.uuid.length > 0
            ? matchesEntityKey(item, task.uuid)
            : false;
    return matchesById || matchesByUuid;
};

export const ImageStoreProvider: React.FC<ImageStoreProviderProps> = ({ children, initialConfig }) => {
    const [history, setHistory] = useState<ImageTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<ImageGenerationConfig>({
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
            const result = await imageBusinessService.imageHistoryService.findAll({ page: 0, size: 100 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<ImageGenerationConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const enhancePrompt = async (currentText?: string): Promise<string> => {
        const textToEnhance = currentText || config.prompt;
        if (!textToEnhance.trim() || isGenerating) return textToEnhance;
        
        setIsGenerating(true);
        try {
            const enhanced = await imageBusinessService.imageService.enhancePrompt(textToEnhance);
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
        const hasReferenceImage =
            hasImageInputResourceReference(config.referenceImage) ||
            (config.referenceImages || []).some((item) => hasImageInputResourceReference(item));
        if ((!config.prompt.trim() && !hasReferenceImage) || isGenerating) return;
        
        setIsGenerating(true);
        
        const taskUuid = generateUUID();
        const newTask = createImageTask({
            id: null,
            uuid: taskUuid,
            config: { ...config },
            status: 'pending',
            results: []
        });

        setHistory(prev => [newTask, ...prev]);
        await imageBusinessService.imageHistoryService.save(newTask);

        try {
            const style = IMAGE_STYLES.find(s => s.id === config.styleId);
            const styleSuffix = style ? (style.prompt || '') : '';
            const fullPrompt = config.prompt + styleSuffix;
            
            let targetModels = [config.model || 'gemini-3-flash-image'];
            
            if (config.useMultiModel && config.models && config.models.length > 0) {
                targetModels = config.models;
            }

            const allPromises: Promise<StoreGeneratedResult>[] = [];

            targetModels.forEach(modelId => {
                const count = config.batchSize || 1;
                for(let i=0; i<count; i++) {
                    const p = imageBusinessService.imageService.generateImage({
                        ...config,
                        prompt: fullPrompt,
                        model: modelId
                    }).then(async (outcome) => {
                        const storedResult = await persistImageGenerationResult({
                            outcome,
                            name: `gen_image_${taskUuid}_${i}.png`,
                        });

                        return {
                            ...storedResult,
                            id: storedResult.id ?? null,
                            uuid: storedResult.uuid,
                            modelId: outcome.execution.providerModel,
                            recipe: outcome.recipe,
                            execution: outcome.execution,
                            artifactSet: outcome.artifactSet
                        } as StoreGeneratedResult;
                    });
                    allPromises.push(p);
                }
            });

            const results = await Promise.all(allPromises);
            
            const completedTask: ImageTask = { 
                ...newTask, 
                status: 'completed', 
                recipe: results[0]?.recipe,
                execution: results[0]?.execution,
                artifactSet: results[0]?.artifactSet,
                results: results.map(({ recipe: _recipe, execution: _execution, artifactSet: _artifactSet, ...result }) =>
                    createGeneratedImageResult({
                        ...result,
                        id: result.id ?? null,
                        uuid: result.uuid,
                    })
                ) as GeneratedImageResult[],
                updatedAt: Date.now()
            };
            
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? completedTask : t)));
            await imageBusinessService.imageHistoryService.save(completedTask);
            
        } catch (e: any) {
            const failedTask: ImageTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? failedTask : t)));
            await imageBusinessService.imageHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const upscaleImage = async (source: GeneratedImageResult) => {
        const taskUuid = generateUUID();
        const newTask = createImageTask({
            id: null,
            uuid: taskUuid,
            status: 'pending',
            config: {
                prompt: 'Upscaling image...',
                aspectRatio: '1:1',
                styleId: 'none',
                batchSize: 1,
                mediaType: 'image',
                quality: 'ultra',
                model: 'upscaler-pro'
            }
        });

        setHistory(prev => [newTask, ...prev]);
        await imageBusinessService.imageHistoryService.save(newTask);

        try {
            const outcome = await imageBusinessService.imageService.upscaleImage({
                source,
                model: 'upscaler-pro',
                scale: 4,
                format: 'png',
                n: 1,
            });
            const storedResult = await persistImageGenerationResult({
                outcome,
                name: `upscaled_${taskUuid}.png`,
            });
            const upscaledResult = createGeneratedImageResult({
                ...storedResult,
                id: storedResult.id ?? null,
                uuid: storedResult.uuid,
            });

            const completedTask: ImageTask = {
                ...newTask,
                status: 'completed',
                recipe: outcome.recipe,
                execution: outcome.execution,
                artifactSet: outcome.artifactSet,
                updatedAt: Date.now(),
                results: [upscaledResult] as GeneratedImageResult[]
            };

            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? completedTask : t)));
            await imageBusinessService.imageHistoryService.save(completedTask);
        } catch (e: any) {
            const failedTask: ImageTask = {
                ...newTask,
                status: 'failed',
                error: e?.message || 'Upscale save failed',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map((t) => (matchesEntityKey(t, newTask.uuid) ? failedTask : t)));
            await imageBusinessService.imageHistoryService.save(failedTask);
        }
    };

    const deleteTask = async (taskKey: string) => {
        await imageBusinessService.imageHistoryService.deleteById(taskKey);
        setHistory(prev => prev.filter((t) => !matchesEntityKey(t, taskKey)));
    };
    
    const importTask = async (task: ImageTask) => {
        await imageBusinessService.imageHistoryService.save(task);
        setHistory(prev => [task, ...prev.filter((item) => !matchesImageTaskIdentity(item, task))]);
    };

    const clearHistory = async () => {
        await imageBusinessService.imageHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (taskKey: string) => {
        await imageBusinessService.imageHistoryService.toggleFavorite(taskKey);
        setHistory(prev => prev.map((t) =>
            matchesEntityKey(t, taskKey) ? { ...t, isFavorite: !t.isFavorite } : t
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

let remixServiceAdapterOverride: RemixServiceAdapter | null = null;
let assetServiceAdapterOverride: AssetServiceAdapter | null = null;

// Adapter setters for testing and mocking (stub implementations)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setRemixServiceAdapter(_adapter: RemixServiceAdapter) {
    remixServiceAdapterOverride = _adapter;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAssetServiceAdapter(_adapter: AssetServiceAdapter) {
    assetServiceAdapterOverride = _adapter;
}

export function getRemixServiceAdapter(): RemixServiceAdapter | null {
    return remixServiceAdapterOverride;
}

export function getAssetServiceAdapter(): AssetServiceAdapter | null {
    return assetServiceAdapterOverride;
}

