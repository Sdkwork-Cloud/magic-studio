
import React, { useState } from 'react';
import { ChooseAssetModal } from './ChooseAssetModal';
import { uploadHelper } from '@sdkwork/react-core';
import { 
    Plus, Image as ImageIcon, FileAudio, FileVideo, 
    File, RotateCcw, Trash2,
    LayoutGrid, FileText, Sparkles, Upload, Loader2
} from 'lucide-react';
import { useAssetUrl } from '../hooks/useAssetUrl';
import {
    assetBusinessFacade,
    detectAssetTypeByFilename,
    mapUnifiedAssetToAsset,
    readWorkspaceScope,
    resolveAcceptExtensionsByTypes,
    resolveDomainAssetTypes,
    resolveAssetUrlByAssetIdFirst,
    toContentKey
} from '../asset-center';
import type { Asset, AssetType } from '../entities/asset.entity';
import { generateUUID } from '@sdkwork/react-commons';
import type { AssetBusinessDomain } from '@sdkwork/react-types';

interface AIGeneratorProps {
    contextText?: string;
    onClose: () => void;
    onSuccess: (result: string | string[]) => void;
}

interface ChooseAssetProps {
    value: Asset | string | null;
    onChange: (value: Asset | null) => void;
    accepts?: AssetType[];
    label?: string;
    aspectRatio?: string;
    className?: string;
    readOnly?: boolean;
    extractedImages?: string[];
    contextText?: string;
    imageFit?: 'cover' | 'contain' | 'fill';
    aiGenerator?: React.ComponentType<AIGeneratorProps>;
    domain?: AssetBusinessDomain;
}

