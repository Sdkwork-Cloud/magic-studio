import { useRouter, ROUTES } from '@sdkwork/react-core'
import {
    GenerationHistoryListPane,
    GENERATION_TABS,
    consumePortalLaunchSession,
    type PortalLaunchAttachmentRef
} from '@sdkwork/react-assets'
import React, { useEffect, useState } from 'react';
import { useMusicStore } from '../store/musicStore';

const MusicPage: React.FC = () => {
    const { history, deleteTask, setConfig } = useMusicStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('music');

    useEffect(() => {
        const session = consumePortalLaunchSession('music');
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

        const updates: Record<string, unknown> = {
            prompt: session.prompt || scriptContent || ''
        };
        if (session.model) {
            updates.model = session.model;
        }
        if (session.styleId) {
            updates.style = session.styleId;
        }
        if (Number.isFinite(durationFromSession) && durationFromSession > 0) {
            updates.duration = durationFromSession;
        }

        setConfig(updates as any);
    }, [setConfig]);

    const displayTasks = history;

    return (
        <GenerationHistoryListPane
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.MUSIC_CHAT)}
            tasks={displayTasks as any[]}
            onDelete={deleteTask}
            onReuse={(_task: any) => {}}
            showFavorites={false}
            onToggleFavorites={(_show: boolean) => {}}
            filter={activeTab}
        />
    );
};

export default MusicPage;
