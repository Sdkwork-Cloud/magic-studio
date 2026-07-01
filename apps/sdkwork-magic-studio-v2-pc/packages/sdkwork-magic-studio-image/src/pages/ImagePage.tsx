
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import {
    ImportData,
    GenerationHistoryListPane,
    GENERATION_TABS,
} from '@sdkwork/magic-studio-assets/generation'
import {
    consumePortalLaunchSession,
    resolvePortalLaunchAttachmentRef,
    toPortalLaunchAttachmentAssetUrlSource,
    resolveAssetUrlByAssetIdFirst,
    type PortalLaunchAttachmentRef
} from '@sdkwork/magic-studio-assets/asset-center' // eslint-disable-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from 'react';
import type { ImageAspectRatio, ImageGenerationConfig } from '../entities';
import { useImageStore } from '../store/imageStore';
import { createImageInputResourceRef } from '../entities';
import { mapImportDataToImageTask } from './importImageTask';

const isImageAspectRatio = (value: unknown): value is ImageAspectRatio => (
    value === '1:1' ||
    value === '16:9' ||
    value === '9:16' ||
    value === '4:3' ||
    value === '3:4' ||
    value === '21:9' ||
    value === 'custom'
);

const ImagePage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useImageStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('image');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const applyPortalSession = async () => {
            const session = await consumePortalLaunchSession('image');
            if (!session) {
                return;
            }

            const firstImageAttachment = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'image'
            );
            const firstImageRef = firstImageAttachment
                ? resolvePortalLaunchAttachmentRef(firstImageAttachment)
                : null;
            const referenceImage = firstImageAttachment
                ? createImageInputResourceRef({
                    id: null,
                    uuid: firstImageRef?.uuid,
                    assetId: firstImageRef?.assetId ?? null,
                    assetUuid: firstImageRef?.assetUuid ?? null,
                    url: (await resolveAssetUrlByAssetIdFirst(
                        firstImageRef
                            ? toPortalLaunchAttachmentAssetUrlSource(firstImageRef)
                            : null
                    )) || firstImageRef?.locator || undefined,
                    name: firstImageRef?.name
                })
                : null;

            if (cancelled) {
                return;
            }

            const scriptContent = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'script'
            )?.content;
            const updates: Partial<ImageGenerationConfig> = {
                prompt: session.prompt || scriptContent || ''
            };

            if (session.model) updates.model = session.model;
            if (isImageAspectRatio(session.aspectRatio)) updates.aspectRatio = session.aspectRatio;
            if (session.styleId) updates.styleId = session.styleId;
            if (referenceImage) {
                updates.referenceImage = referenceImage;
                updates.referenceImages = [referenceImage];
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
        importTask(mapImportDataToImageTask(data));
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
            importTypes={['image']}
        />
    );
};

export default ImagePage;
