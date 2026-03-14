import { useRouter, ROUTES } from '@sdkwork/react-core'
import {
    ImportData,
    GenerationHistoryListPane,
    GENERATION_TABS,
    consumePortalLaunchSession,
    resolveAssetUrlByAssetIdFirst,
    type PortalLaunchAttachmentRef
} from '@sdkwork/react-assets'
import React, { useEffect, useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { VideoTask, generateUUID } from '@sdkwork/react-commons';

const mapPortalVideoMode = (genMode?: string): any => {
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

const VideoPage: React.FC = () => {
    const { history, deleteTask, setConfig, importTask } = useVideoStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('video');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const applyPortalSession = async () => {
            const session = consumePortalLaunchSession('video');
            if (!session) {
                return;
            }

            const imageAttachments = session.attachments.filter(
                (item: PortalLaunchAttachmentRef) => item.type === 'image'
            );
            const resolvedImages: string[] = [];
            for (const attachment of imageAttachments) {
                const locator = await resolveAssetUrlByAssetIdFirst({
                    assetId: attachment.assetId,
                    id: attachment.assetId || attachment.id,
                    url: attachment.locator
                } as any);
                if (locator) {
                    resolvedImages.push(locator);
                }
            }

            if (cancelled) {
                return;
            }

            const scriptContent = session.attachments.find(
                (item: PortalLaunchAttachmentRef) => item.type === 'script'
            )?.content;
            const updates: Record<string, unknown> = {
                prompt: session.prompt || scriptContent || ''
            };

            const mode = mapPortalVideoMode(session.genMode);
            if (mode) updates.mode = mode;
            if (session.model) updates.model = session.model;
            if (session.styleId) updates.styleId = session.styleId;
            if (session.aspectRatio) updates.aspectRatio = session.aspectRatio;
            if (session.duration) updates.duration = session.duration;

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
        // Map generic import data to VideoTask
        const task: VideoTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            taskType: 'generation',
            config: {
                mode: 'text',
                prompt: data.prompt,
                aspectRatio: (data.aspectRatio as any) || '16:9',
                resolution: (data.resolution as any) || '720p',
                duration: (data.duration ? `${data.duration}s` : '5s') as any,
                fps: (data.fps as any) || 30,
                model: data.model,
                styleId: data.style || 'none',
                mediaType: (data.type === 'video' ? 'video' : 'image') as any // Respect type or fallback
            },
            results: [{
                id: generateUUID(),
                url: data.fileUrl,
                posterUrl: data.coverUrl
            }]
        };
        importTask(task);
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
        />
    );
};

export default VideoPage;
