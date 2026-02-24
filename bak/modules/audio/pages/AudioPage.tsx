
import React, { useState } from 'react';
import { useAudioStore } from '../store/audioStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { AudioLeftGeneratorPanel } from '../components/AudioLeftGeneratorPanel';

const AudioPage: React.FC = () => {
    const { history, deleteTask, setConfig, toggleFavorite } = useAudioStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('speech');
    const [showFavorites, setShowFavorites] = useState(false);

    // Filter tasks
    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;
    
    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.AUDIO_CHAT)}
            tasks={displayTasks as any[]} 
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
        />
    );
};

export default AudioPage;
