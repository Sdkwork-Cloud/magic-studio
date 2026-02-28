
import { useRouter, ROUTES } from '@sdkwork/react-core'
import {
    ImportData,
    GenerationHistoryListPane,
    GENERATION_TABS,
    consumePortalLaunchSession,
    resolveAssetUrlByAssetIdFirst,
    type PortalLaunchAttachmentRef
} from '@sdkwork/react-assets' // eslint-disable-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from 'react';
import { useImageStore } from '../store/imageStore';
import { ImageTask } from '../entities'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { generateUUID } from '@sdkwork/react-commons'; // eslint-disable-line @typescript-eslint/no-unused-vars

const ImagePage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useImageStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('image');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const applyPortalSession = async () => {
            const session = consumePortalLaunchSession('image');
            if (!session) {
                return;
            }

            const firstImageAttachment = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'image'
            );
            const referenceImage = firstImageAttachment
                ? await resolveAssetUrlByAssetIdFirst({
                    assetId: firstImageAttachment.assetId,
                    id: firstImageAttachment.assetId || firstImageAttachment.id,
                    url: firstImageAttachment.locator
                } as any)
                : null;

            if (cancelled) {
                return;
            }

            const scriptContent = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'script'
            )?.content;
            const updates: Record<string, unknown> = {
                prompt: session.prompt || scriptContent || ''
            };

            if (session.model) updates.model = session.model;
            if (session.aspectRatio) updates.aspectRatio = session.aspectRatio;
            if (session.styleId) updates.styleId = session.styleId;
            if (referenceImage) {
                updates.referenceImage = referenceImage;
                updates.referenceImages = [referenceImage];
            }

            setConfig(updates as any);
        };

        void applyPortalSession();

        return () => {
            cancelled = true;
        };
    }, [setConfig]);

    const displayTasks = showFavorites 
        ? history.filter(t => (t as any).isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        const task: ImageTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            config: {
                prompt: data.prompt,
                aspectRatio: (data.aspectRatio as any) || '1:1',
                styleId: 'none',
                batchSize: 1,
                mediaType: (data.type === 'video' ? 'video' : 'image') as any,
                model: data.model,
                negativePrompt: data.negativePrompt
            },
            results: [{
                id: generateUUID(),
                url: data.fileUrl,
                thumbnailUrl: data.coverUrl
            }]
        };
        importTask(task);
    };

    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.IMAGE_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            filter={activeTab}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            onImport={handleImport}
        />
    );
};

export default ImagePage;
