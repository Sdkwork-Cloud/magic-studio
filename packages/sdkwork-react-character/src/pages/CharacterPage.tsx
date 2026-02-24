import { useRouter, ROUTES } from 'sdkwork-react-core'
import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { GenerationHistoryListPane, GENERATION_TABS } from 'sdkwork-react-assets';

const CharacterPage: React.FC = () => {
    const { history, deleteTask, setConfig } = useCharacterStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('character');

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.CHARACTER_CHAT)}
            tasks={history as any[]}
            onDelete={deleteTask}
            onReuse={(_task: any) => setConfig((_task as any).config)}
            showFavorites={false}
            onToggleFavorites={(_show: boolean) => {}}
            filter={activeTab}
            onImport={(_data: any) => {}}
        />
    );
};

export default CharacterPage;
