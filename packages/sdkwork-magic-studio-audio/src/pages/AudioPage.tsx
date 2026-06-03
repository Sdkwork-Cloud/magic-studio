import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import {
    ImportData,
    GenerationHistoryListPane,
    GENERATION_TABS,
} from '@sdkwork/magic-studio-assets/generation'
import {
    consumePortalLaunchSession,
    type PortalLaunchAttachmentRef
} from '@sdkwork/magic-studio-assets/asset-center'
import React, { useState, useEffect } from 'react';
import type { AudioGenerationParams } from '../entities';
import { useAudioStore } from '../store/audioStore';
import { mapImportDataToAudioTask } from './importAudioTask';
import { resolveAudioModelType } from '../utils/audioModel';

const AudioPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask, loadHistory } = useAudioStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('audio');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        const applyPortalSession = async () => {
            const session = await consumePortalLaunchSession('speech');
            if (!session) {
                return;
            }

            const scriptContent = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'script'
            )?.content;
            const durationFromSession =
                typeof session.duration === 'string' && session.duration.endsWith('s')
                    ? Number.parseInt(session.duration, 10)
                    : Number.parseInt(session.duration || '', 10);

            const updates: Partial<AudioGenerationParams> = {
                prompt: session.prompt || scriptContent || ''
            };
            const sessionModel = resolveAudioModelType(session.model);
            if (sessionModel) {
                updates.model = sessionModel;
            }
            if (Number.isFinite(durationFromSession) && durationFromSession > 0) {
                updates.duration = durationFromSession;
            }

            setConfig(updates);
        };

        void applyPortalSession();
    }, [setConfig]);

    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        importTask(mapImportDataToAudioTask(data));
    };

    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.AUDIO_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            filter={activeTab}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            onImport={handleImport}
            importTypes={['audio']}
        />
    );
};

export default AudioPage;
