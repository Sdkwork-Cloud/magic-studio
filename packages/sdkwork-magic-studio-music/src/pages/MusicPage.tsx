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
import React, { useEffect, useState } from 'react';
import type { MusicConfig, MusicTask } from '../entities';
import { useMusicStore } from '../store/musicStore';
import { mapImportDataToMusicTask } from './importMusicTask';
import { isMusicModelType } from '../utils/musicModel';

const MusicPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useMusicStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('music');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        const applyPortalSession = async () => {
            const session = await consumePortalLaunchSession('music');
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

            const updates: Partial<MusicConfig> = {
                prompt: session.prompt || scriptContent || ''
            };
            if (isMusicModelType(session.model)) {
                updates.model = session.model;
            }
            if (session.styleId) {
                updates.style = session.styleId;
            }
            if (Number.isFinite(durationFromSession) && durationFromSession > 0) {
                updates.duration = durationFromSession;
            }

            setConfig(updates);
        };

        void applyPortalSession();
    }, [setConfig]);

    const displayTasks = showFavorites
        ? history.filter((task) => task.isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        importTask(mapImportDataToMusicTask(data));
    };

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.MUSIC_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task: MusicTask) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
            onImport={handleImport}
            importTypes={['music']}
        />
    );
};

export default MusicPage;
