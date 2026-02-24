import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { ImportData } from '../../../components/generate/upload/types';
import { VideoTask } from '../entities/video.entity';
import { VideoLeftGeneratorPanel } from '../components/VideoLeftGeneratorPanel';
import { generateUUID } from '../../../utils';

const VideoPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useVideoStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('video');
    const [showFavorites, setShowFavorites] = useState(false);

    const displayTasks = showFavorites 
        ? history.filter(t => (t as any).isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        // Map generic import data to VideoTask
        const task: VideoTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            config: {
                mode: 'text',
                prompt: data.prompt,
                aspectRatio: (data.aspectRatio as any) || '16:9',
                resolution: (data.resolution as any) || '720p',
                duration: (data.duration ? `${data.duration}s` : '5s') as any,
                fps: (data.fps as any) || 30,
                model: data.model,
                styleId: data.style || 'none',
                mediaType: (data.type === 'video' ? 'video' : 'image') as any // Respect type or fallback
            },
            results: [{
                id: generateUUID(),
                url: data.fileUrl,
                posterUrl: data.coverUrl
            }]
        };
        importTask(task);
    };

    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.VIDEO_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            filter={activeTab}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            onImport={handleImport}
        />
    );
};

export default VideoPage;