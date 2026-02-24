
import React, { useState } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { VoiceLeftGeneratorPanel } from '../components/VoiceLeftGeneratorPanel';

const VoicePage: React.FC = () => {
    const { history, deleteTask, setConfig, toggleFavorite } = useVoiceStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('voice');
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
            onChatMode={() => navigate(ROUTES.VOICE_CHAT)}
            tasks={displayTasks as any[]} 
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
        />
    );
};

export default VoicePage;
