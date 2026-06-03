
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import { GenerationHistoryListPane, GENERATION_TABS, type ImportData } from '@sdkwork/magic-studio-assets/generation'
import React, { useState } from 'react';
import type { VoiceTask } from '../entities';
import { useVoiceStore } from '../store/voiceStore';
import { mapImportDataToVoiceTask } from './importVoiceTask';

const VoicePage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useVoiceStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('voice');
    const [showFavorites, setShowFavorites] = useState(false);

    // Filter tasks
    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        importTask(mapImportDataToVoiceTask(data));
    };
    
    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.VOICE_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task: VoiceTask) => {
                if (task.config) {
                    setConfig(task.config);
                }
            }}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
            onImport={handleImport}
            importTypes={['audio']}
        />
    );
};

export default VoicePage;
