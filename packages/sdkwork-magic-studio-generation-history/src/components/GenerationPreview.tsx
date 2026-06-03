import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Download, ChevronLeft, ChevronRight,
    ThumbsUp, Share2, Info,
    Edit3, Trash2, Film, Image as ImageIcon,
    Copy, Repeat2, UserPlus, Volume2, FileText
} from 'lucide-react';
import { PromptText, formatLocaleDate } from '@sdkwork/magic-studio-commons';
import { useRenderableAssetUrl } from '@sdkwork/magic-studio-commons/hooks';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router';
import { remixService, type RemixIntent, type RemixTargetModule } from '@sdkwork/magic-studio-core/services';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import {
    createGeneratedImageResult,
    resolveGeneratedImageResultUrl,
    type GeneratedImageResult,
} from '@sdkwork/magic-studio-types/image';
import type { GalleryItem } from '@sdkwork/magic-studio-types/content';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import {
    resolveGenerationResultDeliveryUrl,
    resolveGenerationResultPosterUrl,
    resolveGenerationResultPreviewThumbnailUrl,
    resolveGenerationResultRenderKind,
    resolveGenerationResultTextContent,
    resolveGenerationTaskKey,
    resolveGenerationTaskPrompt,
    type GenerationResultRecord,
    type GenerationResultRenderKind,
    type GenerationTaskRecord
} from '../resultSelection';
import { resolveGenerationHistoryAssetUrl } from '../assetUrlResolver';

export type PreviewMode = 'creation' | 'view';

export interface EditorComponents {
    GridEditor?: React.ComponentType<{ isOpen: boolean; image: GeneratedImageResult; onClose: () => void; onSave: (result: GeneratedImageResult) => void }>;
    CanvasEditor?: React.ComponentType<{ isOpen: boolean; image: GeneratedImageResult; onClose: () => void; onSave: (result: GeneratedImageResult) => void }>;
}

interface TaskPreviewItem<T extends GenerationTaskRecord> {
    kind: 'task';
    key: string;
    task: T;
}

interface GalleryPreviewItem {
    kind: 'gallery';
    key: string;
    item: GalleryItem;
}

type PreviewItem<T extends GenerationTaskRecord> = TaskPreviewItem<T> | GalleryPreviewItem;

interface GenerationPreviewProps<T extends GenerationTaskRecord = GenerationTaskRecord> {
    initialTaskId?: string;
    initialResultIndex?: number;
    tasks?: T[];

    galleryItem?: GalleryItem;
    relatedItems?: GalleryItem[];

    mode?: PreviewMode;
    onClose: () => void;
    onReuse?: (task: T) => void;

    isOwner?: boolean;

    editors?: EditorComponents;
}

const createTaskPreviewItem = <T extends GenerationTaskRecord>(task: T): TaskPreviewItem<T> => ({
    kind: 'task',
    key: resolveGenerationTaskKey(task),
    task
});

const createGalleryPreviewItem = (item: GalleryItem): GalleryPreviewItem => ({
    kind: 'gallery',
    key: item.id,
    item
});

const isTaskPreviewItem = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>
): item is TaskPreviewItem<T> => item.kind === 'task';

const resolveGalleryRenderKind = (item: GalleryItem): GenerationResultRenderKind => {
    switch (item.type) {
        case 'video':
        case 'short':
            return 'video';
        case 'music':
        case 'voice':
        case 'sfx':
            return 'audio';
        case 'character':
        case 'image':
        default:
            return 'image';
    }
};

const resolvePreviewItemPrompt = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>
): string => (
    isTaskPreviewItem(item)
        ? resolveGenerationTaskPrompt(item.task)
        : item.item.prompt
);

const resolvePreviewItemAspectRatio = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>
): string => (
    isTaskPreviewItem(item)
        ? item.task.config.aspectRatio || '--'
        : item.item.aspectRatio || '--'
);

const resolvePreviewItemModel = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>
): string | undefined => (
    isTaskPreviewItem(item)
        ? item.task.config.model
        : item.item.model
);

const resolvePreviewItemCreatedAt = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>
): string | number => (
    isTaskPreviewItem(item)
        ? item.task.createdAt
        : item.item.createdAt
);

const resolvePreviewItemRenderKind = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>,
    result: GenerationResultRecord | null
): GenerationResultRenderKind => (
    isTaskPreviewItem(item)
        ? resolveGenerationResultRenderKind(result, item.task.config.mediaType || 'image')
        : resolveGalleryRenderKind(item.item)
);

