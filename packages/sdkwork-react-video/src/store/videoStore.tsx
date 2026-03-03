import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VideoTask, VideoConfig, VideoGenerationMode } from '../entities';
import { videoBusinessService } from '../services';
import { VIDEO_MODELS, VIDEO_STYLES } from '../constants';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';
import { inlineDataService } from '@sdkwork/react-core';

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

const resolveVideoScope = (): { workspaceId: string; projectId?: string } => {
    const scope = readWorkspaceScope();
    return {
        workspaceId: scope.workspaceId,
        projectId: scope.projectId
    };
};

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

    // Load History
    useEffect(() => {
        const load = async () => {
            const tasks = await videoBusinessService.videoHistoryService.findAll();
            setHistory(tasks);
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
        
        const taskId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTask: VideoTask = {
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
        await videoBusinessService.videoHistoryService.save(newTask);

        try {
            // Apply style prompt
            const style = VIDEO_STYLES.find(s => s.id === config.styleId);
            const styleSuffix = style ? (style.prompt || '') : '';
            const finalConfig = {
                ...config,
                prompt: config.prompt + styleSuffix
            };

            const result = await videoBusinessService.videoService.generateVideo(finalConfig);
            const videoInlineData = await inlineDataService.tryExtractInlineData(result.url);
            const persistedVideo = await assetBusinessFacade.importVideoStudioAsset({
                scope: resolveVideoScope(),
                type: 'video',
                name: `video_gen_${taskId}.mp4`,
                data: videoInlineData,
                remoteUrl: videoInlineData ? undefined : result.url,
                metadata: {
                    origin: 'ai',
                    source: 'video-studio-generate',
                    model: finalConfig.model,
                    prompt: finalConfig.prompt
                }
            });

            const persistedResult = {
                ...result,
                url: persistedVideo.primaryLocator.uri,
                mp4Url: persistedVideo.primaryLocator.uri
            };
            
            const completedTask: VideoTask = { 
                ...newTask, 
                status: 'completed', 
                results: [persistedResult],
                updatedAt: Date.now()
            };

            setHistory(prev => prev.map(t => t.id === taskId ? completedTask : t));
            await videoBusinessService.videoHistoryService.save(completedTask);

        } catch (e: any) {
            const failedTask: VideoTask = {
                ...newTask,
                status: 'failed',
                error: e.message || 'Unknown error',
                updatedAt: Date.now()
            };
            setHistory(prev => prev.map(t => t.id === taskId ? failedTask : t));
            await videoBusinessService.videoHistoryService.save(failedTask);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteTask = async (id: string) => {
        await videoBusinessService.videoHistoryService.delete(id);
        setHistory(prev => prev.filter(t => t.id !== id));
    };

    const importTask = async (task: VideoTask) => {
        await videoBusinessService.videoHistoryService.save(task);
        setHistory(prev => [task, ...prev]);
    };

    const clearHistory = async () => {
        await videoBusinessService.videoHistoryService.clear();
        setHistory([]);
    };
    
    const toggleFavorite = async (id: string) => {
        await videoBusinessService.videoHistoryService.toggleFavorite(id);
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

