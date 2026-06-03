
import { GenerationHistoryListPane, GENERATION_TABS, type ImportData } from '@sdkwork/magic-studio-assets/generation'
import React, { useState } from 'react';
import type { SfxTask } from '../entities';
import { useSfxStore } from '../store/sfxStore';
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router';
import { mapImportDataToSfxTask } from './importSfxTask';

const SfxPage: React.FC = () => {
    const { history: storeHistory, deleteTask, setConfig, importTask } = useSfxStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('sfx');
    const [showFavorites, setShowFavorites] = useState(false);

    const displayTasks = showFavorites
        ? storeHistory.filter((task) => task.isFavorite)
        : storeHistory;

    const handleImport = (data: ImportData) => {
        importTask(mapImportDataToSfxTask(data));
    };

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.SFX_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task: SfxTask) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
            onImport={handleImport}
            importTypes={['audio']}
        />
    );
};

export default SfxPage;
