import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import {
    consumePortalLaunchSession,
    resolvePortalLaunchAttachmentRef,
    toPortalLaunchAttachmentAssetUrlSource,
    resolveAssetUrlByAssetIdFirst,
    type PortalLaunchAttachmentRef
} from '@sdkwork/magic-studio-assets/asset-center';
import {
    ImportData,
    GenerationHistoryListPane,
    GENERATION_TABS,
} from '@sdkwork/magic-studio-assets/generation';
import type { CharacterConfig, CharacterTask } from '../entities';
import { createCharacterAvatarAssetFields } from '../utils/characterAvatarAsset';
import { mapImportDataToCharacterTask } from './importCharacterTask';

const CharacterPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useCharacterStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('character');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const applyPortalSession = async () => {
            const session = await consumePortalLaunchSession('human');
            if (!session) {
                return;
            }

            const firstImageAttachment = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'image'
            );
            const firstImageRef = firstImageAttachment
                ? resolvePortalLaunchAttachmentRef(firstImageAttachment)
                : null;
            const avatarImage = firstImageAttachment
                ? await resolveAssetUrlByAssetIdFirst(
                    firstImageRef
                        ? toPortalLaunchAttachmentAssetUrlSource(firstImageRef)
                        : null
                )
                : null;

            if (cancelled) {
                return;
            }

            const updates: Partial<CharacterConfig> = {
                prompt: session.prompt || '',
                description: session.prompt || ''
            };
            if (session.model) {
                updates.model = session.model;
            }
            if (firstImageRef) {
                const avatarReference = firstImageRef.locator || avatarImage || undefined;
                Object.assign(
                    updates,
                    createCharacterAvatarAssetFields({
                        avatar: {
                            assetId: firstImageRef.assetId || null,
                            assetUuid: firstImageRef.assetUuid || null,
                            path: avatarReference,
                            url: avatarImage || undefined,
                        },
                    })
                );
            }
            setConfig(updates);
        };

        void applyPortalSession();

        return () => {
            cancelled = true;
        };
    }, [setConfig]);

    const displayTasks = showFavorites
        ? history.filter((task) => task.isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        importTask(mapImportDataToCharacterTask(data));
    };

    const handleReuse = (task: CharacterTask) => {
        setConfig(task.config);
    };

    return (
        <GenerationHistoryListPane<CharacterTask>
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.CHARACTER_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={handleReuse}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
            onImport={handleImport}
            importTypes={['character']}
        />
    );
};

export default CharacterPage;
