
import { GenerationHistoryListPane, GENERATION_TABS } from '@sdkwork/react-assets'
import React, { useState } from 'react';
import { useSfxStore } from '../store/sfxStore';
import { useRouter, ROUTES } from '@sdkwork/react-core';

const SfxPage: React.FC = () => {
    const { history: storeHistory, deleteTask, setConfig } = useSfxStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('audio');

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.SFX_CHAT)}
            tasks={storeHistory as any[]}
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)}
            showFavorites={false}
            onToggleFavorites={(_show: boolean) => {}}
            filter={activeTab}
        />
    );
};

export default SfxPage;
