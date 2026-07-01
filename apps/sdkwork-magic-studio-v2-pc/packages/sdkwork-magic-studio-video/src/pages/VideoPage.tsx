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
} from '@sdkwork/magic-studio-assets/asset-center'
import React, { useEffect, useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import {
    createVideoInputResourceRef,
    type VideoAspectRatio,
    type VideoConfig,
    type VideoDuration,
    type VideoGenerationMode,
    type VideoInputResourceRef
} from '../entities';
import { mapImportDataToVideoTask } from './importVideoTask';

const mapPortalVideoMode = (genMode?: string): VideoGenerationMode | undefined => {
    switch (genMode) {
        case 'image_start_end':
        case 'start_end':
            return 'start_end';
        case 'smart_reference':
            return 'smart_reference';
        case 'smart_multi':
            return 'smart_multi';
        case 'subject_ref':
            return 'subject_ref';
        case 'text':
            return 'text';
        default:
            return undefined;
    }
};

const isVideoAspectRatio = (value: unknown): value is VideoAspectRatio => (
    value === '16:9' ||
    value === '9:16' ||
    value === '1:1' ||
    value === '4:3' ||
    value === '3:4' ||
    value === '21:9'
);

const isVideoDuration = (value: unknown): value is VideoDuration => (
    typeof value === 'string' &&
    /^\d+s$/.test(value)
);

const VideoPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useVideoStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('video');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const applyPortalSession = async () => {
            const session = await consumePortalLaunchSession('video');
            if (!session) {
                return;
            }

            const imageAttachments = session.attachments.filter(
                (item: PortalLaunchAttachmentRef) => item.type === 'image'
            );
            const resolvedImages: VideoInputResourceRef[] = [];
            for (const attachment of imageAttachments) {
                const identity = resolvePortalLaunchAttachmentRef(attachment);
                const locator = await resolveAssetUrlByAssetIdFirst(
                    toPortalLaunchAttachmentAssetUrlSource(identity)
                );
                resolvedImages.push(
                    createVideoInputResourceRef({
                        id: null,
                        uuid: identity.uuid,
                        type: 'image',
                        assetId: identity.assetId,
                        assetUuid: identity.assetUuid,
                        url: locator || identity.locator || undefined,
                        name: identity.name
                    })
                );
            }

            if (cancelled) {
                return;
            }

            const scriptContent = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'script'
            )?.content;
            const updates: Partial<VideoConfig> = {
                prompt: session.prompt || scriptContent || ''
            };

            const mode = mapPortalVideoMode(session.genMode);
            if (mode) updates.mode = mode;
            if (session.model) updates.model = session.model;
            if (session.styleId) updates.styleId = session.styleId;
            if (isVideoAspectRatio(session.aspectRatio)) updates.aspectRatio = session.aspectRatio;
            if (isVideoDuration(session.duration)) updates.duration = session.duration;

            if (resolvedImages.length > 0) {
                updates.image = resolvedImages[0];
                updates.referenceImages = resolvedImages;
                if (resolvedImages[1]) {
                    updates.lastFrame = resolvedImages[1];
                }
                if (!updates.mode) {
                    updates.mode = resolvedImages.length > 1 ? 'start_end' : 'subject_ref';
                }
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
        importTask(mapImportDataToVideoTask(data));
    };

    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.VIDEO_CHAT)}
            tasks={displayTasks}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            filter={activeTab}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            onImport={handleImport}
            importTypes={['video']}
        />
    );
};

export default VideoPage;
