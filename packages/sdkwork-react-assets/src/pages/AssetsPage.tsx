import type { Asset } from '../entities';
import { AssetGrid } from '../components/AssetGrid';
import React, { useState } from 'react';
import { useAssetStore } from '../store/assetStore';
import { Search, Upload, X, File as FileIcon, Film, Image as ImageIcon, Volume2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { platform } from '@sdkwork/react-core';
import { useAssetUrl } from '../hooks/useAssetUrl';
import { resolveAssetUrlByAssetIdFirst } from '../asset-center';

interface AssetPreviewModalProps {
    asset: Asset;
    onClose: () => void;
}

const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({ asset, onClose }) => {
    const { url, loading } = useAssetUrl(asset, { resolver: resolveAssetUrlByAssetIdFirst });
    const previewUrl = url || asset.path;
    const hasRenderableUrl = !!previewUrl && !previewUrl.startsWith('assets://');
    const isImage = asset.type === 'image' || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(asset.path);
    const isVideo = asset.type === 'video' || /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(asset.path);
    const isAudio = ['audio', 'music', 'voice', 'sfx'].includes(asset.type);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={onClose}>
            <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-[#333] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{asset.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 flex items-center justify-center min-h-[400px]">
                    {loading && (
                        <p className="text-gray-400">Loading preview...</p>
                    )}
                    {!loading && isImage && hasRenderableUrl && (
                        <img src={previewUrl} alt={asset.name} className="max-h-[70vh] max-w-full object-contain rounded-lg" />
                    )}
                    {!loading && isVideo && hasRenderableUrl && (
                        <video src={previewUrl} className="max-h-[70vh] max-w-full rounded-lg" controls />
                    )}
                    {!loading && isAudio && hasRenderableUrl && (
                        <div className="w-full max-w-xl flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-[#252526] flex items-center justify-center border border-[#333]">
                                <Volume2 size={30} className="text-emerald-400" />
                            </div>
                            <audio src={previewUrl} controls className="w-full" />
                        </div>
                    )}
                    {!loading && !hasRenderableUrl && (
                        <div className="text-gray-400 text-sm">Preview URL unavailable</div>
                    )}
                    {!loading && hasRenderableUrl && !isImage && !isVideo && !isAudio && (
                        <div className="w-full max-w-xl rounded-xl border border-[#333] bg-[#111] p-6">
                            <div className="flex items-center gap-3 text-gray-200">
                                {asset.type === 'video' ? <Film size={20} /> : asset.type === 'image' ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                                <span className="font-medium">{asset.name}</span>
                            </div>
                            <div className="mt-3 text-xs text-gray-400 break-all">{previewUrl}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AssetsPage: React.FC = () => {
    const { searchQuery, setSearchQuery, importAssets, deleteAsset } = useAssetStore();
    const { t } = useTranslation();
    const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

    const handlePreview = (asset: Asset) => {
        setPreviewAsset(asset);
    };

    const handleDelete = async (asset: Asset) => {
        const confirmed = await platform.confirm(`Are you sure you want to delete "${asset.name}"?`, 'Delete Asset', 'warning');
        if (confirmed) {
            await deleteAsset(asset);
        }
    };

    return (
        <div className="flex w-full h-full bg-[#1e1e1e] overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 bg-[#111]">
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-[#27272a] bg-[#1e1e1e] justify-between">
                    <div className="relative w-96">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder={t('common.actions.search') + "..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                         <button 
                             onClick={importAssets}
                             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                         >
                             <Upload size={14} /> Import
                         </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <AssetGrid onPreview={handlePreview} onDelete={handleDelete} />
                </div>
            </div>

            {/* Preview Modal */}
            {previewAsset && (
                <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
            )}
        </div>
    );
};

export default AssetsPage;
