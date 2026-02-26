import { Asset, AssetType } from '../entities/asset.entity'
import { Button } from '@sdkwork/react-commons'
import React, { useState, useEffect } from 'react';
import { X, Search, UploadCloud, CheckCircle2, LayoutGrid, FileText, Image as ImageIcon } from 'lucide-react';
import { AssetStoreProvider, useAssetStore } from '../store/assetStore';
import { AssetSidebar } from './AssetSidebar';
import { AssetGrid } from './AssetGrid';
import { useTranslation } from '@sdkwork/react-i18n';
import { platform, uploadHelper as _uploadHelper } from '@sdkwork/react-core'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface ChooseAssetModalContentProps {
    onClose: () => void;
    onConfirm: (assets: Asset[]) => void;
    accepts?: AssetType[];
    multiple?: boolean;
    title?: string;
    extractedImages?: string[]; // New: Images parsed from content
    initialTab?: 'library' | 'document';
}

const ChooseAssetModalContent: React.FC<ChooseAssetModalContentProps> = ({
    onClose, onConfirm, accepts: _accepts, multiple: _multiple, title, extractedImages = [], initialTab = 'library'
}) => {
    const { t } = useTranslation();
    const {
        selectedAsset, setSelectedAsset,
        importAssets, searchQuery, setSearchQuery,
        filterType: _filterType, setFilterType,
        deleteAsset
    } = useAssetStore();

    // Initialize tab based on props, defaulting to library unless document requested and images exist
    const [tab, setTab] = useState<'library' | 'document'>(
        (initialTab === 'document' && extractedImages.length > 0) ? 'document' : 'library'
    );
    const [docSelection, setDocSelection] = useState<string | null>(null);

    // Initial Filter Setup
    useEffect(() => {
        if (_accepts && _accepts.length > 0 && _accepts[0] as string !== 'unknown') {
            setFilterType(_accepts[0]);
        }
    }, [_accepts]);

    const handleConfirm = () => {
        if (tab === 'document' && docSelection) {
            // Create a transient Asset object for the selected document image
            const asset: Asset = {
                id: docSelection, // URL is the ID
                uuid: docSelection, // URL as UUID for transient
                name: 'Image from Content',
                type: 'image',
                path: docSelection,
                size: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                origin: 'ai',
                metadata: {}
            };
            onConfirm([asset]);
        } else if (selectedAsset) {
            onConfirm([selectedAsset]);
        }
        onClose();
    };

    const handleDelete = async (asset: Asset) => {
        if (await platform.confirm(`Are you sure you want to delete "${asset.name}"?`, 'Delete Asset', 'warning')) {
            await deleteAsset(asset);
        }
    };

    return (
        <div 
            className="w-[90vw] h-[85vh] max-w-[1600px] bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 1. Header */}
            <div className="flex-none h-16 bg-[#252526] border-b border-[#333] flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-white font-bold text-lg">{title || t('sidebar.assets')}</h3>
                    
                    {/* View Switcher if extracted images exist */}
                    {extractedImages.length > 0 && (
                        <div className="flex bg-[#111] p-1 rounded-lg border border-[#333]">
                            <button 
                                onClick={() => setTab('library')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${tab === 'library' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <LayoutGrid size={14} /> Asset Library
                            </button>
                            <button 
                                onClick={() => setTab('document')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${tab === 'document' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <FileText size={14} /> From Content ({extractedImages.length})
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {tab === 'library' && (
                        <>
                            <div className="relative w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text" 
                                    placeholder={t('common.actions.search')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#18181b] border border-[#333] rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <Button size="sm" onClick={importAssets} className="gap-2">
                                <UploadCloud size={14} /> Upload
                            </Button>
                        </>
                    )}
                    <div className="h-6 w-[1px] bg-[#333] mx-2" />
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-[#333] rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 2. Main Body */}
            <div className="flex flex-1 overflow-hidden">
                {tab === 'library' ? (
                    <>
                        {/* Reuse Sidebar */}
                        <div className="flex-none h-full">
                            <AssetSidebar />
                        </div>
                        
                        {/* Reuse Grid */}
                        <div className="flex-1 bg-[#111] overflow-y-auto p-0 relative">
                             <div className="absolute inset-0">
                                <AssetGrid 
                                    onPreview={(asset) => setSelectedAsset(asset)}
                                    onDelete={handleDelete}
                                />
                             </div>
                             {/* Overlay Selection Indicator since AssetGrid doesn't show "selected" state persistently for pickers usually */}
                             {selectedAsset && (
                                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#1e1e1e] border border-[#333] rounded-full px-4 py-2 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                                     <span className="text-xs text-gray-300">Selected: <span className="text-white font-medium">{selectedAsset.name}</span></span>
                                     <button onClick={() => setSelectedAsset(null)} className="hover:text-white"><X size={14} /></button>
                                 </div>
                             )}
                        </div>
                    </>
                ) : (
                    /* Document Images Tab */
                    <div className="flex-1 bg-[#111] p-8 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {extractedImages.map((src, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setDocSelection(src)}
                                    className={`
                                        group relative aspect-video bg-[#1e1e1e] border-2 rounded-xl cursor-pointer overflow-hidden transition-all
                                        ${docSelection === src ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#333] hover:border-gray-500'}
                                    `}
                                >
                                    <img src={src} className="w-full h-full object-cover" />
                                    {docSelection === src && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Footer */}
            <div className="flex-none h-20 bg-[#252526] border-t border-[#333] flex items-center justify-end px-8 gap-4 z-20">
                <Button variant="secondary" onClick={onClose} size="lg">Cancel</Button>
                <Button 
                    onClick={handleConfirm} 
                    disabled={tab === 'library' ? !selectedAsset : !docSelection}
                    size="lg"
                    className="px-8 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                >
                    Confirm Selection
                </Button>
            </div>
        </div>
    );
};

export interface ChooseAssetModalProps extends ChooseAssetModalContentProps {
    isOpen: boolean;
}

export const ChooseAssetModal: React.FC<ChooseAssetModalProps> = (props) => {
    if (!props.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Wrap in Provider to give it a clean, independent state context */}
            <AssetStoreProvider>
                <ChooseAssetModalContent {...props} />
            </AssetStoreProvider>
        </div>
    );
};