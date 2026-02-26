import { useRouter, ROUTES } from '@sdkwork/react-core'
import { ImportData as _ImportData, GenerationHistoryListPane, GENERATION_TABS } from '@sdkwork/react-assets' // eslint-disable-line @typescript-eslint/no-unused-vars
import React, { useState } from 'react';
import { useMusicStore } from '../store/musicStore';

const MusicPage: React.FC = () => {
    const { history, deleteTask, setConfig } = useMusicStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('music');
    const [showFavorites, setShowFavorites] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

    const displayTasks = showFavorites
        ? history.filter((t: any) => t.isFavorite)
        : history;

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.MUSIC_CHAT)}
            tasks={displayTasks as any[]}
            onDelete={deleteTask}
            onReuse={(_task: any) => {}} // eslint-disable-line @typescript-eslint/no-unused-vars
            showFavorites={showFavorites}
            onToggleFavorites={(_show: boolean) => {}} // eslint-disable-line @typescript-eslint/no-unused-vars
            filter={activeTab}
            onImport={(_data: _ImportData) => {}} // eslint-disable-line @typescript-eslint/no-unused-vars
        />
    );
};

export default MusicPage;
