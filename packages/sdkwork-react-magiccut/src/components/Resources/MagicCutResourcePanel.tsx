
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Search, Grid, List, UploadCloud, Heart, Sparkles, FolderUp, LayoutGrid, Save, Box } from 'lucide-react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { DEFAULT_PAGE_SIZE, AssetType } from 'sdkwork-react-commons';
import { AnyAsset } from 'sdkwork-react-assets';
import { CutTemplate, TemplateMetadata } from '../../entities/magicCut.entity';
import { MediaResourceType } from 'sdkwork-react-commons';
import { TIMELINE_CONSTANTS } from '../../constants';
import { assetService, assetServiceRegistry } from 'sdkwork-react-assets';
import { useMagicCutEvent, useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../../events';
import { LoadTemplateConfirmModal } from '../LoadTemplateConfirmModal';
;
import { platform } from 'sdkwork-react-core';
import { TemplateResourceGrid } from './grid/TemplateResourceGrid';
import { TextResourcePanel } from './panels/TextResourcePanel';
import { TransitionResourcePanel } from './panels/TransitionResourcePanel';
import { EffectResourcePanel } from './panels/EffectResourcePanel';
import { MusicResourcePanel } from './panels/MusicResourcePanel';
import { AudioResourcePanel } from './panels/AudioResourcePanel';
import { VideoResourcePanel } from './panels/VideoResourcePanel';
import { ImageResourcePanel } from './panels/ImageResourcePanel';
import { FilterTab, LoadingSpinner, EmptyState } from '../common/UIComponents';

interface MagicCutResourcePanelProps {
    activeTab: string;
}

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

export const MagicCutResourcePanel: React.FC<MagicCutResourcePanelProps> = ({ activeTab }) => {
    
    if (activeTab === 'templates') {
        return <TemplateCategoryView />;
    }

    return <AssetCategoryView key={activeTab} category={activeTab} />;
};

// --- 1. Template View Component (Independent) ---

const TemplateCategoryView: React.FC = () => {
    const { saveAsTemplate, loadTemplate } = useMagicCutStore();
    const bus = useMagicCutBus();
    
    const [templates, setTemplates] = useState<CutTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [templateToLoad, setTemplateToLoad] = useState<CutTemplate | null>(null);

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

    const handleSaveTemplate = useCallback(async () => {
        const name = prompt("Enter template name:");
        if (name) {
            const metadata: TemplateMetadata = { name };
            await saveAsTemplate(metadata);
            bus.emit(MagicCutEvents.TEMPLATE_SAVED);
        }
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
        </div>
    );
};

// --- 2. Generic Asset View Component (Independent State Per Instance) ---

interface AssetCategoryViewProps {
    category: string;
}

const AssetCategoryView: React.FC<AssetCategoryViewProps> = ({ category }) => {
    const { 
        setDragOperation, 
        importAssets, 
        setPreviewSource, 
        state,
        setSkimmingResource,
        previewEffect,
        setPreviewEffect,
        setInteraction,
        useTransientState
    } = useMagicCutStore();
    
    const zoomLevel = useTransientState(s => s.zoomLevel);

    const [assets, setAssets] = useState<AnyAsset[]>([]);
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const isEffectTab = category === 'effects' || category === 'transitions';
    const isTextTab = category === 'text';

    const loadAssets = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (reset) setLoading(true);
        try {
            const service = assetServiceRegistry.get(category);
            const result = await service.findAll({ 
                page: pageNum, 
                size: DEFAULT_PAGE_SIZE 
            }, filters.query);

            const fetchedContent: AnyAsset[] = result.content.map((a: any) => ({
                ...a,
                origin: a.origin || 'stock',
                isFavorite: a.isFavorite || false
            }));
            
            let localContent: AnyAsset[] = [];
            if (pageNum === 0 && !isEffectTab && !isTextTab) {
                 const storeResources = Object.values(state.resources).filter((res: any) => {
                     const type = res.type as MediaResourceType;
                     if (category === 'video' && type === MediaResourceType.VIDEO) return true;
                     if (category === 'image' && type === MediaResourceType.IMAGE) return true;
                     if (category === 'music' && type === MediaResourceType.MUSIC) return true;
                     if ((category === 'audio' || category === 'sfx') && (type === MediaResourceType.AUDIO || type === MediaResourceType.VOICE || type === MediaResourceType.SPEECH)) return true;
                     if (category === 'voice' && type === MediaResourceType.VOICE) return true;
                     return false;
                 });
                 localContent = storeResources.reverse();
            }

            if (reset) {
                const localIds = new Set(localContent.map(l => l.id));
                const uniqueFetched = fetchedContent.filter(f => !localIds.has(f.id));
                setAssets([...localContent, ...uniqueFetched]);
            } else {
                setAssets(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newUnique = fetchedContent.filter(f => !existingIds.has(f.id));
                    return [...prev, ...newUnique];
                });
            }
            
            setHasMore(!result.last);
            setPage(pageNum);
        } catch (e) {
            console.error("Failed to load assets", e);
        } finally {
            if (reset) setLoading(false);
        }
    }, [category, filters.query, state.resources, isEffectTab, isTextTab]);

    useEffect(() => {
        loadAssets(0, true);
    }, [loadAssets]);

    const filteredAssets = useMemo(() => {
        let result = assets;
        
        if (filterCategory !== 'all') {
            result = result.filter(asset => {
                if (filterCategory === 'favorite') return asset.isFavorite;
                if (filterCategory === 'upload') return asset.origin === 'upload';
                if (filterCategory === 'ai') return asset.origin === 'ai';
                return true;
            });
        }
        
        if (filters.tags.length > 0) {
            result = result.filter(asset => {
                const assetTags = Array.isArray(asset.tags) 
                    ? asset.tags 
                    : (typeof asset.tags === 'string' ? [asset.tags] : []);
                return filters.tags.some(tag => assetTags.includes(tag));
            });
        }
        
        if (filters.durationMin !== null || filters.durationMax !== null) {
            result = result.filter(asset => {
                const duration = (asset as any).duration || asset.metadata?.duration || 0;
                if (filters.durationMin !== null && duration < filters.durationMin) return false;
                if (filters.durationMax !== null && duration > filters.durationMax) return false;
                return true;
            });
        }
        
        result = [...result].sort((a, b) => {
            let comparison = 0;
            
            switch (filters.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    break;
                case 'duration':
                    const durA = (a as any).duration || a.metadata?.duration || 0;
                    const durB = (b as any).duration || b.metadata?.duration || 0;
                    comparison = durA - durB;
                    break;
            }
            
            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return result;
    }, [assets, filterCategory, filters]);

    const handleToggleFavorite = useCallback((id: string, isFavorite: boolean) => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, isFavorite } : a));
    }, []);
    
    const handleDeleteAsset = useCallback(async (asset: AnyAsset) => {
        if (asset.origin === 'stock' || asset.origin === 'system') {
            alert("Cannot delete system assets");
            return;
        }
        
        const confirmed = await platform.confirm(`Delete "${asset.name}"?`, "Delete Asset", 'warning');
        if (confirmed) {
            await assetService.deleteById(asset.id);
            setAssets(prev => prev.filter(a => a.id !== asset.id));
        }
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent, item: AnyAsset) => {
        let duration = (item as any).duration || (item.metadata?.duration) || 5; 
        
        if (item.type === MediaResourceType.TRANSITION) duration = 1;
        if (item.type === MediaResourceType.EFFECT) duration = 5; 
        if (item.type === MediaResourceType.TEXT) duration = 5;
        if (item.type === MediaResourceType.IMAGE) duration = 5;

        const payloadItem = { ...item };
        
        setInteraction({
            type: 'idle', 
            clipId: null, 
            initialX: 0, initialY: 0, initialStartTime: 0, initialDuration: 0, initialTrackId: '', initialOffset: 0,
            currentTrackId: null, currentTime: 0, 
            isSnapping: false, snapLines: [], validDrop: true, hasCollision: false, insertTrackIndex: null
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

    const handleDoubleClick = useCallback((item: AnyAsset) => {
        setPreviewSource(item);
    }, [setPreviewSource]);

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
            
            await importAssets(getAcceptTypes(category), type);
            setFilterCategory('upload'); 
        } finally {
            setLoading(false);
        }
    }, [importAssets, category]);

    const renderPanelContent = () => {
        switch (category) {
            case 'video':
                return <VideoResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onToggleFavorite={handleToggleFavorite} onDoubleClick={handleDoubleClick} onHover={setSkimmingResource} onDelete={handleDeleteAsset} />;
            case 'image':
                return <ImageResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onToggleFavorite={handleToggleFavorite} onDoubleClick={handleDoubleClick} onHover={setSkimmingResource} onDelete={handleDeleteAsset} />;
            case 'text':
                return <TextResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} />;
            case 'music':
                 return <MusicResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} onPreview={handleDoubleClick} onDelete={handleDeleteAsset} />;
            case 'audio':
            case 'voice':
            case 'sfx':
                return <AudioResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} onPreview={handleDoubleClick} onDelete={handleDeleteAsset} />;
            case 'transitions':
                return <TransitionResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} />;
            case 'effects':
                return <EffectResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onToggleFavorite={handleToggleFavorite} previewEffect={previewEffect} setPreviewEffect={setPreviewEffect} />;
            default:
                return <ImageResourcePanel assets={filteredAssets} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onToggleFavorite={handleToggleFavorite} onDoubleClick={handleDoubleClick} onHover={setSkimmingResource} onDelete={handleDeleteAsset} />;
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
                        <button className="p-1.5 hover:text-white rounded hover:bg-[#1a1a1a] text-gray-500"><Grid size={12} /></button>
                        <button className="p-1.5 hover:text-white rounded hover:bg-[#1a1a1a] text-gray-500"><List size={12} /></button>
                    </div>
                </div>
                
                <div className="flex gap-2">
                     <div className="relative flex-1 group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

