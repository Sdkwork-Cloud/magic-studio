
import React, { useState } from 'react';
import { useMusicStore } from '../store/musicStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { ImportData } from '../../../components/generate/upload/types';
import { MusicTask } from '../entities/music.entity';
import { MusicLeftGeneratorPanel } from '../components/MusicLeftGeneratorPanel';
import { generateUUID } from '../../../utils';

const MusicPage: React.FC = () => {
    const { history, deleteTask, setConfig, toggleFavorite, importTask } = useMusicStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('music');
    const [showFavorites, setShowFavorites] = useState(false);

    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;
    
    const handleImport = (data: ImportData) => {
        const task: MusicTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            config: {
                customMode: true,
                prompt: data.prompt,
                lyrics: data.lyrics || '',
                style: data.style || '',
                title: data.title || 'Imported Track',
                instrumental: data.isInstrumental || false,
                model: data.model as any,
                mediaType: 'music'
            },
            results: [{
                id: generateUUID(),
                url: data.fileUrl,
                title: data.title || 'Imported Track',
                duration: data.duration || 0
            }]
        };
        importTask(task);
    };
    
    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.MUSIC_CHAT)}
            tasks={displayTasks as any[]} 
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab} 
            onImport={handleImport}
        />
    );
};

export default MusicPage;
