
import { GenerationHistoryListPane, GENERATION_TABS } from 'sdkwork-react-assets'
import React, { useState } from 'react';
import { useSfxStore } from '../store/sfxStore';
import { useRouter, ROUTES } from 'sdkwork-react-core';

const SfxPage: React.FC = () => {
    const { history: storeHistory, deleteTask, setConfig, toggleFavorite } = useSfxStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('audio');
    const [showFavorites, setShowFavorites] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

    const displayTasks = showFavorites
        ? storeHistory.filter((t: any) => t.isFavorite)
        : storeHistory;

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.SFX_CHAT)}
            tasks={displayTasks as any[]}
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)} // eslint-disable-line @typescript-eslint/no-unused-vars
            showFavorites={showFavorites}
            onToggleFavorites={(_show: boolean) => {}} // eslint-disable-line @typescript-eslint/no-unused-vars
            filter={activeTab}
        />
    );
};

export default SfxPage;
