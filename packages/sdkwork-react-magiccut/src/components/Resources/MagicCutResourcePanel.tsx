
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Grid, List, UploadCloud, Heart, Sparkles, FolderUp, LayoutGrid, Save, Box } from 'lucide-react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { DEFAULT_PAGE_SIZE, AssetType, MediaResourceType, type AnyMediaResource } from '@sdkwork/react-commons';
import {
    assetCenterService,
    AnyAsset,
    type Asset,
    mapUnifiedAssetToAnyAsset,
    mapUnifiedPageToAnyAssetPage,
    mapContentKeyToMediaType,
    queryAssetsBySdk,
    readWorkspaceScope,
    type AssetSdkQueryCategory
} from '@sdkwork/react-assets';
import { CutTemplate, TemplateMetadata } from '../../entities/magicCut.entity';
import { TIMELINE_CONSTANTS } from '../../constants';
import { assetService } from '@sdkwork/react-assets';
import { useMagicCutEvent, useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../../events';
import { LoadTemplateConfirmModal } from '../LoadTemplateConfirmModal';
import { magicCutBusinessService } from '../../services';
import { SaveTemplateModal } from '../SaveTemplateModal';
import { TemplateResourceGrid } from './grid/TemplateResourceGrid';
import { TextResourcePanel } from './panels/TextResourcePanel';
import { TransitionResourcePanel } from './panels/TransitionResourcePanel';
import { EffectResourcePanel } from './panels/EffectResourcePanel';
import { MusicResourcePanel } from './panels/MusicResourcePanel';
import { AudioResourcePanel } from './panels/AudioResourcePanel';
import { VideoResourcePanel } from './panels/VideoResourcePanel';
import { ImageResourcePanel } from './panels/ImageResourcePanel';
import { Badge, EmptyState, FilterTab, LoadingSpinner, SearchInput } from '../common/UIComponents';
import { platform } from '@sdkwork/react-core';
import { getProtectedAssetDeleteMessage } from '../../domain/assets/assetDeleteGuard';
import { playerPreviewService } from '../../services';
import { useMagicCutTranslation } from '../../hooks/useMagicCutTranslation';
import {
    collectLocalAssetsForCategory,
    filterAssetCollectionByQuery,
    mergeAssetCollections,
    mergeRemoteAssetRefresh,
    queryResourcePanelAssets,
    type ResourcePanelStorageMode
} from '../../domain/assets/resourcePanelAssets';
import { resolveDeletedAssetPreviewCleanup } from '../../domain/assets/deletedAssetPreview';
import { type ResourcePanelViewMode } from '../../domain/assets/resourcePanelPresentation';
import { settingsBusinessService } from '@sdkwork/react-settings';
import type { AssetContentKey } from '@sdkwork/react-types';
import { buildMagicCutImportScope } from '../../domain/assets/magicCutImportScope';
import {
    applyFavoriteStateFromCatalog,
    beginFavoriteMutation,
    buildFavoriteRegistrationInput,
    clearFavoriteOverride,
    isCurrentFavoriteMutation,
    syncFavoriteInAssetCollection
} from '../../domain/assets/favoriteToggle';

interface MagicCutResourcePanelProps {
    activeTab: string;
}

const templateService = magicCutBusinessService.templateService;

type FilterCategory = 'all' | 'upload' | 'ai' | 'favorite';

interface SearchFilters {
    query: string;
    tags: string[];
    durationMin: number | null;
    durationMax: number | null;
    sortBy: 'name' | 'date' | 'duration';
    sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: SearchFilters = {
    query: '',
    tags: [],
    durationMin: null,
    durationMax: null,
    sortBy: 'date',
    sortOrder: 'desc'
};

const resolveMagiccutTypes = (category: string): Array<'video' | 'image' | 'audio' | 'music' | 'voice' | 'text' | 'effect' | 'transition' | 'sfx' | 'file'> | undefined => {
    switch (category) {
        case 'video':
            return ['video'];
        case 'image':
            return ['image'];
        case 'music':
            return ['music'];
        case 'audio':
            return ['audio'];
        case 'voice':
            return ['voice'];
        case 'text':
            return ['text'];
        case 'effects':
            return ['effect'];
        case 'transitions':
            return ['transition'];
        case 'sfx':
            return ['sfx'];
        default:
            return undefined;
    }
};

const resolveMagiccutContentKeys = (category: string): AssetContentKey[] | undefined => {
    switch (category) {
        case 'video':
            return ['video'];
        case 'image':
            return ['image'];
        case 'music':
            return ['music'];
        case 'audio':
            return ['audio'];
        case 'voice':
            return ['voice'];
        case 'text':
            return ['text', 'subtitle'];
        case 'effects':
            return ['effect'];
        case 'transitions':
            return ['transition'];
        case 'sfx':
            return ['sfx'];
        default:
            return undefined;
    }
};

const resolveMagiccutQueryCategory = (category: string): AssetSdkQueryCategory => {
    if (category === 'effects') return 'effects';
    if (category === 'transitions') return 'transitions';

    const assetCategories = new Set([
        'video',
        'image',
        'audio',
        'music',
        'voice',
        'text',
        'sfx'
    ]);

    if (assetCategories.has(category)) {
        return category as AssetSdkQueryCategory;
    }
    return 'media';
};

const toAnyAsset = (asset: Asset): AnyAsset => ({
    id: asset.id,
    uuid: asset.uuid,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    name: asset.name,
    type: mapContentKeyToMediaType(asset.type),
    path: asset.path,
    url: typeof asset.metadata?.primaryUrl === 'string' ? asset.metadata.primaryUrl : asset.path,
    mimeType: typeof asset.metadata?.mimeType === 'string' ? asset.metadata.mimeType : undefined,
    size: asset.size,
    origin: asset.origin,
    metadata: asset.metadata,
    isFavorite: asset.isFavorite
});

const resolveResourceCategoryLabel = (
    category: string,
    tr: (key: string, options?: Record<string, any>) => string
): string => {
    switch (category) {
        case 'video':
            return tr('categoryLabels.video');
        case 'image':
            return tr('categoryLabels.image');
        case 'audio':
            return tr('categoryLabels.audio');
        case 'music':
            return tr('categoryLabels.music');
        case 'voice':
            return tr('categoryLabels.voice');
        case 'text':
            return tr('categoryLabels.text');
        case 'effects':
            return tr('categoryLabels.effects');
        case 'transitions':
            return tr('categoryLabels.transitions');
        case 'sfx':
            return tr('categoryLabels.sfx');
        case 'templates':
            return tr('categoryLabels.templates');
        default:
            return category;
    }
};

export const MagicCutResourcePanel: React.FC<MagicCutResourcePanelProps> = ({ activeTab }) => {
    const [assetViewModes, setAssetViewModes] = useState<Record<string, ResourcePanelViewMode>>({});
    
    if (activeTab === 'templates') {
        return <TemplateCategoryView />;
    }

    return (
        <AssetCategoryView
            key={activeTab}
            category={activeTab}
            viewMode={assetViewModes[activeTab] ?? 'grid'}
            onViewModeChange={(nextViewMode) => {
                setAssetViewModes((prev) => ({
                    ...prev,
                    [activeTab]: nextViewMode
                }));
            }}
        />
    );
};

// --- 1. Template View Component (Independent) ---

const TemplateCategoryView: React.FC = () => {
    const { tr } = useMagicCutTranslation();
    const { project, saveAsTemplate, loadTemplate } = useMagicCutStore();
    const bus = useMagicCutBus();
    
    const [templates, setTemplates] = useState<CutTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [templateToLoad, setTemplateToLoad] = useState<CutTemplate | null>(null);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const tmpls = await templateService.listTemplates();
            setTemplates(tmpls);
        } catch (e) {
            console.error("Failed to load templates", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    useMagicCutEvent(MagicCutEvents.TEMPLATE_SAVED, () => {
        loadTemplates();
    }, [loadTemplates]);

    const filteredTemplates = useMemo(() => {
        if (!searchQuery) return templates;
        return templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [templates, searchQuery]);

    const handleSaveTemplate = useCallback(() => {
        setShowSaveTemplateModal(true);
    }, []);

    const handleSaveTemplateConfirm = useCallback(async (metadata: TemplateMetadata) => {
        await saveAsTemplate(metadata);
        bus.emit(MagicCutEvents.TEMPLATE_SAVED);
        setShowSaveTemplateModal(false);
    }, [saveAsTemplate, bus]);

    const confirmLoadTemplate = useCallback(async () => {
        if (templateToLoad) {
            await loadTemplate(templateToLoad);
            setTemplateToLoad(null);
        }
    }, [loadTemplate, templateToLoad]);

    return (
        <div className="app-surface-subtle h-full min-w-[320px] flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-panel-subtle)]">
            {/* Header */}
            <div className="app-header-glass z-10 flex-none space-y-3 p-3">
                <div className="flex items-center justify-between px-1 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        {tr('categoryLabels.templates')}
                        <Badge count={templates.length} />
                    </span>
                    <button 
                        onClick={handleSaveTemplate}
                        className="app-header-action rounded-xl p-1.5"
                        title={tr('actions.saveAsTemplate')}
                    >
                        <Save size={14} />
                    </button>
                </div>
                
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={tr('placeholders.searchTemplates')}
                    className="w-full"
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-panel-subtle)] p-2 custom-scrollbar">
                {filteredTemplates.length === 0 && !loading ? (
                    <EmptyState
                        icon={<Box size={24} className="opacity-20" />}
                        title={tr('emptyStates.noTemplates')}
                        action={{
                            label: tr('actions.saveCurrentProjectAsTemplate'),
                            onClick: handleSaveTemplate
                        }}
                    />
                ) : (
                    <TemplateResourceGrid templates={filteredTemplates} onLoadTemplate={setTemplateToLoad} />
                )}
                {loading && <LoadingSpinner />}
            </div>

             <LoadTemplateConfirmModal 
                isOpen={!!templateToLoad}
                templateName={templateToLoad?.name || ''}
                onClose={() => setTemplateToLoad(null)}
                onConfirm={confirmLoadTemplate}
            />

            <SaveTemplateModal
                isOpen={showSaveTemplateModal}
                onClose={() => setShowSaveTemplateModal(false)}
                onConfirm={handleSaveTemplateConfirm}
                initialName={project.name}
            />
        </div>
    );
};

// --- 2. Generic Asset View Component (Independent State Per Instance) ---

interface AssetCategoryViewProps {
    category: string;
    viewMode: ResourcePanelViewMode;
    onViewModeChange: (viewMode: ResourcePanelViewMode) => void;
}

const AssetCategoryView: React.FC<AssetCategoryViewProps> = ({ category, viewMode, onViewModeChange }) => {
    const { tr, t } = useMagicCutTranslation();
    const { 
        project,
        setDragOperation, 
        importAssets, 
        setPreviewSource, 
        removeAssetFromProjectState,
        updateResource,
        isAssetInUse,
        state,
        skimmingResource,
        setSkimmingResource,
        previewEffect,
        setPreviewEffect,
        setInteraction,
        useTransientState,
        playerController
    } = useMagicCutStore();
    
    const zoomLevel = useTransientState(s => s.zoomLevel);

    const [remoteAssets, setRemoteAssets] = useState<AnyAsset[]>([]);
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [_filters, _setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [debouncedQuery, setDebouncedQuery] = useState(DEFAULT_FILTERS.query);
    const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
    const [hiddenAssetIds, setHiddenAssetIds] = useState<Record<string, true>>({});
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadRequestIdRef = useRef(0);
    const favoriteMutationVersionsRef = useRef<Record<string, number>>({});

    const isEffectTab = category === 'effects' || category === 'transitions';
    const isTextTab = category === 'text';

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(_filters.query.trim());
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [_filters.query]);

    const localAssets = useMemo(() => {
        const collectedAssets = collectLocalAssetsForCategory(
            state.resources as Record<string, AnyMediaResource>,
            category
        );

        return filterAssetCollectionByQuery(collectedAssets, debouncedQuery);
    }, [state.resources, category, debouncedQuery]);

    const resolveResourcePanelStorageMode = useCallback(async (): Promise<ResourcePanelStorageMode> => {
        try {
            const result = await settingsBusinessService.getSettings();
            const mode = result.success ? result.data?.materialStorage?.mode : undefined;
            if (mode === 'local-first-sync' || mode === 'local-only' || mode === 'server-only') {
                return mode;
            }
        } catch (error) {
            console.warn('[MagicCutResourcePanel] Failed to resolve storage mode, falling back to local-first-sync', error);
        }

        return 'local-first-sync';
    }, []);

    const queryLocalAssetCenterPage = useCallback(async (pageNum: number) => {
        const workspaceScope = readWorkspaceScope();
        const localResult = await assetCenterService.query({
            page: pageNum,
            size: DEFAULT_PAGE_SIZE,
            keyword: debouncedQuery,
            sort: ['updatedAt,desc'],
            scope: {
                ...workspaceScope,
                projectId: workspaceScope.projectId || project.id,
                domain: 'magiccut'
            },
            types: resolveMagiccutContentKeys(category)
        });

        return mapUnifiedPageToAnyAssetPage(localResult);
    }, [category, debouncedQuery, project.id]);

    const queryRemoteAssetPage = useCallback(async (pageNum: number) => {
        const result = await queryAssetsBySdk({
            category: resolveMagiccutQueryCategory(category),
            pageRequest: {
                page: pageNum,
                size: DEFAULT_PAGE_SIZE,
                keyword: debouncedQuery,
                sort: ['updatedAt,desc']
            },
            allowedTypes: resolveMagiccutTypes(category)
        });

        const remoteContent = (Array.isArray(result?.content) ? result.content : []).map((item) => toAnyAsset(item));
        const persistedCatalogAssets = remoteContent.length === 0
            ? []
            : await Promise.all(
                remoteContent.map(async (item) => {
                    try {
                        const persisted = await assetCenterService.findById(item.id);
                        return persisted ? mapUnifiedAssetToAnyAsset(persisted) : null;
                    } catch (error) {
                        console.warn('[MagicCutResourcePanel] Failed to read persisted favorite state', error);
                        return null;
                    }
                })
            );

        return {
            ...result,
            content: applyFavoriteStateFromCatalog(remoteContent, persistedCatalogAssets)
        };
    }, [category, debouncedQuery]);

    const loadAssets = useCallback(async (pageNum: number, reset: boolean = false) => {
        const requestId = ++loadRequestIdRef.current;
        if (reset) setLoading(true);
        try {
            const storageMode = await resolveResourcePanelStorageMode();
            const result = await queryResourcePanelAssets({
                category,
                storageMode,
                queryLocal: () => queryLocalAssetCenterPage(pageNum),
                queryRemote: () => queryRemoteAssetPage(pageNum)
            });

            const fetchedContent: AnyAsset[] = Array.isArray(result?.content) ? result.content : [];

            if (requestId !== loadRequestIdRef.current) {
                return;
            }

            if (reset) {
                setRemoteAssets(prev => mergeRemoteAssetRefresh(prev, fetchedContent));
            } else {
                setRemoteAssets(prev => mergeAssetCollections(prev, fetchedContent));
            }
            
            setHasMore(!(result?.last ?? true));
            setPage(pageNum);
        } catch (e) {
            console.error("Failed to load assets", e);
        } finally {
            if (reset && requestId === loadRequestIdRef.current) setLoading(false);
        }
    }, [category, queryLocalAssetCenterPage, queryRemoteAssetPage, resolveResourcePanelStorageMode]);

    useEffect(() => {
        loadAssets(0, true);
    }, [loadAssets]);

    const assets = useMemo(() => {
        const merged = mergeAssetCollections(localAssets, remoteAssets)
            .filter((asset) => !hiddenAssetIds[asset.id]);

        return merged.map((asset) => {
            if (favoriteOverrides[asset.id] === undefined) return asset;
            return {
                ...asset,
                isFavorite: favoriteOverrides[asset.id]
            };
        });
    }, [localAssets, remoteAssets, hiddenAssetIds, favoriteOverrides]);

    const filteredAssets = useMemo(() => {
        let result = assets;
        
        if (filterCategory !== 'all') {
            result = result.filter(asset => {
                const assetOrigin = asset.origin || (asset.metadata as any)?.origin;
                if (filterCategory === 'favorite') return asset.isFavorite;
                if (filterCategory === 'upload') return assetOrigin === 'upload';
                if (filterCategory === 'ai') return assetOrigin === 'ai';
                return true;
            });
        }
        
        if (_filters.tags.length > 0) {
            result = result.filter(asset => {
                const assetTags = Array.isArray(asset.tags) 
                    ? asset.tags 
                    : (typeof asset.tags === 'string' ? [asset.tags] : []);
                return _filters.tags.some((tag: string) => assetTags.includes(tag));
            });
        }
        
        if (_filters.durationMin !== null || _filters.durationMax !== null) {
            result = result.filter(asset => {
                const duration = (asset as any).duration || (asset.metadata as any)?.duration || 0;
                if (_filters.durationMin !== null && duration < _filters.durationMin) return false;
                if (_filters.durationMax !== null && duration > _filters.durationMax) return false;
                return true;
            });
        }
        
        result = [...result].sort((a, b) => {
            let comparison = 0;
            
            switch (_filters.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    break;
                case 'duration': {
                    const durA = (a as any).duration || (a.metadata as any)?.duration || 0;
                    const durB = (b as any).duration || (b.metadata as any)?.duration || 0;
                    comparison = durA - durB;
                    break;
                }
            }
            
            return _filters.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return result;
    }, [assets, filterCategory, _filters]);

    const handleToggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
        const asset = assets.find((item) => item.id === id);
        if (!asset) {
            return;
        }

        const mutation = beginFavoriteMutation(favoriteMutationVersionsRef.current, id);
        favoriteMutationVersionsRef.current = mutation.activeMutations;
        setFavoriteOverrides(prev => ({ ...prev, [id]: isFavorite }));

        try {
            const scope = buildMagicCutImportScope(readWorkspaceScope(), project.id);
            let persistedAsset = await assetCenterService.setFavorite(id, isFavorite);

            if (!persistedAsset) {
                await assetCenterService.registerExistingAsset(
                    buildFavoriteRegistrationInput(asset, scope)
                );
                persistedAsset = await assetCenterService.setFavorite(id, isFavorite);
            }

            const nextAsset = persistedAsset
                ? mapUnifiedAssetToAnyAsset(persistedAsset)
                : null;

            if (!nextAsset) {
                throw new Error(`Favorite update failed: asset ${id} was not available in the local catalog.`);
            }

            if (!isCurrentFavoriteMutation(favoriteMutationVersionsRef.current, id, mutation.requestId)) {
                return;
            }

            setRemoteAssets(prev => syncFavoriteInAssetCollection(prev, id, !!nextAsset.isFavorite));
            updateResource(id, {
                isFavorite: !!nextAsset.isFavorite,
                updatedAt: nextAsset.updatedAt,
                metadata: nextAsset.metadata as AnyMediaResource['metadata']
            });
            setFavoriteOverrides(prev => clearFavoriteOverride(prev, id));
        } catch (error) {
            if (!isCurrentFavoriteMutation(favoriteMutationVersionsRef.current, id, mutation.requestId)) {
                return;
            }
            console.error('Failed to save favorite', error);
            setFavoriteOverrides(prev => clearFavoriteOverride(prev, id));
            await platform.notify(
                t('resources.notifications.favoriteUpdateFailedTitle'),
                t('resources.notifications.favoriteUpdateFailedDescription')
            );
        }
    }, [assets, project.id, t, updateResource]);
    
    const handleDeleteAsset = useCallback(async (asset: AnyAsset) => {
        const protectedDeleteMessage = getProtectedAssetDeleteMessage(asset.origin, (origin) =>
            origin === 'system'
                ? t('resources.notifications.systemAssetReadOnly')
                : t('resources.notifications.stockAssetReadOnly')
        );
        if (protectedDeleteMessage) {
            await platform.notify(t('resources.notifications.deleteUnavailableTitle'), protectedDeleteMessage);
            return;
        }

        if (isAssetInUse(asset.id)) {
            await platform.notify(
                t('resources.notifications.assetInUseTitle'),
                t('resources.notifications.assetInUseDescription')
            );
            return;
        }
        
        const confirmed = await platform.confirm(
            t('resources.notifications.deleteConfirmMessage', { name: asset.name }),
            t('resources.notifications.deleteConfirmTitle'),
            'warning'
        );
        if (confirmed) {
            const previewCleanup = resolveDeletedAssetPreviewCleanup({
                assetId: asset.id,
                skimmingResourceId: skimmingResource?.id,
                isCoordinatorPreviewingAsset: playerPreviewService.isPreviewingResource(asset.id)
            });

            const deletionResult = await assetService.deleteById(asset.id);
            if (!deletionResult.success) {
                await platform.notify(
                    t('resources.notifications.deleteFailedTitle'),
                    deletionResult.message || t('resources.notifications.deleteFailedDescription')
                );
                return;
            }

            if (previewCleanup.clearCoordinatorPreview) {
                playerPreviewService.clearPreviewForResource(asset.id);
            }
            if (previewCleanup.clearStorePreview) {
                setPreviewSource(null);
                setSkimmingResource(null);
            }

            removeAssetFromProjectState(asset.id);
            setRemoteAssets(prev => prev.filter(a => a.id !== asset.id));
            setHiddenAssetIds(prev => ({ ...prev, [asset.id]: true }));
        }
    }, [isAssetInUse, removeAssetFromProjectState, setPreviewSource, setSkimmingResource, skimmingResource, t]);

    const handleDragStart = useCallback((e: React.DragEvent, item: AnyAsset) => {
        let duration = (item as any).duration || ((item.metadata as any)?.duration) || 5; 
        
        if (item.type === MediaResourceType.TRANSITION) duration = 0.5;
        if (item.type === MediaResourceType.EFFECT) duration = 5; 
        if (item.type === MediaResourceType.TEXT) duration = 5;
        if (item.type === MediaResourceType.IMAGE) duration = 5;

        const payloadItem = { ...item };
        
        setInteraction({
            type: 'idle', 
            clipId: null, 
            initialX: 0, initialY: 0, initialStartTime: 0, initialDuration: 0, initialTrackId: '', initialOffset: 0,
            currentTrackId: null, currentTime: 0, 
            isSnapping: false, snapLines: [], validDrop: true, hasCollision: false, insertTrackIndex: null, dropPreview: undefined
        });

        setDragOperation({
            type: 'resource',
            payload: payloadItem, 
            resourceType: item.type,
            duration: duration,
            ghostWidth: duration * TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoomLevel,
            initialX: e.clientX,
            initialY: e.clientY
        });
        
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'copy';
    }, [setDragOperation, zoomLevel, setInteraction]);

    const handleDragEnd = useCallback(() => {
        setDragOperation(null);
    }, [setDragOperation]);

    const handlePreviewToggle = useCallback((item: AnyAsset | null) => {
        playerController.pause();
        setPreviewEffect(null);

        if (!item) {
            setPreviewSource(null);
            playerPreviewService.clearPreview();
            return;
        }

        const isAudioOnly = item.type === MediaResourceType.AUDIO
            || item.type === MediaResourceType.MUSIC
            || item.type === MediaResourceType.VOICE
            || item.type === MediaResourceType.SPEECH;

        if (isAudioOnly) {
            setPreviewSource(null);
            playerPreviewService.previewResource(item, 0);
            return;
        }

        playerPreviewService.clearPreview();
        setPreviewSource(item);
    }, [playerController, setPreviewEffect, setPreviewSource]);

    const getAcceptTypes = (cat: string) => {
        switch(cat) {
            case 'video': return 'video/*';
            case 'image': return 'image/*';
            case 'music': return 'audio/*';
            case 'audio': 
            case 'voice':
            case 'sfx': return 'audio/*';
            default: return undefined;
        }
    };

    const handleImport = useCallback(async () => {
        setLoading(true);
        try {
            let type: AssetType | undefined = undefined;
            if (category === 'music') type = 'music';
            else if (category === 'video') type = 'video';
            else if (category === 'image') type = 'image';
            else if (category === 'audio') type = 'audio';
            else if (category === 'voice') type = 'voice';
            else if (category === 'sfx') type = 'sfx';
            
            const importedResources = await importAssets(getAcceptTypes(category), type);
            const normalizedImported = importedResources
                .map((resource) => ({
                    ...(resource as AnyAsset),
                    origin:
                        (resource as AnyAsset).origin ||
                        ((resource.metadata as any)?.origin as AnyAsset['origin']) ||
                        'upload'
                }))
                .filter((resource) => {
                    const resourceType = resource.type as MediaResourceType;
                    if (category === 'video' && resourceType === MediaResourceType.VIDEO) return true;
                    if (category === 'image' && resourceType === MediaResourceType.IMAGE) return true;
                    if (category === 'music' && resourceType === MediaResourceType.MUSIC) return true;
                    if ((category === 'audio' || category === 'sfx') && (resourceType === MediaResourceType.AUDIO || resourceType === MediaResourceType.VOICE || resourceType === MediaResourceType.SPEECH)) return true;
                    if (category === 'voice' && resourceType === MediaResourceType.VOICE) return true;
                    if (category === 'text' && (resourceType === MediaResourceType.TEXT || resourceType === MediaResourceType.SUBTITLE)) return true;
                    return !isEffectTab && !isTextTab;
                });

            if (normalizedImported.length > 0) {
                setRemoteAssets(prev => mergeAssetCollections(normalizedImported, prev));
            }

            setFilterCategory('upload');
            await loadAssets(0, true);
        } finally {
            setLoading(false);
        }
    }, [importAssets, category, isEffectTab, isTextTab, loadAssets]);

    const renderPanelContent = () => {
        switch (category) {
            case 'video':
                return <VideoResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onToggleFavorite={handleToggleFavorite} onDoubleClick={handlePreviewToggle} onHover={setSkimmingResource} onDelete={handleDeleteAsset} viewMode={viewMode} />;
            case 'image':
                return <ImageResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onToggleFavorite={handleToggleFavorite} onDoubleClick={handlePreviewToggle} onHover={setSkimmingResource} onDelete={handleDeleteAsset} viewMode={viewMode} />;
            case 'text':
                return <TextResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} viewMode={viewMode} />;
            case 'music':
                 return <MusicResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} onPreview={handlePreviewToggle} onDelete={handleDeleteAsset} viewMode={viewMode} />;
            case 'audio':
            case 'voice':
            case 'sfx':
                return <AudioResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} onPreview={handlePreviewToggle} onDelete={handleDeleteAsset} viewMode={viewMode} />;
            case 'transitions':
                return <TransitionResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} viewMode={viewMode} />;
            case 'effects':
                return <EffectResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} previewEffect={previewEffect} setPreviewEffect={setPreviewEffect} viewMode={viewMode} />;
            default:
                return <ImageResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onToggleFavorite={handleToggleFavorite} onDoubleClick={handlePreviewToggle} onHover={setSkimmingResource} onDelete={handleDeleteAsset} viewMode={viewMode} />;
        }
    };

    return (
        <div className="app-surface-subtle h-full min-w-[320px] flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-panel-subtle)]">
            {/* Header */}
            <div className="app-header-glass z-10 flex-none space-y-3 p-3">
                <div className="flex items-center justify-between px-1 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        {resolveResourceCategoryLabel(category, tr)}
                        <Badge count={assets.length} />
                    </span>
                    <div className="app-floating-panel flex items-center gap-1 rounded-2xl p-1">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            aria-pressed={viewMode === 'grid'}
                            className={`app-header-action rounded-xl p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-[color-mix(in_srgb,var(--theme-primary-500)_14%,transparent)] text-primary-500' : ''}`}
                            title={tr('viewModes.grid')}
                        >
                            <Grid size={12} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            aria-pressed={viewMode === 'list'}
                            className={`app-header-action rounded-xl p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[color-mix(in_srgb,var(--theme-primary-500)_14%,transparent)] text-primary-500' : ''}`}
                            title={tr('viewModes.list')}
                        >
                            <List size={12} />
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <SearchInput
                        value={_filters.query}
                        onChange={(query) =>
                            _setFilters((prev) => ({
                                ...prev,
                                query
                            }))
                        }
                        placeholder={tr('placeholders.searchAssets')}
                        className="flex-1"
                    />
                    {!isEffectTab && !isTextTab && (
                        <button 
                            onClick={handleImport}
                            disabled={loading}
                            className="app-header-action flex h-8 w-8 items-center justify-center rounded-xl transition-colors disabled:opacity-50"
                            title={tr('actions.importFiles')}
                        >
                            <UploadCloud size={14} />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                {!isEffectTab && !isTextTab && (
                    <div className="app-segmented-control flex items-center gap-1 overflow-x-auto no-scrollbar">
                        <ResourceFilterTab id="all" label={tr('filters.all')} icon={LayoutGrid} active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} />
                        <ResourceFilterTab id="upload" label={tr('filters.uploads')} icon={FolderUp} active={filterCategory === 'upload'} onClick={() => setFilterCategory('upload')} />
                        <ResourceFilterTab id="ai" label={tr('filters.ai')} icon={Sparkles} active={filterCategory === 'ai'} onClick={() => setFilterCategory('ai')} />
                        <ResourceFilterTab id="favorite" label={tr('filters.favorites')} icon={Heart} active={filterCategory === 'favorite'} onClick={() => setFilterCategory('favorite')} />
                    </div>
                )}
            </div>

            {/* Grid Content */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto bg-[var(--bg-panel-subtle)] p-1 custom-scrollbar"
            >
                {filteredAssets.length === 0 && !loading ? (
                    <ResourceEmptyState filterCategory={filterCategory} isEffectTab={isEffectTab || isTextTab} onImport={handleImport} />
                ) : (
                    renderPanelContent()
                )}

                {hasMore && !loading && filterCategory === 'all' && filteredAssets.length > 0 && (
                    <div className="flex justify-center py-4">
                        <button 
                            onClick={() => loadAssets(page + 1)}
                            className="app-header-action rounded-full px-3 py-1.5 text-xs"
                        >
                            {tr('actions.loadMore')}
                        </button>
                    </div>
                )}
                
                {loading && <LoadingSpinner />}
            </div>
        </div>
    );
};

const ResourceFilterTab: React.FC<{ id: FilterCategory, label: string, icon: React.ComponentType<{ size?: number }>, active: boolean, onClick: () => void }> = FilterTab;

const ResourceEmptyState: React.FC<{ filterCategory: string, isEffectTab: boolean, onImport: () => void }> = ({ filterCategory, isEffectTab, onImport }) => {
    const { tr } = useMagicCutTranslation();
    const icon = filterCategory === 'favorite' 
        ? <Heart size={20} className="opacity-20 text-red-500" /> 
        : <UploadCloud size={20} className="opacity-20" />;
    
    const title = filterCategory === 'favorite' ? tr('emptyStates.noFavorites') : tr('emptyStates.noAssets');
    
    const action = filterCategory === 'all' && !isEffectTab 
        ? { label: tr('actions.addNew'), onClick: onImport } 
        : undefined;

    return <EmptyState icon={icon} title={title} action={action} />;
};