export const ChooseAsset: React.FC<ChooseAssetProps> = ({ 
    value, onChange, accepts, label = "Select Asset", aspectRatio = "aspect-video", 
    className = "", readOnly = false, extractedImages, contextText = "", imageFit = "contain",
    aiGenerator: AIGenerator, domain = 'asset-center'
}) => {
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [initialTab, setInitialTab] = useState<'library' | 'document'>('library');
    const [isReplaceMenuOpen, setIsReplaceMenuOpen] = useState(false);

    const assetPath = typeof value === 'string' ? value : value?.path || value?.id;
    const assetType = typeof value === 'object' && value ? value.type : 'unknown';
    const assetName = typeof value === 'object' && value ? value.name : (typeof value === 'string' ? value.split('/').pop() : 'Unknown');
    const imageFitClass = imageFit === 'cover' ? 'object-cover' : imageFit === 'fill' ? 'object-fill' : 'object-contain';

    const { url: displayUrl, loading } = useAssetUrl(
        typeof value === 'object' && value ? value : assetPath,
        { resolver: resolveAssetUrlByAssetIdFirst }
    );

    const handleConfirm = (assets: Asset[]) => {
        if (assets.length > 0) {
            onChange(assets[0]);
            setIsReplaceMenuOpen(false);
        }
    };
    
    const handleAIConfirm = (imageUrl: string | string[]) => {
        const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
        const asset: Asset = {
            id: url, 
            uuid: generateUUID(),
            name: 'AI Generated Image',
            type: 'image',
            path: url,
            size: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            origin: 'ai',
            metadata: {}
        };
        onChange(asset);
        setIsReplaceMenuOpen(false);
    };

    const handleLocalUpload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsReplaceMenuOpen(false);
        
        try {
            const effectiveCandidates = accepts && accepts.length > 0
                ? accepts
                : resolveDomainAssetTypes(domain);
            const acceptExtensions = resolveAcceptExtensionsByTypes(effectiveCandidates);
            const acceptStr = acceptExtensions.length > 0 ? acceptExtensions.join(',') : '*';

            const files = await uploadHelper.pickFiles(false, acceptStr);
            if (files.length > 0) {
                const file = files[0];
                const detectedType = detectAssetTypeByFilename(file.name, {
                    candidates: effectiveCandidates,
                    fallback: effectiveCandidates.includes('file') ? 'file' : effectiveCandidates[0] || 'file'
                });
                const scope = readWorkspaceScope();
                const sourcePath = typeof file.path === 'string' && file.path.trim().length > 0
                    ? file.path
                    : undefined;

                const imported = await assetBusinessFacade.importByDomain(domain, {
                    scope,
                    type: toContentKey(detectedType),
                    name: file.name,
                    data: sourcePath ? undefined : file.data,
                    sourcePath,
                    metadata: {
                        origin: 'upload',
                        source: 'choose-asset-upload'
                    }
                });
                const mapped = mapUnifiedAssetToAsset(imported.asset);
                if (mapped) {
                    onChange(mapped);
                } else {
                    onChange({
                        id: imported.asset.assetId,
                        uuid: imported.asset.uuid,
                        name: imported.asset.title,
                        type: detectedType,
                        path: imported.primaryLocator.uri,
                        size: 0,
                        createdAt: imported.asset.createdAt,
                        updatedAt: imported.asset.updatedAt,
                        origin: 'upload',
                        metadata: {}
                    });
                }
            }
        } catch (err) {
            console.error("Local upload failed", err);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setIsReplaceMenuOpen(false);
    };

    const openLibrary = (tab: 'library' | 'document') => {
        if (readOnly) return;
        setInitialTab(tab);
        setIsLibraryModalOpen(true);
        setIsReplaceMenuOpen(false);
    };

    const renderPreview = () => {
        if (!assetPath) return null;
        
        if (loading && !displayUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-[10px]">Loading Asset...</span>
                </div>
            );
        }

        const finalSrc = displayUrl || assetPath;

        if (assetType === 'image' || assetPath.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || assetPath.startsWith('data:image') || assetPath.startsWith('assets://')) {
            return (
                <img 
                    src={finalSrc} 
                    alt="Preview" 
                    className={`w-full h-full ${imageFitClass}`} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            );
        }

        let Icon = File;
        if (assetType === 'video' || assetPath.match(/\.(mp4|mov|webm)$/i)) Icon = FileVideo;
        else if (assetType === 'audio' || assetPath.match(/\.(mp3|wav)$/i)) Icon = FileAudio;
        
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#18181b]">
                <Icon size={32} className="mb-2" />
                <span className="text-xs font-medium truncate max-w-[90%] px-2">{assetName}</span>
            </div>
        );
    };

    const renderSourceMenu = () => (
        <div className="bg-[#252526] border border-[#333] rounded-lg shadow-xl p-1 flex flex-col gap-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-150 select-none" onClick={(e) => e.stopPropagation()}>
             {extractedImages && extractedImages.length > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); openLibrary('document'); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-[#094771] hover:text-white rounded-md transition-colors text-left"
                >
                    <FileText size={14} className="text-blue-400" />
                    <span>Select from document</span>
                </button>
             )}
             <button
                onClick={(e) => { e.stopPropagation(); openLibrary('library'); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-[#094771] hover:text-white rounded-md transition-colors text-left"
             >
                 <LayoutGrid size={14} className="text-orange-400" />
                 <span>Select from library</span>
             </button>
             <button
                onClick={handleLocalUpload}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-[#094771] hover:text-white rounded-md transition-colors text-left"
             >
                 <Upload size={14} className="text-green-400" />
                 <span>Upload local file</span>
             </button>
             {AIGenerator && (
                 <button
                    onClick={(e) => { e.stopPropagation(); setIsAIModalOpen(true); setIsReplaceMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-[#094771] hover:text-white rounded-md transition-colors text-left"
                 >
                     <Sparkles size={14} className="text-purple-400" />
                     <span>AI generate</span>
                 </button>
             )}
        </div>
    );

    return (
        <>
            <div 
                className={`
                    relative group rounded-xl border-2 border-dashed transition-all overflow-hidden
                    ${assetPath 
                        ? 'border-transparent bg-[#111]' 
                        : 'border-[#333] bg-[#1e1e1e] hover:border-gray-500'
                    }
                    ${aspectRatio}
                    ${className}
                `}
                onMouseLeave={() => setIsReplaceMenuOpen(false)}
            >
                {assetPath ? (
                    <>
                        {renderPreview()}
                        
                        {!readOnly && (
                            <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-3 z-20 ${isReplaceMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {isReplaceMenuOpen ? (
                                    renderSourceMenu()
                                ) : (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsReplaceMenuOpen(true); }}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                                            title="Replace"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            onClick={handleClear}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 hover:text-white backdrop-blur-sm transition-colors border border-red-500/30"
                                            title="Remove"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 group-hover:opacity-10 transition-opacity">
                            {accepts?.includes('image') ? <ImageIcon size={24} className="mb-2 opacity-50" /> : <Plus size={24} className="mb-2 opacity-50" />}
                            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                        </div>

                        {!readOnly && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/40 backdrop-blur-[1px]">
                                {renderSourceMenu()}
                            </div>
                        )}
                    </>
                )}
            </div>

            <ChooseAssetModal 
                isOpen={isLibraryModalOpen}
                onClose={() => setIsLibraryModalOpen(false)}
                onConfirm={handleConfirm}
                accepts={accepts}
                title={label}
                extractedImages={extractedImages}
                initialTab={initialTab}
                domain={domain}
            />

            {isAIModalOpen && AIGenerator && (
                <AIGenerator 
                    contextText={contextText}
                    onClose={() => setIsAIModalOpen(false)}
                    onSuccess={handleAIConfirm}
                />
            )}
        </>
    );
};

