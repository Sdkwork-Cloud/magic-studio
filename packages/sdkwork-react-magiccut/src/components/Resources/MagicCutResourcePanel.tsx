
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Search, Grid, List, UploadCloud, Heart, Sparkles, FolderUp, LayoutGrid, Save, Box } from 'lucide-react';
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
import { FilterTab, LoadingSpinner, EmptyState } from '../common/UIComponents';
import { platform } from '@sdkwork/react-core';
import { getProtectedAssetDeleteMessage } from '../../domain/assets/assetDeleteGuard';
import { playerPreviewService } from '../../services';
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
        <div className="h-full flex flex-col bg-[#050505] border-r border-white/5 min-w-[320px]">
            {/* Header */}
            <div className="p-3 border-b border-white/5 space-y-3 bg-[#050505] z-10 flex-none">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-gray-300">
                        TEMPLATES
                        <span className="bg-[#1a1a1a] px-1.5 rounded text-[9px] text-gray-500 border border-white/5">
                            {templates.length}
                        </span>
                    </span>
                    <button 
                        onClick={handleSaveTemplate}
                        className="p-1.5 hover:text-white rounded hover:bg-[#1a1a1a] text-gray-500 transition-colors"
                        title="Save as template"
                    >
                        <Save size={14} />
                    </button>
                </div>
                
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full bg-[#121212] border border-[#27272a] hover:border-[#3f3f46] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-[#050505]">
                {filteredTemplates.length === 0 && !loading ? (
                     <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3 border-2 border-dashed border-[#27272a] rounded-xl m-2 bg-[#121212]">
                        <Box size={24} className="opacity-20" />
                        <p className="text-xs font-medium">No templates found</p>
                        <button onClick={handleSaveTemplate} className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
                            <Save size={10} /> Save current project as template
                        </button>
                    </div>
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
    const [_showFilters, _setShowFilters] = useState(false);
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
                case 'duration':
                    const durA = (a as any).duration || (a.metadata as any)?.duration || 0;
                    const durB = (b as any).duration || (b.metadata as any)?.duration || 0;
                    comparison = durA - durB;
                    break;
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
                'Favorite update failed',
                'MagicStudio could not save this favorite to the local asset catalog.'
            );
        }
    }, [assets, project.id, updateResource]);
    
    const handleDeleteAsset = useCallback(async (asset: AnyAsset) => {
        const protectedDeleteMessage = getProtectedAssetDeleteMessage(asset.origin);
        if (protectedDeleteMessage) {
            await platform.notify('Delete unavailable', protectedDeleteMessage);
            return;
        }

        if (isAssetInUse(asset.id)) {
            await platform.notify(
                'Asset in use',
                'This media is currently used on the timeline. Remove the related clips before deleting the source asset.'
            );
            return;
        }
        
        const confirmed = await platform.confirm(`Delete "${asset.name}"?`, "Delete Asset", 'warning');
        if (confirmed) {
            const previewCleanup = resolveDeletedAssetPreviewCleanup({
                assetId: asset.id,
                skimmingResourceId: skimmingResource?.id,
                isCoordinatorPreviewingAsset: playerPreviewService.isPreviewingResource(asset.id)
            });

            const deletionResult = await assetService.deleteById(asset.id);
            if (!deletionResult.success) {
                await platform.notify(
                    'Delete failed',
                    deletionResult.message || 'MagicStudio could not remove this asset from local storage.'
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
    }, [isAssetInUse, removeAssetFromProjectState, setPreviewSource, setSkimmingResource, skimmingResource]);

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
        <div className="h-full flex flex-col bg-[#050505] border-r border-white/5 min-w-[320px]">
            {/* Header */}
            <div className="p-3 border-b border-white/5 space-y-3 bg-[#050505] z-10 flex-none">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-gray-300">
                        {category.toUpperCase()}
                        <span className="bg-[#1a1a1a] px-1.5 rounded text-[9px] text-gray-500 border border-white/5">
                            {assets.length}
                        </span>
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            aria-pressed={viewMode === 'grid'}
                            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
                            title="Grid view"
                        >
                            <Grid size={12} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            aria-pressed={viewMode === 'list'}
                            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
                            title="List view"
                        >
                            <List size={12} />
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-2">
                     <div className="relative flex-1 group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            value={_filters.query}
                            onChange={(e) =>
                                _setFilters((prev) => ({
                                    ...prev,
                                    query: e.target.value
                                }))
                            }
                            placeholder="Search assets..."
                            className="w-full bg-[#121212] border border-[#27272a] hover:border-[#3f3f46] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                        />
                    </div>
                    {!isEffectTab && !isTextTab && (
                        <button 
                            onClick={handleImport}
                            disabled={loading}
                            className="flex items-center justify-center w-8 bg-[#1e1e20] hover:bg-[#252526] border border-[#27272a] text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Import Files"
                        >
                            <UploadCloud size={14} />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                {!isEffectTab && !isTextTab && (
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                        <ResourceFilterTab id="all" label="All" icon={LayoutGrid} active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} />
                        <ResourceFilterTab id="upload" label="Uploads" icon={FolderUp} active={filterCategory === 'upload'} onClick={() => setFilterCategory('upload')} />
                        <ResourceFilterTab id="ai" label="AI" icon={Sparkles} active={filterCategory === 'ai'} onClick={() => setFilterCategory('ai')} />
                        <ResourceFilterTab id="favorite" label="Favorites" icon={Heart} active={filterCategory === 'favorite'} onClick={() => setFilterCategory('favorite')} />
                    </div>
                )}
            </div>

            {/* Grid Content */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-1 custom-scrollbar bg-[#050505]"
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
                            className="text-xs text-gray-600 hover:text-white transition-colors"
                        >
                            Load More
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
    const icon = filterCategory === 'favorite' 
        ? <Heart size={20} className="opacity-20 text-red-500" /> 
        : <UploadCloud size={20} className="opacity-20" />;
    
    const title = filterCategory === 'favorite' ? 'No favorites yet' : 'No assets found';
    
    const action = filterCategory === 'all' && !isEffectTab 
        ? { label: 'Add new', onClick: onImport } 
        : undefined;

    return <EmptyState icon={icon} title={title} action={action} />;
};
