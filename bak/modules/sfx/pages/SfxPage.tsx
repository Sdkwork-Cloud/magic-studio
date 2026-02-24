
import React, { useState } from 'react';
import { useSfxStore } from '../store/sfxStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { SfxLeftGeneratorPanel } from '../components/SfxLeftGeneratorPanel';

const SfxPage: React.FC = () => {
    const { history, deleteTask, setConfig, toggleFavorite } = useSfxStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('audio');
    const [showFavorites, setShowFavorites] = useState(false);

    // Filter tasks based on favorites if enabled
    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;
    
    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.SFX_CHAT)}
            tasks={displayTasks as any[]} 
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab} 
        />
    );
};

export default SfxPage;