const resolvePreviewItemUrl = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>,
    result: GenerationResultRecord | null
): string => {
    if (isTaskPreviewItem(item)) {
        return resolveGenerationResultDeliveryUrl(result) || '';
    }

    return item.item.type === 'video' || item.item.type === 'short'
        ? item.item.videoUrl || item.item.url
        : item.item.url;
};

const resolvePreviewItemPreviewUrl = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>,
    result: GenerationResultRecord | null
): string => {
    if (isTaskPreviewItem(item)) {
        return resolveGenerationResultPreviewThumbnailUrl(
            result,
            item.task.config.mediaType || 'image'
        );
    }

    return item.item.url;
};

const resolvePreviewItemAudioPreviewUrl = <T extends GenerationTaskRecord>(
    item: PreviewItem<T>,
    result: GenerationResultRecord | null
): string => (
    isTaskPreviewItem(item)
        ? resolveGenerationResultPosterUrl(result) || ''
        : ''
);

const resolveGalleryRemixTargetModule = (item: GalleryItem): RemixTargetModule => {
    switch (item.type) {
        case 'video':
        case 'short':
            return 'video';
        case 'music':
            return 'music';
        case 'voice':
            return 'audio';
        case 'sfx':
            return 'sfx';
        case 'character':
            return 'character';
        case 'image':
        default:
            return 'image';
    }
};

const resolveGalleryRemixRoute = (target: RemixTargetModule): string => {
    switch (target) {
        case 'video':
            return ROUTES.VIDEO;
        case 'music':
            return ROUTES.MUSIC;
        case 'audio':
            return ROUTES.AUDIO;
        case 'sfx':
            return ROUTES.SFX;
        case 'character':
            return ROUTES.CHARACTER;
        case 'image':
        default:
            return ROUTES.IMAGE;
    }
};

const resolveGalleryRemixModeHint = (target: RemixTargetModule): string => {
    switch (target) {
        case 'video':
            return 'text_to_video';
        case 'music':
            return 'music_generation';
        case 'audio':
            return 'audio_generation';
        case 'sfx':
            return 'sfx_generation';
        case 'character':
            return 'character_generation';
        case 'image':
        default:
            return 'text_to_image';
    }
};

const resolveGalleryMediaReferences = (item: GalleryItem): RemixIntent['mediaReferences'] => {
    switch (item.type) {
        case 'image':
            return [{ url: item.url, type: MediaResourceType.IMAGE, role: 'reference' }];
        case 'character':
            return [{ url: item.url, type: MediaResourceType.CHARACTER, role: 'reference' }];
        default:
            return [];
    }
};

