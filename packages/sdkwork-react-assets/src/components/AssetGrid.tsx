
import type { Asset } from '../entities/asset.entity'
import React, { useCallback, useEffect, useRef } from 'react';
import { useAssetStore } from '../store/assetStore';
import { resolveAssetUrlByAssetIdFirst } from '../asset-center';
import { useAssetUrl } from '../hooks/useAssetUrl';
import { FileImage, Film, Music, Volume2, Smile, Sparkles, Upload, Trash2, Database, Shield } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

interface AssetGridProps {
    onPreview: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
    selectedAssetIds?: string[];
}

export const AssetGrid: React.FC<AssetGridProps> = ({
    onPreview,
    onDelete,
    selectedAssetIds = []
}) => {
    const {
        assets,
        isLoading,
        pageData,
        loadPage,
        filterType,
        filterOrigin,
        searchQuery,
        clearFilters,
        setSearchQuery,
        importAssets
    } = useAssetStore();
    const { t } = useTranslation();
    const hasNextPage = !!pageData && !pageData.last;
    const isInitialLoading = isLoading && assets.length === 0;
    const autoLoadAnchorRef = useRef<HTMLDivElement | null>(null);
    const lastAutoRequestedPageRef = useRef<number | null>(null);
    const currentPage = pageData?.number || 0;
    const hasActiveCriteria = searchQuery.trim().length > 0 || filterType !== 'all' || filterOrigin !== 'all';

    const requestNextPage = useCallback(() => {
        if (!hasNextPage || isLoading) {
            return;
        }
        const targetPage = currentPage + 1;
        if (lastAutoRequestedPageRef.current === targetPage) {
            return;
        }
        lastAutoRequestedPageRef.current = targetPage;
        void loadPage(targetPage);
    }, [currentPage, hasNextPage, isLoading, loadPage]);

    useEffect(() => {
        if (!hasNextPage) {
            lastAutoRequestedPageRef.current = null;
            return;
        }
        const node = autoLoadAnchorRef.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    requestNextPage();
                }
            },
            {
                rootMargin: '320px 0px',
                threshold: 0
            }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasNextPage, requestNextPage]);

    useEffect(() => {
        if (!isLoading && lastAutoRequestedPageRef.current !== null && currentPage >= lastAutoRequestedPageRef.current) {
            lastAutoRequestedPageRef.current = null;
        }
    }, [currentPage, isLoading]);

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 gap-3">
                 <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-sm">
                    {t('assetCenter.grid.loadingLibrary', 'Loading library...')}
                 </span>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-80 select-none px-6">
                <div className="w-20 h-20 bg-[#252526] rounded-2xl flex items-center justify-center mb-4 border border-[#333]">
                    <FileImage size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">
                    {hasActiveCriteria
                        ? t('assetCenter.empty.filteredTitle', 'No assets match current filters')
                        : t('assetCenter.empty.initialTitle', 'No assets found')}
                </p>
                <p className="text-xs opacity-60 mt-1 text-center">
                    {hasActiveCriteria
                        ? t('assetCenter.empty.filteredDesc', 'Try clearing some filters or search keywords.')
                        : t('assetCenter.empty.initialDesc', 'Upload files or generate with AI')}
                </p>
                <div className="mt-4 flex items-center gap-2">
                    {hasActiveCriteria && (
                        <button
                            type="button"
                            onClick={() => {
                                clearFilters();
                                setSearchQuery('');
                            }}
                            className="rounded-md border border-[#333] bg-[#232326] px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2a2a2d]"
                        >
                            {t('assetCenter.filters.clearAll', 'Clear All')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={importAssets}
                        className="rounded-md border border-blue-500/40 bg-blue-600/20 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-600/30"
                    >
                        {t('studio.common.import', 'Import')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-6 content-start pb-20">
            {assets.map(asset => (
                <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={selectedAssetIds.includes(asset.id)}
                    onClick={() => onPreview(asset)}
                    onDelete={() => onDelete(asset)}
                />
            ))}
            <div ref={autoLoadAnchorRef} className="col-span-full h-1" />
            {hasNextPage && (
                <div className="col-span-full pt-2 flex justify-center">
                    <button
                        onClick={requestNextPage}
                        disabled={isLoading}
                        className={`
                            min-w-[180px] rounded-lg px-4 py-2.5 text-sm font-medium border transition-all
                            ${isLoading
                                ? 'cursor-not-allowed border-[#333] bg-[#1a1a1a] text-gray-500'
                                : 'border-[#333] bg-[#1f1f21] text-gray-300 hover:border-[#444] hover:text-white hover:bg-[#262629]'
                            }
                        `}
                    >
                        {isLoading
                            ? t('common.status.loading', 'Loading...')
                            : t('assetCenter.grid.loadMore', 'Load More')}
                    </button>
                </div>
            )}
        </div>
    );
};

const AssetCard: React.FC<{
    asset: Asset;
    selected?: boolean;
    onClick: () => void;
    onDelete: () => void;
}> = ({ asset, selected = false, onClick, onDelete }) => {
    const { t } = useTranslation();
    const { url: displayUrl } = useAssetUrl(asset, {
        resolver: resolveAssetUrlByAssetIdFirst
    });

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '';
        if (bytes < 1024) return bytes + ' B';
        const k = 1024;
        const sizes = ['KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const renderThumbnail = () => {
        if (asset.type === 'image' || asset.type === 'character' || asset.type === 'video') {
            if (displayUrl) {
                if (asset.type === 'video') {
                    return (
                         <div className="w-full h-full relative bg-black flex items-center justify-center">
                             <video src={displayUrl} className="w-full h-full object-cover" muted preload="metadata" onMouseOver={e => e.currentTarget.play().catch(()=>{})} onMouseOut={e => {e.currentTarget.pause(); e.currentTarget.currentTime=0;}} />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <Film size={24} className="text-white/50 drop-shadow-md" />
                             </div>
                         </div>
                    );
                }
                return <img src={displayUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" alt={asset.name} />;
            }
            
            // Fallback Icons
            return (
                <div className="w-full h-full bg-[#1e1e20] flex items-center justify-center text-gray-600">
                    {asset.type === 'character' ? <Smile size={32} /> : 
                     asset.type === 'video' ? <Film size={32} /> :
                     <FileImage size={32} />}
                </div>
            );
        }
        
        // Audio Types
        if (asset.type === 'audio' || asset.type === 'music' || asset.type === 'voice' || asset.type as string === 'speech') {
            return (
                <div className="w-full h-full bg-[#1e1e20] flex flex-col items-center justify-center gap-2 group-hover:bg-[#252528] transition-colors">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/5 ${asset.type === 'music' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {asset.type === 'music' ? <Music size={20} /> : <Volume2 size={20} />}
                    </div>
                </div>
            );
        }
        
        return <div className="w-full h-full bg-[#111]" />;
    };
    
    const originBadge = (() => {
        switch (asset.origin) {
            case 'ai':
                return {
                    Icon: Sparkles,
                    label: t('assetCenter.badges.ai', 'AI'),
                    className: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                };
            case 'stock':
                return {
                    Icon: Database,
                    label: t('assetCenter.badges.stock', 'Stock'),
                    className: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                };
            case 'system':
                return {
                    Icon: Shield,
                    label: t('assetCenter.badges.system', 'System'),
                    className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                };
            case 'upload':
            default:
                return {
                    Icon: Upload,
                    label: t('assetCenter.badges.upload', 'Upload'),
                    className: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                };
        }
    })();
    const OriginIcon = originBadge.Icon;

    const canDelete = asset.origin !== 'stock' && asset.origin !== 'system';

    return (
        <div 
            onClick={onClick}
            className={`
                group relative bg-[#18181b] border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 aspect-[1/1.1] flex flex-col
                ${selected ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-[#27272a] hover:border-blue-500/40'}
            `}
        >
            <div className="flex-1 relative overflow-hidden bg-[#111]">
                {renderThumbnail()}
                
                {/* Duration Badge */}
                {(asset.type === 'video' || asset.type === 'audio' || asset.type === 'music' || asset.type as string === 'speech') && asset.metadata.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-mono border border-white/10">
                        {Math.floor(asset.metadata.duration)}s
                    </div>
                )}
                
                {/* Origin Badge */}
                <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 border backdrop-blur-md shadow-sm ${originBadge.className}`}>
                    <OriginIcon size={10} />
                    {originBadge.label}
                </div>

                {/* Delete Button (Hover) */}
                {canDelete && (
                    <button 
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white/70 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title={t('assetCenter.actions.deleteAsset', 'Delete Asset')}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
            
            <div className="p-3 bg-[#1e1e20] border-t border-[#27272a] relative group-hover:bg-[#252528] transition-colors">
                <h4 className="text-xs font-medium text-gray-200 truncate" title={asset.name}>
                    {asset.name}
                </h4>
                <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-[#111] px-1 rounded">
                        {asset.metadata.extension?.replace('.', '') || asset.type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{formatSize(asset.size)}</span>
                </div>
            </div>
        </div>
    );
};
