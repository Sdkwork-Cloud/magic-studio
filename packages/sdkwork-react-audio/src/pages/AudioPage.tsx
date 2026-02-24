import { useRouter, ROUTES } from 'sdkwork-react-core'
import { ImportData, GenerationHistoryListPane, GENERATION_TABS } from 'sdkwork-react-assets'
import React, { useState, useEffect } from 'react';
import { useAudioStore } from '../store/audioStore';
import { AudioTask } from '../entities/audio.entity';
import { generateUUID } from 'sdkwork-react-commons';

const AudioPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask, loadHistory } = useAudioStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('audio');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        const task: AudioTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            prompt: data.prompt,
            config: {
                prompt: data.prompt,
                model: data.model as any,
                duration: data.duration,
            },
            results: [{
                url: data.fileUrl,
                duration: data.duration
            }]
        };
        importTask(task);
    };

    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.AUDIO_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config || {})}
            filter={activeTab}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            onImport={handleImport}
        />
    );
};

export default AudioPage;