export const GenerationPreview = <T extends GenerationTaskRecord = GenerationTaskRecord>({
    initialTaskId,
    initialResultIndex = 0,
    tasks = [],
    galleryItem,
    relatedItems = [],
    mode = 'creation',
    onClose,
    onReuse,
    isOwner = false,
    editors = {}
}: GenerationPreviewProps<T>) => {
    const runtime = getPlatformRuntime();
    const { navigate } = useRouter();
    const { t } = useTranslation();
    const [isZoomed, setIsZoomed] = useState(false);

    const [showGridEditor, setShowGridEditor] = useState(false);
    const [showCanvasEditor, setShowCanvasEditor] = useState(false);

    const items = useMemo<PreviewItem<T>[]>(() => {
        if (mode === 'creation') {
            return tasks.map(createTaskPreviewItem);
        }

        const sourceItems = relatedItems.length > 0
            ? relatedItems
            : galleryItem
                ? [galleryItem]
                : [];

        return sourceItems.map(createGalleryPreviewItem);
    }, [galleryItem, mode, relatedItems, tasks]);

    const resolvedInitialId = useMemo(() => {
        if (items.length === 0) {
            return '';
        }

        const requestedId = mode === 'creation'
            ? initialTaskId
            : galleryItem?.id;

        if (requestedId && items.some((item) => item.key === requestedId)) {
            return requestedId;
        }

        return items[0]?.key || '';
    }, [galleryItem?.id, initialTaskId, items, mode]);

    const navigationSeed = useMemo(() => {
        const selectedId = mode === 'creation'
            ? initialTaskId || ''
            : galleryItem?.id || '';

        return `${mode}:${selectedId}:${items.map((item) => item.key).join('|')}`;
    }, [galleryItem?.id, initialTaskId, items, mode]);

    const [currentIdState, setCurrentIdState] = useState<{ seed: string; value: string }>(() => ({
        seed: navigationSeed,
        value: resolvedInitialId
    }));

    const currentId = useMemo(() => {
        const requestedId = currentIdState.seed === navigationSeed
            ? currentIdState.value
            : resolvedInitialId;

        if (!requestedId) {
            return '';
        }

        return items.some((item) => item.key === requestedId)
            ? requestedId
            : resolvedInitialId;
    }, [currentIdState, items, navigationSeed, resolvedInitialId]);

    const currentItem = items.find((item) => item.key === currentId) || null;
    const currentTask = currentItem && isTaskPreviewItem(currentItem)
        ? currentItem.task
        : null;
    const currentGalleryItem = currentItem && !isTaskPreviewItem(currentItem)
        ? currentItem.item
        : null;

    const activeIndex = useMemo(() => {
        if (!currentTask) {
            return 0;
        }

        const preferredIndex = currentId === resolvedInitialId
            ? Math.max(initialResultIndex, 0)
            : 0;
        const resultCount = currentTask.results?.length ?? 0;

        if (resultCount === 0) {
            return 0;
        }

        return Math.min(preferredIndex, resultCount - 1);
    }, [currentId, currentTask, initialResultIndex, resolvedInitialId]);

    const currentResult = useMemo(
        () => currentTask?.results?.[activeIndex] ?? null,
        [activeIndex, currentTask]
    );

    const renderKind = useMemo(() => {
        if (!currentItem) {
            return 'image' as const;
        }

        return resolvePreviewItemRenderKind(currentItem, currentResult);
    }, [currentItem, currentResult]);

    const isVideo = renderKind === 'video';
    const isAudio = renderKind === 'audio';
    const isText = renderKind === 'text';
    const canZoom = renderKind === 'image';

    const rawUrl = useMemo(() => {
        if (!currentItem) {
            return '';
        }

        return resolvePreviewItemUrl(currentItem, currentResult);
    }, [currentItem, currentResult]);

    const rawPreviewUrl = useMemo(() => {
        if (!currentItem) {
            return '';
        }

        return resolvePreviewItemPreviewUrl(currentItem, currentResult);
    }, [currentItem, currentResult]);

    const rawAudioPreviewUrl = useMemo(() => {
        if (!currentItem || renderKind !== 'audio') {
            return '';
        }

        return resolvePreviewItemAudioPreviewUrl(currentItem, currentResult);
    }, [currentItem, currentResult, renderKind]);

    const { url: displayUrl } = useRenderableAssetUrl(rawUrl, {
        resolver: resolveGenerationHistoryAssetUrl,
    });
    const { url: displayPreviewUrl } = useRenderableAssetUrl(rawPreviewUrl, {
        resolver: resolveGenerationHistoryAssetUrl,
    });
    const { url: displayAudioPreviewUrl } = useRenderableAssetUrl(rawAudioPreviewUrl, {
        resolver: resolveGenerationHistoryAssetUrl,
    });

    const backgroundPreviewUrl = isAudio
        ? displayAudioPreviewUrl
        : displayPreviewUrl;

    const currentText = useMemo(() => {
        if (!currentTask) {
            return '';
        }

        return resolveGenerationResultTextContent(currentResult);
    }, [currentResult, currentTask]);

    const currentImage = useMemo((): GeneratedImageResult | null => {
        if (!currentTask) {
            return null;
        }

        if (!currentResult || renderKind !== 'image') {
            return null;
        }

        const resultUrl = resolveGenerationResultDeliveryUrl(currentResult);
        if (!resultUrl) {
            return null;
        }

        return createGeneratedImageResult({
            id: currentResult.id ?? null,
            uuid: currentResult.uuid,
            assetId: currentResult.assetId,
            assetUuid: currentResult.assetUuid,
            primaryResourceId: currentResult.primaryResourceId,
            primaryResourceUuid: currentResult.primaryResourceUuid,
            resourceViewId: currentResult.resourceViewId,
            resourceViewUuid: currentResult.resourceViewUuid,
            executionId: currentResult.executionId,
            artifactUuid: currentResult.artifactUuid,
            resource: currentResult.resource
                ? {
                    ...currentResult.resource,
                    url: resultUrl,
                  }
                : undefined,
            coverResource: currentResult.coverResource
                ? {
                    ...currentResult.coverResource,
                    url: resolveGenerationResultPosterUrl(currentResult),
                  }
                : undefined,
            url: resultUrl,
            thumbnailUrl: resolveGenerationResultPosterUrl(currentResult),
            prompt: resolveGenerationTaskPrompt(currentTask),
        });
    }, [currentResult, currentTask, renderKind]);

    const displayPrompt = useMemo(() => {
        if (!currentItem) {
            return '';
        }

        return resolvePreviewItemPrompt(currentItem);
    }, [currentItem]);

    const handleNext = () => {
        const idx = items.findIndex((item) => item.key === currentId);
        if (idx < items.length - 1) {
            setCurrentIdState({
                seed: navigationSeed,
                value: items[idx + 1].key
            });
        }
    };

    const handlePrev = () => {
        const idx = items.findIndex((item) => item.key === currentId);
        if (idx > 0) {
            setCurrentIdState({
                seed: navigationSeed,
                value: items[idx - 1].key
            });
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentId, items, onClose]);

    const handleRemix = () => {
        if (!currentItem) {
            return;
        }

        if (currentTask) {
            onReuse?.(currentTask);
            return;
        }

        if (!currentGalleryItem) {
            return;
        }

        const targetModule = resolveGalleryRemixTargetModule(currentGalleryItem);
        const intent: RemixIntent = {
            targetModule,
            prompt: currentGalleryItem.prompt,
            modelId: currentGalleryItem.model,
            aspectRatio: currentGalleryItem.aspectRatio,
            mediaReferences: resolveGalleryMediaReferences(currentGalleryItem),
            sourceName: currentGalleryItem.title,
            sourceAuthor: currentGalleryItem.author.name,
            modeHint: resolveGalleryRemixModeHint(targetModule)
        };

        remixService.setIntent(intent);
        navigate(resolveGalleryRemixRoute(targetModule));
        onClose();
    };

    const handleEditorSave = (result: GeneratedImageResult) => {
        const deliveryUrl = resolveGeneratedImageResultUrl(result);
        if (!deliveryUrl) {
            return;
        }

        const a = document.createElement('a');
        a.href = deliveryUrl;
        a.download = `edited-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!currentItem) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[1500] flex bg-black/98 backdrop-blur-xl animate-in fade-in duration-300 text-gray-200 overflow-hidden font-sans">

            <div className="w-[80px] xl:w-[280px] flex-none bg-[#09090b]/80 border-r border-white/5 flex flex-col hidden md:flex transition-all duration-300">
                <div className="h-16 flex items-center px-4 xl:px-6 border-b border-white/5 font-bold text-xs text-gray-500 uppercase tracking-wider bg-[#09090b]">
                    {mode === 'creation'
                        ? t('generationHistory.preview.history')
                        : t('generationHistory.preview.moreFromGallery')}
                </div>
                <div className="flex-1 overflow-y-auto p-2 xl:p-3 space-y-2 custom-scrollbar">
                    {items.map((item) => {
                        const itemKey = item.key;
                        const isActive = itemKey === currentId;

                        return (
                            <SidebarTaskItem
                                key={itemKey}
                                item={item}
                                isActive={isActive}
                                onClick={() => {
                                    setCurrentIdState({ seed: navigationSeed, value: itemKey });
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative min-w-0 bg-[#050505] z-0">

                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] font-bold text-gray-400 border border-white/5 uppercase tracking-wider flex items-center gap-2">
                            {isVideo ? <Film size={10} /> : isAudio ? <Volume2 size={10} /> : isText ? <FileText size={10} /> : <ImageIcon size={10} />}
                            {resolvePreviewItemAspectRatio(currentItem)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <TooltipButton icon={<ThumbsUp size={18} />} tooltip={t('generationHistory.preview.like')} />
                        <div className="w-[1px] h-6 bg-white/10 mx-1" />
                        <TooltipButton icon={<Download size={18} />} onClick={() => { }} tooltip={t('generationHistory.preview.download')} />
                        <TooltipButton icon={<Share2 size={18} />} tooltip={t('generationHistory.preview.share')} />
                    </div>
                </div>

                <div
                    className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden relative"
                    onClick={() => canZoom && setIsZoomed(!isZoomed)}
                >
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-20 blur-3xl scale-110">
                        {backgroundPreviewUrl && <img src={backgroundPreviewUrl} className="w-full h-full object-cover" />}
                    </div>

                    <div className={`relative z-10 transition-all duration-300 ${canZoom && isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-default'}`}>
                        {isText ? (
                            <div className="w-[min(840px,92vw)] rounded-2xl border border-white/10 bg-[#101012]/95 shadow-2xl shadow-black/50 overflow-hidden">
                                <div className="p-6 flex items-center gap-4 border-b border-white/5">
                                    <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-wider text-gray-500">
                                            Transcript
                                        </p>
                                        <p className="text-sm text-white font-medium truncate">{displayPrompt || '--'}</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-100 font-sans">
                                        {currentText || 'No transcript content'}
                                    </pre>
                                </div>
                            </div>
                        ) : displayUrl ? (
                            isVideo ? (
                                <video
                                    src={displayUrl}
                                    poster={displayPreviewUrl || undefined}
                                    className="max-w-full max-h-[85vh] shadow-2xl shadow-black/50 rounded-lg outline-none"
                                    controls
                                    autoPlay
                                    loop
                                />
                            ) : isAudio ? (
                                <div className="w-[min(720px,92vw)] rounded-2xl border border-white/10 bg-[#101012]/95 shadow-2xl shadow-black/50 overflow-hidden">
                                    {displayAudioPreviewUrl && (
                                        <img
                                            src={displayAudioPreviewUrl}
                                            className="w-full h-56 object-cover opacity-80 border-b border-white/10"
                                            alt={t('generationHistory.item.preview')}
                                        />
                                    )}
                                    <div className="p-6 flex items-center gap-4 border-b border-white/5">
                                        <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10">
                                            <Volume2 size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                                {t('generationHistory.item.preview')}
                                            </p>
                                            <p className="text-sm text-white font-medium truncate">{displayPrompt || '--'}</p>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <audio
                                            src={displayUrl}
                                            className="w-full"
                                            controls
                                            autoPlay
                                        />
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={displayUrl}
                                    className={`max-w-full max-h-[85vh] object-contain shadow-2xl shadow-black/50 rounded-lg ${!isZoomed ? 'cursor-zoom-in' : ''}`}
                                    alt={t('generationHistory.item.preview')}
                                />
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                {isText ? <FileText size={48} className="opacity-20" /> : <ImageIcon size={48} className="opacity-20" />}
                                <span>{t('generationHistory.preview.loadingPreview')}</span>
                            </div>
                        )}
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-black/20 rounded-full transition-all pointer-events-auto">
                        <ChevronLeft size={32} strokeWidth={1.5} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-black/20 rounded-full transition-all pointer-events-auto">
                        <ChevronRight size={32} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            <div className="w-[360px] flex-none bg-[#111113] border-l border-white/10 flex flex-col z-20 shadow-2xl">

                <div className="flex-none h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Info size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('generationHistory.preview.info')}</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {mode === 'view' && currentGalleryItem && (
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-2 ring-white/10 ${currentGalleryItem.author.color || 'bg-blue-600'}`}>
                                        {currentGalleryItem.author.avatar ? (
                                            <img src={currentGalleryItem.author.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            currentGalleryItem.author.initial || 'U'
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{currentGalleryItem.author.name}</h4>
                                        <p className="text-[10px] text-gray-500">{currentGalleryItem.author.followers || t('generationHistory.preview.creator')}</p>
                                    </div>
                                </div>
                                {!isOwner && (
                                    <button className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white transition-colors border border-white/5 flex items-center gap-1">
                                        <UserPlus size={12} /> {t('generationHistory.preview.follow')}
                                    </button>
                                )}
                            </div>

                            <div className="mt-6">
                                <h2 className="text-xl font-bold text-white mb-2">{currentGalleryItem.title}</h2>
                                <div className="flex gap-4 text-[11px] text-gray-400 font-medium">
                                    <span>{currentGalleryItem.stats.views} {t('generationHistory.preview.views')}</span>
                                    <span>{currentGalleryItem.stats.likes} {t('generationHistory.preview.likes')}</span>
                                    <span>{currentGalleryItem.stats.comments || 0} {t('generationHistory.preview.comments')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6 border-b border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('generationHistory.preview.prompt')}</span>
                            <button onClick={() => {
                                void runtime.clipboard.copy(displayPrompt);
                            }} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Copy size={12} /> {t('generationHistory.preview.copy')}
                            </button>
                        </div>
                        <PromptText text={displayPrompt} compact={false} className="bg-[#0a0a0c] border-white/5" />
                    </div>

                    <div className="p-6">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">{t('generationHistory.preview.details')}</span>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <ParamItem
                                label={t('generationHistory.preview.model')}
                                value={resolvePreviewItemModel(currentItem) || t('generationHistory.preview.unknown')}
                                highlight
                            />
                            <ParamItem
                                label={t('generationHistory.preview.aspectRatio')}
                                value={String(resolvePreviewItemAspectRatio(currentItem))}
                            />
                            <ParamItem label={t('generationHistory.preview.created')} value={formatLocaleDate(resolvePreviewItemCreatedAt(currentItem))} />
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-white/10 bg-[#161618]">
                    <button
                        onClick={handleRemix}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Repeat2 size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        {isVideo
                            ? t('generationHistory.preview.remixVideo')
                            : isAudio || isText
                                ? t('generationHistory.item.regenerate')
                                : t('generationHistory.preview.remixImage')}
                    </button>
                    {isOwner && (
                        <div className="mt-3 text-center flex justify-center gap-4">
                            <button className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                                <Edit3 size={10} /> {t('generationHistory.preview.editDetails')}
                            </button>
                            <button className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
                                <Trash2 size={10} /> {t('generationHistory.preview.delete')}
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {mode === 'creation' && editors.GridEditor && currentImage && (
                <editors.GridEditor
                    isOpen={showGridEditor}
                    image={currentImage}
                    onClose={() => setShowGridEditor(false)}
                    onSave={handleEditorSave}
                />
            )}

            {mode === 'creation' && editors.CanvasEditor && currentImage && (
                <editors.CanvasEditor
                    isOpen={showCanvasEditor}
                    image={currentImage}
                    onClose={() => setShowCanvasEditor(false)}
                    onSave={handleEditorSave}
                />
            )}

        </div>,
        document.body
    );
};

interface SidebarTaskItemProps<T extends GenerationTaskRecord> {
    item: PreviewItem<T>;
    isActive: boolean;
    onClick: () => void;
}

function SidebarTaskItem<T extends GenerationTaskRecord>({
    item,
    isActive,
    onClick
}: SidebarTaskItemProps<T>) {
    const previewMeta = isTaskPreviewItem(item)
        ? (() => {
            const firstResult = item.task.results?.[0] ?? null;
            const renderKind = resolveGenerationResultRenderKind(
                firstResult,
                item.task.config.mediaType || 'image'
            );

            return {
                renderKind,
                thumb: renderKind === 'audio'
                    ? resolveGenerationResultPosterUrl(firstResult)
                    : resolveGenerationResultPreviewThumbnailUrl(
                        firstResult,
                        item.task.config.mediaType || 'image'
                    ),
                title: resolveGenerationTaskPrompt(item.task),
                textPreview: resolveGenerationResultTextContent(firstResult)
            };
        })()
        : (() => ({
            renderKind: resolveGalleryRenderKind(item.item),
            thumb: item.item.url,
            title: item.item.title,
            textPreview: ''
        }))();

    const { renderKind, thumb, title, textPreview } = previewMeta;
    const { url: displayUrl } = useRenderableAssetUrl(thumb, {
        resolver: resolveGenerationHistoryAssetUrl,
    });
    const showThumbnail = Boolean(displayUrl) && (renderKind === 'image' || renderKind === 'video');

    return (
        <div
            onClick={onClick}
            className={`
                group flex gap-3 p-2 rounded-xl cursor-pointer transition-all border
                ${isActive
                    ? 'bg-[#27272a] border-white/10 shadow-lg ring-1 ring-white/5'
                    : 'bg-transparent border-transparent hover:bg-[#1e1e20] hover:border-white/5'
                }
            `}
        >
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden border border-white/10 relative">
                {showThumbnail ? (
                    <img src={displayUrl || undefined} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                        {renderKind === 'text' ? <FileText size={16} /> : renderKind === 'audio' ? <Volume2 size={16} /> : <ImageIcon size={16} />}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center hidden xl:flex">
                <p className={`text-xs font-medium truncate leading-tight ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {title}
                </p>
                {renderKind === 'text' && (
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 leading-5">
                        {textPreview || 'Transcript'}
                    </p>
                )}
            </div>
        </div>
    );
}

const TooltipButton: React.FC<{ icon: React.ReactNode; tooltip: string; onClick?: () => void; activeClass?: string }> = ({ icon, tooltip, onClick, activeClass = 'text-gray-300 hover:text-white hover:bg-white/10' }) => (
    <button onClick={onClick} className={`p-2.5 rounded-full transition-colors backdrop-blur-md bg-black/40 border border-white/5 ${activeClass}`} title={tooltip}>
        {icon}
    </button>
);

const ParamItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] text-gray-500 font-medium">{label}</span>
        <div className={`text-sm text-gray-300 font-mono flex items-center gap-2 ${highlight ? 'text-white font-bold' : ''}`}>
            {value}
        </div>
    </div>
);
