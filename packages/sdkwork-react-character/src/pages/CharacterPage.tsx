import { useRouter, ROUTES } from '@sdkwork/react-core'
import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import {
    GenerationHistoryListPane,
    GENERATION_TABS,
    consumePortalLaunchSession,
    resolveAssetUrlByAssetIdFirst,
    type PortalLaunchAttachmentRef
} from '@sdkwork/react-assets';

const CharacterPage: React.FC = () => {
    const { history, deleteTask, setConfig } = useCharacterStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('character');

    useEffect(() => {
        let cancelled = false;

        const applyPortalSession = async () => {
            const session = consumePortalLaunchSession('human');
            if (!session) {
                return;
            }

            const firstImageAttachment = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'image'
            );
            const avatarImage = firstImageAttachment
                ? await resolveAssetUrlByAssetIdFirst({
                    assetId: firstImageAttachment.assetId,
                    id: firstImageAttachment.assetId || firstImageAttachment.id,
                    url: firstImageAttachment.locator
                } as any)
                : null;

            if (cancelled) {
                return;
            }

            const updates: Record<string, unknown> = {
                prompt: session.prompt || '',
                description: session.prompt || ''
            };
            if (session.model) {
                updates.model = session.model;
            }
            if (avatarImage) {
                updates.avatarImage = avatarImage;
            }
            setConfig(updates as any);
        };

        void applyPortalSession();

        return () => {
            cancelled = true;
        };
    }, [setConfig]);

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
