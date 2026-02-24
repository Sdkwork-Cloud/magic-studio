
import React, { useState } from 'react';
import { useImageStore } from '../store/imageStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { ImageTask } from '../entities/image.entity';
import { ImportData } from '../../../components/generate/upload/types';
import { ImageLeftGeneratorPanel } from '../components/ImageLeftGeneratorPanel';
import { generateUUID } from '../../../utils';

const ImagePage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useImageStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('image');
    const [showFavorites, setShowFavorites] = useState(false);

    const displayTasks = showFavorites 
        ? history.filter(t => (t as any).isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        const task: ImageTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            config: {
                prompt: data.prompt,
                aspectRatio: (data.aspectRatio as any) || '1:1',
                styleId: 'none',
                batchSize: 1,
                mediaType: (data.type === 'video' ? 'video' : 'image') as any,
                model: data.model,
                negativePrompt: data.negativePrompt
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
            onChatMode={() => navigate(ROUTES.IMAGE_CHAT)}
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

export default ImagePage;
