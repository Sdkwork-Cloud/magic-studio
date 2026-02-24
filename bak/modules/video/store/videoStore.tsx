
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VideoTask, VideoConfig, GeneratedVideoResult, VideoGenerationMode } from '../entities/video.entity';
import { videoService } from '../services/videoService';
import { videoHistoryService } from '../services/videoHistoryService';
import { VIDEO_MODELS, VIDEO_STYLES } from '../constants';
import { platform } from '../../../platform';
import { remixService } from '../../../services/remix/remixService';
import { generateUUID } from '../../../utils';
import { assetService } from '../../assets/services/assetService';

interface VideoStoreContextType {
    history: VideoTask[];
    isGenerating: boolean;
    config: VideoConfig;
    
    // Actions
    setConfig: (config: Partial<VideoConfig>) => void;
    setMode: (mode: VideoGenerationMode) => void;
    generate: () => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    importTask: (task: VideoTask) => Promise<void>; 
    clearHistory: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

const VideoStoreContext = createContext<VideoStoreContextType | undefined>(undefined);

export const VideoStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<VideoTask[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [config, setConfigState] = useState<VideoConfig>({
        mode: 'start_end',
        prompt: '',
        negativePrompt: '',
        styleId: 'none', // Default to none
        aspectRatio: '16:9',
        resolution: '720p',
        duration: '5s',
        fps: 30,
        model: VIDEO_MODELS[0].id,
        useMultiModel: false,
        models: [VIDEO_MODELS[0].id],
        mediaType: 'video',
        referenceImages: [],
        batchSize: 1,
    });

    // --- Remix Service Hydration ---
    useEffect(() => {
        const intent = remixService.consumeIntent('video');
        if (intent) {
            console.log("[VideoStore] Hydrating from Remix Intent", intent);
            
            const updates: Partial<VideoConfig> = {
                prompt: intent.prompt,
                negativePrompt: intent.negativePrompt,
            };

            // Map aspect ratio
            if (intent.aspectRatio) {
                 const validRatios = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
                 if (validRatios.includes(intent.aspectRatio)) {
                     updates.aspectRatio = intent.aspectRatio as any;
                 }
            }

            // Map Model
            if (intent.modelId) {
                const validModel = VIDEO_MODELS.find(m => m.id === intent.modelId);
                if (validModel) updates.model = validModel.id;
            }
            
            setConfigState(prev => ({ ...prev, ...updates }));
        }
    }, []);

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await videoHistoryService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                setHistory(result.data.content);
            }
        };
        load();
    }, []);

    const setConfig = (updates: Partial<VideoConfig>) => {
        setConfigState(prev => ({ ...prev, ...updates }));
    };

    const setMode = (mode: VideoGenerationMode) => {
        setConfig({ mode });
    };

    const generate = async () => {
        if (!config.prompt.trim() && !config.image) return;
        if (isGenerating) return;
        
        setIsGenerating(true);
        
        const taskId = generateUUID();
        const newTask: VideoTask = {
            id: taskId,
            uuid: taskId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            config: { ...config },
            status: 'pending',
            results: []
        };

        setHistory(prev => [newTask, ...prev]);
        await videoHistoryService.save(newTask);

        try {
            // Apply style prompt
            const style = VIDEO_STYLES.find(s => s.id === config.styleId);
            const styleSuffix = style ? (style.prompt || '') : '';
            const finalConfig = {
                ...config,
                prompt: config.prompt + styleSuffix
            };

            const resultUrl = await videoService.generateVideo(finalConfig);
            
            // Persist to VFS
            const asset = await assetService.saveGeneratedAsset(resultUrl, 'video', {
                prompt: finalConfig.prompt,
                model: finalConfig.model,
                duration: 5
            }, `gen_video_${taskId}.mp4`);

            const result: GeneratedVideoResult = {
                id: generateUUID(),
                url: asset.path,
                modelId: config.model
            };
            
            const completedTask: VideoTask = { 
                ...newTask, 
                status: 'completed', 
                results: [result],
                updatedAt: Date.now()
            };

            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await videoHistoryService.save(completedTask);

        } catch (e: any) {
            const failedTask: VideoTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await videoHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await videoHistoryService.deleteById(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const importTask = async (task: VideoTask) => {
        await videoHistoryService.save(task);
        setHistory(prev => [task, ...prev]);
    };

    const clearHistory = async () => {
        await videoHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
        await videoHistoryService.toggleFavorite(id);
        setHistory(prev => prev.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    };

    return (
        <VideoStoreContext.Provider value={{
            history, isGenerating, config,
            setConfig, setMode, generate, deleteTask, importTask, clearHistory, toggleFavorite
        }}>
            {children}
        </VideoStoreContext.Provider>
    );
};

export const useVideoStore = () => {
    const context = useContext(VideoStoreContext);
    if (!context) throw new Error('useVideoStore must be used within VideoStoreProvider');
    return context;
};
