
import { Asset } from '../entities/asset.entity'
import { AssetGrid } from '../components/AssetGrid'
import React, { useState } from 'react';
import { useAssetStore } from '../store/assetStore';
import { Search, Upload } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { platform } from '@sdkwork/react-core';

// Stub FilePreviewModal - to be replaced with actual sdkwork-react-drive import
const FilePreviewModal: React.FC<{ item: any; onClose: () => void }> = ({ item, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={onClose}>
            <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-[#333] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{item?.name || 'Preview'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
                <div className="p-8 flex items-center justify-center min-h-[400px]">
                    <p className="text-gray-400">Preview not implemented</p>
                </div>
            </div>
        </div>
    );
};

const AssetsPage: React.FC = () => {
    const { searchQuery, setSearchQuery, importAssets, deleteAsset } = useAssetStore();
    const { t } = useTranslation();
    const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

    // Map Asset to DriveItem format for the generic viewer (code reuse from Drive module!)
    const handlePreview = (asset: Asset) => {
        // Adapt Asset entity to DriveItem entity required by FilePreviewModal
        // This leverages the unified architecture by reusing the Drive Viewer components
        const driveItem = {
            id: asset.path || asset.id,
            parentId: null,
            name: asset.name,
            type: 'file' as const,
            size: asset.size,
            updatedAt: asset.updatedAt,
            createdAt: asset.createdAt,
            mimeType: undefined // Viewer will auto-detect from extension
        };
        // @ts-ignore - Close enough for preview purposes
        setPreviewAsset(driveItem);
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

            {/* Preview Modal Reuse */}
            {previewAsset && (
                // @ts-ignore
                <FilePreviewModal item={previewAsset} onClose={() => setPreviewAsset(null)} />
            )}
        </div>
    );
};

export default AssetsPage;
